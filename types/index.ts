/**
 * Type exports
 */

// Database types
export type {
  Database,
  NativeCurrency,
  ThemeJson,
  SupportedChainRow,
  SupportedChainInsert,
  SupportedChainUpdate,
  MintfunCampaignRow,
  MintfunCampaignInsert,
  MintfunCampaignUpdate,
  MintTierRow,
  MintTierInsert,
  MintTierUpdate,
  QuestCampaignRow,
  QuestCampaignInsert,
  QuestCampaignUpdate,
  QuestTaskRow,
  QuestTaskInsert,
  QuestTaskUpdate,
  QuestTaskType,
  EligibilityConditionRow,
  EligibilityConditionInsert,
  EligibilityConditionUpdate,
  EligibilityType,
  UserTaskCompletionRow,
  UserTaskCompletionInsert,
  UserTaskCompletionUpdate,
  HomeConfigRow,
  HomeConfigInsert,
  HomeConfigUpdate,
  AdminUserRow,
  AdminUserInsert,
  AdminUserUpdate,
} from './database';

// Campaign types
export type {
  MintTier,
  MintFunCampaign,
  CampaignTheme,
  MintTierInput,
  MintFunCampaignInput,
} from './campaign';
export { toCampaignTheme } from './campaign';

// Quest types
export type {
  QuestTask,
  EligibilityCondition,
  QuestCampaign,
  QuestTaskInput,
  EligibilityConditionInput,
  QuestCampaignInput,
  TaskCompletionStatus,
  EligibilityCheckResult,
} from './quest';

// Theme types
export type {
  GlobalTheme,
  HomePageConfig,
  HomePageConfigInput,
  ThemeCSSVariables,
} from './theme';
export { DEFAULT_CAMPAIGN_THEME, DEFAULT_GLOBAL_THEME, themeToCSSVariables } from './theme';

// Chain types
export type {
  ChainlistRpc,
  ChainlistExplorer,
  ChainlistNativeCurrency,
  ChainlistNetwork,
  SupportedChain,
  SupportedChainInput,
} from './chain';
export { transformChainlistToSupported, isTestnetChain } from './chain';
