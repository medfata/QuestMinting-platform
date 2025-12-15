'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DurationInput } from '@/components/ui/DurationInput';
import { ThemeEditor } from '@/components/admin/ThemeEditor';
import { FunctionVerificationEditor, type VerificationFunction, type VerificationLogic } from '@/components/admin/FunctionVerificationEditor';
import type { CampaignTheme } from '@/types/campaign';
import { DEFAULT_CAMPAIGN_THEME } from '@/types/theme';
import { cn } from '@/lib/utils';

// Supported chains for verification
const VERIFICATION_CHAINS = [
  { chainId: 1, name: 'Ethereum' },
  { chainId: 10, name: 'Optimism' },
  { chainId: 56, name: 'BNB Chain' },
  { chainId: 137, name: 'Polygon' },
  { chainId: 8453, name: 'Base' },
  { chainId: 42161, name: 'Arbitrum' },
  { chainId: 57073, name: 'Ink' },
  { chainId: 59144, name: 'Linea' },
  { chainId: 534352, name: 'Scroll' },
  { chainId: 81457, name: 'Blast' },
];

export default function NewXpQuestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [xpReward, setXpReward] = useState(100);
  const [verificationChainId, setVerificationChainId] = useState(57073); // Default to Ink
  const [verificationContract, setVerificationContract] = useState('');
  const [verificationFunctions, setVerificationFunctions] = useState<VerificationFunction[]>([{ signature: '', label: '' }]);
  const [verificationLogic, setVerificationLogic] = useState<VerificationLogic>('OR');
  const [durationSeconds, setDurationSeconds] = useState(900); // 15 minutes default
  const [externalUrl, setExternalUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [theme, setTheme] = useState<CampaignTheme>(DEFAULT_CAMPAIGN_THEME);

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Title is required';
    if (!slug.trim()) newErrors.slug = 'Slug is required';
    if (!imageUrl.trim()) newErrors.image_url = 'Image is required';
    if (xpReward <= 0) newErrors.xp_reward = 'XP reward must be greater than 0';
    if (!verificationContract.trim()) newErrors.verification_contract = 'Contract address is required';
    if (!/^0x[a-fA-F0-9]{40}$/.test(verificationContract)) {
      newErrors.verification_contract = 'Invalid contract address format';
    }
    // Validate at least one function with a signature
    const hasValidFunction = verificationFunctions.some(fn => fn.signature.trim());
    if (!hasValidFunction) newErrors.verification_functions = 'At least one function signature is required';
    if (!externalUrl.trim()) newErrors.external_url = 'External URL is required';
    if (durationSeconds <= 0) newErrors.duration = 'Duration must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      // Filter out empty functions
      const validFunctions = verificationFunctions.filter(fn => fn.signature.trim());
      
      const { error } = await supabase
        .from('mint_platform_xp_quest_campaigns')
        .insert({
          slug,
          title,
          description: description || null,
          image_url: imageUrl,
          xp_reward: xpReward,
          verification_chain_id: verificationChainId,
          verification_contract: verificationContract,
          verification_functions: validFunctions,
          verification_logic: verificationLogic,
          duration_seconds: durationSeconds,
          external_url: externalUrl,
          theme,
          is_active: isActive,
        });

      if (error) {
        if (error.code === '23505') {
          setErrors({ slug: 'This slug is already taken' });
        } else {
          setErrors({ submit: error.message });
        }
        setIsSubmitting(false);
        return;
      }

      router.push('/admin/campaigns');
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/campaigns" className="text-muted-foreground hover:text-foreground transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create XP Quest</h1>
          <p className="text-sm text-muted-foreground">Reward users with XP for completing on-chain tasks</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <Card className="border-red-500/50 bg-red-500/10">
            <CardContent className="py-3 text-red-400">{errors.submit}</CardContent>
          </Card>
        )}

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Quest Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Daily GM Quest"
                error={errors.title}
              />
              <Input
                label="Slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="daily-gm-quest"
                helperText="URL-friendly identifier"
                error={errors.slug}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Complete a GM transaction on Ink Chain to earn XP..."
                rows={3}
                className={cn(
                  'w-full rounded-lg border bg-foreground/5 backdrop-blur-sm px-4 py-2.5 text-sm text-foreground transition-all duration-300',
                  'placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0',
                  'border-border hover:border-border/80 focus:border-primary focus:ring-primary/30'
                )}
              />
            </div>

            <Input
              label="Image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              helperText="Direct URL to the quest image"
              error={errors.image_url}
            />
            {imageUrl && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border">
                  <Image
                    src={imageUrl}
                    alt="Quest preview"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* XP Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-500">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              XP Reward
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="XP Amount"
              type="number"
              value={xpReward}
              onChange={(e) => setXpReward(parseInt(e.target.value) || 0)}
              placeholder="100"
              helperText="Amount of XP awarded when quest is completed"
              error={errors.xp_reward}
            />
          </CardContent>
        </Card>

        {/* Verification Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>On-Chain Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="External Platform URL"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://gm.inkonchain.com/"
              helperText="URL where users complete the task"
              error={errors.external_url}
            />

            <Input
              label="Contract Address"
              value={verificationContract}
              onChange={(e) => setVerificationContract(e.target.value)}
              placeholder="0x..."
              helperText="Contract users must interact with"
              error={errors.verification_contract}
            />

            <FunctionVerificationEditor
              functions={verificationFunctions}
              logic={verificationLogic}
              onFunctionsChange={setVerificationFunctions}
              onLogicChange={setVerificationLogic}
            />
            {errors.verification_functions && (
              <p className="text-sm text-red-500">{errors.verification_functions}</p>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Verification Chain
              </label>
              <select
                value={verificationChainId}
                onChange={(e) => setVerificationChainId(parseInt(e.target.value))}
                className={cn(
                  'w-full rounded-lg border bg-foreground/5 backdrop-blur-sm px-4 py-2.5 text-sm text-foreground transition-all duration-300',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0',
                  'border-border hover:border-border/80 focus:border-primary focus:ring-primary/30'
                )}
              >
                {VERIFICATION_CHAINS.map((chain) => (
                  <option key={chain.chainId} value={chain.chainId} className="bg-background text-foreground">
                    {chain.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">Chain where the contract is deployed</p>
            </div>

            <DurationInput
              label="Verification Duration"
              value={durationSeconds}
              onChange={setDurationSeconds}
              helperText="Time window to verify task completion after user clicks verify"
            />
            {errors.duration && <p className="text-sm text-red-500">{errors.duration}</p>}

            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">How verification works:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>User visits the external platform and completes the task</li>
                <li>User returns to this quest page and clicks &quot;Verify&quot;</li>
                <li>We check the blockchain for transactions from the user to the contract</li>
                <li>If a matching function call is found within the duration, XP is awarded</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardContent className="pt-5">
            <ThemeEditor theme={theme} onChange={setTheme} />
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardContent className="py-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-foreground/5 text-primary focus:ring-primary/30"
              />
              <span className="text-sm font-medium text-foreground">Quest is active</span>
            </label>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/campaigns">
            <Button type="button" variant="ghost">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting}>
            Create XP Quest
          </Button>
        </div>
      </form>
    </div>
  );
}
