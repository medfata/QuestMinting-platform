'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSwitchChain, useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { searchChains, getPopularChains, transformToSupportedChain, isTestnet } from '@/lib/services/chainlist';
import { useDeployContract } from '@/hooks/useDeployContract';
import type { ChainlistNetwork } from '@/types/chain';
import type { SupportedChainRow, SupportedChainInsert } from '@/types/database';
import Image from 'next/image';

// Get chain icon URL from LlamaFi
function getChainIconUrl(chainSlug: string): string {
  return `https://icons.llamao.fi/icons/chains/rsz_${chainSlug}.jpg`;
}

// Chain icon component with fallback
function ChainIcon({ chainSlug, shortName, className = '' }: { chainSlug: string; shortName: string; className?: string }) {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return (
      <div className={`flex items-center justify-center rounded-full bg-gray-500/20 text-gray-400 font-bold text-sm ${className}`}>
        {shortName.slice(0, 3).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={getChainIconUrl(chainSlug)}
      alt={shortName}
      width={40}
      height={40}
      className={`rounded-full ${className}`}
      onError={() => setHasError(true)}
    />
  );
}

interface ChainWithStatus extends ChainlistNetwork {
  dbRecord?: SupportedChainRow;
  isEnabled: boolean;
}

export default function ChainManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [includeTestnets, setIncludeTestnets] = useState(false);
  const [chains, setChains] = useState<ChainWithStatus[]>([]);
  const [enabledChains, setEnabledChains] = useState<SupportedChainRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [savingChainId, setSavingChainId] = useState<number | null>(null);
  const [editingChain, setEditingChain] = useState<SupportedChainRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch enabled chains from Supabase
  const fetchEnabledChains = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('mint_platform_supported_chains')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching enabled chains:', error);
      return [];
    }
    return data || [];
  }, []);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [popularChains, dbChains] = await Promise.all([
          getPopularChains(),
          fetchEnabledChains(),
        ]);

        setEnabledChains(dbChains);

        // Merge chainlist data with database status
        const chainsWithStatus = popularChains.map((chain) => ({
          ...chain,
          dbRecord: dbChains.find((db) => db.chain_id === chain.chainId),
          isEnabled: dbChains.some((db) => db.chain_id === chain.chainId && db.is_enabled),
        }));

        setChains(chainsWithStatus);
      } catch (err) {
        setError('Failed to load chains. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [fetchEnabledChains]);


  // Search chains
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      // Reset to popular chains
      const popularChains = await getPopularChains();
      const chainsWithStatus = popularChains.map((chain) => ({
        ...chain,
        dbRecord: enabledChains.find((db) => db.chain_id === chain.chainId),
        isEnabled: enabledChains.some((db) => db.chain_id === chain.chainId && db.is_enabled),
      }));
      setChains(chainsWithStatus);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchChains(searchQuery, includeTestnets);
      const chainsWithStatus = results.slice(0, 20).map((chain) => ({
        ...chain,
        dbRecord: enabledChains.find((db) => db.chain_id === chain.chainId),
        isEnabled: enabledChains.some((db) => db.chain_id === chain.chainId && db.is_enabled),
      }));
      setChains(chainsWithStatus);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, includeTestnets, enabledChains]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, includeTestnets, handleSearch]);

  // Enable a chain
  const enableChain = async (chain: ChainlistNetwork) => {
    setSavingChainId(chain.chainId);
    setError(null);

    const supabase = createClient();
    const transformed = transformToSupportedChain(chain);

    const insertData: SupportedChainInsert = {
      chain_id: transformed.chain_id,
      name: transformed.name,
      short_name: transformed.short_name,
      rpc_urls: transformed.rpc_urls,
      explorer_url: transformed.explorer_url,
      native_currency: transformed.native_currency,
      chain_slug: transformed.chain_slug,
      is_testnet: transformed.is_testnet,
      is_enabled: true,
    };

    const { data, error } = await supabase
      .from('mint_platform_supported_chains')
      .upsert(insertData, { onConflict: 'chain_id' })
      .select()
      .single();

    if (error) {
      setError(`Failed to enable ${chain.name}: ${error.message}`);
      console.error(error);
    } else if (data) {
      setEnabledChains((prev) => {
        const existing = prev.findIndex((c) => c.chain_id === chain.chainId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data;
          return updated;
        }
        return [...prev, data];
      });
      setChains((prev) =>
        prev.map((c) =>
          c.chainId === chain.chainId ? { ...c, dbRecord: data, isEnabled: true } : c
        )
      );
    }

    setSavingChainId(null);
  };


  // Disable a chain
  const disableChain = async (chain: ChainWithStatus) => {
    if (!chain.dbRecord) return;

    setSavingChainId(chain.chainId);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from('mint_platform_supported_chains')
      .update({ is_enabled: false })
      .eq('chain_id', chain.chainId);

    if (error) {
      setError(`Failed to disable ${chain.name}: ${error.message}`);
      console.error(error);
    } else {
      setEnabledChains((prev) =>
        prev.map((c) => (c.chain_id === chain.chainId ? { ...c, is_enabled: false } : c))
      );
      setChains((prev) =>
        prev.map((c) =>
          c.chainId === chain.chainId
            ? { ...c, dbRecord: { ...c.dbRecord!, is_enabled: false }, isEnabled: false }
            : c
        )
      );
    }

    setSavingChainId(null);
  };

  // Update chain configuration
  const updateChainConfig = async (chainId: number, updates: Partial<SupportedChainRow>) => {
    setSavingChainId(chainId);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('mint_platform_supported_chains')
      .update(updates)
      .eq('chain_id', chainId)
      .select()
      .single();

    if (error) {
      setError(`Failed to update chain: ${error.message}`);
      console.error(error);
    } else if (data) {
      setEnabledChains((prev) =>
        prev.map((c) => (c.chain_id === chainId ? data : c))
      );
      setChains((prev) =>
        prev.map((c) =>
          c.chainId === chainId ? { ...c, dbRecord: data } : c
        )
      );
      setEditingChain(null);
    }

    setSavingChainId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chain Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search and enable blockchain networks for your campaigns
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-600 dark:text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-400"
          >
            ×
          </button>
        </div>
      )}


      {/* Search Section */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Search Chains"
                placeholder="Search by name, symbol, or chain ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={includeTestnets}
                onChange={(e) => setIncludeTestnets(e.target.checked)}
                className="rounded border-border bg-foreground/5 text-primary focus:ring-primary"
              />
              Include Testnets
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Enabled Chains Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            Enabled Chains ({enabledChains.filter((c) => c.is_enabled).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enabledChains.filter((c) => c.is_enabled).length === 0 ? (
            <p className="text-muted-foreground">No chains enabled yet. Search and enable chains below.</p>
          ) : (
            <div className="space-y-3">
              {enabledChains
                .filter((c) => c.is_enabled)
                .map((chain) => (
                  <div
                    key={chain.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-foreground/5 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <ChainIcon 
                        chainSlug={chain.chain_slug} 
                        shortName={chain.short_name} 
                        className="h-10 w-10"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{chain.name}</span>
                          {chain.is_testnet && (
                            <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-xs text-yellow-600 dark:text-yellow-400">
                              Testnet
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Chain ID: {chain.chain_id} • {chain.native_currency.symbol}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingChain(chain)}
                      >
                        Configure
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const chainWithStatus = chains.find((c) => c.chainId === chain.chain_id);
                          if (chainWithStatus) {
                            disableChain(chainWithStatus);
                          } else {
                            // Create a minimal ChainWithStatus for disabling
                            disableChain({
                              ...({} as ChainlistNetwork),
                              chainId: chain.chain_id,
                              name: chain.name,
                              dbRecord: chain,
                              isEnabled: true,
                            });
                          }
                        }}
                        isLoading={savingChainId === chain.chain_id}
                      >
                        Disable
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Available Chains Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            {searchQuery ? 'Search Results' : 'Popular Chains'}
            {isSearching && (
              <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent inline-block" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chains.length === 0 ? (
            <p className="text-muted-foreground">
              {searchQuery ? 'No chains found matching your search.' : 'No chains available.'}
            </p>
          ) : (
            <div className="space-y-3">
              {chains.map((chain) => (
                <div
                  key={chain.chainId}
                  className="flex items-center justify-between rounded-lg border border-border bg-foreground/5 p-4"
                >
                  <div className="flex items-center gap-4">
                    <ChainIcon 
                      chainSlug={chain.chainSlug ?? chain.shortName.toLowerCase()} 
                      shortName={chain.shortName} 
                      className="h-10 w-10"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{chain.name}</span>
                        {isTestnet(chain) && (
                          <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-xs text-yellow-600 dark:text-yellow-400">
                            Testnet
                          </span>
                        )}
                        {chain.isEnabled && (
                          <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-xs text-green-600 dark:text-green-400">
                            Enabled
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Chain ID: {chain.chainId} • {chain.nativeCurrency.symbol}
                        {chain.tvl && ` • TVL: $${(chain.tvl / 1e9).toFixed(2)}B`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {chain.explorers?.[0]?.url && (
                      <a
                        href={chain.explorers[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Explorer ↗
                      </a>
                    )}
                    {chain.isEnabled ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disableChain(chain)}
                        isLoading={savingChainId === chain.chainId}
                      >
                        Disable
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => enableChain(chain)}
                        isLoading={savingChainId === chain.chainId}
                      >
                        Enable
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Chain Configuration Modal */}
      {editingChain && (
        <ChainConfigModal
          chain={editingChain}
          onClose={() => setEditingChain(null)}
          onSave={(updates) => updateChainConfig(editingChain.chain_id, updates)}
          isSaving={savingChainId === editingChain.chain_id}
        />
      )}
    </div>
  );
}

// Chain Configuration Modal Component
interface ChainConfigModalProps {
  chain: SupportedChainRow;
  onClose: () => void;
  onSave: (updates: Partial<SupportedChainRow>) => void;
  isSaving: boolean;
}

function ChainConfigModal({ chain, onClose, onSave, isSaving }: ChainConfigModalProps) {
  const [rpcUrls, setRpcUrls] = useState(chain.rpc_urls.join('\n'));
  const [mintContractAddress, setMintContractAddress] = useState(chain.mint_contract_address || '');
  const [contractName, setContractName] = useState('QuestMint');
  const [contractSymbol, setContractSymbol] = useState('QMINT');
  const [isSwitching, setIsSwitching] = useState(false);

  const { address, chainId: connectedChainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const {
    deploy,
    error: deployError,
    txHash,
    contractAddress: deployedAddress,
    reset: resetDeploy,
    isPending,
    isDeploying,
    isSuccess: isDeploySuccess,
  } = useDeployContract();

  const isWrongChain = connectedChainId !== chain.chain_id;

  // Add chain to wallet and switch
  const handleSwitchChain = async () => {
    if (!window.ethereum) {
      alert('Please install a Web3 wallet');
      return;
    }

    setIsSwitching(true);
    try {
      // First try to switch
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chain.chain_id.toString(16)}` }],
        });
      } catch (switchError: unknown) {
        // If chain doesn't exist, add it
        if ((switchError as { code?: number })?.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${chain.chain_id.toString(16)}`,
              chainName: chain.name,
              nativeCurrency: {
                name: chain.native_currency.name,
                symbol: chain.native_currency.symbol,
                decimals: chain.native_currency.decimals,
              },
              rpcUrls: chain.rpc_urls,
              blockExplorerUrls: chain.explorer_url ? [chain.explorer_url] : undefined,
            }],
          });
        } else {
          throw switchError;
        }
      }
    } catch (error) {
      console.error('Failed to switch chain:', error);
      alert('Failed to switch chain. Please try manually in your wallet.');
    } finally {
      setIsSwitching(false);
    }
  };

  const handleDeploy = async () => {
    if (isWrongChain) {
      await handleSwitchChain();
      return;
    }

    const deployedAddr = await deploy({
      name: contractName,
      symbol: contractSymbol,
      contractURI: '',
      chainId: chain.chain_id,
    });

    if (deployedAddr) {
      setMintContractAddress(deployedAddr);
    }
  };

  const handleSave = () => {
    const urls = rpcUrls
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    onSave({
      rpc_urls: urls,
      mint_contract_address: mintContractAddress || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Configure {chain.name}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Chain ID
            </label>
            <div className="rounded-lg border border-border bg-foreground/5 px-4 py-2.5 text-muted-foreground">
              {chain.chain_id}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              RPC URLs (one per line)
            </label>
            <textarea
              value={rpcUrls}
              onChange={(e) => setRpcUrls(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border bg-foreground/5 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://rpc.example.com"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Multiple RPCs provide fallback options if one fails
            </p>
          </div>

          {/* Deploy Contract Section */}
          <div className="rounded-lg border border-border bg-foreground/5 p-4 space-y-3">
            <h3 className="font-medium text-foreground">Deploy QuestMint Contract</h3>
            <p className="text-xs text-muted-foreground">
              Deploy a new ERC1155 contract for minting on this chain
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Contract Name"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                placeholder="QuestMint"
              />
              <Input
                label="Symbol"
                value={contractSymbol}
                onChange={(e) => setContractSymbol(e.target.value)}
                placeholder="QMINT"
              />
            </div>

            {deployError && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
                {deployError.message}
                <button
                  onClick={resetDeploy}
                  className="ml-2 underline hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {isDeploySuccess && deployedAddress && (
              <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                Contract deployed at: {deployedAddress.slice(0, 10)}...{deployedAddress.slice(-8)}
                {txHash && (
                  <a
                    href={`${chain.explorer_url}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 underline hover:no-underline"
                  >
                    View tx ↗
                  </a>
                )}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleDeploy}
              isLoading={isPending || isDeploying || isSwitching}
              disabled={!address || isPending || isDeploying || isSwitching}
              className="w-full"
            >
              {!address
                ? 'Connect Wallet to Deploy'
                : isSwitching
                  ? 'Switching Network...'
                  : isWrongChain
                    ? `Switch to ${chain.name}`
                    : isPending
                      ? 'Confirm in Wallet...'
                      : isDeploying
                        ? 'Deploying...'
                        : 'Deploy Contract'}
            </Button>
          </div>

          <Input
            label="Mint Contract Address"
            value={mintContractAddress}
            onChange={(e) => setMintContractAddress(e.target.value)}
            placeholder="0x..."
            helperText="The default mint contract address for this chain (auto-filled after deploy)"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
