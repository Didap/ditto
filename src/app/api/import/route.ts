import { NextResponse } from "next/server";

/**
 * Deprecated — bulk import replaced by /api/catalog/unlock.
 * Returns 410 Gone to signal clients to use the new endpoint.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Bulk import is no longer available. Use /catalog to unlock individual designs." },
    { status: 410 }
  );
}
