import fs from "node:fs";
import path from "node:path";
import { DittoApiError, extractMarkdown, requireAuth } from "../api-client.js";

interface ExtractArgs {
  url: string;
  name?: string;
  out?: string;
  save: boolean;
}

export async function runExtract(args: ExtractArgs): Promise<void> {
  const { apiKey, baseUrl } = requireAuth();

  const fullUrl = args.url.startsWith("http") ? args.url : `https://${args.url}`;
  const outPath = path.resolve(args.out || "./DESIGN.md");

  stderr(`\n  Ditto — extracting ${fullUrl}...\n`);
  const started = Date.now();

  try {
    const result = await extractMarkdown(apiKey, baseUrl, {
      url: fullUrl,
      name: args.name,
      save: args.save,
    });

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, result.markdown);

    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    stderr(`  ✓ DESIGN.md saved to ${outPath}`);
    stderr(`  ✓ Design: ${result.name}`);
    if (result.saved) stderr(`  ✓ Saved to Ditto library (slug: ${result.slug})`);
    let charged = 100;
    if (result.specialExtractionCharged > 0) {
      charged += result.specialExtractionCharged;
      stderr(`  ℹ  Site was WAF-protected — used ScraperAPI proxy.`);
    }
    stderr(`  ℹ  Credits charged: ${charged}   (${elapsed}s)\n`);
  } catch (err) {
    if (err instanceof DittoApiError) {
      stderr(`\n  ✗ ${err.message}`);
      if (err.status === 402) {
        stderr(`  ↳ Top up credits at ${baseUrl}/pricing`);
      } else if (err.waf) {
        stderr(`  ↳ This site actively blocks proxies. Use the browser bookmarklet at ${baseUrl}/add`);
      }
      stderr("");
      process.exit(2);
    }
    stderr(`\n  ✗ ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(2);
  }
}

function stderr(msg: string): void {
  process.stderr.write(msg + "\n");
}
