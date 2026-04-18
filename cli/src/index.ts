#!/usr/bin/env node
import { runExtract } from "./commands/extract.js";
import { runLogin } from "./commands/login.js";
import { runLogout } from "./commands/logout.js";
import { runWhoami } from "./commands/whoami.js";

const HELP = `
  ditto — extract a design system from any URL

  Usage:
    ditto <url> [--name <name>] [--out <path>] [--save]
    ditto login [--key <key>] [--base-url <url>]
    ditto logout
    ditto whoami
    ditto help

  Defaults:
    Writes ./DESIGN.md to the current directory.
    Charges 100 credits per extraction (deducted from your Ditto account).

  Options:
    --name       Custom design name (otherwise derived from the page title).
    --out        Custom output path (default: ./DESIGN.md).
    --save       Also save to your Ditto library at ditto.didap.it.
    --key        For \`login\`: set the API key non-interactively.
    --base-url   Override the API endpoint (for self-hosted Ditto).

  Environment:
    DITTO_API_KEY    Overrides the config file.
    DITTO_BASE_URL   Overrides the config file.

  Examples:
    ditto https://stripe.com
    ditto https://linear.app --name Linear --out docs/linear.md
    ditto stripe.com --save
`;

function parseFlag(argv: string[], long: string): string | undefined {
  const idx = argv.indexOf(long);
  if (idx < 0) return undefined;
  return argv[idx + 1];
}

function hasFlag(argv: string[], long: string): boolean {
  return argv.includes(long);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === "help" || argv[0] === "--help" || argv[0] === "-h") {
    process.stdout.write(HELP);
    process.exit(0);
  }

  const command = argv[0];

  if (command === "login") {
    return runLogin({
      key: parseFlag(argv, "--key"),
      baseUrl: parseFlag(argv, "--base-url"),
    });
  }

  if (command === "logout") {
    return runLogout();
  }

  if (command === "whoami") {
    return runWhoami();
  }

  // Default: treat the first arg as a URL and extract.
  // Reject obvious non-URL tokens to avoid surprising behavior.
  const url = argv[0];
  if (url.startsWith("--") || /^[a-z]+$/i.test(url) && !url.includes(".")) {
    console.error(`Unknown command: ${url}\n`);
    process.stdout.write(HELP);
    process.exit(1);
  }

  return runExtract({
    url,
    name: parseFlag(argv, "--name"),
    out: parseFlag(argv, "--out"),
    save: hasFlag(argv, "--save"),
  });
}

main().catch((err) => {
  console.error("Unexpected error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
