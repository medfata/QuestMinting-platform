'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Campaign {
  id: string;
  slug: string;
  title: string;
  is_active: boolean;
  created_at: string;
  chain_id: number;
}

type CampaignType = 'all' | 'mintfun' | 'quest';

export default function CampaignsPage() {
  const [mintfunCampaigns, setMintfunCampaigns] = useState<Campaign[]>([]);
  const [questCampaigns, setQuestCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<CampaignType>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCampaigns = async () => {
      const supabase = createClient();

      const [mintfunRes, questRes] = await Promise.all([
        supabase.from('mint_platform_mintfun_campaigns').select('id, slug, title, is_active, created_at, chain_id').order('created_at', { ascending: false }),
        supabase.from('mint_platform_quest_campaigns').select('id, slug, title, is_active, created_at, chain_id').order('created_at', { ascending: false }),
      ]);

      if (mintfunRes.data) setMintfunCampaigns(mintfunRes.data);
      if (questRes.data) setQuestCampaigns(questRes.data);
      setIsLoading(false);
    };

    fetchCampaigns();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredCampaigns = () => {
    let campaigns: (Campaign & { type: 'mintfun' | 'quest' })[] = [];

    if (filter === 'all' || filter === 'mintfun') {
      campaigns = [...campaigns, ...mintfunCampaigns.map(c => ({ ...c, type: 'mintfun' as const }))];
    }
    if (filter === 'all' || filter === 'quest') {
      campaigns = [...campaigns, ...questCampaigns.map(c => ({ ...c, type: 'quest' as const }))];
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      campaigns = campaigns.filter(c => 
        c.title.toLowerCase().includes(lowerSearch) || 
        c.slug.toLowerCase().includes(lowerSearch)
      );
    }

    return campaigns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
        <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
        <div className="flex gap-3">
          <Link href="/admin/campaigns/mintfun/new">
            <Button>+ New MintFun</Button>
          </Link>
          <Link href="/admin/campaigns/quest/new">
            <Button variant="secondary">+ New Quest</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {(['all', 'mintfun', 'quest'] as CampaignType[]).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground'
                }`}
              >
                {type === 'all' ? 'All' : type === 'mintfun' ? 'MintFun' : 'Quests'}
              </button>
            ))}
          </div>
          <div className="flex-1">
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </div>
      </Card>

      {/* Campaign List */}
      <Card padding="none">
        <CardHeader className="border-b border-border px-5 py-4">
          <CardTitle>
            {filteredCampaigns().length} Campaign{filteredCampaigns().length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCampaigns().length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {search ? 'No campaigns match your search' : 'No campaigns yet. Create your first one!'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredCampaigns().map((campaign) => (
                <Link
                  key={`${campaign.type}-${campaign.id}`}
                  href={`/admin/campaigns/${campaign.type}/${campaign.id}`}
                  className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-foreground/5"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        campaign.type === 'mintfun'
                          ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                          : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {campaign.type === 'mintfun' ? 'MintFun' : 'Quest'}
                    </span>
                    <div>
                      <h3 className="font-medium text-foreground">{campaign.title}</h3>
                      <p className="text-sm text-muted-foreground">/{campaign.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`flex items-center gap-1.5 text-sm ${
                        campaign.is_active ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${campaign.is_active ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                      {campaign.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-sm text-muted-foreground">{formatDate(campaign.created_at)}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
