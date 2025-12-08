/**
 * MintFun Campaign Types
 */

import type { ThemeJson } from './database';

export interface MintTier {
  id: string;
  campaign_id: string;
  name: string;
  quantity: number;
  price: string; // In wei/native token smallest unit
  max_per_wallet: number | null;
  order_index: number;
}

export interface MintFunCampaign {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string;
  chain_id: number;
  contract_address: string;
  mint_tiers: MintTier[];
  theme: CampaignTheme;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CampaignTheme {
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
}

// Form input types for creating/editing campaigns
export interface MintTierInput {
  id?: string;
  name: string;
  quantity: number;
  price: string;
  max_per_wallet: number | null;
  order_index: number;
}

export interface MintFunCampaignInput {
  slug: string;
  title: string;
  description: string | null;
  image_url: string;
  chain_id: number;
  contract_address: string;
  mint_tiers: MintTierInput[];
  theme: CampaignTheme;
  is_active: boolean;
}

// Helper to convert database theme to CampaignTheme with defaults
export function toCampaignTheme(theme: ThemeJson): CampaignTheme {
  return {
    primary_color: theme.primary_color ?? '#3b82f6',
    secondary_color: theme.secondary_color ?? '#8b5cf6',
    background_color: theme.background_color ?? '#0f172a',
    text_color: theme.text_color ?? '#f8fafc',
  };
}
