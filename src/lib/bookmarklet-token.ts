import crypto from "node:crypto";
import { env } from "@/lib/env";

export interface TokenPayload {
  uid: string;
  locale: string;
  exp: number;
}

const DEFAULT_TTL_SECONDS = 600;

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4;
  const padded = pad ? s + "=".repeat(4 - pad) : s;
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function signToken(
  payload: Omit<TokenPayload, "exp">,
  ttlSeconds = DEFAULT_TTL_SECONDS
): string {
  const full: TokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(full)));
  const sig = crypto
    .createHmac("sha256", env.AUTH_SECRET)
    .update(payloadB64)
    .digest();
  return `${payloadB64}.${b64url(sig)}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  const expectedSig = crypto
    .createHmac("sha256", env.AUTH_SECRET)
    .update(payloadB64)
    .digest();
  const providedSig = b64urlDecode(sigB64);

  if (expectedSig.length !== providedSig.length) return null;
  if (!crypto.timingSafeEqual(expectedSig, providedSig)) return null;

  try {
    const payload = JSON.parse(b64urlDecode(payloadB64).toString("utf-8")) as TokenPayload;
    if (!payload.uid || !payload.locale || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
