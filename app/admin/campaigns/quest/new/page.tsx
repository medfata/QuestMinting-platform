'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useSwitchChain } from 'wagmi';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CampaignForm, CampaignFormData, ImageUploadMode, CampaignImages } from '@/components/admin/CampaignForm';
import { TaskEditor } from '@/components/admin/TaskEditor';
import { EligibilityEditor } from '@/components/admin/EligibilityEditor';
import { ThemeEditor } from '@/components/admin/ThemeEditor';
import { useCreateToken } from '@/hooks/useCreateToken';
import type { CampaignTheme } from '@/types/campaign';
import type { QuestTaskInput, EligibilityConditionInput } from '@/types/quest';
import type { SupportedChain } from '@/types/chain';
import { DEFAULT_CAMPAIGN_THEME } from '@/types/theme';

export default function NewQuestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedChain, setSelectedChain] = useState<SupportedChain | null>(null);
  const [tokenCreationStep, setTokenCreationStep] = useState<'form' | 'creating' | 'done'>('form');

  const { address, chainId: connectedChainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const {
    createToken,
    status: createTokenStatus,
    error: createTokenError,
    txHash: createTokenTxHash,
    reset: resetCreateToken,
    isPending: isTokenPending,
    isConfirming: isTokenConfirming,
    isSuccess: isTokenSuccess,
  } = useCreateToken();

  const [formData, setFormData] = useState<CampaignFormData>({
    slug: '',
    title: '',
    description: '',
    image_url: '',
    image_ipfs_url: '',
    metadata_ipfs_url: '',
    chain_id: 0,
    contract_address: '',
    is_active: true,
  });

  // Token ID will be generated based on timestamp for uniqueness
  const [tokenId, setTokenId] = useState<bigint>(BigInt(0));
  
  // Image upload state
  const [imageUploadMode, setImageUploadMode] = useState<ImageUploadMode>('single');
  const [campaignImages, setCampaignImages] = useState<CampaignImages>({});

  const [tasks, setTasks] = useState<QuestTaskInput[]>([
    {
      type: 'twitter_follow',
      title: 'Follow us on Twitter',
      description: null,
      external_url: '',
      verification_data: {},
      order_index: 0,
    },
  ]);

  const [eligibility, setEligibility] = useState<EligibilityConditionInput | null>(null);
  const [theme, setTheme] = useState<CampaignTheme>(DEFAULT_CAMPAIGN_THEME);

  const isWrongChain = selectedChain && connectedChainId !== selectedChain.chain_id;
  
  // Track if we've already processed the success to prevent double saves
  const hasProcessedSuccess = useRef(false);

  // Reset the ref when starting a new token creation
  useEffect(() => {
    if (tokenCreationStep === 'form') {
      hasProcessedSuccess.current = false;
    }
  }, [tokenCreationStep]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
    if (!formData.image_url.trim()) newErrors.image_url = 'Image URL is required';
    if (!formData.chain_id) newErrors.chain_id = 'Please select a chain';
    if (!formData.contract_address.trim()) {
      newErrors.contract_address = 'No mint contract on this chain. Deploy one first in Settings → Chains.';
    }
    if (tasks.length === 0) newErrors.tasks = 'At least one task is required';
    
    // Validate tasks
    tasks.forEach((task, index) => {
      if (!task.title.trim()) newErrors[`task_${index}_title`] = `Task ${index + 1} title is required`;
      if (!task.external_url.trim()) newErrors[`task_${index}_url`] = `Task ${index + 1} URL is required`;
    });

    // Validate eligibility if enabled
    if (eligibility) {
      if (!eligibility.min_amount || parseFloat(eligibility.min_amount) <= 0) {
        newErrors.eligibility = 'Minimum amount must be greater than 0';
      }
      if (eligibility.contract_address && !/^0x[a-fA-F0-9]{40}$/.test(eligibility.contract_address)) {
        newErrors.eligibility_contract = 'Invalid contract address format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Generate a unique token ID based on timestamp
  const generateTokenId = (): bigint => {
    return BigInt(Date.now());
  };

  // Step 1: Create token on-chain
  const handleCreateToken = async () => {
    if (!validate()) return;
    if (!address) {
      setErrors({ submit: 'Please connect your wallet' });
      return;
    }

    if (isWrongChain && selectedChain) {
      switchChain({ chainId: selectedChain.chain_id });
      return;
    }

    const newTokenId = generateTokenId();
    setTokenId(newTokenId);
    setTokenCreationStep('creating');

    // Use metadata IPFS URL if available, otherwise fall back to image URL
    const tokenURI = formData.metadata_ipfs_url || formData.image_ipfs_url || formData.image_url;
    
    console.log('Creating token with:', {
      metadata_ipfs_url: formData.metadata_ipfs_url,
      image_ipfs_url: formData.image_ipfs_url,
      image_url: formData.image_url,
      tokenURI,
    });
    
    await createToken({
      contractAddress: formData.contract_address as `0x${string}`,
      tokenId: newTokenId,
      price: '0', // Quest rewards are free
      maxSupply: BigInt(0), // Unlimited supply (0 = unlimited in our contract)
      maxPerWallet: BigInt(1), // 1 per wallet for quest rewards
      tokenURI,
      active: true,
    });
  };

  // Step 2: Save to database after token is created
  const handleSaveToDatabase = async () => {
    setIsSubmitting(true);
    const supabase = createClient();

    try {
      // Create quest campaign with token_id
      const { data: quest, error: questError } = await supabase
        .from('mint_platform_quest_campaigns')
        .insert({
          slug: formData.slug,
          title: formData.title,
          description: formData.description || null,
          image_url: formData.image_url,
          image_ipfs_url: formData.image_ipfs_url || null,
          metadata_ipfs_url: formData.metadata_ipfs_url || null,
          chain_id: formData.chain_id,
          contract_address: formData.contract_address,
          token_id: tokenId.toString(), // Store the token ID
          theme: theme,
          is_active: formData.is_active,
        })
        .select('id')
        .single();

      if (questError) {
        if (questError.code === '23505') {
          setErrors({ slug: 'This slug is already taken' });
        } else {
          setErrors({ submit: questError.message });
        }
        setIsSubmitting(false);
        return;
      }

      // Create tasks
      if (tasks.length > 0) {
        const tasksToInsert = tasks.map((task) => ({
          quest_id: quest.id,
          type: task.type,
          title: task.title,
          description: task.description,
          external_url: task.external_url,
          verification_data: task.verification_data,
          order_index: task.order_index,
        }));

        const { error: tasksError } = await supabase
          .from('mint_platform_quest_tasks')
          .insert(tasksToInsert);

        if (tasksError) {
          setErrors({ submit: 'Quest created but failed to add tasks: ' + tasksError.message });
          setIsSubmitting(false);
          return;
        }
      }

      // Create eligibility condition if enabled
      if (eligibility) {
        const { error: eligibilityError } = await supabase
          .from('mint_platform_eligibility_conditions')
          .insert({
            quest_id: quest.id,
            type: eligibility.type,
            min_amount: eligibility.min_amount,
            contract_address: eligibility.contract_address,
          });

        if (eligibilityError) {
          setErrors({ submit: 'Quest created but failed to add eligibility: ' + eligibilityError.message });
          setIsSubmitting(false);
          return;
        }
      }

      router.push('/admin/campaigns');
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tokenCreationStep === 'done') {
      // Token already created, just save to DB (manual retry)
      await handleSaveToDatabase();
    } else {
      // Need to create token first
      await handleCreateToken();
    }
  };

  // Watch for token creation success and auto-save to database
  useEffect(() => {
    const saveAfterTokenCreation = async () => {
      if (isTokenSuccess && tokenCreationStep === 'creating' && !hasProcessedSuccess.current) {
        hasProcessedSuccess.current = true;
        setTokenCreationStep('done');
        // Auto-save to database after token is created on-chain
        await handleSaveToDatabase();
      }
    };
    saveAfterTokenCreation();
  }, [isTokenSuccess, tokenCreationStep, tokenId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/campaigns" className="text-muted-foreground hover:text-foreground transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Create Quest</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <Card className="border-red-500/50 bg-red-500/10">
            <CardContent className="py-3 text-red-400">{errors.submit}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignForm 
              data={formData} 
              onChange={setFormData} 
              errors={errors}
              onChainSelect={setSelectedChain}
              imageUploadMode={imageUploadMode}
              onImageUploadModeChange={setImageUploadMode}
              images={campaignImages}
              onImagesChange={setCampaignImages}
            />
          </CardContent>
        </Card>

        {/* Token Creation Status */}
        {tokenCreationStep !== 'form' && (
          <Card className={tokenCreationStep === 'done' ? 'border-green-500/50' : 'border-blue-500/50'}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                {tokenCreationStep === 'creating' && (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <div>
                      <p className="font-medium text-foreground">
                        {isTokenPending ? 'Confirm in your wallet...' : 'Creating token on-chain...'}
                      </p>
                      <p className="text-sm text-muted-foreground">Token ID: {tokenId.toString()}</p>
                    </div>
                  </>
                )}
                {tokenCreationStep === 'done' && (
                  <>
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-green-600 dark:text-green-400">Token created on-chain!</p>
                      <p className="text-sm text-muted-foreground">Token ID: {tokenId.toString()}</p>
                      {createTokenTxHash && (
                        <a
                          href={`${selectedChain?.explorer_url}/tx/${createTokenTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          View transaction ↗
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>
              {createTokenError && (
                <div className="mt-3 rounded bg-red-500/10 p-2 text-sm text-red-600 dark:text-red-400">
                  {createTokenError.message}
                  <button onClick={() => { resetCreateToken(); setTokenCreationStep('form'); }} className="ml-2 underline">
                    Try again
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-5">
            <TaskEditor tasks={tasks} onChange={setTasks} />
            {errors.tasks && <p className="mt-2 text-sm text-red-500">{errors.tasks}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <EligibilityEditor eligibility={eligibility} onChange={setEligibility} />
            {errors.eligibility && <p className="mt-2 text-sm text-red-500">{errors.eligibility}</p>}
            {errors.eligibility_contract && <p className="mt-2 text-sm text-red-500">{errors.eligibility_contract}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <ThemeEditor theme={theme} onChange={setTheme} />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/campaigns">
            <Button type="button" variant="ghost">Cancel</Button>
          </Link>
          {tokenCreationStep === 'form' && (
            <Button 
              type="submit" 
              isLoading={isTokenPending || isTokenConfirming}
              disabled={!address || !formData.contract_address}
            >
              {!address 
                ? 'Connect Wallet' 
                : isWrongChain 
                  ? `Switch to ${selectedChain?.name}` 
                  : 'Create Token & Quest'}
            </Button>
          )}
          {tokenCreationStep === 'creating' && (
            <Button type="button" disabled isLoading>
              Creating Token...
            </Button>
          )}
          {tokenCreationStep === 'done' && (
            <Button type="submit" isLoading={isSubmitting}>
              Save Quest
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
