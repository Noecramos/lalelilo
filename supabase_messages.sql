-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_type TEXT NOT NULL CHECK (sender_type IN ('super-admin', 'shop')),
    sender_id TEXT NOT NULL, -- 'super-admin' or shop_id
    recipient_id TEXT NOT NULL, -- shop_id or 'all' or 'super-admin'
    content TEXT NOT NULL,
    is_broadcast BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies (simplified for now, you can refine these later)
-- Allow everyone to read messages where they are the recipient or sender
CREATE POLICY "Users can read their own messages" ON messages
    FOR SELECT USING (
        recipient_id = auth.uid()::text 
        OR sender_id = auth.uid()::text 
        OR recipient_id = 'all'
        -- For development/simplified auth, we might need broader access or use service_role in API
    );

-- Allow authenticated users to insert messages
CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (true);

-- Allow users to update (mark as read) their own messages
CREATE POLICY "Users can update their received messages" ON messages
    FOR UPDATE USING (recipient_id = auth.uid()::text);
