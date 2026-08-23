import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSha256, generateSecureToken } from "@/lib/user-session";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
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

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      // Generate secure 32-byte token
      const rawToken = generateSecureToken();
      const tokenHash = hashSha256(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

      // Delete existing reset tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Store reset token hash
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      // Construct reset URL
      const origin = request.nextUrl.origin || process.env.NEXT_PUBLIC_SITE_URL || "https://germanjobspro.com";
      const preferredLocale = typeof locale === "string" && ["ar", "de", "en"].includes(locale) ? locale : "ar";
      const resetUrl = `${origin}/${preferredLocale}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

      // Dispatch reset email
      sendPasswordResetEmail({
        email: normalizedEmail,
        resetUrl,
        locale: preferredLocale,
      }).catch((err) => {
        console.error("[Forgot Password Email Dispatch Error]:", err);
      });
    }

    // Always return a generic success message to prevent user enumeration
    return NextResponse.json(
      {
        success: true,
        message: "إذا كان البريد الإلكتروني مسجلاً لدينا، فستتلقى رابطاً لإعادة تعيين كلمة المرور / If this email is registered, a password reset link has been sent.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Auth Forgot Password Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
