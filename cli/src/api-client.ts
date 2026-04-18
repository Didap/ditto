import { resolveAuth } from "./config.js";

export class DittoApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
    public waf: boolean = false
  ) {
    super(message);
    this.name = "DittoApiError";
  }
}

interface ExtractOptions {
  url: string;
  name?: string;
  save?: boolean;
}

interface ExtractResult {
  markdown: string;
  slug: string;
  name: string;
  saved: boolean;
  specialExtractionCharged: number;
}

export async function extractMarkdown(
  apiKey: string,
  baseUrl: string,
  opts: ExtractOptions
): Promise<ExtractResult> {
  const qs = opts.save ? "?save=true" : "";
  const res = await fetch(`${baseUrl}/api/extract/md${qs}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: opts.url, name: opts.name }),
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
  const special = parseInt(res.headers.get("X-Ditto-Special-Charged") || "0", 10) || 0;

  return { markdown, slug, name, saved, specialExtractionCharged: special };
}

export interface WhoamiResult {
  user: { id: string; email: string; name: string };
  credits: number;
  plan: string;
  specialExtractionFreeRemaining: number;
}

export async function whoami(
  apiKey: string,
  baseUrl: string
): Promise<WhoamiResult> {
  const res = await fetch(`${baseUrl}/api/auth/keys/me`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    throw new DittoApiError(
      res.status === 401 ? "Invalid or expired API key" : `HTTP ${res.status}`,
      res.status,
      null
    );
  }
  return (await res.json()) as WhoamiResult;
}

/** Convenience: pull auth from config/env, validate both are set, return them. */
export function requireAuth(): { apiKey: string; baseUrl: string } {
  const { apiKey, baseUrl } = resolveAuth();
  if (!apiKey) {
    console.error("Error: no API key configured.");
    console.error("Run `ditto login` first, or set DITTO_API_KEY in your environment.");
    process.exit(1);
  }
  return { apiKey, baseUrl };
}
