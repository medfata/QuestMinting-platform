'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { QUEST_MINT_ABI } from '@/lib/contracts/QuestMint';

export type CreateTokenStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

export interface CreateTokenError {
  code: 'USER_REJECTED' | 'CONTRACT_ERROR' | 'NOT_CONNECTED' | 'INVALID_PARAMS';
  message: string;
}

export interface CreateTokenParams {
  contractAddress: `0x${string}`;
  tokenId: bigint;
  price: string; // In ETH (e.g., "0.01")
  maxSupply: bigint;
  maxPerWallet: bigint;
  tokenURI: string;
  active: boolean;
}

export interface UseCreateTokenReturn {
  createToken: (params: CreateTokenParams) => Promise<boolean>;
  status: CreateTokenStatus;
  error: CreateTokenError | null;
  txHash: `0x${string}` | undefined;
  reset: () => void;
  isIdle: boolean;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export function useCreateToken(): UseCreateTokenReturn {
  const { isConnected } = useAccount();
  const [createError, setCreateError] = useState<CreateTokenError | null>(null);

  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const getStatus = (): CreateTokenStatus => {
    if (isSuccess) return 'success';
    if (createError || writeError || receiptError) return 'error';
    if (isConfirming) return 'confirming';
    if (isWritePending) return 'pending';
    return 'idle';
  };

  const status = getStatus();

  const parseError = useCallback((error: Error): CreateTokenError => {
    const message = error.message.toLowerCase();

    if (message.includes('user rejected') || message.includes('user denied')) {
      return {
        code: 'USER_REJECTED',
        message: 'Transaction was cancelled',
      };
    }

    if (message.includes('token already exists')) {
      return {
        code: 'CONTRACT_ERROR',
        message: 'This token ID already exists',
      };
    }

    return {
      code: 'CONTRACT_ERROR',
      message: error.message || 'Failed to create token',
    };
  }, []);

  const getCurrentError = useCallback((): CreateTokenError | null => {
    if (createError) return createError;
    if (writeError) return parseError(writeError);
    if (receiptError) return parseError(receiptError);
    return null;
  }, [createError, writeError, receiptError, parseError]);

  const createToken = useCallback(
    async (params: CreateTokenParams): Promise<boolean> => {
      setCreateError(null);

      if (!isConnected) {
        setCreateError({
          code: 'NOT_CONNECTED',
          message: 'Please connect your wallet first',
        });
        return false;
      }

      try {
        // Convert price from ETH string to wei
        const priceInWei = params.price ? parseEther(params.price) : BigInt(0);

        writeContract({
          address: params.contractAddress,
          abi: QUEST_MINT_ABI,
          functionName: 'createToken',
          args: [
            params.tokenId,
            priceInWei,
            params.maxSupply,
            params.maxPerWallet,
            params.tokenURI,
            params.active,
          ],
        });

        return true;
      } catch (error) {
        if (error instanceof Error) {
          setCreateError(parseError(error));
        } else {
          setCreateError({
            code: 'CONTRACT_ERROR',
            message: 'An unexpected error occurred',
          });
        }
        return false;
      }
    },
    [isConnected, writeContract, parseError]
  );

  const reset = useCallback(() => {
    setCreateError(null);
    resetWrite();
  }, [resetWrite]);

  return {
    createToken,
    status,
    error: getCurrentError(),
    txHash: hash,
    reset,
    isIdle: status === 'idle',
    isPending: status === 'pending',
    isConfirming: status === 'confirming',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
}
