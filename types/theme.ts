/**
 * Theme Configuration Types
 */

import type { CampaignTheme } from './campaign';

export interface GlobalTheme extends CampaignTheme {
  heading_font: string;
  body_font: string;
}

export interface HomePageConfig {
  id: string;
  hero_title: string;
  hero_subtitle: string | null;
  hero_description: string | null;
  theme: GlobalTheme;
  featured_campaigns: string[]; // Campaign IDs (can be MintFun or Quest)
  updated_at: string;
}

// Form input for home page settings
export interface HomePageConfigInput {
  hero_title: string;
  hero_subtitle: string | null;
  hero_description: string | null;
  theme: GlobalTheme;
  featured_campaigns: string[];
}

// Default theme values
export const DEFAULT_CAMPAIGN_THEME: CampaignTheme = {
  primary_color: '#3b82f6',
  secondary_color: '#8b5cf6',
  background_color: '#0f172a',
  text_color: '#f8fafc',
};

export const DEFAULT_GLOBAL_THEME: GlobalTheme = {
  ...DEFAULT_CAMPAIGN_THEME,
  heading_font: 'Inter',
  body_font: 'Inter',
};

// CSS variable mapping for themes
export interface ThemeCSSVariables {
  '--color-primary': string;
  '--color-secondary': string;
  '--color-background': string;
  '--color-text': string;
  '--font-heading'?: string;
  '--font-body'?: string;
}

// Convert theme to CSS variables
export function themeToCSSVariables(theme: CampaignTheme | GlobalTheme): ThemeCSSVariables {
  const vars: ThemeCSSVariables = {
    '--color-primary': theme.primary_color,
    '--color-secondary': theme.secondary_color,
    '--color-background': theme.background_color,
    '--color-text': theme.text_color,
  };

  if ('heading_font' in theme) {
    vars['--font-heading'] = theme.heading_font;
    vars['--font-body'] = theme.body_font;
  }

  return vars;
}
