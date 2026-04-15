import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ApiError } from "@/lib/errors";

export async function getRequiredUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user as { id: string; name: string; email: string };
}

export function unauthorized() {
  return NextResponse.json({ error: ApiError.UNAUTHORIZED }, { status: 401 });
}
