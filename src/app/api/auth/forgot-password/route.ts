import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSha256, generateSecureToken } from "@/lib/user-session";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";

// Anti-enumeration generic success message
const GENERIC_SUCCESS_RESPONSE = {
  success: true,
  message:
    "إذا كان البريد الإلكتروني مسجلاً لدينا، فستتلقى رابطاً لإعادة تعيين كلمة المرور / If this email is registered, a password reset link has been sent.",
};

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, AUTH_RATE_LIMITS.FORGOT_PASSWORD);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { email, locale } = body || {};

    if (typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "البريد الإلكتروني مطلوب / Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال بريد إلكتروني صحيح / Please enter a valid email address" },
        { status: 400 }
      );
    }

    // 1. User lookup with error handling
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
    } catch (dbError) {
      console.error("[Forgot Password DB User Lookup Error]:", dbError);
      // In case of DB lookup error, return generic success to avoid 500 & prevent user enumeration
      return NextResponse.json(GENERIC_SUCCESS_RESPONSE, { status: 200 });
    }

    // If user does not exist, return generic success immediately (prevents enumeration)
    if (!user) {
      return NextResponse.json(GENERIC_SUCCESS_RESPONSE, { status: 200 });
    }

    // 2. Token generation, DB persistence, and email dispatch
    try {
      const rawToken = generateSecureToken();
      const tokenHash = hashSha256(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

      // Delete existing reset tokens for this user and store new token in transaction
      await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({
          where: { userId: user.id },
        }),
        prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt,
          },
        }),
      ]);

      // 3. Construct reset URL prioritizing NEXT_PUBLIC_APP_URL
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
      const proto = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
      const headerOrigin = host ? `${proto}://${host}` : undefined;

      let rawOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
      if (!rawOrigin) {
        if (process.env.NODE_ENV !== "production" && (headerOrigin || request.nextUrl?.origin)) {
          rawOrigin = headerOrigin || request.nextUrl?.origin;
        } else {
          rawOrigin =
            process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
            process.env.NEXTAUTH_URL?.trim() ||
            headerOrigin ||
            request.nextUrl?.origin ||
            "https://www.germanjobspro.com";
        }
      }
      const origin = rawOrigin.replace(/\/+$/, "");
      const preferredLocale = typeof locale === "string" && ["ar", "de", "en"].includes(locale) ? locale : "ar";
      const resetUrl = `${origin}/${preferredLocale}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

      // 4. Dispatch reset email with resilient error & fallback handling
      const emailResult = await sendPasswordResetEmail({
        email: normalizedEmail,
        resetUrl,
        locale: preferredLocale,
      });

      if (!emailResult.success) {
        console.error("[Forgot Password Email Provider Error]:", emailResult.error);
      } else if (emailResult.mocked) {
        console.log(`[Forgot Password Email Mocked for ${normalizedEmail}]: ${resetUrl}`);
      }
    } catch (tokenOrEmailError) {
      console.error("[Forgot Password Processing Error]:", tokenOrEmailError);
    }

    // Always return a generic success message to prevent user enumeration
    return NextResponse.json(GENERIC_SUCCESS_RESPONSE, { status: 200 });
  } catch (error: unknown) {
    console.error("[Auth Forgot Password Unexpected Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(GENERIC_SUCCESS_RESPONSE, { status: 200 });
  }
}
