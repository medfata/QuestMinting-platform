'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { getErrorMessage } from '@/lib/errors';

export interface ErrorAlertProps extends HTMLAttributes<HTMLDivElement> {
  error: unknown;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorAlert = forwardRef<HTMLDivElement, ErrorAlertProps>(
  ({ error, onRetry, onDismiss, className = '', ...props }, ref) => {
    if (!error) return null;

    const message = getErrorMessage(error);

    return (
      <div
        ref={ref}
        role="alert"
        className={`rounded-lg bg-red-500/10 border border-red-500/30 p-4 ${className}`}
        {...props}
      >
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-red-300">{message}</p>
            {(onRetry || onDismiss) && (
              <div className="mt-3 flex gap-2">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                  >
                    Try again
                  </button>
                )}
                {onDismiss && (
                  <button
                    onClick={onDismiss}
                    className="text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors"
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

ErrorAlert.displayName = 'ErrorAlert';
