'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { createClient } from '@/lib/supabase/client';
import { toCampaignTheme } from '@/types/campaign';
import type { XpQuestCampaign } from '@/types/xpQuest';
import type { CampaignTheme } from '@/types/campaign';
import { DEFAULT_CAMPAIGN_THEME } from '@/types/theme';
import { Header, Footer, ThemedContainer, usePublicLoading, DynamicHead } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// Chain info helper
const CHAIN_INFO: Record<number, { name: string; slug: string }> = {
  1: { name: 'Ethereum', slug: 'ethereum' },
  10: { name: 'Optimism', slug: 'optimism' },
  56: { name: 'BNB Chain', slug: 'bsc' },
  137: { name: 'Polygon', slug: 'polygon' },
  324: { name: 'zkSync', slug: 'zksync-era' },
  8453: { name: 'Base', slug: 'base' },
  42161: { name: 'Arbitrum', slug: 'arbitrum' },
  57073: { name: 'Ink', slug: 'ink' },
  59144: { name: 'Linea', slug: 'linea' },
  534352: { name: 'Scroll', slug: 'scroll' },
  81457: { name: 'Blast', slug: 'blast' },
  7777777: { name: 'Zora', slug: 'zora' },
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

// Dynamically import ConnectButton to avoid SSR issues
const ConnectButton = dynamic(
  () => import('@/components/wallet/ConnectButton').then((mod) => mod.ConnectButton),
  { ssr: false }
);

export default function XpQuestPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { address, isConnected } = useAccount();

  const [quest, setQuest] = useState<XpQuestCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chainImgError, setChainImgError] = useState(false);
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionData, setCompletionData] = useState<{ tx_hash: string | null; xp_awarded: number } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [hasVisited, setHasVisited] = useState(false);

  const { homeConfig } = usePublicLoading();
  const platformName = homeConfig?.platform_name || 'MintPlatform';
  const platformIcon = homeConfig?.platform_icon || null;


  // Fetch quest data
  useEffect(() => {
    async function fetchQuest() {
      const supabase = createClient();
      
      const { data, error: fetchError } = await supabase
        .from('mint_platform_xp_quest_campaigns')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (fetchError || !data) {
        setError('Quest not found');
        setLoading(false);
        return;
      }

      setQuest({
        ...data,
        theme: toCampaignTheme(data.theme || {}),
      });
      setLoading(false);
    }

    fetchQuest();
  }, [slug]);

  // Check completion status
  useEffect(() => {
    async function checkCompletion() {
      if (!quest || !address) return;

      const supabase = createClient();
      const { data } = await supabase
        .from('mint_platform_xp_quest_completions')
        .select('tx_hash, xp_awarded')
        .eq('quest_id', quest.id)
        .eq('wallet_address', address.toLowerCase())
        .single();

      if (data) {
        setIsCompleted(true);
        setCompletionData(data);
      }
    }

    checkCompletion();
  }, [quest, address]);

  // Handle opening external URL
  const handleGoToTask = useCallback(() => {
    if (quest) {
      window.open(quest.external_url, '_blank', 'noopener,noreferrer');
      setHasVisited(true);
    }
  }, [quest]);

  // Handle verification
  const handleVerify = useCallback(async () => {
    if (!quest || !address || isVerifying || isCompleted) return;

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const response = await fetch('/api/xp-quest/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questId: quest.id,
          walletAddress: address,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.verified) {
        setVerifyError(result.error || 'Verification failed. Complete the task and try again.');
        return;
      }

      setIsCompleted(true);
      setCompletionData({
        tx_hash: result.txHash,
        xp_awarded: result.xpAwarded,
      });
    } catch (err) {
      setVerifyError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [quest, address, isVerifying, isCompleted]);

  // Format duration for display
  const formatDuration = (seconds: number) => {
    if (seconds >= 86400) return `${Math.floor(seconds / 86400)} day${seconds >= 172800 ? 's' : ''}`;
    if (seconds >= 3600) return `${Math.floor(seconds / 3600)} hour${seconds >= 7200 ? 's' : ''}`;
    if (seconds >= 60) return `${Math.floor(seconds / 60)} minute${seconds >= 120 ? 's' : ''}`;
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  };

  const theme: CampaignTheme = quest?.theme || DEFAULT_CAMPAIGN_THEME;

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

  if (error || !quest) {
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
          <h1 className="text-xl font-semibold text-foreground">{error || 'Quest not found'}</h1>
          <Link href="/">
            <Button variant="outline" size="sm">Back to Home</Button>
          </Link>
        </main>
        <Footer platformName={platformName} platformIcon={platformIcon} />
      </ThemedContainer>
    );
  }


  return (
    <ThemedContainer theme={theme} as="div" applyToDocument>
      <DynamicHead title={`${quest.title} | ${platformName}`} favicon={platformIcon} />
      <Header logoText={platformName} logoIcon={platformIcon} />
      
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
          </nav>

          {/* Quest Content */}
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Left: Image */}
            <div className="lg:col-span-2">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted/30 border border-border">
                <Image
                  src={quest.image_url}
                  alt={quest.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                {/* XP Badge Overlay */}
                <div className="absolute top-4 right-4">
                  <div 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm shadow-lg"
                    style={{ 
                      backgroundColor: theme.secondary_color,
                      color: '#ffffff'
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    +{quest.xp_reward} XP
                  </div>
                </div>
              </div>
              
              {/* Quest Info - Desktop */}
              <div className="hidden lg:block mt-4 p-4 rounded-xl bg-muted/30 border border-border">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Quest Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Verification</span>
                    <div className="flex items-center gap-1.5">
                      <div className="relative w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                        {!chainImgError ? (
                          <Image
                            src={getChainInfo(quest.verification_chain_id).iconUrl}
                            alt={getChainInfo(quest.verification_chain_id).name}
                            fill
                            className="object-cover"
                            sizes="16px"
                            onError={() => setChainImgError(true)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-[8px] font-bold">
                            {getChainInfo(quest.verification_chain_id).name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="text-foreground/80">{getChainInfo(quest.verification_chain_id).name}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Time Window</span>
                    <span className="text-foreground/80">{formatDuration(quest.duration_seconds)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Contract</span>
                    <span className="font-mono text-foreground/80">{quest.verification_contract.slice(0, 6)}...{quest.verification_contract.slice(-4)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Details & Actions */}
            <div className="lg:col-span-3 flex flex-col gap-5">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span 
                    className="px-2.5 py-0.5 text-xs font-medium rounded-full border"
                    style={{ 
                      backgroundColor: `${theme.secondary_color}15`,
                      color: theme.secondary_color,
                      borderColor: `${theme.secondary_color}30`
                    }}
                  >
                    XP Quest
                  </span>
                  {/* Chain Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/50 border border-border">
                    <div className="relative w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                      {!chainImgError ? (
                        <Image
                          src={getChainInfo(quest.verification_chain_id).iconUrl}
                          alt={getChainInfo(quest.verification_chain_id).name}
                          fill
                          className="object-cover"
                          sizes="16px"
                          onError={() => setChainImgError(true)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-[8px] font-bold">
                          {getChainInfo(quest.verification_chain_id).name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-foreground/80">{getChainInfo(quest.verification_chain_id).name}</span>
                  </div>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  {quest.title}
                </h1>
                {quest.description && (
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {quest.description}
                  </p>
                )}
              </div>

              {/* XP Reward Card */}
              <div 
                className="rounded-2xl p-5 border"
                style={{ 
                  backgroundColor: `${theme.secondary_color}10`,
                  borderColor: `${theme.secondary_color}30`
                }}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="flex h-14 w-14 items-center justify-center rounded-xl"
                    style={{ backgroundColor: theme.secondary_color }}
                  >
                    <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reward</p>
                    <p className="text-2xl font-bold" style={{ color: theme.secondary_color }}>
                      +{quest.xp_reward} XP
                    </p>
                  </div>
                </div>
              </div>


              {/* Completion Status */}
              {isCompleted && completionData && (
                <div className="rounded-2xl bg-green-500/10 border border-green-500/30 p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-600 dark:text-green-400">Quest Completed!</p>
                      <p className="text-sm text-green-600/70 dark:text-green-400/70">
                        You earned {completionData.xp_awarded} XP
                      </p>
                    </div>
                    {completionData.tx_hash && (
                      <a
                        href={`https://explorer.inkonchain.com/tx/${completionData.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400 hover:underline"
                      >
                        View tx
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Action Section */}
              {!isCompleted && (
                <div className="rounded-2xl bg-card border border-border p-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-border">
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        How to Complete
                      </span>
                    </div>

                    {/* Steps */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div 
                          className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: theme.primary_color }}
                        >
                          1
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Go to the external task</p>
                          <p className="text-xs text-muted-foreground">Complete the required action on the platform</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div 
                          className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: theme.primary_color }}
                        >
                          2
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Verify your completion</p>
                          <p className="text-xs text-muted-foreground">We&apos;ll check the blockchain to confirm your action</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div 
                          className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: theme.primary_color }}
                        >
                          3
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Earn your XP</p>
                          <p className="text-xs text-muted-foreground">XP is awarded on-chain within {formatDuration(quest.duration_seconds)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {!isConnected ? (
                      <div className="space-y-3 pt-2">
                        <p className="text-center text-sm text-muted-foreground">
                          Connect wallet to complete this quest
                        </p>
                        <ConnectButton className="w-full" />
                      </div>
                    ) : (
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={handleGoToTask}
                            className="w-full"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            Go to Task
                          </Button>
                          <Button
                            size="lg"
                            onClick={handleVerify}
                            disabled={isVerifying}
                            isLoading={isVerifying}
                            className={cn(
                              'w-full',
                              hasVisited ? '' : 'opacity-70'
                            )}
                            style={{
                              backgroundColor: hasVisited ? theme.primary_color : undefined,
                            }}
                          >
                            {isVerifying ? (
                              'Verifying...'
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                  <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                Verify
                              </>
                            )}
                          </Button>
                        </div>

                        {verifyError && (
                          <p className="text-sm text-red-400 text-center">{verifyError}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quest Info - Mobile */}
              <div className="lg:hidden p-4 rounded-xl bg-muted/30 border border-border">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Quest Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Verification</span>
                    <span className="text-foreground/80">{getChainInfo(quest.verification_chain_id).name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Time Window</span>
                    <span className="text-foreground/80">{formatDuration(quest.duration_seconds)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Contract</span>
                    <span className="font-mono text-foreground/80">{quest.verification_contract.slice(0, 6)}...{quest.verification_contract.slice(-4)}</span>
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
