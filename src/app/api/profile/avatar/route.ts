import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ApiError } from "@/lib/errors";
import {
  uploadImage,
  AVATAR_TRANSFORMATION,
  isCloudinaryConfigured,
} from "@/lib/cloudinary";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: ApiError.CLOUDINARY_NOT_CONFIGURED },
      { status: 503 },
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: ApiError.AVATAR_MISSING }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: ApiError.AVATAR_INVALID_TYPE },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: ApiError.AVATAR_TOO_LARGE }, { status: 413 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const result = await uploadImage({
      buffer,
      folder: "avatars",
      publicId: user.id,
      transformation: AVATAR_TRANSFORMATION,
    });

    await db
      .update(users)
      .set({ avatarUrl: result.secure_url })
      .where(eq(users.id, user.id));

    return NextResponse.json({ avatarUrl: result.secure_url });
  } catch (err) {
    console.error("[avatar upload]", err);
    return NextResponse.json({ error: ApiError.UPLOAD_FAILED }, { status: 500 });
  }
}
