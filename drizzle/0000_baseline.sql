-- ============================================================
-- source: 20251227000001_initial_schema.sql
-- ============================================================
-- SoukHub Initial Schema
-- Multi-channel marketplace management for shop owners

-- Note: Using gen_random_uuid() which is built-in to PostgreSQL 13+

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  business_name TEXT,
  phone TEXT,
  country TEXT DEFAULT 'AE',
  currency TEXT DEFAULT 'AED',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MARKETPLACE CONNECTIONS
-- ============================================
CREATE TYPE marketplace_type AS ENUM ('amazon', 'cartlow', 'revibe', 'noon', 'other');
CREATE TYPE connection_status AS ENUM ('pending', 'active', 'error', 'disconnected');

CREATE TABLE marketplace_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  marketplace marketplace_type NOT NULL,
  display_name TEXT NOT NULL,
  credentials JSONB, -- Encrypted API keys, tokens, etc.
  settings JSONB DEFAULT '{}',
  status connection_status DEFAULT 'pending',
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, marketplace)
);

-- ============================================
-- PRODUCTS (Unified Catalog)
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  description TEXT,
  base_price DECIMAL(10,2) CHECK (base_price >= 0),
  cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
  images JSONB DEFAULT '[]',
  attributes JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_user ON products(user_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);

-- ============================================
-- PRODUCT VARIANTS (SKU-level)
-- ============================================
CREATE TYPE product_condition AS ENUM ('new', 'excellent', 'very_good', 'good', 'fair', 'renewed');

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT, -- e.g., "iPhone 15 Pro Max - 256GB - Black - Excellent"
  color TEXT,
  storage TEXT,
  condition product_condition DEFAULT 'new',
  price DECIMAL(10,2) CHECK (price >= 0),
  cost DECIMAL(10,2) CHECK (cost >= 0),
  weight_grams INTEGER,
  dimensions JSONB, -- {length, width, height}
  barcode TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, sku)
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);

-- ============================================
-- MARKETPLACE LISTINGS (links products to marketplaces)
-- ============================================
CREATE TYPE listing_status AS ENUM ('draft', 'active', 'paused', 'out_of_stock', 'error');

CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES marketplace_connections(id) ON DELETE CASCADE,
  marketplace_sku TEXT, -- SKU in the marketplace
  marketplace_product_id TEXT, -- Product ID in the marketplace
  listing_url TEXT,
  price DECIMAL(10,2) CHECK (price >= 0),
  status listing_status DEFAULT 'draft',
  sync_status JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(variant_id, connection_id)
);

CREATE INDEX idx_listings_variant ON marketplace_listings(variant_id);
CREATE INDEX idx_listings_connection ON marketplace_listings(connection_id);

-- ============================================
-- INVENTORY
-- ============================================
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES marketplace_connections(id) ON DELETE SET NULL, -- NULL = total inventory
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  warehouse_location TEXT,
  reorder_point INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(variant_id, connection_id)
);

CREATE INDEX idx_inventory_variant ON inventory(variant_id);
CREATE INDEX idx_inventory_low_stock ON inventory(quantity) WHERE quantity <= 5;

-- ============================================
-- ORDERS
-- ============================================
CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'processing', 'ready_to_ship',
  'shipped', 'out_for_delivery', 'delivered',
  'cancelled', 'returned', 'refunded'
);

CREATE TYPE fulfillment_type AS ENUM ('fbs', 'fbc', 'fbm', 'easy_ship', 'self_ship');
CREATE TYPE payment_method AS ENUM ('card', 'cod', 'tabby', 'tamara', 'payjustnow', 'payflex', 'bank_transfer', 'other');

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES marketplace_connections(id) ON DELETE SET NULL,
  marketplace marketplace_type NOT NULL,
  marketplace_order_id TEXT NOT NULL,
  status order_status DEFAULT 'pending',
  fulfillment fulfillment_type,
  payment_method payment_method,

  -- Customer info
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,

  -- Shipping address
  shipping_address JSONB,
  shipping_city TEXT,
  shipping_country TEXT DEFAULT 'AE',

  -- Financials
  subtotal DECIMAL(10,2) DEFAULT 0 CHECK (subtotal >= 0),
  shipping_cost DECIMAL(10,2) DEFAULT 0 CHECK (shipping_cost >= 0),
  tax DECIMAL(10,2) DEFAULT 0 CHECK (tax >= 0),
  discount DECIMAL(10,2) DEFAULT 0 CHECK (discount >= 0),
  total DECIMAL(10,2) DEFAULT 0 CHECK (total >= 0),
  currency TEXT DEFAULT 'AED',

  -- Dates
  order_date TIMESTAMPTZ NOT NULL,
  ship_date TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,

  -- Tracking
  tracking_number TEXT,
  carrier TEXT,

  notes TEXT,
  raw_data JSONB, -- Original marketplace data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, marketplace, marketplace_order_id),
  CHECK (ship_date IS NULL OR ship_date >= order_date),
  CHECK (delivery_date IS NULL OR delivery_date >= order_date)
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_marketplace ON orders(marketplace);
CREATE INDEX idx_orders_date ON orders(order_date DESC);
CREATE INDEX idx_orders_connection ON orders(connection_id);

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  marketplace_sku TEXT,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  condition product_condition,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_variant ON order_items(variant_id);

-- ============================================
-- ACTIVITY LOG (for AI agent actions)
-- ============================================
CREATE TYPE activity_type AS ENUM (
  'order_created', 'order_updated', 'order_shipped', 'order_delivered',
  'inventory_updated', 'listing_created', 'listing_updated',
  'price_changed', 'sync_completed', 'sync_failed',
  'ai_suggestion', 'ai_action'
);

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_unread ON activity_log(user_id) WHERE is_read = FALSE;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Marketplace Connections: Users can only access their own connections
CREATE POLICY "Users can manage own connections" ON marketplace_connections
  FOR ALL USING (auth.uid() = user_id);

-- Products: Users can only access their own products
CREATE POLICY "Users can manage own products" ON products
  FOR ALL USING (auth.uid() = user_id);

-- Product Variants: Users can access variants of their products
CREATE POLICY "Users can manage own variants" ON product_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Marketplace Listings: Users can access listings of their variants
CREATE POLICY "Users can manage own listings" ON marketplace_listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id = marketplace_listings.variant_id
      AND p.user_id = auth.uid()
    )
  );

-- Inventory: Users can access inventory of their variants
CREATE POLICY "Users can manage own inventory" ON inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id = inventory.variant_id
      AND p.user_id = auth.uid()
    )
  );

-- Orders: Users can only access their own orders
CREATE POLICY "Users can manage own orders" ON orders
  FOR ALL USING (auth.uid() = user_id);

-- Order Items: Users can access items of their orders
CREATE POLICY "Users can manage own order items" ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Activity Log: Users can only view their own activity
CREATE POLICY "Users can view own activity" ON activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own activity" ON activity_log
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON marketplace_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Calculate order total
CREATE OR REPLACE FUNCTION calculate_order_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total = COALESCE(NEW.subtotal, 0) + COALESCE(NEW.shipping_cost, 0) + COALESCE(NEW.tax, 0) - COALESCE(NEW.discount, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_order_total_trigger
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION calculate_order_total();

-- Log activity helper function
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_type activity_type,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO activity_log (user_id, activity_type, title, description, metadata)
  VALUES (p_user_id, p_type, p_title, p_description, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- source: 20251227000002_fix_trigger.sql
-- ============================================================
-- Fix the handle_new_user trigger to handle errors gracefully
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate with proper error handling and ON CONFLICT
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name);
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- source: 20251227000003_workflow_suppliers_team.sql
-- ============================================================
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

-- ============================================================
-- source: 20260824000001_multi_tenant_marketplace.sql
-- ============================================================
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

-- ============================================================
-- source: 20260824000002_search_listings.sql
-- ============================================================
-- ============================================================
-- SEARCH V1 (TODO-044, ADR 0013)
-- Postgres-native product search: FTS (english + simple for Arabic)
-- + pg_trgm typo tolerance + attribute filters, one SQL function.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Weighted, bilingual search vector kept fresh by trigger (a generated column
-- cannot use to_tsvector(regconfig, text) since it is only STABLE).
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION products_search_vector_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.brand, '') || ' ' || coalesce(NEW.category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.title_ar, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.description_ar, '')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_search_vector ON products;
CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE OF name, brand, category, description, title_ar, description_ar
  ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

-- Backfill existing rows (touch a search-relevant column to fire the trigger)
UPDATE products SET name = name WHERE search_vector IS NULL;

-- URL slug default for new listings (short_id already defaults in the tenancy migration)
CREATE OR REPLACE FUNCTION products_slug_default()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := coalesce(slugify(NEW.name), 'listing');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_slug_default ON products;
CREATE TRIGGER trg_products_slug_default
  BEFORE INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION products_slug_default();

CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON products USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products USING GIN ((coalesce(name, '') || ' ' || coalesce(brand, '')) gin_trgm_ops);

-- ------------------------------------------------------------
-- search_listings(): SECURITY INVOKER — RLS keeps drafts and
-- unpublished stores out for every caller including anon.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_listings(
  p_query TEXT DEFAULT '',
  p_brand TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_limit INTEGER DEFAULT 24,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  title_ar TEXT,
  brand TEXT,
  category TEXT,
  base_price NUMERIC,
  images JSONB,
  slug TEXT,
  short_id TEXT,
  org_id UUID,
  store_name TEXT,
  store_slug TEXT,
  rank REAL
)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  WITH q AS (
    SELECT
      NULLIF(trim(p_query), '') AS text_query,
      websearch_to_tsquery('english', coalesce(p_query, '')) AS ts_en,
      websearch_to_tsquery('simple', coalesce(p_query, '')) AS ts_simple
  )
  SELECT
    p.id, p.name, p.title_ar, p.brand, p.category, p.base_price, p.images,
    p.slug, p.short_id, p.org_id,
    o.name AS store_name, o.slug AS store_slug,
    (
      CASE WHEN q.text_query IS NULL THEN 0
        ELSE greatest(
          ts_rank(p.search_vector, q.ts_en),
          ts_rank(p.search_vector, q.ts_simple),
          similarity(coalesce(p.name, '') || ' ' || coalesce(p.brand, ''), q.text_query)
        )
      END
      + least(0.1, 0.1 / (1 + extract(epoch FROM now() - p.created_at) / 604800))
    )::real AS rank
  FROM products p
  JOIN organizations o ON o.id = p.org_id
  CROSS JOIN q
  WHERE p.is_published
    AND o.is_published
    AND (p_brand IS NULL OR p.brand ILIKE p_brand)
    AND (p_category IS NULL OR p.category ILIKE p_category)
    AND (p_min_price IS NULL OR p.base_price >= p_min_price)
    AND (p_max_price IS NULL OR p.base_price <= p_max_price)
    AND (
      q.text_query IS NULL
      OR p.search_vector @@ q.ts_en
      OR p.search_vector @@ q.ts_simple
      OR (coalesce(p.name, '') || ' ' || coalesce(p.brand, '')) % q.text_query
    )
  ORDER BY rank DESC, p.created_at DESC
  LIMIT least(greatest(p_limit, 1), 60)
  OFFSET greatest(p_offset, 0);
$$;

GRANT EXECUTE ON FUNCTION search_listings TO anon, authenticated;

-- ============================================================
-- source: 20260824000003_security_hardening.sql
-- ============================================================
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

