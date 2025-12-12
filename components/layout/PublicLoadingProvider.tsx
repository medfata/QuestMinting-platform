'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { GlobalTheme, HomePageConfig } from '@/types/theme';
import { DEFAULT_GLOBAL_THEME } from '@/types/theme';
import type { HomeConfigRow } from '@/types/database';

interface PublicLoadingContextType {
  isLoading: boolean;
  homeConfig: HomePageConfig | null;
  theme: GlobalTheme;
}

const PublicLoadingContext = createContext<PublicLoadingContextType>({
  isLoading: true,
  homeConfig: null,
  theme: DEFAULT_GLOBAL_THEME,
});

export function usePublicLoading() {
  return useContext(PublicLoadingContext);
}

interface PublicLoadingProviderProps {
  children: ReactNode;
}

export function PublicLoadingProvider({ children }: PublicLoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [homeConfig, setHomeConfig] = useState<HomePageConfig | null>(null);
  const [theme, setTheme] = useState<GlobalTheme>(DEFAULT_GLOBAL_THEME);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const supabase = createClient();
        const { data: configData } = await supabase
          .from('mint_platform_home_config')
          .select('*')
          .limit(1)
          .single();

        if (configData) {
          const config = configData as HomeConfigRow;
          const loadedTheme: GlobalTheme = {
            primary_color: config.theme.primary_color ?? DEFAULT_GLOBAL_THEME.primary_color,
            secondary_color: config.theme.secondary_color ?? DEFAULT_GLOBAL_THEME.secondary_color,
            background_color: config.theme.background_color ?? DEFAULT_GLOBAL_THEME.background_color,
            text_color: config.theme.text_color ?? DEFAULT_GLOBAL_THEME.text_color,
            heading_font: config.theme.heading_font ?? DEFAULT_GLOBAL_THEME.heading_font,
            body_font: config.theme.body_font ?? DEFAULT_GLOBAL_THEME.body_font,
          };
          setTheme(loadedTheme);
          setHomeConfig({
            id: config.id,
            hero_title: config.hero_title,
            hero_subtitle: config.hero_subtitle,
            hero_description: config.hero_description,
            theme: loadedTheme,
            featured_campaigns: config.featured_campaigns || [],
            platform_name: config.platform_name || 'MintPlatform',
            platform_icon: config.platform_icon || null,
            updated_at: config.updated_at,
          });
        }
      } catch (error) {
        console.error('Error fetching home config:', error);
      } finally {
        // Small delay to ensure smooth transition
        setTimeout(() => setIsLoading(false), 100);
      }
    }

    fetchConfig();
  }, []);

  return (
    <PublicLoadingContext.Provider value={{ isLoading, homeConfig, theme }}>
      {isLoading ? <LoadingScreen /> : children}
    </PublicLoadingContext.Provider>
  );
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      
      {/* Loading content */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Animated logo/spinner */}
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 blur-xl animate-pulse-glow" />
          
          {/* Spinner */}
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Loading text */}
        <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
