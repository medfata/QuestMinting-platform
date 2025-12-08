'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

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

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  subtitleColor?: 'green' | 'gray';
  icon: React.ReactNode;
  glowColor?: string;
}

function StatCard({ title, value, subtitle, subtitleColor = 'gray', icon, glowColor = 'primary' }: StatCardProps) {
  return (
    <Card 
      variant="glass" 
      className={cn(
        'group relative overflow-hidden transition-all duration-300',
        'hover:-translate-y-1 hover:border-white/20',
        'hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.15)]'
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardContent className="pt-5 relative">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-gray-400">{title}</div>
            <div className="mt-1 text-3xl font-bold text-white">{value}</div>
            <div className={cn(
              'mt-1 text-sm',
              subtitleColor === 'green' ? 'text-green-400' : 'text-gray-500'
            )}>
              {subtitle}
            </div>
          </div>
          <div className={cn(
            'p-2 rounded-lg bg-white/5 text-gray-400',
            'group-hover:bg-primary/10 group-hover:text-primary',
            'transition-all duration-300'
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
          .from('mint_platform_mintfun_campaigns')
          .select('id, slug, title, is_active, created_at');

        // Fetch Quest campaigns
        const { data: questData, error: questError } = await supabase
          .from('mint_platform_quest_campaigns')
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
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <Link href="/admin/campaigns">
          <Button variant="glow">View All Campaigns</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total MintFun"
          value={stats.mintfunCount}
          subtitle={`${stats.activeMintfun} active`}
          subtitleColor="green"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          }
        />

        <StatCard
          title="Total Quests"
          value={stats.questCount}
          subtitle={`${stats.activeQuests} active`}
          subtitleColor="green"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
        />

        <StatCard
          title="Active Campaigns"
          value={stats.activeMintfun + stats.activeQuests}
          subtitle="across all types"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          }
        />

        <StatCard
          title="Total Campaigns"
          value={stats.mintfunCount + stats.questCount}
          subtitle="MintFun + Quests"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card 
          variant="glass" 
          className="transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]"
        >
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
              <Button variant="glass" size="sm">
                Manage Chains
              </Button>
            </Link>
            <Link href="/admin/settings/theme">
              <Button variant="glass" size="sm">
                Global Theme
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Campaigns */}
        <Card 
          variant="glass" 
          className="transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]"
        >
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCampaigns.length === 0 ? (
              <p className="text-sm text-gray-400">No campaigns yet</p>
            ) : (
              <ul className="space-y-3">
                {recentCampaigns.map((campaign) => (
                  <li 
                    key={campaign.id} 
                    className="flex items-center justify-between p-2 -mx-2 rounded-lg transition-colors duration-200 hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'rounded px-2 py-0.5 text-xs font-medium border',
                          campaign.type === 'mintfun'
                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        )}
                      >
                        {campaign.type === 'mintfun' ? 'MintFun' : 'Quest'}
                      </span>
                      <Link
                        href={`/admin/campaigns/${campaign.type}/${campaign.id}`}
                        className="text-sm text-white hover:text-primary transition-colors duration-200"
                      >
                        {campaign.title}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          campaign.is_active 
                            ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' 
                            : 'bg-gray-500'
                        )}
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
