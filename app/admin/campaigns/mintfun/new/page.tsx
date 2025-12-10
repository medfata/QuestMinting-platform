'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useSwitchChain } from 'wagmi';
import { parseEther } from 'viem';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CampaignForm, CampaignFormData } from '@/components/admin/CampaignForm';
import { MintTierEditor } from '@/components/admin/MintTierEditor';
import { ThemeEditor } from '@/components/admin/ThemeEditor';
import { useCreateToken } from '@/hooks/useCreateToken';
import type { MintTierInput, CampaignTheme } from '@/types/campaign';
import type { SupportedChain } from '@/types/chain';
import { DEFAULT_CAMPAIGN_THEME } from '@/types/theme';

export default function NewMintFunPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedChain, setSelectedChain] = useState<SupportedChain | null>(null);
  const [tokenCreationStep, setTokenCreationStep] = useState<'form' | 'creating' | 'done'>('form');
  const [tokenId, setTokenId] = useState<bigint>(BigInt(0));

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
    chain_id: 0,
    contract_address: '',
    is_active: true,
  });

  const [tiers, setTiers] = useState<MintTierInput[]>([
    { name: 'Free Mint', quantity: 100, price: '0', max_per_wallet: 1, order_index: 0 },
  ]);

  const [theme, setTheme] = useState<CampaignTheme>(DEFAULT_CAMPAIGN_THEME);

  const isWrongChain = selectedChain && connectedChainId !== selectedChain.chain_id;

  const generateTokenId = (): bigint => BigInt(Date.now());

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
    if (!formData.image_url.trim()) newErrors.image_url = 'Image URL is required';
    if (!formData.chain_id) newErrors.chain_id = 'Please select a chain';
    if (!formData.contract_address.trim()) {
      newErrors.contract_address = 'No mint contract on this chain. Deploy one first in Settings → Chains.';
    }
    if (tiers.length === 0) newErrors.tiers = 'At least one mint tier is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Get the first tier for token creation (MintFun uses first tier as the main token)
  const getFirstTier = () => tiers[0] || { price: '0', quantity: 0, max_per_wallet: 1 };

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

    const firstTier = getFirstTier();

    await createToken({
      contractAddress: formData.contract_address as `0x${string}`,
      tokenId: newTokenId,
      price: firstTier.price || '0',
      maxSupply: BigInt(firstTier.quantity || 0),
      maxPerWallet: BigInt(firstTier.max_per_wallet || 0),
      tokenURI: formData.image_url,
      active: true,
    });
  };

  // Step 2: Save to database after token is created
  const handleSaveToDatabase = async () => {
    setIsSubmitting(true);
    const supabase = createClient();

    try {
      // Create campaign with token_id
      const { data: campaign, error: campaignError } = await supabase
        .from('mint_platform_mintfun_campaigns')
        .insert({
          slug: formData.slug,
          title: formData.title,
          description: formData.description || null,
          image_url: formData.image_url,
          chain_id: formData.chain_id,
          contract_address: formData.contract_address,
          token_id: tokenId.toString(),
          theme: theme,
          is_active: formData.is_active,
        })
        .select('id')
        .single();

      if (campaignError) {
        if (campaignError.code === '23505') {
          setErrors({ slug: 'This slug is already taken' });
        } else {
          setErrors({ submit: campaignError.message });
        }
        setIsSubmitting(false);
        return;
      }

      // Create tiers (for display purposes, actual on-chain config is in the token)
      if (tiers.length > 0) {
        const tiersToInsert = tiers.map((tier) => ({
          campaign_id: campaign.id,
          name: tier.name,
          quantity: tier.quantity,
          price: tier.price,
          max_per_wallet: tier.max_per_wallet,
          order_index: tier.order_index,
        }));

        const { error: tiersError } = await supabase
          .from('mint_platform_mint_tiers')
          .insert(tiersToInsert);

        if (tiersError) {
          setErrors({ submit: 'Campaign created but failed to add tiers: ' + tiersError.message });
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
      await handleSaveToDatabase();
    } else {
      await handleCreateToken();
    }
  };

  // When token creation succeeds, mark as done
  if (isTokenSuccess && tokenCreationStep === 'creating') {
    setTokenCreationStep('done');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/campaigns" className="text-muted-foreground hover:text-foreground transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Create MintFun Campaign</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <Card className="border-red-500/50 bg-red-500/10">
            <CardContent className="py-3 text-red-400">{errors.submit}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignForm 
              data={formData} 
              onChange={setFormData} 
              errors={errors}
              onChainSelect={setSelectedChain}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <MintTierEditor tiers={tiers} onChange={setTiers} />
            {errors.tiers && <p className="mt-2 text-sm text-red-500">{errors.tiers}</p>}
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
                  : 'Create Token & Campaign'}
            </Button>
          )}
          {tokenCreationStep === 'creating' && (
            <Button type="button" disabled isLoading>
              Creating Token...
            </Button>
          )}
          {tokenCreationStep === 'done' && (
            <Button type="submit" isLoading={isSubmitting}>
              Save Campaign
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
