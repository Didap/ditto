/**
 * Cloudinary upload helper.
 *
 * Server-side only — uses the full API credentials (cloud_name + api_key +
 * api_secret) from env vars. The client never sees the secret.
 *
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * Design choice: we use a single `cloudinary` SDK instance configured at module
 * load. Uploads go to a `ditto/` folder tree keyed by feature + userId so files
 * are scoped and easy to audit.
 */

import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from "cloudinary";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Missing CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET env vars.",
    );
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  configured = true;
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export interface UploadImageParams {
  /** Binary data of the file (from FormData.arrayBuffer(), etc.). */
  buffer: Buffer;
  /** Folder under `ditto/`, e.g. `avatars`, `logos/user123`. */
  folder: string;
  /** Stable public ID inside the folder, e.g. the user id. Overwrites previous file with same id. */
  publicId: string;
  /** Transformations applied before delivery. */
  transformation?: UploadApiOptions["transformation"];
  /** Max file size in bytes (defaults to 5MB). */
  maxBytes?: number;
}

export async function uploadImage({
  buffer,
  folder,
  publicId,
  transformation,
  maxBytes = 5 * 1024 * 1024,
}: UploadImageParams): Promise<UploadApiResponse> {
  ensureConfigured();

  if (buffer.length > maxBytes) {
    throw new Error(`File too large: ${buffer.length} bytes (max ${maxBytes}).`);
  }

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `ditto/${folder}`,
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
        format: "webp",
        transformation,
      },
      (err, result) => {
        if (err) return reject(err);
        if (!result) return reject(new Error("Cloudinary upload returned no result"));
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}

/** Default avatar transformation: 256x256 square crop, face-aware, webp. */
export const AVATAR_TRANSFORMATION: UploadApiOptions["transformation"] = [
  { width: 256, height: 256, crop: "thumb", gravity: "face" },
  { quality: "auto" },
];

/** Default logo transformation: max 512px on longest side, preserve alpha. */
export const LOGO_TRANSFORMATION: UploadApiOptions["transformation"] = [
  { width: 512, height: 512, crop: "limit" },
  { quality: "auto" },
];
