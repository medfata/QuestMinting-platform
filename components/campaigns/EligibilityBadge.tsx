'use client';

import type { EligibilityCondition, EligibilityCheckResult } from '@/types/quest';
import { formatUnits } from 'viem';
import { cn } from '@/lib/utils';

export interface EligibilityBadgeProps {
  condition: EligibilityCondition | null;
  checkResult: EligibilityCheckResult | null;
  isLoading?: boolean;
  isConnected?: boolean;
  className?: string;
}

export function EligibilityBadge({
  condition,
  checkResult,
  isLoading = false,
  isConnected = false,
  className = '',
}: EligibilityBadgeProps) {
  // No eligibility requirement
  if (!condition) {
    return (
      <div className={cn('rounded-xl bg-muted/30 border border-border p-4', className)}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="font-medium text-foreground text-sm">Open to everyone</span>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground pl-7">
          No eligibility requirements for this quest.
        </p>
      </div>
    );
  }

  // Not connected
  if (!isConnected) {
    return (
      <div className={cn('rounded-xl bg-muted/30 border border-border p-4', className)}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
            <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span className="font-medium text-foreground text-sm">Eligibility Required</span>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground pl-7">
          Connect your wallet to check eligibility.
        </p>
        <EligibilityRequirement condition={condition} />
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className={cn('rounded-xl bg-muted/30 border border-border p-4', className)}>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <span className="font-medium text-foreground text-sm">
            Checking eligibility...
          </span>
        </div>
      </div>
    );
  }

  // Check result available
  if (checkResult) {
    if (checkResult.is_eligible) {
      return (
        <div className={cn('rounded-xl bg-primary/5 border border-primary/20 p-4', className)}>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium text-foreground text-sm">Eligible</span>
          </div>
          <EligibilityDetails condition={condition} checkResult={checkResult} />
        </div>
      );
    }

    return (
      <div className={cn('rounded-xl bg-destructive/5 border border-destructive/20 p-4', className)}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg className="w-3 h-3 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <span className="font-medium text-foreground text-sm">Not eligible</span>
        </div>
        <EligibilityDetails condition={condition} checkResult={checkResult} />
      </div>
    );
  }

  // Fallback - show requirement
  return (
    <div className={cn('rounded-xl bg-muted/30 border border-border p-4', className)}>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
          <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="font-medium text-foreground text-sm">Eligibility Required</span>
      </div>
      <EligibilityRequirement condition={condition} />
    </div>
  );
}

interface EligibilityRequirementProps {
  condition: EligibilityCondition;
}

function EligibilityRequirement({ condition }: EligibilityRequirementProps) {
  const isNFT = condition.type === 'nft';
  const hasSpecificContract = condition.contract_address !== null;

  return (
    <div className="mt-2 text-sm text-muted-foreground pl-7">
      <p>
        {isNFT ? (
          <>
            Hold at least <span className="font-medium text-foreground">{condition.min_amount}</span> NFT
            {Number(condition.min_amount) !== 1 ? 's' : ''}
            {hasSpecificContract && (
              <>
                {' '}from{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground/80">
                  {truncateAddress(condition.contract_address!)}
                </code>
              </>
            )}
          </>
        ) : (
          <>
            Hold at least{' '}
            <span className="font-medium text-foreground">{formatTokenAmount(condition.min_amount)}</span> tokens
            {hasSpecificContract && (
              <>
                {' '}of{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground/80">
                  {truncateAddress(condition.contract_address!)}
                </code>
              </>
            )}
          </>
        )}
      </p>
    </div>
  );
}

interface EligibilityDetailsProps {
  condition: EligibilityCondition;
  checkResult: EligibilityCheckResult;
}

function EligibilityDetails({ condition, checkResult }: EligibilityDetailsProps) {
  const isNFT = condition.type === 'nft';

  return (
    <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5 text-sm pl-7">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Required</span>
        <span className="font-medium text-foreground">
          {isNFT
            ? `${checkResult.required_amount} NFT${Number(checkResult.required_amount) !== 1 ? 's' : ''}`
            : `${formatTokenAmount(checkResult.required_amount)} tokens`}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Your balance</span>
        <span className={cn(
          'font-medium',
          checkResult.is_eligible ? 'text-primary' : 'text-destructive'
        )}>
          {isNFT
            ? `${checkResult.current_balance} NFT${Number(checkResult.current_balance) !== 1 ? 's' : ''}`
            : `${formatTokenAmount(checkResult.current_balance)} tokens`}
        </span>
      </div>
    </div>
  );
}

function truncateAddress(address: string): string {
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTokenAmount(amount: string): string {
  try {
    // Assume 18 decimals for display, format nicely
    const formatted = formatUnits(BigInt(amount), 18);
    const num = parseFloat(formatted);
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  } catch {
    return amount;
  }
}
