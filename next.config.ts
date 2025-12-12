import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude problematic packages from server-side bundling
  serverExternalPackages: ['pino', 'thread-stream', 'pino-pretty', '@walletconnect/logger'],
  
  // Turbopack config to exclude problematic paths
  turbopack: {
    resolveAlias: {
      // Stub out pino for browser builds
      'pino': { browser: 'pino/browser.js' },
    },
  },

  // Allow images from any domain
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
