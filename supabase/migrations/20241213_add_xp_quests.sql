-- Add XP Quest support
-- This migration adds support for XP-based quests with on-chain verification

-- Add new task type for XP quests
ALTER TABLE mint_platform_quest_tasks 
DROP CONSTRAINT IF EXISTS mint_platform_quest_tasks_type_check;

ALTER TABLE mint_platform_quest_tasks 
ADD CONSTRAINT mint_platform_quest_tasks_type_check 
CHECK (type IN ('twitter_follow', 'twitter_retweet', 'telegram_join', 'discord_join', 'custom_url', 'xp_quest'));

-- Add XP reward field to quest campaigns
ALTER TABLE mint_platform_quest_campaigns
ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 0;

-- Create user XP tracking table
CREATE TABLE IF NOT EXISTS mint_platform_user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  total_xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(wallet_address)
);

-- Create XP transaction history table
CREATE TABLE IF NOT EXISTS mint_platform_xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  task_id UUID NOT NULL REFERENCES mint_platform_quest_tasks(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  verification_timestamp BIGINT, -- The timestamp returned from the contract
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_xp_wallet ON mint_platform_user_xp(wallet_address);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_wallet ON mint_platform_xp_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_task ON mint_platform_xp_transactions(task_id);

-- Add RLS policies
ALTER TABLE mint_platform_user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE mint_platform_xp_transactions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to XP data
CREATE POLICY "Allow public read access to user XP" ON mint_platform_user_xp
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to XP transactions" ON mint_platform_xp_transactions
  FOR SELECT USING (true);

-- Allow insert/update from service role (API)
CREATE POLICY "Allow service role to manage user XP" ON mint_platform_user_xp
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role to manage XP transactions" ON mint_platform_xp_transactions
  FOR ALL USING (true) WITH CHECK (true);
