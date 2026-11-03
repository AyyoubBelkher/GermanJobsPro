"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  getDictionary,
  LOCALE_METADATA,
  LOCALES,
  type Locale,
  isValidLocale,
  DEFAULT_LOCALE,
} from "@/lib/i18n";

export interface NavbarUser {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  plan: string;
  planExpiresAt?: string | Date | null;
  aiCredits: number;
}

interface NavbarProps {
  locale?: string;
  initialUser?: NavbarUser | null;
}

const ORDERED_LOCALES: Locale[] = ['ar', 'de', 'en', 'fr'];

function buildSwitchLocaleUrl(
  pathname: string | null,
  searchParamsString: string | null | undefined,
  targetLocale: Locale
) {
  if (!pathname) return `/${targetLocale}`;
  const segments = pathname.split("/");
  if (isValidLocale(segments[1])) {
    segments[1] = targetLocale;
  } else {
    segments.splice(1, 0, targetLocale);
  }
  const newPath = segments.join("/") || `/${targetLocale}`;
  return `${newPath}${searchParamsString ? `?${searchParamsString}` : ""}`;
}

function setPreferredLocaleCookie(targetLocale: Locale) {
  if (typeof document !== "undefined") {
    document.cookie = `preferred_locale=${targetLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }
}

function LanguageSwitcherDesktop({ activeLocale, isAr }: { activeLocale: Locale; isAr: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const getSwitchLocaleUrl = (targetLocale: Locale) =>
    buildSwitchLocaleUrl(pathname, searchParams?.toString(), targetLocale);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={langDropdownRef}>
      <button
        type="button"
        onClick={() => setLangDropdownOpen(!langDropdownOpen)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0A2552] hover:bg-[#0E3572] text-white text-xs font-bold transition-all cursor-pointer focus:outline-none shadow-xs"
        aria-expanded={langDropdownOpen}
        aria-label="Language selector"
      >
        <svg
          className="w-4 h-4 text-white shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
        <svg
          className={`w-3.5 h-3.5 text-slate-200 transition-transform duration-200 ${
            langDropdownOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {langDropdownOpen && (
        <div
          dir={isAr ? "rtl" : "ltr"}
          className="absolute top-full mt-2 w-48 rounded-2xl bg-white border border-slate-200 text-slate-800 shadow-2xl p-2 z-50 space-y-1 text-xs animate-fadeIn right-0"
        >
          {ORDERED_LOCALES.map((loc) => {
            const meta = LOCALE_METADATA[loc];
            const isActive = loc === activeLocale;
            return (
              <Link
                key={loc}
                href={getSwitchLocaleUrl(loc)}
                onClick={() => {
                  setPreferredLocaleCookie(loc);
                  setLangDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-bold border border-blue-200"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-3 text-blue-600 font-black text-xs shrink-0">{isActive ? "✓" : ""}</span>
                  <span className="font-semibold text-xs">{meta.label}</span>
                </span>
                <span className="text-base leading-none">{meta.flag}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LanguageSwitcherHeaderMobile({
  activeLocale,
  isAr,
  onOpen,
}: {
  activeLocale: Locale;
  isAr: boolean;
  onOpen?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const getSwitchLocaleUrl = (targetLocale: Locale) =>
    buildSwitchLocaleUrl(pathname, searchParams?.toString(), targetLocale);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleToggle = () => {
    setLangDropdownOpen((prev) => {
      const next = !prev;
      if (next && onOpen) {
        onOpen();
      }
      return next;
    });
  };

  return (
    <div className="relative" ref={langDropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#0A2552] text-white text-xs font-bold transition-all cursor-pointer focus:outline-none active:scale-95 shadow-xs"
        aria-expanded={langDropdownOpen}
        aria-label="Language selector"
      >
        <svg
          className="w-4 h-4 text-white shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
        <svg
          className={`w-3 h-3 text-slate-200 transition-transform duration-200 ${
            langDropdownOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {langDropdownOpen && (
        <div
          dir={isAr ? "rtl" : "ltr"}
          className="absolute top-full mt-2 w-48 rounded-2xl bg-white border border-slate-200 text-slate-800 shadow-2xl p-2 z-50 space-y-1 text-xs animate-fadeIn right-0"
        >
          {ORDERED_LOCALES.map((loc) => {
            const meta = LOCALE_METADATA[loc];
            const isActive = loc === activeLocale;
            return (
              <Link
                key={loc}
                href={getSwitchLocaleUrl(loc)}
                onClick={() => {
                  setPreferredLocaleCookie(loc);
                  setLangDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-bold border border-blue-200"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-3 text-blue-600 font-black text-xs shrink-0">{isActive ? "✓" : ""}</span>
                  <span className="font-semibold text-xs">{meta.label}</span>
                </span>
                <span className="text-base leading-none">{meta.flag}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LanguageSwitcherHeaderMobileFallback({ activeLocale }: { activeLocale?: Locale }) {
  return (
    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#0A2552] text-white text-xs font-bold opacity-90">
      <svg
        className="w-4 h-4 text-white shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
      <svg className="w-3 h-3 text-slate-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  );
}

function LanguageSwitcherFallback({ activeLocale }: { activeLocale?: Locale }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0A2552] text-white text-xs font-bold opacity-90">
      <svg
        className="w-4 h-4 text-white shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
      <svg className="w-3.5 h-3.5 text-slate-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  );
}

function LanguageSwitcherMobile({
  activeLocale,
  onSelect,
}: {
  activeLocale: Locale;
  onSelect: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getSwitchLocaleUrl = (targetLocale: Locale) =>
    buildSwitchLocaleUrl(pathname, searchParams?.toString(), targetLocale);

  return (
    <div className="grid grid-cols-2 gap-2">
      {ORDERED_LOCALES.map((loc) => {
        const meta = LOCALE_METADATA[loc];
        const isActive = loc === activeLocale;
        return (
          <Link
            key={loc}
            href={getSwitchLocaleUrl(loc)}
            onClick={() => {
              setPreferredLocaleCookie(loc);
              onSelect();
            }}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isActive
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="text-base">{meta.flag}</span>
              <span>{meta.label}</span>
            </span>
            <span className="text-[10px] font-mono opacity-80">({loc})</span>
          </Link>
        );
      })}
    </div>
  );
}

interface DesktopNavProps {
  homeLink: string;
  jobsLink: string;
  blogLink: string;
  germanA1Link: string;
  atsLink: string;
  dossierLink: string;
  dashboardLink: string;
  pricingLink: string;
  dict: any;
  user: NavbarUser | null;
  activeLocale: Locale;
}

interface MobileNavProps {
  homeLink: string;
  jobsLink: string;
  blogLink: string;
  germanA1Link: string;
  dashboardLink: string;
  cvLink: string;
  atsLink: string;
  dossierLink: string;
  pricingLink: string;
  loginLink: string;
  dict: any;
  user: NavbarUser | null;
  activeLocale: Locale;
  onClose: () => void;
}

function useNavActive(
  blogLink: string,
  homeLink: string,
  jobsLink: string,
  dashboardLink: string,
  atsLink: string,
  dossierLink: string,
  activeLocale: Locale,
  cvLink?: string
) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isGermanA1 =
    Boolean(pathname?.startsWith(blogLink)) &&
    Boolean(searchParams?.get("category")?.toLowerCase().includes("a1"));

  const isBlog =
    Boolean(pathname?.startsWith(blogLink)) &&
    !searchParams?.get("category")?.toLowerCase().includes("a1");

  const isHome =
    pathname === homeLink || (pathname === "/" && activeLocale === DEFAULT_LOCALE);

  const isJobs = Boolean(pathname?.startsWith(jobsLink));
  const isDashboard = pathname === dashboardLink;
  const isAts = Boolean(pathname?.startsWith(atsLink));
  const isDossier = Boolean(pathname?.startsWith(dossierLink));
  const isCv = cvLink ? Boolean(pathname?.startsWith(cvLink)) : false;

  return {
    isHome,
    isJobs,
    isBlog,
    isGermanA1,
    isDashboard,
    isAts,
    dossier: isDossier,
    isDossier,
    isCv,
  };
}

function DesktopNav({
  homeLink,
  jobsLink,
  blogLink,
  germanA1Link,
  atsLink,
  dossierLink,
  dashboardLink,
  pricingLink,
  dict,
  user,
  activeLocale,
}: DesktopNavProps) {
  const isAr = activeLocale === "ar";
  const {
    isHome,
    isJobs,
    isBlog,
    isGermanA1,
    isDashboard,
    isAts,
    isDossier,
  } = useNavActive(
    blogLink,
    homeLink,
    jobsLink,
    dashboardLink,
    atsLink,
    dossierLink,
    activeLocale
  );

  const activeLinkClass =
    "border-b-2 border-amber-400 pb-1 text-slate-950 font-black transition-all whitespace-nowrap text-sm";
  const inactiveLinkClass =
    "border-b-2 border-transparent pb-1 text-slate-700 hover:text-blue-600 font-bold transition-colors whitespace-nowrap text-sm";

  return (
    <nav className={`hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold ${isAr ? "flex-row-reverse" : ""}`}>
      <Link href={homeLink} dir={isAr ? "rtl" : "ltr"} className={isHome ? activeLinkClass : inactiveLinkClass}>
        {dict.nav.home}
      </Link>
      <Link href={`/${activeLocale}#tools-hub`} dir={isAr ? "rtl" : "ltr"} className={inactiveLinkClass}>
        {isAr ? "الأدوات" : (dict.nav.tools || "Tools")}
      </Link>
      <Link href={germanA1Link} dir={isAr ? "rtl" : "ltr"} className={isGermanA1 ? activeLinkClass : inactiveLinkClass}>
        {dict.nav.germanA1}
      </Link>
      <Link href={jobsLink} dir={isAr ? "rtl" : "ltr"} className={isJobs ? activeLinkClass : inactiveLinkClass}>
        {dict.nav.jobs}
      </Link>
      <Link href={blogLink} dir={isAr ? "rtl" : "ltr"} className={isBlog ? activeLinkClass : inactiveLinkClass}>
        {dict.nav.blog}
      </Link>

      {user ? (
        <>
          <Link
            href={atsLink}
            dir={isAr ? "rtl" : "ltr"}
            className={isAts ? activeLinkClass : inactiveLinkClass}
          >
            {dict.nav.atsCheck}
          </Link>
          <Link
            href={dossierLink}
            dir={isAr ? "rtl" : "ltr"}
            className={isDossier ? activeLinkClass : inactiveLinkClass}
          >
            {dict.nav.dossier}
          </Link>
        </>
      ) : null}
    </nav>
  );
}

function DesktopNavFallback({
  homeLink,
  jobsLink,
  blogLink,
  germanA1Link,
  dict,
  activeLocale,
}: DesktopNavProps) {
  const isAr = activeLocale === "ar";
  const inactiveLinkClass =
    "border-b-2 border-transparent pb-1 text-slate-700 hover:text-blue-600 font-bold transition-colors whitespace-nowrap text-sm";

  return (
    <nav className={`hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold ${isAr ? "flex-row-reverse" : ""}`}>
      <Link href={homeLink} dir={isAr ? "rtl" : "ltr"} className="border-b-2 border-amber-400 pb-1 text-slate-950 font-black transition-all whitespace-nowrap text-sm">
        {dict.nav.home}
      </Link>
      <Link href={`/${activeLocale}#tools-hub`} dir={isAr ? "rtl" : "ltr"} className={inactiveLinkClass}>
        {isAr ? "الأدوات" : (dict.nav.tools || "Tools")}
      </Link>
      <Link href={germanA1Link} dir={isAr ? "rtl" : "ltr"} className={inactiveLinkClass}>
        {dict.nav.germanA1}
      </Link>
      <Link href={jobsLink} dir={isAr ? "rtl" : "ltr"} className={inactiveLinkClass}>
        {dict.nav.jobs}
      </Link>
      <Link href={blogLink} dir={isAr ? "rtl" : "ltr"} className={inactiveLinkClass}>
        {dict.nav.blog}
      </Link>
    </nav>
  );
}

function MobileNav({
  homeLink,
  jobsLink,
  blogLink,
  germanA1Link,
  dashboardLink,
  cvLink,
  atsLink,
  dossierLink,
  pricingLink,
  loginLink,
  dict,
  user,
  activeLocale,
  onClose,
}: MobileNavProps) {
  const isAr = activeLocale === "ar";
  const {
    isHome,
    isJobs,
    isBlog,
    isGermanA1,
    isDashboard,
    isAts,
    isDossier,
    isCv,
  } = useNavActive(
    blogLink,
    homeLink,
    jobsLink,
    dashboardLink,
    atsLink,
    dossierLink,
    activeLocale,
    cvLink
  );

  const mobileActiveClass =
    "px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold transition-all whitespace-nowrap";
  const mobileInactiveClass =
    "px-3.5 py-2.5 rounded-xl hover:bg-slate-100 hover:text-blue-600 transition-colors text-slate-700 font-bold whitespace-nowrap";

  return (
    <nav className="flex flex-col space-y-1 text-sm font-semibold">
      <Link
        href={homeLink}
        dir={isAr ? "rtl" : "ltr"}
        onClick={onClose}
        className={isHome ? mobileActiveClass : mobileInactiveClass}
      >
        {dict.nav.home}
      </Link>

      <Link
        href={`/${activeLocale}#tools-hub`}
        dir={isAr ? "rtl" : "ltr"}
        onClick={onClose}
        className={`${mobileInactiveClass} flex items-center gap-2`}
      >
        <span>🛠️</span>
        <span>{activeLocale === "ar" ? "الأدوات" : (dict.nav.tools || "Tools")}</span>
      </Link>

      <Link
        href={jobsLink}
        dir={isAr ? "rtl" : "ltr"}
        onClick={onClose}
        className={`${isJobs ? mobileActiveClass : mobileInactiveClass} flex items-center gap-2`}
      >
        <span>💼</span>
        <span>{dict.nav.jobs}</span>
      </Link>

      <Link
        href={blogLink}
        dir={isAr ? "rtl" : "ltr"}
        onClick={onClose}
        className={`${isBlog ? mobileActiveClass : mobileInactiveClass} flex items-center gap-2`}
      >
        <span>📚</span>
        <span>{dict.nav.blog}</span>
      </Link>

      <Link
        href={germanA1Link}
        dir={isAr ? "rtl" : "ltr"}
        onClick={onClose}
        className={`${isGermanA1 ? mobileActiveClass : mobileInactiveClass} flex items-center gap-2`}
      >
        <span>🇩🇪</span>
        <span>{dict.nav.germanA1}</span>
      </Link>

      {user ? (
        <>
          <Link
            href={dashboardLink}
            dir={isAr ? "rtl" : "ltr"}
            onClick={onClose}
            className={`${isDashboard ? mobileActiveClass : mobileInactiveClass} flex items-center gap-2 font-bold`}
          >
            <span>📊</span>
            <span>{dict.nav.dashboard}</span>
          </Link>

          <Link
            href={cvLink}
            dir={isAr ? "rtl" : "ltr"}
            onClick={onClose}
            className={`${isCv ? mobileActiveClass : mobileInactiveClass} flex items-center gap-2`}
          >
            <span>📄</span>
            <span>{dict.nav.myResumes}</span>
          </Link>

          <Link
            href={atsLink}
            dir={isAr ? "rtl" : "ltr"}
            onClick={onClose}
            className={`${isAts ? mobileActiveClass : mobileInactiveClass} flex items-center gap-2`}
          >
            <span>🔍</span>
            <span>{dict.nav.atsCheck}</span>
          </Link>

          <Link
            href={dossierLink}
            dir={isAr ? "rtl" : "ltr"}
            onClick={onClose}
            className={`${isDossier ? mobileActiveClass : mobileInactiveClass} flex items-center gap-2`}
          >
            <span>📑</span>
            <span>{dict.nav.completeDossier}</span>
          </Link>
        </>
      ) : (
        <>
          <Link
            href={loginLink}
            dir={isAr ? "rtl" : "ltr"}
            onClick={onClose}
            className="px-3.5 py-2.5 rounded-xl hover:bg-slate-100 hover:text-blue-600 transition-colors flex items-center gap-2 text-slate-700 font-bold whitespace-nowrap"
          >
            <span>🔑</span>
            <span>{dict.nav.signIn}</span>
          </Link>
        </>
      )}
    </nav>
  );
}

function MobileNavFallback({
  homeLink,
  jobsLink,
  blogLink,
  germanA1Link,
  dashboardLink,
  cvLink,
  atsLink,
  dossierLink,
  loginLink,
  dict,
  user,
  activeLocale,
  onClose,
}: MobileNavProps) {
  const isAr = activeLocale === "ar";
  const mobileInactiveClass =
    "px-3.5 py-2.5 rounded-xl hover:bg-slate-100 hover:text-blue-600 transition-colors text-slate-700 font-bold whitespace-nowrap";

  return (
    <nav className="flex flex-col space-y-1 text-sm font-semibold">
      <Link href={homeLink} dir={isAr ? "rtl" : "ltr"} onClick={onClose} className={mobileInactiveClass}>
        {dict.nav.home}
      </Link>
      <Link
        href={`/${activeLocale}#tools-hub`}
        dir={isAr ? "rtl" : "ltr"}
        onClick={onClose}
        className={`${mobileInactiveClass} flex items-center gap-2`}
      >
        <span>🛠️</span>
        <span>{isAr ? "الأدوات" : (dict.nav.tools || "Tools")}</span>
      </Link>
      <Link href={jobsLink} dir={isAr ? "rtl" : "ltr"} onClick={onClose} className={`${mobileInactiveClass} flex items-center gap-2`}>
        <span>💼</span>
        <span>{dict.nav.jobs}</span>
      </Link>
      <Link href={blogLink} dir={isAr ? "rtl" : "ltr"} onClick={onClose} className={`${mobileInactiveClass} flex items-center gap-2`}>
        <span>📚</span>
        <span>{dict.nav.blog}</span>
      </Link>
      <Link href={germanA1Link} dir={isAr ? "rtl" : "ltr"} onClick={onClose} className={`${mobileInactiveClass} flex items-center gap-2`}>
        <span>🇩🇪</span>
        <span>{dict.nav.germanA1}</span>
      </Link>
      {user ? (
        <>
          <Link href={dashboardLink} dir={isAr ? "rtl" : "ltr"} onClick={onClose} className={`${mobileInactiveClass} flex items-center gap-2 font-bold`}>
            <span>📊</span>
            <span>{dict.nav.dashboard}</span>
          </Link>
          <Link href={cvLink} dir={isAr ? "rtl" : "ltr"} onClick={onClose} className={`${mobileInactiveClass} flex items-center gap-2`}>
            <span>📄</span>
            <span>{dict.nav.myResumes}</span>
          </Link>
          <Link href={atsLink} dir={isAr ? "rtl" : "ltr"} onClick={onClose} className={`${mobileInactiveClass} flex items-center gap-2`}>
            <span>🔍</span>
            <span>{dict.nav.atsCheck}</span>
          </Link>
          <Link href={dossierLink} dir={isAr ? "rtl" : "ltr"} onClick={onClose} className={`${mobileInactiveClass} flex items-center gap-2`}>
            <span>📑</span>
            <span>{dict.nav.completeDossier}</span>
          </Link>
        </>
      ) : (
        <>
          <Link href={loginLink} dir={isAr ? "rtl" : "ltr"} onClick={onClose} className="px-3.5 py-2.5 rounded-xl hover:bg-slate-100 hover:text-blue-600 transition-colors flex items-center gap-2 text-slate-700 font-bold">
            <span>🔑</span>
            <span>{dict.nav.signIn}</span>
          </Link>
        </>
      )}
    </nav>
  );
}

export default function Navbar({ locale = "ar", initialUser = null }: NavbarProps) {
  const router = useRouter();

  const activeLocale: Locale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(activeLocale);
  const currentLocaleMeta = LOCALE_METADATA[activeLocale];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState<NavbarUser | null>(initialUser);
  const [authChecked, setAuthChecked] = useState(initialUser !== null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAr = activeLocale === "ar";
  const dir = currentLocaleMeta.dir;

  // Sync when initialUser changes
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    }
  }, [initialUser]);

  // Listen to profile updates from UserProfileCard
  useEffect(() => {
    function handleProfileUpdated(event: Event) {
      const customEvent = event as CustomEvent<{ avatarUrl?: string | null; name?: string | null }>;
      if (customEvent.detail) {
        setUser((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ...(customEvent.detail.avatarUrl !== undefined ? { avatarUrl: customEvent.detail.avatarUrl } : {}),
            ...(customEvent.detail.name !== undefined ? { name: customEvent.detail.name } : {}),
          };
        });
      }
    }
    window.addEventListener("user-profile-updated", handleProfileUpdated);
    return () => {
      window.removeEventListener("user-profile-updated", handleProfileUpdated);
    };
  }, []);

  // Check auth session state on mount
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const res = await fetch("/api/user/me", {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
        });

        if (!isMounted) return;

        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setAuthChecked(true);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Close user dropdown on click outside & on Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setUserDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setUserDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setUserDropdownOpen(false);
      setMobileMenuOpen(false);
      router.push(`/${activeLocale}`);
      router.refresh();
    } catch {
      window.location.href = `/${activeLocale}`;
    }
  };

  const isPro =
    (user?.plan === "PRO" || user?.plan === "SPRINT") &&
    (!user.planExpiresAt || new Date(user.planExpiresAt) > new Date());
  const userInitial = user?.name?.trim()?.[0]?.toUpperCase() || user?.email?.trim()?.[0]?.toUpperCase() || "U";
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "User";

  const homeLink = `/${activeLocale}`;
  const jobsLink = `/${activeLocale}/jobs`;
  const blogLink = `/${activeLocale}/blog`;
  const germanA1Link = `/${activeLocale}/blog?category=German+A1`;
  const dashboardLink = `/${activeLocale}/dashboard`;
  const atsLink = `/${activeLocale}/dashboard/ats-analyzer`;
  const dossierLink = `/${activeLocale}/dashboard/dossier`;
  const cvLink = `/${activeLocale}/dashboard/cv`;
  const newCvLink = `/${activeLocale}/dashboard/cv/new`;
  const pricingLink = user ? `/${activeLocale}/dashboard/pricing` : `/${activeLocale}/pricing`;
  const loginLink = `/${activeLocale}/auth/login`;
  const signupLink = `/${activeLocale}/auth/signup`;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-colors">
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4"
        dir="ltr"
      >
        {/* Brand Logo: Graduation-cap & German-colors brand identity */}
        <Link href={homeLink} className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#061838] border border-amber-400/40 group-hover:border-amber-400 shadow-xs group-hover:scale-105 transition-all overflow-hidden shrink-0">
            {/* German flag ribbon on top edge */}
            <div className="absolute top-0 inset-x-0 h-1 flex">
              <span className="w-1/3 bg-[#000000]" />
              <span className="w-1/3 bg-[#DD0000]" />
              <span className="w-1/3 bg-[#FFCC00]" />
            </div>
            <span className="text-lg sm:text-xl transform group-hover:rotate-6 transition-transform">🎓</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black tracking-tight text-[#061838] group-hover:text-blue-700 transition-colors leading-tight">
              GermanJobs<span className="text-amber-500">Pro</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <Suspense
          fallback={
            <DesktopNavFallback
              homeLink={homeLink}
              jobsLink={jobsLink}
              blogLink={blogLink}
              germanA1Link={germanA1Link}
              atsLink={atsLink}
              dossierLink={dossierLink}
              dashboardLink={dashboardLink}
              pricingLink={pricingLink}
              dict={dict}
              user={user}
              activeLocale={activeLocale}
            />
          }
        >
          <DesktopNav
            homeLink={homeLink}
            jobsLink={jobsLink}
            blogLink={blogLink}
            germanA1Link={germanA1Link}
            atsLink={atsLink}
            dossierLink={dossierLink}
            dashboardLink={dashboardLink}
            pricingLink={pricingLink}
            dict={dict}
            user={user}
            activeLocale={activeLocale}
          />
        </Suspense>

        {/* Desktop Actions Area */}
        <div className="hidden sm:flex items-center gap-3">
          {authChecked ? (
            user ? (
              /* AUTHENTICATED STATE */
              <div className="flex items-center gap-2.5 sm:gap-3">
                {/* Plan Badge */}
                {!isPro && (
                  <Link
                    href={pricingLink}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-extrabold border transition-all bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800 shadow-sm shrink-0"
                    title={isAr ? "رصيد الذكاء الاصطناعي (اضغط للترقية)" : "AI Credits (Click to Upgrade)"}
                  >
                    <span>{`⚡ ${user.aiCredits}`}</span>
                  </Link>
                )}

                {/* Quick Dashboard Action */}
                <Link
                  href={dashboardLink}
                  dir={isAr ? "rtl" : "ltr"}
                  className="inline-flex items-center gap-1.5 bg-[#FACC15] hover:bg-amber-300 text-slate-950 font-black rounded-full px-5 py-2.5 shadow-sm text-xs transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                >
                  <span>{isAr ? "لوحة التحكم" : dict.nav.dashboard}</span>
                </Link>

                {/* User Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 transition-all cursor-pointer focus:outline-none shadow-2xs"
                    aria-expanded={userDropdownOpen}
                  >
                    <div
                      className={`w-8 h-8 rounded-full p-[2px] flex items-center justify-center shrink-0 ${
                        isPro
                          ? "bg-gradient-to-tr from-blue-500 via-indigo-400 to-purple-400"
                          : "bg-slate-300"
                      }`}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
                        {user.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{userInitial}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 hidden md:flex">
                      <span className="text-xs font-bold max-w-[100px] truncate">
                        {displayName}
                      </span>
                      {isPro && (
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-300 text-[10px] font-bold">
                          Pro
                        </span>
                      )}
                    </div>
                    <svg className="w-3.5 h-3.5 text-slate-500 ltr:mr-1 rtl:ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {/* Dropdown Menu - Google Pro Style */}
                  {userDropdownOpen && (
                    <div
                      dir={isAr ? "rtl" : "ltr"}
                      className="absolute right-0 top-full mt-2.5 w-80 rounded-3xl bg-[#131722] border border-slate-800/90 shadow-2xl p-4 z-50 space-y-3 text-xs animate-fadeIn"
                    >
                      {/* Google Account Popup Top Header */}
                      <div className="text-center py-2 px-1 border-b border-slate-800/80 pb-4">
                        <div
                          className={`relative w-16 h-16 rounded-full p-[2.5px] mx-auto mb-2 ${
                            isPro
                              ? "bg-gradient-to-tr from-blue-500 via-indigo-400 to-purple-400 shadow-[0_0_15px_rgba(59,130,246,0.35)]"
                              : "bg-slate-700"
                          }`}
                        >
                          <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center border-2 border-[#131722]">
                            {user.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl font-extrabold text-white">{userInitial}</span>
                            )}
                          </div>
                        </div>

                        {/* Pro / Starter Pill Badge */}
                        <div className="flex justify-center mb-1.5">
                          {isPro ? (
                            <div className="inline-flex items-center justify-center px-3 py-0.5 rounded-full bg-[#1e2638] border border-blue-400/30 text-white font-semibold text-[11px] tracking-wide shadow-[0_2px_8px_rgba(59,130,246,0.2)]">
                              Pro
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-medium text-[11px]">
                              Starter
                            </div>
                          )}
                        </div>

                        <p className="font-bold text-white text-sm truncate">{displayName}</p>
                        <p className="text-[11px] text-slate-400 font-sans truncate">{user.email}</p>
                      </div>

                      <div className="space-y-1">
                        <Link
                          href={dashboardLink}
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors whitespace-nowrap"
                        >
                          <span>📊</span>
                          <span>{dict.nav.mainDashboard}</span>
                        </Link>

                        <Link
                          href={cvLink}
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors whitespace-nowrap"
                        >
                          <span>📄</span>
                          <span>{dict.nav.myResumes}</span>
                        </Link>

                        <Link
                          href={dossierLink}
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors whitespace-nowrap"
                        >
                          <span>📑</span>
                          <span>{dict.nav.completeDossier}</span>
                        </Link>

                        <Link
                          href={pricingLink}
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors font-bold whitespace-nowrap"
                        >
                          <svg className="w-4 h-4 shrink-0 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-6 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
                          </svg>
                          <span>{isPro ? (isAr ? "إدارة خطة Pro" : "Manage Pro") : dict.nav.upgradePro}</span>
                        </Link>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer text-start font-semibold"
                        >
                          <span>🚪</span>
                          <span>{dict.nav.signOut}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* GUEST STATE */
              <div className="flex items-center gap-3">
                <Link
                  href={signupLink}
                  className="inline-flex items-center gap-2 bg-[#FACC15] hover:bg-amber-300 text-[#0A2552] font-black rounded-full px-5 py-2.5 shadow-sm text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                >
                  <div className="w-5 h-5 rounded-full bg-[#0A2552] text-[#FACC15] flex items-center justify-center shrink-0 shadow-2xs">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <span>{isAr ? "إنشاء حساب" : dict.nav.createCv}</span>
                </Link>
              </div>
            )
          ) : (
            /* Subtle Skeleton to prevent flash */
            <div className="w-32 h-8 rounded-full bg-slate-100 animate-pulse border border-slate-200" />
          )}

          {/* Language Switcher Dropdown (Desktop) */}
          <Suspense fallback={<LanguageSwitcherFallback activeLocale={activeLocale} />}>
            <LanguageSwitcherDesktop activeLocale={activeLocale} isAr={isAr} />
          </Suspense>
        </div>

        {/* Mobile Header Right (Quick Language Switcher & Menu Toggle) */}
        <div className="lg:hidden flex items-center gap-2">
          {authChecked && !user && (
            <Link
              href={signupLink}
              className="sm:hidden inline-flex items-center gap-1 bg-[#FACC15] hover:bg-amber-300 text-[#0A2552] font-black rounded-full px-3 py-1.5 text-[11px] shadow-xs whitespace-nowrap"
            >
              <span>{isAr ? "إنشاء حساب" : dict.nav.signIn}</span>
            </Link>
          )}

          {/* Quick Language Switcher (visible on mobile viewport < sm) */}
          <div className="sm:hidden">
            <Suspense fallback={<LanguageSwitcherHeaderMobileFallback activeLocale={activeLocale} />}>
              <LanguageSwitcherHeaderMobile
                activeLocale={activeLocale}
                isAr={isAr}
                onOpen={() => setMobileMenuOpen(false)}
              />
            </Suspense>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 focus:outline-none cursor-pointer shadow-2xs"
            aria-label="Toggle Navigation Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          dir={dir}
          className="lg:hidden bg-white/98 border-b border-slate-200 px-4 py-6 space-y-4 shadow-xl backdrop-blur-md animate-fadeIn max-h-[85vh] overflow-y-auto"
        >
          {/* User Status in Mobile */}
          {user && (
            <div className="p-3.5 rounded-2xl bg-[#131722] border border-slate-800 flex items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full p-[2px] shrink-0 ${
                    isPro
                      ? "bg-gradient-to-tr from-blue-500 via-indigo-400 to-purple-400"
                      : "bg-slate-700"
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center border border-[#131722]">
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-white">{userInitial}</span>
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-white text-xs truncate">{displayName}</p>
                    {isPro && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#1e2638] border border-blue-400/30 text-white font-semibold text-[9px]">
                        Pro
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans truncate">{user.email}</p>
                </div>
              </div>
              {!isPro && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold shrink-0 bg-slate-800 text-slate-300 border border-slate-700">
                  {`⚡ ${user.aiCredits}`}
                </span>
              )}
            </div>
          )}

          {/* Mobile Language Switcher Section (at TOP of drawer navigation) */}
          <div className="space-y-2 pb-3 border-b border-slate-200">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
              🌐 {activeLocale === "ar" ? "اللغة / Language" : activeLocale === "de" ? "Sprache wählen" : activeLocale === "fr" ? "Langue" : "Language"}
            </p>
            <Suspense fallback={<div className="h-20 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />}>
              <LanguageSwitcherMobile activeLocale={activeLocale} onSelect={() => setMobileMenuOpen(false)} />
            </Suspense>
          </div>

          {/* Navigation Links */}
          <Suspense
            fallback={
              <MobileNavFallback
                homeLink={homeLink}
                jobsLink={jobsLink}
                blogLink={blogLink}
                germanA1Link={germanA1Link}
                dashboardLink={dashboardLink}
                cvLink={cvLink}
                atsLink={atsLink}
                dossierLink={dossierLink}
                pricingLink={pricingLink}
                loginLink={loginLink}
                dict={dict}
                user={user}
                activeLocale={activeLocale}
                onClose={() => setMobileMenuOpen(false)}
              />
            }
          >
            <MobileNav
              homeLink={homeLink}
              jobsLink={jobsLink}
              blogLink={blogLink}
              germanA1Link={germanA1Link}
              dashboardLink={dashboardLink}
              cvLink={cvLink}
              atsLink={atsLink}
              dossierLink={dossierLink}
              pricingLink={pricingLink}
              loginLink={loginLink}
              dict={dict}
              user={user}
              activeLocale={activeLocale}
              onClose={() => setMobileMenuOpen(false)}
            />
          </Suspense>

          {/* Action CTAs in Mobile */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            {user ? (
              <>
                <Link
                  href={dashboardLink}
                  dir={isAr ? "rtl" : "ltr"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <span>{isAr ? "لوحة التحكم" : dict.nav.dashboard}</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-full bg-slate-50 hover:bg-rose-50 text-rose-600 text-xs font-bold text-center border border-slate-200 transition-all cursor-pointer"
                >
                  {dict.nav.signOut}
                </button>
              </>
            ) : (
              <Link
                href={signupLink}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span>{isAr ? "إنشاء حساب" : dict.nav.createCvFree}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
