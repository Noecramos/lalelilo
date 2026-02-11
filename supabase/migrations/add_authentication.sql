-- Migration: Add authentication fields to shops table
-- Date: 2026-02-11
-- Description: Add password, login control, and super admin support

-- ============================================
-- SHOPS TABLE - Add authentication fields
-- ============================================

-- Add authentication columns
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Add index on slug for faster login lookups
CREATE INDEX IF NOT EXISTS idx_shops_slug_active ON shops(slug, is_active);

-- ============================================
-- SUPER ADMIN TABLE
-- ============================================

-- Create super admin table
CREATE TABLE IF NOT EXISTS super_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on username
CREATE INDEX IF NOT EXISTS idx_super_admin_username ON super_admin(username);

-- Insert default super admin (password will need to be set via reset)
INSERT INTO super_admin (username, password_hash, email, is_active)
VALUES ('super-admin', '', 'admin@lalelilo.com', true)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- PASSWORD RESET TOKENS TABLE
-- ============================================

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- shop slug or super-admin username
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on token for fast lookups
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);

-- Add index on identifier
CREATE INDEX IF NOT EXISTS idx_reset_tokens_identifier ON password_reset_tokens(identifier);

-- Cleanup old/expired tokens function
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW() OR used = true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify shops table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'shops' AND column_name IN ('password_hash', 'is_active', 'last_login');

-- Verify super_admin table
-- SELECT * FROM super_admin;

-- Check password reset tokens table
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'password_reset_tokens';
