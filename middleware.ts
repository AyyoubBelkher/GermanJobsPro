import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Protect all admin routes: /:locale/admin/* and /admin/* except /login
  const localizedAdminMatch = pathname.match(/^\/([^/]+)\/admin(\/.*)?$/);
  const rootAdminMatch = pathname.match(/^\/admin(\/.*)?$/);

  if (localizedAdminMatch || rootAdminMatch) {
    const locale = localizedAdminMatch ? localizedAdminMatch[1] : "ar";
    const subPath = localizedAdminMatch ? localizedAdminMatch[2] || "" : rootAdminMatch![1] || "";

    // Allow login route
    if (subPath === "/login") {
      return NextResponse.next();
    }

    const adminSession = request.cookies.get("admin_session")?.value;
    if (!(await verifySessionToken(adminSession))) {
      const loginUrl = new URL(`/${locale}/admin/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Protect all user dashboard routes: /:locale/dashboard/* and /dashboard/*
  const localizedDashboardMatch = pathname.match(/^\/([^/]+)\/dashboard(\/.*)?$/);
  const rootDashboardMatch = pathname.match(/^\/dashboard(\/.*)?$/);

  if (localizedDashboardMatch || rootDashboardMatch) {
    const locale = localizedDashboardMatch ? localizedDashboardMatch[1] : "ar";
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
    "/admin/:path*",
    "/admin",
    "/:locale/dashboard/:path*",
    "/:locale/dashboard",
    "/dashboard/:path*",
    "/dashboard",
  ],
};
