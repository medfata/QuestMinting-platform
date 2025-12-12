-- Add IPFS fields to mintfun campaigns
ALTER TABLE mint_platform_mintfun_campaigns
ADD COLUMN IF NOT EXISTS image_ipfs_url TEXT,
ADD COLUMN IF NOT EXISTS metadata_ipfs_url TEXT;

-- Add IPFS fields to quest campaigns
ALTER TABLE mint_platform_quest_campaigns
ADD COLUMN IF NOT EXISTS image_ipfs_url TEXT,
ADD COLUMN IF NOT EXISTS metadata_ipfs_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN mint_platform_mintfun_campaigns.image_ipfs_url IS 'IPFS URL for the NFT image (ipfs://...)';
COMMENT ON COLUMN mint_platform_mintfun_campaigns.metadata_ipfs_url IS 'IPFS URL for the NFT metadata JSON (ipfs://...)';
COMMENT ON COLUMN mint_platform_quest_campaigns.image_ipfs_url IS 'IPFS URL for the NFT image (ipfs://...)';
COMMENT ON COLUMN mint_platform_quest_campaigns.metadata_ipfs_url IS 'IPFS URL for the NFT metadata JSON (ipfs://...)';
