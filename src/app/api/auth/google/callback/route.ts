import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, revokeUserSession } from "@/lib/user-session";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import {
  getGoogleRedirectUri,
  getPublicOrigin,
  getCookieDomain,
  exchangeCodeForGoogleTokens,
  fetchGoogleUserInfo,
} from "@/lib/google-auth";
import { sendEmail, getWelcomeEmailHtml } from "@/lib/email";

export async function GET(request: NextRequest) {
  const publicOrigin = getPublicOrigin(request);
  const cookieDomain = getCookieDomain(request);

  const searchParams = request.nextUrl.searchParams;
  const oauthError = searchParams.get("error");
  const code = searchParams.get("code");
  const queryState = searchParams.get("state");

  // Read and parse stored state & locale from cookie
  const cookieValue = request.cookies.get("google_oauth_state")?.value;
  let savedState: string | null = null;
  let locale: Locale = DEFAULT_LOCALE;

  if (cookieValue) {
    try {
      const parsed = JSON.parse(cookieValue);
      if (parsed && typeof parsed === "object") {
        savedState = typeof parsed.state === "string" ? parsed.state : null;
        if (parsed.locale && isValidLocale(parsed.locale)) {
          locale = parsed.locale;
        }
      }
    } catch {
      if (cookieValue.includes(":")) {
        const [st, loc] = cookieValue.split(":");
        savedState = st || null;
        if (loc && isValidLocale(loc)) {
          locale = loc;
        }
      } else {
        savedState = cookieValue;
      }
    }
  }

  // Helper to construct error redirect response and clear state cookie
  const createErrorRedirect = (errorCode: string) => {
    const errorUrl = `${publicOrigin}/${locale}/auth/login?error=${encodeURIComponent(errorCode)}`;
    const response = NextResponse.redirect(errorUrl);
    response.cookies.set("google_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });
    return response;
  };

  // If user cancelled or OAuth provider returned an error
  if (oauthError) {
    console.warn("[Google OAuth Callback] OAuth provider error:", oauthError);
    return createErrorRedirect(oauthError === "access_denied" ? "access_denied" : "oauth_error");
  }

  // Validate state against cookie to prevent CSRF
  if (!queryState || !savedState || queryState !== savedState) {
    console.error("[Google OAuth Callback] State parameter mismatch (CSRF suspected)", {
      queryState,
      savedState,
    });
    return createErrorRedirect("invalid_state");
  }

  // Validate code
  if (!code) {
    console.error("[Google OAuth Callback] Missing authorization code");
    return createErrorRedirect("missing_code");
  }

  try {
    const redirectUri = getGoogleRedirectUri(request);

    // Exchange authorization code for Google access token
    const tokenData = await exchangeCodeForGoogleTokens(code, redirectUri);

    // Fetch user profile from Google UserInfo endpoint
    const profile = await fetchGoogleUserInfo(tokenData.access_token);

    if (!profile.email || !profile.sub) {
      console.error("[Google OAuth Callback] Missing email or sub in Google user profile");
      return createErrorRedirect("invalid_profile");
    }

    const normalizedEmail = profile.email.trim().toLowerCase();
    const googleId = profile.sub;
    const displayName = profile.name?.trim() || null;

    // Check if user exists by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email: normalizedEmail }],
      },
    });

    let isNewUser = false;

    if (user) {
      // User exists: link googleId if not linked, ensure emailVerified is true
      const updateData: {
        googleId?: string;
        emailVerified: boolean;
        name?: string;
      } = {
        emailVerified: true,
      };

      if (!user.googleId) {
        updateData.googleId = googleId;
      }
      if (!user.name && displayName) {
        updateData.name = displayName;
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    } else {
      // User does not exist: create new User with email, name, googleId, emailVerified: true, aiCredits: 3, plan: "FREE"
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: displayName,
          googleId,
          emailVerified: true,
          aiCredits: 3,
          plan: "FREE",
        },
      });
      isNewUser = true;

      // Optionally send welcome email via getWelcomeEmailHtml
      try {
        const welcome = getWelcomeEmailHtml({
          name: displayName,
          email: normalizedEmail,
          locale,
        });
        await sendEmail({
          to: normalizedEmail,
          subject: welcome.subject,
          html: welcome.html,
          text: welcome.text,
        });
      } catch (emailErr) {
        console.warn("[Google OAuth Callback] Welcome email notification skipped:", emailErr);
      }
    }

    // Clean up existing session token if present
    const existingToken = request.cookies.get("user_session")?.value;
    if (existingToken) {
      await revokeUserSession(existingToken).catch(() => {});
    }

    // Issue session cookie via createSession(user.id)
    const session = await createSession(user.id);

    // Redirect user to /${locale}/dashboard
    const dashboardUrl = `${publicOrigin}/${locale}/dashboard`;
    const response = NextResponse.redirect(dashboardUrl);

    // Clear google_oauth_state cookie
    response.cookies.set("google_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });

    // Set user_session HTTP-only cookie (30 days)
    response.cookies.set("user_session", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });

    return response;
  } catch (error: unknown) {
    console.error("[Google OAuth Callback Processing Error]:", error instanceof Error ? error.message : error);
    return createErrorRedirect("oauth_failed");
  }
}
