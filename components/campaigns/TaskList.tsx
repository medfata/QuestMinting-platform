'use client';

import { useState } from 'react';
import type { QuestTask, TaskCompletionStatus } from '@/types/quest';
import { Button } from '@/components/ui/Button';

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

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--color-text,#f8fafc)]">
          Tasks
        </h3>
        <span className="text-sm text-[var(--color-text,#f8fafc)]/70">
          {completedCount}/{tasks.length} completed
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-[var(--color-primary,#3b82f6)] transition-all duration-300"
          style={{ width: `${(completedCount / tasks.length) * 100}%` }}
        />
      </div>

      {/* Task items */}
      <div className="space-y-3">
        {sortedTasks.map((task) => {
          const completed = isTaskCompleted(task.id);
          const isVerifying = verifyingTaskId === task.id;

          return (
            <TaskItem
              key={task.id}
              task={task}
              completed={completed}
              isVerifying={isVerifying}
              onVerify={() => onVerify(task.id)}
              disabled={disabled || completed}
            />
          );
        })}
      </div>

      {allCompleted && (
        <div className="rounded-lg bg-green-500/10 p-3 text-center">
          <p className="text-sm font-medium text-green-400">
            ✓ All tasks completed! You can now mint.
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
  onVerify: () => void;
  disabled: boolean;
}

function TaskItem({ task, completed, isVerifying, onVerify, disabled }: TaskItemProps) {
  const [visited, setVisited] = useState(false);

  const handleVisit = () => {
    window.open(task.external_url, '_blank', 'noopener,noreferrer');
    setVisited(true);
  };

  return (
    <div
      className={`flex items-center gap-4 rounded-lg border-2 p-4 transition-colors ${
        completed
          ? 'border-green-500/50 bg-green-500/10'
          : 'border-white/10 bg-white/5'
      }`}
    >
      {/* Status indicator */}
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
          completed
            ? 'bg-green-500 text-white'
            : 'bg-white/10 text-[var(--color-text,#f8fafc)]/70'
        }`}
      >
        {completed ? '✓' : TASK_TYPE_ICONS[task.type]}
      </div>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-[var(--color-text,#f8fafc)]">
          {task.title}
        </h4>
        {task.description && (
          <p className="mt-0.5 text-sm text-[var(--color-text,#f8fafc)]/70 truncate">
            {task.description}
          </p>
        )}
        <span className="text-xs text-[var(--color-text,#f8fafc)]/50">
          {TASK_TYPE_LABELS[task.type]}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 items-center gap-2">
        {!completed && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleVisit}
              disabled={disabled}
            >
              Go
            </Button>
            <Button
              variant={visited ? 'primary' : 'ghost'}
              size="sm"
              onClick={onVerify}
              disabled={disabled || isVerifying}
              isLoading={isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </Button>
          </>
        )}
        {completed && (
          <span className="text-sm font-medium text-green-400">Done</span>
        )}
      </div>
    </div>
  );
}
