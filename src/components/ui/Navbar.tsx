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
  plan: string;
  planExpiresAt?: string | Date | null;
  aiCredits: number;
}

interface NavbarProps {
  locale?: string;
  initialUser?: NavbarUser | null;
}

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

function LanguageSwitcherDesktop({ activeLocale, isAr }: { activeLocale: Locale; isAr: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const currentLocaleMeta = LOCALE_METADATA[activeLocale];

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
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer focus:outline-none"
        aria-expanded={langDropdownOpen}
        aria-label="Language selector"
      >
        <span className="text-base">{currentLocaleMeta.flag}</span>
        <span className="hidden md:inline">{currentLocaleMeta.label}</span>
        <span className="md:hidden uppercase text-[11px] font-mono">({activeLocale})</span>
        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {langDropdownOpen && (
        <div
          className={`absolute top-full mt-2 w-52 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 space-y-1 text-xs animate-fadeIn ${
            isAr ? "left-0 text-right" : "right-0 text-left"
          }`}
        >
          {LOCALES.map((loc) => {
            const meta = LOCALE_METADATA[loc];
            const isActive = loc === activeLocale;
            return (
              <Link
                key={loc}
                href={getSwitchLocaleUrl(loc)}
                onClick={() => setLangDropdownOpen(false)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{meta.flag}</span>
                  <span>{meta.label}</span>
                </span>
                <span className="text-[11px] font-mono opacity-60">({loc})</span>
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
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer focus:outline-none active:scale-95"
        aria-expanded={langDropdownOpen}
        aria-label="Language selector"
      >
        <svg
          className="w-4 h-4 text-blue-400 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
        <span className="uppercase text-xs font-mono font-bold tracking-wider text-slate-200">
          {activeLocale}
        </span>
        <svg
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            langDropdownOpen ? "rotate-180 text-blue-400" : ""
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
          className={`absolute top-full mt-2 w-48 rounded-2xl bg-slate-900/98 backdrop-blur-2xl border border-slate-800 shadow-2xl p-1.5 z-50 space-y-1 text-xs animate-fadeIn ${
            isAr ? "left-0 text-right" : "right-0 text-left"
          }`}
        >
          {LOCALES.map((loc) => {
            const meta = LOCALE_METADATA[loc];
            const isActive = loc === activeLocale;
            return (
              <Link
                key={loc}
                href={getSwitchLocaleUrl(loc)}
                onClick={() => setLangDropdownOpen(false)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base leading-none">{meta.flag}</span>
                  <span className="font-semibold text-xs">{meta.label}</span>
                </span>
                <span className="text-[11px] font-mono opacity-60 uppercase">({loc})</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LanguageSwitcherHeaderMobileFallback({ activeLocale }: { activeLocale: Locale }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold opacity-80">
      <svg
        className="w-4 h-4 text-blue-400 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
      <span className="uppercase text-xs font-mono font-bold tracking-wider text-slate-200">
        {activeLocale}
      </span>
      <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  );
}

function LanguageSwitcherFallback({ activeLocale }: { activeLocale: Locale }) {
  const meta = LOCALE_METADATA[activeLocale];
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold opacity-80">
      <span className="text-base">{meta.flag}</span>
      <span className="hidden md:inline">{meta.label}</span>
      <span className="md:hidden uppercase text-[11px] font-mono">({activeLocale})</span>
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
      {LOCALES.map((loc) => {
        const meta = LOCALE_METADATA[loc];
        const isActive = loc === activeLocale;
        return (
          <Link
            key={loc}
            href={getSwitchLocaleUrl(loc)}
            onClick={onSelect}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
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
  applicationsLink: string;
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
  applicationsLink: string;
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
  applicationsLink: string,
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
  const isApplications = Boolean(pathname?.startsWith(applicationsLink));
  const isAts = Boolean(pathname?.startsWith(atsLink));
  const isDossier = Boolean(pathname?.startsWith(dossierLink));
  const isCv = cvLink ? Boolean(pathname?.startsWith(cvLink)) : false;

  return {
    isHome,
    isJobs,
    isBlog,
    isGermanA1,
    isDashboard,
    isApplications,
    isAts,
    isDossier,
    isCv,
  };
}

function DesktopNav({
  homeLink,
  jobsLink,
  blogLink,
  germanA1Link,
  applicationsLink,
  atsLink,
  dossierLink,
  dashboardLink,
  pricingLink,
  dict,
  user,
  activeLocale,
}: DesktopNavProps) {
  const {
    isHome,
    isJobs,
    isBlog,
    isGermanA1,
    isDashboard,
    isApplications,
    isAts,
    isDossier,
  } = useNavActive(
    blogLink,
    homeLink,
    jobsLink,
    dashboardLink,
    applicationsLink,
    atsLink,
    dossierLink,
    activeLocale
  );

  const activeClass =
    "px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold transition-all";
  const inactiveClass =
    "px-3 py-1.5 rounded-xl border border-transparent text-slate-300 hover:text-blue-400 hover:bg-slate-900/40 transition-colors";

  return (
    <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-semibold">
      <Link href={homeLink} className={isHome ? activeClass : inactiveClass}>
        {dict.nav.home}
      </Link>
      <Link href={jobsLink} className={`${isJobs ? activeClass : inactiveClass} flex items-center gap-1.5`}>
        <span>💼</span>
        <span>{dict.nav.jobs}</span>
      </Link>
      <Link href={blogLink} className={isBlog ? activeClass : inactiveClass}>
        {dict.nav.blog}
      </Link>
      <Link
        href={germanA1Link}
        className={`${isGermanA1 ? activeClass : inactiveClass} flex items-center gap-1.5`}
      >
        <span>🇩🇪</span>
        <span>{dict.nav.germanA1}</span>
      </Link>

      {user ? (
        <>
          <Link
            href={applicationsLink}
            className={`${isApplications ? activeClass : inactiveClass} flex items-center gap-1.5`}
          >
            <span>💼</span>
            <span>{dict.nav.applications}</span>
          </Link>
          <Link
            href={atsLink}
            className={`${isAts ? activeClass : inactiveClass} flex items-center gap-1`}
          >
            <span>🔍</span>
            <span>{dict.nav.atsCheck}</span>
          </Link>
          <Link
            href={dossierLink}
            className={`${isDossier ? activeClass : inactiveClass} flex items-center gap-1`}
          >
            <span>📑</span>
            <span>{dict.nav.dossier}</span>
          </Link>
          <Link
            href={dashboardLink}
            className={isDashboard ? activeClass : inactiveClass}
          >
            {dict.nav.dashboard}
          </Link>
        </>
      ) : (
        <Link
          href={pricingLink}
          className="px-3 py-1.5 rounded-xl border border-transparent hover:text-amber-300 text-amber-400 transition-colors flex items-center gap-1 font-bold"
        >
          <span>💎</span>
          <span>{dict.nav.pricingAndPro}</span>
        </Link>
      )}
    </nav>
  );
}

function DesktopNavFallback({
  homeLink,
  jobsLink,
  blogLink,
  germanA1Link,
  applicationsLink,
  atsLink,
  dossierLink,
  dashboardLink,
  pricingLink,
  dict,
  user,
}: DesktopNavProps) {
  const inactiveClass =
    "px-3 py-1.5 rounded-xl border border-transparent text-slate-300 hover:text-blue-400 hover:bg-slate-900/40 transition-colors";

  return (
    <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-semibold">
      <Link href={homeLink} className={inactiveClass}>
        {dict.nav.home}
      </Link>
      <Link href={jobsLink} className={`${inactiveClass} flex items-center gap-1.5`}>
        <span>💼</span>
        <span>{dict.nav.jobs}</span>
      </Link>
      <Link href={blogLink} className={inactiveClass}>
        {dict.nav.blog}
      </Link>
      <Link href={germanA1Link} className={`${inactiveClass} flex items-center gap-1.5`}>
        <span>🇩🇪</span>
        <span>{dict.nav.germanA1}</span>
      </Link>

      {user ? (
        <>
          <Link href={applicationsLink} className={`${inactiveClass} flex items-center gap-1.5`}>
            <span>💼</span>
            <span>{dict.nav.applications}</span>
          </Link>
          <Link href={atsLink} className={`${inactiveClass} flex items-center gap-1`}>
            <span>🔍</span>
            <span>{dict.nav.atsCheck}</span>
          </Link>
          <Link href={dossierLink} className={`${inactiveClass} flex items-center gap-1`}>
            <span>📑</span>
            <span>{dict.nav.dossier}</span>
          </Link>
          <Link href={dashboardLink} className={inactiveClass}>
            {dict.nav.dashboard}
          </Link>
        </>
      ) : (
        <Link
          href={pricingLink}
          className="px-3 py-1.5 rounded-xl border border-transparent hover:text-amber-300 text-amber-400 transition-colors flex items-center gap-1 font-bold"
        >
          <span>💎</span>
          <span>{dict.nav.pricingAndPro}</span>
        </Link>
      )}
    </nav>
  );
}

function MobileNav({
  homeLink,
  jobsLink,
  blogLink,
  germanA1Link,
  dashboardLink,
  applicationsLink,
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
  const {
    isHome,
    isJobs,
    isBlog,
    isGermanA1,
    isDashboard,
    isApplications,
    isAts,
    isDossier,
    isCv,
  } = useNavActive(
    blogLink,
    homeLink,
    jobsLink,
    dashboardLink,
    applicationsLink,
    atsLink,
    dossierLink,
    activeLocale,
    cvLink
  );

  const mobileActiveClass =
    "px-3 py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold transition-all";
  const mobileInactiveClass =
    "px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-blue-400 transition-colors text-slate-300";

  return (
    <nav className="flex flex-col space-y-1 text-sm font-semibold">
      <Link
        href={homeLink}
        onClick={onClose}
        className={isHome ? mobileActiveClass : mobileInactiveClass}
      >
        {dict.nav.home}
      </Link>

      <Link
        href={jobsLink}
        onClick={onClose}
        className={`${isJobs ? mobileActiveClass : mobileInactiveClass} flex items-center gap-2`}
      >
        <span>💼</span>
        <span>{dict.nav.jobs}</span>
      </Link>

      <Link
        href={blogLink}
        onClick={onClose}
        className={`${isBlog ? mobileActiveClass : mobileInactiveClass} flex items-center gap-2`}
      >
        <span>📚</span>
        <span>{dict.nav.blog}</span>
      </Link>

      <Link
        href={germanA1Link}
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
            onClick={onClose}
            className={`${isDashboard ? mobileActiveClass : mobileInactiveClass} flex items-center gap-2 font-bold`}
          >
            <span>📊</span>
            <span>{dict.nav.dashboard}</span>
          </Link>

          <Link
            href={applicationsLink}
            onClick={onClose}
            className={`${isApplications ? mobileActiveClass : mobileInactiveClass} flex items-center gap-2`}
          >
            <span>💼</span>
            <span>{dict.nav.applications}</span>
          </Link>

          <Link
            href={cvLink}
            onClick={onClose}
            className={`${isCv ? mobileActiveClass : mobileInactiveClass} flex items-center gap-2`}
          >
            <span>📄</span>
            <span>{dict.nav.myResumes}</span>
          </Link>

          <Link
            href={atsLink}
            onClick={onClose}
            className={`${isAts ? mobileActiveClass : mobileInactiveClass} flex items-center gap-2`}
          >
            <span>🔍</span>
            <span>{dict.nav.atsCheck}</span>
          </Link>

          <Link
            href={dossierLink}
            onClick={onClose}
            className={`${isDossier ? mobileActiveClass : mobileInactiveClass} flex items-center gap-2`}
          >
            <span>📑</span>
            <span>{dict.nav.completeDossier}</span>
          </Link>

          <Link
            href={pricingLink}
            onClick={onClose}
            className="px-3 py-2.5 rounded-xl hover:bg-slate-900 text-amber-400 transition-colors flex items-center gap-2 font-bold"
          >
            <span>💎</span>
            <span>{dict.nav.pricingAndPro}</span>
          </Link>
        </>
      ) : (
        <>
          <Link
            href={pricingLink}
            onClick={onClose}
            className="px-3 py-2.5 rounded-xl hover:bg-slate-900 text-amber-400 transition-colors flex items-center gap-2 font-bold"
          >
            <span>💎</span>
            <span>{dict.nav.pricingAndPro}</span>
          </Link>

          <Link
            href={loginLink}
            onClick={onClose}
            className="px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-blue-400 transition-colors flex items-center gap-2"
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
  applicationsLink,
  cvLink,
  atsLink,
  dossierLink,
  pricingLink,
  loginLink,
  dict,
  user,
  onClose,
}: MobileNavProps) {
  const mobileInactiveClass =
    "px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-blue-400 transition-colors text-slate-300";

  return (
    <nav className="flex flex-col space-y-1 text-sm font-semibold">
      <Link href={homeLink} onClick={onClose} className={mobileInactiveClass}>
        {dict.nav.home}
      </Link>
      <Link href={jobsLink} onClick={onClose} className={`${mobileInactiveClass} flex items-center gap-2`}>
        <span>💼</span>
        <span>{dict.nav.jobs}</span>
      </Link>
      <Link href={blogLink} onClick={onClose} className={`${mobileInactiveClass} flex items-center gap-2`}>
        <span>📚</span>
        <span>{dict.nav.blog}</span>
      </Link>
      <Link href={germanA1Link} onClick={onClose} className={`${mobileInactiveClass} flex items-center gap-2`}>
        <span>🇩🇪</span>
        <span>{dict.nav.germanA1}</span>
      </Link>
      {user ? (
        <>
          <Link href={dashboardLink} onClick={onClose} className={`${mobileInactiveClass} flex items-center gap-2 font-bold`}>
            <span>📊</span>
            <span>{dict.nav.dashboard}</span>
          </Link>
          <Link href={applicationsLink} onClick={onClose} className={`${mobileInactiveClass} flex items-center gap-2`}>
            <span>💼</span>
            <span>{dict.nav.applications}</span>
          </Link>
          <Link href={cvLink} onClick={onClose} className={`${mobileInactiveClass} flex items-center gap-2`}>
            <span>📄</span>
            <span>{dict.nav.myResumes}</span>
          </Link>
          <Link href={atsLink} onClick={onClose} className={`${mobileInactiveClass} flex items-center gap-2`}>
            <span>🔍</span>
            <span>{dict.nav.atsCheck}</span>
          </Link>
          <Link href={dossierLink} onClick={onClose} className={`${mobileInactiveClass} flex items-center gap-2`}>
            <span>📑</span>
            <span>{dict.nav.completeDossier}</span>
          </Link>
          <Link href={pricingLink} onClick={onClose} className="px-3 py-2.5 rounded-xl hover:bg-slate-900 text-amber-400 transition-colors flex items-center gap-2 font-bold">
            <span>💎</span>
            <span>{dict.nav.pricingAndPro}</span>
          </Link>
        </>
      ) : (
        <>
          <Link href={pricingLink} onClick={onClose} className="px-3 py-2.5 rounded-xl hover:bg-slate-900 text-amber-400 transition-colors flex items-center gap-2 font-bold">
            <span>💎</span>
            <span>{dict.nav.pricingAndPro}</span>
          </Link>
          <Link href={loginLink} onClick={onClose} className="px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-blue-400 transition-colors flex items-center gap-2">
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
  const applicationsLink = `/${activeLocale}/dashboard/applications`;
  const atsLink = `/${activeLocale}/dashboard/ats-analyzer`;
  const dossierLink = `/${activeLocale}/dashboard/dossier`;
  const cvLink = `/${activeLocale}/dashboard/cv`;
  const newCvLink = `/${activeLocale}/dashboard/cv/new`;
  const pricingLink = user ? `/${activeLocale}/dashboard/pricing` : `/${activeLocale}/pricing`;
  const loginLink = `/${activeLocale}/auth/login`;
  const signupLink = `/${activeLocale}/auth/signup`;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80 transition-colors">
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4"
        dir={dir}
      >
        {/* Brand Logo */}
        <Link href={homeLink} className="flex items-center gap-2.5 group shrink-0">
          <div className="flex items-center justify-center p-1.5 rounded-xl bg-blue-500/20 border border-blue-500/30 group-hover:scale-105 transition-transform shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://flagcdn.com/w40/de.png"
              alt="Germany Flag"
              className="w-5 sm:w-6 h-3.5 sm:h-4 rounded-xs object-cover shadow-xs"
            />
          </div>
          <span className="text-lg sm:text-xl font-black tracking-tight text-slate-100 group-hover:text-blue-400 transition-colors">
            GermanJobs<span className="text-blue-500">Pro</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <Suspense
          fallback={
            <DesktopNavFallback
              homeLink={homeLink}
              jobsLink={jobsLink}
              blogLink={blogLink}
              germanA1Link={germanA1Link}
              applicationsLink={applicationsLink}
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
            applicationsLink={applicationsLink}
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
        <div className="hidden sm:flex items-center gap-2.5 sm:gap-3">
          {/* Language Switcher Dropdown (Desktop) */}
          <Suspense fallback={<LanguageSwitcherFallback activeLocale={activeLocale} />}>
            <LanguageSwitcherDesktop activeLocale={activeLocale} isAr={isAr} />
          </Suspense>

          {authChecked ? (
            user ? (
              /* AUTHENTICATED STATE */
              <div className="flex items-center gap-2.5 sm:gap-3">
                {/* Plan Badge */}
                <Link
                  href={pricingLink}
                  className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1 transition-all ${
                    isPro
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                      : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700"
                  }`}
                  title={isPro ? "PRO Active" : `AI Credits: ${user.aiCredits}`}
                >
                  <span>{isPro ? "💎 PRO" : `⚡ ${user.aiCredits}`}</span>
                </Link>

                {/* Quick CV Action */}
                <Link
                  href={newCvLink}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <span>✨</span>
                  <span>{dict.nav.newCv}</span>
                </Link>

                {/* User Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all cursor-pointer focus:outline-none"
                    aria-expanded={userDropdownOpen}
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-blue-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      {userInitial}
                    </div>
                    <span className="text-xs font-bold max-w-[100px] truncate hidden md:inline">
                      {displayName}
                    </span>
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div
                      className={`absolute top-full mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 space-y-1 text-xs animate-fadeIn ${
                        isAr ? "left-0 text-right" : "right-0 text-left"
                      }`}
                    >
                      <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                        <p className="font-bold text-white truncate">{displayName}</p>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                      </div>

                      <Link
                        href={dashboardLink}
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <span>📊</span>
                        <span>{dict.nav.mainDashboard}</span>
                      </Link>

                      <Link
                        href={applicationsLink}
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <span>💼</span>
                        <span>{dict.nav.applications}</span>
                      </Link>

                      <Link
                        href={cvLink}
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <span>📄</span>
                        <span>{dict.nav.myResumes}</span>
                      </Link>

                      <Link
                        href={dossierLink}
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <span>📑</span>
                        <span>{dict.nav.completeDossier}</span>
                      </Link>

                      <Link
                        href={pricingLink}
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition-colors"
                      >
                        <span>💎</span>
                        <span>{dict.nav.upgradePro}</span>
                      </Link>

                      <div className="pt-1 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer text-start font-semibold"
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
                  href={loginLink}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition-all"
                >
                  {dict.nav.signIn}
                </Link>

                <Link
                  href={signupLink}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <span>{dict.nav.createCv}</span>
                </Link>
              </div>
            )
          ) : (
            /* Subtle Skeleton to prevent flash */
            <div className="w-32 h-8 rounded-xl bg-slate-900/60 animate-pulse border border-slate-800" />
          )}
        </div>

        {/* Mobile Header Right (Quick Language Switcher & Menu Toggle) */}
        <div className="lg:hidden flex items-center gap-2">
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
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 focus:outline-none cursor-pointer"
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
          className="lg:hidden bg-slate-950/95 border-b border-slate-800 px-4 py-6 space-y-4 shadow-2xl backdrop-blur-2xl animate-fadeIn max-h-[85vh] overflow-y-auto"
        >
          {/* User Status in Mobile */}
          {user && (
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-xs truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{user.email}</p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                  isPro
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {isPro ? "💎 PRO" : `⚡ ${user.aiCredits}`}
              </span>
            </div>
          )}

          {/* Mobile Language Switcher Section (at TOP of drawer navigation) */}
          <div className="space-y-2 pb-3 border-b border-slate-800/80">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              🌐 {activeLocale === "ar" ? "اللغة / Language" : activeLocale === "de" ? "Sprache wählen" : activeLocale === "fr" ? "Langue" : "Language"}
            </p>
            <Suspense fallback={<div className="h-20 rounded-xl bg-slate-900/60 animate-pulse border border-slate-800" />}>
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
                applicationsLink={applicationsLink}
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
              applicationsLink={applicationsLink}
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
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            {user ? (
              <>
                <Link
                  href={newCvLink}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs text-center flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all"
                >
                  <span>✨</span>
                  <span>{dict.nav.newCv}</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-rose-500/10 text-rose-400 text-xs font-bold text-center border border-slate-800 transition-all cursor-pointer"
                >
                  {dict.nav.signOut}
                </button>
              </>
            ) : (
              <Link
                href={signupLink}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs text-center flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all"
              >
                <span>{dict.nav.createCvFree}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
