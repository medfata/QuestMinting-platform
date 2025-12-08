import type { CampaignTheme } from '@/types/campaign';
import type { GlobalTheme, ThemeCSSVariables } from '@/types/theme';

/**
 * Converts hex color to RGB values string (space-separated for CSS)
 */
export function hexToRgbValues(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0 0';
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
}

/**
 * Converts a theme object to CSS custom properties
 * Compatible with both legacy variables and shadcn/ui RGB format
 */
export function themeToCSSProperties(theme: CampaignTheme | GlobalTheme): Record<string, string> {
  // Convert hex colors to RGB values for shadcn/ui compatibility
  const primaryRgb = hexToRgbValues(theme.primary_color);
  const secondaryRgb = hexToRgbValues(theme.secondary_color);
  const backgroundRgb = hexToRgbValues(theme.background_color);
  const textRgb = hexToRgbValues(theme.text_color);

  const vars: Record<string, string> = {
    // Legacy CSS variables (for backward compatibility)
    '--color-primary': theme.primary_color,
    '--color-secondary': theme.secondary_color,
    '--color-background': theme.background_color,
    '--color-text': theme.text_color,
    
    // shadcn/ui compatible RGB variables
    '--primary': primaryRgb,
    '--primary-rgb': primaryRgb.replace(/ /g, ', '),
    '--secondary': secondaryRgb,
    '--secondary-rgb': secondaryRgb.replace(/ /g, ', '),
    '--background': backgroundRgb,
    '--foreground': textRgb,
    
    // Card and popover inherit from background
    '--card': backgroundRgb,
    '--card-foreground': textRgb,
    '--popover': backgroundRgb,
    '--popover-foreground': textRgb,
    
    // Glow effects based on theme colors
    '--glow-primary': `rgba(${primaryRgb.replace(/ /g, ', ')}, 0.5)`,
    '--glow-secondary': `rgba(${secondaryRgb.replace(/ /g, ', ')}, 0.5)`,
  };

  if ('heading_font' in theme) {
    vars['--font-heading'] = theme.heading_font;
    vars['--font-body'] = theme.body_font;
  }

  return vars;
}

/**
 * Generates inline style object from theme for React components
 */
export function getThemeStyle(theme: CampaignTheme | GlobalTheme): React.CSSProperties {
  return themeToCSSProperties(theme) as React.CSSProperties;
}

/**
 * Generates CSS string from theme for style tags
 */
export function generateThemeCSS(theme: CampaignTheme | GlobalTheme, selector = ':root'): string {
  const vars = themeToCSSProperties(theme);
  const cssVars = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  return `${selector} {\n${cssVars}\n}`;
}

/**
 * Applies theme CSS variables to document root
 */
export function applyThemeToDocument(theme: CampaignTheme | GlobalTheme): void {
  if (typeof document === 'undefined') return;

  const vars = themeToCSSProperties(theme);
  const root = document.documentElement;

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

/**
 * Removes theme CSS variables from document root
 */
export function removeThemeFromDocument(): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const themeVars = [
    '--color-primary',
    '--color-secondary',
    '--color-background',
    '--color-text',
    '--primary',
    '--primary-rgb',
    '--secondary',
    '--secondary-rgb',
    '--background',
    '--foreground',
    '--card',
    '--card-foreground',
    '--popover',
    '--popover-foreground',
    '--glow-primary',
    '--glow-secondary',
    '--font-heading',
    '--font-body',
  ];

  themeVars.forEach((key) => {
    root.style.removeProperty(key);
  });
}

/**
 * Validates hex color format
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Converts hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculates relative luminance for contrast checking
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Checks if text color has sufficient contrast against background
 */
export function hasGoodContrast(textColor: string, bgColor: string): boolean {
  const textLum = getLuminance(textColor);
  const bgLum = getLuminance(bgColor);
  const ratio =
    (Math.max(textLum, bgLum) + 0.05) / (Math.min(textLum, bgLum) + 0.05);
  return ratio >= 4.5; // WCAG AA standard
}
