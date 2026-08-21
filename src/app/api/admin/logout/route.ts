import { NextResponse } from "next/server";
import { cookies } from "next/headers";

async function handleLogout() {
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
  } catch (error: unknown) {
    console.error("[Admin Logout Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return handleLogout();
}

export async function GET() {
  return handleLogout();
}

export async function DELETE() {
  return handleLogout();
}
