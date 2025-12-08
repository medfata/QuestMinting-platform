'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAccount, useSwitchChain } from 'wagmi';
import { createClient } from '@/lib/supabase/client';
import { useMint } from '@/hooks/useMint';
import { ThemedContainer } from '@/components/layout/ThemedContainer';
import { MintTierSelector } from '@/components/campaigns/MintTierSelector';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
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
          .from('mintfun_campaigns')
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
          .from('mint_tiers')
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

    // Use tier order_index as tierId for the contract
    await mint(selectedTier.order_index, quantity, selectedTier.price);
  };

  const theme: CampaignTheme = campaign?.theme || DEFAULT_CAMPAIGN_THEME;

  if (loading) {
    return (
      <ThemedContainer theme={DEFAULT_CAMPAIGN_THEME} as="main">
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        </div>
      </ThemedContainer>
    );
  }

  if (error || !campaign) {
    return (
      <ThemedContainer theme={DEFAULT_CAMPAIGN_THEME} as="main">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">{error || 'Campaign not found'}</h1>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </ThemedContainer>
    );
  }

  return (
    <ThemedContainer theme={theme} as="main" applyToDocument>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-[var(--color-text)]/70 transition-colors hover:text-[var(--color-text)]"
          >
            ← Back
          </Link>
          <ConnectButton />
        </header>

        {/* Campaign Content */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl">
            <Image
              src={campaign.image_url}
              alt={campaign.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          {/* Right: Details & Minting */}
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-[var(--color-text)]">
                {campaign.title}
              </h1>
              {campaign.description && (
                <p className="text-lg text-[var(--color-text)]/70">
                  {campaign.description}
                </p>
              )}
            </div>

            <Card variant="default" padding="lg">
              <CardContent className="space-y-6">
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
                    <p className="text-center text-sm text-[var(--color-text)]/70">
                      Connect your wallet to mint
                    </p>
                    <ConnectButton className="w-full" />
                  </div>
                ) : isWrongChain ? (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => switchChain({ chainId: campaign.chain_id })}
                  >
                    Switch Network
                  </Button>
                ) : (
                  <Button
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

                {/* Status Messages */}
                {mintError && (
                  <div className="rounded-lg bg-red-500/10 p-4 text-center">
                    <p className="text-sm text-red-400">{mintError.message}</p>
                    <button
                      onClick={resetMint}
                      className="mt-2 text-xs text-red-400 underline hover:no-underline"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {isSuccess && txHash && (
                  <div className="rounded-lg bg-green-500/10 p-4 text-center">
                    <p className="mb-2 text-sm font-medium text-green-400">
                      Mint successful!
                    </p>
                    <a
                      href={`https://etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-400 underline hover:no-underline"
                    >
                      View transaction
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Campaign Info */}
            <div className="text-sm text-[var(--color-text)]/50">
              <p>Contract: {campaign.contract_address}</p>
              <p>Chain ID: {campaign.chain_id}</p>
            </div>
          </div>
        </div>
      </div>
    </ThemedContainer>
  );
}
