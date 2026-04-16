import { NextResponse } from "next/server";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { CATALOG, UNLOCK_COST, type CatalogCategory, type CatalogPreview } from "@/lib/catalog";
import { db } from "@/lib/db";
import { designs } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export interface CatalogItemResponse {
  id: string;
  name: string;
  description: string;
  category: CatalogCategory;
  preview: CatalogPreview;
  unlocked: boolean;
  slug: string | null;
}

/** GET — list the full catalog with unlock status per user */
export async function GET() {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  // Find which catalog designs the user already has
  const catalogIds = CATALOG.map((e) => e.id);
  const owned = await db
    .select({ slug: designs.slug })
    .from(designs)
    .where(
      and(eq(designs.userId, user.id), inArray(designs.slug, catalogIds))
    );

  const ownedSlugs = new Set(owned.map((r) => r.slug));

  const items: CatalogItemResponse[] = CATALOG.map((entry) => ({
    id: entry.id,
    name: entry.name,
    description: entry.description,
    category: entry.category,
    preview: entry.preview,
    unlocked: ownedSlugs.has(entry.id),
    slug: ownedSlugs.has(entry.id) ? entry.id : null,
  }));

  return NextResponse.json({ items, unlockCost: UNLOCK_COST });
}
