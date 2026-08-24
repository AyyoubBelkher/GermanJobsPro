import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSha256, generateOtp } from "@/lib/user-session";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Apply IP-based rate limiting (Max 5 requests per IP per hour)
  const rateLimitResponse = checkRateLimit(request, AUTH_RATE_LIMITS.RESEND_CODE);
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

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Prevent Email Enumeration: return 200 OK generic message if user is not found
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: "إذا كان البريد مسجلاً، تم إرسال الرمز بنجاح / If this email is registered, the verification code has been sent",
        },
        { status: 200 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: "البريد الإلكتروني مؤكد بالفعل / Email is already verified" },
        { status: 400 }
      );
    }

    // Check rate limit cooldown (60 seconds)
    const latestCode = await prisma.emailVerificationCode.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: "desc" },
    });

    if (latestCode) {
      const elapsedMs = Date.now() - latestCode.createdAt.getTime();
      const cooldownMs = 60 * 1000;
      if (elapsedMs < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
        return NextResponse.json(
          {
            success: false,
            error: `يرجى الانتظار ${remainingSeconds} ثانية قبل إعادة إرسال الرمز / Please wait ${remainingSeconds}s before requesting a new code`,
            remainingSeconds,
          },
          { status: 429 }
        );
      }
    }

    // Generate new OTP
    const otp = generateOtp();
    const codeHash = hashSha256(otp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete old verification codes
    await prisma.emailVerificationCode.deleteMany({
      where: { email: normalizedEmail },
    });

    // Create new code
    await prisma.emailVerificationCode.create({
      data: {
        email: normalizedEmail,
        codeHash,
        expiresAt,
        attempts: 0,
      },
    });

    // Dispatch verification email
    const preferredLocale = typeof locale === "string" && ["ar", "de", "en"].includes(locale) ? locale : "ar";
    sendVerificationEmail({
      email: normalizedEmail,
      code: otp,
      locale: preferredLocale,
    }).catch((err) => {
      console.error("[Resend Code Email Dispatch Error]:", err);
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم إعادة إرسال رمز التحقق بنجاح / Verification code resent successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Auth Resend Code Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
