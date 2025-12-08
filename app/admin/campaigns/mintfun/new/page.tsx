'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CampaignForm, CampaignFormData } from '@/components/admin/CampaignForm';
import { MintTierEditor } from '@/components/admin/MintTierEditor';
import { ThemeEditor } from '@/components/admin/ThemeEditor';
import type { MintTierInput, CampaignTheme } from '@/types/campaign';
import { DEFAULT_CAMPAIGN_THEME } from '@/types/theme';

export default function NewMintFunPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
    if (!formData.image_url.trim()) newErrors.image_url = 'Image URL is required';
    if (!formData.chain_id) newErrors.chain_id = 'Please select a chain';
    if (!formData.contract_address.trim()) newErrors.contract_address = 'Contract address is required';
    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.contract_address)) {
      newErrors.contract_address = 'Invalid contract address format';
    }
    if (tiers.length === 0) newErrors.tiers = 'At least one mint tier is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('mint_platform_mintfun_campaigns')
        .insert({
          slug: formData.slug,
          title: formData.title,
          description: formData.description || null,
          image_url: formData.image_url,
          chain_id: formData.chain_id,
          contract_address: formData.contract_address,
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

      // Create tiers
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/campaigns" className="text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-white">Create MintFun Campaign</h1>
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
            <CampaignForm data={formData} onChange={setFormData} errors={errors} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <MintTierEditor tiers={tiers} onChange={setTiers} />
            {errors.tiers && <p className="mt-2 text-sm text-red-500">{errors.tiers}</p>}
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
          <Button type="submit" isLoading={isSubmitting}>
            Create Campaign
          </Button>
        </div>
      </form>
    </div>
  );
}
