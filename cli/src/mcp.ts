#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { DittoApiError, extractMarkdown, whoami } from "./api-client.js";
import { resolveAuth } from "./config.js";

/**
 * Ditto MCP server — exposes extraction as a tool for Claude Code, Cursor,
 * Zed, and any MCP-compatible agent. Reuses the same auth (Bearer token
 * via `DITTO_API_KEY` env var or `~/.ditto/config.json`) and the same
 * credit-accounted backend as the `ditto` CLI.
 *
 * Installation example (Claude Code):
 *
 *   "mcpServers": {
 *     "ditto": {
 *       "command": "ditto-mcp",
 *       "env": { "DITTO_API_KEY": "ditto_live_..." }
 *     }
 *   }
 */

const server = new McpServer({
  name: "ditto",
  version: "0.1.0",
});

server.registerTool(
  "extract_design",
  {
    title: "Extract Design System",
    description:
      "Extract a design system from a URL and return the resulting DESIGN.md as Markdown. Costs 100 credits from the authenticated user's Ditto account. Use this when the user asks to import, copy, or reference the visual design (colors, typography, components) of an existing website.",
    inputSchema: {
      url: z.string().describe("The target URL, e.g. https://stripe.com"),
      name: z
        .string()
        .optional()
        .describe("Optional design name (otherwise derived from the page title)."),
      save: z
        .boolean()
        .optional()
        .describe("If true, also persist the design to the user's Ditto library."),
    },
  },
  async ({ url, name, save }) => {
    const { apiKey, baseUrl } = resolveAuth();
    if (!apiKey) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Ditto MCP: no API key configured. Set DITTO_API_KEY env var or run `ditto login` first.",
          },
        ],
      };
    }

    try {
      const result = await extractMarkdown(apiKey, baseUrl, {
        url,
        name,
        save: save === true,
      });

      const header =
        `# ${result.name}\n` +
        (result.saved ? `Saved to Ditto library. Slug: ${result.slug}\n` : "") +
        (result.specialExtractionCharged > 0
          ? `Site was WAF-protected — extracted via proxy (+${result.specialExtractionCharged} credits).\n`
          : "") +
        "\n---\n\n";

      return {
        content: [{ type: "text", text: header + result.markdown }],
      };
    } catch (err) {
      const msg =
        err instanceof DittoApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err);
      return {
        isError: true,
        content: [{ type: "text", text: `Ditto error: ${msg}` }],
      };
    }
  }
);

server.registerTool(
  "whoami",
  {
    title: "Ditto Account Status",
    description:
      "Return the authenticated Ditto user's identity, plan, remaining credits, and free WAF-extraction quota. Call this before extract_design if you want to budget ahead of time.",
    inputSchema: {},
  },
  async () => {
    const { apiKey, baseUrl } = resolveAuth();
    if (!apiKey) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Ditto MCP: no API key configured. Set DITTO_API_KEY env var or run `ditto login` first.",
          },
        ],
      };
    }
    try {
      const me = await whoami(apiKey, baseUrl);
      return {
        content: [{ type: "text", text: JSON.stringify(me, null, 2) }],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: "text", text: `Ditto error: ${msg}` }],
      };
    }
  }
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Server now runs over stdio until the client disconnects.
}

main().catch((err) => {
  console.error("Ditto MCP fatal error:", err);
  process.exit(1);
});
