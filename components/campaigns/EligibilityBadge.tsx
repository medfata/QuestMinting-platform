'use client';

import type { EligibilityCondition, EligibilityCheckResult } from '@/types/quest';
import { formatUnits } from 'viem';

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
      <div className={`rounded-lg bg-green-500/10 p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-green-400">✓</span>
          <span className="font-medium text-green-400">Open to everyone</span>
        </div>
        <p className="mt-1 text-sm text-[var(--color-text,#f8fafc)]/70">
          No eligibility requirements for this quest.
        </p>
      </div>
    );
  }

  // Not connected
  if (!isConnected) {
    return (
      <div className={`rounded-lg bg-amber-500/10 p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-amber-400">⚠</span>
          <span className="font-medium text-amber-400">Eligibility Required</span>
        </div>
        <p className="mt-1 text-sm text-[var(--color-text,#f8fafc)]/70">
          Connect your wallet to check eligibility.
        </p>
        <EligibilityRequirement condition={condition} />
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className={`rounded-lg bg-white/5 p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
          <span className="font-medium text-[var(--color-text,#f8fafc)]">
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
        <div className={`rounded-lg bg-green-500/10 p-4 ${className}`}>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span className="font-medium text-green-400">You are eligible!</span>
          </div>
          <EligibilityDetails condition={condition} checkResult={checkResult} />
        </div>
      );
    }

    return (
      <div className={`rounded-lg bg-red-500/10 p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-red-400">✗</span>
          <span className="font-medium text-red-400">Not eligible</span>
        </div>
        <EligibilityDetails condition={condition} checkResult={checkResult} />
      </div>
    );
  }

  // Fallback - show requirement
  return (
    <div className={`rounded-lg bg-amber-500/10 p-4 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-amber-400">⚠</span>
        <span className="font-medium text-amber-400">Eligibility Required</span>
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
    <div className="mt-2 text-sm text-[var(--color-text,#f8fafc)]/70">
      <p>
        {isNFT ? (
          <>
            Hold at least <strong>{condition.min_amount}</strong> NFT
            {Number(condition.min_amount) !== 1 ? 's' : ''}
            {hasSpecificContract && (
              <>
                {' '}from collection{' '}
                <code className="rounded bg-white/10 px-1 py-0.5 text-xs">
                  {truncateAddress(condition.contract_address!)}
                </code>
              </>
            )}
          </>
        ) : (
          <>
            Hold at least{' '}
            <strong>{formatTokenAmount(condition.min_amount)}</strong> tokens
            {hasSpecificContract && (
              <>
                {' '}of{' '}
                <code className="rounded bg-white/10 px-1 py-0.5 text-xs">
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
    <div className="mt-2 space-y-1 text-sm text-[var(--color-text,#f8fafc)]/70">
      <p>
        Required:{' '}
        <strong>
          {isNFT
            ? `${checkResult.required_amount} NFT${Number(checkResult.required_amount) !== 1 ? 's' : ''}`
            : `${formatTokenAmount(checkResult.required_amount)} tokens`}
        </strong>
      </p>
      <p>
        Your balance:{' '}
        <strong
          className={checkResult.is_eligible ? 'text-green-400' : 'text-red-400'}
        >
          {isNFT
            ? `${checkResult.current_balance} NFT${Number(checkResult.current_balance) !== 1 ? 's' : ''}`
            : `${formatTokenAmount(checkResult.current_balance)} tokens`}
        </strong>
      </p>
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
