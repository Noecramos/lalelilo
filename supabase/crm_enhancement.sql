-- ============================================================================
-- CRM Enhancement Migration - Lead Management & Contact Lifecycle
-- Run this AFTER migration_v2.sql
-- ============================================================================

-- Add new columns to contacts table for lead management
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'lead';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source TEXT; -- 'whatsapp', 'instagram', 'facebook', 'manual', 'ecommerce'
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_contact_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS total_orders INT DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lifetime_value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS assigned_shop_id UUID REFERENCES shops(id) ON DELETE SET NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS assignment_method TEXT; -- 'auto', 'manual', 'self_selected'

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_instagram ON contacts(instagram_id);
CREATE INDEX IF NOT EXISTS idx_contacts_facebook ON contacts(facebook_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_shop ON contacts(assigned_shop_id);
CREATE INDEX IF NOT EXISTS idx_contacts_first_contact ON contacts(first_contact_date);
CREATE INDEX IF NOT EXISTS idx_contacts_last_contact ON contacts(last_contact_date);

-- Add lead tracking to orders (will be enabled when orders schema is updated)
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS converted_from_lead BOOLEAN DEFAULT FALSE;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS lead_source TEXT;

-- Create function to auto-update contact stats when order is placed
-- (Disabled until orders table has contact_id column)
/*
CREATE OR REPLACE FUNCTION update_contact_stats_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Update contact stats
  UPDATE contacts
  SET 
    status = CASE 
      WHEN status = 'lead' OR status = 'qualified_lead' THEN 'customer'
      WHEN total_orders + 1 >= 5 OR lifetime_value + NEW.total >= 800 THEN 'vip'
      ELSE status
    END,
    total_orders = total_orders + 1,
    lifetime_value = lifetime_value + NEW.total,
    last_purchase_date = NOW(),
    last_contact_date = NOW()
  WHERE id = NEW.contact_id;

  -- Mark order as lead conversion if this is first order
  IF (SELECT total_orders FROM contacts WHERE id = NEW.contact_id) = 0 THEN
    NEW.converted_from_lead := TRUE;
    NEW.lead_source := (SELECT source FROM contacts WHERE id = NEW.contact_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_contact_stats_on_order_trigger ON orders;
CREATE TRIGGER update_contact_stats_on_order_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_stats_on_order();
*/

-- Create function to auto-tag contacts based on product categories
-- (Disabled until orders table has contact_id column)
/*
CREATE OR REPLACE FUNCTION auto_tag_contact_by_category()
RETURNS TRIGGER AS $$
DECLARE
  category_name TEXT;
  category_tag TEXT;
  purchase_count INT;
BEGIN
  -- Get product category
  SELECT c.name INTO category_name
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  JOIN categories c ON p.category_id = c.id
  WHERE oi.order_id = NEW.id
  LIMIT 1;

  -- Map category to tag
  category_tag := CASE category_name
    WHEN 'Vestidos' THEN 'dress_buyer'
    WHEN 'Calçados' THEN 'shoe_lover'
    WHEN 'Acessórios' THEN 'accessories_fan'
    WHEN 'Bolsas' THEN 'bag_collector'
    WHEN 'Roupas Infantis' THEN 'kids_shopper'
    WHEN 'Lingerie' THEN 'intimates_customer'
    ELSE NULL
  END;

  -- Count purchases in this category
  SELECT COUNT(*) INTO purchase_count
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  JOIN products p ON oi.product_id = p.id
  JOIN categories c ON p.category_id = c.id
  WHERE o.contact_id = NEW.contact_id
    AND c.name = category_name;

  -- Add tag if 2+ purchases in category
  IF category_tag IS NOT NULL AND purchase_count >= 2 THEN
    UPDATE contacts
    SET tags = array_append(tags, category_tag)
    WHERE id = NEW.contact_id
      AND NOT (tags @> ARRAY[category_tag]);
  END IF;

  -- Add frequent_buyer tag if 3+ total orders
  IF (SELECT total_orders FROM contacts WHERE id = NEW.contact_id) >= 3 THEN
    UPDATE contacts
    SET tags = array_append(tags, 'frequent_buyer')
    WHERE id = NEW.contact_id
      AND NOT (tags @> ARRAY['frequent_buyer']);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-tagging
DROP TRIGGER IF EXISTS auto_tag_contact_trigger ON orders;
CREATE TRIGGER auto_tag_contact_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_tag_contact_by_category();
*/


-- Create view for lead conversion metrics by shop
CREATE OR REPLACE VIEW shop_lead_metrics AS
SELECT 
  s.id as shop_id,
  s.name as shop_name,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status IN ('lead', 'qualified_lead')) as active_leads,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status IN ('customer', 'vip')) as total_customers,
  ROUND(AVG(c.lifetime_value) FILTER (WHERE c.status IN ('customer', 'vip')), 2) as avg_customer_value
FROM shops s
LEFT JOIN contacts c ON c.assigned_shop_id = s.id
GROUP BY s.id, s.name;

COMMENT ON VIEW shop_lead_metrics IS 'Lead conversion and customer metrics per shop';
