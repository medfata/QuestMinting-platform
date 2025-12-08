'use client';

import type { MintTier } from '@/types/campaign';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { formatEther } from 'viem';

export interface MintTierSelectorProps {
  tiers: MintTier[];
  selectedTierId: string | null;
  onSelect: (tier: MintTier) => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
  className?: string;
}

export function MintTierSelector({
  tiers,
  selectedTierId,
  onSelect,
  quantity,
  onQuantityChange,
  disabled = false,
  className = '',
}: MintTierSelectorProps) {
  const sortedTiers = [...tiers].sort((a, b) => a.order_index - b.order_index);
  const selectedTier = tiers.find((t) => t.id === selectedTierId);

  const maxQuantity = selectedTier?.max_per_wallet ?? 10;

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleQuantityIncrease = () => {
    if (quantity < maxQuantity) {
      onQuantityChange(quantity + 1);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Select Tier
        </label>
        <div className="grid gap-3">
          {sortedTiers.map((tier, index) => {
            const price = BigInt(tier.price || '0');
            const isFree = price === BigInt(0);
            const isSelected = tier.id === selectedTierId;

            return (
              <button
                key={tier.id}
                onClick={() => onSelect(tier)}
                disabled={disabled}
                className={cn(
                  'group relative flex items-center justify-between rounded-xl border-2 p-4 text-left transition-all duration-300',
                  'motion-safe:animate-fade-in',
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-[0_0_25px_rgba(var(--primary-rgb),0.3)]'
                    : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10',
                  disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Selection indicator glow */}
                {isSelected && (
                  <div className="absolute inset-0 rounded-xl bg-primary/5 motion-safe:animate-pulse-glow" />
                )}
                
                {/* Radio indicator */}
                <div className="relative mr-4 flex-shrink-0">
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full border-2 transition-all duration-300',
                      isSelected
                        ? 'border-primary bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]'
                        : 'border-white/30 bg-transparent group-hover:border-white/50'
                    )}
                  >
                    {isSelected && (
                      <div className="absolute inset-1 rounded-full bg-white motion-safe:animate-scale-in" />
                    )}
                  </div>
                </div>

                <div className="relative flex-1">
                  <span className={cn(
                    'font-medium transition-colors duration-300',
                    isSelected ? 'text-primary' : 'text-foreground'
                  )}>
                    {tier.name}
                  </span>
                  <div className="mt-1 text-sm text-foreground/60">
                    {tier.quantity} available
                    {tier.max_per_wallet && ` • Max ${tier.max_per_wallet} per wallet`}
                  </div>
                </div>

                <div className="relative text-right">
                  <span
                    className={cn(
                      'text-lg font-semibold transition-all duration-300',
                      isFree
                        ? 'text-green-400'
                        : isSelected
                          ? 'text-primary'
                          : 'text-foreground/80'
                    )}
                  >
                    {isFree ? 'Free' : `${formatEther(price)} ETH`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedTier && (
        <div className="space-y-2 motion-safe:animate-fade-in">
          <label className="text-sm font-medium text-foreground">
            Quantity
          </label>
          <div className="flex items-center gap-3">
            <Button
              variant="glass"
              size="sm"
              onClick={handleQuantityDecrease}
              disabled={disabled || quantity <= 1}
              className="h-10 w-10 p-0"
            >
              -
            </Button>
            <div className="relative">
              <span className="min-w-[3rem] text-center text-xl font-bold text-foreground inline-block">
                {quantity}
              </span>
            </div>
            <Button
              variant="glass"
              size="sm"
              onClick={handleQuantityIncrease}
              disabled={disabled || quantity >= maxQuantity}
              className="h-10 w-10 p-0"
            >
              +
            </Button>
            {selectedTier.max_per_wallet && (
              <span className="text-sm text-foreground/50">
                Max {selectedTier.max_per_wallet}
              </span>
            )}
          </div>
        </div>
      )}

      {selectedTier && (
        <TotalPrice tier={selectedTier} quantity={quantity} />
      )}
    </div>
  );
}

interface TotalPriceProps {
  tier: MintTier;
  quantity: number;
}

function TotalPrice({ tier, quantity }: TotalPriceProps) {
  const unitPrice = BigInt(tier.price || '0');
  const totalPrice = unitPrice * BigInt(quantity);
  const isFree = totalPrice === BigInt(0);

  return (
    <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 motion-safe:animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-foreground/70">Total</span>
        <span
          className={cn(
            'text-2xl font-bold transition-colors duration-300',
            isFree ? 'text-green-400' : 'text-foreground'
          )}
        >
          {isFree ? 'Free' : `${formatEther(totalPrice)} ETH`}
        </span>
      </div>
      {!isFree && quantity > 1 && (
        <div className="mt-1 text-right text-sm text-foreground/50">
          {formatEther(unitPrice)} ETH × {quantity}
        </div>
      )}
    </div>
  );
}
