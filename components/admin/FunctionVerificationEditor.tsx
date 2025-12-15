'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface VerificationFunction {
  signature: string;
  label: string;
}

export type VerificationLogic = 'AND' | 'OR';

interface FunctionVerificationEditorProps {
  functions: VerificationFunction[];
  logic: VerificationLogic;
  onFunctionsChange: (functions: VerificationFunction[]) => void;
  onLogicChange: (logic: VerificationLogic) => void;
}

// Compute function selector from signature (client-side preview)
function computeSelectorPreview(signature: string): string {
  if (!signature || !signature.includes('(')) return '';
  try {
    // Simple validation - must have format: name(params)
    const match = signature.match(/^[a-zA-Z_][a-zA-Z0-9_]*\([^)]*\)$/);
    if (!match) return 'Invalid format';
    return '0x' + '••••'; // Placeholder - actual computation happens server-side
  } catch {
    return 'Invalid';
  }
}

// Validate function signature format
function validateSignature(signature: string): string | null {
  if (!signature) return 'Function signature is required';
  
  // Basic format: functionName(type1,type2,...)
  const pattern = /^[a-zA-Z_][a-zA-Z0-9_]*\([a-zA-Z0-9,\[\]_\s]*\)$/;
  if (!pattern.test(signature.replace(/\s/g, ''))) {
    return 'Invalid format. Example: transfer(address,uint256)';
  }
  
  return null;
}

export function FunctionVerificationEditor({
  functions,
  logic,
  onFunctionsChange,
  onLogicChange,
}: FunctionVerificationEditorProps) {
  const [errors, setErrors] = useState<Record<number, string>>({});

  const addFunction = () => {
    onFunctionsChange([...functions, { signature: '', label: '' }]);
  };

  const updateFunction = (index: number, field: keyof VerificationFunction, value: string) => {
    const updated = [...functions];
    updated[index] = { ...updated[index], [field]: value };
    onFunctionsChange(updated);

    // Validate on change
    if (field === 'signature') {
      const error = validateSignature(value);
      setErrors((prev) => {
        const next = { ...prev };
        if (error) {
          next[index] = error;
        } else {
          delete next[index];
        }
        return next;
      });
    }
  };

  const removeFunction = (index: number) => {
    if (functions.length <= 1) return; // Keep at least one
    const updated = functions.filter((_, i) => i !== index);
    onFunctionsChange(updated);
    
    // Clean up errors
    setErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  // Ensure at least one function exists
  useEffect(() => {
    if (functions.length === 0) {
      onFunctionsChange([{ signature: '', label: '' }]);
    }
  }, [functions.length, onFunctionsChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">Verification Functions</h3>
      </div>

      {/* Logic Toggle */}
      <Card variant="glass" padding="md">
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-foreground">
            Verification Logic
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="verification-logic"
                value="OR"
                checked={logic === 'OR'}
                onChange={() => onLogicChange('OR')}
                className="w-4 h-4 text-primary border-border bg-foreground/5 focus:ring-primary/30"
              />
              <span className={cn(
                "text-sm transition-colors",
                logic === 'OR' ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
              )}>
                ANY function (OR)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="verification-logic"
                value="AND"
                checked={logic === 'AND'}
                onChange={() => onLogicChange('AND')}
                className="w-4 h-4 text-primary border-border bg-foreground/5 focus:ring-primary/30"
              />
              <span className={cn(
                "text-sm transition-colors",
                logic === 'AND' ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
              )}>
                ALL functions (AND)
              </span>
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            {logic === 'OR' 
              ? 'User must call at least one of the functions below to complete the quest.'
              : 'User must call ALL of the functions below to complete the quest.'}
          </p>
        </div>
      </Card>

      {/* Functions List */}
      <div className="space-y-3">
        {functions.map((fn, index) => (
          <Card 
            key={index} 
            variant="glass" 
            padding="md" 
            className="relative transition-all duration-300 hover:border-white/20"
          >
            {/* Remove button */}
            {functions.length > 1 && (
              <button
                type="button"
                onClick={() => removeFunction(index)}
                className="absolute right-3 top-3 rounded p-1.5 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
                title="Remove function"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}

            <div className="space-y-4 pr-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Label (optional)"
                  value={fn.label}
                  onChange={(e) => updateFunction(index, 'label', e.target.value)}
                  placeholder="e.g., Say GM"
                  helperText="Friendly name for this action"
                />
                <div>
                  <Input
                    label="Function Signature"
                    value={fn.signature}
                    onChange={(e) => updateFunction(index, 'signature', e.target.value)}
                    placeholder="e.g., gm() or mint(uint256)"
                    error={errors[index]}
                  />
                  {fn.signature && !errors[index] && (
                    <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                      Valid signature format
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                Function {index + 1}
              </span>
              {index < functions.length - 1 && (
                <>
                  <span>•</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-medium",
                    logic === 'OR' 
                      ? "bg-blue-500/20 text-blue-400" 
                      : "bg-amber-500/20 text-amber-400"
                  )}>
                    {logic}
                  </span>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Add Function Button */}
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        onClick={addFunction}
        className="w-full"
      >
        + Add Function
      </Button>

      {/* Help Text */}
      <div className="rounded-lg border border-border/50 bg-foreground/5 p-3">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Examples:</strong>
        </p>
        <ul className="mt-1 text-xs text-muted-foreground space-y-0.5">
          <li>• <code className="bg-foreground/10 px-1 rounded">gm()</code> - No parameters</li>
          <li>• <code className="bg-foreground/10 px-1 rounded">mint(uint256)</code> - Single parameter</li>
          <li>• <code className="bg-foreground/10 px-1 rounded">transfer(address,uint256)</code> - Multiple parameters</li>
          <li>• <code className="bg-foreground/10 px-1 rounded">swap(uint256,uint256,address[])</code> - With array</li>
        </ul>
      </div>
    </div>
  );
}
