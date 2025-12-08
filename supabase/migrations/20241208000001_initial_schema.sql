-- Multi-Chain NFT Minting Platform - Initial Schema
-- Migration: 20241208000001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Supported chains table (populated from chainlist.org/rpcs.json)
CREATE TABLE supported_chains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  rpc_urls JSONB NOT NULL, -- Array of RPC URLs for fallback
  explorer_url TEXT NOT NULL,
  native_currency JSONB NOT NULL,
  chain_slug TEXT NOT NULL,
  is_testnet BOOLEAN DEFAULT false,
  mint_contract_address TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MintFun campaigns table
CREATE TABLE mintfun_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  chain_id INTEGER REFERENCES supported_chains(chain_id),
  contract_address TEXT NOT NULL,
  theme JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Mint tiers table
CREATE TABLE mint_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES mintfun_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price TEXT NOT NULL DEFAULT '0',
  max_per_wallet INTEGER,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quest campaigns table
CREATE TABLE quest_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  chain_id INTEGER REFERENCES supported_chains(chain_id),
  contract_address TEXT NOT NULL,
  theme JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quest tasks table
CREATE TABLE quest_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quest_id UUID REFERENCES quest_campaigns(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('twitter_follow', 'twitter_retweet', 'telegram_join', 'discord_join', 'custom_url')),
  title TEXT NOT NULL,
  description TEXT,
  external_url TEXT NOT NULL,
  verification_data JSONB DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eligibility conditions table
CREATE TABLE eligibility_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quest_id UUID UNIQUE REFERENCES quest_campaigns(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('nft', 'token')),
  min_amount TEXT NOT NULL,
  contract_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User task completions table
CREATE TABLE user_task_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  task_id UUID REFERENCES quest_tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, task_id)
);

-- Home page configuration table
CREATE TABLE home_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hero_title TEXT NOT NULL DEFAULT 'Welcome',
  hero_subtitle TEXT,
  hero_description TEXT,
  theme JSONB NOT NULL DEFAULT '{}',
  featured_campaigns UUID[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin users table (wallet-based)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- INDEXES
-- ============================================

-- Indexes for slug lookups
CREATE INDEX idx_mintfun_slug ON mintfun_campaigns(slug);
CREATE INDEX idx_quest_slug ON quest_campaigns(slug);

-- Indexes for active campaigns
CREATE INDEX idx_mintfun_active ON mintfun_campaigns(is_active);
CREATE INDEX idx_quest_active ON quest_campaigns(is_active);

-- Indexes for wallet addresses
CREATE INDEX idx_task_completions_wallet ON user_task_completions(wallet_address);
CREATE INDEX idx_admin_wallet ON admin_users(wallet_address);

-- Indexes for chain management
CREATE INDEX idx_chains_enabled ON supported_chains(is_enabled);
CREATE INDEX idx_chains_chain_id ON supported_chains(chain_id);

-- Indexes for foreign key relationships
CREATE INDEX idx_mint_tiers_campaign ON mint_tiers(campaign_id);
CREATE INDEX idx_quest_tasks_quest ON quest_tasks(quest_id);
CREATE INDEX idx_eligibility_quest ON eligibility_conditions(quest_id);
CREATE INDEX idx_task_completions_task ON user_task_completions(task_id);


-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE supported_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE mintfun_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE mint_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PUBLIC READ POLICIES
-- ============================================

-- Chains: Public can view enabled chains
CREATE POLICY "Public can view enabled chains" ON supported_chains
  FOR SELECT USING (is_enabled = true);

-- MintFun campaigns: Public can view active campaigns
CREATE POLICY "Public can view active mintfun campaigns" ON mintfun_campaigns
  FOR SELECT USING (is_active = true);

-- Mint tiers: Public can view all tiers (filtered by campaign access)
CREATE POLICY "Public can view mint tiers" ON mint_tiers
  FOR SELECT USING (true);

-- Quest campaigns: Public can view active campaigns
CREATE POLICY "Public can view active quest campaigns" ON quest_campaigns
  FOR SELECT USING (is_active = true);

-- Quest tasks: Public can view all tasks (filtered by campaign access)
CREATE POLICY "Public can view quest tasks" ON quest_tasks
  FOR SELECT USING (true);

-- Eligibility conditions: Public can view all conditions
CREATE POLICY "Public can view eligibility conditions" ON eligibility_conditions
  FOR SELECT USING (true);

-- Home config: Public can view
CREATE POLICY "Public can view home config" ON home_config
  FOR SELECT USING (true);

-- User task completions: Public can view all completions
CREATE POLICY "Public can view task completions" ON user_task_completions
  FOR SELECT USING (true);

-- User task completions: Anyone can insert completions
CREATE POLICY "Users can insert task completions" ON user_task_completions
  FOR INSERT WITH CHECK (true);


-- ============================================
-- ADMIN WRITE POLICIES (using service role)
-- ============================================

-- Note: Admin write operations should use the service role key (SUPABASE_SERVICE_ROLE_KEY)
-- which bypasses RLS. These policies allow admins to manage data when authenticated.

-- Admin users: Service role can manage
CREATE POLICY "Service role can manage admin users" ON admin_users
  FOR ALL USING (true) WITH CHECK (true);

-- Supported chains: Service role can manage
CREATE POLICY "Service role can manage chains" ON supported_chains
  FOR ALL USING (true) WITH CHECK (true);

-- MintFun campaigns: Service role can manage
CREATE POLICY "Service role can manage mintfun campaigns" ON mintfun_campaigns
  FOR ALL USING (true) WITH CHECK (true);

-- Mint tiers: Service role can manage
CREATE POLICY "Service role can manage mint tiers" ON mint_tiers
  FOR ALL USING (true) WITH CHECK (true);

-- Quest campaigns: Service role can manage
CREATE POLICY "Service role can manage quest campaigns" ON quest_campaigns
  FOR ALL USING (true) WITH CHECK (true);

-- Quest tasks: Service role can manage
CREATE POLICY "Service role can manage quest tasks" ON quest_tasks
  FOR ALL USING (true) WITH CHECK (true);

-- Eligibility conditions: Service role can manage
CREATE POLICY "Service role can manage eligibility conditions" ON eligibility_conditions
  FOR ALL USING (true) WITH CHECK (true);

-- Home config: Service role can manage
CREATE POLICY "Service role can manage home config" ON home_config
  FOR ALL USING (true) WITH CHECK (true);

-- User task completions: Service role can manage
CREATE POLICY "Service role can manage task completions" ON user_task_completions
  FOR ALL USING (true) WITH CHECK (true);


-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for tables with updated_at column
CREATE TRIGGER update_supported_chains_updated_at
  BEFORE UPDATE ON supported_chains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mintfun_campaigns_updated_at
  BEFORE UPDATE ON mintfun_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quest_campaigns_updated_at
  BEFORE UPDATE ON quest_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_home_config_updated_at
  BEFORE UPDATE ON home_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default home config
INSERT INTO home_config (hero_title, hero_subtitle, hero_description, theme)
VALUES (
  'Welcome to NFT Minting Platform',
  'Discover and mint unique NFTs',
  'Explore our collection of MintFun campaigns and Quest-based minting experiences across multiple chains.',
  '{"primary_color": "#6366f1", "secondary_color": "#8b5cf6", "background_color": "#0f172a", "text_color": "#f8fafc", "heading_font": "Inter", "body_font": "Inter"}'::jsonb
);
