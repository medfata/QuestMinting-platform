-- Migration: Add multi-function verification support to XP Quest Campaigns
-- Allows admins to specify multiple functions with AND/OR logic

-- Add new columns for multi-function verification
ALTER TABLE mint_platform_xp_quest_campaigns 
  ADD COLUMN IF NOT EXISTS verification_functions JSONB DEFAULT '[]';
  -- Format: [{ "signature": "gm()", "label": "Say GM" }, { "signature": "mint(uint256)", "label": "Mint NFT" }]

ALTER TABLE mint_platform_xp_quest_campaigns 
  ADD COLUMN IF NOT EXISTS verification_logic TEXT DEFAULT 'OR' CHECK (verification_logic IN ('AND', 'OR'));
  -- 'OR' = user must call at least one function
  -- 'AND' = user must call ALL functions

-- Migrate existing data: convert function_signature to verification_functions array
UPDATE mint_platform_xp_quest_campaigns 
SET verification_functions = jsonb_build_array(
  jsonb_build_object('signature', function_signature, 'label', '')
)
WHERE function_signature IS NOT NULL 
  AND (verification_functions IS NULL OR verification_functions = '[]'::jsonb);

-- Drop the old column (optional - uncomment when ready)
-- ALTER TABLE mint_platform_xp_quest_campaigns DROP COLUMN IF EXISTS function_signature;

-- Add comment for documentation
COMMENT ON COLUMN mint_platform_xp_quest_campaigns.verification_functions IS 
  'Array of function signatures to verify. Format: [{"signature": "fn()", "label": "Description"}]';
COMMENT ON COLUMN mint_platform_xp_quest_campaigns.verification_logic IS 
  'Logic operator: OR (any function) or AND (all functions)';
