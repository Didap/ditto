import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer", "better-sqlite3"],
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
