-- ============================================================
-- SECURITY HARDENING (adversarial-review findings on M1)
--
-- 1. Column-level privileges: RLS is row-level only, so the public-read
--    policies exposed EVERY column of published rows to anon — including
--    products.cost_price/attributes, product_variants.cost, and
--    organizations.owner_user_id/commission_bps/settings. Revoke anon's
--    table-wide SELECT and grant only the buyer-surface columns.
--    (Residual: authenticated buyers can still read full published rows via
--    the org policies' public counterpart — tracked as a follow-up to move
--    cost data out of these tables entirely.)
-- 2. ensure_org_for_user is SECURITY DEFINER — restrict EXECUTE to
--    service_role; the app provisions orgs server-side only.
-- ============================================================

-- ------------------------------------------------------------
-- 1a. products: anon sees listing columns only
-- ------------------------------------------------------------
REVOKE SELECT ON products FROM anon;
GRANT SELECT (
  id, org_id, name, title_ar, brand, category,
  description, description_ar, base_price, images,
  slug, short_id, is_published, created_at, updated_at, search_vector
) ON products TO anon;

-- ------------------------------------------------------------
-- 1b. product_variants: hide cost; expose sellable attributes
-- ------------------------------------------------------------
REVOKE SELECT ON product_variants FROM anon;
GRANT SELECT (
  id, product_id, sku, name, color, storage, condition, price, is_active, created_at
) ON product_variants TO anon;

-- ------------------------------------------------------------
-- 1c. organizations: hide owner, commission terms and settings
-- ------------------------------------------------------------
REVOKE SELECT ON organizations FROM anon;
GRANT SELECT (
  id, slug, name, name_ar, logo_url, bio, bio_ar, is_published, created_at
) ON organizations TO anon;

-- search_listings() is SECURITY INVOKER and only touches granted columns,
-- so it keeps working for anon. Recreate to be explicit about that contract.

-- ------------------------------------------------------------
-- 2. Org provisioning is a server-side operation only
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION ensure_org_for_user(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION ensure_org_for_user(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION ensure_org_for_user(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION ensure_org_for_user(UUID) TO service_role;
