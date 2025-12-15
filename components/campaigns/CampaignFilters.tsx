'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Chain info helper
const CHAIN_INFO: Record<number, { name: string; slug: string }> = {
  1: { name: 'Ethereum', slug: 'ethereum' },
  10: { name: 'Optimism', slug: 'optimism' },
  56: { name: 'BNB Chain', slug: 'bsc' },
  137: { name: 'Polygon', slug: 'polygon' },
  250: { name: 'Fantom', slug: 'fantom' },
  324: { name: 'zkSync', slug: 'zksync-era' },
  8453: { name: 'Base', slug: 'base' },
  42161: { name: 'Arbitrum', slug: 'arbitrum' },
  43114: { name: 'Avalanche', slug: 'avalanche' },
  59144: { name: 'Linea', slug: 'linea' },
  534352: { name: 'Scroll', slug: 'scroll' },
  81457: { name: 'Blast', slug: 'blast' },
  5000: { name: 'Mantle', slug: 'mantle' },
  34443: { name: 'Mode', slug: 'mode' },
  7777777: { name: 'Zora', slug: 'zora' },
  11155111: { name: 'Sepolia', slug: 'ethereum' },
};

function getChainIconUrl(slug: string): string {
  return `https://icons.llamao.fi/icons/chains/rsz_${slug}.jpg`;
}

export interface CampaignFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedChain: number | null;
  onChainChange: (chainId: number | null) => void;
  availableChains: number[];
  className?: string;
}

export function CampaignFilters({
  searchQuery,
  onSearchChange,
  selectedChain,
  onChainChange,
  availableChains,
  className,
}: CampaignFiltersProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedChainInfo = selectedChain ? CHAIN_INFO[selectedChain] : null;

  return (
    <div className={cn('flex flex-col sm:flex-row gap-4', className)}>
      {/* Search Input */}
      <div className="relative flex-1">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by title or description..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            'w-full h-12 pl-10 pr-4 rounded-xl',
            'bg-foreground/5 backdrop-blur-sm border border-border',
            'text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            'transition-all duration-300'
          )}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Chain Dropdown */}
      <div className="relative z-20" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={cn(
            'flex items-center gap-3 h-12 px-4 rounded-xl min-w-[200px]',
            'bg-foreground/5 backdrop-blur-sm border border-border',
            'text-foreground hover:border-primary/50',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            'transition-all duration-300'
          )}
        >
          {selectedChainInfo ? (
            <>
              <ChainIcon chainId={selectedChain!} size={20} />
              <span className="flex-1 text-left">{selectedChainInfo.name}</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="flex-1 text-left text-muted-foreground">All Chains</span>
            </>
          )}
          <svg 
            className={cn('w-5 h-5 text-muted-foreground transition-transform', isDropdownOpen && 'rotate-180')} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className={cn(
            'absolute top-full left-0 right-0 mt-2 py-2 rounded-xl z-[100]',
            'bg-background/95 backdrop-blur-xl border border-border shadow-xl',
            'animate-fade-in max-h-[300px] overflow-y-auto'
          )}>
            {/* All Chains Option */}
            <button
              onClick={() => {
                onChainChange(null);
                setIsDropdownOpen(false);
              }}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-2.5 text-left',
                'hover:bg-foreground/5 transition-colors',
                !selectedChain && 'bg-primary/10 text-primary'
              )}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>All Chains</span>
              {!selectedChain && (
                <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* Divider */}
            <div className="my-2 border-t border-border" />

            {/* Chain Options */}
            {availableChains.map((chainId) => {
              const info = CHAIN_INFO[chainId];
              if (!info) return null;
              const isSelected = selectedChain === chainId;
              
              return (
                <button
                  key={chainId}
                  onClick={() => {
                    onChainChange(chainId);
                    setIsDropdownOpen(false);
                  }}
                  className={cn(
                    'flex items-center gap-3 w-full px-4 py-2.5 text-left',
                    'hover:bg-foreground/5 transition-colors',
                    isSelected && 'bg-primary/10 text-primary'
                  )}
                >
                  <ChainIcon chainId={chainId} size={20} />
                  <span>{info.name}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Chain Icon Component with fallback
function ChainIcon({ chainId, size = 20 }: { chainId: number; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const info = CHAIN_INFO[chainId];
  
  if (!info) return null;

  return (
    <div 
      className="relative rounded-full overflow-hidden flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {!imgError ? (
        <Image
          src={getChainIconUrl(info.slug)}
          alt={info.name}
          fill
          className="object-cover"
          sizes={`${size}px`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary text-xs font-bold">
          {info.name.charAt(0)}
        </div>
      )}
    </div>
  );
}
