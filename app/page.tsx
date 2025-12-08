'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Header, Footer, ThemedContainer } from '@/components/layout';
import { Carousel, Button } from '@/components/ui';
import { MintFunCard } from '@/components/campaigns/MintFunCard';
import { QuestCard } from '@/components/campaigns/QuestCard';
import type { MintFunCampaign } from '@/types/campaign';
import type { QuestCampaign } from '@/types/quest';
import type { GlobalTheme, HomePageConfig } from '@/types/theme';
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
          .from('home_config')
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
          .from('mintfun_campaigns')
          .select('*, mint_tiers(*)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (mintfunData) {
          for (const row of mintfunData as (MintfunCampaignRow & { mint_tiers: MintTierRow[] })[]) {
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
                mint_tiers: row.mint_tiers.map(tier => ({
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
          .from('quest_campaigns')
          .select('*, quest_tasks(*), eligibility_conditions(*)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (questData) {
          for (const row of questData as (QuestCampaignRow & { quest_tasks: QuestTaskRow[]; eligibility_conditions: EligibilityConditionRow[] })[]) {
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
                tasks: row.quest_tasks.map(task => ({
                  id: task.id,
                  quest_id: task.quest_id,
                  type: task.type,
                  title: task.title,
                  description: task.description,
                  external_url: task.external_url,
                  verification_data: task.verification_data,
                  order_index: task.order_index,
                })),
                eligibility: row.eligibility_conditions?.[0] ? {
                  id: row.eligibility_conditions[0].id,
                  quest_id: row.eligibility_conditions[0].quest_id,
                  type: row.eligibility_conditions[0].type,
                  min_amount: row.eligibility_conditions[0].min_amount,
                  contract_address: row.eligibility_conditions[0].contract_address,
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
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-32">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary)]/10 via-transparent to-transparent" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {homeConfig.hero_subtitle && (
                <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                  {homeConfig.hero_subtitle}
                </p>
              )}
              <h1 
                className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
                style={{ fontFamily: homeConfig.theme.heading_font }}
              >
                {homeConfig.hero_title}
              </h1>
              {homeConfig.hero_description && (
                <p className="mx-auto mb-8 max-w-2xl text-lg text-[var(--color-text)]/70">
                  {homeConfig.hero_description}
                </p>
              )}
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" variant="primary">
                  Explore Campaigns
                </Button>
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Campaigns Carousel */}
        {featuredCampaigns.length > 0 && (
          <section className="py-16">
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
                  className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                  View All →
                </Link>
              </div>
              
              <Carousel autoPlay autoPlayInterval={6000} showDots showArrows>
                {/* Group campaigns into slides of 3 */}
                {chunkArray(featuredCampaigns, 3).map((group, slideIndex) => (
                  <div key={slideIndex} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {group.map((item) => (
                      item.type === 'mintfun' ? (
                        <MintFunCard key={item.campaign.id} campaign={item.campaign} />
                      ) : (
                        <QuestCard key={item.campaign.id} campaign={item.campaign} />
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
                {featuredCampaigns.map((item) => (
                  item.type === 'mintfun' ? (
                    <MintFunCard key={item.campaign.id} campaign={item.campaign} />
                  ) : (
                    <QuestCard key={item.campaign.id} campaign={item.campaign} />
                  )
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
                <p className="text-lg text-[var(--color-text)]/70">
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

// Loading skeleton component
function CampaignSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl bg-white/5">
      <div className="aspect-square bg-white/10" />
      <div className="p-4">
        <div className="mb-2 h-5 w-3/4 rounded bg-white/10" />
        <div className="h-4 w-full rounded bg-white/10" />
      </div>
      <div className="border-t border-white/10 p-4">
        <div className="h-4 w-1/2 rounded bg-white/10" />
      </div>
    </div>
  );
}
