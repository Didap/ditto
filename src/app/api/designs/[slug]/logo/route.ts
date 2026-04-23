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
import type { SectionVariant } from "@/lib/types";
import { HEADER_VARIANTS, SECTION_VARIANTS, SECTION_KEYS } from "@/lib/types";

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
    const msg = describeError(err);
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
    const msg = describeError(err);
    console.error("[logo upload] save step failed", msg, err);
    return NextResponse.json(
      { error: ApiError.UPLOAD_FAILED, detail: `save: ${msg}`, logoUrl: uploadedUrl },
      { status: 500 },
    );
  }
}

/**
 * Extract a human-readable message from anything a caller might throw.
 * Cloudinary's SDK rejects with a plain object like `{message, http_code, name}`
 * instead of an Error, so `String(err)` returns "[object Object]" — useless.
 */
function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const rec = err as Record<string, unknown>;
    const inner = rec.error && typeof rec.error === "object" ? (rec.error as Record<string, unknown>) : null;
    const message = inner?.message ?? rec.message;
    if (typeof message === "string" && message.length > 0) {
      const code = rec.http_code ?? rec.code ?? inner?.http_code;
      return code ? `${message} (${code})` : message;
    }
    try {
      return JSON.stringify(err);
    } catch {
      return "[unserializable error]";
    }
  }
  return String(err);
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

/**
 * Update any brand-related fields on a design in one shot.
 *
 * Body accepts any subset of:
 *   {
 *     variant?: HeaderVariant,           // legacy: sets headerVariant
 *     headerVariant?: HeaderVariant,
 *     heroVariant?: SectionVariant,
 *     featuresVariant?: SectionVariant,
 *     statsVariant?: SectionVariant,
 *     reviewsVariant?: SectionVariant,
 *     ctaVariant?: SectionVariant,
 *     footerVariant?: SectionVariant,
 *     brandName?: string,
 *   }
 *
 * The editor uses this for the preset row (sets all section variants at once)
 * and the per-section selectors.
 */
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
  const brandName = typeof body.brandName === "string" ? body.brandName : undefined;

  // Collect variant updates. Accept the legacy `variant` key as alias for
  // `headerVariant` so older clients keep working.
  const variantFields: Array<[string, SectionVariant[]]> = [
    ["headerVariant", HEADER_VARIANTS],
    ["heroVariant", SECTION_VARIANTS],
    ["featuresVariant", SECTION_VARIANTS],
    ["statsVariant", SECTION_VARIANTS],
    ["reviewsVariant", SECTION_VARIANTS],
    ["ctaVariant", SECTION_VARIANTS],
    ["footerVariant", SECTION_VARIANTS],
  ];

  const updates: Record<string, SectionVariant> = {};

  if (body.variant && !updates.headerVariant) {
    if (!HEADER_VARIANTS.includes(body.variant)) {
      return NextResponse.json(
        { error: ApiError.INVALID_HEADER_VARIANT },
        { status: 400 },
      );
    }
    updates.headerVariant = body.variant;
  }

  for (const [key, allowed] of variantFields) {
    const v = body[key];
    if (v === undefined) continue;
    if (!allowed.includes(v)) {
      return NextResponse.json(
        { error: ApiError.INVALID_HEADER_VARIANT, detail: `invalid value for ${key}` },
        { status: 400 },
      );
    }
    updates[key] = v;
  }

  const resolved = {
    ...design.resolved,
    ...updates,
    ...(brandName !== undefined ? { brandName } : {}),
  };

  await saveDesign(user.id, {
    ...design,
    resolved,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ resolved });
}

void SECTION_KEYS;
