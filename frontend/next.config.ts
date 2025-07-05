import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: [
    "@crawlee/cheerio",
    "header-generator",
    "got-scraping",
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude problematic packages from server-side bundling
      config.externals = config.externals || [];
      config.externals.push(
        "header-generator",
        "got-scraping",
        "@crawlee/cheerio"
      );
    }
    return config;
  },

  outputFileTracingExcludes: {
    "*": [
      "node_modules/@crawlee/cheerio/**/*",
      "node_modules/header-generator/**/*",
      "node_modules/got-scraping/**/*",
    ],
  },
};

export default nextConfig;
