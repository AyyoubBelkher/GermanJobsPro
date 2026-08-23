import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashSha256, createSession } from "@/lib/user-session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, code } = body || {};

    if (typeof email !== "string" || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "البريد الإلكتروني ورمز التحقق مطلوبان / Email and verification code are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!normalizedEmail || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json(
        { success: false, error: "رمز التحقق يجب أن يتكون من 6 أرقام / Verification code must be 6 digits" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "المستخدم غير موجود / User not found" },
        { status: 404 }
      );
    }

    // If user is already verified
    if (user.emailVerified) {
      const session = await createSession(user.id);
      const cookieStore = await cookies();
      cookieStore.set("user_session", session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      return NextResponse.json(
        {
          success: true,
          message: "البريد الإلكتروني مؤكد بالفعل / Email already verified",
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
        { status: 200 }
      );
    }

    // Find the latest active verification code
    const latestCode = await prisma.emailVerificationCode.findFirst({
      where: {
        email: normalizedEmail,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestCode) {
      return NextResponse.json(
        {
          success: false,
          error: "رمز التحقق منتهي الصلاحية أو غير موجود. يرجى طلب رمز جديد / Verification code expired or not found. Please request a new code.",
        },
        { status: 400 }
      );
    }

    // Check attempts rate limit
    if (latestCode.attempts >= 5) {
      await prisma.emailVerificationCode.deleteMany({
        where: { email: normalizedEmail },
      });
      return NextResponse.json(
        {
          success: false,
          error: "تم تجاوز الحد الأقصى للمحاولات. يرجى طلب رمز جديد / Too many failed attempts. Please request a new code.",
        },
        { status: 400 }
      );
    }

    const inputCodeHash = hashSha256(cleanCode);

    if (inputCodeHash !== latestCode.codeHash) {
      // Increment attempts
      await prisma.emailVerificationCode.update({
        where: { id: latestCode.id },
        data: { attempts: { increment: 1 } },
      });

      return NextResponse.json(
        {
          success: false,
          error: "رمز التحقق غير صحيح / Invalid verification code",
        },
        { status: 400 }
      );
    }

    // Successful verification
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      }),
      prisma.emailVerificationCode.deleteMany({
        where: { email: normalizedEmail },
      }),
    ]);

    // Create session & set cookie
    const session = await createSession(user.id);
    const cookieStore = await cookies();
    cookieStore.set("user_session", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم تأكيد البريد الإلكتروني بنجاح / Email verified successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Auth Verify Email Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
