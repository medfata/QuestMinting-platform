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
import { ThemedContainer, usePublicLoading } from '@/components/layout';
import { TaskList } from '@/components/campaigns/TaskList';
import { EligibilityBadge } from '@/components/campaigns/EligibilityBadge';
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
          <h1 className="text-2xl font-bold">{error || 'Quest not found'}</h1>
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
