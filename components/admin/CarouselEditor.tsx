'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface CampaignOption {
  id: string;
  slug: string;
  title: string;
  image_url: string;
  type: 'mintfun' | 'quest';
  is_active: boolean;
}

interface CarouselEditorProps {
  selectedCampaigns: string[];
  onChange: (campaignIds: string[]) => void;
}

export function CarouselEditor({ selectedCampaigns, onChange }: CarouselEditorProps) {
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCampaigns = async () => {
      const supabase = createClient();

      const [mintfunRes, questRes] = await Promise.all([
        supabase
          .from('mint_platform_mintfun_campaigns')
          .select('id, slug, title, image_url, is_active')
          .order('created_at', { ascending: false }),
        supabase
          .from('mint_platform_quest_campaigns')
          .select('id, slug, title, image_url, is_active')
          .order('created_at', { ascending: false }),
      ]);

      const allCampaigns: CampaignOption[] = [
        ...(mintfunRes.data || []).map((c) => ({ ...c, type: 'mintfun' as const })),
        ...(questRes.data || []).map((c) => ({ ...c, type: 'quest' as const })),
      ];

      setCampaigns(allCampaigns);
      setIsLoading(false);
    };

    fetchCampaigns();
  }, []);

  const filteredCampaigns = campaigns.filter((c) => {
    if (!search) return true;
    const lowerSearch = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(lowerSearch) ||
      c.slug.toLowerCase().includes(lowerSearch)
    );
  });

  const selectedCampaignObjects = selectedCampaigns
    .map((id) => campaigns.find((c) => c.id === id))
    .filter(Boolean) as CampaignOption[];

  const availableCampaigns = filteredCampaigns.filter(
    (c) => !selectedCampaigns.includes(c.id)
  );

  const addCampaign = (campaignId: string) => {
    if (!selectedCampaigns.includes(campaignId)) {
      onChange([...selectedCampaigns, campaignId]);
    }
  };

  const removeCampaign = (campaignId: string) => {
    onChange(selectedCampaigns.filter((id) => id !== campaignId));
  };

  const moveCampaign = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedCampaigns.length) return;

    const newOrder = [...selectedCampaigns];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    onChange(newOrder);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selected Campaigns */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-foreground">
          Featured Campaigns ({selectedCampaigns.length})
        </h4>
        {selectedCampaignObjects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/20 bg-white/5 backdrop-blur-sm p-6 text-center text-muted-foreground">
            No campaigns selected. Add campaigns from the list below.
          </div>
        ) : (
          <div className="space-y-2">
            {selectedCampaignObjects.map((campaign, index) => (
              <div
                key={campaign.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-foreground/5 backdrop-blur-sm p-3 transition-all duration-300 hover:border-border/80 hover:bg-foreground/[0.07]"
              >
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => moveCampaign(index, 'up')}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCampaign(index, 'down')}
                    disabled={index === selectedCampaigns.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                <span className="text-sm text-muted-foreground font-medium">{index + 1}</span>
                {campaign.image_url && (
                  <img
                    src={campaign.image_url}
                    alt={campaign.title}
                    className="h-10 w-10 rounded object-cover ring-1 ring-white/10"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{campaign.title}</span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-xs border',
                        campaign.type === 'mintfun'
                          ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
                      )}
                    >
                      {campaign.type === 'mintfun' ? 'MintFun' : 'Quest'}
                    </span>
                    {!campaign.is_active && (
                      <span className="rounded bg-yellow-500/20 border border-yellow-500/30 px-1.5 py-0.5 text-xs text-yellow-600 dark:text-yellow-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">/{campaign.slug}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeCampaign(campaign.id)}
                  className="text-muted-foreground hover:text-red-400 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Campaigns */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-foreground">Add Campaigns</h4>
        <Input
          placeholder="Search campaigns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
        />
        {availableCampaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {search ? 'No campaigns match your search.' : 'All campaigns are already featured.'}
          </p>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {availableCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between rounded-lg border border-border bg-foreground/5 backdrop-blur-sm p-3 transition-all duration-300 hover:border-border/80 hover:bg-foreground/[0.07]"
              >
                <div className="flex items-center gap-3">
                  {campaign.image_url && (
                    <img
                      src={campaign.image_url}
                      alt={campaign.title}
                      className="h-10 w-10 rounded object-cover ring-1 ring-white/10"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{campaign.title}</span>
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-xs border',
                          campaign.type === 'mintfun'
                            ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
                        )}
                      >
                        {campaign.type === 'mintfun' ? 'MintFun' : 'Quest'}
                      </span>
                      {!campaign.is_active && (
                        <span className="rounded bg-yellow-500/20 border border-yellow-500/30 px-1.5 py-0.5 text-xs text-yellow-600 dark:text-yellow-400">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">/{campaign.slug}</p>
                  </div>
                </div>
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => addCampaign(campaign.id)}
                >
                  + Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
