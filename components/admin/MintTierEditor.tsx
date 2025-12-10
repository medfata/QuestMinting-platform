'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { MintTierInput } from '@/types/campaign';

interface MintTierEditorProps {
  tiers: MintTierInput[];
  onChange: (tiers: MintTierInput[]) => void;
}

export function MintTierEditor({ tiers, onChange }: MintTierEditorProps) {
  const addTier = () => {
    const newTier: MintTierInput = {
      name: `Tier ${tiers.length + 1}`,
      quantity: 100,
      price: '0',
      max_per_wallet: null,
      order_index: tiers.length,
    };
    onChange([...tiers, newTier]);
  };

  const updateTier = (index: number, field: keyof MintTierInput, value: string | number | null) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeTier = (index: number) => {
    const updated = tiers.filter((_, i) => i !== index);
    // Reorder remaining tiers
    updated.forEach((tier, i) => {
      tier.order_index = i;
    });
    onChange(updated);
  };

  const moveTier = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === tiers.length - 1)
    ) {
      return;
    }

    const updated = [...tiers];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    
    // Update order indices
    updated.forEach((tier, i) => {
      tier.order_index = i;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">Mint Tiers</h3>
        <Button type="button" variant="outline" size="sm" onClick={addTier}>
          + Add Tier
        </Button>
      </div>

      {tiers.length === 0 ? (
        <Card variant="glass" padding="lg" className="text-center">
          <p className="text-muted-foreground">No tiers configured. Add at least one tier.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tiers.map((tier, index) => (
            <Card 
              key={index} 
              variant="glass" 
              padding="md" 
              className="relative transition-all duration-300 hover:border-white/20"
            >
              <div className="absolute right-3 top-3 flex gap-1">
                <button
                  type="button"
                  onClick={() => moveTier(index, 'up')}
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
                  onClick={() => moveTier(index, 'down')}
                  disabled={index === tiers.length - 1}
                  className="rounded p-1.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground disabled:opacity-30 transition-all duration-200"
                  title="Move down"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => removeTier(index)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
                  title="Remove tier"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Input
                  label="Tier Name"
                  value={tier.name}
                  onChange={(e) => updateTier(index, 'name', e.target.value)}
                  placeholder="Free Mint"
                />

                <Input
                  label="Quantity"
                  type="number"
                  min={1}
                  value={tier.quantity}
                  onChange={(e) => updateTier(index, 'quantity', parseInt(e.target.value) || 0)}
                  placeholder="100"
                />

                <Input
                  label="Price (ETH)"
                  type="number"
                  min={0}
                  step="0.001"
                  value={tier.price}
                  onChange={(e) => updateTier(index, 'price', e.target.value)}
                  placeholder="0"
                  helperText="0 for free mint"
                />

                <Input
                  label="Max per Wallet"
                  type="number"
                  min={0}
                  value={tier.max_per_wallet ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateTier(index, 'max_per_wallet', val ? parseInt(val) : null);
                  }}
                  placeholder="No limit"
                  helperText="Leave empty for unlimited"
                />
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn(
                  'rounded px-2 py-0.5 border',
                  parseFloat(tier.price) === 0 
                    ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                    : 'bg-primary/10 border-primary/20 text-primary'
                )}>
                  {parseFloat(tier.price) === 0 ? 'Free' : `${tier.price} ETH`}
                </span>
                <span>•</span>
                <span>{tier.quantity} available</span>
                {tier.max_per_wallet && (
                  <>
                    <span>•</span>
                    <span>Max {tier.max_per_wallet} per wallet</span>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
