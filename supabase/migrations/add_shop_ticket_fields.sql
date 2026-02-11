-- Migration: Add additional fields to shops and tickets tables
-- Date: 2026-02-11
-- Description: Add WhatsApp, email, address, CNPJ to shops; Add job_position and ticket_number to tickets

-- ============================================
-- SHOPS TABLE - Add new fields
-- ============================================

-- Add new columns to shops table
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_shops_email ON shops(email);

-- Add index on CNPJ for faster lookups
CREATE INDEX IF NOT EXISTS idx_shops_cnpj ON shops(cnpj);

-- ============================================
-- TICKETS TABLE - Add new fields
-- ============================================

-- Add new columns to tickets table
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS job_position TEXT,
ADD COLUMN IF NOT EXISTS ticket_number INTEGER;

-- Create sequence for ticket numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS tickets_number_seq START WITH 1;

-- Update existing tickets to have sequential numbers (if any exist)
DO $$
DECLARE
    ticket_record RECORD;
    counter INTEGER := 1;
BEGIN
    FOR ticket_record IN 
        SELECT id FROM tickets 
        WHERE ticket_number IS NULL 
        ORDER BY created_at ASC
    LOOP
        UPDATE tickets 
        SET ticket_number = counter 
        WHERE id = ticket_record.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Set the sequence to the next available number
SELECT setval('tickets_number_seq', COALESCE((SELECT MAX(ticket_number) FROM tickets), 0) + 1, false);

-- Create function to auto-assign ticket numbers
CREATE OR REPLACE FUNCTION assign_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := nextval('tickets_number_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign ticket numbers on insert
DROP TRIGGER IF EXISTS trigger_assign_ticket_number ON tickets;
CREATE TRIGGER trigger_assign_ticket_number
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION assign_ticket_number();

-- Add unique constraint on ticket_number
ALTER TABLE tickets
ADD CONSTRAINT unique_ticket_number UNIQUE (ticket_number);

-- Add index on ticket_number for fast lookups
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);

-- Add index on job_position for filtering
CREATE INDEX IF NOT EXISTS idx_tickets_job_position ON tickets(job_position);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify shops table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'shops';

-- Verify tickets table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tickets';

-- Check ticket numbers
-- SELECT id, ticket_number, title, created_at FROM tickets ORDER BY ticket_number;
