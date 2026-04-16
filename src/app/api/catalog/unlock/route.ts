import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { getCatalogEntry, UNLOCK_COST } from "@/lib/catalog";
import { getDesign, saveDesign } from "@/lib/store";
import { parseDesignMd } from "@/lib/design-md-parser";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql, gte, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ApiError, insufficientCredits } from "@/lib/errors";
import type { StoredDesign } from "@/lib/types";

const execAsync = promisify(exec);

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
    // Either user not found or insufficient credits
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

  // Credits deducted — now download and save. If anything fails, refund.
  const tmpDir = path.join(os.tmpdir(), `ditto-unlock-${nanoid(8)}`);
  await fs.mkdir(tmpDir, { recursive: true });

  try {
    const outPath = path.join(tmpDir, `${entry._source}.md`);
    await execAsync(
      `npx getdesign@latest add ${entry._source} --out "${outPath}" 2>/dev/null`,
      { timeout: 20000 }
    );

    const content = await fs.readFile(outPath, "utf-8");
    if (!content || content.length < 50) {
      throw new Error("Empty design file");
    }

    const { tokens, resolved } = parseDesignMd(content, entry.name);

    const design: StoredDesign = {
      id: nanoid(),
      slug: entry.id,
      name: entry.name,
      url: "",
      description: entry.description,
      tokens,
      resolved,
      designMd: content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "imported",
    };

    await saveDesign(user.id, design);

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
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
