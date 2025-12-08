'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import type { CampaignTheme } from '@/types/campaign';
import { DEFAULT_CAMPAIGN_THEME } from '@/types/theme';

interface ThemeEditorProps {
  theme: CampaignTheme;
  onChange: (theme: CampaignTheme) => void;
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
      <label className="block text-sm font-medium text-[var(--color-text,#f8fafc)]">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => handleColorChange(e.target.value)}
            className="h-10 w-10 cursor-pointer rounded-lg border border-white/10 bg-transparent"
          />
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleColorChange(e.target.value)}
          onBlur={() => setInputValue(value)}
          placeholder="#000000"
          className="w-28 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--color-text,#f8fafc)] placeholder:text-gray-400 focus:border-[var(--color-primary,#3b82f6)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#3b82f6)]"
        />
      </div>
    </div>
  );
}

export function ThemeEditor({ theme, onChange }: ThemeEditorProps) {
  const handleColorChange = (field: keyof CampaignTheme, value: string) => {
    onChange({ ...theme, [field]: value });
  };

  const resetToDefaults = () => {
    onChange(DEFAULT_CAMPAIGN_THEME);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Theme Colors</h3>
        <button
          type="button"
          onClick={resetToDefaults}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Reset to defaults
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <ColorInput
          label="Primary Color"
          value={theme.primary_color}
          onChange={(v) => handleColorChange('primary_color', v)}
        />
        <ColorInput
          label="Secondary Color"
          value={theme.secondary_color}
          onChange={(v) => handleColorChange('secondary_color', v)}
        />
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
      <Card padding="none" className="overflow-hidden">
        <div className="p-3 text-xs font-medium text-gray-400 border-b border-white/10">
          Preview
        </div>
        <div
          className="p-6"
          style={{ backgroundColor: theme.background_color }}
        >
          <div className="space-y-4">
            <h4
              className="text-xl font-bold"
              style={{ color: theme.text_color }}
            >
              Campaign Title
            </h4>
            <p
              className="text-sm"
              style={{ color: theme.text_color, opacity: 0.8 }}
            >
              This is how your campaign description will look with the selected theme colors.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: theme.primary_color }}
              >
                Primary Button
              </button>
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: theme.secondary_color }}
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
