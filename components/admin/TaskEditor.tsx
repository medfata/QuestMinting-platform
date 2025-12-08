'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { QuestTaskInput } from '@/types/quest';
import type { QuestTaskType } from '@/types/database';

interface TaskEditorProps {
  tasks: QuestTaskInput[];
  onChange: (tasks: QuestTaskInput[]) => void;
}

const TASK_TYPES: { value: QuestTaskType; label: string; icon: string }[] = [
  { value: 'twitter_follow', label: 'Twitter Follow', icon: '𝕏' },
  { value: 'twitter_retweet', label: 'Twitter Retweet', icon: '🔁' },
  { value: 'telegram_join', label: 'Telegram Join', icon: '✈️' },
  { value: 'discord_join', label: 'Discord Join', icon: '💬' },
  { value: 'custom_url', label: 'Custom URL', icon: '🔗' },
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


  const getTaskTypeInfo = (type: QuestTaskType) => {
    return TASK_TYPES.find(t => t.value === type) || TASK_TYPES[4];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Quest Tasks</h3>
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
                  className="rounded p-1.5 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30 transition-all duration-200"
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
                  className="rounded p-1.5 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30 transition-all duration-200"
                  title="Move down"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => removeTask(index)}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
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
                        'w-full rounded-lg border bg-white/5 backdrop-blur-sm px-4 py-2.5 text-sm text-foreground transition-all duration-300',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        'border-white/10 hover:border-white/20 focus:border-primary focus:ring-primary/30 focus:shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]'
                      )}
                    >
                      {TASK_TYPES.map((type) => (
                        <option key={type.value} value={type.value} className="bg-zinc-900">
                          {type.icon} {type.label}
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
                      'w-full rounded-lg border bg-white/5 backdrop-blur-sm px-4 py-2.5 text-sm text-foreground transition-all duration-300',
                      'placeholder:text-muted-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-offset-0',
                      'border-white/10 hover:border-white/20 focus:border-primary focus:ring-primary/30 focus:shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]'
                    )}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-primary">
                  {getTaskTypeInfo(task.type).icon} {getTaskTypeInfo(task.type).label}
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
