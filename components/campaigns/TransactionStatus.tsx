'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';

export type TransactionStatusType = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

export interface TransactionError {
  message: string;
  code?: string;
}

export interface TransactionStatusProps {
  status: TransactionStatusType;
  error?: TransactionError | Error | null;
  txHash?: string | null;
  onReset?: () => void;
  chainId?: number;
  className?: string;
}

const getExplorerUrl = (chainId: number, txHash: string): string => {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    5: 'https://goerli.etherscan.io',
    11155111: 'https://sepolia.etherscan.io',
    137: 'https://polygonscan.com',
    80001: 'https://mumbai.polygonscan.com',
    42161: 'https://arbiscan.io',
    421613: 'https://goerli.arbiscan.io',
    10: 'https://optimistic.etherscan.io',
    420: 'https://goerli-optimism.etherscan.io',
    8453: 'https://basescan.org',
    84531: 'https://goerli.basescan.org',
  };
  const baseUrl = explorers[chainId] || 'https://etherscan.io';
  return `${baseUrl}/tx/${txHash}`;
};

export function TransactionStatus({
  status,
  error,
  txHash,
  onReset,
  chainId = 1,
  className,
}: TransactionStatusProps) {
  if (status === 'idle') return null;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Pending/Confirming State */}
      {(status === 'pending' || status === 'confirming') && (
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 motion-safe:animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full bg-primary/30 motion-safe:animate-ping" />
              {/* Spinning loader */}
              <Loader2 className="h-6 w-6 text-primary motion-safe:animate-spin relative z-10" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-primary">
                {status === 'pending' ? 'Waiting for confirmation...' : 'Transaction confirming...'}
              </p>
              <p className="text-sm text-foreground/60">
                {status === 'pending'
                  ? 'Please confirm the transaction in your wallet'
                  : 'Your transaction is being processed on the blockchain'}
              </p>
            </div>
          </div>
          
          {/* Progress bar animation */}
          {status === 'confirming' && (
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-primary/20">
              <div className="h-full w-full origin-left animate-[progress_2s_ease-in-out_infinite] bg-gradient-to-r from-primary via-secondary to-primary" />
            </div>
          )}
        </div>
      )}

      {/* Success State */}
      {status === 'success' && txHash && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 motion-safe:animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* Success glow */}
              <div className="absolute inset-0 rounded-full bg-green-500/30 blur-md motion-safe:animate-pulse" />
              <CheckCircle className="h-6 w-6 text-green-400 relative z-10" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-400">Mint successful!</p>
              <p className="text-sm text-foreground/60">
                Your NFT has been minted successfully
              </p>
            </div>
          </div>
          
          <a
            href={getExplorerUrl(chainId, txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400 transition-all duration-300 hover:bg-green-500/20 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
          >
            <span>View transaction</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 motion-safe:animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* Error glow */}
              <div className="absolute inset-0 rounded-full bg-red-500/30 blur-md motion-safe:animate-pulse" />
              <XCircle className="h-6 w-6 text-red-400 relative z-10" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-400">Transaction failed</p>
              <p className="text-sm text-foreground/60 line-clamp-2">
                {error.message || 'An error occurred during the transaction'}
              </p>
            </div>
          </div>
          
          {onReset && (
            <button
              onClick={onReset}
              className="mt-3 w-full rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-all duration-300 hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Standalone loading spinner with glow effect
export function GlowSpinner({
  size = 'md',
  color = 'primary',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'border-primary/30 border-t-primary',
    secondary: 'border-secondary/30 border-t-secondary',
    accent: 'border-accent/30 border-t-accent',
  };

  const glowClasses = {
    primary: 'bg-primary/20',
    secondary: 'bg-secondary/20',
    accent: 'bg-accent/20',
  };

  return (
    <div className={cn('relative', className)}>
      {/* Glow effect */}
      <div
        className={cn(
          'absolute inset-0 rounded-full blur-xl motion-safe:animate-pulse',
          glowClasses[color]
        )}
      />
      {/* Spinner */}
      <div
        className={cn(
          'relative rounded-full border-4 motion-safe:animate-spin',
          sizeClasses[size],
          colorClasses[color]
        )}
      />
    </div>
  );
}
