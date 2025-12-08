'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Header, Footer, ThemedContainer } from '@/components/layout';
import { Carousel, Button } from '@/components/ui';
import { AnimatedBackground, FloatingParticles, GradientText } from '@/components/futuristic';
import { MintFunCard } from '@/components/campaigns/MintFunCard';
import { QuestCard } from '@/components/campaigns/QuestCard';
import type { MintFunCampaign } from '@/types/campaign';
import type { QuestCampaign } from '@/types/quest';
import type { HomePageConfig } from '@/types/theme';
import { DEFAULT_GLOBAL_THEME } from '@/types/theme';
import type { HomeConfigRow, MintfunCampaignRow, QuestCampaignRow, MintTierRow, QuestTaskRow, EligibilityConditionRow } from '@/types/database';
import { toCampaignTheme } from '@/types/campaign';

// Union type for featured campaigns
type FeaturedCampaign = 
  | { type: 'mintfun'; campaign: MintFunCampaign }
  | { type: 'quest'; campaign: QuestCampaign };

// Default home config when none exists in database
const DEFAULT_HOME_CONFIG: HomePageConfig = {
  id: 'default',
  hero_title: 'Discover & Mint NFTs',
  hero_subtitle: 'Multi-Chain Minting Platform',
  hero_description: 'Explore exclusive NFT collections and complete quests to earn free mints across multiple blockchains.',
  theme: DEFAULT_GLOBAL_THEME,
  featured_campaigns: [],
  updated_at: new Date().toISOString(),
};

export default function HomePage() {
  const [homeConfig, setHomeConfig] = useState<HomePageConfig>(DEFAULT_HOME_CONFIG);
  const [featuredCampaigns, setFeaturedCampaigns] = useState<FeaturedCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHomeData() {
      const supabase = createClient();

      try {
        // Fetch home config
        const { data: configData } = await supabase
          .from('mint_platform_home_config')
          .select('*')
          .limit(1)
          .single();

        if (configData) {
          const config = configData as HomeConfigRow;
          setHomeConfig({
            id: config.id,
            hero_title: config.hero_title,
            hero_subtitle: config.hero_subtitle,
            hero_description: config.hero_description,
            theme: {
              primary_color: config.theme.primary_color ?? DEFAULT_GLOBAL_THEME.primary_color,
              secondary_color: config.theme.secondary_color ?? DEFAULT_GLOBAL_THEME.secondary_color,
              background_color: config.theme.background_color ?? DEFAULT_GLOBAL_THEME.background_color,
              text_color: config.theme.text_color ?? DEFAULT_GLOBAL_THEME.text_color,
              heading_font: config.theme.heading_font ?? DEFAULT_GLOBAL_THEME.heading_font,
              body_font: config.theme.body_font ?? DEFAULT_GLOBAL_THEME.body_font,
            },
            featured_campaigns: config.featured_campaigns || [],
            updated_at: config.updated_at,
          });
        }

        // Fetch featured campaigns (both MintFun and Quest)
        const campaigns: FeaturedCampaign[] = [];

        // Fetch MintFun campaigns with tiers
        const { data: mintfunData } = await supabase
          .from('mint_platform_mintfun_campaigns')
          .select('*, mint_platform_mint_tiers(*)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (mintfunData) {
          for (const row of mintfunData as (MintfunCampaignRow & { mint_platform_mint_tiers: MintTierRow[] })[]) {
            campaigns.push({
              type: 'mintfun',
              campaign: {
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
              },
            });
          }
        }

        // Fetch Quest campaigns with tasks and eligibility
        const { data: questData } = await supabase
          .from('mint_platform_quest_campaigns')
          .select('*, mint_platform_quest_tasks(*), mint_platform_eligibility_conditions(*)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (questData) {
          for (const row of questData as (QuestCampaignRow & { mint_platform_quest_tasks: QuestTaskRow[]; mint_platform_eligibility_conditions: EligibilityConditionRow[] })[]) {
            campaigns.push({
              type: 'quest',
              campaign: {
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
              },
            });
          }
        }

        // Sort by featured order if featured_campaigns is set, otherwise by date
        if (configData?.featured_campaigns?.length) {
          const featuredIds = configData.featured_campaigns as string[];
          campaigns.sort((a, b) => {
            const aIndex = featuredIds.indexOf(a.campaign.id);
            const bIndex = featuredIds.indexOf(b.campaign.id);
            if (aIndex === -1 && bIndex === -1) return 0;
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
          });
        }

        setFeaturedCampaigns(campaigns);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHomeData();
  }, []);

  return (
    <ThemedContainer theme={homeConfig.theme} applyToDocument as="div">
      <Header />
      
      <main id="main-content" className="min-h-screen">
        {/* Hero Section with Futuristic Background */}
        <AnimatedBackground variant="hero" className="min-h-[90vh] flex items-center">
          <FloatingParticles count={20} speed="slow" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
            <div className="text-center">
              {/* Subtitle */}
              {homeConfig.hero_subtitle && (
                <p className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  {homeConfig.hero_subtitle}
                </p>
              )}
              
              {/* Hero title with gradient text */}
              <GradientText
                as="h1"
                className="mb-8 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
                style={{ fontFamily: homeConfig.theme.heading_font }}
                animate={true}
                animationDuration={6}
              >
                {homeConfig.hero_title}
              </GradientText>
              
              {/* Description */}
              {homeConfig.hero_description && (
                <p className="mx-auto mb-10 max-w-2xl text-lg sm:text-xl text-muted-foreground">
                  {homeConfig.hero_description}
                </p>
              )}
              
              {/* CTA Buttons with glow effects */}
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="xl" variant="glow">
                  Explore Campaigns
                </Button>
                <Button size="xl" variant="glass">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </AnimatedBackground>

        {/* Featured Campaigns Carousel */}
        {featuredCampaigns.length > 0 && (
          <section className="py-16 bg-gradient-to-b from-transparent to-background/50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-8 flex items-center justify-between">
                <h2 
                  className="text-2xl font-bold sm:text-3xl"
                  style={{ fontFamily: homeConfig.theme.heading_font }}
                >
                  Featured Campaigns
                </h2>
                <Link 
                  href="/campaigns" 
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  View All →
                </Link>
              </div>
              
              <Carousel autoPlay autoPlayInterval={6000} showDots showArrows>
                {/* Group campaigns into slides of 3 */}
                {chunkArray(featuredCampaigns, 3).map((group, slideIndex) => (
                  <div key={slideIndex} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 px-1">
                    {group.map((item, cardIndex) => (
                      item.type === 'mintfun' ? (
                        <MintFunCard 
                          key={item.campaign.id} 
                          campaign={item.campaign}
                          animationDelay={cardIndex * 100}
                        />
                      ) : (
                        <QuestCard 
                          key={item.campaign.id} 
                          campaign={item.campaign}
                          animationDelay={cardIndex * 100}
                        />
                      )
                    ))}
                  </div>
                ))}
              </Carousel>
            </div>
          </section>
        )}

        {/* All Campaigns Grid */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 
              className="mb-8 text-2xl font-bold sm:text-3xl"
              style={{ fontFamily: homeConfig.theme.heading_font }}
            >
              All Campaigns
            </h2>
            
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <CampaignSkeleton key={i} />
                ))}
              </div>
            ) : featuredCampaigns.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredCampaigns.map((item, index) => (
                  item.type === 'mintfun' ? (
                    <MintFunCard 
                      key={item.campaign.id} 
                      campaign={item.campaign} 
                      animationDelay={index * 100}
                    />
                  ) : (
                    <QuestCard 
                      key={item.campaign.id} 
                      campaign={item.campaign}
                      animationDelay={index * 100}
                    />
                  )
                ))}
              </div>
            ) : (
              <div className="rounded-xl glass p-12 text-center">
                <p className="text-lg text-muted-foreground">
                  No campaigns available yet. Check back soon!
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </ThemedContainer>
  );
}

// Helper function to chunk array into groups
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Loading skeleton component with futuristic styling
function CampaignSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl glass">
      <div className="aspect-square bg-white/5 motion-safe:animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', backgroundSize: '200% 100%' }} />
      <div className="p-4">
        <div className="mb-2 h-5 w-3/4 rounded bg-white/10 motion-safe:animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', backgroundSize: '200% 100%' }} />
        <div className="h-4 w-full rounded bg-white/10 motion-safe:animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', backgroundSize: '200% 100%' }} />
      </div>
      <div className="border-t border-white/10 p-4">
        <div className="h-4 w-1/2 rounded bg-white/10 motion-safe:animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', backgroundSize: '200% 100%' }} />
      </div>
    </div>
  );
}
