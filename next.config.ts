import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Exclude scripts directory from build
    config.module.rules.push({
      test: /scripts\/.*\.ts$/,
      use: 'ignore-loader'
    });
    return config;
  },
  experimental: {
    // Exclude scripts from compilation
    externalDir: true
  }
};

export default nextConfig;
