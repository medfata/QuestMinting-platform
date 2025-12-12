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

/**
 * Converts RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Converts HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Converts RGB to hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a harmonious secondary color from a primary color
 * Uses analogous color harmony with a hue shift of ~40-60 degrees
 */
export function generateSecondaryColor(primaryHex: string): string {
  const rgb = hexToRgb(primaryHex);
  if (!rgb) return '#8b5cf6'; // fallback purple

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  // Shift hue by 45 degrees for analogous harmony
  // Also slightly adjust saturation and lightness for visual appeal
  let newHue = (hsl.h + 45) % 360;
  
  // Boost saturation slightly if it's low
  let newSaturation = hsl.s < 50 ? Math.min(hsl.s + 15, 100) : hsl.s;
  
  // Keep lightness similar but ensure it's visible
  let newLightness = hsl.l;
  if (newLightness < 30) newLightness = 40;
  if (newLightness > 70) newLightness = 60;

  const newRgb = hslToRgb(newHue, newSaturation, newLightness);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}
