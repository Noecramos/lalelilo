-- ============================================================================
-- Add 'marketing' role to users table
-- ============================================================================

-- Drop existing constraint and recreate with 'marketing' role included
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('super_admin','shop_admin','store_manager','sales_associate','auditor','staff','marketing'));
