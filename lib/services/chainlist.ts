/**
 * Chainlist Service
 * Integrates with chainlist.org API for chain discovery and management
 * Requirements: 10.1, 10.2
 */

import type { ChainlistNetwork, SupportedChain, ChainlistNativeCurrency } from '@/types/chain';

const CHAINLIST_API = 'https://chainlist.org/rpcs.json';

// Cache for chainlist data to avoid repeated API calls
let chainsCache: ChainlistNetwork[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all chains from chainlist.org API
 * Returns active chains by default
 */
export async function fetchAllChains(includeInactive = false): Promise<ChainlistNetwork[]> {
  // Return cached data if still valid
  if (chainsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return includeInactive 
      ? chainsCache 
      : chainsCache.filter(chain => chain.status !== 'deprecated');
  }

  try {
    const response = await fetch(CHAINLIST_API, {
      next: { revalidate: 300 }, // Cache for 5 minutes in Next.js
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chains: ${response.statusText}`);
    }

    const chains: ChainlistNetwork[] = await response.json();
    
    // Update cache
    chainsCache = chains;
    cacheTimestamp = Date.now();

    // Filter to active chains by default
    return includeInactive 
      ? chains 
      : chains.filter(chain => chain.status !== 'deprecated');
  } catch (error) {
    console.error('Error fetching chainlist data:', error);
    // Return cached data if available, even if stale
    if (chainsCache) {
      return includeInactive 
        ? chainsCache 
        : chainsCache.filter(chain => chain.status !== 'deprecated');
    }
    throw error;
  }
}


/**
 * Search chains by name, short name, or chain ID
 */
export async function searchChains(query: string, includeTestnets = false): Promise<ChainlistNetwork[]> {
  const chains = await fetchAllChains();
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) {
    return includeTestnets ? chains : chains.filter(chain => !isTestnet(chain));
  }

  const filtered = chains.filter(chain => {
    // Filter testnets if not included
    if (!includeTestnets && isTestnet(chain)) {
      return false;
    }

    // Match by name, short name, or chain ID
    return (
      chain.name.toLowerCase().includes(lowerQuery) ||
      chain.shortName.toLowerCase().includes(lowerQuery) ||
      chain.chainId.toString() === lowerQuery ||
      chain.chain.toLowerCase().includes(lowerQuery)
    );
  });

  // Sort by relevance: exact matches first, then by TVL if available
  return filtered.sort((a, b) => {
    const aExact = a.name.toLowerCase() === lowerQuery || a.shortName.toLowerCase() === lowerQuery;
    const bExact = b.name.toLowerCase() === lowerQuery || b.shortName.toLowerCase() === lowerQuery;
    
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    // Sort by TVL (higher first) if available
    return (b.tvl ?? 0) - (a.tvl ?? 0);
  });
}

/**
 * Get a specific chain by chain ID
 */
export async function getChainById(chainId: number): Promise<ChainlistNetwork | null> {
  const chains = await fetchAllChains(true);
  return chains.find(chain => chain.chainId === chainId) ?? null;
}

/**
 * Check if a chain is a testnet based on common naming patterns
 */
export function isTestnet(chain: ChainlistNetwork): boolean {
  const name = chain.name.toLowerCase();
  const testnetKeywords = [
    'testnet', 'sepolia', 'goerli', 'mumbai', 'fuji', 
    'rinkeby', 'ropsten', 'kovan', 'holesky', 'amoy'
  ];
  return testnetKeywords.some(keyword => name.includes(keyword));
}

/**
 * Extract HTTP RPC URLs from chain data, filtering out tracking RPCs
 */
function extractHttpRpcs(chain: ChainlistNetwork): string[] {
  return chain.rpc
    .map(rpc => {
      if (typeof rpc === 'string') return rpc;
      // Filter out RPCs with full tracking
      if (rpc.tracking === 'yes') return null;
      return rpc.url;
    })
    .filter((url): url is string => url !== null && url.startsWith('http'));
}

/**
 * Transform chainlist network to platform's SupportedChain format
 */
export function transformToSupportedChain(
  chain: ChainlistNetwork
): Omit<SupportedChain, 'id' | 'mint_contract_address' | 'is_enabled'> {
  const httpRpcs = extractHttpRpcs(chain);

  return {
    chain_id: chain.chainId,
    name: chain.name,
    short_name: chain.shortName,
    rpc_urls: httpRpcs.length > 0 ? httpRpcs : [''],
    explorer_url: chain.explorers?.[0]?.url ?? '',
    native_currency: chain.nativeCurrency,
    chain_slug: chain.chainSlug ?? chain.shortName.toLowerCase(),
    is_testnet: isTestnet(chain),
  };
}

/**
 * Get popular/common chains for quick selection
 */
export async function getPopularChains(): Promise<ChainlistNetwork[]> {
  const popularChainIds = [
    1,      // Ethereum Mainnet
    137,    // Polygon
    42161,  // Arbitrum One
    10,     // Optimism
    8453,   // Base
    56,     // BNB Smart Chain
    43114,  // Avalanche C-Chain
    250,    // Fantom Opera
    324,    // zkSync Era
    59144,  // Linea
  ];

  const chains = await fetchAllChains();
  
  return popularChainIds
    .map(id => chains.find(chain => chain.chainId === id))
    .filter((chain): chain is ChainlistNetwork => chain !== undefined);
}

/**
 * Validate if a chain has minimum required data for platform use
 */
export function isValidChainForPlatform(chain: ChainlistNetwork): boolean {
  const httpRpcs = extractHttpRpcs(chain);
  
  return (
    chain.chainId > 0 &&
    chain.name.length > 0 &&
    chain.shortName.length > 0 &&
    httpRpcs.length > 0 &&
    chain.nativeCurrency?.symbol?.length > 0
  );
}

/**
 * Clear the chains cache (useful for testing or forcing refresh)
 */
export function clearChainsCache(): void {
  chainsCache = null;
  cacheTimestamp = 0;
}
