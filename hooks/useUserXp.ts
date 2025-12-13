'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { createClient } from '@/lib/supabase/client';

export interface UserXp {
  total_xp: number;
  wallet_address: string;
}

export interface XpTransaction {
  id: string;
  task_id: string;
  xp_amount: number;
  verification_timestamp: number | null;
  created_at: string;
}

export interface UseUserXpReturn {
  userXp: UserXp | null;
  transactions: XpTransaction[];
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export function useUserXp(): UseUserXpReturn {
  const { address, isConnected } = useAccount();
  const [userXp, setUserXp] = useState<UserXp | null>(null);
  const [transactions, setTransactions] = useState<XpTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserXp = useCallback(async () => {
    if (!address || !isConnected) {
      setUserXp(null);
      setTransactions([]);
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const normalizedAddress = address.toLowerCase();

      // Fetch user XP
      const { data: xpData } = await supabase
        .from('mint_platform_user_xp')
        .select('total_xp, wallet_address')
        .eq('wallet_address', normalizedAddress)
        .single();

      if (xpData) {
        setUserXp(xpData);
      } else {
        setUserXp({ total_xp: 0, wallet_address: normalizedAddress });
      }

      // Fetch XP transactions
      const { data: txData } = await supabase
        .from('mint_platform_xp_transactions')
        .select('id, task_id, xp_amount, verification_timestamp, created_at')
        .eq('wallet_address', normalizedAddress)
        .order('created_at', { ascending: false })
        .limit(50);

      setTransactions(txData || []);
    } catch (err) {
      console.error('Error fetching user XP:', err);
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    fetchUserXp();
  }, [fetchUserXp]);

  return {
    userXp,
    transactions,
    isLoading,
    refetch: fetchUserXp,
  };
}
