'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAccount, useSwitchChain } from 'wagmi';
import { createClient } from '@/lib/supabase/client';
import { useMint } from '@/hooks/useMint';
import { useEligibility } from '@/hooks/useEligibility';
import { useTaskVerification } from '@/hooks/useTaskVerification';
import { Header, Footer, ThemedContainer, usePublicLoading } from '@/components/layout';
import { TaskList } from '@/components/campaigns/TaskList';
import { EligibilityBadge } from '@/components/campaigns/EligibilityBadge';
import { TransactionStatus } from '@/components/campaigns/TransactionStatus';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import type { QuestCampaign, QuestTask, EligibilityCondition } from '@/types/quest';
import type { CampaignTheme } from '@/types/campaign';
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

export default function QuestCampaignPage({ params }: PageProps) {
  const [slug, setSlug] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<QuestCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          .from('mint_platform_quest_campaigns')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (campaignError) {
          if (campaignError.code === 'PGRST116') {
            setError('Quest not found');
          } else {
            throw campaignError;
          }
          return;
        }

        // Fetch tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('mint_platform_quest_tasks')
          .select('*')
          .eq('quest_id', campaignData.id)
          .order('order_index', { ascending: true });

        if (tasksError) throw tasksError;

        // Fetch eligibility condition
        const { data: eligibilityData } = await supabase
          .from('mint_platform_eligibility_conditions')
          .select('*')
          .eq('quest_id', campaignData.id)
          .single();

        const fullCampaign: QuestCampaign = {
          ...campaignData,
          theme: toCampaignTheme(campaignData.theme || {}),
          tasks: (tasksData || []) as QuestTask[],
          eligibility: (eligibilityData as EligibilityCondition) || null,
        };

        setCampaign(fullCampaign);
      } catch (err) {
        console.error('Error fetching quest:', err);
        setError('Failed to load quest');
      } finally {
        setLoading(false);
      }
    }

    fetchCampaign();
  }, [slug]);

  // Eligibility hook
  const {
    isEligible,
    isLoading: isEligibilityLoading,
    checkResult: eligibilityResult,
  } = useEligibility({
    condition: campaign?.eligibility || null,
    chainId: campaign?.chain_id || 1,
  });

  // Task verification hook
  const {
    completions,
    verifyingTaskId,
    verifyTask,
    allTasksCompleted,
  } = useTaskVerification({
    questId: campaign?.id || '',
    tasks: campaign?.tasks || [],
  });

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
  const canMint = isConnected && isEligible && allTasksCompleted && !isWrongChain;

  const handleMint = async () => {
    if (!campaign || !canMint) return;

    if (isWrongChain) {
      switchChain({ chainId: campaign.chain_id });
      return;
    }

    // Use the campaign's token_id for minting
    const tokenIdToMint = campaign.token_id ? parseInt(campaign.token_id) : 0;
    // Quest mints are free (price = 0)
    await mint(tokenIdToMint, 1, '0');
  };

  const theme: CampaignTheme = campaign?.theme || DEFAULT_CAMPAIGN_THEME;

  if (loading) {
    return (
      <ThemedContainer theme={DEFAULT_CAMPAIGN_THEME} as="div">
        <Header />
        <main className="flex min-h-screen items-center justify-center">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-full bg-primary/20 blur-xl" />
          </div>
        </main>
        <Footer />
      </ThemedContainer>
    );
  }

  if (error || !campaign) {
    return (
      <ThemedContainer theme={DEFAULT_CAMPAIGN_THEME} as="div">
        <Header />
        <main className="flex min-h-screen flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{error || 'Quest not found'}</h1>
          <Link href="/quests">
            <Button variant="glass">Back to Quests</Button>
          </Link>
        </main>
        <Footer />
      </ThemedContainer>
    );
  }

  return (
    <ThemedContainer theme={theme} as="div" applyToDocument>
      <Header />
      
      <main className="min-h-screen pt-8 pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Link
              href="/quests"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Quests
            </Link>
          </nav>

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
            <span className="absolute right-4 top-4 rounded-full bg-purple-500 px-3 py-1 text-sm font-semibold text-white">
              Quest
            </span>
          </div>

          {/* Right: Details & Tasks */}
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

            {/* Eligibility Badge */}
            <EligibilityBadge
              condition={campaign.eligibility}
              checkResult={eligibilityResult}
              isLoading={isEligibilityLoading}
              isConnected={isConnected}
            />

            {/* Tasks */}
            {campaign.tasks.length > 0 && (
              <Card variant="default" padding="lg">
                <CardContent>
                  <TaskList
                    tasks={campaign.tasks}
                    completions={completions}
                    onVerify={verifyTask}
                    verifyingTaskId={verifyingTaskId}
                    disabled={!isConnected || !isEligible}
                  />
                </CardContent>
              </Card>
            )}

            {/* Mint Section */}
            <Card variant="default" padding="lg">
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-[var(--color-text)]">
                    Reward
                  </span>
                  <span className="text-lg font-bold text-green-400">
                    Free Mint
                  </span>
                </div>

                {/* Mint Button */}
                {!isConnected ? (
                  <div className="space-y-3">
                    <p className="text-center text-sm text-[var(--color-text)]/70">
                      Connect your wallet to participate
                    </p>
                    <ConnectButton className="w-full" />
                  </div>
                ) : !isEligible ? (
                  <Button size="lg" className="w-full" disabled>
                    Not Eligible
                  </Button>
                ) : !allTasksCompleted ? (
                  <Button size="lg" className="w-full" disabled>
                    Complete All Tasks to Mint
                  </Button>
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
                    disabled={isPending || isConfirming}
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
              </CardContent>
            </Card>

            {/* Campaign Info */}
            <div className="text-sm text-muted-foreground/70 space-y-1">
              <p className="flex items-center justify-between">
                <span>Contract</span>
                <span className="font-mono text-foreground/70">{campaign.contract_address.slice(0, 6)}...{campaign.contract_address.slice(-4)}</span>
              </p>
              <p className="flex items-center justify-between">
                <span>Chain ID</span>
                <span className="text-foreground/70">{campaign.chain_id}</span>
              </p>
            </div>
          </div>
        </div>
        </div>
      </main>

      <Footer />
    </ThemedContainer>
  );
}
