'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Header, Footer, ThemedContainer, usePublicLoading } from '@/components/layout';
import { Button, Carousel, SupportedChains } from '@/components/ui';
import { GradientText } from '@/components/futuristic';
import { MintFunCard } from '@/components/campaigns/MintFunCard';
import { QuestCard } from '@/components/campaigns/QuestCard';
import { useTheme } from '@/components/theme';
import type { MintFunCampaign } from '@/types/campaign';
import type { QuestCampaign } from '@/types/quest';
import type { HomePageConfig } from '@/types/theme';
import { DEFAULT_GLOBAL_THEME } from '@/types/theme';
import type { MintfunCampaignRow, QuestCampaignRow, MintTierRow, QuestTaskRow, EligibilityConditionRow } from '@/types/database';
import { toCampaignTheme } from '@/types/campaign';

// Chain info helper for displaying chain icons and names
const CHAIN_INFO: Record<number, { name: string; slug: string }> = {
  1: { name: 'Ethereum', slug: 'ethereum' },
  10: { name: 'Optimism', slug: 'optimism' },
  56: { name: 'BNB Chain', slug: 'bsc' },
  137: { name: 'Polygon', slug: 'polygon' },
  250: { name: 'Fantom', slug: 'fantom' },
  324: { name: 'zkSync', slug: 'zksync-era' },
  8453: { name: 'Base', slug: 'base' },
  42161: { name: 'Arbitrum', slug: 'arbitrum' },
  43114: { name: 'Avalanche', slug: 'avalanche' },
  59144: { name: 'Linea', slug: 'linea' },
  534352: { name: 'Scroll', slug: 'scroll' },
  81457: { name: 'Blast', slug: 'blast' },
  5000: { name: 'Mantle', slug: 'mantle' },
  34443: { name: 'Mode', slug: 'mode' },
  7777777: { name: 'Zora', slug: 'zora' },
  11155111: { name: 'Sepolia', slug: 'ethereum' },
};

function getChainInfo(chainId: number | null): { name: string; slug: string; iconUrl: string } {
  const info = chainId ? CHAIN_INFO[chainId] : null;
  const name = info?.name || 'Unknown';
  const slug = info?.slug || 'ethereum';
  return {
    name,
    slug,
    iconUrl: `https://icons.llamao.fi/icons/chains/rsz_${slug}.jpg`,
  };
}

// Combined campaign type for the carousel
type FeaturedCampaign = 
  | { type: 'mintfun'; data: MintFunCampaign }
  | { type: 'quest'; data: QuestCampaign };

// Default home config when none exists in database
const DEFAULT_HOME_CONFIG: HomePageConfig = {
  id: 'default',
  hero_title: 'Discover & Collect Digital Art',
  hero_subtitle: 'The Future of NFTs',
  hero_description: 'Explore exclusive collections, complete quests, and mint unique digital assets across multiple blockchains.',
  theme: DEFAULT_GLOBAL_THEME,
  featured_campaigns: [],
  updated_at: new Date().toISOString(),
};

export default function HomePage() {
  // Use pre-loaded config from the public loading provider
  const { homeConfig: preloadedConfig } = usePublicLoading();
  const [homeConfig, setHomeConfig] = useState<HomePageConfig>(preloadedConfig || DEFAULT_HOME_CONFIG);
  const [mintFunCampaigns, setMintFunCampaigns] = useState<MintFunCampaign[]>([]);
  const [questCampaigns, setQuestCampaigns] = useState<QuestCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { resolvedTheme } = useTheme();

  // Update homeConfig when preloaded config becomes available
  useEffect(() => {
    if (preloadedConfig) {
      setHomeConfig(preloadedConfig);
    }
  }, [preloadedConfig]);

  useEffect(() => {
    async function fetchHomeData() {
      const supabase = createClient();

      try {
        // Fetch MintFun campaigns
        const { data: mintfunData } = await supabase
          .from('mint_platform_mintfun_campaigns')
          .select('*, mint_platform_mint_tiers(*)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10);

        if (mintfunData) {
          const campaigns: MintFunCampaign[] = [];
          for (const row of mintfunData as (MintfunCampaignRow & { mint_platform_mint_tiers: MintTierRow[] })[]) {
            campaigns.push({
              id: row.id,
              slug: row.slug,
              title: row.title,
              description: row.description,
              image_url: row.image_url,
              chain_id: row.chain_id,
              contract_address: row.contract_address,
              mint_tiers: row.mint_platform_mint_tiers.map(tier => ({
                id: tier.id,
                campaign_id: tier.campaign_id,
                name: tier.name,
                quantity: tier.quantity,
                price: tier.price,
                max_per_wallet: tier.max_per_wallet,
                order_index: tier.order_index,
              })),
              theme: toCampaignTheme(row.theme),
              is_active: row.is_active,
              created_at: row.created_at,
              updated_at: row.updated_at,
            });
          }
          setMintFunCampaigns(campaigns);
        }

        // Fetch Quest campaigns
        const { data: questData } = await supabase
          .from('mint_platform_quest_campaigns')
          .select('*, mint_platform_quest_tasks(*), mint_platform_eligibility_conditions(*)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10);

        if (questData) {
          const campaigns: QuestCampaign[] = [];
          for (const row of questData as (QuestCampaignRow & { mint_platform_quest_tasks: QuestTaskRow[]; mint_platform_eligibility_conditions: EligibilityConditionRow[] })[]) {
            campaigns.push({
              id: row.id,
              slug: row.slug,
              title: row.title,
              description: row.description,
              image_url: row.image_url,
              chain_id: row.chain_id,
              contract_address: row.contract_address,
              tasks: row.mint_platform_quest_tasks.map(task => ({
                id: task.id,
                quest_id: task.quest_id,
                type: task.type,
                title: task.title,
                description: task.description,
                external_url: task.external_url,
                verification_data: task.verification_data,
                order_index: task.order_index,
              })),
              eligibility: row.mint_platform_eligibility_conditions?.[0] ? {
                id: row.mint_platform_eligibility_conditions[0].id,
                quest_id: row.mint_platform_eligibility_conditions[0].quest_id,
                type: row.mint_platform_eligibility_conditions[0].type,
                min_amount: row.mint_platform_eligibility_conditions[0].min_amount,
                contract_address: row.mint_platform_eligibility_conditions[0].contract_address,
              } : null,
              theme: toCampaignTheme(row.theme),
              is_active: row.is_active,
              created_at: row.created_at,
              updated_at: row.updated_at,
            });
          }
          setQuestCampaigns(campaigns);
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHomeData();
  }, []);

  // Combine and interleave campaigns for the featured carousel
  const featuredCampaigns: FeaturedCampaign[] = [];
  const maxLength = Math.max(mintFunCampaigns.length, questCampaigns.length);
  for (let i = 0; i < maxLength && featuredCampaigns.length < 10; i++) {
    if (i < mintFunCampaigns.length) {
      featuredCampaigns.push({ type: 'mintfun', data: mintFunCampaigns[i] });
    }
    if (i < questCampaigns.length && featuredCampaigns.length < 10) {
      featuredCampaigns.push({ type: 'quest', data: questCampaigns[i] });
    }
  }

  return (
    <ThemedContainer theme={homeConfig.theme} applyToDocument as="div">
      {/* Premium Background - Using resolvedTheme directly */}
      <div className="fixed inset-0 -z-10 overflow-hidden transition-colors duration-500">
        {/* Base gradient - controlled by React state */}
        <div 
          className="absolute inset-0 transition-all duration-500"
          style={{
            background: resolvedTheme === 'light' 
              ? 'radial-gradient(ellipse at top, #f8f9ff, #f0f2ff, #e8eaff)'
              : 'radial-gradient(ellipse at top, #1a1a2e, #0f0f1a, #050510)'
          }}
        />
        
        {/* Animated mesh gradient */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-primary/40 to-transparent rounded-full blur-[120px] animate-float" />
          <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-secondary/30 to-transparent rounded-full blur-[120px] animate-float" style={{ animationDelay: '-3s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full blur-[100px] animate-pulse-glow" />
        </div>

        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />
        
        {/* Grid lines */}
        <div 
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            opacity: resolvedTheme === 'light' ? 0.04 : 0.02,
            backgroundImage: resolvedTheme === 'light'
              ? 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)'
              : 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '100px 100px'
          }}
        />
      </div>

      <Header />
      
      <main id="main-content" className="min-h-screen">
        {/* Hero Section - Split Layout */}
        <section className="relative min-h-[calc(100vh-4rem)] flex items-center">
          <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Side - Text Content */}
              <div className="space-y-8">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {homeConfig.hero_subtitle}
                  </span>
                </div>

                {/* Main Heading */}
                <GradientText
                  as="h1"
                  className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1]"
                  style={{ fontFamily: homeConfig.theme.heading_font }}
                  animate={true}
                  animationDuration={8}
                >
                  {homeConfig.hero_title}
                </GradientText>

                {/* Description */}
                <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
                  {homeConfig.hero_description}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-8 pt-4">
                  <div>
                    <div className="text-3xl font-bold text-foreground">{mintFunCampaigns.length + questCampaigns.length}+</div>
                    <div className="text-sm text-muted-foreground">Active Drops</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground">Multi</div>
                    <div className="text-sm text-muted-foreground">Chain Support</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground">Free</div>
                    <div className="text-sm text-muted-foreground">Quest Mints</div>
                  </div>
                </div>

                {/* Supported Chains - Inline in Hero */}
                <SupportedChains showTitle={false} className="py-0 -mx-4 sm:mx-0" compact />

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-4 pt-4">
                  <Button size="xl" variant="glow" asChild>
                    <Link href="#explore">Explore Drops</Link>
                  </Button>
                  <Button size="xl" variant="glass" asChild>
                    <Link href="#quests">View Quests</Link>
                  </Button>
                </div>
              </div>

              {/* Right Side - Featured Carousel */}
              <div className="relative">
                {/* Glow effect behind carousel */}
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-3xl blur-2xl opacity-50" />
                
                <div className="relative">
                  {/* Carousel */}
                  {isLoading ? (
                    <div className="aspect-[4/5] rounded-2xl glass animate-pulse" />
                  ) : featuredCampaigns.length > 0 ? (
                    <Carousel 
                      autoPlay 
                      autoPlayInterval={5000} 
                      showDots 
                      showArrows
                      fadeTransition
                      className="rounded-2xl overflow-hidden"
                    >
                      {featuredCampaigns.map((campaign) => (
                        <div key={`${campaign.type}-${campaign.data.id}`} className="px-1">
                          <FeaturedCard campaign={campaign} />
                        </div>
                      ))}
                    </Carousel>
                  ) : (
                    <div className="aspect-[4/5] rounded-2xl glass flex items-center justify-center">
                      <p className="text-muted-foreground">No campaigns available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MintFun Section */}
        <section id="explore" className="py-20 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2" style={{ fontFamily: homeConfig.theme.heading_font }}>
                  MintFun
                </h2>
                <p className="text-muted-foreground text-lg">Discover and collect unique digital art</p>
              </div>
              <Link 
                href="/mintfun" 
                className="hidden sm:flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                View All
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* MintFun Grid */}
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <CampaignSkeleton key={i} />
                ))}
              </div>
            ) : mintFunCampaigns.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {mintFunCampaigns.slice(0, 8).map((campaign, index) => (
                  <MintFunCard 
                    key={campaign.id} 
                    campaign={campaign}
                    animationDelay={index * 100}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl glass p-12 text-center">
                <p className="text-lg text-muted-foreground">No mints available yet. Check back soon!</p>
              </div>
            )}

            {/* Mobile View All Link */}
            <div className="mt-8 sm:hidden text-center">
              <Link 
                href="/mintfun" 
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                View All MintFun
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Quests Section */}
        <section id="quests" className="py-20 lg:py-32 relative">
          {/* Section background accent */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent pointer-events-none" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2" style={{ fontFamily: homeConfig.theme.heading_font }}>
                  Quests
                </h2>
                <p className="text-muted-foreground text-lg">Complete tasks and earn free mints</p>
              </div>
              <Link 
                href="/quests" 
                className="hidden sm:flex items-center gap-2 text-secondary hover:text-secondary/80 transition-colors font-medium"
              >
                View All
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* Quests Grid */}
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <CampaignSkeleton key={i} />
                ))}
              </div>
            ) : questCampaigns.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {questCampaigns.slice(0, 8).map((campaign, index) => (
                  <QuestCard 
                    key={campaign.id} 
                    campaign={campaign}
                    animationDelay={index * 100}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl glass p-12 text-center">
                <p className="text-lg text-muted-foreground">No quests available yet. Check back soon!</p>
              </div>
            )}

            {/* Mobile View All Link */}
            <div className="mt-8 sm:hidden text-center">
              <Link 
                href="/quests" 
                className="inline-flex items-center gap-2 text-secondary hover:text-secondary/80 transition-colors font-medium"
              >
                View All Quests
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </ThemedContainer>
  );
}

// Unified Featured Card for Carousel - shows chain info and type badge
function FeaturedCard({ campaign }: { campaign: FeaturedCampaign }) {
  const { type, data } = campaign;
  const isMintFun = type === 'mintfun';
  const mintData = isMintFun ? (data as MintFunCampaign) : null;
  const questData = !isMintFun ? (data as QuestCampaign) : null;
  
  const chainInfo = getChainInfo(data.chain_id);
  const [chainImgError, setChainImgError] = useState(false);
  
  // Check if mint is free
  const isFree = mintData?.mint_tiers?.some(tier => BigInt(tier.price || '0') === BigInt(0));
  
  const href = isMintFun ? `/mint/${data.slug}` : `/quest/${data.slug}`;
  const ctaText = isMintFun ? 'Mint Now' : 'Start Quest';
  const ctaColor = isMintFun ? 'text-primary' : 'text-secondary';
  const subInfo = isMintFun 
    ? `${mintData?.mint_tiers.length || 0} tier${(mintData?.mint_tiers.length || 0) !== 1 ? 's' : ''}`
    : `${questData?.tasks.length || 0} task${(questData?.tasks.length || 0) !== 1 ? 's' : ''}`;

  return (
    <Link href={href} className="block group">
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden glass">
        <Image
          src={data.image_url}
          alt={data.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-6">
          {isFree && (
            <span className="inline-block px-3 py-1 mb-3 text-xs font-semibold bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
              Free Mint
            </span>
          )}
          <h3 className="text-2xl font-bold text-white mb-2">{data.title}</h3>
          
          {/* Chain + Type badges - under title */}
          <div className="flex items-center gap-2 mb-3">
            {/* Chain badge with icon */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
              <div className="relative w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                {!chainImgError ? (
                  <Image
                    src={chainInfo.iconUrl}
                    alt={chainInfo.name}
                    fill
                    className="object-cover"
                    sizes="16px"
                    onError={() => setChainImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/20 text-white text-[8px] font-bold">
                    {chainInfo.name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-white/90">{chainInfo.name}</span>
            </div>
            
            {/* Type badge */}
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
              isMintFun 
                ? 'bg-primary/20 text-primary border border-primary/30' 
                : 'bg-secondary/20 text-secondary border border-secondary/30'
            }`}>
              {isMintFun ? 'MintFun' : 'Quest'}
            </span>
          </div>
          
          {data.description && (
            <p className="text-white/70 line-clamp-2 mb-4">{data.description}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">{subInfo}</span>
            <span className={`inline-flex items-center gap-1 ${ctaColor} font-medium group-hover:gap-2 transition-all`}>
              {ctaText}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Loading skeleton component
function CampaignSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl glass">
      <div className="aspect-square bg-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
      </div>
      <div className="border-t border-border p-4">
        <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}
