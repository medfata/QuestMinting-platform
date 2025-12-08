'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
          .from('mintfun_campaigns')
          .select('id, slug, title, image_url, is_active')
          .order('created_at', { ascending: false }),
        supabase
          .from('quest_campaigns')
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
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selected Campaigns */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-white">
          Featured Campaigns ({selectedCampaigns.length})
        </h4>
        {selectedCampaignObjects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/20 p-6 text-center text-gray-400">
            No campaigns selected. Add campaigns from the list below.
          </div>
        ) : (
          <div className="space-y-2">
            {selectedCampaignObjects.map((campaign, index) => (
              <div
                key={campaign.id}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
              >
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => moveCampaign(index, 'up')}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-white disabled:opacity-30"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCampaign(index, 'down')}
                    disabled={index === selectedCampaigns.length - 1}
                    className="text-gray-400 hover:text-white disabled:opacity-30"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                <span className="text-sm text-gray-500">{index + 1}</span>
                {campaign.image_url && (
                  <img
                    src={campaign.image_url}
                    alt={campaign.title}
                    className="h-10 w-10 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{campaign.title}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs ${
                        campaign.type === 'mintfun'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {campaign.type === 'mintfun' ? 'MintFun' : 'Quest'}
                    </span>
                    {!campaign.is_active && (
                      <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-xs text-yellow-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">/{campaign.slug}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeCampaign(campaign.id)}
                  className="text-gray-400 hover:text-red-400"
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
        <h4 className="mb-3 text-sm font-medium text-white">Add Campaigns</h4>
        <Input
          placeholder="Search campaigns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
        />
        {availableCampaigns.length === 0 ? (
          <p className="text-sm text-gray-400">
            {search ? 'No campaigns match your search.' : 'All campaigns are already featured.'}
          </p>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {availableCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
              >
                <div className="flex items-center gap-3">
                  {campaign.image_url && (
                    <img
                      src={campaign.image_url}
                      alt={campaign.title}
                      className="h-10 w-10 rounded object-cover"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{campaign.title}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs ${
                          campaign.type === 'mintfun'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {campaign.type === 'mintfun' ? 'MintFun' : 'Quest'}
                      </span>
                      {!campaign.is_active && (
                        <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-xs text-yellow-400">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">/{campaign.slug}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
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
