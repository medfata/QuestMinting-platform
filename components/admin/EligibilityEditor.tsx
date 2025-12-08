'use client';

import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { EligibilityConditionInput } from '@/types/quest';
import type { EligibilityType } from '@/types/database';

interface EligibilityEditorProps {
  eligibility: EligibilityConditionInput | null;
  onChange: (eligibility: EligibilityConditionInput | null) => void;
}

const ELIGIBILITY_TYPES: { value: EligibilityType; label: string; description: string }[] = [
  { value: 'nft', label: 'NFT Holdings', description: 'Require users to hold a minimum number of NFTs' },
  { value: 'token', label: 'Token Holdings', description: 'Require users to hold a minimum token balance' },
];

export function EligibilityEditor({ eligibility, onChange }: EligibilityEditorProps) {
  const isEnabled = eligibility !== null;

  const handleToggle = () => {
    if (isEnabled) {
      onChange(null);
    } else {
      onChange({
        type: 'nft',
        min_amount: '1',
        contract_address: null,
      });
    }
  };

  const handleTypeChange = (type: EligibilityType) => {
    if (!eligibility) return;
    onChange({
      ...eligibility,
      type,
      min_amount: type === 'nft' ? '1' : '0',
    });
  };

  const handleFieldChange = (field: keyof EligibilityConditionInput, value: string | null) => {
    if (!eligibility) return;
    onChange({ ...eligibility, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">Eligibility Conditions</h3>
          <p className="text-sm text-muted-foreground">Optional requirements users must meet to participate</p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleToggle}
            className="peer sr-only"
          />
          <div className={cn(
            'peer h-6 w-11 rounded-full bg-white/10 transition-all duration-300',
            'after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[\'\']',
            'peer-checked:bg-primary peer-checked:shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] peer-checked:after:translate-x-full',
            'peer-focus:ring-2 peer-focus:ring-primary/50'
          )} />
        </label>
      </div>

      {isEnabled && eligibility && (
        <Card variant="glass" padding="md" className="space-y-4">
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Condition Type
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {ELIGIBILITY_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeChange(type.value)}
                  className={cn(
                    'rounded-lg border p-4 text-left transition-all duration-300',
                    eligibility.type === type.value
                      ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                  )}
                >
                  <div className="font-medium text-white">{type.label}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={eligibility.type === 'nft' ? 'Minimum NFT Count' : 'Minimum Token Amount'}
              type="number"
              min={eligibility.type === 'nft' ? 1 : 0}
              step={eligibility.type === 'nft' ? 1 : 'any'}
              value={eligibility.min_amount}
              onChange={(e) => handleFieldChange('min_amount', e.target.value)}
              placeholder={eligibility.type === 'nft' ? '1' : '100'}
              helperText={
                eligibility.type === 'nft'
                  ? 'Number of NFTs required'
                  : 'Token amount in smallest unit (wei)'
              }
            />

            <Input
              label="Contract Address (optional)"
              value={eligibility.contract_address || ''}
              onChange={(e) => handleFieldChange('contract_address', e.target.value || null)}
              placeholder="0x..."
              helperText={
                eligibility.type === 'nft'
                  ? 'Specific collection address, or leave empty for any NFT'
                  : 'Specific token address, or leave empty for native token'
              }
            />
          </div>

          <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-sm text-muted-foreground">
            <span className="font-medium text-white">Preview: </span>
            {eligibility.type === 'nft' ? (
              <>
                Users must hold at least {eligibility.min_amount} NFT{parseInt(eligibility.min_amount) !== 1 ? 's' : ''}
                {eligibility.contract_address ? ` from collection ${eligibility.contract_address.slice(0, 6)}...${eligibility.contract_address.slice(-4)}` : ' (any collection)'}
              </>
            ) : (
              <>
                Users must hold at least {eligibility.min_amount} tokens
                {eligibility.contract_address ? ` of ${eligibility.contract_address.slice(0, 6)}...${eligibility.contract_address.slice(-4)}` : ' (native token)'}
              </>
            )}
          </div>
        </Card>
      )}

      {!isEnabled && (
        <Card variant="glass" padding="md" className="text-center">
          <p className="text-muted-foreground">No eligibility conditions. Anyone can participate in this quest.</p>
        </Card>
      )}
    </div>
  );
}
