'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { QuestCampaign } from '@/types/quest';
import { CardContent, CardFooter } from '@/components/ui/Card';
import { GlowCard } from '@/components/futuristic/glow-card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export interface QuestCardProps {
  campaign: QuestCampaign;
  className?: string;
  /** Animation delay for staggered entrance (in ms) */
  animationDelay?: number;
}

export function QuestCard({ campaign, className = '', animationDelay = 0 }: QuestCardProps) {
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
        'opacity-0 motion-safe:animate-fade-in',
        className
      )}
      style={{ 
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'forwards'
      }}
    >
      <Link href={`/quest/${campaign.slug}`} className="block">
        {/* Image Container with hover zoom */}
        <div className="relative aspect-square w-full overflow-hidden">
          <Image
            src={campaign.image_url}
            alt={campaign.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          {/* Badges */}
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            <Badge variant="glow-secondary" className="shadow-lg">
              Quest
            </Badge>
          </div>
          {hasEligibility && (
            <Badge 
              variant="warning" 
              className="absolute left-3 top-3 shadow-lg"
            >
              Gated
            </Badge>
          )}
        </div>
        
        {/* Content */}
        <CardContent className="p-4">
          <h3 className="mb-1 text-lg font-semibold text-foreground transition-colors group-hover:text-secondary">
            {campaign.title}
          </h3>
          {campaign.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {campaign.description}
            </p>
          )}
        </CardContent>
        
        {/* Footer with divider */}
        <CardFooter className="border-t border-border p-4">
          <div className="flex w-full items-center justify-between">
            <span className="text-sm font-medium text-primary">
              Free Mint
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
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
        </CardFooter>
      </Link>
    </GlowCard>
  );
}
