import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude problematic packages from server-side bundling
  serverExternalPackages: ['pino', 'thread-stream', 'pino-pretty'],
  
  // Empty turbopack config to silence the warning
  turbopack: {},

  // Allow images from any domain
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
