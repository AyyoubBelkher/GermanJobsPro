"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

function MobileBottomNavInner() {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();

  // Derive active locale from the first path segment
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const locale: Locale =
    firstSegment && isValidLocale(firstSegment)
      ? (firstSegment as Locale)
      : DEFAULT_LOCALE;

  const isAr = locale === "ar";
  const isDe = locale === "de";
  const isFr = locale === "fr";

  // Tab labels localized
  const homeLabel = isAr ? "الرئيسية" : isDe ? "Start" : isFr ? "Accueil" : "Home";
  const jobsLabel = isAr ? "الوظائف" : isDe ? "Jobs" : isFr ? "Emplois" : "Jobs";
  const cvLabel = isAr ? "سيرة CV" : "CV";
  const germanA1Label = isAr ? "ألمانية A1" : isDe ? "Deutsch A1" : isFr ? "Allemand A1" : "German A1";
  const accountLabel = isAr ? "حسابي" : isDe ? "Konto" : isFr ? "Compte" : "Account";

  // Active tab detection
  const isHomeActive = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isJobsActive = pathname.startsWith(`/${locale}/jobs`);
  const isCvActive = pathname.startsWith(`/${locale}/dashboard/cv`);
  const isGermanA1Active =
    pathname.startsWith(`/${locale}/blog`) &&
    (searchParams.get("category") === "German A1" ||
      searchParams.get("category") === "German+A1");
  const isAccountActive =
    (pathname.startsWith(`/${locale}/dashboard`) && !isCvActive) ||
    pathname.startsWith(`/${locale}/auth`);

  const activeClass = "text-blue-600 dark:text-[#FACC15] font-extrabold";
  const inactiveClass = "text-slate-500 dark:text-slate-400 font-semibold text-[10px]";

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#061838]/95 backdrop-blur-lg border-t border-slate-200 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)] print:hidden"
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-1">
        {/* 1. Home */}
        <Link
          href={`/${locale}`}
          className={`flex flex-col items-center justify-center gap-0.5 text-center transition-all active:scale-95 ${
            isHomeActive ? activeClass : inactiveClass
          }`}
        >
          <svg
            className="w-5 h-5 transition-transform"
            fill="none"
            stroke="currentColor"
            strokeWidth={isHomeActive ? "2.4" : "1.8"}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
          <span className="text-[10px] leading-tight truncate max-w-[64px]">
            {homeLabel}
          </span>
        </Link>

        {/* 2. Jobs */}
        <Link
          href={`/${locale}/jobs`}
          className={`flex flex-col items-center justify-center gap-0.5 text-center transition-all active:scale-95 ${
            isJobsActive ? activeClass : inactiveClass
          }`}
        >
          <svg
            className="w-5 h-5 transition-transform"
            fill="none"
            stroke="currentColor"
            strokeWidth={isJobsActive ? "2.4" : "1.8"}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0"
            />
          </svg>
          <span className="text-[10px] leading-tight truncate max-w-[64px]">
            {jobsLabel}
          </span>
        </Link>

        {/* 3. Center Elevated Action (CV) */}
        <Link
          href={`/${locale}/dashboard/cv`}
          className="flex flex-col items-center justify-center text-center -mt-3.5 group cursor-pointer"
        >
          <div
            className={`-mt-5 w-12 h-12 rounded-2xl bg-[#FACC15] text-[#061838] shadow-lg shadow-amber-500/30 border-2 border-white dark:border-[#061838] flex items-center justify-center font-black transition-transform active:scale-90 group-hover:scale-105 ${
              isCvActive ? "ring-2 ring-blue-500 dark:ring-amber-300 ring-offset-2" : ""
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
          </div>
          <span
            className={`text-[10px] leading-tight mt-1 truncate max-w-[64px] ${
              isCvActive ? activeClass : inactiveClass
            }`}
          >
            {cvLabel}
          </span>
        </Link>

        {/* 4. German A1 */}
        <Link
          href={`/${locale}/blog?category=German+A1`}
          className={`flex flex-col items-center justify-center gap-0.5 text-center transition-all active:scale-95 ${
            isGermanA1Active ? activeClass : inactiveClass
          }`}
        >
          <svg
            className="w-5 h-5 transition-transform"
            fill="none"
            stroke="currentColor"
            strokeWidth={isGermanA1Active ? "2.4" : "1.8"}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
            />
          </svg>
          <span className="text-[10px] leading-tight truncate max-w-[64px]">
            {germanA1Label}
          </span>
        </Link>

        {/* 5. My Account / Dashboard */}
        <Link
          href={`/${locale}/dashboard`}
          className={`flex flex-col items-center justify-center gap-0.5 text-center transition-all active:scale-95 ${
            isAccountActive ? activeClass : inactiveClass
          }`}
        >
          <svg
            className="w-5 h-5 transition-transform"
            fill="none"
            stroke="currentColor"
            strokeWidth={isAccountActive ? "2.4" : "1.8"}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
          <span className="text-[10px] leading-tight truncate max-w-[64px]">
            {accountLabel}
          </span>
        </Link>
      </div>
    </nav>
  );
}

export default function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavInner />
    </Suspense>
  );
}
