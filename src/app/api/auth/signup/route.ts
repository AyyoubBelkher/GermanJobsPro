import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, hashSha256, generateOtp } from "@/lib/user-session";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, name, locale } = body || {};

    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "البريد الإلكتروني وكلمة المرور مطلوبة / Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال بريد إلكتروني صحيح / Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (trimmedPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل / Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(trimmedPassword);
    const userName = typeof name === "string" && name.trim() !== "" ? name.trim() : null;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      if (existingUser.emailVerified) {
        return NextResponse.json(
          { success: false, error: "هذا البريد الإلكتروني مسجل بالفعل / Email already registered" },
          { status: 409 }
        );
      } else {
        // Update unverified user credentials
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            passwordHash,
            name: userName ?? existingUser.name,
          },
        });
      }
    } else {
      // Create new user with emailVerified = false
      await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name: userName,
          emailVerified: false,
        },
      });
    }

    // Generate 6-digit OTP code
    const otp = generateOtp();
    const codeHash = hashSha256(otp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Remove any previous verification codes for this email
    await prisma.emailVerificationCode.deleteMany({
      where: { email: normalizedEmail },
    });

    // Save new verification code record
    await prisma.emailVerificationCode.create({
      data: {
        email: normalizedEmail,
        codeHash,
        expiresAt,
        attempts: 0,
      },
    });

    // Dispatch verification email asynchronously
    const preferredLocale = typeof locale === "string" && ["ar", "de", "en"].includes(locale) ? locale : "ar";
    sendVerificationEmail({
      email: normalizedEmail,
      code: otp,
      locale: preferredLocale,
    }).catch((err) => {
      console.error("[Signup Email Dispatch Error]:", err);
    });

    return NextResponse.json(
      {
        success: true,
        requiresVerification: true,
        email: normalizedEmail,
        message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني / Verification code sent to your email",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[Auth Signup Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
