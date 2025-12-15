'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MintFunCampaign } from '@/types/campaign';
import type { QuestCampaign } from '@/types/quest';
import type { MintfunCampaignRow, MintTierRow, QuestCampaignRow, QuestTaskRow, EligibilityConditionRow } from '@/types/database';
import { toCampaignTheme } from '@/types/campaign';

const PAGE_SIZE = 10;

interface UsePaginatedCampaignsOptions {
  type: 'mintfun' | 'quest';
  searchQuery: string;
  selectedChain: number | null;
}

interface UsePaginatedCampaignsResult<T> {
  campaigns: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  availableChains: number[];
  loadMore: () => void;
  refresh: () => void;
}

export function usePaginatedMintFun(
  searchQuery: string,
  selectedChain: number | null
): UsePaginatedCampaignsResult<MintFunCampaign> {
  const [campaigns, setCampaigns] = useState<MintFunCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [availableChains, setAvailableChains] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  
  // Track current filters to detect changes
  const filtersRef = useRef({ searchQuery, selectedChain });

  // Fetch available chains (only once on mount)
  useEffect(() => {
    async function fetchChains() {
      const supabase = createClient();
      const { data } = await supabase
        .from('mint_platform_mintfun_campaigns')
        .select('chain_id')
        .eq('is_active', true);
      
      if (data) {
        const chains = new Set<number>();
        data.forEach((row: { chain_id: number | null }) => {
          if (row.chain_id) chains.add(row.chain_id);
        });
        setAvailableChains(Array.from(chains).sort((a, b) => a - b));
      }
    }
    fetchChains();
  }, []);

  const fetchCampaigns = useCallback(async (pageNum: number, append: boolean = false) => {
    const supabase = createClient();
    
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      let query = supabase
        .from('mint_platform_mintfun_campaigns')
        .select('*, mint_platform_mint_tiers(*)', { count: 'exact' })
        .eq('is_active', true);

      // Apply chain filter
      if (selectedChain) {
        query = query.eq('chain_id', selectedChain);
      }

      // Apply search filter (title or description)
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Pagination
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      query = query
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      if (data) {
        const mapped: MintFunCampaign[] = (data as (MintfunCampaignRow & { mint_platform_mint_tiers: MintTierRow[] })[]).map(row => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          description: row.description,
          image_url: row.image_url,
          chain_id: row.chain_id,
          contract_address: row.contract_address,
          token_id: row.token_id,
          mint_tiers: row.mint_platform_mint_tiers.map(tier => ({
            id: tier.id,
            campaign_id: tier.campaign_id,
            name: tier.name,
            quantity: tier.quantity,
            price: tier.price,
            max_per_wallet: tier.max_per_wallet,
            order_index: tier.order_index,
          })),
          theme: toCampaignTheme(row.theme),
          is_active: row.is_active,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }));

        if (append) {
          setCampaigns(prev => [...prev, ...mapped]);
        } else {
          setCampaigns(mapped);
        }

        setTotalCount(count || 0);
        setHasMore(mapped.length === PAGE_SIZE && (count || 0) > (pageNum + 1) * PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [searchQuery, selectedChain]);

  // Reset and fetch when filters change
  useEffect(() => {
    const filtersChanged = 
      filtersRef.current.searchQuery !== searchQuery || 
      filtersRef.current.selectedChain !== selectedChain;
    
    if (filtersChanged) {
      filtersRef.current = { searchQuery, selectedChain };
      setPage(0);
      setCampaigns([]);
      fetchCampaigns(0, false);
    }
  }, [searchQuery, selectedChain, fetchCampaigns]);

  // Initial fetch
  useEffect(() => {
    fetchCampaigns(0, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCampaigns(nextPage, true);
    }
  }, [page, isLoadingMore, hasMore, fetchCampaigns]);

  const refresh = useCallback(() => {
    setPage(0);
    setCampaigns([]);
    fetchCampaigns(0, false);
  }, [fetchCampaigns]);

  return {
    campaigns,
    isLoading,
    isLoadingMore,
    hasMore,
    totalCount,
    availableChains,
    loadMore,
    refresh,
  };
}

export function usePaginatedQuests(
  searchQuery: string,
  selectedChain: number | null
): UsePaginatedCampaignsResult<QuestCampaign> {
  const [campaigns, setCampaigns] = useState<QuestCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [availableChains, setAvailableChains] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  
  const filtersRef = useRef({ searchQuery, selectedChain });

  // Fetch available chains
  useEffect(() => {
    async function fetchChains() {
      const supabase = createClient();
      const { data } = await supabase
        .from('mint_platform_quest_campaigns')
        .select('chain_id')
        .eq('is_active', true);
      
      if (data) {
        const chains = new Set<number>();
        data.forEach((row: { chain_id: number | null }) => {
          if (row.chain_id) chains.add(row.chain_id);
        });
        setAvailableChains(Array.from(chains).sort((a, b) => a - b));
      }
    }
    fetchChains();
  }, []);

  const fetchCampaigns = useCallback(async (pageNum: number, append: boolean = false) => {
    const supabase = createClient();
    
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      let query = supabase
        .from('mint_platform_quest_campaigns')
        .select('*, mint_platform_quest_tasks(*), mint_platform_eligibility_conditions(*)', { count: 'exact' })
        .eq('is_active', true);

      if (selectedChain) {
        query = query.eq('chain_id', selectedChain);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      query = query
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      if (data) {
        const mapped: QuestCampaign[] = (data as (QuestCampaignRow & { mint_platform_quest_tasks: QuestTaskRow[]; mint_platform_eligibility_conditions: EligibilityConditionRow[] })[]).map(row => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          description: row.description,
          image_url: row.image_url,
          chain_id: row.chain_id,
          contract_address: row.contract_address,
          token_id: row.token_id,
          tasks: row.mint_platform_quest_tasks.map(task => ({
            id: task.id,
            quest_id: task.quest_id,
            type: task.type,
            title: task.title,
            description: task.description,
            external_url: task.external_url,
            verification_data: task.verification_data,
            order_index: task.order_index,
          })),
          eligibility: row.mint_platform_eligibility_conditions?.[0] ? {
            id: row.mint_platform_eligibility_conditions[0].id,
            quest_id: row.mint_platform_eligibility_conditions[0].quest_id,
            type: row.mint_platform_eligibility_conditions[0].type,
            min_amount: row.mint_platform_eligibility_conditions[0].min_amount,
            contract_address: row.mint_platform_eligibility_conditions[0].contract_address,
          } : null,
          theme: toCampaignTheme(row.theme),
          is_active: row.is_active,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }));

        if (append) {
          setCampaigns(prev => [...prev, ...mapped]);
        } else {
          setCampaigns(mapped);
        }

        setTotalCount(count || 0);
        setHasMore(mapped.length === PAGE_SIZE && (count || 0) > (pageNum + 1) * PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [searchQuery, selectedChain]);

  useEffect(() => {
    const filtersChanged = 
      filtersRef.current.searchQuery !== searchQuery || 
      filtersRef.current.selectedChain !== selectedChain;
    
    if (filtersChanged) {
      filtersRef.current = { searchQuery, selectedChain };
      setPage(0);
      setCampaigns([]);
      fetchCampaigns(0, false);
    }
  }, [searchQuery, selectedChain, fetchCampaigns]);

  useEffect(() => {
    fetchCampaigns(0, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCampaigns(nextPage, true);
    }
  }, [page, isLoadingMore, hasMore, fetchCampaigns]);

  const refresh = useCallback(() => {
    setPage(0);
    setCampaigns([]);
    fetchCampaigns(0, false);
  }, [fetchCampaigns]);

  return {
    campaigns,
    isLoading,
    isLoadingMore,
    hasMore,
    totalCount,
    availableChains,
    loadMore,
    refresh,
  };
}


import type { XpQuestCampaign } from '@/types/xpQuest';

export function usePaginatedXpQuests(
  searchQuery: string,
  selectedChain: number | null
): UsePaginatedCampaignsResult<XpQuestCampaign> {
  const [campaigns, setCampaigns] = useState<XpQuestCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [availableChains, setAvailableChains] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  
  const filtersRef = useRef({ searchQuery, selectedChain });

  // Fetch available chains
  useEffect(() => {
    async function fetchChains() {
      const supabase = createClient();
      const { data } = await supabase
        .from('mint_platform_xp_quest_campaigns')
        .select('verification_chain_id')
        .eq('is_active', true);
      
      if (data) {
        const chains = new Set<number>();
        data.forEach((row: { verification_chain_id: number | null }) => {
          if (row.verification_chain_id) chains.add(row.verification_chain_id);
        });
        setAvailableChains(Array.from(chains).sort((a, b) => a - b));
      }
    }
    fetchChains();
  }, []);

  const fetchCampaigns = useCallback(async (pageNum: number, append: boolean = false) => {
    const supabase = createClient();
    
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      let query = supabase
        .from('mint_platform_xp_quest_campaigns')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      if (selectedChain) {
        query = query.eq('verification_chain_id', selectedChain);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      query = query
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      if (data) {
        const mapped: XpQuestCampaign[] = data.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          slug: row.slug as string,
          title: row.title as string,
          description: row.description as string | null,
          image_url: row.image_url as string,
          xp_reward: row.xp_reward as number,
          verification_chain_id: row.verification_chain_id as number,
          verification_contract: row.verification_contract as string,
          verification_functions: (row.verification_functions as XpQuestCampaign['verification_functions']) || [],
          verification_logic: (row.verification_logic as XpQuestCampaign['verification_logic']) || 'OR',
          duration_seconds: row.duration_seconds as number,
          external_url: row.external_url as string,
          theme: toCampaignTheme(row.theme as Record<string, unknown> || {}),
          is_active: row.is_active as boolean,
          created_at: row.created_at as string,
          updated_at: row.updated_at as string,
        }));

        if (append) {
          setCampaigns(prev => [...prev, ...mapped]);
        } else {
          setCampaigns(mapped);
        }

        setTotalCount(count || 0);
        setHasMore(mapped.length === PAGE_SIZE && (count || 0) > (pageNum + 1) * PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error fetching XP quest campaigns:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [searchQuery, selectedChain]);

  useEffect(() => {
    const filtersChanged = 
      filtersRef.current.searchQuery !== searchQuery || 
      filtersRef.current.selectedChain !== selectedChain;
    
    if (filtersChanged) {
      filtersRef.current = { searchQuery, selectedChain };
      setPage(0);
      setCampaigns([]);
      fetchCampaigns(0, false);
    }
  }, [searchQuery, selectedChain, fetchCampaigns]);

  useEffect(() => {
    fetchCampaigns(0, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCampaigns(nextPage, true);
    }
  }, [page, isLoadingMore, hasMore, fetchCampaigns]);

  const refresh = useCallback(() => {
    setPage(0);
    setCampaigns([]);
    fetchCampaigns(0, false);
  }, [fetchCampaigns]);

  return {
    campaigns,
    isLoading,
    isLoadingMore,
    hasMore,
    totalCount,
    availableChains,
    loadMore,
    refresh,
  };
}
