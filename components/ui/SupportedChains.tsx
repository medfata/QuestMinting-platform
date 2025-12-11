'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

// Chain icon URL helper using LlamaFi icons
function getChainIconUrl(chainSlug: string): string {
  const slugMap: Record<string, string> = {
    'eth': 'ethereum',
    'mainnet': 'ethereum',
    'matic': 'polygon',
    'polygon': 'polygon',
    'arb1': 'arbitrum',
    'arbitrum': 'arbitrum',
    'oeth': 'optimism',
    'optimism': 'optimism',
    'base': 'base',
    'sep': 'ethereum',
    'sepolia': 'ethereum',
    'avax': 'avalanche',
    'avalanche': 'avalanche',
    'bsc': 'bsc',
    'bnb': 'bsc',
    'ftm': 'fantom',
    'fantom': 'fantom',
    'celo': 'celo',
    'gnosis': 'gnosis',
    'zksync': 'zksync-era',
    'linea': 'linea',
    'scroll': 'scroll',
    'blast': 'blast',
    'mantle': 'mantle',
    'mode': 'mode',
    'zora': 'zora',
  };

  const iconName = slugMap[chainSlug.toLowerCase()] || chainSlug.toLowerCase();
  return `https://icons.llamao.fi/icons/chains/rsz_${iconName}.jpg`;
}

// Fallback chains when no data from Supabase
const FALLBACK_CHAINS = [
  { name: 'Ethereum', chain_slug: 'ethereum' },
  { name: 'Polygon', chain_slug: 'polygon' },
  { name: 'Arbitrum', chain_slug: 'arbitrum' },
  { name: 'Optimism', chain_slug: 'optimism' },
  { name: 'Base', chain_slug: 'base' },
  { name: 'Avalanche', chain_slug: 'avalanche' },
];

export interface SupportedChainsProps {
  className?: string;
  title?: string;
  showTitle?: boolean;
  compact?: boolean;
}

export function SupportedChains({
  className,
  title = 'Supported Chains',
  showTitle = true,
  compact = false,
}: SupportedChainsProps) {
  const [chains, setChains] = useState<{ name: string; chain_slug: string }[]>(FALLBACK_CHAINS);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    async function fetchChains() {
      const supabase = createClient();

      try {
        const { data } = await supabase
          .from('mint_platform_supported_chains')
          .select('name, chain_slug')
          .eq('is_enabled', true)
          .order('name');

        if (data && data.length > 0) {
          setChains(data);
        }
      } catch (error) {
        console.error('Error fetching supported chains:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchChains();
  }, []);

  // Always animate the marquee when we have chains to display
  // This creates a continuous scrolling effect regardless of screen width
  useEffect(() => {
    if (!isLoading && chains.length > 0) {
      // Small delay to ensure DOM is fully rendered before starting animation
      const timeoutId = setTimeout(() => {
        setShouldAnimate(true);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [chains, isLoading]);

  // Duplicate chains for seamless infinite scroll
  const displayChains = shouldAnimate ? [...chains, ...chains] : chains;

  return (
    <div className={cn(compact ? 'py-3' : 'py-8', 'overflow-hidden', className)}>
      <div className={cn(!compact && 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8')}>
        {showTitle && (
          <div className={cn('mb-3', compact && 'mb-2')}>
            <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
              {title}
            </p>
          </div>
        )}

        {/* Chains marquee container */}
        <div className="relative">
          {/* Gradient fade edges - only show when animating */}
          {shouldAnimate && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent" />
              <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent" />
            </>
          )}

          {/* Scrolling container - always single row */}
          <div
            className={cn(
              'flex items-center gap-2.5',
              shouldAnimate && 'animate-marquee'
            )}
            style={{ width: shouldAnimate ? 'max-content' : undefined }}
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-9 w-28 rounded-full bg-muted/30 animate-pulse"
                  />
                ))
              : displayChains.map((chain, index) => (
                  <ChainBadge
                    key={`${chain.chain_slug}-${index}`}
                    name={chain.name}
                    slug={chain.chain_slug}
                  />
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChainBadge({ name, slug }: { name: string; slug: string }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-border/40 bg-muted/20 backdrop-blur-sm flex-shrink-0 transition-all duration-200 hover:bg-muted/40 hover:border-border/60">
      <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
        {!imgError ? (
          <Image
            src={getChainIconUrl(slug)}
            alt={`${name}`}
            fill
            className="object-cover"
            sizes="20px"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/20 text-foreground text-[10px] font-bold">
            {name.charAt(0)}
          </div>
        )}
      </div>
      <span className="text-sm text-muted-foreground/80 font-medium whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}

SupportedChains.displayName = 'SupportedChains';
