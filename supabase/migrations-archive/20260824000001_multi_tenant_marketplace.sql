-- ============================================================
-- MULTI-TENANT MARKETPLACE FOUNDATION (TODO-040, ADR 0009)
--
-- 1. organizations become stores (slug, i18n fields, publishing, commission)
-- 2. ensure_org_for_user(): idempotent org provisioning + backfill
-- 3. org_id added to every table keyed by user_id; backfilled; defaulted by trigger
-- 4. RLS rewritten: membership-based via is_org_member(); public read for
--    published stores/listings (buyer surface)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Extend organizations into stores
-- ------------------------------------------------------------
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS name_ar TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS bio_ar TEXT,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS commission_bps INTEGER NOT NULL DEFAULT 600
    CHECK (commission_bps BETWEEN 0 AND 5000);

CREATE INDEX IF NOT EXISTS idx_organizations_published
  ON organizations(is_published) WHERE is_published;

-- Simple, deterministic slugifier (ASCII; Arabic names fall back to store id)
CREATE OR REPLACE FUNCTION slugify(input TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT NULLIF(
    trim(BOTH '-' FROM
      regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g')
    ), ''
  );
$$;

-- ------------------------------------------------------------
-- 2. Idempotent org provisioning (also used as the backfill)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION ensure_org_for_user(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_org UUID;
  v_profile profiles%ROWTYPE;
  v_slug TEXT;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'no profile for user %', p_user_id;
  END IF;

  IF v_profile.organization_id IS NOT NULL THEN
    RETURN v_profile.organization_id;
  END IF;

  -- An org this user already owns (created pre-backfill via team feature)?
  SELECT id INTO v_org FROM organizations WHERE owner_user_id = p_user_id LIMIT 1;

  IF v_org IS NULL THEN
    v_slug := coalesce(
      slugify(coalesce(v_profile.business_name, split_part(v_profile.email, '@', 1))),
      'store'
    );
    -- Guarantee uniqueness with a short suffix on collision
    IF EXISTS (SELECT 1 FROM organizations WHERE slug = v_slug) THEN
      v_slug := v_slug || '-' || substr(md5(p_user_id::text), 1, 6);
    END IF;

    INSERT INTO organizations (owner_user_id, name, slug)
    VALUES (
      p_user_id,
      coalesce(v_profile.business_name, v_profile.full_name, split_part(v_profile.email, '@', 1)),
      v_slug
    )
    RETURNING id INTO v_org;
  END IF;

  UPDATE profiles SET organization_id = v_org WHERE id = p_user_id;

  INSERT INTO team_members (user_id, organization_id, owner_user_id, role, name, email)
  VALUES (
    p_user_id, v_org, p_user_id, 'owner',
    coalesce(v_profile.full_name, v_profile.email), v_profile.email
  )
  ON CONFLICT DO NOTHING;

  RETURN v_org;
END;
$$;

-- Unique membership per (user, org) so provisioning stays idempotent
CREATE UNIQUE INDEX IF NOT EXISTS uq_team_members_user_org
  ON team_members(user_id, organization_id) WHERE user_id IS NOT NULL;

-- Backfill every existing user
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM profiles WHERE organization_id IS NULL LOOP
    PERFORM ensure_org_for_user(r.id);
  END LOOP;
END $$;

-- Give organizations a slug where the team feature created them without one
UPDATE organizations
SET slug = coalesce(slugify(name), 'store') || '-' || substr(md5(id::text), 1, 6)
WHERE slug IS NULL;

-- ------------------------------------------------------------
-- 3. Membership helper (SECURITY DEFINER bypasses RLS recursion)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_org_member(check_org UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.id = check_org AND o.owner_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.organization_id = check_org
      AND tm.user_id = auth.uid()
      AND tm.is_active
  );
$$;

-- ------------------------------------------------------------
-- 4. org_id on every user-keyed tenant table + backfill + insert default
--    (activity_log, whatsapp_connections and profiles stay user-scoped)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_org_id_default()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT organization_id INTO NEW.org_id
    FROM profiles
    WHERE id = coalesce(NEW.user_id, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t TEXT;
  tenant_tables TEXT[] := ARRAY[
    'marketplace_connections', 'products', 'orders',
    'workflow_config', 'suppliers', 'supplier_brand_rules', 'supplier_orders',
    'message_templates', 'whatsapp_messages',
    'customers', 'customer_match_rules', 'referral_codes',
    'personalized_messages', 'workflow_rules'
  ];
  pol RECORD;
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format(
      'ALTER TABLE %I ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id)', t);

    EXECUTE format(
      'UPDATE %I SET org_id = p.organization_id FROM profiles p
       WHERE %I.user_id = p.id AND %I.org_id IS NULL', t, t, t);

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_%s_org ON %I(org_id)', t, t);

    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_org_default ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_org_default BEFORE INSERT ON %I
       FOR EACH ROW EXECUTE FUNCTION set_org_id_default()', t, t);

    -- Replace user-keyed policies with membership policies (permissive-OR
    -- with the old ones would let an owner write into a foreign org)
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY %I ON %I', pol.policyname, t);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY org_members_all ON %I FOR ALL
       USING (is_org_member(org_id)) WITH CHECK (is_org_member(org_id))', t);
  END LOOP;
END $$;

-- Join-keyed tables: variants / listings / inventory / order_items follow parents
DROP POLICY IF EXISTS "Users can manage own variants" ON product_variants;
CREATE POLICY org_members_variants ON product_variants FOR ALL
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_variants.product_id AND is_org_member(p.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM products p WHERE p.id = product_variants.product_id AND is_org_member(p.org_id)));

DROP POLICY IF EXISTS "Users can manage own listings" ON marketplace_listings;
CREATE POLICY org_members_listings ON marketplace_listings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM product_variants pv JOIN products p ON p.id = pv.product_id
    WHERE pv.id = marketplace_listings.variant_id AND is_org_member(p.org_id)))
  WITH CHECK (EXISTS (
    SELECT 1 FROM product_variants pv JOIN products p ON p.id = pv.product_id
    WHERE pv.id = marketplace_listings.variant_id AND is_org_member(p.org_id)));

DROP POLICY IF EXISTS "Users can manage own inventory" ON inventory;
CREATE POLICY org_members_inventory ON inventory FOR ALL
  USING (EXISTS (
    SELECT 1 FROM product_variants pv JOIN products p ON p.id = pv.product_id
    WHERE pv.id = inventory.variant_id AND is_org_member(p.org_id)))
  WITH CHECK (EXISTS (
    SELECT 1 FROM product_variants pv JOIN products p ON p.id = pv.product_id
    WHERE pv.id = inventory.variant_id AND is_org_member(p.org_id)));

DROP POLICY IF EXISTS "Users can manage own order items" ON order_items;
CREATE POLICY org_members_order_items ON order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND is_org_member(o.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND is_org_member(o.org_id)));

-- Organizations themselves: members manage, owner semantics preserved
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizations'
  LOOP
    EXECUTE format('DROP POLICY %I ON organizations', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY org_members_manage ON organizations FOR ALL
  USING (is_org_member(id)) WITH CHECK (is_org_member(id));

-- ------------------------------------------------------------
-- 5. Marketplace publishing fields on products + public read policies
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS title_ar TEXT,
  ADD COLUMN IF NOT EXISTS description_ar TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS short_id TEXT UNIQUE
    DEFAULT lower(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));

UPDATE products SET slug = coalesce(slugify(name), 'listing') WHERE slug IS NULL;
UPDATE products SET short_id = lower(substr(encode(gen_random_bytes(6), 'hex'), 1, 8))
  WHERE short_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_published
  ON products(is_published, org_id) WHERE is_published;

-- Public storefront read access (anon + authenticated buyers)
CREATE POLICY public_read_published_orgs ON organizations FOR SELECT
  USING (is_published);

CREATE POLICY public_read_published_products ON products FOR SELECT
  USING (
    is_published
    AND EXISTS (SELECT 1 FROM organizations o WHERE o.id = products.org_id AND o.is_published)
  );

CREATE POLICY public_read_published_variants ON product_variants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM products p
    JOIN organizations o ON o.id = p.org_id
    WHERE p.id = product_variants.product_id AND p.is_published AND o.is_published
  ));
