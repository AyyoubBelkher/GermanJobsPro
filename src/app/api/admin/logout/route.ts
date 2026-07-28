import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");

    return NextResponse.json(
      {
        success: true,
        message: "تم تسجيل الخروج بنجاح / Logged out successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Admin Logout Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
