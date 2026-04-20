import "server-only";
import { auth } from "@/lib/auth";

/**
 * Admin allowlist driven by env var `ADMIN_EMAILS` (comma-separated).
 * Emails are normalized lowercase + trimmed.
 */
function adminSet(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminSet().has(email.toLowerCase());
}

/** Returns the admin user or null. Use in server pages + API routes. */
export async function getAdminUser() {
  const session = await auth();
  const u = session?.user as { id: string; name: string; email: string } | undefined;
  if (!u?.email || !isAdminEmail(u.email)) return null;
  return u;
}
