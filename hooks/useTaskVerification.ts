'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAccount } from 'wagmi';
import { createClient } from '@/lib/supabase/client';
import type { QuestTask, TaskCompletionStatus } from '@/types/quest';

export interface UseTaskVerificationParams {
  questId: string;
  tasks: QuestTask[];
}

export interface UseTaskVerificationReturn {
  completions: TaskCompletionStatus[];
  isLoading: boolean;
  verifyingTaskId: string | null;
  verifyTask: (taskId: string) => Promise<boolean>;
  allTasksCompleted: boolean;
  completedCount: number;
  refetch: () => Promise<void>;
}

export function useTaskVerification({
  questId,
  tasks,
}: UseTaskVerificationParams): UseTaskVerificationReturn {
  const { address, isConnected } = useAccount();
  const [completions, setCompletions] = useState<TaskCompletionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);

  // Stabilize tasks reference using task IDs
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);
  const taskIdsKey = taskIds.join(',');
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  // Fetch existing completions from database
  const fetchCompletions = useCallback(async () => {
    if (!address || !isConnected || taskIds.length === 0) {
      setCompletions((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('mint_platform_user_task_completions')
        .select('task_id, completed_at')
        .eq('wallet_address', address.toLowerCase())
        .in('task_id', taskIds);

      if (error) {
        console.error('Error fetching task completions:', error);
        return;
      }

      // Map to TaskCompletionStatus format
      const completionMap = new Map(
        (data || []).map((c) => [c.task_id, c.completed_at])
      );

      const statuses: TaskCompletionStatus[] = tasksRef.current.map((task) => ({
        task_id: task.id,
        is_completed: completionMap.has(task.id),
        completed_at: completionMap.get(task.id) || null,
      }));

      setCompletions(statuses);
    } catch (err) {
      console.error('Error fetching completions:', err);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected, taskIdsKey]);

  // Fetch completions on mount and when dependencies change
  useEffect(() => {
    fetchCompletions();
  }, [fetchCompletions]);

  // Verify a task via API
  const verifyTask = useCallback(
    async (taskId: string): Promise<boolean> => {
      if (!address || !isConnected) {
        return false;
      }

      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task) {
        return false;
      }

      setVerifyingTaskId(taskId);

      try {
        // Use different endpoint for XP quests
        const endpoint = task.type === 'xp_quest' 
          ? '/api/tasks/verify-xp' 
          : '/api/tasks/verify';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskId,
            questId,
            walletAddress: address.toLowerCase(),
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('Task verification failed:', result.error);
          return false;
        }

        if (result.verified) {
          // Update local state
          setCompletions((prev) =>
            prev.map((c) =>
              c.task_id === taskId
                ? {
                    ...c,
                    is_completed: true,
                    completed_at: new Date().toISOString(),
                  }
                : c
            )
          );
          return true;
        }

        return false;
      } catch (err) {
        console.error('Error verifying task:', err);
        return false;
      } finally {
        setVerifyingTaskId(null);
      }
    },
    [address, isConnected, questId]
  );

  const completedCount = completions.filter((c) => c.is_completed).length;
  const allTasksCompleted = completedCount === tasks.length && tasks.length > 0;

  return {
    completions,
    isLoading,
    verifyingTaskId,
    verifyTask,
    allTasksCompleted,
    completedCount,
    refetch: fetchCompletions,
  };
}
