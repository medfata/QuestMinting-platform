'use client';

import { HTMLAttributes, forwardRef } from 'react';

export type TransactionState = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

export interface TransactionStatusProps extends HTMLAttributes<HTMLDivElement> {
  state: TransactionState;
  txHash?: string;
  explorerUrl?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const TransactionStatus = forwardRef<HTMLDivElement, TransactionStatusProps>(
  ({ state, txHash, explorerUrl, errorMessage, onRetry, onDismiss, className = '', ...props }, ref) => {
    if (state === 'idle') return null;

    const stateConfig = {
      pending: {
        icon: <SpinnerIcon className="h-5 w-5 motion-safe:animate-spin text-blue-400" />,
        title: 'Waiting for confirmation',
        description: 'Please confirm the transaction in your wallet',
        bgColor: 'bg-blue-500/10 border-blue-500/30',
      },
      confirming: {
        icon: <SpinnerIcon className="h-5 w-5 motion-safe:animate-spin text-yellow-400" />,
        title: 'Transaction submitted',
        description: 'Waiting for blockchain confirmation...',
        bgColor: 'bg-yellow-500/10 border-yellow-500/30',
      },
      success: {
        icon: <CheckIcon className="h-5 w-5 text-green-400" />,
        title: 'Transaction successful',
        description: 'Your transaction has been confirmed',
        bgColor: 'bg-green-500/10 border-green-500/30',
      },
      error: {
        icon: <ErrorIcon className="h-5 w-5 text-red-400" />,
        title: 'Transaction failed',
        description: errorMessage || 'Something went wrong',
        bgColor: 'bg-red-500/10 border-red-500/30',
      },
    };

    const config = stateConfig[state];

    return (
      <div
        ref={ref}
        className={`rounded-lg border p-4 ${config.bgColor} ${className}`}
        {...props}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[var(--color-text,#f8fafc)]">{config.title}</p>
            <p className="text-sm text-[var(--color-text,#f8fafc)]/70 mt-0.5">
              {config.description}
            </p>
            
            {txHash && explorerUrl && (
              <a
                href={`${explorerUrl}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-sm text-[var(--color-primary,#3b82f6)] hover:underline"
              >
                View on explorer
                <ExternalLinkIcon className="h-3 w-3" />
              </a>
            )}

            {(state === 'error' || state === 'success') && (onRetry || onDismiss) && (
              <div className="mt-3 flex gap-2">
                {state === 'error' && onRetry && (
                  <button
                    onClick={onRetry}
                    className="text-sm font-medium text-[var(--color-primary,#3b82f6)] hover:underline"
                  >
                    Try again
                  </button>
                )}
                {onDismiss && (
                  <button
                    onClick={onDismiss}
                    className="text-sm font-medium text-gray-400 hover:text-gray-300"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

TransactionStatus.displayName = 'TransactionStatus';

// Icon components
function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}
