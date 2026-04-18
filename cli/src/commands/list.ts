import { DittoApiError, requireAuth } from "../api-client.js";

interface DesignListItem {
  slug: string;
  name: string;
  url: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  quality?: { overall?: number };
  creditsSpent: number;
}

export async function runList(): Promise<void> {
  const { apiKey, baseUrl } = requireAuth();
  try {
    const res = await fetch(`${baseUrl}/api/designs`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      throw new DittoApiError(`HTTP ${res.status}`, res.status, null);
    }
    const designs = (await res.json()) as DesignListItem[];

    if (designs.length === 0) {
      process.stderr.write("  Nessun design ancora salvato.\n");
      process.stderr.write(`  Prova: ditto https://stripe.com --save\n`);
      return;
    }

    const headers = ["SLUG", "NAME", "SOURCE", "CREDITS", "UPDATED"];
    const rows = designs.map((d) => [
      truncate(d.slug, 28),
      truncate(d.name, 24),
      d.source,
      String(d.creditsSpent),
      new Date(d.updatedAt).toISOString().slice(0, 10),
    ]);

    const widths = headers.map((h, i) =>
      Math.max(h.length, ...rows.map((r) => r[i].length))
    );

    const line = (cells: string[]) =>
      cells.map((c, i) => c.padEnd(widths[i])).join("  ");

    process.stderr.write(`\n${line(headers)}\n`);
    process.stderr.write(widths.map((w) => "─".repeat(w)).join("  ") + "\n");
    for (const r of rows) process.stderr.write(line(r) + "\n");
    process.stderr.write(`\n  ${designs.length} design${designs.length === 1 ? "" : "s"}\n`);
    process.stderr.write(`  Open one with: ditto view <slug>\n\n`);
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

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}
