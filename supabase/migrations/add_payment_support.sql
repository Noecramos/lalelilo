-- Add payment fields to orders table
-- This migration adds support for Getnet payment gateway integration

-- Add payment-related columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_data JSONB,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster payment status queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);

-- Create payments table for detailed transaction tracking
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES shops(id),
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'BRL',
    payment_method TEXT NOT NULL, -- 'credit_card', 'debit_card', 'pix'
    installments INTEGER DEFAULT 1,
    
    -- Getnet transaction data
    getnet_payment_id TEXT,
    getnet_authorization_code TEXT,
    getnet_transaction_id TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'declined', 'refunded', 'error'
    status_message TEXT,
    
    -- Customer data (for reference)
    customer_name TEXT,
    customer_email TEXT,
    customer_document TEXT,
    
    -- Card data (last 4 digits only, never store full card)
    card_last_digits TEXT,
    card_brand TEXT,
    
    -- Raw response from Getnet (for debugging)
    response_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    declined_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_shop_id ON payments(shop_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_getnet_payment_id ON payments(getnet_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Add comment
COMMENT ON TABLE payments IS 'Stores payment transaction details from Getnet payment gateway';

-- Update function for updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_payments_updated_at ON payments;
CREATE TRIGGER trigger_update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();

-- Add payment status check constraint
ALTER TABLE orders
ADD CONSTRAINT check_payment_status 
CHECK (payment_status IN ('pending', 'approved', 'declined', 'refunded', 'error', 'cancelled'));

ALTER TABLE payments
ADD CONSTRAINT check_payment_status_payments
CHECK (status IN ('pending', 'approved', 'declined', 'refunded', 'error', 'cancelled'));

-- Add payment method check constraint
ALTER TABLE payments
ADD CONSTRAINT check_payment_method
CHECK (payment_method IN ('credit_card', 'debit_card', 'pix', 'boleto'));
