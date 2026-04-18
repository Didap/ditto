import { NextResponse } from "next/server";

/**
 * OAuth 2.0 Protected Resource Metadata (RFC 9728).
 *
 * We don't actually do OAuth — Ditto MCP uses static Bearer tokens generated
 * at /settings/api-keys. But some MCP clients probe this endpoint on 401 to
 * discover auth flows, and if they get HTML (e.g. Next's 404) they fail with
 * "Failed to parse JSON". Serving a minimal valid JSON response makes those
 * clients surface a clean auth error instead.
 */
export async function GET() {
  return NextResponse.json({
    resource: "https://dittodesign.dev/mcp",
    authorization_servers: [],
    bearer_methods_supported: ["header"],
    scopes_supported: ["extract", "read"],
    resource_documentation: "https://dittodesign.dev/settings/api-keys",
  });
}
