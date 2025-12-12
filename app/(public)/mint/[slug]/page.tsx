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
import { TransactionStatus } from '@/components/campaigns/TransactionStatus';
import type { MintFunCampaign, MintTier, CampaignTheme } from '@/types/campaign';
import { toCampaignTheme } from '@/types/campaign';
import { DEFAULT_CAMPAIGN_THEME } from '@/types/theme';

// Chain info helper
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

function getChainInfo(chainId: number | null): { name: string; iconUrl: string } {
  const info = chainId ? CHAIN_INFO[chainId] : null;
  const name = info?.name || 'Unknown';
  const slug = info?.slug || 'ethereum';
  return {
    name,
    iconUrl: `https://icons.llamao.fi/icons/chains/rsz_${slug}.jpg`,
  };
}

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
  const [chainImgError, setChainImgError] = useState(false);
  
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
        <main className="flex min-h-screen items-center justify-center bg-background">
          <div className="relative">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary" />
          </div>
        </main>
        <Footer platformName={platformName} platformIcon={platformIcon} />
      </ThemedContainer>
    );
  }

  if (error || !campaign) {
    return (
      <ThemedContainer theme={DEFAULT_CAMPAIGN_THEME} as="div">
        <DynamicHead title={platformName} favicon={platformIcon} />
        <Header logoText={platformName} logoIcon={platformIcon} />
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <svg className="w-7 h-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-foreground">{error || 'Campaign not found'}</h1>
          <Link href="/mintfun">
            <Button variant="outline" size="sm">Back to MintFun</Button>
          </Link>
        </main>
        <Footer platformName={platformName} platformIcon={platformIcon} />
      </ThemedContainer>
    );
  }

  return (
    <ThemedContainer theme={theme} as="div" applyToDocument>
      <DynamicHead title={`${campaign.title} | ${platformName}`} favicon={platformIcon} />
      <Header logoText={platformName} logoIcon={platformIcon} />
      
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <Link
              href="/mintfun"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
          </nav>

          {/* Campaign Content */}
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Left: Image */}
            <div className="lg:col-span-2">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted/30 border border-border">
                <Image
                  src={campaign.image_url}
                  alt={campaign.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
              
              {/* Contract Info - Desktop */}
              <div className="hidden lg:block mt-4 p-4 rounded-xl bg-muted/30 border border-border">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Contract Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-mono text-foreground/80">{campaign.contract_address.slice(0, 6)}...{campaign.contract_address.slice(-4)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Network</span>
                    <span className="text-foreground/80">Chain {campaign.chain_id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Details & Minting */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                    MintFun
                  </span>
                  {/* Chain Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/50 border border-border">
                    <div className="relative w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                      {!chainImgError ? (
                        <Image
                          src={getChainInfo(campaign.chain_id).iconUrl}
                          alt={getChainInfo(campaign.chain_id).name}
                          fill
                          className="object-cover"
                          sizes="16px"
                          onError={() => setChainImgError(true)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-[8px] font-bold">
                          {getChainInfo(campaign.chain_id).name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-foreground/80">{getChainInfo(campaign.chain_id).name}</span>
                  </div>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  {campaign.title}
                </h1>
                {campaign.description && (
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {campaign.description}
                  </p>
                )}
              </div>

              {/* Mint Card */}
              <div className="rounded-2xl bg-card border border-border p-6">
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

                  {/* Divider */}
                  <div className="h-px bg-border" />

                  {/* Mint Button */}
                  {!isConnected ? (
                    <div className="space-y-3">
                      <p className="text-center text-sm text-muted-foreground">
                        Connect wallet to continue
                      </p>
                      <ConnectButton className="w-full" />
                    </div>
                  ) : isWrongChain ? (
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full"
                      onClick={() => switchChain({ chainId: campaign.chain_id })}
                    >
                      Switch Network
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full"
                      onClick={handleMint}
                      disabled={!selectedTier || isPending || isConfirming}
                      isLoading={isPending || isConfirming}
                    >
                      {isPending
                        ? 'Confirm in Wallet...'
                        : isConfirming
                          ? 'Processing...'
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
              </div>

              {/* Contract Info - Mobile */}
              <div className="lg:hidden p-4 rounded-xl bg-muted/30 border border-border">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Contract Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-mono text-foreground/80">{campaign.contract_address.slice(0, 6)}...{campaign.contract_address.slice(-4)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Network</span>
                    <span className="text-foreground/80">Chain {campaign.chain_id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer platformName={platformName} platformIcon={platformIcon} />
    </ThemedContainer>
  );
}
