import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude problematic packages from server-side bundling
  serverExternalPackages: ['pino', 'thread-stream', 'pino-pretty'],
  
  // Empty turbopack config to silence the warning
  turbopack: {},

  // Allow external images from LlamaFi for chain icons
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'icons.llamao.fi',
        pathname: '/icons/chains/**',
      },
    ],
  },
};

export default nextConfig;
