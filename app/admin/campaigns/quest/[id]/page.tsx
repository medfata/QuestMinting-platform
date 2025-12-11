'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CampaignForm, CampaignFormData } from '@/components/admin/CampaignForm';
import { TaskEditor } from '@/components/admin/TaskEditor';
import { EligibilityEditor } from '@/components/admin/EligibilityEditor';
import { ThemeEditor } from '@/components/admin/ThemeEditor';
import type { CampaignTheme } from '@/types/campaign';
import type { QuestTaskInput, EligibilityConditionInput } from '@/types/quest';
import { DEFAULT_CAMPAIGN_THEME } from '@/types/theme';

export default function EditQuestPage() {
  const router = useRouter();
  const params = useParams();
  const questId = params.id as string;

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

  const [tasks, setTasks] = useState<QuestTaskInput[]>([]);
  const [eligibility, setEligibility] = useState<EligibilityConditionInput | null>(null);
  const [theme, setTheme] = useState<CampaignTheme>(DEFAULT_CAMPAIGN_THEME);
  const [originalSlug, setOriginalSlug] = useState('');


  useEffect(() => {
    const fetchQuest = async () => {
      const supabase = createClient();

      // Fetch quest campaign
      const { data: quest, error: questError } = await supabase
        .from('mint_platform_quest_campaigns')
        .select('*')
        .eq('id', questId)
        .single();

      if (questError || !quest) {
        router.push('/admin/campaigns');
        return;
      }

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('mint_platform_quest_tasks')
        .select('*')
        .eq('quest_id', questId)
        .order('order_index');

      // Fetch eligibility condition
      const { data: eligibilityData } = await supabase
        .from('mint_platform_eligibility_conditions')
        .select('*')
        .eq('quest_id', questId)
        .single();

      setFormData({
        slug: quest.slug,
        title: quest.title,
        description: quest.description || '',
        image_url: quest.image_url,
        chain_id: quest.chain_id,
        contract_address: quest.contract_address,
        is_active: quest.is_active,
      });

      setOriginalSlug(quest.slug);

      if (quest.theme) {
        setTheme({
          primary_color: quest.theme.primary_color || DEFAULT_CAMPAIGN_THEME.primary_color,
          secondary_color: quest.theme.secondary_color || DEFAULT_CAMPAIGN_THEME.secondary_color,
          background_color: quest.theme.background_color || DEFAULT_CAMPAIGN_THEME.background_color,
          text_color: quest.theme.text_color || DEFAULT_CAMPAIGN_THEME.text_color,
        });
      }

      if (tasksData) {
        setTasks(tasksData.map(t => ({
          id: t.id,
          type: t.type,
          title: t.title,
          description: t.description,
          external_url: t.external_url,
          verification_data: t.verification_data || {},
          order_index: t.order_index,
        })));
      }

      if (eligibilityData) {
        setEligibility({
          type: eligibilityData.type,
          min_amount: eligibilityData.min_amount,
          contract_address: eligibilityData.contract_address,
        });
      }

      setIsLoading(false);
    };

    fetchQuest();
  }, [questId, router]);

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

    tasks.forEach((task, index) => {
      if (!task.title.trim()) newErrors[`task_${index}_title`] = `Task ${index + 1} title is required`;
      if (!task.external_url.trim()) newErrors[`task_${index}_url`] = `Task ${index + 1} URL is required`;
    });

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
      // Update quest campaign
      const { error: questError } = await supabase
        .from('mint_platform_quest_campaigns')
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
        .eq('id', questId);

      if (questError) {
        if (questError.code === '23505') {
          setErrors({ slug: 'This slug is already taken' });
        } else {
          setErrors({ submit: questError.message });
        }
        setIsSubmitting(false);
        return;
      }

      // Delete existing tasks and recreate
      await supabase.from('mint_platform_quest_tasks').delete().eq('quest_id', questId);

      if (tasks.length > 0) {
        const tasksToInsert = tasks.map((task) => ({
          quest_id: questId,
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
          setErrors({ submit: 'Quest updated but failed to update tasks: ' + tasksError.message });
          setIsSubmitting(false);
          return;
        }
      }

      // Delete existing eligibility and recreate if enabled
      await supabase.from('mint_platform_eligibility_conditions').delete().eq('quest_id', questId);

      if (eligibility) {
        const { error: eligibilityError } = await supabase
          .from('mint_platform_eligibility_conditions')
          .insert({
            quest_id: questId,
            type: eligibility.type,
            min_amount: eligibility.min_amount,
            contract_address: eligibility.contract_address,
          });

        if (eligibilityError) {
          setErrors({ submit: 'Quest updated but failed to update eligibility: ' + eligibilityError.message });
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
        .from('mint_platform_quest_campaigns')
        .delete()
        .eq('id', questId);

      if (error) {
        setErrors({ submit: 'Failed to delete quest: ' + error.message });
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
          <h1 className="text-2xl font-bold text-foreground">Edit Quest</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/quest/${originalSlug}`} target="_blank">
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
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignForm data={formData} onChange={setFormData} errors={errors} isEditing />
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
            Save Changes
          </Button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Quest">
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to delete this quest? This action cannot be undone.
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
              Delete Quest
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
