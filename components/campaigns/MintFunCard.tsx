'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { MintFunCampaign } from '@/types/campaign';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatEther } from 'viem';

export interface MintFunCardProps {
  campaign: MintFunCampaign;
  className?: string;
}

export function MintFunCard({ campaign, className = '' }: MintFunCardProps) {
  // Get the lowest price tier for display
  const lowestPriceTier = campaign.mint_tiers.reduce((lowest, tier) => {
    const tierPrice = BigInt(tier.price || '0');
    const lowestPrice = BigInt(lowest?.price || '0');
    return !lowest || tierPrice < lowestPrice ? tier : lowest;
  }, campaign.mint_tiers[0]);

  const isFree = lowestPriceTier && BigInt(lowestPriceTier.price || '0') === BigInt(0);
  const priceDisplay = isFree
    ? 'Free'
    : lowestPriceTier
      ? `From ${formatEther(BigInt(lowestPriceTier.price))} ETH`
      : 'View Details';

  return (
    <Card
      variant="elevated"
      padding="none"
      className={`overflow-hidden transition-transform hover:scale-[1.02] ${className}`}
    >
      <Link href={`/mint/${campaign.slug}`} className="block">
        <div className="relative aspect-square w-full overflow-hidden">
          <Image
            src={campaign.image_url}
            alt={campaign.title}
            fill
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {isFree && (
            <span className="absolute right-2 top-2 rounded-full bg-green-500 px-2 py-1 text-xs font-semibold text-white">
              Free Mint
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
              {priceDisplay}
            </span>
            <span className="text-xs text-[var(--color-text,#f8fafc)]/50">
              {campaign.mint_tiers.length} tier{campaign.mint_tiers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
