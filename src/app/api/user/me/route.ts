import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserSession } from "@/lib/user-session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_session")?.value;

    const authResult = await verifyUserSession(token);

    if (!authResult) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error: "Unauthenticated",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        authenticated: true,
        user: authResult.user,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[User Me Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
