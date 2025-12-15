'use client';

import { cn } from '@/lib/utils';

// Maximum duration: 1 hour (must match server-side constant)
export const MAX_DURATION_SECONDS = 3600;

// Preset duration options (minutes and seconds only)
const DURATION_PRESETS = [
  { label: '30 sec', value: 30 },
  { label: '1 min', value: 60 },
  { label: '5 min', value: 300 },
  { label: '15 min', value: 900 },
  { label: '30 min', value: 1800 },
  { label: '60 min', value: 3600 },
] as const;

interface DurationSelectorProps {
  value: number;
  onChange: (seconds: number) => void;
  chainId?: number;
}

// Get estimated blocks for a chain
function getEstimatedBlocks(chainId: number, durationSeconds: number): number {
  const blockTimes: Record<number, number> = {
    1: 12,       // Ethereum
    10: 2,       // Optimism
    56: 3,       // BSC
    137: 2,      // Polygon
    250: 1,      // Fantom
    324: 1,      // zkSync
    8453: 2,     // Base
    42161: 0.25, // Arbitrum
    43114: 2,    // Avalanche
    59144: 2,    // Linea
    534352: 3,   // Scroll
    81457: 2,    // Blast
    5000: 2,     // Mantle
    34443: 2,    // Mode
    7777777: 2,  // Zora
    57073: 2,    // Ink
  };
  const blockTime = blockTimes[chainId] || 2;
  return Math.ceil(durationSeconds / blockTime);
}

export function DurationSelector({ value, onChange, chainId }: DurationSelectorProps) {
  const estimatedBlocks = chainId ? getEstimatedBlocks(chainId, value) : null;

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minutes = parseInt(e.target.value, 10);
    if (!isNaN(minutes)) {
      const seconds = Math.min(minutes * 60, MAX_DURATION_SECONDS);
      onChange(seconds);
    }
  };

  const currentMinutes = Math.round(value / 60);
  const isCustom = !DURATION_PRESETS.some((p) => p.value === value);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">
        Verification Window
      </label>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {DURATION_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg border transition-all duration-200',
              value === preset.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-foreground/5 border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Or custom:</span>
        <input
          type="number"
          min={1}
          max={60}
          value={currentMinutes}
          onChange={handleCustomChange}
          className={cn(
            'w-20 rounded-lg border bg-foreground/5 px-3 py-1.5 text-sm text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            'border-border'
          )}
        />
        <span className="text-sm text-muted-foreground">minutes</span>
      </div>

      {/* Info text */}
      <div className="rounded-lg border border-border/50 bg-foreground/5 p-3 space-y-1">
        <p className="text-xs text-muted-foreground">
          Users must complete the on-chain action within this time window before verifying.
        </p>
        {estimatedBlocks && (
          <p className="text-xs text-muted-foreground">
            ≈ <span className="text-foreground font-medium">{estimatedBlocks.toLocaleString()}</span> blocks will be scanned on the selected chain.
          </p>
        )}
        <p className="text-xs text-amber-500/80">
          ⚠️ Maximum: 60 minutes. Longer durations may cause verification timeouts.
        </p>
      </div>
    </div>
  );
}
