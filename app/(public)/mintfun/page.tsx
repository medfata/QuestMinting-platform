'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Header, Footer, ThemedContainer, usePublicLoading, DynamicHead } from '@/components/layout';
import { MintFunCard } from '@/components/campaigns/MintFunCard';
import { CampaignFilters } from '@/components/campaigns/CampaignFilters';
import { InfiniteScroll } from '@/components/ui/InfiniteScroll';
import { useTheme } from '@/components/theme';
import { usePaginatedMintFun } from '@/hooks/usePaginatedCampaigns';
import type { HomePageConfig } from '@/types/theme';
import { DEFAULT_GLOBAL_THEME } from '@/types/theme';

const DEFAULT_HOME_CONFIG: HomePageConfig = {
  id: 'default',
  hero_title: 'Discover & Collect Digital Art',
  hero_subtitle: 'The Future of NFTs',
  hero_description: 'Explore exclusive collections, complete quests, and mint unique digital assets across multiple blockchains.',
  theme: DEFAULT_GLOBAL_THEME,
  featured_campaigns: [],
  platform_name: 'MintPlatform',
  platform_icon: null,
  updated_at: new Date().toISOString(),
};

export default function MintFunPage() {
  const { homeConfig: preloadedConfig } = usePublicLoading();
  const [homeConfig, setHomeConfig] = useState<HomePageConfig>(preloadedConfig || DEFAULT_HOME_CONFIG);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedChain, setSelectedChain] = useState<number | null>(null);
  const { resolvedTheme } = useTheme();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    campaigns,
    isLoading,
    isLoadingMore,
    hasMore,
    totalCount,
    availableChains,
    loadMore,
  } = usePaginatedMintFun(debouncedSearch, selectedChain);

  useEffect(() => {
    if (preloadedConfig) {
      setHomeConfig(preloadedConfig);
    }
  }, [preloadedConfig]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedChain(null);
  }, []);

  return (
    <ThemedContainer theme={homeConfig.theme} applyToDocument as="div">
      <div className="fixed inset-0 -z-10 overflow-hidden transition-colors duration-500">
        <div 
          className="absolute inset-0 transition-all duration-500"
          style={{
            background: resolvedTheme === 'light' 
              ? 'radial-gradient(ellipse at top, #f8f9ff, #f0f2ff, #e8eaff)'
              : 'radial-gradient(ellipse at top, #1a1a2e, #0f0f1a, #050510)'
          }}
        />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-primary/40 to-transparent rounded-full blur-[120px] animate-float" />
          <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-secondary/30 to-transparent rounded-full blur-[120px] animate-float" style={{ animationDelay: '-3s' }} />
        </div>
      </div>

      <DynamicHead 
        title={`MintFun | ${homeConfig.platform_name}`} 
        favicon={homeConfig.platform_icon} 
      />
      
      <Header logoText={homeConfig.platform_name} logoIcon={homeConfig.platform_icon} />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-24 pb-12 overflow-hidden">
          {/* Decorative gradient orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -translate-y-1/2" />
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-[100px] -translate-y-1/3" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group">
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
            
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div className="space-y-4">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    Explore Collections
                  </span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground" style={{ fontFamily: homeConfig.theme.heading_font }}>
                  <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift">
                    MintFun
                  </span>
                </h1>
                <p className="text-muted-foreground text-lg sm:text-xl max-w-xl">
                  Discover and collect unique digital art from creators around the world
                </p>
              </div>
              
              <CampaignFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedChain={selectedChain}
                onChainChange={setSelectedChain}
                availableChains={availableChains}
                className="lg:max-w-xl w-full lg:w-auto"
              />
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            {/* Results count */}
            {!isLoading && (
              <div className="flex items-center justify-between mb-8">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{totalCount}</span> {totalCount === 1 ? 'collection' : 'collections'}
                  {(debouncedSearch || selectedChain) && ' found'}
                </p>
                {(debouncedSearch || selectedChain) && (
                  <button 
                    onClick={handleClearFilters}
                    className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Grid */}
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] rounded-2xl glass animate-pulse" />
                ))}
              </div>
            ) : campaigns.length > 0 ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {campaigns.map((campaign, index) => (
                    <MintFunCard key={campaign.id} campaign={campaign} animationDelay={index < 10 ? index * 50 : 0} />
                  ))}
                </div>
                <InfiniteScroll
                  onLoadMore={loadMore}
                  hasMore={hasMore}
                  isLoading={isLoadingMore}
                />
              </>
            ) : (debouncedSearch || selectedChain) ? (
              <div className="rounded-2xl glass p-16 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-lg text-muted-foreground mb-2">No results match your filters</p>
                <p className="text-sm text-muted-foreground/70 mb-6">Try adjusting your search or filter criteria</p>
                <button 
                  onClick={handleClearFilters}
                  className="px-6 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="rounded-2xl glass p-16 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-lg text-foreground font-medium mb-2">No collections yet</p>
                <p className="text-muted-foreground">Check back soon for new drops!</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer platformName={homeConfig.platform_name} platformIcon={homeConfig.platform_icon} />
    </ThemedContainer>
  );
}
