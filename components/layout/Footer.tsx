'use client';

import { HTMLAttributes, forwardRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface FooterProps extends HTMLAttributes<HTMLElement> {
  showSocials?: boolean;
}

export const Footer = forwardRef<HTMLElement, FooterProps>(
  ({ className = '', showSocials = true, ...props }, ref) => {
    const currentYear = new Date().getFullYear();

    return (
      <footer
        ref={ref}
        className={cn(
          'relative border-t border-border/50',
          className
        )}
        {...props}
      >
        {/* Background gradient - theme aware */}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-4">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <Link href="/" className="inline-flex items-center gap-3 mb-4">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent rounded-xl opacity-80" />
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
                    className="relative z-10 text-foreground"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className="text-xl font-semibold text-foreground">MintPlatform</span>
              </Link>
              <p className="text-muted-foreground max-w-sm mb-6">
                Discover, collect, and mint unique digital art across multiple blockchains. Complete quests to earn exclusive free mints.
              </p>
              
              {/* Social Links */}
              {showSocials && (
                <div className="flex items-center gap-3">
                  <SocialLink
                    href="https://twitter.com"
                    label="Twitter"
                    icon={<TwitterIcon />}
                  />
                  <SocialLink
                    href="https://discord.com"
                    label="Discord"
                    icon={<DiscordIcon />}
                  />
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Explore</h4>
              <ul className="space-y-3">
                <li><FooterLink href="/">Home</FooterLink></li>
                <li><FooterLink href="#explore">MintFun</FooterLink></li>
                <li><FooterLink href="#quests">Quests</FooterLink></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><FooterLink href="/terms">Terms of Service</FooterLink></li>
                <li><FooterLink href="/privacy">Privacy Policy</FooterLink></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground text-center">
              © {currentYear}{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-medium">
                MintPlatform
              </span>
              . All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }
);

Footer.displayName = 'Footer';

// Footer link component
interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
}

function FooterLink({ href, children }: FooterLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'text-sm text-muted-foreground',
        'transition-all duration-300',
        'hover:text-foreground'
      )}
    >
      {children}
    </Link>
  );
}

// Social link component
interface SocialLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function SocialLink({ href, label, icon }: SocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-xl',
        'bg-foreground/5 border border-foreground/10',
        'text-muted-foreground',
        'transition-all duration-300',
        'hover:bg-foreground/10 hover:border-foreground/20',
        'hover:text-foreground hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]'
      )}
    >
      {icon}
    </a>
  );
}

// Twitter/X icon
function TwitterIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Discord icon
function DiscordIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
