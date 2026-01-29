-- Lalelilo Database Schema
-- Multi-Location Retail Management Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CLIENTS TABLE
-- ============================================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#ffa944',
  secondary_color TEXT DEFAULT '#ff8f9b',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SHOPS TABLE (30 Lalelilo locations)
-- ============================================================================
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  cep TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  delivery_radius INTEGER DEFAULT 5000, -- in meters
  is_active BOOLEAN DEFAULT true,
  business_hours JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, slug)
);

-- ============================================================================
-- PRODUCTS TABLE (Shared catalog)
-- ============================================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),
  sku TEXT,
  barcode TEXT,
  image_url TEXT,
  images JSONB DEFAULT '[]',
  sizes JSONB DEFAULT '[]', -- ["P", "M", "G", "GG"]
  colors JSONB DEFAULT '[]', -- ["Azul", "Rosa", "Branco"]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, slug)
);

-- ============================================================================
-- INVENTORY TABLE (Per-shop stock)
-- ============================================================================
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, product_id)
);

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Customer Info
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  customer_cep TEXT,
  customer_address TEXT,
  customer_city TEXT,
  customer_state TEXT,
  customer_neighborhood TEXT,
  customer_complement TEXT,
  
  -- Order Details
  order_type TEXT NOT NULL CHECK (order_type IN ('delivery', 'pickup', 'dine-in')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
  
  -- Pricing
  subtotal DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Payment
  payment_method TEXT CHECK (payment_method IN ('pix', 'credit_card', 'debit_card', 'cash', 'mercado_pago')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id TEXT,
  
  -- Items
  items JSONB NOT NULL DEFAULT '[]',
  
  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- USERS TABLE (Super admin + shop managers)
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'shop_admin', 'staff')),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS_DAILY TABLE (Pre-aggregated metrics)
-- ============================================================================
CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Metrics
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  avg_ticket DECIMAL(10, 2) DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  
  -- Top products (JSON array of {product_id, name, quantity, revenue})
  top_products JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, date)
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Shops
CREATE INDEX idx_shops_client_id ON shops(client_id);
CREATE INDEX idx_shops_slug ON shops(slug);
CREATE INDEX idx_shops_is_active ON shops(is_active);

-- Products
CREATE INDEX idx_products_client_id ON products(client_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Inventory
CREATE INDEX idx_inventory_shop_id ON inventory(shop_id);
CREATE INDEX idx_inventory_product_id ON inventory(product_id);

-- Orders
CREATE INDEX idx_orders_shop_id ON orders(shop_id);
CREATE INDEX idx_orders_client_id ON orders(client_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_client_id ON users(client_id);
CREATE INDEX idx_users_shop_id ON users(shop_id);

-- Analytics
CREATE INDEX idx_analytics_shop_id ON analytics_daily(shop_id);
CREATE INDEX idx_analytics_client_id ON analytics_daily(client_id);
CREATE INDEX idx_analytics_date ON analytics_daily(date);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- Policies will be added based on authentication setup

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA (Initial Lalelilo client)
-- ============================================================================

-- Insert Lalelilo client
INSERT INTO clients (name, slug, domain, logo_url, primary_color, secondary_color)
VALUES (
  'Lalelilo',
  'lalelilo',
  'lalelilo.com.br',
  'https://images.tcdn.com.br/img/img_prod/1383811/1741706904_lalelilo_2.png',
  '#ffa944',
  '#ff8f9b'
);

-- Note: Shop data will be added separately once we have the 30 locations
