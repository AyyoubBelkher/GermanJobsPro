/**
 * Timing safe string comparison to prevent timing attacks.
 * Pure JS implementation for 100% Edge & Node runtime compatibility.
 */
export function timingSafeCompare(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Safely decode URI slug parameter.
 */
export function decodeSlugParam(rawSlug: string): string {
  if (!rawSlug) return "";
  try {
    return decodeURIComponent(rawSlug);
  } catch {
    return rawSlug;
  }
}

/**
 * Validate URL string to ensure it uses http:// or https:// protocol (preventing javascript: XSS).
 */
export function isValidHttpUrl(urlStr?: string | null): boolean {
  if (!urlStr || typeof urlStr !== "string") return true;
  const trimmed = urlStr.trim().toLowerCase();
  if (trimmed === "") return true;
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}

/**
 * Validate image URL to ensure it uses http://, https://, or a relative path starting with / (e.g. /images/...).
 */
export function isValidImageUrl(urlStr?: string | null): boolean {
  if (!urlStr || typeof urlStr !== "string") return true;
  const trimmed = urlStr.trim().toLowerCase();
  if (trimmed === "") return true;
  return trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/");
}

export async function createSessionToken(): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET environment variable is not defined");
  }

  const timestamp = Date.now().toString();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(timestamp)
  );

  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${timestamp}.${signature}`;
}

export async function verifySessionToken(token?: string | null): Promise<boolean> {
  if (!token || typeof token !== "string") {
    return false;
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [timestamp, signature] = parts;
  if (!timestamp || !signature) {
    return false;
  }

  const tokenAge = Date.now() - Number(timestamp);
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  if (isNaN(tokenAge) || tokenAge > maxAge || tokenAge < 0) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const matches = signature.match(/.{1,2}/g);
    if (!matches) return false;

    const signatureBytes = new Uint8Array(
      matches.map((byte) => parseInt(byte, 16))
    );

    return await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(timestamp)
    );
  } catch {
    return false;
  }
}

export async function createUnsubscribeToken(email: string): Promise<string> {
  const secret = process.env.NEWSLETTER_UNSUB_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("NEWSLETTER_UNSUB_SECRET or ADMIN_SESSION_SECRET environment variable is not defined");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(normalizedEmail)
  );

  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyUnsubscribeToken(
  email: string,
  token: string
): Promise<boolean> {
  if (!email || !token || typeof email !== "string" || typeof token !== "string") {
    return false;
  }

  try {
    const expectedToken = await createUnsubscribeToken(email);
    return timingSafeCompare(token.trim().toLowerCase(), expectedToken.toLowerCase());
  } catch {
    return false;
  }
}

