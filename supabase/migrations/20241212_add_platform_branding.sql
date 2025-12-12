-- Add platform branding columns to home config table
ALTER TABLE mint_platform_home_config
ADD COLUMN IF NOT EXISTS platform_name TEXT NOT NULL DEFAULT 'MintPlatform',
ADD COLUMN IF NOT EXISTS platform_icon TEXT;

-- Add comment for documentation
COMMENT ON COLUMN mint_platform_home_config.platform_name IS 'Platform name displayed in header, footer, and browser tab';
COMMENT ON COLUMN mint_platform_home_config.platform_icon IS 'URL to platform icon/logo used in header, footer, and favicon';
