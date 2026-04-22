import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { getCatalogEntry, UNLOCK_COST } from "@/lib/catalog";
import { getDesign, saveDesign } from "@/lib/store";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql, gte, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ApiError, insufficientCredits } from "@/lib/errors";
import { trackServer } from "@/lib/analytics/posthog-server";
import { EVENTS } from "@/lib/analytics/events";
import type { StoredDesign } from "@/lib/types";

/** POST — unlock a catalog design for UNLOCK_COST credits */
export async function POST(req: NextRequest) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { catalogId } = await req.json();
  const entry = getCatalogEntry(catalogId);
  if (!entry) {
    return NextResponse.json(
      { error: ApiError.CATALOG_ITEM_NOT_FOUND },
      { status: 404 }
    );
  }

  // Already unlocked?
  const existing = await getDesign(user.id, entry.id);
  if (existing) {
    return NextResponse.json(
      { error: ApiError.CATALOG_ALREADY_UNLOCKED },
      { status: 409 }
    );
  }

  // Deduct credits FIRST with atomic WHERE guard (prevents going negative)
  const deductResult = await db
    .update(users)
    .set({ credits: sql`${users.credits} - ${UNLOCK_COST}` })
    .where(
      and(
        eq(users.id, user.id),
        gte(users.credits, UNLOCK_COST)
      )
    );

  if ((deductResult.rowCount ?? 0) === 0) {
    const [dbUser] = await db
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    return NextResponse.json(
      { error: insufficientCredits(UNLOCK_COST, dbUser?.credits ?? 0) },
      { status: 402 }
    );
  }

  // Read pre-bundled design JSON from designs/ folder. If anything fails, refund.
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
      source: "imported",
    };

    await saveDesign(user.id, design);

    trackServer(user.id, EVENTS.CATALOG_UNLOCKED, {
      slug: entry.id,
      cost: UNLOCK_COST,
    });

    // No email on credit spend — only Stripe subscription purchases trigger mail.
    return NextResponse.json({
      slug: entry.id,
      name: entry.name,
      creditsSpent: UNLOCK_COST,
    });
  } catch {
    // Refund credits on failure
    await db
      .update(users)
      .set({ credits: sql`${users.credits} + ${UNLOCK_COST}` })
      .where(eq(users.id, user.id));

    return NextResponse.json(
      { error: ApiError.IMPORT_FAILED },
      { status: 500 }
    );
  }
}
