import { PinataSDK } from 'pinata';

// Initialize Pinata client (server-side only)
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'gateway.pinata.cloud',
});

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface UploadResult {
  cid: string;
  ipfsUrl: string;
  gatewayUrl: string;
}

/**
 * Upload a single file to IPFS via Pinata
 */
export async function uploadFile(file: File, name?: string): Promise<UploadResult> {
  const upload = await pinata.upload.public.file(file);

  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'gateway.pinata.cloud';
  
  return {
    cid: upload.cid,
    ipfsUrl: `ipfs://${upload.cid}`,
    gatewayUrl: `https://${gateway}/ipfs/${upload.cid}`,
  };
}

/**
 * Upload multiple files to IPFS via Pinata
 */
export async function uploadFiles(files: File[], groupName?: string): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  
  for (const file of files) {
    const result = await uploadFile(file, groupName ? `${groupName}-${file.name}` : undefined);
    results.push(result);
  }
  
  return results;
}

/**
 * Upload JSON metadata to IPFS
 */
export async function uploadMetadata(metadata: NFTMetadata, name?: string): Promise<UploadResult> {
  const upload = await pinata.upload.public.json(metadata);

  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'gateway.pinata.cloud';
  
  return {
    cid: upload.cid,
    ipfsUrl: `ipfs://${upload.cid}`,
    gatewayUrl: `https://${gateway}/ipfs/${upload.cid}`,
  };
}

/**
 * Generate ERC-1155 compliant metadata
 */
export function generateNFTMetadata(
  name: string,
  description: string,
  imageCid: string,
  attributes?: Array<{ trait_type: string; value: string | number }>,
  externalUrl?: string
): NFTMetadata {
  return {
    name,
    description,
    image: `ipfs://${imageCid}`,
    ...(externalUrl && { external_url: externalUrl }),
    ...(attributes && attributes.length > 0 && { attributes }),
  };
}

/**
 * Upload image and generate metadata in one step
 */
export async function uploadNFTWithMetadata(
  imageFile: File,
  name: string,
  description: string,
  attributes?: Array<{ trait_type: string; value: string | number }>,
  externalUrl?: string
): Promise<{ image: UploadResult; metadata: UploadResult }> {
  // Upload image first
  const imageResult = await uploadFile(imageFile, `${name}-image`);
  
  // Generate and upload metadata
  const metadata = generateNFTMetadata(name, description, imageResult.cid, attributes, externalUrl);
  const metadataResult = await uploadMetadata(metadata, `${name}-metadata`);
  
  return {
    image: imageResult,
    metadata: metadataResult,
  };
}

/**
 * Convert IPFS URL to gateway URL for display
 */
export function ipfsToGatewayUrl(ipfsUrl: string): string {
  if (!ipfsUrl.startsWith('ipfs://')) return ipfsUrl;
  
  const cid = ipfsUrl.replace('ipfs://', '');
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'gateway.pinata.cloud';
  return `https://${gateway}/ipfs/${cid}`;
}

/**
 * Convert gateway URL to IPFS URL
 */
export function gatewayToIpfsUrl(gatewayUrl: string): string {
  const match = gatewayUrl.match(/\/ipfs\/([a-zA-Z0-9]+)/);
  if (match) {
    return `ipfs://${match[1]}`;
  }
  return gatewayUrl;
}
