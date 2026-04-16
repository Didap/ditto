import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { designs, users } from "@/lib/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { CATALOG } from "@/lib/catalog";
import { saveDesign } from "@/lib/store";
import { ApiError } from "@/lib/errors";
import type { StoredDesign } from "@/lib/types";

const RECYCLE_CREDITS = 40;

/** POST — recycle a trashed design: swap for random catalog design or convert to credits */
export async function POST(req: NextRequest) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { slug, action } = await req.json();

  if (action !== "catalog" && action !== "credits") {
    return NextResponse.json({ error: ApiError.INVALID_RECYCLE_ACTION }, { status: 400 });
  }

  // Verify the design is in trash
  const [trashed] = await db
    .select({ id: designs.id, source: designs.source, slug: designs.slug })
    .from(designs)
    .where(and(eq(designs.userId, user.id), eq(designs.slug, slug), isNotNull(designs.deletedAt)))
    .limit(1);

  if (!trashed) {
    return NextResponse.json({ error: ApiError.DESIGN_NOT_IN_TRASH }, { status: 404 });
  }

  // Designs obtained via recycling cannot be recycled again
  if (trashed.source === "recycled") {
    return NextResponse.json({ error: ApiError.DESIGN_NOT_RECYCLABLE }, { status: 400 });
  }

  if (action === "credits") {
    // Delete the design permanently
    await db.delete(designs).where(eq(designs.id, trashed.id));

    // Add 40 credits
    await db
      .update(users)
      .set({ credits: sql`${users.credits} + ${RECYCLE_CREDITS}` })
      .where(eq(users.id, user.id));

    const [dbUser] = await db
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    return NextResponse.json({
      action: "credits",
      creditsAwarded: RECYCLE_CREDITS,
      creditsTotal: dbUser?.credits ?? 0,
    });
  }

  // action === "catalog" — swap for a random catalog design the user doesn't already own
  const userDesignSlugs = await db
    .select({ slug: designs.slug })
    .from(designs)
    .where(eq(designs.userId, user.id));

  const ownedSlugs = new Set(userDesignSlugs.map((r) => r.slug));
  const available = CATALOG.filter((e) => !ownedSlugs.has(e.id));

  if (available.length === 0) {
    return NextResponse.json({ error: ApiError.NO_CATALOG_AVAILABLE }, { status: 400 });
  }

  // Pick a random one
  const entry = available[Math.floor(Math.random() * available.length)];

  // Delete the recycled design permanently
  await db.delete(designs).where(eq(designs.id, trashed.id));

  // Load and save the catalog design
  try {
    const jsonPath = path.join(process.cwd(), "designs", `${entry._source}.json`);
    const raw = await fs.readFile(jsonPath, "utf-8");
    const source = JSON.parse(raw) as StoredDesign;

    const design: StoredDesign = {
      id: nanoid(),
      slug: entry.id,
      name: entry.name,
      url: source.url || "",
      description: entry.description,
      tokens: source.tokens,
      resolved: source.resolved,
      designMd: source.designMd,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "recycled", // marks as non-recyclable
    };

    await saveDesign(user.id, design);

    return NextResponse.json({
      action: "catalog",
      newDesign: { slug: entry.id, name: entry.name },
    });
  } catch {
    return NextResponse.json({ error: ApiError.IMPORT_FAILED }, { status: 500 });
  }
}
