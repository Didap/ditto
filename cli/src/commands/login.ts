import readline from "node:readline";
import { readConfig, writeConfig, DEFAULT_BASE_URL } from "../config.js";
import { whoami, DittoApiError } from "../api-client.js";

interface LoginArgs {
  key?: string;
  baseUrl?: string;
}

export async function runLogin(args: LoginArgs): Promise<void> {
  const existing = readConfig();
  const baseUrl = args.baseUrl || existing.baseUrl || DEFAULT_BASE_URL;

  let apiKey = args.key;
  if (!apiKey) {
    apiKey = await promptSecret(
      `Paste your API key from ${baseUrl}/settings/api-keys: `
    );
  }

  if (!apiKey || !apiKey.startsWith("ditto_")) {
    console.error("Error: keys must start with `ditto_`.");
    process.exit(1);
  }

  process.stderr.write("  Verifying key...\n");
  try {
    const me = await whoami(apiKey, baseUrl);
    writeConfig({ apiKey, baseUrl });
    process.stderr.write(
      `  ✓ Logged in as ${me.user.email} — ${me.credits} credits available.\n`
    );
  } catch (err) {
    if (err instanceof DittoApiError) {
      console.error(`  ✗ ${err.message}`);
    } else {
      console.error(`  ✗ ${err instanceof Error ? err.message : String(err)}`);
    }
    process.exit(1);
  }
}

function promptSecret(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}
