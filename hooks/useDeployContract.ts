'use client';

import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { QUEST_MINT_ABI, QUEST_MINT_BYTECODE } from '@/lib/contracts/QuestMint';

export type DeployStatus = 'idle' | 'pending' | 'deploying' | 'success' | 'error';

export interface DeployError {
  code: 'NO_BYTECODE' | 'USER_REJECTED' | 'INSUFFICIENT_FUNDS' | 'DEPLOY_FAILED' | 'NOT_CONNECTED';
  message: string;
}

export interface DeployParams {
  name: string;
  symbol: string;
  contractURI: string;
  chainId: number;
}

export interface UseDeployContractReturn {
  deploy: (params: DeployParams) => Promise<`0x${string}` | null>;
  status: DeployStatus;
  error: DeployError | null;
  txHash: `0x${string}` | undefined;
  contractAddress: `0x${string}` | undefined;
  reset: () => void;
  isIdle: boolean;
  isPending: boolean;
  isDeploying: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export function useDeployContract(): UseDeployContractReturn {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [status, setStatus] = useState<DeployStatus>('idle');
  const [error, setError] = useState<DeployError | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [contractAddress, setContractAddress] = useState<`0x${string}` | undefined>();

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setTxHash(undefined);
    setContractAddress(undefined);
  }, []);

  const deploy = useCallback(
    async (params: DeployParams): Promise<`0x${string}` | null> => {
      reset();

      if (!isConnected || !address) {
        setError({
          code: 'NOT_CONNECTED',
          message: 'Please connect your wallet first',
        });
        setStatus('error');
        return null;
      }

      if (!walletClient) {
        setError({
          code: 'NOT_CONNECTED',
          message: 'Wallet client not available',
        });
        setStatus('error');
        return null;
      }

      if (!publicClient) {
        setError({
          code: 'DEPLOY_FAILED',
          message: 'Public client not available',
        });
        setStatus('error');
        return null;
      }

      // Check if bytecode is available
      if (!QUEST_MINT_BYTECODE || QUEST_MINT_BYTECODE === '0x') {
        setError({
          code: 'NO_BYTECODE',
          message: 'Contract bytecode not available. Please compile the contract first.',
        });
        setStatus('error');
        return null;
      }

      try {
        setStatus('pending');

        // Deploy the contract
        const hash = await walletClient.deployContract({
          abi: QUEST_MINT_ABI,
          bytecode: QUEST_MINT_BYTECODE,
          args: [params.name, params.symbol, params.contractURI, address],
        });

        setTxHash(hash);
        setStatus('deploying');

        // Wait for deployment
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
        });

        if (receipt.status === 'reverted') {
          throw new Error('Contract deployment reverted');
        }

        if (!receipt.contractAddress) {
          throw new Error('No contract address in receipt');
        }

        setContractAddress(receipt.contractAddress);
        setStatus('success');

        return receipt.contractAddress;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message.toLowerCase() : '';

        if (errorMessage.includes('user rejected') || errorMessage.includes('user denied')) {
          setError({
            code: 'USER_REJECTED',
            message: 'Transaction was cancelled',
          });
        } else if (errorMessage.includes('insufficient funds')) {
          setError({
            code: 'INSUFFICIENT_FUNDS',
            message: 'Not enough balance to deploy contract',
          });
        } else {
          setError({
            code: 'DEPLOY_FAILED',
            message: err instanceof Error ? err.message : 'Deployment failed',
          });
        }

        setStatus('error');
        return null;
      }
    },
    [isConnected, address, walletClient, publicClient, reset]
  );

  return {
    deploy,
    status,
    error,
    txHash,
    contractAddress,
    reset,
    isIdle: status === 'idle',
    isPending: status === 'pending',
    isDeploying: status === 'deploying',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
}
