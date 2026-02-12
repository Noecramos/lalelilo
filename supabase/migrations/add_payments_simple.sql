-- Add payment support to Lalelilo
-- Run this in Supabase SQL Editor

-- Add payment fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_data JSONB,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Create payments table for detailed transaction tracking
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES shops(id),
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'BRL',
    payment_method TEXT NOT NULL,
    installments INTEGER DEFAULT 1,
    
    -- Getnet transaction data
    getnet_payment_id TEXT,
    getnet_authorization_code TEXT,
    getnet_transaction_id TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'pending',
    status_message TEXT,
    
    -- Customer data
    customer_name TEXT,
    customer_email TEXT,
    customer_document TEXT,
    
    -- Card data (last 4 digits only)
    card_last_digits TEXT,
    card_brand TEXT,
    
    -- Raw response from Getnet
    response_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    declined_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_shop_id ON payments(shop_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_getnet_payment_id ON payments(getnet_payment_id);

-- Add RLS policies (allow all for now - tighten in production)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on payments" ON payments
FOR ALL USING (true) WITH CHECK (true);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Payment tables created successfully!';
END $$;
