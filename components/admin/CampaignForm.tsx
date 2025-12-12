'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { NFTImageUploader, type NFTUploadResult, type MultiNFTUploadResult } from '@/components/admin/NFTImageUploader';
import type { SupportedChain } from '@/types/chain';

export interface CampaignFormData {
  slug: string;
  title: string;
  description: string;
  image_url: string;
  // IPFS fields
  image_ipfs_url?: string;
  metadata_ipfs_url?: string;
  chain_id: number;
  contract_address: string;
  is_active: boolean;
}

export type ImageUploadMode = 'single' | 'multiple';

export interface CampaignImages {
  single?: NFTUploadResult | null;
  multiple?: MultiNFTUploadResult | null;
}

interface CampaignFormProps {
  data: CampaignFormData;
  onChange: (data: CampaignFormData) => void;
  errors?: Partial<Record<keyof CampaignFormData, string>>;
  isEditing?: boolean;
  onChainSelect?: (chain: SupportedChain | null) => void;
  // Image upload props
  imageUploadMode?: ImageUploadMode;
  onImageUploadModeChange?: (mode: ImageUploadMode) => void;
  images?: CampaignImages;
  onImagesChange?: (images: CampaignImages) => void;
}

export function CampaignForm({ 
  data, 
  onChange, 
  errors = {}, 
  isEditing = false, 
  onChainSelect,
  imageUploadMode = 'single',
  onImageUploadModeChange,
  images,
  onImagesChange,
}: CampaignFormProps) {
  const [chains, setChains] = useState<SupportedChain[]>([]);
  const [isLoadingChains, setIsLoadingChains] = useState(true);
  const [useIpfsUpload, setUseIpfsUpload] = useState(true);

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
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Title"
          value={data.title}
          onChange={(e) => {
            handleChange('title', e.target.value);
            if (!isEditing && !data.slug) {
              handleChange('slug', generateSlug(e.target.value));
            }
          }}
          placeholder="My Awesome NFT"
          error={errors.title}
        />

        <Input
          label="Slug"
          value={data.slug}
          onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          placeholder="my-awesome-nft"
          helperText="URL-friendly identifier"
          error={errors.slug}
        />
      </div>

      <div className="w-full">
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          value={data.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe your NFT..."
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

      {/* Chain Selection */}
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
            ⚠️ No mint contract deployed. Deploy one in Settings → Chains.
          </p>
        )}
      </div>

      {/* Image Upload Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">NFT Image</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUseIpfsUpload(!useIpfsUpload)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {useIpfsUpload ? 'Use URL instead' : 'Upload to IPFS'}
            </button>
          </div>
        </div>

        {useIpfsUpload ? (
          <div className="space-y-3">
            {/* Upload Mode Toggle */}
            {onImageUploadModeChange && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-foreground/5 border border-border">
                <button
                  type="button"
                  onClick={() => onImageUploadModeChange('single')}
                  className={cn(
                    'flex-1 px-3 py-1.5 rounded text-sm transition-all',
                    imageUploadMode === 'single'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Single Image
                </button>
                <button
                  type="button"
                  onClick={() => onImageUploadModeChange('multiple')}
                  className={cn(
                    'flex-1 px-3 py-1.5 rounded text-sm transition-all',
                    imageUploadMode === 'multiple'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Multiple Images
                </button>
              </div>
            )}

            {/* IPFS Uploader */}
            <NFTImageUploader
              mode={imageUploadMode}
              value={images?.single}
              onChange={(val) => {
                onImagesChange?.({ ...images, single: val });
                // Update form data with IPFS URLs
                if (val) {
                  onChange({
                    ...data,
                    image_url: val.imageGatewayUrl,
                    image_ipfs_url: val.imageIpfsUrl,
                    metadata_ipfs_url: val.metadataIpfsUrl,
                  });
                } else {
                  onChange({
                    ...data,
                    image_url: '',
                    image_ipfs_url: '',
                    metadata_ipfs_url: '',
                  });
                }
              }}
              multiValue={images?.multiple}
              onMultiChange={(val) => {
                onImagesChange?.({ ...images, multiple: val });
                // For multiple, use first image as preview
                if (val?.images?.[0]) {
                  onChange({
                    ...data,
                    image_url: val.images[0].gatewayUrl,
                    image_ipfs_url: val.images[0].ipfsUrl,
                  });
                }
              }}
              nftName={data.title}
              nftDescription={data.description}
              autoGenerateMetadata={true}
              error={errors.image_url}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              value={data.image_url}
              onChange={(e) => handleChange('image_url', e.target.value)}
              placeholder="https://example.com/image.png or ipfs://..."
              error={errors.image_url}
            />
            {data.image_url && (
              <div className="rounded-lg border border-border bg-foreground/5 p-3">
                <p className="mb-2 text-xs text-muted-foreground">Preview</p>
                <img
                  src={data.image_url}
                  alt="Preview"
                  className="h-32 w-32 rounded-lg object-cover ring-1 ring-white/10"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
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
