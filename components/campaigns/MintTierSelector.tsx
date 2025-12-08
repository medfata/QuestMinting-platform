'use client';

import { useState } from 'react';
import type { MintTier } from '@/types/campaign';
import { Button } from '@/components/ui/Button';
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
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text,#f8fafc)]">
          Select Tier
        </label>
        <div className="grid gap-2">
          {sortedTiers.map((tier) => {
            const price = BigInt(tier.price || '0');
            const isFree = price === BigInt(0);
            const isSelected = tier.id === selectedTierId;

            return (
              <button
                key={tier.id}
                onClick={() => onSelect(tier)}
                disabled={disabled}
                className={`flex items-center justify-between rounded-lg border-2 p-4 text-left transition-colors ${
                  isSelected
                    ? 'border-[var(--color-primary,#3b82f6)] bg-[var(--color-primary,#3b82f6)]/10'
                    : 'border-white/10 hover:border-white/30'
                } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <div>
                  <span className="font-medium text-[var(--color-text,#f8fafc)]">
                    {tier.name}
                  </span>
                  <div className="mt-1 text-sm text-[var(--color-text,#f8fafc)]/70">
                    {tier.quantity} available
                    {tier.max_per_wallet && ` • Max ${tier.max_per_wallet} per wallet`}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-lg font-semibold ${
                      isFree
                        ? 'text-green-400'
                        : 'text-[var(--color-primary,#3b82f6)]'
                    }`}
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
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text,#f8fafc)]">
            Quantity
          </label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuantityDecrease}
              disabled={disabled || quantity <= 1}
            >
              -
            </Button>
            <span className="min-w-[3rem] text-center text-lg font-semibold text-[var(--color-text,#f8fafc)]">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuantityIncrease}
              disabled={disabled || quantity >= maxQuantity}
            >
              +
            </Button>
            {selectedTier.max_per_wallet && (
              <span className="text-sm text-[var(--color-text,#f8fafc)]/50">
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
    <div className="rounded-lg bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[var(--color-text,#f8fafc)]/70">Total</span>
        <span
          className={`text-xl font-bold ${
            isFree ? 'text-green-400' : 'text-[var(--color-text,#f8fafc)]'
          }`}
        >
          {isFree ? 'Free' : `${formatEther(totalPrice)} ETH`}
        </span>
      </div>
      {!isFree && quantity > 1 && (
        <div className="mt-1 text-right text-sm text-[var(--color-text,#f8fafc)]/50">
          {formatEther(unitPrice)} ETH × {quantity}
        </div>
      )}
    </div>
  );
}
