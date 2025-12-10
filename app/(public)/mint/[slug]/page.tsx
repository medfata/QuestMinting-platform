'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAccount, useSwitchChain } from 'wagmi';
import { createClient } from '@/lib/supabase/client';
import { useMint } from '@/hooks/useMint';
import { ThemedContainer, usePublicLoading } from '@/components/layout';
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
    await mint(tokenIdToMint, quantity, selectedTier.price);
  };

  const theme: CampaignTheme = campaign?.theme || DEFAULT_CAMPAIGN_THEME;

  if (loading) {
    return (
      <ThemedContainer theme={DEFAULT_CAMPAIGN_THEME} as="main">
        <AnimatedBackground variant="subtle" className="min-h-screen">
          <div className="flex min-h-screen items-center justify-center">
            <div className="relative">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
              <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-full bg-primary/20 blur-xl" />
            </div>
          </div>
        </AnimatedBackground>
      </ThemedContainer>
    );
  }

  if (error || !campaign) {
    return (
      <ThemedContainer theme={DEFAULT_CAMPAIGN_THEME} as="main">
        <AnimatedBackground variant="subtle" className="min-h-screen">
          <div className="flex min-h-screen flex-col items-center justify-center gap-4">
            <h1 className="text-2xl font-bold">{error || 'Campaign not found'}</h1>
            <Link href="/">
              <Button variant="glass">Back to Home</Button>
            </Link>
          </div>
        </AnimatedBackground>
      </ThemedContainer>
    );
  }

  return (
    <ThemedContainer theme={theme} as="main" applyToDocument>
      <AnimatedBackground variant="subtle" className="min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-8">
          {/* Header */}
          <header className="mb-8 flex items-center justify-between">
            <Link
              href="/"
              className="group flex items-center gap-2 text-foreground/70 transition-colors hover:text-foreground"
            >
              <span className="transition-transform group-hover:-translate-x-1">←</span>
              <span>Back</span>
            </Link>
            <ConnectButton />
          </header>

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
      </AnimatedBackground>
    </ThemedContainer>
  );
}
