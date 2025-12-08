'use client';

import { useCallback, useMemo } from 'react';
import { useReadContract, useAccount, useBalance } from 'wagmi';
import { erc721Abi, erc20Abi } from 'viem';
import type { EligibilityCondition, EligibilityCheckResult } from '@/types/quest';

export interface UseEligibilityParams {
  condition: EligibilityCondition | null;
  chainId: number;
}

export interface UseEligibilityReturn {
  isEligible: boolean;
  isLoading: boolean;
  checkResult: EligibilityCheckResult | null;
  refetch: () => void;
}

export function useEligibility({
  condition,
  chainId,
}: UseEligibilityParams): UseEligibilityReturn {
  const { address, isConnected } = useAccount();

  // NFT balance check (ERC721 balanceOf)
  const {
    data: nftBalance,
    isLoading: isNftLoading,
    refetch: refetchNft,
  } = useReadContract({
    address: condition?.contract_address as `0x${string}` | undefined,
    abi: erc721Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId,
    query: {
      enabled:
        isConnected &&
        !!address &&
        condition?.type === 'nft' &&
        !!condition.contract_address,
    },
  });

  // ERC20 token balance check
  const {
    data: erc20Balance,
    isLoading: isErc20Loading,
    refetch: refetchErc20,
  } = useReadContract({
    address: condition?.contract_address as `0x${string}` | undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId,
    query: {
      enabled:
        isConnected &&
        !!address &&
        condition?.type === 'token' &&
        !!condition.contract_address,
    },
  });

  // Native token balance check (when no specific token address)
  const {
    data: nativeBalance,
    isLoading: isNativeLoading,
    refetch: refetchNative,
  } = useBalance({
    address,
    chainId,
    query: {
      enabled:
        isConnected &&
        !!address &&
        condition?.type === 'token' &&
        !condition.contract_address,
    },
  });

  const isLoading = useMemo(() => {
    if (!condition || !isConnected) return false;
    if (condition.type === 'nft') return isNftLoading;
    if (condition.type === 'token') {
      return condition.contract_address ? isErc20Loading : isNativeLoading;
    }
    return false;
  }, [condition, isConnected, isNftLoading, isErc20Loading, isNativeLoading]);

  const checkResult = useMemo((): EligibilityCheckResult | null => {
    if (!condition) {
      return {
        is_eligible: true,
        condition: null,
        current_balance: '0',
        required_amount: '0',
      };
    }

    if (!isConnected || !address) {
      return null;
    }

    const requiredAmount = BigInt(condition.min_amount || '0');

    // NFT eligibility check
    if (condition.type === 'nft') {
      if (condition.contract_address && nftBalance !== undefined) {
        const balance = BigInt(nftBalance.toString());
        return {
          is_eligible: balance >= requiredAmount,
          condition,
          current_balance: balance.toString(),
          required_amount: requiredAmount.toString(),
        };
      }
      // If no specific contract, we can't check total NFT holdings easily
      // Return null to indicate we need more info
      if (!condition.contract_address) {
        return {
          is_eligible: false,
          condition,
          current_balance: '0',
          required_amount: requiredAmount.toString(),
        };
      }
    }

    // Token eligibility check
    if (condition.type === 'token') {
      // Specific ERC20 token
      if (condition.contract_address && erc20Balance !== undefined) {
        const balance = BigInt(erc20Balance.toString());
        return {
          is_eligible: balance >= requiredAmount,
          condition,
          current_balance: balance.toString(),
          required_amount: requiredAmount.toString(),
        };
      }

      // Native token (ETH, MATIC, etc.)
      if (!condition.contract_address && nativeBalance) {
        const balance = nativeBalance.value;
        return {
          is_eligible: balance >= requiredAmount,
          condition,
          current_balance: balance.toString(),
          required_amount: requiredAmount.toString(),
        };
      }
    }

    return null;
  }, [condition, isConnected, address, nftBalance, erc20Balance, nativeBalance]);

  const isEligible = useMemo(() => {
    if (!condition) return true;
    if (!isConnected) return false;
    return checkResult?.is_eligible ?? false;
  }, [condition, isConnected, checkResult]);

  const refetch = useCallback(() => {
    if (condition?.type === 'nft') {
      refetchNft();
    } else if (condition?.type === 'token') {
      if (condition.contract_address) {
        refetchErc20();
      } else {
        refetchNative();
      }
    }
  }, [condition, refetchNft, refetchErc20, refetchNative]);

  return {
    isEligible,
    isLoading,
    checkResult,
    refetch,
  };
}
