import { isIP } from "node:net";

export const MAX_TIKTOK_PROXY_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
export const UPSTREAM_FETCH_TIMEOUT_MS = 15_000;
export const TIKTOK_PROXY_CACHE_CONTROL = "public, max-age=3600";

const UNSPLASH_HOST = "images.unsplash.com";
const FBCDN_SUBDOMAIN_REGEX =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+fbcdn\.net$/;

export type ProxyUrlValidationResult =
  | {
      ok: true;
      url: URL;
      isUnsplash: boolean;
    }
  | {
      ok: false;
      status: 400 | 403;
      error: string;
    };

/**
 * Validates and normalizes an external image URL for the TikTok proxy.
 * Enforces strict HTTPS-only, non-IP, credential-free, allowlist-only SSRF rules.
 */
export function validateTikTokProxyUrl(
  rawUrl: string | null | undefined
): ProxyUrlValidationResult {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { ok: false, status: 400, error: "Missing url query parameter" };
  }

  const trimmed = rawUrl.trim();
  if (trimmed === "" || /[\x00-\x1f\x7f]/.test(trimmed)) {
    return { ok: false, status: 400, error: "Invalid url query parameter" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, status: 400, error: "Malformed URL" };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, status: 400, error: "Only HTTPS URLs are allowed" };
  }

  if (
    parsed.username !== "" ||
    parsed.password !== "" ||
    /^https:\/\/[^/?#]*@/i.test(trimmed)
  ) {
    return { ok: false, status: 400, error: "URL credentials are not allowed" };
  }

  if (parsed.port !== "") {
    return { ok: false, status: 400, error: "Custom ports are not allowed" };
  }

  const hostname = parsed.hostname.toLowerCase();
  const unbracketedHost =
    hostname.startsWith("[") && hostname.endsWith("]")
      ? hostname.slice(1, -1)
      : hostname;

  if (!unbracketedHost || isIP(unbracketedHost) !== 0) {
    return { ok: false, status: 400, error: "IP addresses are not allowed" };
  }

  const isUnsplash = hostname === UNSPLASH_HOST;
  const isFbcdnSubdomain = FBCDN_SUBDOMAIN_REGEX.test(hostname);

  if (!isUnsplash && !isFbcdnSubdomain) {
    return { ok: false, status: 403, error: "Hostname is not allowed" };
  }

  // Ensure Unsplash serves JPEG when no explicit format is requested.
  if (isUnsplash && !parsed.searchParams.get("fm")?.trim()) {
    parsed.searchParams.set("fm", "jpg");
  }

  return {
    ok: true,
    url: parsed,
    isUnsplash,
  };
}

/**
 * Validates that an upstream Content-Type is image/jpeg or image/webp.
 */
export function normalizeAllowedImageContentType(
  contentTypeHeader: string | null | undefined
): "image/jpeg" | "image/webp" | null {
  if (!contentTypeHeader) return null;
  const mime = contentTypeHeader.split(";")[0]?.trim().toLowerCase() ?? "";
  if (mime === "image/jpeg" || mime === "image/webp") {
    return mime;
  }
  return null;
}

export type BoundedBodyReadResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; status: 413 | 502; error: string };

/**
 * Reads an upstream Response body with a strict byte cap, aborting early if exceeded.
 */
export async function readResponseBodyWithLimit(
  response: Response,
  maxBytes: number = MAX_TIKTOK_PROXY_IMAGE_BYTES
): Promise<BoundedBodyReadResult> {
  const contentLengthHeader = response.headers.get("content-length");
  if (contentLengthHeader) {
    const declaredLength = Number(contentLengthHeader);
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      await response.body?.cancel().catch(() => undefined);
      return {
        ok: false,
        status: 413,
        error: "Upstream image exceeds maximum allowed size",
      };
    }
  }

  if (!response.body) {
    const buffer = new Uint8Array(await response.arrayBuffer());
    if (buffer.byteLength > maxBytes) {
      return {
        ok: false,
        status: 413,
        error: "Upstream image exceeds maximum allowed size",
      };
    }
    if (buffer.byteLength === 0) {
      return {
        ok: false,
        status: 502,
        error: "Upstream returned an empty image",
      };
    }
    return { ok: true, bytes: buffer };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return {
          ok: false,
          status: 413,
          error: "Upstream image exceeds maximum allowed size",
        };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (totalBytes === 0) {
    return {
      ok: false,
      status: 502,
      error: "Upstream returned an empty image",
    };
  }

  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { ok: true, bytes: combined };
}
