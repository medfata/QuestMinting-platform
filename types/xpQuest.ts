/**
 * XP Quest Campaign Types
 * Campaigns that reward XP for completing on-chain tasks (no NFT)
 */

import type { CampaignTheme } from './campaign';

// Verification function definition
export interface VerificationFunction {
  signature: string;
  label: string;
}

export type VerificationLogic = 'AND' | 'OR';

export interface XpQuestCampaign {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string;
  xp_reward: number;
  verification_chain_id: number;
  verification_contract: string;
  /** @deprecated Use verification_functions instead */
  function_signature?: string;
  verification_functions: VerificationFunction[];
  verification_logic: VerificationLogic;
  duration_seconds: number;
  external_url: string;
  theme: CampaignTheme;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Form input for creating/editing XP quests
export interface XpQuestCampaignInput {
  slug: string;
  title: string;
  description: string | null;
  image_url: string;
  xp_reward: number;
  verification_chain_id: number;
  verification_contract: string;
  /** @deprecated Use verification_functions instead */
  function_signature?: string;
  verification_functions: VerificationFunction[];
  verification_logic: VerificationLogic;
  duration_seconds: number;
  external_url: string;
  theme: CampaignTheme;
  is_active: boolean;
}

// Completion status for a user
export interface XpQuestCompletionStatus {
  quest_id: string;
  is_completed: boolean;
  tx_hash: string | null;
  xp_awarded: number;
  completed_at: string | null;
}

// Verification result
export interface XpQuestVerificationResult {
  verified: boolean;
  tx_hash?: string;
  timestamp?: number;
  xp_awarded?: number;
  error?: string;
}
