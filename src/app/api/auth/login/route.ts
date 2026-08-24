import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession, revokeUserSession } from "@/lib/user-session";
import { checkRateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Apply IP-based rate limiting (Max 10 attempts per IP per 10 minutes)
  const rateLimitResponse = checkRateLimit(request, AUTH_RATE_LIMITS.LOGIN);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body || {};

    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return NextResponse.json(
        { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة / Invalid credentials" },
        { status: 401 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Generic timing mitigation delay
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json(
        { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة / Invalid credentials" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json(
        { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة / Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "يرجى تأكيد بريدك الإلكتروني للمتابعة / Please verify your email address to continue",
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    const existingToken = cookieStore.get("user_session")?.value;

    if (existingToken) {
      await revokeUserSession(existingToken);
    }

    const session = await createSession(user.id);

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
        message: "تم تسجيل الدخول بنجاح / Logged in successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Auth Login Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
