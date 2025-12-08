'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export interface CampaignCardSkeletonProps {
  className?: string;
}

export function CampaignCardSkeleton({ className = '' }: CampaignCardSkeletonProps) {
  return (
    <Card
      variant="elevated"
      padding="none"
      className={`overflow-hidden ${className}`}
    >
      {/* Image placeholder */}
      <Skeleton className="aspect-square w-full" />
      
      <CardContent className="p-4">
        {/* Title */}
        <Skeleton className="mb-2 h-6 w-3/4" />
        {/* Description lines */}
        <Skeleton className="mb-1 h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      
      <CardFooter className="border-t border-white/10 p-4">
        <div className="flex w-full items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardFooter>
    </Card>
  );
}
