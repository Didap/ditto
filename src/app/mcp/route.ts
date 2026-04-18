import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { apiKeys, users } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { runExtractionPipeline } from "@/lib/extract-pipeline";
import { getCredits } from "@/lib/credits";
import { getSpecialExtractionQuota } from "@/lib/special-extraction-quota";

/**
 * Remote MCP server — hosted endpoint that Claude Code / Cursor / Zed can add
 * with a single command:
 *
 *   claude mcp add --transport http ditto https://dittodesign.dev/mcp \
 *     --header "Authorization: Bearer ditto_live_..."
 *
 * Same Bearer-token auth as the CLI, same credit deductions, same pipeline.
 * Zero local install required — the user doesn't need to `npm i -g @didap/ditto`.
 */

interface DittoAuthInfo {
  token: string;
  clientId: string;
  scopes: string[];
  extra: {
    userId: string;
    email: string;
    name: string;
  };
}

/** Validate a raw Ditto API key against the database. */
async function verifyApiKey(raw: string): Promise<DittoAuthInfo | undefined> {
  if (!raw || !raw.startsWith("ditto_")) return undefined;
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const [row] = await db
    .select({
      keyId: apiKeys.id,
      userId: apiKeys.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(and(eq(apiKeys.keyHash, hash), isNull(apiKeys.revokedAt)))
    .limit(1);
  if (!row) return undefined;
  // Fire-and-forget usage timestamp
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.keyId))
    .catch(() => {});
  return {
    token: raw,
    clientId: row.keyId,
    scopes: ["extract", "read"],
    extra: {
      userId: row.userId,
      email: row.userEmail,
      name: row.userName,
    },
  };
}

const mcpHandler = createMcpHandler(
  (server) => {
    server.registerTool(
      "extract_design",
      {
        title: "Extract Design System",
        description:
          "Extract a design system from a URL and return the resulting DESIGN.md as Markdown. Costs 100 credits from the authenticated user's Ditto account. Use this when the user asks to import, copy, or reference the visual design of an existing website.",
        inputSchema: {
          url: z.string().describe("The target URL, e.g. https://stripe.com"),
          name: z
            .string()
            .optional()
            .describe("Optional design name (otherwise derived from the page title)."),
          save: z
            .boolean()
            .optional()
            .describe("If true, persist the design to the user's Ditto library."),
        },
      },
      async ({ url, name, save }, extra) => {
        const auth = (extra as { authInfo?: DittoAuthInfo }).authInfo;
        if (!auth) {
          return {
            isError: true,
            content: [{ type: "text", text: "Unauthorized." }],
          };
        }
        const fullUrl = url.startsWith("http") ? url : `https://${url}`;
        const result = await runExtractionPipeline(
          auth.extra.userId,
          fullUrl,
          name,
          { save: save === true }
        );
        if (!result.ok) {
          return {
            isError: true,
            content: [{ type: "text", text: result.error }],
          };
        }
        const header =
          `# ${result.designName}\n` +
          (result.saved
            ? `Saved to Ditto library. Slug: ${result.slug}\n`
            : "") +
          (result.specialExtractionCharged > 0
            ? `Site was WAF-protected — extracted via proxy (+${result.specialExtractionCharged} credits).\n`
            : "") +
          "\n---\n\n";
        return {
          content: [{ type: "text", text: header + result.designMd }],
        };
      }
    );

    server.registerTool(
      "whoami",
      {
        title: "Ditto Account Status",
        description:
          "Return the authenticated Ditto user's identity, plan, remaining credits, and free WAF-extraction quota. Call this before extract_design to budget ahead.",
        inputSchema: {},
      },
      async (_input, extra) => {
        const auth = (extra as { authInfo?: DittoAuthInfo }).authInfo;
        if (!auth) {
          return {
            isError: true,
            content: [{ type: "text", text: "Unauthorized." }],
          };
        }
        const [{ credits, plan }, quota] = await Promise.all([
          getCredits(auth.extra.userId),
          getSpecialExtractionQuota(auth.extra.userId),
        ]);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  user: { email: auth.extra.email, name: auth.extra.name },
                  credits,
                  plan,
                  specialExtractionFreeRemaining: quota.freeRemaining,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    );
  },
  {
    // Let the MCP handler pick reasonable defaults.
  },
  {
    // Route base — matches the folder path (app/mcp)
    basePath: "/mcp",
    maxDuration: 300,
    verboseLogs: false,
  }
);

/**
 * Bearer-token auth wrapper. We intentionally don't advertise an OAuth
 * resource-metadata URL: this server uses static API keys, not OAuth. If we
 * set `resourceMetadataPath`, MCP clients (e.g. Claude Code) try to fetch
 * that URL on 401, parse it as JSON, and blow up with
 * "SDK auth failed: Failed to parse JSON" if the client forgot the
 * `--header Authorization: Bearer ...` flag. With `resourceMetadataPath`
 * omitted, the client just reports "not authenticated" cleanly.
 */
const authHandler = withMcpAuth(
  mcpHandler,
  async (_req, token) => {
    if (!token) return undefined;
    return verifyApiKey(token);
  },
  {
    required: true,
    requiredScopes: ["extract"],
  }
);

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
