import { NextResponse } from "next/server";
import { listDesigns } from "@/lib/store";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  try {
    const designs = await listDesigns(user.id);
    return NextResponse.json(designs);
  } catch (error) {
    console.error("Error listing designs:", error);
    return NextResponse.json([], { status: 200 });
  }
}
