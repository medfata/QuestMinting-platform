'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CampaignForm, CampaignFormData } from '@/components/admin/CampaignForm';
import { TaskEditor } from '@/components/admin/TaskEditor';
import { EligibilityEditor } from '@/components/admin/EligibilityEditor';
import { ThemeEditor } from '@/components/admin/ThemeEditor';
import type { CampaignTheme } from '@/types/campaign';
import type { QuestTaskInput, EligibilityConditionInput } from '@/types/quest';
import { DEFAULT_CAMPAIGN_THEME } from '@/types/theme';

export default function NewQuestPage() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      // Create quest campaign
      const { data: quest, error: questError } = await supabase
        .from('mint_platform_quest_campaigns')
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


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/campaigns" className="text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-white">Create Quest Campaign</h1>
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
          <Button type="submit" isLoading={isSubmitting}>
            Create Quest
          </Button>
        </div>
      </form>
    </div>
  );
}
