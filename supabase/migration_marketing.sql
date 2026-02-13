-- ============================================================================
-- Lalelilo Platform - Marketing Campaigns Migration
-- Run AFTER migration_v2.sql
-- ============================================================================

-- ============================================================================
-- MARKETING CAMPAIGNS
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT, -- Rich text / markdown instructions
  campaign_type TEXT NOT NULL DEFAULT 'general'
    CHECK (campaign_type IN ('seasonal','black_friday','launch','promotion','general')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','completed','cancelled')),
  cover_image_url TEXT,
  start_date DATE,
  end_date DATE,
  target_shops JSONB DEFAULT '[]', -- Empty = all shops
  priority TEXT DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CAMPAIGN FILES (images, PDFs, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT, -- image/png, application/pdf, etc.
  file_size INTEGER,
  sort_order INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CAMPAIGN ACKNOWLEDGEMENTS (shop confirms they saw it)
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_acknowledgements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(campaign_id, shop_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_campaigns_client ON marketing_campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON marketing_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON marketing_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaign_files_campaign ON campaign_files(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_ack_campaign ON campaign_acknowledgements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_ack_shop ON campaign_acknowledgements(shop_id);

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_acknowledgements ENABLE ROW LEVEL SECURITY;

-- Permissive policies for development
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'marketing_campaigns','campaign_files','campaign_acknowledgements'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "allow_all_%s" ON %I', t, t);
    EXECUTE format('CREATE POLICY "allow_all_%s" ON %I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS update_marketing_campaigns_updated_at ON marketing_campaigns;
CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
