import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revokeUserSession } from "@/lib/user-session";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_session")?.value;

    if (token) {
      await revokeUserSession(token);
    }

    cookieStore.set("user_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم تسجيل الخروج بنجاح / Logged out successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Auth Logout Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
