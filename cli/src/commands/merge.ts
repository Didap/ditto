import fs from "node:fs";
import path from "node:path";
import { DittoApiError, requireAuth } from "../api-client.js";

interface MergeArgs {
  urls: string[];
  weights?: number[];
  name?: string;
  out?: string;
  save: boolean;
}

export async function runMerge(args: MergeArgs): Promise<void> {
  const { apiKey, baseUrl } = requireAuth();

  if (args.urls.length < 2) {
    console.error("Error: merge needs at least 2 URLs.");
    console.error("Usage: ditto merge <url1> <url2> [url3 ...]");
    process.exit(1);
  }
  if (args.urls.length > 10) {
    console.error("Error: maximum 10 URLs per merge.");
    process.exit(1);
  }

  const fullUrls = args.urls.map((u) =>
    u.startsWith("http") ? u : `https://${u}`
  );
  const outPath = path.resolve(args.out || "./DESIGN.md");

  const perExtract = 100;
  const mixCost = 300;
  const totalCost = args.urls.length * perExtract + mixCost;

  stderr(
    `\n  Ditto — merging ${args.urls.length} designs (${fullUrls.join(", ")})...`
  );
  stderr(`  Cost: ${args.urls.length}×${perExtract} + ${mixCost} = ${totalCost} credits.\n`);

  const started = Date.now();
  const qs = args.save ? "?save=true" : "";

  try {
    const res = await fetch(`${baseUrl}/api/inspire/md${qs}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        urls: fullUrls,
        weights: args.weights,
        name: args.name,
      }),
    });

    if (!res.ok) {
      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        body = { error: await res.text() };
      }
      const errMsg = (body as { error?: string })?.error || `HTTP ${res.status}`;
      const waf = Boolean((body as { waf?: boolean })?.waf);
      throw new DittoApiError(errMsg, res.status, body, waf);
    }

    const markdown = await res.text();
    const slug = res.headers.get("X-Ditto-Slug") || "";
    const name = decodeURIComponent(res.headers.get("X-Ditto-Name") || "");
    const saved = res.headers.get("X-Ditto-Saved") === "true";
    const credits = parseInt(res.headers.get("X-Ditto-Credits-Charged") || "0", 10) || 0;

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, markdown);

    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    stderr(`  ✓ DESIGN.md saved to ${outPath}`);
    stderr(`  ✓ Hybrid: ${name}`);
    if (saved) stderr(`  ✓ Saved to Ditto library (slug: ${slug})`);
    stderr(`  ℹ  Credits charged: ${credits}   (${elapsed}s)\n`);
  } catch (err) {
    if (err instanceof DittoApiError) {
      stderr(`\n  ✗ ${err.message}`);
      if (err.status === 402) {
        stderr(`  ↳ Top up credits at ${baseUrl}/pricing`);
      } else if (err.waf) {
        stderr(`  ↳ One of the sites is WAF-blocked. Credits refunded.`);
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
