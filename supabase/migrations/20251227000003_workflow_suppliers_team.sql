-- SoukHub Phase 2: Workflow, Suppliers, Teams, and CRM
-- Implements TODO-019, 020, 021, 022, 023, 026, 035, 037, 038, 039, 040

-- ============================================
-- ORGANIZATIONS (Multi-user business support)
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_owner ON organizations(owner_user_id);

-- Update profiles to link to organization
ALTER TABLE profiles ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- ============================================
-- TEAM MEMBERS (TODO-035)
-- ============================================
CREATE TYPE team_role AS ENUM ('owner', 'manager', 'packer', 'viewer');

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id), -- Auth user (NULL for PIN-only members)
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'viewer',
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  pin_code TEXT, -- 4-digit PIN for quick login (hashed)
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}', -- Custom permission overrides
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_team_members_org ON team_members(organization_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_owner ON team_members(owner_user_id);

-- Team sessions for shared devices
CREATE TABLE team_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  device_id TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_team_sessions_member ON team_sessions(team_member_id);

-- ============================================
-- WORKFLOW CONFIGURATION (TODO-019)
-- ============================================
CREATE TYPE fulfillment_model AS ENUM ('self_fulfilled', 'supplier_fulfilled', 'hybrid');

CREATE TABLE workflow_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  fulfillment_model fulfillment_model DEFAULT 'supplier_fulfilled',
  packing_location TEXT,
  delivery_schedule JSONB DEFAULT '{}', -- e.g., {"supplier_1": ["10:00", "16:00"]}
  auto_route_orders BOOLEAN DEFAULT true,
  auto_send_supplier_messages BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_workflow_config_user ON workflow_config(user_id);

-- ============================================
-- SUPPLIERS (TODO-019, 020, 040)
-- ============================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  secondary_whatsapp TEXT,
  email TEXT,
  secondary_email TEXT,
  preferred_contact TEXT CHECK (preferred_contact IN ('whatsapp', 'email', 'both')) DEFAULT 'whatsapp',
  contact_notes TEXT,
  delivery_times TEXT[], -- e.g., ['10:00 AM', '4:00 PM']
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  avg_response_minutes INTEGER,
  avg_fulfillment_hours INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suppliers_user ON suppliers(user_id);
CREATE INDEX idx_suppliers_active ON suppliers(user_id) WHERE is_active = true;

-- Brand to supplier assignment rules
CREATE TABLE supplier_brand_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  category TEXT, -- optional: further narrow by category
  priority INTEGER DEFAULT 1, -- for fallback suppliers (lower = higher priority)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, brand, category, priority)
);

CREATE INDEX idx_supplier_brand_rules_user ON supplier_brand_rules(user_id);
CREATE INDEX idx_supplier_brand_rules_supplier ON supplier_brand_rules(supplier_id);
CREATE INDEX idx_supplier_brand_rules_brand ON supplier_brand_rules(brand);

-- ============================================
-- EXTEND PRODUCTS TABLE (TODO-019)
-- ============================================
CREATE TYPE product_availability AS ENUM ('in_stock', 'available_on_demand', 'discontinued');

ALTER TABLE products
  ADD COLUMN availability_type product_availability DEFAULT 'available_on_demand',
  ADD COLUMN preferred_supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

CREATE INDEX idx_products_supplier ON products(preferred_supplier_id);

-- ============================================
-- SUPPLIER ORDERS (TODO-021)
-- ============================================
CREATE TYPE supplier_order_status AS ENUM (
  'pending_send',        -- Not yet sent to supplier
  'sent',               -- WhatsApp/Email sent, awaiting reply
  'confirmed',          -- Supplier said yes
  'unavailable',        -- Supplier said no
  'alternative_offered', -- Supplier offered different item
  'delivered_to_seller', -- Supplier delivered to seller
  'packed',             -- Seller packed
  'shipped'             -- Handed to courier/fulfilled
);

CREATE TABLE supplier_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status supplier_order_status DEFAULT 'pending_send',
  sent_at TIMESTAMPTZ,
  sent_via TEXT CHECK (sent_via IN ('whatsapp', 'email', 'both')),
  supplier_response TEXT,
  alternative_product TEXT,
  response_confidence DECIMAL(3,2), -- AI parser confidence 0-1
  requires_manual_review BOOLEAN DEFAULT false,
  expected_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  packed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_supplier_orders_user ON supplier_orders(user_id);
CREATE INDEX idx_supplier_orders_supplier ON supplier_orders(supplier_id);
CREATE INDEX idx_supplier_orders_order ON supplier_orders(order_id);
CREATE INDEX idx_supplier_orders_status ON supplier_orders(status);
CREATE INDEX idx_supplier_orders_pending ON supplier_orders(user_id, status)
  WHERE status IN ('pending_send', 'sent');

-- Extend orders table for supplier routing
ALTER TABLE orders
  ADD COLUMN supplier_order_id UUID REFERENCES supplier_orders(id),
  ADD COLUMN requires_supplier BOOLEAN DEFAULT true,
  ADD COLUMN routed_at TIMESTAMPTZ,
  ADD COLUMN unavailable_handled BOOLEAN DEFAULT false,
  ADD COLUMN alternative_offered_product_id UUID REFERENCES products(id),
  ADD COLUMN customer_response TEXT CHECK (customer_response IN ('pending', 'accepted_alternative', 'cancelled', 'no_response'));

-- ============================================
-- WHATSAPP INTEGRATION (TODO-022)
-- ============================================
CREATE TYPE whatsapp_status AS ENUM ('disconnected', 'connecting', 'connected', 'error');

CREATE TABLE whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  status whatsapp_status DEFAULT 'disconnected',
  phone_number TEXT,
  last_connected_at TIMESTAMPTZ,
  session_data TEXT, -- Encrypted session data
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_connections_user ON whatsapp_connections(user_id);

-- Message templates (TODO-023)
CREATE TYPE template_type AS ENUM ('supplier_order', 'supplier_batch', 'customer_update', 'thank_you', 'referral');

CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_type template_type NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_templates_user ON message_templates(user_id);
CREATE INDEX idx_message_templates_type ON message_templates(user_id, template_type);

-- WhatsApp messages log
CREATE TYPE message_direction AS ENUM ('outgoing', 'incoming');
CREATE TYPE message_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');

CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_order_id UUID REFERENCES supplier_orders(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  direction message_direction NOT NULL,
  phone_number TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status message_status DEFAULT 'pending',
  whatsapp_message_id TEXT, -- ID from WhatsApp
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  parsed_intent TEXT, -- AI parsed intent
  parsed_data JSONB, -- AI parsed structured data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_messages_user ON whatsapp_messages(user_id);
CREATE INDEX idx_whatsapp_messages_supplier ON whatsapp_messages(supplier_id);
CREATE INDEX idx_whatsapp_messages_order ON whatsapp_messages(supplier_order_id);
CREATE INDEX idx_whatsapp_messages_phone ON whatsapp_messages(phone_number);

-- ============================================
-- CUSTOMERS CRM (TODO-026)
-- ============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  -- Identity (may have multiple contact methods)
  email TEXT,
  phone TEXT,
  name TEXT,
  -- Computed/aggregated
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  first_order_date TIMESTAMPTZ,
  last_order_date TIMESTAMPTZ,
  -- CRM fields
  tags TEXT[],
  notes TEXT,
  is_vip BOOLEAN DEFAULT false,
  preferred_contact_method TEXT,
  -- Addresses
  addresses JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_user ON customers(user_id);
CREATE INDEX idx_customers_email ON customers(user_id, email);
CREATE INDEX idx_customers_phone ON customers(user_id, phone);
CREATE INDEX idx_customers_vip ON customers(user_id) WHERE is_vip = true;

-- Customer matching rules
CREATE TABLE customer_match_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_by TEXT CHECK (match_by IN ('email', 'phone', 'name_and_city')) NOT NULL,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link orders to customers
ALTER TABLE orders ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
CREATE INDEX idx_orders_customer ON orders(customer_id);

-- Referral codes (TODO-027)
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_amount DECIMAL(10,2) CHECK (discount_amount >= 0),
  max_uses INTEGER,
  times_used INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_customer ON referral_codes(customer_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);

-- Personalized messages for packing slips
CREATE TYPE personalized_message_type AS ENUM ('thank_you', 'birthday', 'referral', 'custom');

CREATE TABLE personalized_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  message_type personalized_message_type NOT NULL,
  content TEXT NOT NULL,
  printed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_personalized_messages_order ON personalized_messages(order_id);

-- ============================================
-- WORKFLOW RULES (TODO-037)
-- ============================================
CREATE TYPE workflow_rule_type AS ENUM ('packing', 'shipping', 'receiving', 'order_priority');

CREATE TABLE workflow_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rule_type workflow_rule_type NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, rule_type)
);

CREATE INDEX idx_workflow_rules_org ON workflow_rules(organization_id);

-- ============================================
-- INVENTORY TRACKING (TODO-039)
-- ============================================
CREATE TYPE inventory_location AS ENUM (
  'at_supplier',
  'ordered',
  'in_transit',
  'at_warehouse',
  'reserved',
  'packed',
  'shipped'
);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  from_location inventory_location,
  to_location inventory_location NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  supplier_order_id UUID REFERENCES supplier_orders(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_movements_user ON inventory_movements(user_id);
CREATE INDEX idx_inventory_movements_variant ON inventory_movements(variant_id);
CREATE INDEX idx_inventory_movements_date ON inventory_movements(created_at DESC);

-- Supplier product availability cache
CREATE TABLE supplier_product_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  is_available BOOLEAN,
  last_confirmed_at TIMESTAMPTZ,
  avg_fulfillment_hours INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_supplier_availability_supplier ON supplier_product_availability(supplier_id);
CREATE INDEX idx_supplier_availability_product ON supplier_product_availability(product_name, brand);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_brand_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_match_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_product_availability ENABLE ROW LEVEL SECURITY;

-- Organizations: Owner and team members can access
CREATE POLICY "Users can manage own organization" ON organizations
  FOR ALL USING (auth.uid() = owner_user_id);

-- Team members: Owner can manage, members can view own
CREATE POLICY "Owner can manage team" ON team_members
  FOR ALL USING (auth.uid() = owner_user_id);

CREATE POLICY "Members can view self" ON team_members
  FOR SELECT USING (auth.uid() = user_id);

-- Team sessions: Members can manage own sessions
CREATE POLICY "Members can manage own sessions" ON team_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.id = team_sessions.team_member_id
      AND (tm.user_id = auth.uid() OR tm.owner_user_id = auth.uid())
    )
  );

-- Workflow config: Users can manage own
CREATE POLICY "Users can manage own workflow" ON workflow_config
  FOR ALL USING (auth.uid() = user_id);

-- Suppliers: Users can manage own
CREATE POLICY "Users can manage own suppliers" ON suppliers
  FOR ALL USING (auth.uid() = user_id);

-- Supplier brand rules: Users can manage own
CREATE POLICY "Users can manage own brand rules" ON supplier_brand_rules
  FOR ALL USING (auth.uid() = user_id);

-- Supplier orders: Users can manage own
CREATE POLICY "Users can manage own supplier orders" ON supplier_orders
  FOR ALL USING (auth.uid() = user_id);

-- WhatsApp connections: Users can manage own
CREATE POLICY "Users can manage own whatsapp" ON whatsapp_connections
  FOR ALL USING (auth.uid() = user_id);

-- Message templates: Users can manage own
CREATE POLICY "Users can manage own templates" ON message_templates
  FOR ALL USING (auth.uid() = user_id);

-- WhatsApp messages: Users can manage own
CREATE POLICY "Users can manage own messages" ON whatsapp_messages
  FOR ALL USING (auth.uid() = user_id);

-- Customers: Users can manage own
CREATE POLICY "Users can manage own customers" ON customers
  FOR ALL USING (auth.uid() = user_id);

-- Customer match rules: Users can manage own
CREATE POLICY "Users can manage own match rules" ON customer_match_rules
  FOR ALL USING (auth.uid() = user_id);

-- Referral codes: Users can manage own
CREATE POLICY "Users can manage own referral codes" ON referral_codes
  FOR ALL USING (auth.uid() = user_id);

-- Personalized messages: Users can manage own
CREATE POLICY "Users can manage own personalized messages" ON personalized_messages
  FOR ALL USING (auth.uid() = user_id);

-- Workflow rules: Users can manage own
CREATE POLICY "Users can manage own workflow rules" ON workflow_rules
  FOR ALL USING (auth.uid() = user_id);

-- Inventory movements: Users can manage own
CREATE POLICY "Users can manage own inventory movements" ON inventory_movements
  FOR ALL USING (auth.uid() = user_id);

-- Supplier product availability: Users can manage own
CREATE POLICY "Users can manage supplier availability" ON supplier_product_availability
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamps
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_workflow_config_updated_at
  BEFORE UPDATE ON workflow_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_supplier_orders_updated_at
  BEFORE UPDATE ON supplier_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_whatsapp_connections_updated_at
  BEFORE UPDATE ON whatsapp_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_workflow_rules_updated_at
  BEFORE UPDATE ON workflow_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_supplier_availability_updated_at
  BEFORE UPDATE ON supplier_product_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Find or create customer from order
CREATE OR REPLACE FUNCTION find_or_create_customer(
  p_user_id UUID,
  p_email TEXT,
  p_phone TEXT,
  p_name TEXT,
  p_city TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Try to find by email first
  IF p_email IS NOT NULL THEN
    SELECT id INTO v_customer_id FROM customers
    WHERE user_id = p_user_id AND email = p_email
    LIMIT 1;
  END IF;

  -- Try phone if no email match
  IF v_customer_id IS NULL AND p_phone IS NOT NULL THEN
    SELECT id INTO v_customer_id FROM customers
    WHERE user_id = p_user_id AND phone = p_phone
    LIMIT 1;
  END IF;

  -- Create new customer if not found
  IF v_customer_id IS NULL THEN
    INSERT INTO customers (user_id, email, phone, name)
    VALUES (p_user_id, p_email, p_phone, p_name)
    RETURNING id INTO v_customer_id;
  END IF;

  RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update customer stats after order
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE customers SET
      total_orders = (
        SELECT COUNT(*) FROM orders
        WHERE customer_id = NEW.customer_id
      ),
      total_spent = (
        SELECT COALESCE(SUM(total), 0) FROM orders
        WHERE customer_id = NEW.customer_id
      ),
      first_order_date = COALESCE(
        first_order_date,
        (SELECT MIN(order_date) FROM orders WHERE customer_id = NEW.customer_id)
      ),
      last_order_date = (
        SELECT MAX(order_date) FROM orders WHERE customer_id = NEW.customer_id
      ),
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_stats_on_order
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- Route order to supplier
CREATE OR REPLACE FUNCTION route_order_to_supplier(p_order_id UUID)
RETURNS UUID AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_supplier_id UUID;
  v_supplier_order_id UUID;
BEGIN
  -- Get order details
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Get first order item to determine brand
  SELECT oi.*, p.brand, p.preferred_supplier_id
  INTO v_item
  FROM order_items oi
  LEFT JOIN product_variants pv ON pv.id = oi.variant_id
  LEFT JOIN products p ON p.id = pv.product_id
  WHERE oi.order_id = p_order_id
  LIMIT 1;

  -- Check for preferred supplier on product
  IF v_item.preferred_supplier_id IS NOT NULL THEN
    v_supplier_id := v_item.preferred_supplier_id;
  ELSE
    -- Look up supplier from brand rules
    SELECT supplier_id INTO v_supplier_id
    FROM supplier_brand_rules sbr
    JOIN suppliers s ON s.id = sbr.supplier_id
    WHERE sbr.user_id = v_order.user_id
      AND sbr.brand = v_item.brand
      AND s.is_active = true
    ORDER BY sbr.priority ASC
    LIMIT 1;
  END IF;

  -- Create supplier order if supplier found
  IF v_supplier_id IS NOT NULL THEN
    INSERT INTO supplier_orders (user_id, supplier_id, order_id, status)
    VALUES (v_order.user_id, v_supplier_id, p_order_id, 'pending_send')
    RETURNING id INTO v_supplier_order_id;

    -- Link to order
    UPDATE orders SET
      supplier_order_id = v_supplier_order_id,
      routed_at = NOW()
    WHERE id = p_order_id;
  END IF;

  RETURN v_supplier_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(p_length INTEGER DEFAULT 6)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate alphanumeric code
    v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR p_length));

    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;

    -- Return if unique
    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INSERT DEFAULT MESSAGE TEMPLATES
-- ============================================

-- Note: These will be created per-user when they first access the feature
-- This is just a reference of default templates

COMMENT ON TABLE message_templates IS 'Default supplier_order template:
🛒 *New Order*

*Product:* {product_name}
*Storage:* {storage}
*Color:* {color}
*Condition:* {condition}

*Order ID:* {order_id}
*Customer:* {customer_city}

Please confirm availability:
✅ Reply "YES" if available
❌ Reply "NO" if not available
🔄 Reply with alternative if different stock

Need by: {delivery_cutoff_time}
';

COMMENT ON TABLE personalized_messages IS 'Default thank_you template:
🌟 Thank You, {customer_name}!

This is your {order_count} order with us!
We truly appreciate your loyalty.

As a thank you, here is a special
discount for your next purchase:

Code: {referral_code} ({discount}% off)

- Your friends at {business_name}
';

-- ============================================
-- MATERIALIZED VIEWS FOR DASHBOARD (TODO-038)
-- ============================================

-- Order pipeline counts (refreshed every 30 seconds in app)
CREATE MATERIALIZED VIEW order_pipeline_counts AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE status = 'pending') as new_count,
  COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
  COUNT(*) FILTER (WHERE status = 'ready_to_ship') as ready_count,
  COUNT(*) FILTER (WHERE status = 'shipped' AND DATE(ship_date) = CURRENT_DATE) as shipped_today,
  COUNT(*) FILTER (WHERE status = 'delivered' AND DATE(delivery_date) = CURRENT_DATE) as delivered_today
FROM orders
GROUP BY user_id;

CREATE UNIQUE INDEX idx_order_pipeline_counts_user ON order_pipeline_counts(user_id);

-- Supplier order counts
CREATE MATERIALIZED VIEW supplier_order_counts AS
SELECT
  so.user_id,
  so.supplier_id,
  s.name as supplier_name,
  COUNT(*) FILTER (WHERE so.status = 'pending_send') as pending_send_count,
  COUNT(*) FILTER (WHERE so.status = 'sent') as awaiting_reply_count,
  COUNT(*) FILTER (WHERE so.status = 'confirmed') as confirmed_count,
  COUNT(*) FILTER (WHERE so.status = 'unavailable') as unavailable_count,
  AVG(EXTRACT(EPOCH FROM (so.updated_at - so.sent_at))/60)
    FILTER (WHERE so.status IN ('confirmed', 'unavailable')) as avg_response_minutes
FROM supplier_orders so
JOIN suppliers s ON s.id = so.supplier_id
WHERE so.created_at > NOW() - INTERVAL '7 days'
GROUP BY so.user_id, so.supplier_id, s.name;

CREATE UNIQUE INDEX idx_supplier_order_counts ON supplier_order_counts(user_id, supplier_id);

-- Inventory summary
CREATE MATERIALIZED VIEW inventory_summary AS
SELECT
  p.user_id,
  COUNT(DISTINCT p.id) as total_products,
  COALESCE(SUM(i.quantity), 0) as total_units,
  COALESCE(SUM(i.quantity - i.reserved), 0) as available_units,
  COALESCE(SUM(i.reserved), 0) as reserved_units,
  COUNT(*) FILTER (WHERE i.quantity > 0 AND i.quantity <= i.reorder_point) as low_stock_count,
  COUNT(*) FILTER (WHERE i.quantity = 0) as out_of_stock_count
FROM products p
LEFT JOIN product_variants pv ON pv.product_id = p.id
LEFT JOIN inventory i ON i.variant_id = pv.id
GROUP BY p.user_id;

CREATE UNIQUE INDEX idx_inventory_summary_user ON inventory_summary(user_id);

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY order_pipeline_counts;
  REFRESH MATERIALIZED VIEW CONCURRENTLY supplier_order_counts;
  REFRESH MATERIALIZED VIEW CONCURRENTLY inventory_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
