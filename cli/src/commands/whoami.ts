import { DittoApiError, requireAuth, whoami } from "../api-client.js";

export async function runWhoami(): Promise<void> {
  const { apiKey, baseUrl } = requireAuth();
  try {
    const me = await whoami(apiKey, baseUrl);
    process.stderr.write(`  User:     ${me.user.email}\n`);
    process.stderr.write(`  Plan:     ${me.plan}\n`);
    process.stderr.write(`  Credits:  ${me.credits}\n`);
    process.stderr.write(
      `  Free WAF extractions this month: ${me.specialExtractionFreeRemaining}\n`
    );
    process.stderr.write(`  Endpoint: ${baseUrl}\n`);
  } catch (err) {
    if (err instanceof DittoApiError) {
      console.error(`  ✗ ${err.message}`);
    } else {
      console.error(`  ✗ ${err instanceof Error ? err.message : String(err)}`);
    }
    process.exit(1);
  }
}
