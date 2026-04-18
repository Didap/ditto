import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CONFIG_DIR = path.join(os.homedir(), ".ditto");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export const DEFAULT_BASE_URL = "https://ditto.didap.it";

export interface Config {
  apiKey?: string;
  baseUrl?: string;
}

export function readConfig(): Config {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as Config;
  } catch {
    return {};
  }
}

export function writeConfig(cfg: Config): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), { mode: 0o600 });
}

export function clearConfig(): void {
  try {
    fs.unlinkSync(CONFIG_FILE);
  } catch {
    // nothing to clear
  }
}

/**
 * Resolve the effective API key and base URL, preferring env vars over the
 * config file. Env: `DITTO_API_KEY` and `DITTO_BASE_URL`.
 */
export function resolveAuth(): { apiKey: string | undefined; baseUrl: string } {
  const cfg = readConfig();
  const apiKey = process.env.DITTO_API_KEY?.trim() || cfg.apiKey;
  const baseUrl =
    process.env.DITTO_BASE_URL?.trim() || cfg.baseUrl || DEFAULT_BASE_URL;
  return { apiKey, baseUrl };
}
