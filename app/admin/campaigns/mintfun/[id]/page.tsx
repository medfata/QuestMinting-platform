'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CampaignForm, CampaignFormData } from '@/components/admin/CampaignForm';
import { MintTierEditor } from '@/components/admin/MintTierEditor';
import { ThemeEditor } from '@/components/admin/ThemeEditor';
import type { MintTierInput, CampaignTheme, MintFunCampaign } from '@/types/campaign';
import { DEFAULT_CAMPAIGN_THEME } from '@/types/theme';

export default function EditMintFunPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const [tiers, setTiers] = useState<MintTierInput[]>([]);
  const [theme, setTheme] = useState<CampaignTheme>(DEFAULT_CAMPAIGN_THEME);
  const [originalSlug, setOriginalSlug] = useState('');

  useEffect(() => {
    const fetchCampaign = async () => {
      const supabase = createClient();

      // Fetch campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('mint_platform_mintfun_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaign) {
        router.push('/admin/campaigns');
        return;
      }

      // Fetch tiers
      const { data: tiersData } = await supabase
        .from('mint_platform_mint_tiers')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('order_index');

      setFormData({
        slug: campaign.slug,
        title: campaign.title,
        description: campaign.description || '',
        image_url: campaign.image_url,
        chain_id: campaign.chain_id,
        contract_address: campaign.contract_address,
        is_active: campaign.is_active,
      });

      setOriginalSlug(campaign.slug);

      if (campaign.theme) {
        setTheme({
          primary_color: campaign.theme.primary_color || DEFAULT_CAMPAIGN_THEME.primary_color,
          secondary_color: campaign.theme.secondary_color || DEFAULT_CAMPAIGN_THEME.secondary_color,
          background_color: campaign.theme.background_color || DEFAULT_CAMPAIGN_THEME.background_color,
          text_color: campaign.theme.text_color || DEFAULT_CAMPAIGN_THEME.text_color,
        });
      }

      if (tiersData) {
        setTiers(tiersData.map(t => ({
          id: t.id,
          name: t.name,
          quantity: t.quantity,
          price: t.price,
          max_per_wallet: t.max_per_wallet,
          order_index: t.order_index,
        })));
      }

      setIsLoading(false);
    };

    fetchCampaign();
  }, [campaignId, router]);

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
      // Update campaign
      const { error: campaignError } = await supabase
        .from('mint_platform_mintfun_campaigns')
        .update({
          slug: formData.slug,
          title: formData.title,
          description: formData.description || null,
          image_url: formData.image_url,
          chain_id: formData.chain_id,
          contract_address: formData.contract_address,
          theme: theme,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      if (campaignError) {
        if (campaignError.code === '23505') {
          setErrors({ slug: 'This slug is already taken' });
        } else {
          setErrors({ submit: campaignError.message });
        }
        setIsSubmitting(false);
        return;
      }

      // Delete existing tiers and recreate
      await supabase.from('mint_platform_mint_tiers').delete().eq('campaign_id', campaignId);

      if (tiers.length > 0) {
        const tiersToInsert = tiers.map((tier) => ({
          campaign_id: campaignId,
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
          setErrors({ submit: 'Campaign updated but failed to update tiers: ' + tiersError.message });
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

  const handleDelete = async () => {
    setIsDeleting(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('mint_platform_mintfun_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) {
        setErrors({ submit: 'Failed to delete campaign: ' + error.message });
        setIsDeleting(false);
        setShowDeleteModal(false);
        return;
      }

      router.push('/admin/campaigns');
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
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
          <h1 className="text-2xl font-bold text-foreground">Edit MintFun Campaign</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/mint/${originalSlug}`} target="_blank">
            <Button type="button" variant="ghost" size="sm">
              View Live
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </Button>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            Delete
          </Button>
        </div>
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
            <CampaignForm data={formData} onChange={setFormData} errors={errors} isEditing />
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
            Save Changes
          </Button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Campaign">
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to delete this campaign? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              isLoading={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Campaign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
