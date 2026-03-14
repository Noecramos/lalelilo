-- FIX 1: shop_lead_metrics view - Security Invoker
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

-- FIX 2: orders - Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_service_all" ON public.orders;
CREATE POLICY "orders_service_all" ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);

-- FIX 3: inventory - Enable RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_service_all" ON public.inventory;
CREATE POLICY "inventory_service_all" ON public.inventory FOR ALL TO service_role USING (true) WITH CHECK (true);

-- FIX 4: clients - Enable RLS with anon read
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clients_anon_select" ON public.clients;
CREATE POLICY "clients_anon_select" ON public.clients FOR SELECT USING (true);
DROP POLICY IF EXISTS "clients_service_all" ON public.clients;
CREATE POLICY "clients_service_all" ON public.clients FOR ALL TO service_role USING (true) WITH CHECK (true);

-- FIX 5: internal_messages - Fix permissive policy
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_messages FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow service role full access" ON public.internal_messages;
DROP POLICY IF EXISTS "Shops can read their messages" ON public.internal_messages;
DROP POLICY IF EXISTS "internal_messages_service_all" ON public.internal_messages;
CREATE POLICY "internal_messages_service_all" ON public.internal_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- FIX 6: super_admin - Enable RLS
ALTER TABLE public.super_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "super_admin_service_all" ON public.super_admin;
CREATE POLICY "super_admin_service_all" ON public.super_admin FOR ALL TO service_role USING (true) WITH CHECK (true);

-- FIX 7: password_reset_tokens - Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "password_reset_tokens_service_all" ON public.password_reset_tokens;
CREATE POLICY "password_reset_tokens_service_all" ON public.password_reset_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);

-- FIX 8: novix_managers - Enable RLS
ALTER TABLE public.novix_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novix_managers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "novix_managers_service_all" ON public.novix_managers;
CREATE POLICY "novix_managers_service_all" ON public.novix_managers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- FIX 9: Functions - Set search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

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

CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_tokens
    WHERE expires_at < NOW() OR used = true;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- FIX 10: shops - Replace permissive policy
DROP POLICY IF EXISTS "Public Access" ON public.shops;
DROP POLICY IF EXISTS "allow_all_shops" ON public.shops;
DROP POLICY IF EXISTS "shops_anon_select" ON public.shops;
DROP POLICY IF EXISTS "shops_service_all" ON public.shops;
CREATE POLICY "shops_anon_select" ON public.shops FOR SELECT USING (is_active = true);
CREATE POLICY "shops_service_all" ON public.shops FOR ALL TO service_role USING (true) WITH CHECK (true);

-- FIX 11: categories - Replace permissive policy
DROP POLICY IF EXISTS "Public Access" ON public.categories;
DROP POLICY IF EXISTS "allow_all_categories" ON public.categories;
DROP POLICY IF EXISTS "categories_anon_select" ON public.categories;
DROP POLICY IF EXISTS "categories_service_all" ON public.categories;
CREATE POLICY "categories_anon_select" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "categories_service_all" ON public.categories FOR ALL TO service_role USING (true) WITH CHECK (true);

-- FIX 12: products - Replace permissive policy
DROP POLICY IF EXISTS "Public Access" ON public.products;
DROP POLICY IF EXISTS "allow_all_products" ON public.products;
DROP POLICY IF EXISTS "products_anon_select" ON public.products;
DROP POLICY IF EXISTS "products_service_all" ON public.products;
CREATE POLICY "products_anon_select" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "products_service_all" ON public.products FOR ALL TO service_role USING (true) WITH CHECK (true);

-- FIX 13: payments - Replace permissive policy
DROP POLICY IF EXISTS "Allow all operations on payments" ON public.payments;
DROP POLICY IF EXISTS "payments_service_all" ON public.payments;
CREATE POLICY "payments_service_all" ON public.payments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- FIX 14: users - Replace permissive policy
DROP POLICY IF EXISTS "Enable all for everyone" ON public.users;
DROP POLICY IF EXISTS "users_service_all" ON public.users;
CREATE POLICY "users_service_all" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);

-- FIX 15: Bulk fix all remaining allow_all policies
DO $$
DECLARE
  rec RECORD;
BEGIN
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
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.old_policy_name, rec.table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_service_all" ON public.%I', rec.table_name, rec.table_name);
    EXECUTE format(
      'CREATE POLICY "%s_service_all" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      rec.table_name, rec.table_name
    );
  END LOOP;
END $$;

-- FIX 16: Restore anon SELECT on promo_codes and badges
DROP POLICY IF EXISTS "promo_codes_anon_select" ON public.promo_codes;
CREATE POLICY "promo_codes_anon_select" ON public.promo_codes FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "badges_anon_select" ON public.badges;
CREATE POLICY "badges_anon_select" ON public.badges FOR SELECT USING (is_active = true);
