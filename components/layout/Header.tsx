'use client';

import dynamic from 'next/dynamic';
import { HTMLAttributes, forwardRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

import { ThemeToggle } from '@/components/theme';
import { useAdminStatus } from '@/hooks/useAdminStatus';

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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { isAdmin } = useAdminStatus();

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
          'sticky top-0 z-50 w-full transition-all duration-500',
          scrolled
            ? 'bg-background/60 backdrop-blur-2xl border-b border-border/50 shadow-lg'
            : 'bg-transparent',
          className
        )}
        {...props}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-3 text-xl font-bold text-foreground transition-all duration-300"
          >
            {/* Animated Logo Icon */}
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent rounded-xl opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-[2px] bg-background rounded-[10px]" />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="relative z-10 text-foreground group-hover:text-primary transition-colors duration-300"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="hidden sm:block font-semibold tracking-tight">
              {logoText}
            </span>
          </Link>

          {/* Desktop Navigation */}
          {showNav && (
            <nav className="hidden md:flex items-center gap-1">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/mintfun">MintFun</NavLink>
              <NavLink href="/quests">Quests</NavLink>
            </nav>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Admin Button - only shown for admins */}
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  'hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl',
                  'bg-gradient-to-r from-primary/10 to-secondary/10 text-primary',
                  'border border-primary/20 hover:border-primary/40',
                  'transition-all duration-300 hover:shadow-lg hover:shadow-primary/10'
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Admin
              </Link>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Connect Button */}
            <ConnectButton />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-xl bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 transition-colors"
              aria-label="Toggle menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={cn(
                  "w-full h-0.5 bg-foreground rounded-full transition-all duration-300",
                  mobileMenuOpen && "rotate-45 translate-y-[7px]"
                )} />
                <span className={cn(
                  "w-full h-0.5 bg-foreground rounded-full transition-all duration-300",
                  mobileMenuOpen && "opacity-0"
                )} />
                <span className={cn(
                  "w-full h-0.5 bg-foreground rounded-full transition-all duration-300",
                  mobileMenuOpen && "-rotate-45 -translate-y-[7px]"
                )} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-300",
          mobileMenuOpen ? "max-h-80 border-t border-border/50" : "max-h-0"
        )}>
          <nav className="px-4 py-4 space-y-1 bg-background/80 backdrop-blur-xl">
            <MobileNavLink href="/" onClick={() => setMobileMenuOpen(false)}>Home</MobileNavLink>
            <MobileNavLink href="/mintfun" onClick={() => setMobileMenuOpen(false)}>MintFun</MobileNavLink>
            <MobileNavLink href="/quests" onClick={() => setMobileMenuOpen(false)}>Quests</MobileNavLink>
            {isAdmin && (
              <MobileNavLink href="/admin" onClick={() => setMobileMenuOpen(false)}>
                Admin Panel
              </MobileNavLink>
            )}
          </nav>
        </div>
      </header>
    );
  }
);

Header.displayName = 'Header';

// Desktop Navigation link component
interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

function NavLink({ href, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'relative px-5 py-2.5 text-sm font-medium text-muted-foreground rounded-xl',
        'transition-all duration-300 ease-out',
        'hover:text-foreground hover:bg-foreground/5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'group'
      )}
    >
      {children}
      {/* Animated underline */}
      <span className={cn(
        'absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-0 rounded-full',
        'bg-gradient-to-r from-primary to-secondary',
        'transition-all duration-300 ease-out',
        'group-hover:w-1/2'
      )} />
    </Link>
  );
}

// Mobile Navigation link component
interface MobileNavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}

function MobileNavLink({ href, children, onClick }: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'block px-4 py-3 text-base font-medium text-muted-foreground rounded-xl',
        'transition-all duration-200',
        'hover:text-foreground hover:bg-foreground/5',
        'active:bg-foreground/10'
      )}
    >
      {children}
    </Link>
  );
}
