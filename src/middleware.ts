import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";
import { DEFAULT_LOCALE, isValidLocale, type Locale } from "@/lib/i18n";

function resolvePreferredLocale(request: NextRequest): Locale {
  // 1. Check request.cookies.get("preferred_locale")?.value — if valid, return it
  const cookieLocale = request.cookies.get("preferred_locale")?.value;
  if (cookieLocale && isValidLocale(cookieLocale)) {
    return cookieLocale;
  }

  // 2. Parse request.headers.get("accept-language") in order of q weight
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const candidates = acceptLanguage
      .split(",")
      .map((part) => {
        const [lang, qPart] = part.trim().split(";");
        let q = 1.0;
        if (qPart) {
          const match = qPart.match(/q=([0-9.]+)/);
          if (match) {
            const parsed = parseFloat(match[1]);
            if (!isNaN(parsed)) q = parsed;
          }
        }
        const baseCode = lang.split("-")[0].toLowerCase().trim();
        return { code: baseCode, q };
      })
      .sort((a, b) => b.q - a.q)
      .map((item) => item.code);

    for (const code of candidates) {
      if (isValidLocale(code)) {
        return code;
      }
    }
  }

  // 3. Fallback to DEFAULT_LOCALE ('ar')
  return DEFAULT_LOCALE;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Extract the first segment after root
  const segments = pathname.split("/");
  const potentialLocale = segments[1];

  // Pass through root-level text and sitemap files without locale redirection
  if (
    pathname === "/llms.txt" ||
    pathname === "/llms-full.txt" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // If path lacks a valid locale prefix or contains an unsupported locale, redirect using a 307 temporary redirect
  if (!potentialLocale || !isValidLocale(potentialLocale)) {
    const resolvedLocale = resolvePreferredLocale(request);
    const targetPath = `/${resolvedLocale}${pathname === "/" ? "" : pathname}${search}`;
    const redirectRes = NextResponse.redirect(new URL(targetPath, request.url), 307);
    redirectRes.cookies.set("preferred_locale", resolvedLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return redirectRes;
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
        const res = NextResponse.redirect(loginUrl);
        res.cookies.set("preferred_locale", locale, {
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
          sameSite: "lax",
        });
        return res;
      }
    }
  }

  // 2. Protect localized user dashboard routes: /:locale/dashboard/*
  const localizedDashboardMatch = pathname.match(new RegExp(`^/${locale}/dashboard(/.*)?$`));
  if (localizedDashboardMatch) {
    const userSession = request.cookies.get("user_session")?.value;
    if (!userSession || userSession.trim() === "") {
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.set("preferred_locale", locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return res;
    }
  }

  // If a valid locale prefix is present, allow the request to proceed and pass x-locale in request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", locale);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Remember the user's explicit language choice
  response.cookies.set("preferred_locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /_next/* (Next.js internals)
     * - /api/* (API routes)
     * - /images/* (images directory)
     * - /fonts/* (fonts directory)
     * - *.svg, *.ico, *.png, *.jpg, *.ttf, *.woff, *.woff2 (static files)
     * - robots.txt, sitemap.xml, llms.txt, llms-full.txt
     */
    "/((?!api|_next|images|fonts|robots\\.txt|sitemap\\.xml|llms\\.txt|llms-full\\.txt|.*\\.(?:svg|ico|png|jpg|jpeg|ttf|woff|woff2)$).*)",
  ],
};
