'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { QuestCampaign } from '@/types/quest';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';

export interface QuestCardProps {
  campaign: QuestCampaign;
  className?: string;
}

export function QuestCard({ campaign, className = '' }: QuestCardProps) {
  const taskCount = campaign.tasks.length;
  const hasEligibility = campaign.eligibility !== null;

  return (
    <Card
      variant="elevated"
      padding="none"
      className={`overflow-hidden transition-transform hover:scale-[1.02] ${className}`}
    >
      <Link href={`/quest/${campaign.slug}`} className="block">
        <div className="relative aspect-square w-full overflow-hidden">
          <Image
            src={campaign.image_url}
            alt={campaign.title}
            fill
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <span className="absolute right-2 top-2 rounded-full bg-purple-500 px-2 py-1 text-xs font-semibold text-white">
            Quest
          </span>
          {hasEligibility && (
            <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-1 text-xs font-semibold text-white">
              Gated
            </span>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="mb-1 text-lg font-semibold text-[var(--color-text,#f8fafc)]">
            {campaign.title}
          </h3>
          {campaign.description && (
            <p className="line-clamp-2 text-sm text-[var(--color-text,#f8fafc)]/70">
              {campaign.description}
            </p>
          )}
        </CardContent>
        <CardFooter className="border-t border-white/10 p-4">
          <div className="flex w-full items-center justify-between">
            <span className="text-sm font-medium text-[var(--color-primary,#3b82f6)]">
              Free Mint
            </span>
            <span className="text-xs text-[var(--color-text,#f8fafc)]/50">
              {taskCount} task{taskCount !== 1 ? 's' : ''}
            </span>
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
