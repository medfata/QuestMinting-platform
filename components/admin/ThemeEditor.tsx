'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { CampaignTheme } from '@/types/campaign';
import { DEFAULT_CAMPAIGN_THEME } from '@/types/theme';
import { generateSecondaryColor } from '@/lib/utils/theme';

interface ThemeEditorProps {
  theme: CampaignTheme;
  onChange: (theme: CampaignTheme) => void;
  autoSecondary?: boolean; // Enable auto-generation of secondary color
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  const [inputValue, setInputValue] = useState(value);

  const handleColorChange = (newValue: string) => {
    setInputValue(newValue);
    // Validate hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <div className="relative group">
          <input
            type="color"
            value={value}
            onChange={(e) => handleColorChange(e.target.value)}
            className={cn(
              'h-10 w-10 cursor-pointer rounded-lg border bg-transparent transition-all duration-300',
              'border-border hover:border-border/80',
              'focus:outline-none focus:ring-2 focus:ring-primary/50'
            )}
          />
          <div 
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ boxShadow: `0 0 15px ${value}40` }}
          />
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleColorChange(e.target.value)}
          onBlur={() => setInputValue(value)}
          placeholder="#000000"
          className={cn(
            'w-28 rounded-lg border bg-foreground/5 backdrop-blur-sm px-3 py-2 text-sm text-foreground transition-all duration-300',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'border-border hover:border-border/80 focus:border-primary focus:ring-primary/30'
          )}
        />
      </div>
    </div>
  );
}

export function ThemeEditor({ theme, onChange, autoSecondary = true }: ThemeEditorProps) {
  const [manualSecondary, setManualSecondary] = useState(false);

  // Auto-generate secondary color when primary changes (unless manual override is enabled)
  const handleColorChange = (field: keyof CampaignTheme, value: string) => {
    if (field === 'primary_color' && autoSecondary && !manualSecondary) {
      // Auto-generate secondary color from primary
      const newSecondary = generateSecondaryColor(value);
      onChange({ ...theme, primary_color: value, secondary_color: newSecondary });
    } else if (field === 'secondary_color') {
      // If user manually changes secondary, enable manual mode
      setManualSecondary(true);
      onChange({ ...theme, [field]: value });
    } else {
      onChange({ ...theme, [field]: value });
    }
  };

  const resetToDefaults = () => {
    setManualSecondary(false);
    onChange(DEFAULT_CAMPAIGN_THEME);
  };

  const toggleAutoSecondary = () => {
    if (manualSecondary) {
      // Switching back to auto - regenerate secondary from current primary
      const newSecondary = generateSecondaryColor(theme.primary_color);
      onChange({ ...theme, secondary_color: newSecondary });
    }
    setManualSecondary(!manualSecondary);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">Theme Colors</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resetToDefaults}
        >
          Reset to defaults
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <ColorInput
          label="Primary Color"
          value={theme.primary_color}
          onChange={(v) => handleColorChange('primary_color', v)}
        />
        <div className="space-y-2">
          <ColorInput
            label="Secondary Color"
            value={theme.secondary_color}
            onChange={(v) => handleColorChange('secondary_color', v)}
          />
          {autoSecondary && (
            <button
              type="button"
              onClick={toggleAutoSecondary}
              className={cn(
                'text-xs transition-colors',
                manualSecondary 
                  ? 'text-muted-foreground hover:text-foreground' 
                  : 'text-primary hover:text-primary/80'
              )}
            >
              {manualSecondary ? '↻ Use auto color' : '✓ Auto-generated'}
            </button>
          )}
        </div>
        <ColorInput
          label="Background Color"
          value={theme.background_color}
          onChange={(v) => handleColorChange('background_color', v)}
        />
        <ColorInput
          label="Text Color"
          value={theme.text_color}
          onChange={(v) => handleColorChange('text_color', v)}
        />
      </div>

      {/* Live Preview */}
      <Card variant="glass" padding="none" className="overflow-hidden">
        <div className="p-3 text-xs font-medium text-muted-foreground border-b border-border bg-foreground/5">
          Preview
        </div>
        <div
          className="p-6 transition-colors duration-300"
          style={{ backgroundColor: theme.background_color }}
        >
          <div className="space-y-4">
            <h4
              className="text-xl font-bold"
              style={{ color: theme.text_color }}
            >
              Title Preview
            </h4>
            <p
              className="text-sm"
              style={{ color: theme.text_color, opacity: 0.8 }}
            >
              This is how your description will look with the selected theme colors.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:opacity-90 hover:shadow-lg"
                style={{ 
                  backgroundColor: theme.primary_color,
                  boxShadow: `0 0 20px ${theme.primary_color}40`
                }}
              >
                Primary Button
              </button>
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:opacity-90 hover:shadow-lg"
                style={{ 
                  backgroundColor: theme.secondary_color,
                  boxShadow: `0 0 20px ${theme.secondary_color}40`
                }}
              >
                Secondary Button
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
