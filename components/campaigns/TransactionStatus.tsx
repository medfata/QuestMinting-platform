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
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 motion-safe:animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="relative">
              <CheckCircle className="h-5 w-5 text-primary relative z-10" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">Transaction successful</p>
              <p className="text-xs text-muted-foreground">
                Your NFT has been minted
              </p>
            </div>
          </div>
          
          <a
            href={getExplorerUrl(chainId, txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-muted/50 border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <span>View transaction</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && error && (
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 motion-safe:animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="relative">
              <XCircle className="h-5 w-5 text-destructive relative z-10" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">Transaction failed</p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {error.message || 'An error occurred during the transaction'}
              </p>
            </div>
          </div>
          
          {onReset && (
            <button
              onClick={onReset}
              className="mt-3 w-full rounded-lg bg-muted/50 border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
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
