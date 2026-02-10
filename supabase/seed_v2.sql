-- ============================================================================
-- Lalelilo V2 - Seed Data for Demo
-- Run AFTER migration_v2.sql
-- ============================================================================

-- Get the Lalelilo client ID
DO $$
DECLARE
  v_client_id UUID;
  v_region_sp UUID;
  v_region_rj UUID;
  v_dc_id UUID;
  v_shop1_id UUID;
  v_shop2_id UUID;
  v_shop3_id UUID;
  v_admin_id UUID;
  v_manager1_id UUID;
  v_manager2_id UUID;
  v_sales1_id UUID;
  v_auditor_id UUID;
  v_prod1_id UUID;
  v_prod2_id UUID;
  v_prod3_id UUID;
  v_prod4_id UUID;
  v_prod5_id UUID;
  v_prod6_id UUID;
  v_template_id UUID;
  v_contact1_id UUID;
  v_contact2_id UUID;
BEGIN

  -- Use the actual production client UUID (same as existing shop ID)
  v_client_id := 'acb4b354-728f-479d-915a-c857d27da9ad'::UUID;

  -- Verify client exists
  PERFORM id FROM clients WHERE id = v_client_id;
  IF NOT FOUND THEN
    INSERT INTO clients (id, name, slug, domain, primary_color, secondary_color)
    VALUES (v_client_id, 'Lalelilo', 'lalelilo', 'lalelilo.com.br', '#ffa944', '#ff8f9b');
  END IF;

  -- ======== REGIONS ========
  INSERT INTO regions (id, client_id, name, description)
  VALUES
    (uuid_generate_v4(), v_client_id, 'São Paulo', 'Lojas na região de SP')
  RETURNING id INTO v_region_sp;

  INSERT INTO regions (id, client_id, name, description)
  VALUES
    (uuid_generate_v4(), v_client_id, 'Rio de Janeiro', 'Lojas na região do RJ')
  RETURNING id INTO v_region_rj;

  -- ======== DISTRIBUTION CENTER ========
  INSERT INTO distribution_centers (id, client_id, name, address, city, state, is_active)
  VALUES (uuid_generate_v4(), v_client_id, 'CD Lalelilo Central', 'Rua Industrial 500', 'São Paulo', 'SP', true)
  RETURNING id INTO v_dc_id;

  -- ======== DEMO SHOPS ========
  INSERT INTO shops (id, client_id, name, slug, address, city, state, cep, whatsapp, region_id, is_active)
  VALUES (uuid_generate_v4(), v_client_id, 'Lalelilo Shopping Ibirapuera', 'ibirapuera', 'Av. Ibirapuera 3103', 'São Paulo', 'SP', '04029-200', '11999990001', v_region_sp, true)
  RETURNING id INTO v_shop1_id;

  INSERT INTO shops (id, client_id, name, slug, address, city, state, cep, whatsapp, region_id, is_active)
  VALUES (uuid_generate_v4(), v_client_id, 'Lalelilo Shopping Morumbi', 'morumbi', 'Av. Roque Petroni Jr. 1089', 'São Paulo', 'SP', '04707-900', '11999990002', v_region_sp, true)
  RETURNING id INTO v_shop2_id;

  INSERT INTO shops (id, client_id, name, slug, address, city, state, cep, whatsapp, region_id, is_active)
  VALUES (uuid_generate_v4(), v_client_id, 'Lalelilo Shopping Barra', 'barra', 'Av. das Américas 4666', 'Rio de Janeiro', 'RJ', '22640-102', '21999990003', v_region_rj, true)
  RETURNING id INTO v_shop3_id;

  -- ======== DEMO USERS ========
  INSERT INTO users (id, email, password_hash, role, client_id, name, full_name, phone, whatsapp, is_active)
  VALUES (uuid_generate_v4(), 'admin@lalelilo.com.br', 'demo_hash', 'super_admin', v_client_id, 'Ana Silva (Admin)', 'Ana Silva', '11999991111', '11999991111', true)
  RETURNING id INTO v_admin_id;

  INSERT INTO users (id, email, password_hash, role, client_id, shop_id, name, full_name, phone, whatsapp, is_active, hire_date)
  VALUES (uuid_generate_v4(), 'gerente.ibira@lalelilo.com.br', 'demo_hash', 'store_manager', v_client_id, v_shop1_id, 'Carlos Santos', 'Carlos Santos', '11999992222', '11999992222', true, '2024-03-15')
  RETURNING id INTO v_manager1_id;

  INSERT INTO users (id, email, password_hash, role, client_id, shop_id, name, full_name, phone, whatsapp, is_active, hire_date)
  VALUES (uuid_generate_v4(), 'gerente.morumbi@lalelilo.com.br', 'demo_hash', 'store_manager', v_client_id, v_shop2_id, 'Maria Oliveira', 'Maria Oliveira', '11999993333', '11999993333', true, '2024-06-01')
  RETURNING id INTO v_manager2_id;

  INSERT INTO users (id, email, password_hash, role, client_id, shop_id, name, full_name, phone, whatsapp, is_active, hire_date)
  VALUES (uuid_generate_v4(), 'vendedor1@lalelilo.com.br', 'demo_hash', 'sales_associate', v_client_id, v_shop1_id, 'Pedro Costa', 'Pedro Costa', '11999994444', '11999994444', true, '2025-01-10')
  RETURNING id INTO v_sales1_id;

  INSERT INTO users (id, email, password_hash, role, client_id, name, full_name, phone, whatsapp, is_active)
  VALUES (uuid_generate_v4(), 'auditor@lalelilo.com.br', 'demo_hash', 'auditor', v_client_id, 'Lucia Auditor', 'Lucia Auditor', '11999995555', '11999995555', true)
  RETURNING id INTO v_auditor_id;

  -- ======== PRODUCTS (Clothing) ========
  INSERT INTO products (id, client_id, name, slug, price, cost_price, product_type, product_tier, gender, sizes, is_active)
  VALUES
    (uuid_generate_v4(), v_client_id, 'Conjunto Essencial Masculino', 'conjunto-essencial-masc', 89.90, 35.00, 'conjunto', 'essencial', 'masc', '["1","2","3","4","6","8","10","12","14","16"]', true)
  RETURNING id INTO v_prod1_id;

  INSERT INTO products (id, client_id, name, slug, price, cost_price, product_type, product_tier, gender, sizes, is_active)
  VALUES
    (uuid_generate_v4(), v_client_id, 'Conjunto Essencial Feminino', 'conjunto-essencial-fem', 89.90, 35.00, 'conjunto', 'essencial', 'fem', '["1","2","3","4","6","8","10","12","14","16"]', true)
  RETURNING id INTO v_prod2_id;

  INSERT INTO products (id, client_id, name, slug, price, cost_price, product_type, product_tier, gender, sizes, is_active)
  VALUES
    (uuid_generate_v4(), v_client_id, 'Conjunto Premium Masculino', 'conjunto-premium-masc', 149.90, 55.00, 'conjunto', 'premium', 'masc', '["P","M","G","1","2","3","4","6","8","10","12","14","16"]', true)
  RETURNING id INTO v_prod3_id;

  INSERT INTO products (id, client_id, name, slug, price, cost_price, product_type, product_tier, gender, sizes, is_active)
  VALUES
    (uuid_generate_v4(), v_client_id, 'Conjunto SuperPremium Feminino', 'conjunto-superpremium-fem', 199.90, 75.00, 'conjunto', 'superpremium', 'fem', '["P","M","G","1","2","3","4","6","8","10"]', true)
  RETURNING id INTO v_prod4_id;

  INSERT INTO products (id, client_id, name, slug, price, cost_price, product_type, product_tier, gender, sizes, is_active)
  VALUES
    (uuid_generate_v4(), v_client_id, 'Vestido Casual', 'vestido-casual', 119.90, 45.00, 'vestido', 'casual', 'fem', '["1","2","3","4","6","8","10","12"]', true)
  RETURNING id INTO v_prod5_id;

  INSERT INTO products (id, client_id, name, slug, price, cost_price, product_type, product_tier, gender, sizes, is_active)
  VALUES
    (uuid_generate_v4(), v_client_id, 'Vestido Premium', 'vestido-premium', 169.90, 60.00, 'vestido', 'premium', 'fem', '["1","2","3","4","6","8","10","12","14"]', true)
  RETURNING id INTO v_prod6_id;

  -- ======== DC INVENTORY ========
  INSERT INTO dc_inventory (dc_id, product_id, size, quantity) VALUES
    (v_dc_id, v_prod1_id, '2', 50), (v_dc_id, v_prod1_id, '4', 60), (v_dc_id, v_prod1_id, '6', 45),
    (v_dc_id, v_prod2_id, '2', 55), (v_dc_id, v_prod2_id, '4', 50), (v_dc_id, v_prod2_id, '6', 40),
    (v_dc_id, v_prod3_id, 'P', 30), (v_dc_id, v_prod3_id, 'M', 40), (v_dc_id, v_prod3_id, 'G', 25),
    (v_dc_id, v_prod4_id, 'P', 20), (v_dc_id, v_prod4_id, 'M', 30),
    (v_dc_id, v_prod5_id, '4', 35), (v_dc_id, v_prod5_id, '6', 40),
    (v_dc_id, v_prod6_id, '4', 25), (v_dc_id, v_prod6_id, '6', 30);

  -- ======== STORE INVENTORY ========
  INSERT INTO inventory (shop_id, product_id, size, quantity) VALUES
    (v_shop1_id, v_prod1_id, '2', 5), (v_shop1_id, v_prod1_id, '4', 8),
    (v_shop1_id, v_prod2_id, '2', 6), (v_shop1_id, v_prod2_id, '4', 7),
    (v_shop1_id, v_prod3_id, 'M', 3), (v_shop1_id, v_prod5_id, '4', 4),
    (v_shop2_id, v_prod1_id, '4', 10), (v_shop2_id, v_prod2_id, '6', 5),
    (v_shop2_id, v_prod4_id, 'P', 3), (v_shop2_id, v_prod6_id, '6', 6);

  -- ======== BADGES ========
  INSERT INTO badges (client_id, name, description, icon_url, xp_threshold, category, is_active) VALUES
    (v_client_id, 'Primeiro Passo', 'Ganhou seus primeiros 10 XP', '🌟', 10, 'milestone', true),
    (v_client_id, 'Vendedor Bronze', 'Acumulou 100 XP em vendas', '🥉', 100, 'sales', true),
    (v_client_id, 'Vendedor Prata', 'Acumulou 500 XP em vendas', '🥈', 500, 'sales', true),
    (v_client_id, 'Vendedor Ouro', 'Acumulou 1000 XP', '🥇', 1000, 'sales', true),
    (v_client_id, 'Auditor Estrela', 'Completou 20 checklists', '⭐', 300, 'audit', true),
    (v_client_id, 'Team Player', 'Enviou 10 kudos', '🤝', 50, 'social', true),
    (v_client_id, 'Resolvedor', 'Resolveu 15 tickets', '🔧', 300, 'tickets', true);

  -- ======== DEMO PROMO CODES ========
  INSERT INTO promo_codes (client_id, code, description, discount_type, discount_value, min_order_value, max_uses, is_active, created_by) VALUES
    (v_client_id, 'BEMVINDO10', '10% off no primeiro pedido', 'percentage', 10, 50, 1000, true, v_admin_id),
    (v_client_id, 'FRETE0', 'Frete grátis acima de R$150', 'free_shipping', 0, 150, 500, true, v_admin_id),
    (v_client_id, 'ANIVER20', '20% off para aniversariantes', 'percentage', 20, 0, null, true, v_admin_id);

  -- ======== CHECKLIST TEMPLATE ========
  INSERT INTO checklist_templates (id, client_id, name, description, category, created_by)
  VALUES (uuid_generate_v4(), v_client_id, 'Vistoria Diária da Loja', 'Checklist padrão para abertura de loja', 'daily_inspection', v_admin_id)
  RETURNING id INTO v_template_id;

  INSERT INTO checklist_template_items (template_id, order_index, section, question, input_type, fail_values, auto_ticket_on_fail, ticket_priority) VALUES
    (v_template_id, 1, 'Estrutura', 'Fachada da loja está limpa e iluminada?', 'boolean', '["false"]', true, 'medium'),
    (v_template_id, 2, 'Estrutura', 'Vitrine organizada conforme padrão?', 'boolean', '["false"]', true, 'high'),
    (v_template_id, 3, 'Estrutura', 'Ar condicionado funcionando?', 'boolean', '["false"]', true, 'critical'),
    (v_template_id, 4, 'Estoque', 'Estoque organizado no depósito?', 'boolean', '["false"]', false, 'low'),
    (v_template_id, 5, 'Estoque', 'Produtos com etiquetas corretas?', 'boolean', '["false"]', true, 'medium'),
    (v_template_id, 6, 'Equipe', 'Todos os colaboradores uniformizados?', 'boolean', '["false"]', false, 'low'),
    (v_template_id, 7, 'Limpeza', 'Condição geral de limpeza', 'select', '["ruim","péssimo"]', true, 'high'),
    (v_template_id, 8, 'Limpeza', 'Foto do piso da loja', 'photo', '[]', false, 'low'),
    (v_template_id, 9, 'Observações', 'Comentários adicionais', 'text', '[]', false, 'low');

  -- ======== DEMO CONTACTS ========
  INSERT INTO contacts (id, client_id, name, phone, email)
  VALUES (uuid_generate_v4(), v_client_id, 'Juliana Mãe', '11988887777', 'juliana@email.com')
  RETURNING id INTO v_contact1_id;

  INSERT INTO contacts (id, client_id, name, phone, email)
  VALUES (uuid_generate_v4(), v_client_id, 'Roberto Pai', '11977776666', 'roberto@email.com')
  RETURNING id INTO v_contact2_id;

  -- ======== DEMO CRM EVENTS ========
  INSERT INTO crm_events (client_id, contact_id, event_type, event_date, title, is_recurring, metadata) VALUES
    (v_client_id, v_contact1_id, 'birthday', '1990-02-14', 'Aniversário Juliana', true, '{"promo_code": "ANIVER20"}'),
    (v_client_id, v_contact2_id, 'birthday', '1985-12-25', 'Aniversário Roberto', true, '{"promo_code": "ANIVER20"}');

  -- ======== SYSTEM SETTINGS ========
  INSERT INTO system_settings (key, value, category, description) VALUES
    ('abandoned_cart_timeout', '"120"', 'ecommerce', 'Minutes before a cart is flagged as abandoned'),
    ('xp_multiplier', '"1"', 'gamification', 'Global XP multiplier (1 = normal)'),
    ('notification_enabled', '"true"', 'notifications', 'Global notification toggle'),
    ('birthday_notify_days_before', '"0"', 'crm', 'Days before birthday to send notification');

  -- ======== SEED XP FOR DEMO ========
  INSERT INTO xp_ledger (user_id, amount, reason, shop_id) VALUES
    (v_manager1_id, 50, 'order.completed', v_shop1_id),
    (v_manager1_id, 30, 'checklist.submitted', v_shop1_id),
    (v_sales1_id, 80, 'order.completed', v_shop1_id),
    (v_sales1_id, 15, 'kudos.received', v_shop1_id),
    (v_manager2_id, 45, 'order.completed', v_shop2_id),
    (v_auditor_id, 60, 'checklist.submitted', null);

  RAISE NOTICE 'Lalelilo V2 seed data created successfully!';
  RAISE NOTICE 'Client ID: %', v_client_id;
  RAISE NOTICE 'Shops: %, %, %', v_shop1_id, v_shop2_id, v_shop3_id;
  RAISE NOTICE 'DC: %', v_dc_id;

END $$;
