/**
 * Quest Campaign Types
 */

import type { CampaignTheme } from './campaign';
import type { ThemeJson, QuestTaskType, EligibilityType } from './database';

export interface QuestTask {
  id: string;
  quest_id: string;
  type: QuestTaskType;
  title: string;
  description: string | null;
  external_url: string;
  verification_data: Record<string, string>;
  order_index: number;
}

export interface EligibilityCondition {
  id: string;
  quest_id: string;
  type: EligibilityType;
  min_amount: string;
  contract_address: string | null;
}

export interface QuestCampaign {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string;
  chain_id: number;
  contract_address: string;
  tasks: QuestTask[];
  eligibility: EligibilityCondition | null;
  theme: CampaignTheme;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Form input types for creating/editing quests
export interface QuestTaskInput {
  id?: string;
  type: QuestTaskType;
  title: string;
  description: string | null;
  external_url: string;
  verification_data: Record<string, string>;
  order_index: number;
}

export interface EligibilityConditionInput {
  type: EligibilityType;
  min_amount: string;
  contract_address: string | null;
}

export interface QuestCampaignInput {
  slug: string;
  title: string;
  description: string | null;
  image_url: string;
  chain_id: number;
  contract_address: string;
  tasks: QuestTaskInput[];
  eligibility: EligibilityConditionInput | null;
  theme: CampaignTheme;
  is_active: boolean;
}

// Task completion status for UI
export interface TaskCompletionStatus {
  task_id: string;
  is_completed: boolean;
  completed_at: string | null;
}

// Eligibility check result
export interface EligibilityCheckResult {
  is_eligible: boolean;
  condition: EligibilityCondition | null;
  current_balance: string;
  required_amount: string;
}
