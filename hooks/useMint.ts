'use client';

import { useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { QUEST_MINT_ABI } from '@/lib/contracts/QuestMint';

export type MintStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

export interface MintError {
  code: 'INSUFFICIENT_FUNDS' | 'USER_REJECTED' | 'CONTRACT_ERROR' | 'NETWORK_ERROR' | 'NOT_CONNECTED';
  message: string;
}

export interface UseMintParams {
  contractAddress: `0x${string}`;
  chainId: number;
}

export interface UseMintReturn {
  mint: (tierId: number, quantity: number, pricePerUnit: string) => Promise<void>;
  status: MintStatus;
  error: MintError | null;
  txHash: `0x${string}` | undefined;
  reset: () => void;
  isIdle: boolean;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export function useMint({ contractAddress, chainId }: UseMintParams): UseMintReturn {
  const { isConnected } = useAccount();
  const [mintError, setMintError] = useState<MintError | null>(null);

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

  // Determine overall status
  const getStatus = (): MintStatus => {
    if (isSuccess) return 'success';
    if (mintError || writeError || receiptError) return 'error';
    if (isConfirming) return 'confirming';
    if (isWritePending) return 'pending';
    return 'idle';
  };

  const status = getStatus();

  // Parse error to user-friendly format
  const parseError = useCallback((error: Error): MintError => {
    const message = error.message.toLowerCase();

    if (message.includes('user rejected') || message.includes('user denied')) {
      return {
        code: 'USER_REJECTED',
        message: 'Transaction was cancelled',
      };
    }

    if (message.includes('insufficient funds') || message.includes('insufficient balance')) {
      return {
        code: 'INSUFFICIENT_FUNDS',
        message: 'Not enough balance to complete this mint',
      };
    }

    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection issue. Please try again',
      };
    }

    return {
      code: 'CONTRACT_ERROR',
      message: error.message || 'Minting failed. Please try again',
    };
  }, []);

  // Get the current error
  const getCurrentError = useCallback((): MintError | null => {
    if (mintError) return mintError;
    if (writeError) return parseError(writeError);
    if (receiptError) return parseError(receiptError);
    return null;
  }, [mintError, writeError, receiptError, parseError]);

  const mint = useCallback(
    async (tierId: number, quantity: number, pricePerUnit: string) => {
      setMintError(null);

      if (!isConnected) {
        setMintError({
          code: 'NOT_CONNECTED',
          message: 'Please connect your wallet first',
        });
        return;
      }

      try {
        // Calculate total value to send
        const unitPrice = BigInt(pricePerUnit || '0');
        const totalValue = unitPrice * BigInt(quantity);

        writeContract({
          address: contractAddress,
          abi: QUEST_MINT_ABI,
          functionName: 'mint',
          args: [BigInt(tierId), BigInt(quantity)],
          value: totalValue,
          chainId,
        });
      } catch (error) {
        if (error instanceof Error) {
          setMintError(parseError(error));
        } else {
          setMintError({
            code: 'CONTRACT_ERROR',
            message: 'An unexpected error occurred',
          });
        }
      }
    },
    [isConnected, contractAddress, chainId, writeContract, parseError]
  );

  const reset = useCallback(() => {
    setMintError(null);
    resetWrite();
  }, [resetWrite]);

  return {
    mint,
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
