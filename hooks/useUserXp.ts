'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

export interface XpTransaction {
  id: string;
  xp_amount: number;
  tx_hash: string | null;
  verified_at: string;
  created_at: string;
  task_id: string;
}

export interface UseUserXpReturn {
  totalXp: number;
  transactions: XpTransaction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserXp(): UseUserXpReturn {
  const { address, isConnected } = useAccount();
  const [totalXp, setTotalXp] = useState(0);
  const [transactions, setTransactions] = useState<XpTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchXp = useCallback(async () => {
    if (!address || !isConnected) {
      setTotalXp(0);
      setTransactions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/xp?walletAddress=${address}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch XP');
      }

      setTotalXp(data.totalXp);
      setTransactions(data.transactions);
    } catch (err) {
      console.error('Error fetching XP:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch XP');
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    fetchXp();
  }, [fetchXp]);

  return {
    totalXp,
    transactions,
    isLoading,
    error,
    refetch: fetchXp,
  };
}
