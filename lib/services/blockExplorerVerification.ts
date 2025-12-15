/**
 * On-Chain Verification Service
 * Verifies user transactions on third-party contracts via RPC (no API keys needed)
 */

import { createPublicClient, http, keccak256, toBytes, parseAbiItem, type Chain } from 'viem';
import * as viemChains from 'viem/chains';

// Custom chain definitions for chains not in viem
const customChains: Record<number, Chain> = {
  57073: {
    id: 57073,
    name: 'Ink',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://rpc-gel.inkonchain.com'] },
    },
    blockExplorers: {
      default: { name: 'Ink Explorer', url: 'https://explorer.inkonchain.com' },
    },
  } as Chain,
};

export interface VerificationResult {
  verified: boolean;
  txHash?: string;
  txHashes?: string[]; // For AND logic - all matching tx hashes
  timestamp?: number;
  error?: string;
}

export interface VerificationFunction {
  signature: string;
  label?: string;
}

export type VerificationLogic = 'AND' | 'OR';

// Maximum verification duration: 1 hour (3600 seconds)
// This ensures reasonable RPC query times across all chains
export const MAX_VERIFICATION_DURATION_SECONDS = 3600;

// Maximum blocks to scan in a single verification (safety limit)
const MAX_BLOCKS_ABSOLUTE = 15000;

/**
 * Compute the 4-byte function selector from a function signature
 * e.g., "gm()" -> "0x5c60da1b"
 */
export function computeFunctionSelector(functionSignature: string): string {
  const normalized = functionSignature.replace(/\s/g, '');
  const hash = keccak256(toBytes(normalized));
  return hash.slice(0, 10); // First 4 bytes (8 hex chars + 0x)
}

/**
 * Get chain configuration from viem or custom chains
 */
function getChain(chainId: number): Chain | undefined {
  // Check custom chains first
  if (customChains[chainId]) {
    return customChains[chainId];
  }
  
  // Check viem chains
  return Object.values(viemChains).find(
    (c): c is Chain => typeof c === 'object' && c !== null && 'id' in c && c.id === chainId
  );
}

/**
 * Verify if a user called a specific function on a contract within a time window
 * Uses RPC to query recent blocks and check transactions
 */
export async function verifyUserTransaction(params: {
  walletAddress: string;
  contractAddress: string;
  functionSelector: string;
  chainId: number;
  durationSeconds: number;
}): Promise<VerificationResult> {
  const { walletAddress, contractAddress, functionSelector, chainId, durationSeconds } = params;

  const chain = getChain(chainId);
  if (!chain) {
    return { verified: false, error: `Unsupported chain ID: ${chainId}` };
  }

  try {
    const client = createPublicClient({
      chain,
      transport: http(),
    });

    // Get current block and calculate how many blocks to look back
    const currentBlock = await client.getBlockNumber();
    
    // Estimate blocks based on duration (assume ~2 seconds per block average)
    // This varies by chain, but we'll be generous
    const avgBlockTime = getAvgBlockTime(chainId);
    const blocksToCheck = Math.ceil(durationSeconds / avgBlockTime) + 100; // Add buffer
    const fromBlock = currentBlock - BigInt(blocksToCheck);

    const normalizedWallet = walletAddress.toLowerCase() as `0x${string}`;
    const normalizedContract = contractAddress.toLowerCase() as `0x${string}`;
    const normalizedSelector = functionSelector.toLowerCase();

    // Method 1: Try to get transactions via trace (if supported)
    // Method 2: Query recent blocks and check transactions
    
    // We'll iterate through recent blocks to find matching transactions
    // This is more reliable across different chains
    const batchSize = 50;
    let checkedBlocks = 0;
    // Dynamic max blocks based on chain speed, capped at absolute max for safety
    const maxBlocks = Math.min(blocksToCheck, MAX_BLOCKS_ABSOLUTE);

    for (let i = 0; i < maxBlocks; i += batchSize) {
      const startBlock = currentBlock - BigInt(i + batchSize);
      const endBlock = currentBlock - BigInt(i);
      
      // Get blocks in parallel
      const blockPromises: Promise<any>[] = [];
      for (let blockNum = endBlock; blockNum > startBlock && blockNum >= fromBlock; blockNum--) {
        blockPromises.push(
          client.getBlock({ blockNumber: blockNum, includeTransactions: true })
            .catch(() => null) // Ignore errors for individual blocks
        );
      }

      const blocks = await Promise.all(blockPromises);
      
      for (const block of blocks) {
        if (!block || !block.transactions) continue;
        
        // Check block timestamp against duration
        const blockTimestamp = Number(block.timestamp);
        const now = Math.floor(Date.now() / 1000);
        if (now - blockTimestamp > durationSeconds) {
          // Block is too old, we can stop
          return { 
            verified: false, 
            error: 'No matching transaction found in the specified time window' 
          };
        }

        for (const tx of block.transactions) {
          // Skip if tx is just a hash (shouldn't happen with includeTransactions: true)
          if (typeof tx === 'string') continue;
          
          // Check if transaction is from the user to the contract
          if (
            tx.from?.toLowerCase() === normalizedWallet &&
            tx.to?.toLowerCase() === normalizedContract &&
            tx.input?.toLowerCase().startsWith(normalizedSelector)
          ) {
            // Found a matching transaction!
            return {
              verified: true,
              txHash: tx.hash,
              timestamp: blockTimestamp,
            };
          }
        }
      }
      
      checkedBlocks += batchSize;
    }

    return { 
      verified: false, 
      error: 'No matching transaction found in the specified time window' 
    };
  } catch (error) {
    console.error('On-chain verification error:', error);
    return { 
      verified: false, 
      error: error instanceof Error ? error.message : 'Failed to verify transaction' 
    };
  }
}

/**
 * Get average block time for a chain (in seconds)
 */
function getAvgBlockTime(chainId: number): number {
  const blockTimes: Record<number, number> = {
    1: 12,      // Ethereum
    10: 2,      // Optimism
    56: 3,      // BSC
    137: 2,     // Polygon
    250: 1,     // Fantom
    324: 1,     // zkSync
    8453: 2,    // Base
    42161: 0.25, // Arbitrum
    43114: 2,   // Avalanche
    59144: 2,   // Linea
    534352: 3,  // Scroll
    81457: 2,   // Blast
    5000: 2,    // Mantle
    34443: 2,   // Mode
    7777777: 2, // Zora
    57073: 2,   // Ink
  };
  return blockTimes[chainId] || 2;
}

/**
 * Get supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  const viemChainIds = Object.values(viemChains)
    .filter((c): c is Chain => typeof c === 'object' && c !== null && 'id' in c)
    .map(c => c.id);
  
  const customChainIds = Object.keys(customChains).map(Number);
  
  return [...new Set([...viemChainIds, ...customChainIds])];
}

/**
 * Check if a chain is supported
 */
export function isChainSupported(chainId: number): boolean {
  return getChain(chainId) !== undefined;
}

/**
 * Verify multiple functions with AND/OR logic
 * - OR: User must have called at least one of the functions
 * - AND: User must have called ALL of the functions
 */
export async function verifyMultipleFunctions(params: {
  walletAddress: string;
  contractAddress: string;
  functions: VerificationFunction[];
  logic: VerificationLogic;
  chainId: number;
  durationSeconds: number;
}): Promise<VerificationResult> {
  const { walletAddress, contractAddress, functions, logic, chainId, durationSeconds } = params;

  if (!functions || functions.length === 0) {
    return { verified: false, error: 'No functions specified for verification' };
  }

  const chain = getChain(chainId);
  if (!chain) {
    return { verified: false, error: `Unsupported chain ID: ${chainId}` };
  }

  // Compute selectors for all functions
  const functionSelectors = functions.map((fn) => ({
    signature: fn.signature,
    label: fn.label || fn.signature,
    selector: computeFunctionSelector(fn.signature).toLowerCase(),
  }));

  try {
    const client = createPublicClient({
      chain,
      transport: http(),
    });

    const currentBlock = await client.getBlockNumber();
    const avgBlockTime = getAvgBlockTime(chainId);
    const blocksToCheck = Math.ceil(durationSeconds / avgBlockTime) + 100;
    const fromBlock = currentBlock - BigInt(blocksToCheck);

    const normalizedWallet = walletAddress.toLowerCase() as `0x${string}`;
    const normalizedContract = contractAddress.toLowerCase() as `0x${string}`;

    // Track which functions have been matched
    const matchedFunctions = new Map<string, { txHash: string; timestamp: number }>();

    const batchSize = 50;
    // Dynamic max blocks based on chain speed, capped at absolute max for safety
    const maxBlocks = Math.min(blocksToCheck, MAX_BLOCKS_ABSOLUTE);

    for (let i = 0; i < maxBlocks; i += batchSize) {
      const startBlock = currentBlock - BigInt(i + batchSize);
      const endBlock = currentBlock - BigInt(i);

      const blockPromises: Promise<any>[] = [];
      for (let blockNum = endBlock; blockNum > startBlock && blockNum >= fromBlock; blockNum--) {
        blockPromises.push(
          client.getBlock({ blockNumber: blockNum, includeTransactions: true }).catch(() => null)
        );
      }

      const blocks = await Promise.all(blockPromises);

      for (const block of blocks) {
        if (!block || !block.transactions) continue;

        const blockTimestamp = Number(block.timestamp);
        const now = Math.floor(Date.now() / 1000);
        
        if (now - blockTimestamp > durationSeconds) {
          // Block is too old - check if we have enough matches
          break;
        }

        for (const tx of block.transactions) {
          if (typeof tx === 'string') continue;

          if (
            tx.from?.toLowerCase() === normalizedWallet &&
            tx.to?.toLowerCase() === normalizedContract
          ) {
            const txInput = tx.input?.toLowerCase() || '';

            // Check against all function selectors
            for (const fn of functionSelectors) {
              if (txInput.startsWith(fn.selector) && !matchedFunctions.has(fn.selector)) {
                matchedFunctions.set(fn.selector, {
                  txHash: tx.hash,
                  timestamp: blockTimestamp,
                });

                // For OR logic, one match is enough
                if (logic === 'OR') {
                  return {
                    verified: true,
                    txHash: tx.hash,
                    txHashes: [tx.hash],
                    timestamp: blockTimestamp,
                  };
                }
              }
            }

            // For AND logic, check if all functions are matched
            if (logic === 'AND' && matchedFunctions.size === functionSelectors.length) {
              const txHashes = Array.from(matchedFunctions.values()).map((m) => m.txHash);
              const latestTimestamp = Math.max(...Array.from(matchedFunctions.values()).map((m) => m.timestamp));
              return {
                verified: true,
                txHash: txHashes[0],
                txHashes,
                timestamp: latestTimestamp,
              };
            }
          }
        }
      }
    }

    // Final check for AND logic
    if (logic === 'AND') {
      const missingFunctions = functionSelectors.filter((fn) => !matchedFunctions.has(fn.selector));
      const missingLabels = missingFunctions.map((fn) => fn.label).join(', ');
      return {
        verified: false,
        error: `Missing transactions for: ${missingLabels}`,
      };
    }

    return {
      verified: false,
      error: 'No matching transaction found in the specified time window',
    };
  } catch (error) {
    console.error('Multi-function verification error:', error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Failed to verify transactions',
    };
  }
}
