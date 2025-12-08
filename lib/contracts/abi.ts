/**
 * Mint Contract ABI
 * Standard ERC721 minting interface with tiered pricing
 */

export const MINT_ABI = [
  {
    inputs: [
      { name: 'tierId', type: 'uint256' },
      { name: 'quantity', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tierId', type: 'uint256' }],
    name: 'getTierInfo',
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'price', type: 'uint256' },
      { name: 'maxSupply', type: 'uint256' },
      { name: 'minted', type: 'uint256' },
      { name: 'maxPerWallet', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tierId', type: 'uint256' },
      { name: 'wallet', type: 'address' },
    ],
    name: 'getMintedByWallet',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'minter', type: 'address' },
      { indexed: true, name: 'tierId', type: 'uint256' },
      { indexed: false, name: 'quantity', type: 'uint256' },
      { indexed: false, name: 'tokenIds', type: 'uint256[]' },
    ],
    name: 'Minted',
    type: 'event',
  },
] as const;

export type MintAbi = typeof MINT_ABI;
