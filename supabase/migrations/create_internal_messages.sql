-- Internal Messages table for super-admin <-> shop communication
-- This is separate from the omnichannel 'messages' table which handles WhatsApp/IG/FB

CREATE TABLE IF NOT EXISTS internal_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('super-admin', 'shop')),
    sender_id TEXT NOT NULL,  -- 'super-admin' or shop UUID
    recipient_id TEXT NOT NULL, -- shop UUID or 'all' for broadcasts
    content TEXT NOT NULL,
    is_broadcast BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_internal_messages_sender ON internal_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_internal_messages_recipient ON internal_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_internal_messages_created ON internal_messages(created_at DESC);

-- Allow all operations via service role (RLS disabled for admin table)
ALTER TABLE internal_messages ENABLE ROW LEVEL SECURITY;

-- Policy: allow everything via service role key
CREATE POLICY "Allow service role full access" ON internal_messages
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Also allow authenticated users to read their own messages
CREATE POLICY "Shops can read their messages" ON internal_messages
    FOR SELECT
    USING (
        recipient_id = auth.uid()::text
        OR sender_id = auth.uid()::text
        OR recipient_id = 'all'
    );
