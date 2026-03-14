-- ============================================================================
-- Lalelilo Security Fix: Supabase Linter Errors
-- Date: 2026-02-25
-- ============================================================================
--
-- Fixes 9 Supabase Security Advisor errors:
--   1. security_definer_view  → shop_lead_metrics
--   2. rls_disabled_in_public → orders
--   3. rls_disabled_in_public → inventory
--   4. rls_disabled_in_public → clients
--   5. rls_disabled_in_public → internal_messages
--   6. rls_disabled_in_public → super_admin
--   7. rls_disabled_in_public → password_reset_tokens
--   8. rls_disabled_in_public → novix_managers
--   9. sensitive_columns_exposed → password_reset_tokens.token (fixed by RLS)
--
-- ARCHITECTURE:
--   All data access goes through Next.js API routes using supabaseAdmin
--   (service_role key), which ALWAYS bypasses RLS. These policies only
--   restrict direct access via the anon key from PostgREST / client-side.
-- ============================================================================


-- ============================================================================
-- FIX 1: shop_lead_metrics — Security Definer View → Security Invoker
-- ============================================================================
-- The view was created with SECURITY DEFINER by default, which means it
-- runs with the permissions of the view creator (postgres/superuser),
-- bypassing RLS of the querying user. Recreating with SECURITY INVOKER
-- ensures the view respects the caller's permissions.

DROP VIEW IF EXISTS public.shop_lead_metrics;
CREATE OR REPLACE VIEW public.shop_lead_metrics
WITH (security_invoker = true)
AS
SELECT
  s.id AS shop_id,
  s.name AS shop_name,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status IN ('lead', 'qualified_lead')) AS active_leads,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status IN ('customer', 'vip')) AS total_customers,
  ROUND(AVG(c.lifetime_value) FILTER (WHERE c.status IN ('customer', 'vip')), 2) AS avg_customer_value
FROM shops s
LEFT JOIN contacts c ON c.assigned_shop_id = s.id
GROUP BY s.id, s.name;

COMMENT ON VIEW public.shop_lead_metrics IS 'Lead conversion and customer metrics per shop';


-- ============================================================================
-- FIX 2: orders — Enable RLS + service_role only
-- ============================================================================
-- Contains customer PII, financial data. No public access needed.

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_service_all" ON public.orders;
CREATE POLICY "orders_service_all" ON public.orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- FIX 3: inventory — Enable RLS + service_role only
-- ============================================================================
-- Internal stock data. No public access needed.

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_service_all" ON public.inventory;
CREATE POLICY "inventory_service_all" ON public.inventory
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- FIX 4: clients — Enable RLS + anon read + service_role all
-- ============================================================================
-- Store branding info (name, logo, colors) is needed by the public storefront.
-- Allow anon to read, but only service_role can modify.

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_anon_select" ON public.clients;
CREATE POLICY "clients_anon_select" ON public.clients
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "clients_service_all" ON public.clients;
CREATE POLICY "clients_service_all" ON public.clients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- FIX 5: internal_messages — Fix overly permissive policy
-- ============================================================================
-- The existing "Allow service role full access" policy uses USING(true) for
-- ALL roles (not scoped to service_role), making it fully open to anon.
-- Replace with a properly scoped service_role-only policy.

ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_messages FORCE ROW LEVEL SECURITY;

-- Remove the overly permissive policy
DROP POLICY IF EXISTS "Allow service role full access" ON public.internal_messages;
-- Remove the auth-based policy (our app doesn't use Supabase Auth)
DROP POLICY IF EXISTS "Shops can read their messages" ON public.internal_messages;

CREATE POLICY "internal_messages_service_all" ON public.internal_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- FIX 6: super_admin — Enable RLS + service_role only
-- ============================================================================
-- Contains admin credentials. Strictly no public access.

ALTER TABLE public.super_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_service_all" ON public.super_admin;
CREATE POLICY "super_admin_service_all" ON public.super_admin
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- FIX 7 + 9: password_reset_tokens — Enable RLS + service_role only
-- ============================================================================
-- Contains sensitive token column. Enabling RLS and restricting to
-- service_role also fixes the "sensitive_columns_exposed" error.

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "password_reset_tokens_service_all" ON public.password_reset_tokens;
CREATE POLICY "password_reset_tokens_service_all" ON public.password_reset_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- FIX 8: novix_managers — Enable RLS + service_role only
-- ============================================================================
-- Contains manager credentials. Strictly no public access.

ALTER TABLE public.novix_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novix_managers FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "novix_managers_service_all" ON public.novix_managers;
CREATE POLICY "novix_managers_service_all" ON public.novix_managers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- VERIFICATION QUERIES (run separately after applying the migration)
-- ============================================================================

-- Check RLS status on all affected tables:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('orders', 'inventory', 'clients', 'internal_messages',
--                     'super_admin', 'password_reset_tokens', 'novix_managers')
-- ORDER BY tablename;

-- Check that the view is SECURITY INVOKER:
-- SELECT viewname, 
--        (pg_catalog.pg_get_viewdef(c.oid)::text) as definition
-- FROM pg_views v
-- JOIN pg_class c ON c.relname = v.viewname
-- WHERE schemaname = 'public' AND viewname = 'shop_lead_metrics';

-- Check all policies:
-- SELECT tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('orders', 'inventory', 'clients', 'internal_messages',
--                     'super_admin', 'password_reset_tokens', 'novix_managers')
-- ORDER BY tablename, policyname;
