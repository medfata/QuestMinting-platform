'use client';

import { useEffect } from 'react';

interface DynamicHeadProps {
  title?: string;
  favicon?: string | null;
}

/**
 * Component to dynamically update document title and favicon
 * based on platform branding settings from the admin panel.
 */
export function DynamicHead({ title, favicon }: DynamicHeadProps) {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Update favicon
    if (favicon) {
      // Find existing favicon link or create new one
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = favicon;

      // Also update apple-touch-icon if it exists
      let appleLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
      if (!appleLink) {
        appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        document.head.appendChild(appleLink);
      }
      appleLink.href = favicon;
    }
  }, [title, favicon]);

  return null;
}
