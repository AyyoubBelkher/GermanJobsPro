import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import { getGoogleRedirectUri, getPublicOrigin, getCookieDomain } from "@/lib/google-auth";

export async function GET(request: NextRequest) {
  const publicOrigin = getPublicOrigin(request);

  try {
    const rawLocale = request.nextUrl.searchParams.get("locale") || "";
    const locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId || clientId.trim() === "") {
      console.error("[Google OAuth Error]: GOOGLE_CLIENT_ID is not configured");
      return NextResponse.redirect(
        `${publicOrigin}/${locale}/auth/login?error=missing_google_client_id`
      );
    }

    const redirectUri = getGoogleRedirectUri(request);

    // Generate cryptographically secure state parameter
    const state = crypto.randomBytes(16).toString("hex");

    // Construct Google OAuth URL
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId.trim());
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("state", state);
    googleAuthUrl.searchParams.set("prompt", "select_account");

    const response = NextResponse.redirect(googleAuthUrl.toString());

    // Store state and requested locale in an HTTP-only secure cookie (google_oauth_state, maxAge 10 mins)
    const cookiePayload = JSON.stringify({ state, locale });
    const cookieDomain = getCookieDomain(request);

    response.cookies.set("google_oauth_state", cookiePayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60, // 10 minutes
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });

    return response;
  } catch (error: unknown) {
    console.error("[Google OAuth Init Error]:", error instanceof Error ? error.message : error);
    return NextResponse.redirect(
      `${publicOrigin}/ar/auth/login?error=oauth_init_failed`
    );
  }
}
