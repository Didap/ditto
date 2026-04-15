import { NextResponse } from "next/server";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { getCredits, COSTS } from "@/lib/credits";

export async function GET() {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { credits, plan } = await getCredits(user.id);

  return NextResponse.json({ credits, plan, costs: COSTS });
}
