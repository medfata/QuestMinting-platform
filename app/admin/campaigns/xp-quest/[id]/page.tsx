'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DurationInput } from '@/components/ui/DurationInput';
import { ThemeEditor } from '@/components/admin/ThemeEditor';
import { FunctionVerificationEditor, type VerificationFunction, type VerificationLogic } from '@/components/admin/FunctionVerificationEditor';
import type { CampaignTheme } from '@/types/campaign';
import { DEFAULT_CAMPAIGN_THEME } from '@/types/theme';
import { cn } from '@/lib/utils';

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

export default function EditXpQuestPage() {
  const router = useRouter();
  const params = useParams();
  const questId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [xpReward, setXpReward] = useState(100);
  const [verificationChainId, setVerificationChainId] = useState(57073);
  const [verificationContract, setVerificationContract] = useState('');
  const [verificationFunctions, setVerificationFunctions] = useState<VerificationFunction[]>([{ signature: '', label: '' }]);
  const [verificationLogic, setVerificationLogic] = useState<VerificationLogic>('OR');
  const [durationSeconds, setDurationSeconds] = useState(900);
  const [externalUrl, setExternalUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [theme, setTheme] = useState<CampaignTheme>(DEFAULT_CAMPAIGN_THEME);


  useEffect(() => {
    const fetchQuest = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('mint_platform_xp_quest_campaigns')
        .select('*')
        .eq('id', questId)
        .single();

      if (error || !data) {
        router.push('/admin/campaigns');
        return;
      }

      setSlug(data.slug);
      setTitle(data.title);
      setDescription(data.description || '');
      setImageUrl(data.image_url);
      setXpReward(data.xp_reward);
      setVerificationChainId(data.verification_chain_id);
      setVerificationContract(data.verification_contract);
      // Load multi-function data or fallback to legacy single function
      if (data.verification_functions && Array.isArray(data.verification_functions) && data.verification_functions.length > 0) {
        setVerificationFunctions(data.verification_functions);
      } else if (data.function_signature) {
        setVerificationFunctions([{ signature: data.function_signature, label: '' }]);
      }
      setVerificationLogic(data.verification_logic || 'OR');
      setDurationSeconds(data.duration_seconds);
      setExternalUrl(data.external_url);
      setIsActive(data.is_active);
      if (data.theme) {
        setTheme({
          primary_color: data.theme.primary_color || DEFAULT_CAMPAIGN_THEME.primary_color,
          secondary_color: data.theme.secondary_color || DEFAULT_CAMPAIGN_THEME.secondary_color,
          background_color: data.theme.background_color || DEFAULT_CAMPAIGN_THEME.background_color,
          text_color: data.theme.text_color || DEFAULT_CAMPAIGN_THEME.text_color,
        });
      }
      setIsLoading(false);
    };

    fetchQuest();
  }, [questId, router]);

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
    const hasValidFunction = verificationFunctions.some(fn => fn.signature.trim());
    if (!hasValidFunction) newErrors.verification_functions = 'At least one function signature is required';
    if (!externalUrl.trim()) newErrors.external_url = 'External URL is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const supabase = createClient();

    // Filter out empty functions
    const validFunctions = verificationFunctions.filter(fn => fn.signature.trim());

    const { error } = await supabase
      .from('mint_platform_xp_quest_campaigns')
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', questId);

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
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('mint_platform_xp_quest_campaigns')
      .delete()
      .eq('id', questId);

    if (error) {
      setErrors({ submit: 'Failed to delete: ' + error.message });
      setIsDeleting(false);
      setShowDeleteModal(false);
      return;
    }
    router.push('/admin/campaigns');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/campaigns" className="text-muted-foreground hover:text-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit XP Quest</h1>
            <p className="text-sm text-muted-foreground">/{slug}</p>
          </div>
        </div>
        <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
          Delete
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <Card className="border-red-500/50 bg-red-500/10">
            <CardContent className="py-3 text-red-400">{errors.submit}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Quest Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} />
              <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} error={errors.slug} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={cn(
                  'w-full rounded-lg border bg-foreground/5 px-4 py-2.5 text-sm text-foreground',
                  'border-border focus:border-primary focus:ring-primary/30'
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
            <Input label="XP Amount" type="number" value={xpReward} onChange={(e) => setXpReward(parseInt(e.target.value) || 0)} error={errors.xp_reward} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>On-Chain Verification</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="External Platform URL" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} error={errors.external_url} />
            <Input label="Contract Address" value={verificationContract} onChange={(e) => setVerificationContract(e.target.value)} error={errors.verification_contract} />
            
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
              <label className="mb-1.5 block text-sm font-medium text-foreground">Verification Chain</label>
              <select
                value={verificationChainId}
                onChange={(e) => setVerificationChainId(parseInt(e.target.value))}
                className={cn('w-full rounded-lg border bg-foreground/5 px-4 py-2.5 text-sm text-foreground', 'border-border focus:border-primary')}
              >
                {VERIFICATION_CHAINS.map((chain) => (
                  <option key={chain.chainId} value={chain.chainId} className="bg-background">{chain.name}</option>
                ))}
              </select>
            </div>
            <DurationInput label="Verification Duration" value={durationSeconds} onChange={setDurationSeconds} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <ThemeEditor theme={theme} onChange={setTheme} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-border" />
              <span className="text-sm font-medium text-foreground">Quest is active</span>
            </label>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/campaigns"><Button type="button" variant="ghost">Cancel</Button></Link>
          <Button type="submit" isLoading={isSubmitting}>Save Changes</Button>
        </div>
      </form>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete XP Quest">
        <p className="text-muted-foreground mb-4">Are you sure you want to delete this XP quest? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} isLoading={isDeleting}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
