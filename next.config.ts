import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "puppeteer",
    "puppeteer-extra",
    "puppeteer-extra-plugin-stealth",
    "puppeteer-extra-plugin",
    "pg",
  ],
  outputFileTracingRoot: __dirname,
  reactCompiler: true,
};

export default nextConfig;
