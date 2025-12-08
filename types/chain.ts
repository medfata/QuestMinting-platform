/**
 * Chain Configuration Types
 * Types for chainlist.org API and platform chain management
 */

// Chainlist.org API response types (from https://chainlist.org/rpcs.json)
export interface ChainlistRpc {
  url: string;
  tracking?: 'none' | 'limited' | 'yes';
}

export interface ChainlistExplorer {
  name: string;
  url: string;
  standard: string;
}

export interface ChainlistNativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

export interface ChainlistNetwork {
  name: string;
  chain: string;
  rpc: (string | ChainlistRpc)[];
  faucets: string[];
  nativeCurrency: ChainlistNativeCurrency;
  infoURL: string;
  shortName: string;
  chainId: number;
  networkId: number;
  explorers?: ChainlistExplorer[];
  status?: 'active' | 'deprecated' | 'incubating';
  tvl?: number;
  chainSlug?: string;
}

// Platform's stored chain configuration
export interface SupportedChain {
  id: string;
  chain_id: number;
  name: string;
  short_name: string;
  rpc_urls: string[]; // Multiple RPCs for fallback
  explorer_url: string;
  native_currency: ChainlistNativeCurrency;
  chain_slug: string;
  is_testnet: boolean;
  mint_contract_address: string | null;
  is_enabled: boolean;
}

// Form input for chain configuration
export interface SupportedChainInput {
  chain_id: number;
  name: string;
  short_name: string;
  rpc_urls: string[];
  explorer_url: string;
  native_currency: ChainlistNativeCurrency;
  chain_slug: string;
  is_testnet: boolean;
  mint_contract_address: string | null;
  is_enabled: boolean;
}

// Transform chainlist network to platform chain format
export function transformChainlistToSupported(
  chain: ChainlistNetwork
): Omit<SupportedChain, 'id' | 'mint_contract_address' | 'is_enabled'> {
  // Filter to HTTP RPCs with no/limited tracking
  const httpRpcs = chain.rpc
    .map((rpc) => (typeof rpc === 'string' ? rpc : rpc.url))
    .filter((url) => url.startsWith('http'));

  return {
    chain_id: chain.chainId,
    name: chain.name,
    short_name: chain.shortName,
    rpc_urls: httpRpcs,
    explorer_url: chain.explorers?.[0]?.url ?? '',
    native_currency: chain.nativeCurrency,
    chain_slug: chain.chainSlug ?? chain.shortName.toLowerCase(),
    is_testnet: chain.name.toLowerCase().includes('testnet') || 
                chain.name.toLowerCase().includes('sepolia') ||
                chain.name.toLowerCase().includes('goerli'),
  };
}

// Check if a chain is a testnet based on common naming patterns
export function isTestnetChain(chain: ChainlistNetwork): boolean {
  const name = chain.name.toLowerCase();
  const testnetKeywords = ['testnet', 'sepolia', 'goerli', 'mumbai', 'fuji', 'rinkeby', 'ropsten', 'kovan'];
  return testnetKeywords.some((keyword) => name.includes(keyword));
}
