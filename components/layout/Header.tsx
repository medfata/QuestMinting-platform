'use client';

import dynamic from 'next/dynamic';
import { HTMLAttributes, forwardRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
      const handleScroll = () => {
        const isScrolled = window.scrollY > 20;
        if (isScrolled !== scrolled) {
          setScrolled(isScrolled);
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }, [scrolled]);

    return (
      <header
        ref={ref}
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300 ease-in-out',
          scrolled
            ? 'border-b border-white/10 bg-background/80 backdrop-blur-xl shadow-lg shadow-black/10'
            : 'border-b border-transparent bg-transparent backdrop-blur-sm',
          className
        )}
        {...props}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2 text-xl font-bold text-foreground transition-all duration-300 hover:opacity-90"
          >
            <div className="relative">
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
                className="text-primary transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground bg-clip-text transition-all duration-300 group-hover:from-primary group-hover:to-secondary group-hover:text-transparent">
              {logoText}
            </span>
          </Link>

          {/* Navigation */}
          {showNav && (
            <nav className="hidden items-center gap-1 md:flex">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/campaigns">Campaigns</NavLink>
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

// Navigation link component with hover animations
interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

function NavLink({ href, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'relative px-4 py-2 text-sm font-medium text-muted-foreground rounded-md',
        'transition-all duration-300 ease-out',
        'hover:text-foreground',
        // Focus visible styles for keyboard navigation
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'focus-visible:text-foreground',
        // Animated underline effect
        'after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-0',
        'after:bg-gradient-to-r after:from-primary after:to-secondary',
        'after:transition-all after:duration-300 after:ease-out',
        'after:-translate-x-1/2',
        'hover:after:w-3/4',
        // Glow effect on hover
        'hover:drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]'
      )}
    >
      {children}
    </Link>
  );
}
