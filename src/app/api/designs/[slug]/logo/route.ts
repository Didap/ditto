import { NextRequest, NextResponse } from "next/server";
import { getDesign, saveDesign } from "@/lib/store";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { ApiError } from "@/lib/errors";
import {
  uploadImage,
  deleteImage,
  LOGO_TRANSFORMATION,
  isCloudinaryConfigured,
} from "@/lib/cloudinary";
import type { HeaderVariant } from "@/lib/types";
import { HEADER_VARIANTS } from "@/lib/types";

const ALLOWED_MIME = new Set([
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const MAX_BYTES = 3 * 1024 * 1024;

function logoPublicId(userId: string, slug: string): string {
  return `ditto/logos/${userId}/${slug}`;
}

/** Upload (or replace) a custom logo for a design. Multipart: field `file`. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: ApiError.CLOUDINARY_NOT_CONFIGURED },
      { status: 503 },
    );
  }

  const { slug } = await params;
  const design = await getDesign(user.id, slug);
  if (!design) {
    return NextResponse.json(
      { error: ApiError.DESIGN_NOT_FOUND },
      { status: 404 },
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: ApiError.LOGO_MISSING }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: ApiError.LOGO_INVALID_TYPE },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: ApiError.LOGO_TOO_LARGE },
      { status: 413 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const isSvg = file.type === "image/svg+xml";

  let uploadedUrl: string | null = null;
  try {
    const result = await uploadImage({
      buffer,
      folder: `logos/${user.id}`,
      publicId: slug,
      maxBytes: MAX_BYTES,
      format: isSvg ? "preserve" : "webp",
      transformation: isSvg ? undefined : LOGO_TRANSFORMATION,
    });
    uploadedUrl = result.secure_url;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[logo upload] cloudinary step failed", msg, err);
    return NextResponse.json(
      { error: ApiError.UPLOAD_FAILED, detail: `cloudinary: ${msg}` },
      { status: 500 },
    );
  }

  try {
    const resolved = { ...design.resolved, logoUrl: uploadedUrl };
    await saveDesign(user.id, {
      ...design,
      resolved,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ logoUrl: uploadedUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[logo upload] save step failed", msg, err);
    return NextResponse.json(
      { error: ApiError.UPLOAD_FAILED, detail: `save: ${msg}`, logoUrl: uploadedUrl },
      { status: 500 },
    );
  }
}

/** Remove the custom logo (reverts to the Ditto placeholder). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { slug } = await params;
  const design = await getDesign(user.id, slug);
  if (!design) {
    return NextResponse.json(
      { error: ApiError.DESIGN_NOT_FOUND },
      { status: 404 },
    );
  }

  if (isCloudinaryConfigured() && design.resolved.logoUrl) {
    try {
      await deleteImage(logoPublicId(user.id, slug));
    } catch (err) {
      console.error("[logo delete]", err);
    }
  }

  const { logoUrl: _removed, ...rest } = design.resolved;
  void _removed;
  await saveDesign(user.id, {
    ...design,
    resolved: rest,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}

/** Update the chosen header variant. Body: { variant: HeaderVariant }. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { slug } = await params;
  const design = await getDesign(user.id, slug);
  if (!design) {
    return NextResponse.json(
      { error: ApiError.DESIGN_NOT_FOUND },
      { status: 404 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const variant = body.variant as HeaderVariant | undefined;
  const brandName = typeof body.brandName === "string" ? body.brandName : undefined;

  if (variant && !HEADER_VARIANTS.includes(variant)) {
    return NextResponse.json(
      { error: ApiError.INVALID_HEADER_VARIANT },
      { status: 400 },
    );
  }

  const resolved = {
    ...design.resolved,
    ...(variant ? { headerVariant: variant } : {}),
    ...(brandName !== undefined ? { brandName } : {}),
  };

  await saveDesign(user.id, {
    ...design,
    resolved,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ resolved });
}
