/**
 * Image Utilities for permanent asset persistence.
 * Prevents disappearing/expiring images hosted on transient social CDNs (Facebook CDN, etc.)
 * by converting them into permanent database-backed Base64 Data URLs.
 */

/**
 * Checks if a URL points to an expiring social media CDN.
 * Hardened to prevent SSRF and validate strict hostnames and protocols.
 */
export function isExpiringSocialCdnUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    return (
      hostname === "fbsbx.com" ||
      hostname.endsWith(".fbsbx.com") ||
      hostname === "fbcdn.net" ||
      hostname.endsWith(".fbcdn.net")
    );
  } catch {
    return false;
  }
}

/**
 * Ensures image URLs are permanent and won't expire on CapRover or Facebook CDN.
 * - Empty url -> returns null
 * - Local path (/images/...) or data:image/ -> returns as-is
 * - Expiring social CDN (fbcdn.net, fbsbx.com) -> fetches image (8s timeout, 5MB cap, verified image/ content-type) and converts to data:image/...;base64,...
 * - Other URLs -> returns as-is
 */
export async function ensurePermanentImageUrl(
  rawUrl?: string | null
): Promise<string | null> {
  if (!rawUrl || typeof rawUrl !== "string") {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (trimmed === "") {
    return null;
  }

  // Already local relative path or already a Data URL
  if (trimmed.startsWith("/") || trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  // If not an expiring social CDN URL, return as-is
  if (!isExpiringSocialCdnUrl(trimmed)) {
    return trimmed;
  }

  // Fetch image on server and convert to permanent Base64 Data URL
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(trimmed, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(
        `[ensurePermanentImageUrl] Failed to fetch image (${res.status} ${res.statusText}): ${trimmed}`
      );
      return trimmed;
    }

    const contentType =
      res.headers.get("content-type")?.split(";")[0]?.trim() || "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      console.warn(
        `[ensurePermanentImageUrl] Rejected non-image Content-Type (${contentType}): ${trimmed}`
      );
      return trimmed;
    }

    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB max cap
    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_SIZE_BYTES) {
      console.warn(
        `[ensurePermanentImageUrl] Content-Length (${contentLength}) exceeds 5MB cap: ${trimmed}`
      );
      return trimmed;
    }

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
      console.warn(
        `[ensurePermanentImageUrl] Response payload (${arrayBuffer.byteLength} bytes) exceeds 5MB cap: ${trimmed}`
      );
      return trimmed;
    }

    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    return `data:${contentType};base64,${base64}`;
  } catch (err) {
    console.warn(
      `[ensurePermanentImageUrl] Fetch error for CDN image, falling back to rawUrl:`,
      err instanceof Error ? err.message : err
    );
    return trimmed;
  }
}
