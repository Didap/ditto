import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import {
  listTrash,
  restoreDesign,
  permanentlyDeleteDesign,
  purgeExpiredTrash,
} from "@/lib/store";
import { db } from "@/lib/db";
import { designUnlocks } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

/** GET — list soft-deleted designs (trash) */
export async function GET() {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  // Auto-purge expired trash on every fetch
  await purgeExpiredTrash();

  const trashed = await listTrash(user.id);

  // Enrich with credits spent
  const unlocks = await db
    .select({
      designSlug: designUnlocks.designSlug,
      totalSpent: sql<number>`cast(sum(${designUnlocks.creditsSpent}) as integer)`.as("total_spent"),
    })
    .from(designUnlocks)
    .where(eq(designUnlocks.userId, user.id))
    .groupBy(designUnlocks.designSlug);

  const spentMap = new Map<string, number>();
  for (const u of unlocks) {
    spentMap.set(u.designSlug, Number(u.totalSpent));
  }

  const enriched = trashed.map((d) => ({
    ...d,
    creditsSpent: (d.source === "extracted" ? 100 : 50) + (spentMap.get(d.slug) ?? 0),
  }));

  return NextResponse.json(enriched);
}

/** POST — restore or permanently delete a trashed design */
export async function POST(req: NextRequest) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { slug, action } = await req.json();

  if (action === "restore") {
    const ok = await restoreDesign(user.id, slug);
    return ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "Not found in trash" }, { status: 404 });
  }

  if (action === "permanent-delete") {
    const ok = await permanentlyDeleteDesign(user.id, slug);
    return ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "Not found in trash" }, { status: 404 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
