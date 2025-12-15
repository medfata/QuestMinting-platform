'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Maximum duration: 60 minutes (must match server-side constant)
const MAX_DURATION_SECONDS = 3600;

interface DurationInputProps {
  value: number; // Total seconds
  onChange: (seconds: number) => void;
  label?: string;
  helperText?: string;
  className?: string;
  disabled?: boolean;
}

export function DurationInput({
  value,
  onChange,
  label,
  helperText,
  className,
  disabled = false,
}: DurationInputProps) {
  // Parse seconds into minutes and seconds only
  const parseDuration = useCallback((totalSeconds: number) => {
    const clamped = Math.min(totalSeconds, MAX_DURATION_SECONDS);
    const minutes = Math.floor(clamped / 60);
    const seconds = clamped % 60;
    return { minutes, seconds };
  }, []);

  const [duration, setDuration] = useState(() => parseDuration(value));

  // Update local state when value prop changes
  useEffect(() => {
    setDuration(parseDuration(value));
  }, [value, parseDuration]);

  // Calculate total seconds and call onChange
  const updateDuration = (field: 'minutes' | 'seconds', newValue: number) => {
    const updated = { ...duration, [field]: Math.max(0, newValue) };
    
    // Clamp values
    if (field === 'minutes') updated.minutes = Math.min(60, updated.minutes);
    if (field === 'seconds') updated.seconds = Math.min(59, updated.seconds);
    
    // If 60 minutes, force seconds to 0
    if (updated.minutes >= 60) {
      updated.minutes = 60;
      updated.seconds = 0;
    }
    
    setDuration(updated);
    
    const totalSeconds = Math.min(
      (updated.minutes * 60) + updated.seconds,
      MAX_DURATION_SECONDS
    );
    
    onChange(totalSeconds);
  };

  // Format display string
  const formatDisplay = () => {
    const parts: string[] = [];
    if (duration.minutes > 0) parts.push(`${duration.minutes}m`);
    if (duration.seconds > 0 || parts.length === 0) parts.push(`${duration.seconds}s`);
    return parts.join(' ');
  };

  const inputClass = cn(
    'w-full rounded-lg border bg-foreground/5 backdrop-blur-sm px-3 py-2 text-sm text-foreground text-center transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    'border-border hover:border-border/80 focus:border-primary focus:ring-primary/30',
    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
    disabled && 'opacity-50 cursor-not-allowed'
  );

  const labelClass = 'text-[10px] uppercase tracking-wider text-muted-foreground font-medium';

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      
      <div className="flex items-center gap-2">
        {/* Minutes */}
        <div className="flex-1 min-w-0">
          <div className={labelClass}>Minutes</div>
          <input
            type="number"
            min="0"
            max="60"
            value={duration.minutes}
            onChange={(e) => updateDuration('minutes', parseInt(e.target.value) || 0)}
            disabled={disabled}
            className={inputClass}
          />
        </div>

        <span className="text-muted-foreground mt-4">:</span>

        {/* Seconds */}
        <div className="flex-1 min-w-0">
          <div className={labelClass}>Seconds</div>
          <input
            type="number"
            min="0"
            max="59"
            value={duration.seconds}
            onChange={(e) => updateDuration('seconds', parseInt(e.target.value) || 0)}
            disabled={disabled || duration.minutes >= 60}
            className={inputClass}
          />
        </div>
      </div>

      {/* Quick presets - minutes and seconds only */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { label: '30s', seconds: 30 },
          { label: '1m', seconds: 60 },
          { label: '5m', seconds: 300 },
          { label: '15m', seconds: 900 },
          { label: '30m', seconds: 1800 },
          { label: '60m', seconds: 3600 },
        ].map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.seconds)}
            disabled={disabled}
            className={cn(
              'px-2 py-1 text-xs rounded-md transition-all duration-200',
              value === preset.seconds
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Display total */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {helperText || 'Time window for task verification'}
        </span>
        <span className="font-mono text-foreground/70">
          = {formatDisplay()} ({value.toLocaleString()}s)
        </span>
      </div>

      {/* Max duration warning */}
      <p className="text-xs text-amber-500/80">
        ⚠️ Maximum: 60 minutes. Longer durations may cause verification timeouts.
      </p>
    </div>
  );
}
