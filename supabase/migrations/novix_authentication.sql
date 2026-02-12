-- Novix Online - Platform Manager Authentication
-- Run this in Supabase SQL Editor

-- Create Novix managers table
CREATE TABLE IF NOT EXISTS novix_managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_novix_managers_username ON novix_managers(username);

-- Insert default Novix manager
-- Username: novix-admin
-- Password: (you'll set this after running the script)
INSERT INTO novix_managers (username, password_hash, email, is_active)
VALUES ('novix-admin', '', 'admin@noviapp.com.br', true)
ON CONFLICT (username) DO NOTHING;

-- Verification
SELECT 
    username,
    email,
    is_active,
    CASE 
        WHEN password_hash = '' THEN '❌ No password set'
        ELSE '✅ Password configured'
    END as password_status,
    created_at
FROM novix_managers
WHERE username = 'novix-admin';
