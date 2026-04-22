import { NextRequest, NextResponse } from "next/server";
import { saveDesign, generateSlug } from "@/lib/store";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { nanoid } from "nanoid";
import type { StoredDesign } from "@/lib/types";
import { ApiError } from "@/lib/errors";
import { trackServer } from "@/lib/analytics/posthog-server";
import { EVENTS } from "@/lib/analytics/events";

export async function POST(req: NextRequest) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const { name, url, description, tokens, resolved, designMd, source } = body;

    if (!name || !tokens || !resolved) {
      return NextResponse.json(
        { error: ApiError.NAME_TOKENS_RESOLVED_REQUIRED },
        { status: 400 }
      );
    }

    const slug = generateSlug(name);
    const now = new Date().toISOString();

    const design: StoredDesign = {
      id: nanoid(),
      slug,
      name,
      url: url || "",
      description: description || "",
      tokens,
      resolved,
      designMd: designMd || "",
      createdAt: now,
      updatedAt: now,
      source: source || "extracted",
    };

    await saveDesign(user.id, design);
    trackServer(user.id, EVENTS.DESIGN_SAVED, { slug, source: design.source });

    return NextResponse.json({ slug, name });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json(
      { error: ApiError.SAVE_FAILED },
      { status: 500 }
    );
  }
}
