-- XP Quest Campaigns
-- A new campaign type that rewards XP for completing on-chain tasks (no NFT minting)

-- Create XP Quest Campaigns table
CREATE TABLE IF NOT EXISTS mint_platform_xp_quest_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  
  -- XP Configuration
  xp_reward INTEGER NOT NULL DEFAULT 0,
  
  -- On-chain verification config
  verification_chain_id INTEGER NOT NULL,
  verification_contract TEXT NOT NULL,
  function_signature TEXT NOT NULL, -- e.g., "gm()"
  duration_seconds INTEGER NOT NULL DEFAULT 86400, -- Time window for verification
  
  -- External platform
  external_url TEXT NOT NULL, -- e.g., https://gm.inkonchain.com/
  
  -- Theme
  theme JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User XP Quest completions (tracks who completed which XP quest)
CREATE TABLE IF NOT EXISTS mint_platform_xp_quest_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES mint_platform_xp_quest_campaigns(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  tx_hash TEXT, -- The transaction that verified the quest
  xp_awarded INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(quest_id, wallet_address)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_xp_quest_campaigns_slug ON mint_platform_xp_quest_campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_xp_quest_campaigns_active ON mint_platform_xp_quest_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_xp_quest_completions_wallet ON mint_platform_xp_quest_completions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_xp_quest_completions_quest ON mint_platform_xp_quest_completions(quest_id);

-- RLS Policies
ALTER TABLE mint_platform_xp_quest_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE mint_platform_xp_quest_completions ENABLE ROW LEVEL SECURITY;

-- Public can view active XP quests
CREATE POLICY "Public can view XP quest campaigns" ON mint_platform_xp_quest_campaigns
  FOR SELECT USING (true);

-- Public can view completions
CREATE POLICY "Public can view XP quest completions" ON mint_platform_xp_quest_completions
  FOR SELECT USING (true);

-- Service role can manage
CREATE POLICY "Service role can manage XP quest campaigns" ON mint_platform_xp_quest_campaigns
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage XP quest completions" ON mint_platform_xp_quest_completions
  FOR ALL USING (true) WITH CHECK (true);
