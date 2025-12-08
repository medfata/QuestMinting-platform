'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface DashboardStats {
  mintfunCount: number;
  questCount: number;
  activeMintfun: number;
  activeQuests: number;
}

interface RecentCampaign {
  id: string;
  slug: string;
  title: string;
  type: 'mintfun' | 'quest';
  is_active: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    mintfunCount: 0,
    questCount: 0,
    activeMintfun: 0,
    activeQuests: 0,
  });
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const supabase = createClient();

      try {
        // Fetch MintFun campaigns
        const { data: mintfunData, error: mintfunError } = await supabase
          .from('mintfun_campaigns')
          .select('id, slug, title, is_active, created_at');

        // Fetch Quest campaigns
        const { data: questData, error: questError } = await supabase
          .from('quest_campaigns')
          .select('id, slug, title, is_active, created_at');

        if (mintfunError || questError) {
          console.error('Error fetching campaigns:', mintfunError || questError);
          setIsLoading(false);
          return;
        }

        const mintfun = mintfunData || [];
        const quests = questData || [];

        // Calculate stats
        setStats({
          mintfunCount: mintfun.length,
          questCount: quests.length,
          activeMintfun: mintfun.filter((c) => c.is_active).length,
          activeQuests: quests.filter((c) => c.is_active).length,
        });

        // Combine and sort recent campaigns
        const allCampaigns: RecentCampaign[] = [
          ...mintfun.map((c) => ({ ...c, type: 'mintfun' as const })),
          ...quests.map((c) => ({ ...c, type: 'quest' as const })),
        ]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        setRecentCampaigns(allCampaigns);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <Link href="/admin/campaigns">
          <Button>View All Campaigns</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-gray-400">Total MintFun</div>
            <div className="mt-1 text-3xl font-bold text-white">{stats.mintfunCount}</div>
            <div className="mt-1 text-sm text-green-400">{stats.activeMintfun} active</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-gray-400">Total Quests</div>
            <div className="mt-1 text-3xl font-bold text-white">{stats.questCount}</div>
            <div className="mt-1 text-sm text-green-400">{stats.activeQuests} active</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-gray-400">Active Campaigns</div>
            <div className="mt-1 text-3xl font-bold text-white">
              {stats.activeMintfun + stats.activeQuests}
            </div>
            <div className="mt-1 text-sm text-gray-500">across all types</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-gray-400">Total Campaigns</div>
            <div className="mt-1 text-3xl font-bold text-white">
              {stats.mintfunCount + stats.questCount}
            </div>
            <div className="mt-1 text-sm text-gray-500">MintFun + Quests</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/admin/campaigns/mintfun/new">
              <Button variant="outline" size="sm">
                + New MintFun
              </Button>
            </Link>
            <Link href="/admin/campaigns/quest/new">
              <Button variant="outline" size="sm">
                + New Quest
              </Button>
            </Link>
            <Link href="/admin/settings/chains">
              <Button variant="ghost" size="sm">
                Manage Chains
              </Button>
            </Link>
            <Link href="/admin/settings/theme">
              <Button variant="ghost" size="sm">
                Global Theme
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCampaigns.length === 0 ? (
              <p className="text-sm text-gray-400">No campaigns yet</p>
            ) : (
              <ul className="space-y-3">
                {recentCampaigns.map((campaign) => (
                  <li key={campaign.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          campaign.type === 'mintfun'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {campaign.type === 'mintfun' ? 'MintFun' : 'Quest'}
                      </span>
                      <Link
                        href={`/admin/campaigns/${campaign.type}/${campaign.id}`}
                        className="text-sm text-white hover:underline"
                      >
                        {campaign.title}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          campaign.is_active ? 'bg-green-500' : 'bg-gray-500'
                        }`}
                      />
                      <span className="text-xs text-gray-500">
                        {formatDate(campaign.created_at)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
