#!/usr/bin/env node

import { extractDesign } from "../src/lib/extractor";
import { generateDesignMd } from "../src/lib/generator/design-md";
import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
  console.log(`
  Ditto — Design System Extractor CLI

  Usage:
    ditto extract <url> [--name <name>] [--out <path>]
    ditto help

  Commands:
    extract    Extract a design system from a URL
    help       Show this help message

  Options:
    --name     Name for the design (default: derived from URL)
    --out      Output path (default: ./DESIGN.md)

  Examples:
    ditto extract https://stripe.com
    ditto extract https://vercel.com --name Vercel --out ./docs/DESIGN.md
`);
}

async function main() {
  if (!command || command === "help" || command === "--help") {
    printHelp();
    process.exit(0);
  }

  if (command === "extract") {
    const url = args[1];
    if (!url) {
      console.error("Error: URL is required");
      console.error("Usage: ditto extract <url>");
      process.exit(1);
    }

    const fullUrl = url.startsWith("http") ? url : `https://${url}`;

    const nameIdx = args.indexOf("--name");
    const outIdx = args.indexOf("--out");

    const name =
      nameIdx >= 0 ? args[nameIdx + 1] : new URL(fullUrl).hostname.replace("www.", "").split(".")[0];
    const outPath =
      outIdx >= 0 ? args[outIdx + 1] : "./DESIGN.md";

    console.log(`\n  Ditto — Extracting design from ${fullUrl}...\n`);

    try {
      console.log("  → Launching browser...");
      const { tokens, resolved } = await extractDesign(fullUrl);

      console.log(`  → Found ${tokens.colors.length} colors`);
      console.log(`  → Found ${tokens.typography.length} font families`);
      console.log(`  → Found ${tokens.shadows.length} shadows`);
      console.log(`  → Found ${tokens.radii.length} border radii`);

      console.log("  → Generating DESIGN.md...");
      const designMd = generateDesignMd(name, tokens, resolved);

      const resolvedOut = path.resolve(outPath);
      fs.mkdirSync(path.dirname(resolvedOut), { recursive: true });
      fs.writeFileSync(resolvedOut, designMd);

      console.log(`\n  ✓ DESIGN.md saved to ${resolvedOut}\n`);
      console.log(`  Colors:     ${tokens.colors.length}`);
      console.log(`  Fonts:      ${tokens.typography.map((t) => t.fontFamily).join(", ")}`);
      console.log(`  Primary:    ${resolved.colorPrimary}`);
      console.log(`  Background: ${resolved.colorBackground}`);
      console.log("");
    } catch (error) {
      console.error(
        "\n  ✗ Extraction failed:",
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    } finally {
      const { closeBrowser } = await import("../src/lib/extractor/browser");
      await closeBrowser();
      process.exit(0);
    }
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(1);
}

main();
