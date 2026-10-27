import { NextRequest } from "next/server";

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
  refresh_token?: string;
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

/**
 * Resolves the public, client-facing origin URL.
 * In production, prioritizes NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL (or x-forwarded-proto + x-forwarded-host),
 * stripping trailing slashes, so redirects never use internal Docker URLs (e.g. http://localhost:3000).
 */
export function getPublicOrigin(request: NextRequest): string {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (process.env.NODE_ENV === "production" && envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (request.nextUrl.protocol ? request.nextUrl.protocol.replace(":", "") : "http");

  if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    return `${proto}://${host}`.replace(/\/+$/, "");
  }

  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  if (host) {
    return `${proto}://${host}`.replace(/\/+$/, "");
  }

  return request.nextUrl.origin.replace(/\/+$/, "");
}

/**
 * Determines cookie domain for sharing cookies across germanjobspro.com and www.germanjobspro.com.
 * Checks x-forwarded-host, host, and getPublicOrigin. Returns ".germanjobspro.com" for production domain,
 * or undefined for localhost.
 */
export function getCookieDomain(request: NextRequest): string | undefined {
  const candidates: (string | null | undefined)[] = [
    request.headers.get("x-forwarded-host"),
    request.headers.get("host"),
  ];

  try {
    const origin = getPublicOrigin(request);
    const parsedUrl = new URL(origin);
    candidates.push(parsedUrl.hostname);
  } catch {
    // ignore URL parsing error
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    const hostname = candidate.split(":")[0].trim().toLowerCase();
    if (hostname === "germanjobspro.com" || hostname.endsWith(".germanjobspro.com")) {
      return ".germanjobspro.com";
    }
  }

  return undefined;
}

/**
 * Computes canonical Google OAuth redirect URI matching the incoming request origin,
 * proxy headers, or explicit environment variable.
 */
export function getGoogleRedirectUri(request: NextRequest): string {
  if (process.env.GOOGLE_REDIRECT_URI && process.env.GOOGLE_REDIRECT_URI.trim()) {
    return process.env.GOOGLE_REDIRECT_URI.trim();
  }

  const baseOrigin = getPublicOrigin(request);
  return `${baseOrigin}/api/auth/google/callback`;
}

/**
 * Exchanges authorization code for Google access token via POST https://oauth2.googleapis.com/token
 */
export async function exchangeCodeForGoogleTokens(
  code: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Google token exchange failed (${response.status}): ${errorBody}`);
  }

  return (await response.json()) as GoogleTokenResponse;
}

/**
 * Fetches user profile from https://www.googleapis.com/oauth2/v3/userinfo
 */
export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Failed to fetch Google user info (${response.status}): ${errorBody}`);
  }

  return (await response.json()) as GoogleUserInfo;
}
