import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all admin routes matching /:locale/admin/* except /:locale/admin/login
  const adminRouteRegex = /^\/([^/]+)\/admin(\/.*)?$/;
  const match = pathname.match(adminRouteRegex);

  if (match) {
    const locale = match[1];
    const subPath = match[2] || "";

    // Allow /:locale/admin/login
    if (subPath === "/login") {
      return NextResponse.next();
    }

    const adminSession = request.cookies.get("admin_session")?.value;
    if (!(await verifySessionToken(adminSession))) {
      const loginUrl = new URL(`/${locale}/admin/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:locale/admin/:path*", "/:locale/admin"],
};
