-- ============================================================================
-- Lalelilo Security Fix: Proper RLS Policies
-- Fixes 8 Supabase Security Advisor errors
-- Date: 2026-02-18
-- ============================================================================
-- 
-- ARCHITECTURE CONTEXT:
-- All data access goes through Next.js API routes using supabaseAdmin (service_role key).
-- The service_role key always bypasses RLS, so these policies only affect
-- direct access via the anon key (e.g., from the browser/client-side).
--
-- POLICY STRATEGY:
-- 1. PUBLIC tables (products, shops, categories, clients) → anon can READ only
-- 2. SENSITIVE tables (orders, users, analytics, etc.) → service_role only (no anon access)
-- 3. Remove all "allow_all" permissive policies from migration_v2 tables
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix the original 8 tables (currently have RLS enabled but NO policies)
-- These are the 8 errors from the Security Advisor
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. CLIENTS - Public read access (store branding info is public)
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "clients_anon_select" ON clients;
CREATE POLICY "clients_anon_select" ON clients
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "clients_service_all" ON clients;
CREATE POLICY "clients_service_all" ON clients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- --------------------------------------------------------------------------
-- 2. SHOPS - Public read access (store locations are public)
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "shops_anon_select" ON shops;
CREATE POLICY "shops_anon_select" ON shops
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "shops_service_all" ON shops;
CREATE POLICY "shops_service_all" ON shops
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- --------------------------------------------------------------------------
-- 3. CATEGORIES - Public read access (catalog browsing)
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "categories_anon_select" ON categories;
CREATE POLICY "categories_anon_select" ON categories
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "categories_service_all" ON categories;
CREATE POLICY "categories_service_all" ON categories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- --------------------------------------------------------------------------
-- 4. PRODUCTS - Public read access (catalog browsing)
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "products_anon_select" ON products;
CREATE POLICY "products_anon_select" ON products
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "products_service_all" ON products;
CREATE POLICY "products_service_all" ON products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- --------------------------------------------------------------------------
-- 5. INVENTORY - No public access (internal stock data)
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "inventory_service_all" ON inventory;
CREATE POLICY "inventory_service_all" ON inventory
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- --------------------------------------------------------------------------
-- 6. ORDERS - No public access (customer PII + financial data)
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "orders_service_all" ON orders;
CREATE POLICY "orders_service_all" ON orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- --------------------------------------------------------------------------
-- 7. USERS - No public access (credentials + internal roles)
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "users_service_all" ON users;
CREATE POLICY "users_service_all" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- --------------------------------------------------------------------------
-- 8. ANALYTICS_DAILY - No public access (business intelligence)
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "analytics_daily_service_all" ON analytics_daily;
CREATE POLICY "analytics_daily_service_all" ON analytics_daily
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STEP 2: Replace overly permissive "allow_all" policies on migration_v2 tables
-- These use USING(true) for ALL roles, meaning the anon key has full access.
-- Replace with service_role-only access.
-- ============================================================================

-- Helper: Drop all allow_all policies and create service_role-only policies
DO $$
DECLARE
  t TEXT;
BEGIN
  -- Tables that should be service_role only (sensitive data)
  FOR t IN SELECT unnest(ARRAY[
    'regions', 'activity_log', 'system_settings', 'attachments', 'notifications',
    'contacts', 'channels', 'conversations', 'messages',
    'distribution_centers', 'dc_inventory', 'replenishment_requests',
    'replenishment_items', 'replenishment_status_log',
    'xp_ledger', 'badges', 'user_badges', 'kudos', 'manager_feedback',
    'carts', 'cart_items', 'promo_codes', 'promo_usage', 'order_status_log',
    'checklist_templates', 'checklist_template_items',
    'checklist_submissions', 'checklist_responses',
    'tickets', 'ticket_comments', 'crm_events'
  ])
  LOOP
    -- Remove the permissive allow_all policy
    EXECUTE format('DROP POLICY IF EXISTS "allow_all_%s" ON %I', t, t);
    -- Add service_role-only policy
    EXECUTE format(
      'DROP POLICY IF EXISTS "%s_service_all" ON %I', t, t
    );
    EXECUTE format(
      'CREATE POLICY "%s_service_all" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      t, t
    );
  END LOOP;
END $$;

-- ============================================================================
-- STEP 3: Grant anon read access to specific migration_v2 tables that are
-- needed for the public storefront (if applicable)
-- ============================================================================

-- Promo codes - allow anon to verify promo codes (read only)
DROP POLICY IF EXISTS "promo_codes_anon_select" ON promo_codes;
CREATE POLICY "promo_codes_anon_select" ON promo_codes
  FOR SELECT
  USING (is_active = true);

-- Badges - allow anon to see available badges (gamification public view)
DROP POLICY IF EXISTS "badges_anon_select" ON badges;
CREATE POLICY "badges_anon_select" ON badges
  FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- VERIFICATION: List all tables with RLS status
-- Run this separately to verify:
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;
-- ============================================================================

-- ============================================================================
-- VERIFICATION: Check all policies
-- Run this separately to verify:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
-- ============================================================================
