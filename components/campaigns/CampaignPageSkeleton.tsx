'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export interface CampaignPageSkeletonProps {
  variant?: 'mintfun' | 'quest';
  className?: string;
}

export function CampaignPageSkeleton({ variant = 'mintfun', className = '' }: CampaignPageSkeletonProps) {
  return (
    <div className={`mx-auto max-w-4xl px-4 py-8 ${className}`}>
      <div className="grid gap-8 md:grid-cols-2">
        {/* Image section */}
        <div>
          <Skeleton className="aspect-square w-full rounded-xl" />
        </div>

        {/* Content section */}
        <div className="flex flex-col gap-6">
          {/* Title */}
          <div>
            <Skeleton className="mb-2 h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-2/3" />
          </div>

          {/* Tiers or Tasks */}
          <Card variant="default" padding="md">
            <CardContent className="space-y-4 p-0">
              <Skeleton className="h-5 w-32" />
              
              {variant === 'mintfun' ? (
                // Mint tier skeletons
                <>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 p-3">
                    <div className="flex-1">
                      <Skeleton className="mb-1 h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 p-3">
                    <div className="flex-1">
                      <Skeleton className="mb-1 h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                </>
              ) : (
                // Task list skeletons
                <>
                  <div className="flex items-center gap-3 rounded-lg border border-white/10 p-3">
                    <Skeleton variant="circular" className="h-6 w-6" />
                    <div className="flex-1">
                      <Skeleton className="mb-1 h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-white/10 p-3">
                    <Skeleton variant="circular" className="h-6 w-6" />
                    <div className="flex-1">
                      <Skeleton className="mb-1 h-4 w-36" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-white/10 p-3">
                    <Skeleton variant="circular" className="h-6 w-6" />
                    <div className="flex-1">
                      <Skeleton className="mb-1 h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Mint button */}
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
