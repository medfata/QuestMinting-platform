'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAccount, useSwitchChain } from 'wagmi';
import { parseEther } from 'viem';
import { createClient } from '@/lib/supabase/client';
import { useMint } from '@/hooks/useMint';
import { Header, Footer, ThemedContainer, usePublicLoading, DynamicHead } from '@/components/layout';
import { MintTierSelector } from '@/components/campaigns/MintTierSelector';
import { Button } from '@/components/ui/Button';
import { GlowCard } from '@/components/futuristic/glow-card';
import { AnimatedBackground } from '@/components/futuristic/animated-background';
import { TransactionStatus } from '@/components/campaigns/TransactionStatus';
import type { MintFunCampaign, MintTier, CampaignTheme } from '@/types/campaign';
import { toCampaignTheme } from '@/types/campaign';
import { DEFAULT_CAMPAIGN_THEME } from '@/types/theme';

// Dynamically import ConnectButton to avoid SSR issues with Web3Modal
const ConnectButton = dynamic(
  () => import('@/components/wallet/ConnectButton').then((mod) => mod.ConnectButton),
  { ssr: false }
);

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function MintFunCampaignPage({ params }: PageProps) {
  const [slug, setSlug] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<MintFunCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<MintTier | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  const { homeConfig } = usePublicLoading();
  const platformName = homeConfig?.platform_name || 'MintPlatform';
  const platformIcon = homeConfig?.platform_icon || null;

  const { isConnected, chainId: connectedChainId } = useAccount();
  const { switchChain } = useSwitchChain();

  // Resolve params
  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  // Fetch campaign data
  useEffect(() => {
    if (!slug) return;

    async function fetchCampaign() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // Fetch campaign
        const { data: campaignData, error: campaignError } = await supabase
          .from('mint_platform_mintfun_campaigns')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (campaignError) {
          if (campaignError.code === 'PGRST116') {
            setError('Campaign not found');
          } else {
            throw campaignError;
          }
          return;
        }

        // Fetch mint tiers
        const { data: tiersData, error: tiersError } = await supabase
          .from('mint_platform_mint_tiers')
          .select('*')
          .eq('campaign_id', campaignData.id)
          .order('order_index', { ascending: true });

        if (tiersError) throw tiersError;

        const fullCampaign: MintFunCampaign = {
          ...campaignData,
          theme: toCampaignTheme(campaignData.theme || {}),
          mint_tiers: tiersData || [],
        };

        setCampaign(fullCampaign);

        // Auto-select first tier
        if (tiersData && tiersData.length > 0) {
          setSelectedTier(tiersData[0]);
        }
      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError('Failed to load campaign');
      } finally {
        setLoading(false);
      }
    }

    fetchCampaign();
  }, [slug]);

  // Minting hook
  const {
    mint,
    status: mintStatus,
    error: mintError,
    txHash,
    reset: resetMint,
    isPending,
    isConfirming,
    isSuccess,
  } = useMint({
    contractAddress: (campaign?.contract_address || '0x') as `0x${string}`,
    chainId: campaign?.chain_id || 1,
  });

  const isWrongChain = isConnected && campaign && connectedChainId !== campaign.chain_id;

  const handleMint = async () => {
    if (!selectedTier || !campaign) return;

    if (isWrongChain) {
      switchChain({ chainId: campaign.chain_id });
      return;
    }

    // Use the campaign's token_id for minting
    const tokenIdToMint = campaign.token_id ? parseInt(campaign.token_id) : selectedTier.order_index;
    // Convert price from ETH to wei string for the contract
    const priceInWei = parseEther(selectedTier.price || '0').toString();
    await mint(tokenIdToMint, quantity, priceInWei);
  };

  const theme: CampaignTheme = campaign?.theme || DEFAULT_CAMPAIGN_THEME;

  if (loading) {
    return (
      <ThemedContainer theme={DEFAULT_CAMPAIGN_THEME} as="div">
        <DynamicHead title={platformName} favicon={platformIcon} />
        <Header logoText={platformName} logoIcon={platformIcon} />
        <AnimatedBackground variant="subtle" className="min-h-screen">
          <main className="flex min-h-screen items-center justify-center">
            <div className="relative">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
              <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-full bg-primary/20 blur-xl" />
            </div>
          </main>
        </AnimatedBackground>
        <Footer platformName={platformName} platformIcon={platformIcon} />
      </ThemedContainer>
    );
  }

  if (error || !campaign) {
    return (
      <ThemedContainer theme={DEFAULT_CAMPAIGN_THEME} as="div">
        <DynamicHead title={platformName} favicon={platformIcon} />
        <Header logoText={platformName} logoIcon={platformIcon} />
        <AnimatedBackground variant="subtle" className="min-h-screen">
          <main className="flex min-h-screen flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{error || 'Campaign not found'}</h1>
            <Link href="/mintfun">
              <Button variant="glass">Back to MintFun</Button>
            </Link>
          </main>
        </AnimatedBackground>
        <Footer platformName={platformName} platformIcon={platformIcon} />
      </ThemedContainer>
    );
  }

  return (
    <ThemedContainer theme={theme} as="div" applyToDocument>
      <DynamicHead title={`${campaign.title} | ${platformName}`} favicon={platformIcon} />
      <Header logoText={platformName} logoIcon={platformIcon} />
      
      <AnimatedBackground variant="subtle" className="min-h-screen">
        <main className="pt-8 pb-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-8">
              <Link
                href="/mintfun"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to MintFun
              </Link>
            </nav>

            {/* Campaign Content */}
            <div className="grid gap-8 lg:grid-cols-2">
            {/* Left: Image */}
            <GlowCard
              glowColor="primary"
              intensity="low"
              hoverLift={false}
              className="relative aspect-square overflow-hidden"
              padding="none"
            >
              <Image
                src={campaign.image_url}
                alt={campaign.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </GlowCard>

            {/* Right: Details & Minting */}
            <div className="flex flex-col gap-6">
              <div className="motion-safe:animate-fade-in">
                <h1 className="mb-2 text-3xl font-bold text-foreground">
                  {campaign.title}
                </h1>
                {campaign.description && (
                  <p className="text-lg text-foreground/70">
                    {campaign.description}
                  </p>
                )}
              </div>

              <GlowCard
                glowColor="primary"
                intensity="medium"
                hoverLift={false}
                padding="lg"
                className="motion-safe:animate-fade-in"
                style={{ animationDelay: '100ms' }}
              >
                <div className="space-y-6">
                  {/* Tier Selection */}
                  <MintTierSelector
                    tiers={campaign.mint_tiers}
                    selectedTierId={selectedTier?.id || null}
                    onSelect={setSelectedTier}
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                    disabled={isPending || isConfirming}
                  />

                  {/* Mint Button */}
                  {!isConnected ? (
                    <div className="space-y-3">
                      <p className="text-center text-sm text-foreground/70">
                        Connect your wallet to mint
                      </p>
                      <ConnectButton className="w-full" />
                    </div>
                  ) : isWrongChain ? (
                    <Button
                      variant="glow"
                      size="lg"
                      className="w-full"
                      onClick={() => switchChain({ chainId: campaign.chain_id })}
                    >
                      Switch Network
                    </Button>
                  ) : (
                    <Button
                      variant="glow"
                      size="lg"
                      className="w-full"
                      onClick={handleMint}
                      disabled={!selectedTier || isPending || isConfirming}
                      isLoading={isPending || isConfirming}
                    >
                      {isPending
                        ? 'Confirm in Wallet...'
                        : isConfirming
                          ? 'Confirming...'
                          : 'Mint Now'}
                    </Button>
                  )}

                  {/* Transaction Status */}
                  <TransactionStatus
                    status={mintStatus}
                    error={mintError}
                    txHash={txHash}
                    onReset={resetMint}
                    chainId={campaign.chain_id}
                  />
                </div>
              </GlowCard>

              {/* Campaign Info */}
              <GlowCard
                glowColor="secondary"
                intensity="low"
                hoverLift={false}
                padding="md"
                className="motion-safe:animate-fade-in"
                style={{ animationDelay: '200ms' }}
              >
                <div className="text-sm text-foreground/50 space-y-1">
                  <p className="flex items-center justify-between">
                    <span>Contract</span>
                    <span className="font-mono text-foreground/70">{campaign.contract_address.slice(0, 6)}...{campaign.contract_address.slice(-4)}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Chain ID</span>
                    <span className="text-foreground/70">{campaign.chain_id}</span>
                  </p>
                </div>
              </GlowCard>
            </div>
          </div>
          </div>
        </main>
      </AnimatedBackground>

      <Footer platformName={platformName} platformIcon={platformIcon} />
    </ThemedContainer>
  );
}
