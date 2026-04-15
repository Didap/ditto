import { NextRequest, NextResponse } from "next/server";
import { getDesign, deleteDesign } from "@/lib/store";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { slug } = await params;
  const design = await getDesign(user.id, slug);

  if (!design) {
    return NextResponse.json({ error: "Design not found" }, { status: 404 });
  }

  return NextResponse.json(design);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { slug } = await params;
  const deleted = await deleteDesign(user.id, slug);

  if (!deleted) {
    return NextResponse.json({ error: "Design not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
