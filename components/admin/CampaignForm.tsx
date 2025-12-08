'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import type { SupportedChain } from '@/types/chain';

export interface CampaignFormData {
  slug: string;
  title: string;
  description: string;
  image_url: string;
  chain_id: number;
  contract_address: string;
  is_active: boolean;
}

interface CampaignFormProps {
  data: CampaignFormData;
  onChange: (data: CampaignFormData) => void;
  errors?: Partial<Record<keyof CampaignFormData, string>>;
  isEditing?: boolean;
}

export function CampaignForm({ data, onChange, errors = {}, isEditing = false }: CampaignFormProps) {
  const [chains, setChains] = useState<SupportedChain[]>([]);
  const [isLoadingChains, setIsLoadingChains] = useState(true);

  useEffect(() => {
    const fetchChains = async () => {
      const supabase = createClient();
      const { data: chainsData } = await supabase
        .from('supported_chains')
        .select('*')
        .eq('is_enabled', true)
        .order('name');
      
      if (chainsData) {
        setChains(chainsData as SupportedChain[]);
      }
      setIsLoadingChains(false);
    };

    fetchChains();
  }, []);

  const handleChange = (field: keyof CampaignFormData, value: string | number | boolean) => {
    onChange({ ...data, [field]: value });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  return (
    <div className="space-y-5">
      <Input
        label="Title"
        value={data.title}
        onChange={(e) => {
          handleChange('title', e.target.value);
          if (!isEditing && !data.slug) {
            handleChange('slug', generateSlug(e.target.value));
          }
        }}
        placeholder="My Awesome Campaign"
        error={errors.title}
      />

      <Input
        label="Slug"
        value={data.slug}
        onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
        placeholder="my-awesome-campaign"
        helperText="URL-friendly identifier (lowercase, no spaces)"
        error={errors.slug}
      />

      <div className="w-full">
        <label className="mb-1.5 block text-sm font-medium text-[var(--color-text,#f8fafc)]">
          Description
        </label>
        <textarea
          value={data.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe your campaign..."
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-[var(--color-text,#f8fafc)] placeholder:text-gray-400 focus:border-[var(--color-primary,#3b82f6)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#3b82f6)] transition-colors"
        />
        {errors.description && <p className="mt-1.5 text-sm text-red-500">{errors.description}</p>}
      </div>

      <Input
        label="Image URL"
        value={data.image_url}
        onChange={(e) => handleChange('image_url', e.target.value)}
        placeholder="https://example.com/image.png"
        error={errors.image_url}
      />

      {data.image_url && (
        <div className="rounded-lg border border-white/10 p-3">
          <p className="mb-2 text-xs text-gray-400">Preview</p>
          <img
            src={data.image_url}
            alt="Campaign preview"
            className="h-32 w-32 rounded-lg object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="w-full">
        <label className="mb-1.5 block text-sm font-medium text-[var(--color-text,#f8fafc)]">
          Chain
        </label>
        <select
          value={data.chain_id}
          onChange={(e) => handleChange('chain_id', parseInt(e.target.value))}
          disabled={isLoadingChains}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-[var(--color-text,#f8fafc)] focus:border-[var(--color-primary,#3b82f6)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#3b82f6)] transition-colors disabled:opacity-50"
        >
          <option value={0} className="bg-zinc-900">Select a chain</option>
          {chains.map((chain) => (
            <option key={chain.chain_id} value={chain.chain_id} className="bg-zinc-900">
              {chain.name} {chain.is_testnet && '(Testnet)'}
            </option>
          ))}
        </select>
        {errors.chain_id && <p className="mt-1.5 text-sm text-red-500">{errors.chain_id}</p>}
      </div>

      <Input
        label="Contract Address"
        value={data.contract_address}
        onChange={(e) => handleChange('contract_address', e.target.value)}
        placeholder="0x..."
        error={errors.contract_address}
      />

      <div className="flex items-center gap-3">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={data.is_active}
            onChange={(e) => handleChange('is_active', e.target.checked)}
            className="peer sr-only"
          />
          <div className="peer h-6 w-11 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-blue-500" />
        </label>
        <span className="text-sm text-[var(--color-text,#f8fafc)]">
          {data.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
}
