import fs from "node:fs";
import path from "node:path";
import { DittoApiError, requireAuth } from "../api-client.js";

interface ViewArgs {
  slug: string;
  out?: string;
}

export async function runView(args: ViewArgs): Promise<void> {
  const { apiKey, baseUrl } = requireAuth();
  try {
    const res = await fetch(
      `${baseUrl}/api/designs/${encodeURIComponent(args.slug)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!res.ok) {
      if (res.status === 404) {
        console.error(`  ✗ Design not found: ${args.slug}`);
        console.error(`  ↳ Run \`ditto list\` to see available slugs.`);
      } else {
        throw new DittoApiError(`HTTP ${res.status}`, res.status, null);
      }
      process.exit(1);
    }
    const design = (await res.json()) as { designMd?: string; name?: string };
    const md = design.designMd || "";

    if (args.out) {
      const outPath = path.resolve(args.out);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, md);
      process.stderr.write(`  ✓ ${design.name || args.slug} → ${outPath}\n`);
    } else {
      process.stdout.write(md);
    }
  } catch (err) {
    const msg =
      err instanceof DittoApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err);
    console.error(`  ✗ ${msg}`);
    process.exit(1);
  }
}
