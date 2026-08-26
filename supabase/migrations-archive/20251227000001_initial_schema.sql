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
