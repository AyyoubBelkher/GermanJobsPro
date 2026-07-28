import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body || {};

    const expectedPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (!password || typeof password !== "string" || password !== expectedPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "كلمة المرور غير صحيحة / Invalid admin password",
        },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("admin_session", "authenticated", {
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
  } catch (error: any) {
    console.error("[Admin Login Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
