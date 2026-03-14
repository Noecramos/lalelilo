-- ============================================================================
-- Lalelilo Security Fix: Remaining Warnings (Functions + Permissive Policies)
-- Date: 2026-02-25
-- ============================================================================
--
-- Fixes 42 Supabase Security Advisor WARNINGS:
--
--   A) 3x function_search_path_mutable — Functions without search_path set
--   B) 39x rls_policy_always_true — Overly permissive allow_all policies
--
-- ARCHITECTURE REMINDER:
--   All access goes through supabaseAdmin (service_role key) which bypasses
--   RLS entirely. These policies only restrict direct anon key / PostgREST.
-- ============================================================================


-- ============================================================================
-- PART A: Fix function search_path (3 functions)
-- ============================================================================
-- Without SET search_path, a malicious user could manipulate the search_path
-- to hijack function calls. Setting it to 'public' makes the function safe.

-- A1: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- A2: assign_ticket_number
CREATE OR REPLACE FUNCTION public.assign_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := nextval('tickets_number_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- A3: cleanup_expired_tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_tokens
    WHERE expires_at < NOW() OR used = true;
END;
$$ LANGUAGE plpgsql
SET search_path = public;


-- ============================================================================
-- PART B: Replace overly permissive "allow_all" policies
-- ============================================================================
-- These policies use USING(true) + WITH CHECK(true) for ALL roles,
-- meaning ANY role (including anon) has full read/write access.
-- Replace with service_role-only policies.
--
-- Tables are split into 2 groups:
--   GROUP 1: Public read (anon SELECT) + service_role ALL
--            → shops, categories, products (storefront browsing)
--   GROUP 2: Service_role only (no anon access)
--            → everything else (sensitive/internal data)
-- ============================================================================


-- --------------------------------------------------------------------------
-- GROUP 1: PUBLIC READ tables (storefront needs to browse these)
-- Drop the permissive "Public Access" / "allow_all" and replace with
-- scoped policies: anon SELECT + service_role ALL
-- --------------------------------------------------------------------------

-- B1: shops — "Public Access" → anon SELECT (active only) + service_role ALL
DROP POLICY IF EXISTS "Public Access" ON public.shops;
DROP POLICY IF EXISTS "allow_all_shops" ON public.shops;
DROP POLICY IF EXISTS "shops_anon_select" ON public.shops;
DROP POLICY IF EXISTS "shops_service_all" ON public.shops;

CREATE POLICY "shops_anon_select" ON public.shops
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "shops_service_all" ON public.shops
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- B2: categories — "Public Access" → anon SELECT (active only) + service_role ALL
DROP POLICY IF EXISTS "Public Access" ON public.categories;
DROP POLICY IF EXISTS "allow_all_categories" ON public.categories;
DROP POLICY IF EXISTS "categories_anon_select" ON public.categories;
DROP POLICY IF EXISTS "categories_service_all" ON public.categories;

CREATE POLICY "categories_anon_select" ON public.categories
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "categories_service_all" ON public.categories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- B3: products — "Public Access" → anon SELECT (active only) + service_role ALL
DROP POLICY IF EXISTS "Public Access" ON public.products;
DROP POLICY IF EXISTS "allow_all_products" ON public.products;
DROP POLICY IF EXISTS "products_anon_select" ON public.products;
DROP POLICY IF EXISTS "products_service_all" ON public.products;

CREATE POLICY "products_anon_select" ON public.products
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "products_service_all" ON public.products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- --------------------------------------------------------------------------
-- GROUP 2: SERVICE_ROLE ONLY tables (no public access)
-- Drop any permissive policy, replace with service_role-only
-- --------------------------------------------------------------------------

DO $$
DECLARE
  rec RECORD;
BEGIN
  -- Table name → old policy name to drop
  FOR rec IN
    SELECT * FROM (VALUES
      ('activity_log',              'allow_all_activity_log'),
      ('attachments',               'allow_all_attachments'),
      ('badges',                    'allow_all_badges'),
      ('campaign_acknowledgements', 'allow_all_campaign_acknowledgements'),
      ('campaign_files',            'allow_all_campaign_files'),
      ('cart_items',                'allow_all_cart_items'),
      ('carts',                     'allow_all_carts'),
      ('channels',                  'allow_all_channels'),
      ('checklist_responses',       'allow_all_checklist_responses'),
      ('checklist_submissions',     'allow_all_checklist_submissions'),
      ('checklist_template_items',  'allow_all_checklist_template_items'),
      ('checklist_templates',       'allow_all_checklist_templates'),
      ('contacts',                  'allow_all_contacts'),
      ('conversations',             'allow_all_conversations'),
      ('crm_events',                'allow_all_crm_events'),
      ('dc_inventory',              'allow_all_dc_inventory'),
      ('distribution_centers',      'allow_all_distribution_centers'),
      ('kudos',                     'allow_all_kudos'),
      ('manager_feedback',          'allow_all_manager_feedback'),
      ('marketing_campaigns',       'allow_all_marketing_campaigns'),
      ('messages',                  'allow_all_messages'),
      ('notifications',             'allow_all_notifications'),
      ('order_status_log',          'allow_all_order_status_log'),
      ('promo_codes',               'allow_all_promo_codes'),
      ('promo_usage',               'allow_all_promo_usage'),
      ('regions',                   'allow_all_regions'),
      ('replenishment_items',       'allow_all_replenishment_items'),
      ('replenishment_requests',    'allow_all_replenishment_requests'),
      ('replenishment_status_log',  'allow_all_replenishment_status_log'),
      ('system_settings',           'allow_all_system_settings'),
      ('ticket_comments',           'allow_all_ticket_comments'),
      ('tickets',                   'allow_all_tickets'),
      ('user_badges',               'allow_all_user_badges'),
      ('xp_ledger',                 'allow_all_xp_ledger')
    ) AS t(table_name, old_policy_name)
  LOOP
    -- Drop the overly permissive policy
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.old_policy_name, rec.table_name);
    -- Drop any previously created service_all policy (idempotent)
    EXECUTE format('DROP POLICY IF EXISTS "%s_service_all" ON public.%I', rec.table_name, rec.table_name);
    -- Create the properly scoped service_role-only policy
    EXECUTE format(
      'CREATE POLICY "%s_service_all" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      rec.table_name, rec.table_name
    );
  END LOOP;
END $$;


-- --------------------------------------------------------------------------
-- Special cases: tables with non-standard policy names
-- --------------------------------------------------------------------------

-- payments — "Allow all operations on payments"
DROP POLICY IF EXISTS "Allow all operations on payments" ON public.payments;
DROP POLICY IF EXISTS "payments_service_all" ON public.payments;
CREATE POLICY "payments_service_all" ON public.payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- users — "Enable all for everyone"
DROP POLICY IF EXISTS "Enable all for everyone" ON public.users;
DROP POLICY IF EXISTS "users_service_all" ON public.users;
CREATE POLICY "users_service_all" ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- --------------------------------------------------------------------------
-- Restore anon SELECT on specific tables that need public read access
-- (even though they're in GROUP 2, these serve public-facing features)
-- --------------------------------------------------------------------------

-- Promo codes — anon can verify promo code validity (read only)
DROP POLICY IF EXISTS "promo_codes_anon_select" ON public.promo_codes;
CREATE POLICY "promo_codes_anon_select" ON public.promo_codes
  FOR SELECT
  USING (is_active = true);

-- Badges — anon can see available badges for gamification display
DROP POLICY IF EXISTS "badges_anon_select" ON public.badges;
CREATE POLICY "badges_anon_select" ON public.badges
  FOR SELECT
  USING (is_active = true);


-- ============================================================================
-- VERIFICATION QUERIES (run separately after applying)
-- ============================================================================

-- Check for any remaining overly permissive policies:
-- SELECT tablename, policyname, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND roles = '{-}'
--   AND cmd = 'ALL'
--   AND qual = 'true'
-- ORDER BY tablename;

-- Check functions have search_path set:
-- SELECT n.nspname, p.proname, p.proconfig
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
--   AND p.proname IN ('update_updated_at_column', 'assign_ticket_number', 'cleanup_expired_tokens');
