'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThemeEditor } from '@/components/admin/ThemeEditor';
import type { GlobalTheme } from '@/types/theme';
import type { CampaignTheme } from '@/types/campaign';
import { DEFAULT_GLOBAL_THEME } from '@/types/theme';

export default function GlobalThemeSettingsPage() {
  const [theme, setTheme] = useState<GlobalTheme>(DEFAULT_GLOBAL_THEME);
  const [configId, setConfigId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('mint_platform_home_config')
        .select('id, theme')
        .limit(1)
        .single();

      if (data && !error) {
        setConfigId(data.id);
        setTheme({
          ...DEFAULT_GLOBAL_THEME,
          ...(data.theme as Partial<GlobalTheme>),
        });
      }
      setIsLoading(false);
    };

    fetchConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    const supabase = createClient();
    const payload = {
      theme,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (configId) {
      const result = await supabase
        .from('mint_platform_home_config')
        .update(payload)
        .eq('id', configId);
      error = result.error;
    } else {
      const result = await supabase
        .from('mint_platform_home_config')
        .insert({
          hero_title: 'Welcome',
          theme,
        })
        .select()
        .single();
      error = result.error;
      if (result.data) {
        setConfigId(result.data.id);
      }
    }

    if (error) {
      setSaveMessage({ type: 'error', text: `Failed to save: ${error.message}` });
    } else {
      setSaveMessage({ type: 'success', text: 'Global theme saved successfully!' });
    }

    setIsSaving(false);
  };

  const handleThemeChange = (campaignTheme: CampaignTheme) => {
    setTheme((prev) => ({
      ...prev,
      ...campaignTheme,
    }));
  };

  const handleFontChange = (field: 'heading_font' | 'body_font', value: string) => {
    setTheme((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetToDefaults = () => {
    setTheme(DEFAULT_GLOBAL_THEME);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Global Theme</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure the default colors and typography for your platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            Save Theme
          </Button>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`rounded-lg p-4 ${
            saveMessage.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Typography Section */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Heading Font
              </label>
              <select
                value={theme.heading_font}
                onChange={(e) => handleFontChange('heading_font', e.target.value)}
                className="w-full rounded-lg border border-border bg-foreground/5 px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              >
                <option value="Inter" className="bg-background text-foreground">Inter</option>
                <option value="Roboto" className="bg-background text-foreground">Roboto</option>
                <option value="Open Sans" className="bg-background text-foreground">Open Sans</option>
                <option value="Poppins" className="bg-background text-foreground">Poppins</option>
                <option value="Montserrat" className="bg-background text-foreground">Montserrat</option>
                <option value="Playfair Display" className="bg-background text-foreground">Playfair Display</option>
              </select>
            </div>
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Body Font
              </label>
              <select
                value={theme.body_font}
                onChange={(e) => handleFontChange('body_font', e.target.value)}
                className="w-full rounded-lg border border-border bg-foreground/5 px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              >
                <option value="Inter" className="bg-background text-foreground">Inter</option>
                <option value="Roboto" className="bg-background text-foreground">Roboto</option>
                <option value="Open Sans" className="bg-background text-foreground">Open Sans</option>
                <option value="Lato" className="bg-background text-foreground">Lato</option>
                <option value="Source Sans Pro" className="bg-background text-foreground">Source Sans Pro</option>
                <option value="Nunito" className="bg-background text-foreground">Nunito</option>
              </select>
            </div>
          </div>
          {/* Font Preview */}
          <div className="rounded-lg border border-border bg-foreground/5 p-4">
            <p className="text-xs text-muted-foreground mb-3">Preview</p>
            <h3
              className="text-xl font-bold text-foreground mb-2"
              style={{ fontFamily: theme.heading_font }}
            >
              Heading Text Preview
            </h3>
            <p
              className="text-muted-foreground"
              style={{ fontFamily: theme.body_font }}
            >
              This is how your body text will appear with the selected font family.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Colors Section */}
      <Card>
        <CardHeader>
          <CardTitle>Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeEditor theme={theme} onChange={handleThemeChange} />
        </CardContent>
      </Card>

      {/* Full Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Full Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div
            className="p-8"
            style={{
              backgroundColor: theme.background_color,
              fontFamily: theme.body_font,
            }}
          >
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h1
                className="text-4xl font-bold"
                style={{ color: theme.text_color, fontFamily: theme.heading_font }}
              >
                Welcome to Our Platform
              </h1>
              <p
                className="text-lg"
                style={{ color: theme.text_color, opacity: 0.8 }}
              >
                Discover amazing NFT collections and complete quests to earn exclusive rewards.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  className="rounded-lg px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: theme.primary_color }}
                >
                  Get Started
                </button>
                <button
                  type="button"
                  className="rounded-lg px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: theme.secondary_color }}
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation hint */}
      <div className="rounded-lg border border-border bg-foreground/5 p-4">
        <p className="text-sm text-muted-foreground">
          Looking to customize hero content and featured campaigns?{' '}
          <Link href="/admin/home" className="text-primary hover:underline">
            Go to Home Page Settings →
          </Link>
        </p>
      </div>

      {/* Save Button (bottom) */}
      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={isSaving}>
          Save Theme
        </Button>
      </div>
    </div>
  );
}
