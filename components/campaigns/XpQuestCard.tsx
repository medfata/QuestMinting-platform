'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { XpQuestCampaign } from '@/types/xpQuest';
import { GlowCard } from '@/components/futuristic/glow-card';
import { cn } from '@/lib/utils';

// Chain info helper
const CHAIN_INFO: Record<number, { name: string; slug: string }> = {
  1: { name: 'Ethereum', slug: 'ethereum' },
  10: { name: 'Optimism', slug: 'optimism' },
  56: { name: 'BNB Chain', slug: 'bsc' },
  137: { name: 'Polygon', slug: 'polygon' },
  324: { name: 'zkSync', slug: 'zksync-era' },
  8453: { name: 'Base', slug: 'base' },
  42161: { name: 'Arbitrum', slug: 'arbitrum' },
  57073: { name: 'Ink', slug: 'ink' },
  59144: { name: 'Linea', slug: 'linea' },
  534352: { name: 'Scroll', slug: 'scroll' },
  81457: { name: 'Blast', slug: 'blast' },
  7777777: { name: 'Zora', slug: 'zora' },
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

export interface XpQuestCardProps {
  campaign: XpQuestCampaign;
  className?: string;
  animationDelay?: number;
}

export function XpQuestCard({ campaign, className = '', animationDelay = 0 }: XpQuestCardProps) {
  const [chainImgError, setChainImgError] = useState(false);
  const chainInfo = getChainInfo(campaign.verification_chain_id);

  return (
    <GlowCard
      glowColor="accent"
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
      <Link href={`/xp-quest/${campaign.slug}`} className="block">
        <div className="relative aspect-[2/3] w-full overflow-hidden">
          <Image
            src={campaign.image_url}
            alt={campaign.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          
          {/* XP Badge */}
          <div className="absolute right-3 top-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/90 text-white text-xs font-bold shadow-lg">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              +{campaign.xp_reward} XP
            </div>
          </div>
          
          {/* Bottom Content */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="mb-1 text-base font-semibold text-white transition-colors group-hover:text-amber-400">
              {campaign.title}
            </h3>
            {campaign.description && (
              <p className="line-clamp-2 text-xs text-white/70 mb-3">
                {campaign.description}
              </p>
            )}
            
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
              </div>
              <span className="flex items-center gap-1 text-xs text-white/60">
                XP Quest
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
