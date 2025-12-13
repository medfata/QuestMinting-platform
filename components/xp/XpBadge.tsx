'use client';

import { cn } from '@/lib/utils';
import { useUserXp } from '@/hooks/useUserXp';

interface XpBadgeProps {
  className?: string;
  showLabel?: boolean;
}

export function XpBadge({ className, showLabel = true }: XpBadgeProps) {
  const { userXp, isLoading } = useUserXp();

  if (isLoading) {
    return (
      <div className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        'bg-amber-500/10 border border-amber-500/20',
        'animate-pulse',
        className
      )}>
        <div className="w-4 h-4 rounded-full bg-amber-500/30" />
        <div className="w-8 h-3 rounded bg-amber-500/30" />
      </div>
    );
  }

  if (!userXp) {
    return null;
  }

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
      'bg-amber-500/10 border border-amber-500/20',
      'text-amber-500 font-medium text-sm',
      className
    )}>
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
      <span>{userXp.total_xp.toLocaleString()}</span>
      {showLabel && <span className="text-amber-500/70">XP</span>}
    </div>
  );
}
