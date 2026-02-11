-- Migration: Add authentication fields to shops table
-- Date: 2026-02-11
-- Description: Add password, login control, and super admin support
-- IDEMPOTENT: Safe to run multiple times

-- ============================================
-- SHOPS TABLE - Add authentication fields
-- ============================================

-- Add authentication columns (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shops' AND column_name = 'password_hash') THEN
        ALTER TABLE shops ADD COLUMN password_hash TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shops' AND column_name = 'is_active') THEN
        ALTER TABLE shops ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shops' AND column_name = 'last_login') THEN
        ALTER TABLE shops ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add index on slug for faster login lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_shops_slug_active ON shops(slug, is_active);

-- ============================================
-- SUPER ADMIN TABLE
-- ============================================

-- Create super admin table (if not exists)
CREATE TABLE IF NOT EXISTS super_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on username (if not exists)
CREATE INDEX IF NOT EXISTS idx_super_admin_username ON super_admin(username);

-- Insert default super admin (only if not exists)
INSERT INTO super_admin (username, password_hash, email, is_active)
VALUES ('super-admin', '', 'admin@lalelilo.com', true)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- PASSWORD RESET TOKENS TABLE
-- ============================================

-- Create password reset tokens table (if not exists)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- shop slug or super-admin username
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes (if not exist)
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_identifier ON password_reset_tokens(identifier);

-- Cleanup old/expired tokens function (replace if exists)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW() OR used = true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Authentication migration completed successfully!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Generate password for super-admin user';
    RAISE NOTICE '2. Test login at /login';
    RAISE NOTICE '3. Generate passwords for shops in /super-admin/shops';
END $$;
