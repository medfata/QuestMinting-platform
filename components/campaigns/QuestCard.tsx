'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { QuestCampaign } from '@/types/quest';
import { GlowCard } from '@/components/futuristic/glow-card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

// Chain info helper
const CHAIN_INFO: Record<number, { name: string; slug: string }> = {
  1: { name: 'Ethereum', slug: 'ethereum' },
  10: { name: 'Optimism', slug: 'optimism' },
  56: { name: 'BNB Chain', slug: 'bsc' },
  137: { name: 'Polygon', slug: 'polygon' },
  250: { name: 'Fantom', slug: 'fantom' },
  324: { name: 'zkSync', slug: 'zksync-era' },
  8453: { name: 'Base', slug: 'base' },
  42161: { name: 'Arbitrum', slug: 'arbitrum' },
  43114: { name: 'Avalanche', slug: 'avalanche' },
  59144: { name: 'Linea', slug: 'linea' },
  534352: { name: 'Scroll', slug: 'scroll' },
  81457: { name: 'Blast', slug: 'blast' },
  5000: { name: 'Mantle', slug: 'mantle' },
  34443: { name: 'Mode', slug: 'mode' },
  7777777: { name: 'Zora', slug: 'zora' },
  11155111: { name: 'Sepolia', slug: 'ethereum' },
};

function getChainInfo(chainId: number | null): { name: string; iconUrl: string } {
  const info = chainId ? CHAIN_INFO[chainId] : null;
  const name = info?.name || 'Unknown';
  const slug = info?.slug || 'ethereum';
  return {
    name,
    iconUrl: `https://icons.llamao.fi/icons/chains/rsz_${slug}.jpg`,
  };
}

export interface QuestCardProps {
  campaign: QuestCampaign;
  className?: string;
  /** Animation delay for staggered entrance (in ms) */
  animationDelay?: number;
}

export function QuestCard({ campaign, className = '', animationDelay = 0 }: QuestCardProps) {
  const [chainImgError, setChainImgError] = useState(false);
  const chainInfo = getChainInfo(campaign.chain_id);
  const taskCount = campaign.tasks.length;
  const hasEligibility = campaign.eligibility !== null;

  return (
    <GlowCard
      glowColor="secondary"
      intensity="low"
      hoverLift={true}
      padding="none"
      className={cn(
        'overflow-hidden group cursor-pointer',
        'animate-fade-in',
        className
      )}
      style={{ 
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'forwards'
      }}
    >
      <Link href={`/quest/${campaign.slug}`} className="block">
        {/* Full-bleed image with overlay content */}
        <div className="relative aspect-[2/3] w-full overflow-hidden">
          <Image
            src={campaign.image_url}
            alt={campaign.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          
          {/* Top Badges */}
          {hasEligibility && (
            <div className="absolute right-3 top-3">
              <Badge variant="warning" className="shadow-lg">
                Gated
              </Badge>
            </div>
          )}
          
          {/* Bottom Content Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="mb-1 text-base font-semibold text-white transition-colors group-hover:text-secondary">
              {campaign.title}
            </h3>
            {campaign.description && (
              <p className="line-clamp-2 text-xs text-white/70 mb-3">
                {campaign.description}
              </p>
            )}
            
            {/* Footer info */}
            <div className="flex w-full items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                  <div className="relative w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                    {!chainImgError ? (
                      <Image
                        src={chainInfo.iconUrl}
                        alt={chainInfo.name}
                        fill
                        className="object-cover"
                        sizes="16px"
                        onError={() => setChainImgError(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/20 text-white text-[8px] font-bold">
                        {chainInfo.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-white/90">{chainInfo.name}</span>
                </div>
                <span className="text-sm font-medium text-primary">
                  Free
                </span>
              </div>
              <span className="flex items-center gap-1 text-xs text-white/60">
                {taskCount} task{taskCount !== 1 ? 's' : ''}
                <svg 
                  className="h-4 w-4 transition-transform group-hover:translate-x-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </GlowCard>
  );
}
