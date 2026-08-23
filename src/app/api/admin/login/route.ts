import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionToken, timingSafeCompare, verifySessionToken } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body || {};

    const expectedEmail = process.env.ADMIN_EMAIL;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedPassword || !expectedEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Server misconfiguration",
        },
        { status: 500 }
      );
    }

    const isEmailValid =
      typeof email === "string" &&
      timingSafeCompare(email.trim().toLowerCase(), expectedEmail.trim().toLowerCase());
    const isPasswordValid =
      typeof password === "string" && timingSafeCompare(password, expectedPassword);

    if (!email || !password || !isEmailValid || !isPasswordValid) {
      await new Promise((r) => setTimeout(r, 1000));
      return NextResponse.json(
        {
          success: false,
          error: "البريد الإلكتروني أو كلمة المرور غير صحيحة / Invalid credentials",
        },
        { status: 401 }
      );
    }

    const sessionToken = await createSessionToken();
    const cookieStore = await cookies();
    cookieStore.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days session
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم تسجيل الدخول بنجاح / Logged in successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Admin Login Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session")?.value;

    if (!sessionToken || !(await verifySessionToken(sessionToken))) {
      return NextResponse.json(
        {
          authenticated: false,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        authenticated: true,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        authenticated: false,
      },
      { status: 401 }
    );
  }
}
