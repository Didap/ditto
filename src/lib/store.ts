import { db } from "@/lib/db";
import { designs } from "@/lib/db/schema";
import type { DesignSelect } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { StoredDesign } from "./types";
import { scoreDesignQuality } from "./quality-scorer";

/**
 * List all designs for a user.
 * Returns lightweight objects (no tokens/designMd) for the library grid.
 */
export async function listDesigns(userId: string): Promise<StoredDesign[]> {
  const rows = await db
    .select()
    .from(designs)
    .where(eq(designs.userId, userId))
    .orderBy(desc(designs.createdAt));

  return rows.map(rowToDesign);
}

/**
 * Get a single design by slug (scoped to user).
 */
export async function getDesign(
  userId: string,
  slug: string
): Promise<StoredDesign | null> {
  const [row] = await db
    .select()
    .from(designs)
    .where(and(eq(designs.userId, userId), eq(designs.slug, slug)))
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

  // Check if exists (same user + slug)
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
 * Delete a design (scoped to user).
 */
export async function deleteDesign(
  userId: string,
  slug: string
): Promise<boolean> {
  const result = await db
    .delete(designs)
    .where(and(eq(designs.userId, userId), eq(designs.slug, slug)));

  return (result.rowCount ?? 0) > 0;
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
