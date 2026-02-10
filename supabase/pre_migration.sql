-- ============================================================================
-- Lalelilo PRE-MIGRATION: Align existing DB with expected schema
-- Run this BEFORE migration_v2.sql in the Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension (if not already)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. Fix existing FK: products.client_id currently references shops(id)
--    We need it to reference the new clients table instead
-- ============================================================================

-- Drop the wrong FK constraint first
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_client_id_fkey;

-- ============================================================================
-- 2. Create CLIENTS table (missing from production)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#ffa944',
  secondary_color TEXT DEFAULT '#ff8f9b',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Use the EXISTING shop UUID as the client ID (so all existing data stays valid)
INSERT INTO clients (id, name, slug, domain, primary_color, secondary_color)
VALUES (
  'acb4b354-728f-479d-915a-c857d27da9ad',
  'Lalelilo',
  'lalelilo',
  'lalelilo.com.br',
  '#ffa944',
  '#ff8f9b'
)
ON CONFLICT (slug) DO NOTHING;

-- Now re-add the FK to point to clients instead of shops
ALTER TABLE products ADD CONSTRAINT fk_products_client
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- ============================================================================
-- 3. Add missing columns to SHOPS
-- ============================================================================
ALTER TABLE shops ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS delivery_radius INTEGER DEFAULT 5000;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Link existing shops to client
UPDATE shops SET client_id = 'acb4b354-728f-479d-915a-c857d27da9ad' WHERE client_id IS NULL;

-- ============================================================================
-- 4. Add missing columns to PRODUCTS
-- ============================================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- 5. Create INVENTORY table (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, product_id)
);

-- ============================================================================
-- 6. Create ORDERS table (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  customer_cep TEXT,
  customer_address TEXT,
  customer_city TEXT,
  customer_state TEXT,
  customer_neighborhood TEXT,
  customer_complement TEXT,
  order_type TEXT NOT NULL CHECK (order_type IN ('delivery', 'pickup', 'dine-in')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
  subtotal DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('pix', 'credit_card', 'debit_card', 'cash', 'mercado_pago')),
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  customer_notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- ============================================================================
-- 7. Align USERS table (current has: id, full_name, email, whatsapp, address, city)
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT 'not_set';
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'staff';
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Copy full_name to name if column exists
DO $$ BEGIN
  UPDATE users SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- Copy whatsapp to phone if column exists
DO $$ BEGIN
  UPDATE users SET phone = whatsapp WHERE phone IS NULL AND whatsapp IS NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- Set client_id for existing users
UPDATE users SET client_id = 'acb4b354-728f-479d-915a-c857d27da9ad' WHERE client_id IS NULL;

-- ============================================================================
-- 8. Create update_updated_at_column function (needed by triggers)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Done! Now run migration_v2.sql
-- ============================================================================
