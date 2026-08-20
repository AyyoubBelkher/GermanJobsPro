import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/user-session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, name } = body || {};

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

    // Check duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "هذا البريد الإلكتروني مسجل بالفعل / Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(trimmedPassword);
    const userName = typeof name === "string" && name.trim() !== "" ? name.trim() : null;

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: userName,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    const session = await createSession(newUser.id);
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
        message: "تم إنشاء الحساب بنجاح / Account created successfully",
        user: newUser,
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
