import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";

/**
 * Key format: `ditto_live_<32 random base62 chars>`.
 * Grepable prefix, no ambiguous characters.
 */
function generateRawKey(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(32);
  let out = "";
  for (let i = 0; i < 32; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return `ditto_live_${out}`;
}

/** List all non-revoked API keys for the authenticated user. */
export async function GET() {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const rows = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, user.id), isNull(apiKeys.revokedAt)))
    .orderBy(desc(apiKeys.createdAt));

  return NextResponse.json({ keys: rows });
}

/**
 * Create a new API key. Returns the raw key EXACTLY ONCE.
 * Stores only the SHA-256 hash in the DB.
 */
export async function POST(req: NextRequest) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const rawName = typeof body.name === "string" ? body.name.trim() : "";
  const name = rawName.length > 0 ? rawName.slice(0, 50) : "Untitled";

  const raw = generateRawKey();
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const keyPrefix = raw.slice(0, 16); // "ditto_live_XXXXX"
  const id = nanoid();

  await db.insert(apiKeys).values({
    id,
    userId: user.id,
    name,
    keyHash: hash,
    keyPrefix,
    createdAt: new Date(),
  });

  return NextResponse.json({
    id,
    name,
    key: raw, // shown once, never again
    keyPrefix,
    createdAt: new Date().toISOString(),
  });
}
