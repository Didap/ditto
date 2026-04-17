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
  outputFileTracingIncludes: {
    "/api/extract": [
      "./node_modules/puppeteer-extra/**/*",
      "./node_modules/puppeteer-extra-plugin/**/*",
      "./node_modules/puppeteer-extra-plugin-stealth/**/*",
      "./node_modules/puppeteer-extra-plugin-user-preferences/**/*",
      "./node_modules/puppeteer-extra-plugin-user-data-dir/**/*",
      "./node_modules/merge-deep/**/*",
      "./node_modules/clone-deep/**/*",
      "./node_modules/is-plain-object/**/*",
      "./node_modules/kind-of/**/*",
      "./node_modules/shallow-clone/**/*",
      "./node_modules/for-in/**/*",
      "./node_modules/isobject/**/*",
      "./node_modules/debug/**/*",
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
