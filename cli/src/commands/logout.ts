import { clearConfig } from "../config.js";

export async function runLogout(): Promise<void> {
  clearConfig();
  process.stderr.write("  ✓ Logged out. Config removed.\n");
}
