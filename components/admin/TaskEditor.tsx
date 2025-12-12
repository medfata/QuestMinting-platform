'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { QuestTaskInput } from '@/types/quest';
import type { QuestTaskType } from '@/types/database';
import type { ReactNode } from 'react';

interface TaskEditorProps {
  tasks: QuestTaskInput[];
  onChange: (tasks: QuestTaskInput[]) => void;
}

// Professional SVG icons for task types
const TaskIcons: Record<string, ReactNode> = {
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

const getTaskIcon = (type: QuestTaskType): ReactNode => {
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

const TASK_TYPES: { value: QuestTaskType; label: string }[] = [
  { value: 'twitter_follow', label: 'Follow on X' },
  { value: 'twitter_retweet', label: 'Repost on X' },
  { value: 'telegram_join', label: 'Join Telegram' },
  { value: 'discord_join', label: 'Join Discord' },
  { value: 'custom_url', label: 'Custom URL' },
];

export function TaskEditor({ tasks, onChange }: TaskEditorProps) {
  const addTask = () => {
    const newTask: QuestTaskInput = {
      type: 'custom_url',
      title: `Task ${tasks.length + 1}`,
      description: null,
      external_url: '',
      verification_data: {},
      order_index: tasks.length,
    };
    onChange([...tasks, newTask]);
  };

  const updateTask = (index: number, field: keyof QuestTaskInput, value: string | Record<string, string> | null) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeTask = (index: number) => {
    const updated = tasks.filter((_, i) => i !== index);
    updated.forEach((task, i) => {
      task.order_index = i;
    });
    onChange(updated);
  };

  const moveTask = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === tasks.length - 1)
    ) {
      return;
    }

    const updated = [...tasks];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    updated.forEach((task, i) => {
      task.order_index = i;
    });
    onChange(updated);
  };


  const getTaskTypeLabel = (type: QuestTaskType) => {
    return TASK_TYPES.find(t => t.value === type)?.label || 'Custom URL';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">Quest Tasks</h3>
        <Button type="button" variant="outline" size="sm" onClick={addTask}>
          + Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <Card variant="glass" padding="lg" className="text-center">
          <p className="text-muted-foreground">No tasks configured. Add at least one task.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <Card 
              key={index} 
              variant="glass" 
              padding="md" 
              className="relative transition-all duration-300 hover:border-white/20"
            >
              <div className="absolute right-3 top-3 flex gap-1">
                <button
                  type="button"
                  onClick={() => moveTask(index, 'up')}
                  disabled={index === 0}
                  className="rounded p-1.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground disabled:opacity-30 transition-all duration-200"
                  title="Move up"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => moveTask(index, 'down')}
                  disabled={index === tasks.length - 1}
                  className="rounded p-1.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground disabled:opacity-30 transition-all duration-200"
                  title="Move down"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => removeTask(index)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
                  title="Remove task"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="w-full">
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Task Type
                    </label>
                    <select
                      value={task.type}
                      onChange={(e) => updateTask(index, 'type', e.target.value as QuestTaskType)}
                      className={cn(
                        'w-full rounded-lg border bg-foreground/5 backdrop-blur-sm px-4 py-2.5 text-sm text-foreground transition-all duration-300',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        'border-border hover:border-border/80 focus:border-primary focus:ring-primary/30 focus:shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]'
                      )}
                    >
                      {TASK_TYPES.map((type) => (
                        <option key={type.value} value={type.value} className="bg-background text-foreground">
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Task Title"
                    value={task.title}
                    onChange={(e) => updateTask(index, 'title', e.target.value)}
                    placeholder="Follow us on Twitter"
                  />
                </div>

                <Input
                  label="External URL"
                  value={task.external_url}
                  onChange={(e) => updateTask(index, 'external_url', e.target.value)}
                  placeholder="https://twitter.com/yourproject"
                  helperText="URL users will visit to complete this task"
                />

                <div className="w-full">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Description (optional)
                  </label>
                  <textarea
                    value={task.description || ''}
                    onChange={(e) => updateTask(index, 'description', e.target.value || null)}
                    placeholder="Additional instructions for this task..."
                    rows={2}
                    className={cn(
                      'w-full rounded-lg border bg-foreground/5 backdrop-blur-sm px-4 py-2.5 text-sm text-foreground transition-all duration-300',
                      'placeholder:text-muted-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-offset-0',
                      'border-border hover:border-border/80 focus:border-primary focus:ring-primary/30 focus:shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]'
                    )}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-primary">
                  {getTaskIcon(task.type)}
                  {getTaskTypeLabel(task.type)}
                </span>
                <span>•</span>
                <span>Task {index + 1}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
