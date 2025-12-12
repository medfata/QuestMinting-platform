'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemeEditor } from '@/components/admin/ThemeEditor';
import { CarouselEditor } from '@/components/admin/CarouselEditor';
import type { HomePageConfig, GlobalTheme } from '@/types/theme';
import type { CampaignTheme } from '@/types/campaign';
import { DEFAULT_GLOBAL_THEME } from '@/types/theme';

interface HomePageFormData {
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  theme: GlobalTheme;
  featured_campaigns: string[];
  platform_name: string;
  platform_icon: string;
}

const DEFAULT_FORM_DATA: HomePageFormData = {
  hero_title: 'Welcome to Our Platform',
  hero_subtitle: 'Discover amazing NFT collections',
  hero_description: 'Explore MintFun campaigns and complete Quests to earn exclusive NFTs.',
  theme: DEFAULT_GLOBAL_THEME,
  featured_campaigns: [],
  platform_name: 'MintPlatform',
  platform_icon: '',
};

export default function HomePageSettingsPage() {
  const [formData, setFormData] = useState<HomePageFormData>(DEFAULT_FORM_DATA);
  const [configId, setConfigId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('mint_platform_home_config')
        .select('*')
        .limit(1)
        .single();

      if (data && !error) {
        setConfigId(data.id);
        setFormData({
          hero_title: data.hero_title || DEFAULT_FORM_DATA.hero_title,
          hero_subtitle: data.hero_subtitle || '',
          hero_description: data.hero_description || '',
          theme: {
            ...DEFAULT_GLOBAL_THEME,
            ...(data.theme as Partial<GlobalTheme>),
          },
          featured_campaigns: data.featured_campaigns || [],
          platform_name: data.platform_name || DEFAULT_FORM_DATA.platform_name,
          platform_icon: data.platform_icon || '',
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
      hero_title: formData.hero_title,
      hero_subtitle: formData.hero_subtitle || null,
      hero_description: formData.hero_description || null,
      theme: formData.theme,
      featured_campaigns: formData.featured_campaigns,
      platform_name: formData.platform_name,
      platform_icon: formData.platform_icon || null,
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
        .insert(payload)
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
      setSaveMessage({ type: 'success', text: 'Home page settings saved successfully!' });
    }

    setIsSaving(false);
  };

  const handleThemeChange = (theme: CampaignTheme) => {
    setFormData((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        ...theme,
      },
    }));
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
          <h1 className="text-2xl font-bold text-foreground">Home Page Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customize the hero content and featured campaigns carousel
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" target="_blank">
            <Button variant="ghost">Preview Site</Button>
          </Link>
          <Button onClick={handleSave} isLoading={isSaving}>
            Save Changes
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

      {/* Platform Branding Section */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Configure the platform name and icon that appears in the header, footer, browser tab, and favicon.
          </p>
          <Input
            label="Platform Name"
            value={formData.platform_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, platform_name: e.target.value }))}
            placeholder="MintPlatform"
          />
          <Input
            label="Platform Icon URL"
            value={formData.platform_icon}
            onChange={(e) => setFormData((prev) => ({ ...prev, platform_icon: e.target.value }))}
            placeholder="https://example.com/icon.png"
          />
          {formData.platform_icon && (
            <div className="rounded-lg border border-border bg-foreground/5 p-4">
              <p className="text-xs text-muted-foreground mb-3">Icon Preview</p>
              <div className="flex items-center gap-4">
                {/* Header preview */}
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-border">
                    <img
                      src={formData.platform_icon}
                      alt="Platform icon"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="font-semibold text-foreground">{formData.platform_name}</span>
                </div>
                {/* Favicon preview */}
                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
                  <div className="relative w-4 h-4 rounded overflow-hidden">
                    <img
                      src={formData.platform_icon}
                      alt="Favicon preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">Favicon</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hero Content Section */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Hero Title"
            value={formData.hero_title}
            onChange={(e) => setFormData((prev) => ({ ...prev, hero_title: e.target.value }))}
            placeholder="Welcome to Our Platform"
          />
          <Input
            label="Hero Subtitle"
            value={formData.hero_subtitle}
            onChange={(e) => setFormData((prev) => ({ ...prev, hero_subtitle: e.target.value }))}
            placeholder="Discover amazing NFT collections"
          />
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Hero Description
            </label>
            <textarea
              value={formData.hero_description}
              onChange={(e) => setFormData((prev) => ({ ...prev, hero_description: e.target.value }))}
              placeholder="Describe your platform..."
              rows={3}
              className="w-full rounded-lg border border-border bg-foreground/5 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            />
          </div>
        </CardContent>
      </Card>

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
                value={formData.theme.heading_font}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    theme: { ...prev.theme, heading_font: e.target.value },
                  }))
                }
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
                value={formData.theme.body_font}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    theme: { ...prev.theme, body_font: e.target.value },
                  }))
                }
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
              style={{ fontFamily: formData.theme.heading_font }}
            >
              Heading Text Preview
            </h3>
            <p
              className="text-muted-foreground"
              style={{ fontFamily: formData.theme.body_font }}
            >
              This is how your body text will appear with the selected font family.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Theme Colors Section */}
      <Card>
        <CardHeader>
          <CardTitle>Global Theme Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeEditor theme={formData.theme} onChange={handleThemeChange} />
        </CardContent>
      </Card>

      {/* Featured Campaigns Section */}
      <Card>
        <CardHeader>
          <CardTitle>Featured Campaigns Carousel</CardTitle>
        </CardHeader>
        <CardContent>
          <CarouselEditor
            selectedCampaigns={formData.featured_campaigns}
            onChange={(campaigns) =>
              setFormData((prev) => ({ ...prev, featured_campaigns: campaigns }))
            }
          />
        </CardContent>
      </Card>

      {/* Save Button (bottom) */}
      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={isSaving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
