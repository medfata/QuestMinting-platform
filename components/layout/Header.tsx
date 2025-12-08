'use client';

import dynamic from 'next/dynamic';
import { HTMLAttributes, forwardRef } from 'react';
import Link from 'next/link';

// Dynamically import ConnectButton to avoid SSR issues with Web3Modal
const ConnectButton = dynamic(
  () => import('@/components/wallet/ConnectButton').then((mod) => mod.ConnectButton),
  { ssr: false }
);

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  showNav?: boolean;
  logoText?: string;
}

export const Header = forwardRef<HTMLElement, HeaderProps>(
  ({ className = '', showNav = true, logoText = 'MintPlatform', ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={`sticky top-0 z-40 w-full border-b border-white/10 bg-[var(--color-background,#0f172a)]/80 backdrop-blur-md ${className}`}
        {...props}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-[var(--color-text,#f8fafc)] transition-opacity hover:opacity-80"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--color-primary,#3b82f6)]"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            {logoText}
          </Link>

          {/* Navigation */}
          {showNav && (
            <nav className="hidden items-center gap-6 md:flex">
              <Link
                href="/"
                className="text-sm font-medium text-gray-300 transition-colors hover:text-[var(--color-text,#f8fafc)]"
              >
                Home
              </Link>
              <Link
                href="/campaigns"
                className="text-sm font-medium text-gray-300 transition-colors hover:text-[var(--color-text,#f8fafc)]"
              >
                Campaigns
              </Link>
            </nav>
          )}

          {/* Connect Button */}
          <div className="flex items-center gap-4">
            <ConnectButton />
          </div>
        </div>
      </header>
    );
  }
);

Header.displayName = 'Header';
