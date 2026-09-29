import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "*.modal.host",
    "*.trycloudflare.com",
  ],
  // Bundle clanker-sdk for server-side (don't treat as external)
  serverExternalPackages: [],
  webpack: (config, { isServer }) => {
    // Force bundle clanker-sdk on server
    if (isServer) {
      // Don't externalize clanker-sdk
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals = config.externals.filter((external: any) => {
          if (typeof external === 'string') {
            return !external.includes('clanker-sdk');
          }
          return true;
        });
      }
    }
    
    // Fix for Clanker SDK v4 fs/promises issue
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        "fs/promises": false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        process: false,
      };
    }
    return config;
  }
};

export default nextConfig;
