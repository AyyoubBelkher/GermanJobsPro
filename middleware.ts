import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Protect all admin routes matching /:locale/admin/* except /:locale/admin/login
  const adminRouteRegex = /^\/([^/]+)\/admin(\/.*)?$/;
  const adminMatch = pathname.match(adminRouteRegex);

  if (adminMatch) {
    const locale = adminMatch[1];
    const subPath = adminMatch[2] || "";

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

  // 2. Protect all user dashboard routes matching /:locale/dashboard/*
  const dashboardRouteRegex = /^\/([^/]+)\/dashboard(\/.*)?$/;
  const dashboardMatch = pathname.match(dashboardRouteRegex);

  if (dashboardMatch) {
    const locale = dashboardMatch[1];
    const userSession = request.cookies.get("user_session")?.value;

    if (!userSession || userSession.trim() === "") {
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/:locale/admin/:path*",
    "/:locale/admin",
    "/:locale/dashboard/:path*",
    "/:locale/dashboard",
  ],
};
