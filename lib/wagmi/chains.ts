/**
 * Wagmi Chain Utilities
 * Utilities for converting platform chains to wagmi-compatible format
 * Requirements: 10.1, 10.4
 */

import type { Chain } from 'wagmi/chains';
import type { SupportedChain } from '@/types/chain';
import type { SupportedChainRow } from '@/types/database';

/**
 * Convert a platform SupportedChain to wagmi Chain format
 */
export function toWagmiChain(chain: SupportedChain | SupportedChainRow): Chain {
  return {
    id: chain.chain_id,
    name: chain.name,
    nativeCurrency: {
      name: chain.native_currency.name,
      symbol: chain.native_currency.symbol,
      decimals: chain.native_currency.decimals,
    },
    rpcUrls: {
      default: {
        http: chain.rpc_urls.filter(url => url.length > 0),
      },
      public: {
        http: chain.rpc_urls.filter(url => url.length > 0),
      },
    },
    blockExplorers: chain.explorer_url
      ? {
          default: {
            name: 'Explorer',
            url: chain.explorer_url,
          },
        }
      : undefined,
    testnet: chain.is_testnet,
  };
}

/**
 * Convert multiple platform chains to wagmi Chain array
 */
export function toWagmiChains(chains: (SupportedChain | SupportedChainRow)[]): Chain[] {
  return chains.map(toWagmiChain);
}

/**
 * Create HTTP transports configuration for wagmi
 */
export function createTransports(chains: Chain[]): Record<number, ReturnType<typeof import('wagmi').http>> {
  // Dynamic import to avoid issues with SSR
  const { http } = require('wagmi');
  
  return chains.reduce((acc, chain) => {
    acc[chain.id] = http();
    return acc;
  }, {} as Record<number, ReturnType<typeof import('wagmi').http>>);
}

/**
 * Get chain by ID from an array of chains
 */
export function getChainById(chains: Chain[], chainId: number): Chain | undefined {
  return chains.find(chain => chain.id === chainId);
}

/**
 * Check if a chain ID is supported in the given chains array
 */
export function isChainSupported(chains: Chain[], chainId: number): boolean {
  return chains.some(chain => chain.id === chainId);
}
