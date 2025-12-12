'use client';

import { useState, useCallback } from 'react';
import type { QuestTask, TaskCompletionStatus } from '@/types/quest';
import { cn } from '@/lib/utils';

const TASK_TIMEOUT_MS = 7000; // 7 seconds wait time

export interface TaskListProps {
  tasks: QuestTask[];
  completions: TaskCompletionStatus[];
  onVerify: (taskId: string) => Promise<boolean | void>;
  verifyingTaskId: string | null;
  disabled?: boolean;
  className?: string;
}

const TASK_TYPE_ICONS: Record<QuestTask['type'], string> = {
  twitter_follow: '𝕏',
  twitter_retweet: '🔄',
  telegram_join: '✈️',
  discord_join: '💬',
  custom_url: '🔗',
};

const TASK_TYPE_LABELS: Record<QuestTask['type'], string> = {
  twitter_follow: 'Follow on X',
  twitter_retweet: 'Repost on X',
  telegram_join: 'Join Telegram',
  discord_join: 'Join Discord',
  custom_url: 'Visit Link',
};

export function TaskList({
  tasks,
  completions,
  onVerify,
  verifyingTaskId,
  disabled = false,
  className = '',
}: TaskListProps) {
  const sortedTasks = [...tasks].sort((a, b) => a.order_index - b.order_index);

  const isTaskCompleted = (taskId: string) =>
    completions.some((c) => c.task_id === taskId && c.is_completed);

  const completedCount = completions.filter((c) => c.is_completed).length;
  const allCompleted = completedCount === tasks.length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Tasks
        </h3>
        <span className="text-sm text-muted-foreground">
          {completedCount} of {tasks.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out',
            allCompleted ? 'bg-primary' : 'bg-primary/70'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Task items */}
      <div className="space-y-2">
        {sortedTasks.map((task) => {
          const completed = isTaskCompleted(task.id);
          const isVerifying = verifyingTaskId === task.id;

          return (
            <TaskItem
              key={task.id}
              task={task}
              completed={completed}
              isVerifying={isVerifying}
              onVerify={async () => onVerify(task.id)}
              disabled={disabled}
            />
          );
        })}
      </div>

      {allCompleted && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
          <p className="text-sm font-medium text-primary">
            All tasks completed — ready to claim
          </p>
        </div>
      )}
    </div>
  );
}

interface TaskItemProps {
  task: QuestTask;
  completed: boolean;
  isVerifying: boolean;
  onVerify: () => Promise<boolean | void>;
  disabled: boolean;
}

function TaskItem({ task, completed, isVerifying, onVerify, disabled }: TaskItemProps) {
  const [isWaiting, setIsWaiting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Handle the click-to-complete flow
  const handleTaskClick = useCallback(async () => {
    if (disabled || completed || isWaiting || isVerifying) return;

    // Open the external URL
    window.open(task.external_url, '_blank', 'noopener,noreferrer');
    
    // Start the waiting period with progress animation
    setIsWaiting(true);
    setProgress(0);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / TASK_TIMEOUT_MS) * 100, 100);
      setProgress(newProgress);
      
      if (elapsed >= TASK_TIMEOUT_MS) {
        clearInterval(interval);
      }
    }, 50);

    // Wait for the timeout
    await new Promise((resolve) => setTimeout(resolve, TASK_TIMEOUT_MS));
    clearInterval(interval);
    setProgress(100);

    // Auto-verify after timeout
    await onVerify();
    setIsWaiting(false);
    setProgress(0);
  }, [disabled, completed, isWaiting, isVerifying, task.external_url, onVerify]);

  const showLoading = isWaiting || isVerifying;

  return (
    <button
      type="button"
      onClick={handleTaskClick}
      disabled={disabled || completed || showLoading}
      className={cn(
        'w-full flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 text-left',
        completed
          ? 'border-primary/30 bg-primary/5 cursor-default'
          : showLoading
            ? 'border-primary/50 bg-primary/10 cursor-wait'
            : disabled
              ? 'border-border bg-muted/30 cursor-not-allowed opacity-60'
              : 'border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/30 cursor-pointer'
      )}
    >
      {/* Status indicator */}
      <div
        className={cn(
          'relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm transition-colors',
          completed
            ? 'bg-primary text-primary-foreground'
            : showLoading
              ? 'bg-primary/20 text-primary'
              : 'bg-muted text-muted-foreground'
        )}
      >
        {completed ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : showLoading ? (
          <>
            {/* Circular progress */}
            <svg className="absolute inset-0 w-8 h-8 -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${(progress / 100) * 88} 88`}
                className="text-primary transition-all duration-100"
              />
            </svg>
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          </>
        ) : (
          TASK_TYPE_ICONS[task.type]
        )}
      </div>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-foreground">
          {task.title}
        </h4>
        <span className="text-xs text-muted-foreground">
          {showLoading ? 'Verifying...' : TASK_TYPE_LABELS[task.type]}
        </span>
      </div>

      {/* Status badge */}
      <div className="flex flex-shrink-0 items-center">
        {completed ? (
          <span className="text-xs font-medium text-primary px-2">Done</span>
        ) : showLoading ? (
          <span className="text-xs font-medium text-primary/70 px-2">
            {Math.ceil((TASK_TIMEOUT_MS - (progress / 100) * TASK_TIMEOUT_MS) / 1000)}s
          </span>
        ) : (
          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        )}
      </div>
    </button>
  );
}
