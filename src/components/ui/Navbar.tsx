"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function Navbar({ locale = "ar", initialUser = null }: NavbarProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState<NavbarUser | null>(initialUser);
  const [authChecked, setAuthChecked] = useState(initialUser !== null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAr = locale === "ar";
  const isDe = locale === "de";
  const dir = isAr ? "rtl" : "ltr";

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

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setUserDropdownOpen(false);
      setMobileMenuOpen(false);
      router.push(`/${locale}`);
      router.refresh();
    } catch {
      window.location.href = `/${locale}`;
    }
  };

  const isPro = user?.plan === "PRO" && (!user.planExpiresAt || new Date(user.planExpiresAt) > new Date());
  const userInitial = user?.name?.trim()?.[0]?.toUpperCase() || user?.email?.trim()?.[0]?.toUpperCase() || "U";
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "User";

  const homeLink = `/${locale}`;
  const jobsLink = `/${locale}/jobs`;
  const blogLink = `/${locale}/blog`;
  const dashboardLink = `/${locale}/dashboard`;
  const atsLink = `/${locale}/dashboard/ats-analyzer`;
  const dossierLink = `/${locale}/dashboard/dossier`;
  const cvLink = `/${locale}/dashboard/cv`;
  const newCvLink = `/${locale}/dashboard/cv/new`;
  const pricingLink = user ? `/${locale}/dashboard/pricing` : `/${locale}/pricing`;
  const loginLink = `/${locale}/auth/login`;
  const signupLink = `/${locale}/auth/signup`;

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
        <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-semibold text-slate-300">
          <Link href={homeLink} className="hover:text-blue-400 transition-colors">
            {isAr ? "الرئيسية" : isDe ? "Startseite" : "Home"}
          </Link>
          <Link href={jobsLink} className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
            <span>💼</span>
            <span>{isAr ? "فرص العمل" : isDe ? "Jobs" : "Jobs"}</span>
          </Link>
          <Link href={blogLink} className="hover:text-blue-400 transition-colors">
            {isAr ? "المقالات" : isDe ? "Blog" : "Blog"}
          </Link>

          {/* Conditional links based on auth */}
          {user ? (
            <>
              <Link href={atsLink} className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                <span className="text-emerald-400">🔍</span>
                <span>{isAr ? "فاحص ATS" : isDe ? "ATS Check" : "ATS Check"}</span>
              </Link>
              <Link href={dossierLink} className="hover:text-amber-400 transition-colors flex items-center gap-1">
                <span className="text-amber-400">📑</span>
                <span>{isAr ? "ملف الترشيح" : isDe ? "Bewerbungsmappe" : "Dossier"}</span>
              </Link>
              <Link href={dashboardLink} className="hover:text-blue-400 transition-colors font-bold text-blue-400">
                {isAr ? "لوحة التحكم" : isDe ? "Dashboard" : "Dashboard"}
              </Link>
            </>
          ) : (
            <Link href={pricingLink} className="hover:text-amber-400 transition-colors flex items-center gap-1 text-amber-400 font-bold">
              <span>💎</span>
              <span>{isAr ? "الأسعار وPRO" : isDe ? "Preise & PRO" : "Pricing & PRO"}</span>
            </Link>
          )}
        </nav>

        {/* Desktop Actions Area */}
        <div className="hidden sm:flex items-center gap-3">
          {authChecked ? (
            user ? (
              /* AUTHENTICATED STATE */
              <div className="flex items-center gap-3">
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <span>✨</span>
                  <span>{isAr ? "+ سيرة جديدة" : isDe ? "+ Neuer CV" : "+ New CV"}</span>
                </Link>

                {/* User Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all cursor-pointer focus:outline-none"
                    aria-expanded={userDropdownOpen}
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
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
                        <span>{isAr ? "لوحة التحكم الرئيسية" : isDe ? "Dashboard Übersicht" : "Main Dashboard"}</span>
                      </Link>

                      <Link
                        href={cvLink}
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <span>📄</span>
                        <span>{isAr ? "سيرتي الذاتية (DIN 5008)" : isDe ? "Meine Lebensläufe" : "My Resumes"}</span>
                      </Link>

                      <Link
                        href={dossierLink}
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <span>📑</span>
                        <span>{isAr ? "ملف الترشيح المتكامل" : isDe ? "Bewerbungsmappe" : "Complete Dossier"}</span>
                      </Link>

                      <Link
                        href={pricingLink}
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition-colors"
                      >
                        <span>💎</span>
                        <span>{isAr ? "ترقية الحساب (PRO)" : isDe ? "Upgrade auf PRO" : "Upgrade to PRO"}</span>
                      </Link>

                      <div className="pt-1 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer text-start font-semibold"
                        >
                          <span>🚪</span>
                          <span>{isAr ? "تسجيل الخروج" : isDe ? "Abmelden" : "Sign Out"}</span>
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
                  {isAr ? "تسجيل الدخول" : isDe ? "Anmelden" : "Sign In"}
                </Link>

                <Link
                  href={signupLink}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <span>{isAr ? "أنشئ سيرتك الذاتية 🇩🇪" : isDe ? "Lebenslauf erstellen 🇩🇪" : "Create German CV 🇩🇪"}</span>
                </Link>
              </div>
            )
          ) : (
            /* Subtle Skeleton to prevent flash */
            <div className="w-32 h-8 rounded-xl bg-slate-900/60 animate-pulse border border-slate-800" />
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 focus:outline-none cursor-pointer"
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

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          dir={dir}
          className="lg:hidden bg-slate-950/95 border-b border-slate-800 px-4 py-6 space-y-4 shadow-2xl backdrop-blur-2xl animate-fadeIn"
        >
          {/* User Status in Mobile */}
          {user && (
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
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

          {/* Navigation Links */}
          <nav className="flex flex-col space-y-1 text-sm font-semibold text-slate-300">
            <Link
              href={homeLink}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-blue-400 transition-colors"
            >
              {isAr ? "الرئيسية" : isDe ? "Startseite" : "Home"}
            </Link>

            <Link
              href={jobsLink}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-blue-400 transition-colors flex items-center gap-2"
            >
              <span>💼</span>
              <span>{isAr ? "فرص العمل (Jobs)" : isDe ? "Jobs in Deutschland" : "Jobs in Germany"}</span>
            </Link>

            <Link
              href={blogLink}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-blue-400 transition-colors flex items-center gap-2"
            >
              <span>📚</span>
              <span>{isAr ? "دليل ومقالات التوظيف" : isDe ? "Ratgeber & Blog" : "Career Blog"}</span>
            </Link>

            {user ? (
              <>
                <Link
                  href={dashboardLink}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl hover:bg-slate-900 text-blue-400 transition-colors flex items-center gap-2 font-bold"
                >
                  <span>📊</span>
                  <span>{isAr ? "لوحة التحكم (Dashboard)" : isDe ? "Dashboard" : "Dashboard"}</span>
                </Link>

                <Link
                  href={cvLink}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition-colors flex items-center gap-2"
                >
                  <span>📄</span>
                  <span>{isAr ? "السير الذاتية (DIN 5008)" : isDe ? "Lebensläufe" : "Resumes"}</span>
                </Link>

                <Link
                  href={atsLink}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl hover:bg-slate-900 text-emerald-400 transition-colors flex items-center gap-2"
                >
                  <span>🔍</span>
                  <span>{isAr ? "فاحص السيرة (ATS Analyzer)" : isDe ? "ATS Lebenslauf-Checker" : "ATS CV Analyzer"}</span>
                </Link>

                <Link
                  href={dossierLink}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl hover:bg-slate-900 text-amber-400 transition-colors flex items-center gap-2"
                >
                  <span>📑</span>
                  <span>{isAr ? "ملف الترشيح (Bewerbungsmappe)" : isDe ? "Bewerbungsmappe" : "Dossier Studio"}</span>
                </Link>

                <Link
                  href={pricingLink}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl hover:bg-slate-900 text-amber-400 transition-colors flex items-center gap-2 font-bold"
                >
                  <span>💎</span>
                  <span>{isAr ? "الترقية والأسعار (PRO)" : isDe ? "Preise & Upgrades (PRO)" : "Pricing & PRO"}</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={pricingLink}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl hover:bg-slate-900 text-amber-400 transition-colors flex items-center gap-2 font-bold"
                >
                  <span>💎</span>
                  <span>{isAr ? "الأسعار والترقية (PRO)" : isDe ? "Preise & Tarife" : "Pricing & PRO"}</span>
                </Link>

                <Link
                  href={loginLink}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-blue-400 transition-colors flex items-center gap-2"
                >
                  <span>🔑</span>
                  <span>{isAr ? "تسجيل الدخول" : isDe ? "Anmelden" : "Sign In"}</span>
                </Link>
              </>
            )}
          </nav>

          {/* Action CTAs in Mobile */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            {user ? (
              <>
                <Link
                  href={newCvLink}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs text-center flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20"
                >
                  <span>✨</span>
                  <span>{isAr ? "+ إنشاء سيرة جديدة" : isDe ? "+ Neuer Lebenslauf" : "+ Create New CV"}</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-rose-500/10 text-rose-400 text-xs font-bold text-center border border-slate-800 transition-all cursor-pointer"
                >
                  {isAr ? "تسجيل الخروج" : isDe ? "Abmelden" : "Sign Out"}
                </button>
              </>
            ) : (
              <Link
                href={signupLink}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs text-center flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20"
              >
                <span>{isAr ? "أنشئ سيرتك الذاتية مجاناً 🇩🇪" : isDe ? "Kostenlos registrieren 🇩🇪" : "Create Free German CV 🇩🇪"}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
