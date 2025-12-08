/**
 * Wagmi Configuration
 * Dynamic chain loading from Supabase with fallback to default chains
 * Requirements: 10.1, 10.4
 */

import { createConfig, http } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, base, sepolia } from 'wagmi/chains';
import type { Chain } from 'wagmi/chains';
import type { SupportedChainRow } from '@/types/database';
import { toWagmiChain } from './chains';

// Default chains as fallback when Supabase data is unavailable
export const DEFAULT_CHAINS = [mainnet, polygon, arbitrum, optimism, base, sepolia] as const;

// Type for the chains tuple
type DefaultChains = typeof DEFAULT_CHAINS;

/**
 * Create default wagmi config with static chains
 * Used for initial render before dynamic chains are loaded
 */
export function createDefaultConfig() {
  return createConfig({
    chains: DEFAULT_CHAINS,
    transports: {
      [mainnet.id]: http(),
      [polygon.id]: http(),
      [arbitrum.id]: http(),
      [optimism.id]: http(),
      [base.id]: http(),
      [sepolia.id]: http(),
    },
  });
}

/**
 * Create wagmi config with dynamic chains from Supabase
 */
export function createDynamicConfig(supportedChains: SupportedChainRow[]) {
  // Filter to enabled chains only
  const enabledChains = supportedChains.filter(chain => chain.is_enabled);
  
  if (enabledChains.length === 0) {
    // Fallback to default config if no chains are enabled
    return createDefaultConfig();
  }

  // Convert to wagmi chains
  const wagmiChains = enabledChains.map(toWagmiChain);
  
  // Create transports for each chain
  const transports = wagmiChains.reduce((acc, chain) => {
    acc[chain.id] = http();
    return acc;
  }, {} as Record<number, ReturnType<typeof http>>);

  // wagmi requires at least one chain, use type assertion for dynamic chains
  return createConfig({
    chains: wagmiChains as unknown as readonly [Chain, ...Chain[]],
    transports,
  });
}


/**
 * Merge default chains with dynamic chains from Supabase
 * Ensures common chains are always available while adding custom ones
 */
export function mergeWithDefaultChains(supportedChains: SupportedChainRow[]): Chain[] {
  const enabledChains = supportedChains.filter(chain => chain.is_enabled);
  const dynamicChains = enabledChains.map(toWagmiChain);
  
  // Create a map of chain IDs to avoid duplicates
  const chainMap = new Map<number, Chain>();
  
  // Add default chains first
  for (const chain of DEFAULT_CHAINS) {
    chainMap.set(chain.id, chain);
  }
  
  // Override with dynamic chains (they may have custom RPC URLs)
  for (const chain of dynamicChains) {
    chainMap.set(chain.id, chain);
  }
  
  return Array.from(chainMap.values());
}

/**
 * Get chain configuration for a specific chain ID
 */
export function getChainConfig(
  supportedChains: SupportedChainRow[],
  chainId: number
): Chain | undefined {
  // First check dynamic chains
  const dynamicChain = supportedChains.find(
    chain => chain.chain_id === chainId && chain.is_enabled
  );
  
  if (dynamicChain) {
    return toWagmiChain(dynamicChain);
  }
  
  // Fallback to default chains
  return DEFAULT_CHAINS.find(chain => chain.id === chainId);
}

/**
 * Check if a chain is available (either in defaults or enabled in Supabase)
 */
export function isChainAvailable(
  supportedChains: SupportedChainRow[],
  chainId: number
): boolean {
  // Check if it's a default chain
  if (DEFAULT_CHAINS.some(chain => chain.id === chainId)) {
    return true;
  }
  
  // Check if it's enabled in Supabase
  return supportedChains.some(
    chain => chain.chain_id === chainId && chain.is_enabled
  );
}

// Export the default config for immediate use
export const defaultWagmiConfig = createDefaultConfig();
