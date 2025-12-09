'use client';

import { HTMLAttributes, forwardRef, useEffect } from 'react';
import type { CampaignTheme } from '@/types/campaign';
import type { GlobalTheme } from '@/types/theme';
import { cn } from '@/lib/utils';

/**
 * Converts hex color to RGB values for CSS variable compatibility
 */
function hexToRgbValues(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0 0';
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
}

/**
 * Converts theme to CSS custom properties compatible with shadcn/ui
 * Does NOT override background/foreground to respect light/dark theme toggle
 */
function themeToCSSProperties(theme: CampaignTheme | GlobalTheme): Record<string, string> {
  // Convert hex colors to RGB values for shadcn/ui compatibility
  const primaryRgb = hexToRgbValues(theme.primary_color);
  const secondaryRgb = hexToRgbValues(theme.secondary_color);

  const vars: Record<string, string> = {
    // Legacy CSS variables (for backward compatibility)
    '--color-primary': theme.primary_color,
    '--color-secondary': theme.secondary_color,
    '--color-background': theme.background_color,
    '--color-text': theme.text_color,
    
    // shadcn/ui compatible RGB variables - only primary/secondary colors
    // Background and foreground are controlled by light/dark theme in globals.css
    '--primary': primaryRgb,
    '--primary-rgb': primaryRgb.replace(/ /g, ', '),
    '--secondary': secondaryRgb,
    '--secondary-rgb': secondaryRgb.replace(/ /g, ', '),
    
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
function getThemeStyle(theme: CampaignTheme | GlobalTheme): React.CSSProperties {
  return themeToCSSProperties(theme) as React.CSSProperties;
}

/**
 * Applies theme CSS variables to document root
 */
function applyThemeToDocument(theme: CampaignTheme | GlobalTheme): void {
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
function removeThemeFromDocument(): void {
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
    '--glow-primary',
    '--glow-secondary',
    '--font-heading',
    '--font-body',
  ];

  themeVars.forEach((key) => {
    root.style.removeProperty(key);
  });
}

export interface ThemedContainerProps extends HTMLAttributes<HTMLDivElement> {
  theme: CampaignTheme | GlobalTheme;
  applyToDocument?: boolean;
  as?: 'div' | 'main' | 'section' | 'article';
  /** Enable glassmorphism background effect */
  glass?: boolean;
}

export const ThemedContainer = forwardRef<HTMLDivElement, ThemedContainerProps>(
  (
    {
      className = '',
      theme,
      applyToDocument = false,
      as: Component = 'div',
      glass = false,
      children,
      style,
      ...props
    },
    ref
  ) => {
    // Apply theme to document root if requested (useful for global themes)
    useEffect(() => {
      if (applyToDocument) {
        applyThemeToDocument(theme);
        return () => {
          removeThemeFromDocument();
        };
      }
    }, [applyToDocument, theme]);

    const themeStyle = getThemeStyle(theme);
    const combinedStyle = { ...themeStyle, ...style };

    // Determine font family styles if global theme
    const fontStyles: React.CSSProperties = {};
    if ('heading_font' in theme) {
      fontStyles.fontFamily = theme.body_font;
    }

    return (
      <Component
        ref={ref}
        className={cn(
          'min-h-screen bg-background text-foreground',
          glass && 'backdrop-blur-sm',
          className
        )}
        style={{ ...combinedStyle, ...fontStyles }}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

ThemedContainer.displayName = 'ThemedContainer';

/**
 * A simpler themed wrapper that doesn't apply full page styles
 */
export interface ThemedSectionProps extends HTMLAttributes<HTMLDivElement> {
  theme: CampaignTheme | GlobalTheme;
  /** Enable glassmorphism background effect */
  glass?: boolean;
}

export const ThemedSection = forwardRef<HTMLDivElement, ThemedSectionProps>(
  ({ className = '', theme, glass = false, children, style, ...props }, ref) => {
    const themeStyle = getThemeStyle(theme);

    return (
      <div
        ref={ref}
        className={cn(
          glass && 'glass backdrop-blur-md rounded-lg',
          className
        )}
        style={{ ...themeStyle, ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ThemedSection.displayName = 'ThemedSection';
