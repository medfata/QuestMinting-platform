'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
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
  onChainSelect?: (chain: SupportedChain | null) => void;
}

export function CampaignForm({ data, onChange, errors = {}, isEditing = false, onChainSelect }: CampaignFormProps) {
  const [chains, setChains] = useState<SupportedChain[]>([]);
  const [isLoadingChains, setIsLoadingChains] = useState(true);

  useEffect(() => {
    const fetchChains = async () => {
      const supabase = createClient();
      const { data: chainsData } = await supabase
        .from('mint_platform_supported_chains')
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

  const handleChainChange = (chainId: number) => {
    const selectedChain = chains.find((c) => c.chain_id === chainId) || null;
    
    // Auto-fill contract address from chain's mint_contract_address
    const contractAddress = selectedChain?.mint_contract_address || '';
    
    onChange({
      ...data,
      chain_id: chainId,
      contract_address: contractAddress,
    });

    // Notify parent about chain selection
    onChainSelect?.(selectedChain);
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
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          value={data.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe your campaign..."
          rows={3}
          className={cn(
            'w-full rounded-lg border bg-foreground/5 backdrop-blur-sm px-4 py-2.5 text-sm text-foreground transition-all duration-300',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            errors.description
              ? 'border-destructive focus:border-destructive focus:ring-destructive/50'
              : 'border-border hover:border-border/80 focus:border-primary focus:ring-primary/30 focus:shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]'
          )}
        />
        {errors.description && <p className="mt-1.5 text-sm text-destructive">{errors.description}</p>}
      </div>

      <Input
        label="Image URL"
        value={data.image_url}
        onChange={(e) => handleChange('image_url', e.target.value)}
        placeholder="https://example.com/image.png"
        error={errors.image_url}
      />

      {data.image_url && (
        <div className="rounded-lg border border-border bg-foreground/5 backdrop-blur-sm p-3 transition-all duration-300 hover:border-border/80">
          <p className="mb-2 text-xs text-muted-foreground">Preview</p>
          <img
            src={data.image_url}
            alt="Campaign preview"
            className="h-32 w-32 rounded-lg object-cover ring-1 ring-white/10"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="w-full">
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Chain
        </label>
        <select
          value={data.chain_id}
          onChange={(e) => handleChainChange(parseInt(e.target.value))}
          disabled={isLoadingChains}
          className={cn(
            'w-full rounded-lg border bg-foreground/5 backdrop-blur-sm px-4 py-2.5 text-sm text-foreground transition-all duration-300',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'border-border hover:border-border/80 focus:border-primary focus:ring-primary/30 focus:shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]'
          )}
        >
          <option value={0} className="bg-background text-foreground">Select a chain</option>
          {chains.map((chain) => (
            <option key={chain.chain_id} value={chain.chain_id} className="bg-background text-foreground">
              {chain.name} {chain.is_testnet && '(Testnet)'} {!chain.mint_contract_address && '(No contract)'}
            </option>
          ))}
        </select>
        {errors.chain_id && <p className="mt-1.5 text-sm text-destructive">{errors.chain_id}</p>}
        {data.chain_id > 0 && !data.contract_address && (
          <p className="mt-1.5 text-sm text-yellow-500">
            ⚠️ No mint contract deployed on this chain. Deploy one in Settings → Chains.
          </p>
        )}
      </div>

      {/* Contract address is now auto-filled from chain, show as read-only */}
      {data.contract_address && (
        <div className="w-full">
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Mint Contract
          </label>
          <div className="rounded-lg border border-border bg-foreground/5 px-4 py-2.5 text-sm text-muted-foreground font-mono">
            {data.contract_address}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Auto-filled from chain configuration
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={data.is_active}
            onChange={(e) => handleChange('is_active', e.target.checked)}
            className="peer sr-only"
          />
          <div className={cn(
            'peer h-6 w-11 rounded-full bg-white/10 transition-all duration-300',
            'after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[\'\']',
            'peer-checked:bg-primary peer-checked:shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] peer-checked:after:translate-x-full',
            'peer-focus:ring-2 peer-focus:ring-primary/50'
          )} />
        </label>
        <span className="text-sm text-foreground">
          {data.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
}
