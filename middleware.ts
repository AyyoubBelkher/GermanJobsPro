import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";
import { DEFAULT_LOCALE, isValidLocale, type Locale } from "@/lib/i18n";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Extract the first segment after root
  const segments = pathname.split("/");
  const potentialLocale = segments[1];

  // If path lacks a valid locale prefix or contains an unsupported locale, redirect using a 307 temporary redirect
  if (!potentialLocale || !isValidLocale(potentialLocale)) {
    const targetPath = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}${search}`;
    return NextResponse.redirect(new URL(targetPath, request.url), 307);
  }

  const locale = potentialLocale as Locale;

  // 1. Protect localized admin routes: /:locale/admin/* except /:locale/admin/login
  const localizedAdminMatch = pathname.match(new RegExp(`^/${locale}/admin(/.*)?$`));
  if (localizedAdminMatch) {
    const subPath = localizedAdminMatch[1] || "";
    if (subPath !== "/login") {
      const adminSession = request.cookies.get("admin_session")?.value;
      if (!(await verifySessionToken(adminSession))) {
        const loginUrl = new URL(`/${locale}/admin/login`, request.url);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // 2. Protect localized user dashboard routes: /:locale/dashboard/*
  const localizedDashboardMatch = pathname.match(new RegExp(`^/${locale}/dashboard(/.*)?$`));
  if (localizedDashboardMatch) {
    const userSession = request.cookies.get("user_session")?.value;
    if (!userSession || userSession.trim() === "") {
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If a valid locale prefix is present, allow the request to proceed and pass x-locale in request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", locale);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /_next/* (Next.js internals)
     * - /api/* (API routes)
     * - /images/* (images directory)
     * - *.svg, *.ico, *.png, *.jpg (static files)
     * - robots.txt, sitemap.xml
     */
    "/((?!api|_next|images|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|ico|png|jpg|jpeg)$).*)",
  ],
};
