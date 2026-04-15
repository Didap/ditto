import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["puppeteer", "pg"],
  outputFileTracingRoot: __dirname,
  reactCompiler: true,
};

export default nextConfig;
