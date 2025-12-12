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

// Professional SVG icons for task types
const TaskIcons = {
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  retweet: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M4.75 3.79l4.603 4.3-1.706 1.82L6 8.38v7.37c0 .97.784 1.75 1.75 1.75H13V20H7.75c-2.347 0-4.25-1.9-4.25-4.25V8.38L1.853 9.91.147 8.09l4.603-4.3zm11.5 2.71H11V4h5.25c2.347 0 4.25 1.9 4.25 4.25v7.37l1.647-1.53 1.706 1.82-4.603 4.3-4.603-4.3 1.706-1.82L18 15.62V8.25c0-.97-.784-1.75-1.75-1.75z" />
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
  discord: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
};

const getTaskIcon = (type: QuestTask['type']) => {
  switch (type) {
    case 'twitter_follow':
      return TaskIcons.twitter;
    case 'twitter_retweet':
      return TaskIcons.retweet;
    case 'telegram_join':
      return TaskIcons.telegram;
    case 'discord_join':
      return TaskIcons.discord;
    case 'custom_url':
      return TaskIcons.link;
    default:
      return TaskIcons.link;
  }
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
          getTaskIcon(task.type)
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
