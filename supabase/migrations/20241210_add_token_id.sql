-- Add token_id column to quest_campaigns
ALTER TABLE mint_platform_quest_campaigns
ADD COLUMN IF NOT EXISTS token_id TEXT;

-- Add token_id column to mintfun_campaigns
ALTER TABLE mint_platform_mintfun_campaigns
ADD COLUMN IF NOT EXISTS token_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN mint_platform_quest_campaigns.token_id IS 'On-chain ERC1155 token ID for this quest reward';
COMMENT ON COLUMN mint_platform_mintfun_campaigns.token_id IS 'On-chain ERC1155 token ID for this campaign';
