import { db } from "@/lib/db";
import { designs } from "@/lib/db/schema";
import type { DesignSelect } from "@/lib/db/schema";
import { eq, and, desc, isNull, isNotNull, lte, sql } from "drizzle-orm";
import type { StoredDesign, DashboardDesignCard } from "./types";
import { scoreDesignQuality } from "./quality-scorer";

/**
 * List all active (non-deleted) designs for a user.
 */
export async function listDesigns(userId: string): Promise<StoredDesign[]> {
  const rows = await db
    .select()
    .from(designs)
    .where(and(eq(designs.userId, userId), isNull(designs.deletedAt)))
    .orderBy(desc(designs.createdAt));

  return rows.map(rowToDesign);
}

/**
 * Slim listing for the dashboard grid. Only selects the columns the card
 * template renders — skips the heavy `tokens` and `designMd` blobs. Supports
 * pagination and returns the full active-designs count for UI paging.
 */
export async function listDesignsSlim(
  userId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<{ designs: DashboardDesignCard[]; total: number }> {
  const where = and(eq(designs.userId, userId), isNull(designs.deletedAt));

  const [countRow] = await db
    .select({ total: sql<number>`cast(count(*) as integer)` })
    .from(designs)
    .where(where);
  const total = Number(countRow?.total ?? 0);

  // Still pull `tokens` here — the quality score is computed server-side and
  // we strip the blob before returning, so it never reaches the client.
  const rows = await db
    .select({
      id: designs.id,
      slug: designs.slug,
      name: designs.name,
      url: designs.url,
      tokens: designs.tokens,
      resolved: designs.resolved,
      source: designs.source,
      createdAt: designs.createdAt,
      updatedAt: designs.updatedAt,
    })
    .from(designs)
    .where(where)
    .orderBy(desc(designs.createdAt))
    .limit(opts.limit ?? 1000)
    .offset(opts.offset ?? 0);

  const list = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    url: row.url,
    resolved: row.resolved,
    quality: scoreDesignQuality(row.tokens, row.resolved),
    source: row.source as StoredDesign["source"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));

  return { designs: list, total };
}

/**
 * Get a single active design by slug (scoped to user).
 */
export async function getDesign(
  userId: string,
  slug: string
): Promise<StoredDesign | null> {
  const [row] = await db
    .select()
    .from(designs)
    .where(
      and(eq(designs.userId, userId), eq(designs.slug, slug), isNull(designs.deletedAt))
    )
    .limit(1);

  return row ? rowToDesign(row) : null;
}

/**
 * Save (insert or update) a design for a user.
 */
export async function saveDesign(
  userId: string,
  design: StoredDesign
): Promise<void> {
  const now = new Date();

  // Check if exists (same user + slug) — including soft-deleted, to restore
  const [existing] = await db
    .select({ id: designs.id })
    .from(designs)
    .where(and(eq(designs.userId, userId), eq(designs.slug, design.slug)))
    .limit(1);

  if (existing) {
    await db
      .update(designs)
      .set({
        name: design.name,
        url: design.url,
        description: design.description,
        tokens: design.tokens,
        resolved: design.resolved,
        designMd: design.designMd,
        source: design.source,
        deletedAt: null, // restore if was soft-deleted
        updatedAt: now,
      })
      .where(eq(designs.id, existing.id));
  } else {
    await db.insert(designs).values({
      id: design.id,
      userId,
      slug: design.slug,
      name: design.name,
      url: design.url,
      description: design.description,
      tokens: design.tokens,
      resolved: design.resolved,
      designMd: design.designMd,
      source: design.source,
      createdAt: design.createdAt ? new Date(design.createdAt) : now,
      updatedAt: design.updatedAt ? new Date(design.updatedAt) : now,
    });
  }
}

/**
 * Soft-delete a design (scoped to user). Permanent after 7 days.
 */
export async function deleteDesign(
  userId: string,
  slug: string
): Promise<boolean> {
  const result = await db
    .update(designs)
    .set({ deletedAt: new Date() })
    .where(
      and(eq(designs.userId, userId), eq(designs.slug, slug), isNull(designs.deletedAt))
    );

  return (result.rowCount ?? 0) > 0;
}

/**
 * List soft-deleted designs for a user (trash).
 */
export async function listTrash(userId: string): Promise<StoredDesign[]> {
  const rows = await db
    .select()
    .from(designs)
    .where(and(eq(designs.userId, userId), isNotNull(designs.deletedAt)))
    .orderBy(desc(designs.deletedAt));

  return rows.map((row) => ({
    ...rowToDesign(row),
    deletedAt: row.deletedAt?.toISOString(),
  }));
}

/**
 * Restore a soft-deleted design.
 */
export async function restoreDesign(
  userId: string,
  slug: string
): Promise<boolean> {
  const result = await db
    .update(designs)
    .set({ deletedAt: null })
    .where(
      and(eq(designs.userId, userId), eq(designs.slug, slug), isNotNull(designs.deletedAt))
    );

  return (result.rowCount ?? 0) > 0;
}

/**
 * Permanently delete a soft-deleted design.
 */
export async function permanentlyDeleteDesign(
  userId: string,
  slug: string
): Promise<boolean> {
  const result = await db
    .delete(designs)
    .where(
      and(eq(designs.userId, userId), eq(designs.slug, slug), isNotNull(designs.deletedAt))
    );

  return (result.rowCount ?? 0) > 0;
}

/**
 * Purge all designs soft-deleted more than 7 days ago (all users).
 */
export async function purgeExpiredTrash(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const result = await db
    .delete(designs)
    .where(
      and(isNotNull(designs.deletedAt), lte(designs.deletedAt, cutoff))
    );

  return result.rowCount ?? 0;
}

/**
 * Generate a URL-safe slug from a name.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ── Helpers ──

function rowToDesign(row: DesignSelect): StoredDesign {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    url: row.url,
    description: row.description,
    tokens: row.tokens,
    resolved: row.resolved,
    quality: scoreDesignQuality(row.tokens, row.resolved),
    designMd: row.designMd,
    source: row.source as StoredDesign["source"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
