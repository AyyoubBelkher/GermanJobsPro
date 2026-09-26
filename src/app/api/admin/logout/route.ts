import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revokeAdminSession } from "@/lib/admin-auth";

async function handleLogout(request?: NextRequest) {
  try {
    let token: string | undefined;

    // 1. Retrieve session token from cookieStore
    try {
      const cookieStore = await cookies();
      token = cookieStore.get("admin_session")?.value;
      cookieStore.set("admin_session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
      cookieStore.delete("admin_session");
    } catch {
      // Ignore if outside cookieStore context
    }

    // 2. Fallback to request cookies or raw Cookie header if available
    if (!token && request) {
      token = request.cookies.get("admin_session")?.value;
      if (!token) {
        const cookieHeader = request.headers.get("cookie") || "";
        const match = cookieHeader.match(/(?:^|;\s*)admin_session=([^;]*)/);
        if (match) {
          token = decodeURIComponent(match[1]);
        }
      }
    }

    // 3. Stateful server-side session invalidation
    if (token) {
      await revokeAdminSession(token);
    }

    const response = NextResponse.json(
      {
        success: true,
        message: "تم تسجيل الخروج بنجاح / Logged out successfully",
      },
      { status: 200 }
    );

    // Explicitly expire the cookie on the response headers
    response.cookies.set("admin_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
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

export async function POST(request: NextRequest) {
  return handleLogout(request);
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

export async function DELETE(request: NextRequest) {
  return handleLogout(request);
}
