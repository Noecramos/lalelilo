-- ============================================================================
-- Conversation State Management for Shop Selection Bot
-- ============================================================================

-- Create conversation_states table to track bot conversations
CREATE TABLE IF NOT EXISTS conversation_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  client_id UUID NOT NULL,
  state TEXT NOT NULL, -- 'awaiting_shop_selection', 'completed', 'failed'
  context JSONB DEFAULT '{}', -- { shops: [...], retryCount: 0, lastMessage: '...' }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '2 hours'
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_conversation_states_phone ON conversation_states(phone);
CREATE INDEX IF NOT EXISTS idx_conversation_states_expires ON conversation_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_conversation_states_state ON conversation_states(state);

-- Auto-update timestamp
CREATE TRIGGER update_conversation_states_updated_at 
  BEFORE UPDATE ON conversation_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Clean up expired states (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_conversation_states()
RETURNS void AS $$
BEGIN
  DELETE FROM conversation_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE conversation_states IS 'Tracks conversation flow state for shop selection bot';
