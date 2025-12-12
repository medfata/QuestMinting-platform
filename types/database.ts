/**
 * Supabase Database Types
 * Auto-generated types for database tables
 */

export interface Database {
  public: {
    Tables: {
      supported_chains: {
        Row: SupportedChainRow;
        Insert: SupportedChainInsert;
        Update: SupportedChainUpdate;
      };
      mintfun_campaigns: {
        Row: MintfunCampaignRow;
        Insert: MintfunCampaignInsert;
        Update: MintfunCampaignUpdate;
      };
      mint_tiers: {
        Row: MintTierRow;
        Insert: MintTierInsert;
        Update: MintTierUpdate;
      };
      quest_campaigns: {
        Row: QuestCampaignRow;
        Insert: QuestCampaignInsert;
        Update: QuestCampaignUpdate;
      };
      quest_tasks: {
        Row: QuestTaskRow;
        Insert: QuestTaskInsert;
        Update: QuestTaskUpdate;
      };
      eligibility_conditions: {
        Row: EligibilityConditionRow;
        Insert: EligibilityConditionInsert;
        Update: EligibilityConditionUpdate;
      };
      user_task_completions: {
        Row: UserTaskCompletionRow;
        Insert: UserTaskCompletionInsert;
        Update: UserTaskCompletionUpdate;
      };
      home_config: {
        Row: HomeConfigRow;
        Insert: HomeConfigInsert;
        Update: HomeConfigUpdate;
      };
      admin_users: {
        Row: AdminUserRow;
        Insert: AdminUserInsert;
        Update: AdminUserUpdate;
      };
    };
  };
}


// Native Currency JSON structure
export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

// Theme JSON structure
export interface ThemeJson {
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  heading_font?: string;
  body_font?: string;
}

// Supported Chains Table
export interface SupportedChainRow {
  id: string;
  chain_id: number;
  name: string;
  short_name: string;
  rpc_urls: string[];
  explorer_url: string;
  native_currency: NativeCurrency;
  chain_slug: string;
  is_testnet: boolean;
  mint_contract_address: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupportedChainInsert {
  id?: string;
  chain_id: number;
  name: string;
  short_name: string;
  rpc_urls: string[];
  explorer_url: string;
  native_currency: NativeCurrency;
  chain_slug: string;
  is_testnet?: boolean;
  mint_contract_address?: string | null;
  is_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupportedChainUpdate {
  id?: string;
  chain_id?: number;
  name?: string;
  short_name?: string;
  rpc_urls?: string[];
  explorer_url?: string;
  native_currency?: NativeCurrency;
  chain_slug?: string;
  is_testnet?: boolean;
  mint_contract_address?: string | null;
  is_enabled?: boolean;
  updated_at?: string;
}

// MintFun Campaigns Table
export interface MintfunCampaignRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string;
  chain_id: number;
  contract_address: string;
  token_id: string | null; // On-chain token ID
  theme: ThemeJson;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MintfunCampaignInsert {
  id?: string;
  slug: string;
  title: string;
  description?: string | null;
  image_url: string;
  chain_id: number;
  contract_address: string;
  token_id?: string | null;
  theme?: ThemeJson;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MintfunCampaignUpdate {
  id?: string;
  slug?: string;
  title?: string;
  description?: string | null;
  image_url?: string;
  chain_id?: number;
  contract_address?: string;
  token_id?: string | null;
  theme?: ThemeJson;
  is_active?: boolean;
  updated_at?: string;
}


// Mint Tiers Table
export interface MintTierRow {
  id: string;
  campaign_id: string;
  name: string;
  quantity: number;
  price: string;
  max_per_wallet: number | null;
  order_index: number;
  created_at: string;
}

export interface MintTierInsert {
  id?: string;
  campaign_id: string;
  name: string;
  quantity: number;
  price?: string;
  max_per_wallet?: number | null;
  order_index?: number;
  created_at?: string;
}

export interface MintTierUpdate {
  id?: string;
  campaign_id?: string;
  name?: string;
  quantity?: number;
  price?: string;
  max_per_wallet?: number | null;
  order_index?: number;
}

// Quest Campaigns Table
export interface QuestCampaignRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string;
  chain_id: number;
  contract_address: string;
  token_id: string | null; // On-chain token ID
  theme: ThemeJson;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestCampaignInsert {
  id?: string;
  slug: string;
  title: string;
  description?: string | null;
  image_url: string;
  chain_id: number;
  contract_address: string;
  token_id?: string | null;
  theme?: ThemeJson;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface QuestCampaignUpdate {
  id?: string;
  slug?: string;
  title?: string;
  description?: string | null;
  image_url?: string;
  chain_id?: number;
  contract_address?: string;
  token_id?: string | null;
  theme?: ThemeJson;
  is_active?: boolean;
  updated_at?: string;
}

// Quest Tasks Table
export type QuestTaskType = 'twitter_follow' | 'twitter_retweet' | 'telegram_join' | 'discord_join' | 'custom_url';

export interface QuestTaskRow {
  id: string;
  quest_id: string;
  type: QuestTaskType;
  title: string;
  description: string | null;
  external_url: string;
  verification_data: Record<string, string>;
  order_index: number;
  created_at: string;
}

export interface QuestTaskInsert {
  id?: string;
  quest_id: string;
  type: QuestTaskType;
  title: string;
  description?: string | null;
  external_url: string;
  verification_data?: Record<string, string>;
  order_index?: number;
  created_at?: string;
}

export interface QuestTaskUpdate {
  id?: string;
  quest_id?: string;
  type?: QuestTaskType;
  title?: string;
  description?: string | null;
  external_url?: string;
  verification_data?: Record<string, string>;
  order_index?: number;
}


// Eligibility Conditions Table
export type EligibilityType = 'nft' | 'token';

export interface EligibilityConditionRow {
  id: string;
  quest_id: string;
  type: EligibilityType;
  min_amount: string;
  contract_address: string | null;
  created_at: string;
}

export interface EligibilityConditionInsert {
  id?: string;
  quest_id: string;
  type: EligibilityType;
  min_amount: string;
  contract_address?: string | null;
  created_at?: string;
}

export interface EligibilityConditionUpdate {
  id?: string;
  quest_id?: string;
  type?: EligibilityType;
  min_amount?: string;
  contract_address?: string | null;
}

// User Task Completions Table
export interface UserTaskCompletionRow {
  id: string;
  wallet_address: string;
  task_id: string;
  completed_at: string;
}

export interface UserTaskCompletionInsert {
  id?: string;
  wallet_address: string;
  task_id: string;
  completed_at?: string;
}

export interface UserTaskCompletionUpdate {
  id?: string;
  wallet_address?: string;
  task_id?: string;
  completed_at?: string;
}

// Home Config Table
export interface HomeConfigRow {
  id: string;
  hero_title: string;
  hero_subtitle: string | null;
  hero_description: string | null;
  theme: ThemeJson;
  featured_campaigns: string[];
  platform_name: string;
  platform_icon: string | null;
  updated_at: string;
}

export interface HomeConfigInsert {
  id?: string;
  hero_title?: string;
  hero_subtitle?: string | null;
  hero_description?: string | null;
  theme?: ThemeJson;
  featured_campaigns?: string[];
  platform_name?: string;
  platform_icon?: string | null;
  updated_at?: string;
}

export interface HomeConfigUpdate {
  id?: string;
  hero_title?: string;
  hero_subtitle?: string | null;
  hero_description?: string | null;
  theme?: ThemeJson;
  featured_campaigns?: string[];
  platform_name?: string;
  platform_icon?: string | null;
  updated_at?: string;
}

// Admin Users Table
export interface AdminUserRow {
  id: string;
  wallet_address: string;
  role: string;
  created_at: string;
}

export interface AdminUserInsert {
  id?: string;
  wallet_address: string;
  role?: string;
  created_at?: string;
}

export interface AdminUserUpdate {
  id?: string;
  wallet_address?: string;
  role?: string;
}
