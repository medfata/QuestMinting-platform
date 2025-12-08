'use client';

import { HTMLAttributes, forwardRef, useEffect } from 'react';
import type { CampaignTheme } from '@/types/campaign';
import type { GlobalTheme } from '@/types/theme';
import { getThemeStyle, applyThemeToDocument, removeThemeFromDocument } from '@/lib/utils/theme';

export interface ThemedContainerProps extends HTMLAttributes<HTMLDivElement> {
  theme: CampaignTheme | GlobalTheme;
  applyToDocument?: boolean;
  as?: 'div' | 'main' | 'section' | 'article';
}

export const ThemedContainer = forwardRef<HTMLDivElement, ThemedContainerProps>(
  (
    {
      className = '',
      theme,
      applyToDocument = false,
      as: Component = 'div',
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
        className={`min-h-screen bg-[var(--color-background)] text-[var(--color-text)] ${className}`}
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
}

export const ThemedSection = forwardRef<HTMLDivElement, ThemedSectionProps>(
  ({ className = '', theme, children, style, ...props }, ref) => {
    const themeStyle = getThemeStyle(theme);

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...themeStyle, ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ThemedSection.displayName = 'ThemedSection';
