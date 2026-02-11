-- Add archived column to messages table for message archiving feature
-- This allows messages to be moved to "Histórico de Msgs" without deletion

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on archived messages
CREATE INDEX IF NOT EXISTS idx_messages_archived 
ON messages(conversation_id, archived);

-- Add comment
COMMENT ON COLUMN messages.archived IS 'Whether the message has been archived to message history';
