"use client";

import React, { useState } from "react";
import Link from "next/link";

interface NavbarProps {
  locale?: string;
}

export default function Navbar({ locale = "ar" }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAr = locale === "ar";
  const isDe = locale === "de";

  const homeLink = `/${locale}`;
  const blogLink = `/${locale}/blog`;
  const dashboardLink = `/${locale}/dashboard`;
  const atsLink = `/${locale}/dashboard/ats-analyzer`;
  const loginLink = `/${locale}/auth/login`;
  const newCvLink = `/${locale}/dashboard/cv/new`;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/85 border-b border-slate-800/80 transition-colors">
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Brand Logo */}
        <Link href={homeLink} className="flex items-center gap-2.5 group shrink-0">
          <div className="flex items-center justify-center p-1.5 rounded-xl bg-blue-500/20 border border-blue-500/30 group-hover:scale-105 transition-transform shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://flagcdn.com/w40/de.png"
              alt="Germany Flag"
              className="w-6 h-4 rounded-xs object-cover shadow-xs"
            />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-100 group-hover:text-blue-400 transition-colors">
            GermanJobs<span className="text-blue-500">Pro</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-slate-300">
          <Link
            href={homeLink}
            className="hover:text-blue-400 transition-colors"
          >
            {isAr ? "الرئيسية" : isDe ? "Startseite" : "Home"}
          </Link>
          <Link
            href={blogLink}
            className="hover:text-blue-400 transition-colors"
          >
            {isAr ? "أحدث الوظائف" : isDe ? "Jobs & Blog" : "Jobs & Blog"}
          </Link>
          <Link
            href={atsLink}
            className="hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            <span className="text-emerald-400">🔍</span>
            <span>{isAr ? "فاحص ATS" : isDe ? "ATS Checker" : "ATS Analyzer"}</span>
          </Link>
          <Link
            href={dashboardLink}
            className="hover:text-blue-400 transition-colors"
          >
            {isAr ? "لوحة التحكم" : isDe ? "Dashboard" : "Dashboard"}
          </Link>
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href={loginLink}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition-all"
          >
            {isAr ? "تسجيل الدخول" : isDe ? "Anmelden" : "Sign In"}
          </Link>

          <Link
            href={newCvLink}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <span>{isAr ? "أنشئ سيرتك الذاتية 🇩🇪" : isDe ? "Lebenslauf erstellen 🇩🇪" : "Create German CV 🇩🇪"}</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 focus:outline-hidden"
          aria-label="Toggle Menu"
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
          dir={isAr ? "rtl" : "ltr"}
          className="md:hidden bg-slate-950 border-b border-slate-800 px-4 py-6 space-y-4 shadow-2xl animate-fadeIn"
        >
          <nav className="flex flex-col space-y-3 text-sm font-semibold text-slate-300">
            <Link
              href={homeLink}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-900 hover:text-blue-400 transition-colors"
            >
              {isAr ? "الرئيسية" : isDe ? "Startseite" : "Home"}
            </Link>
            <Link
              href={blogLink}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-900 hover:text-blue-400 transition-colors"
            >
              {isAr ? "أحدث الوظائف" : isDe ? "Jobs & Blog" : "Jobs & Blog"}
            </Link>
            <Link
              href={atsLink}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-900 text-emerald-400 transition-colors flex items-center gap-2"
            >
              <span>🔍</span>
              <span>{isAr ? "فاحص السيرة (ATS Analyzer)" : isDe ? "ATS Lebenslauf-Checker" : "ATS CV Analyzer"}</span>
            </Link>
            <Link
              href={dashboardLink}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-900 hover:text-blue-400 transition-colors"
            >
              {isAr ? "لوحة التحكم" : isDe ? "Dashboard" : "Dashboard"}
            </Link>
            <Link
              href={loginLink}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-900 hover:text-blue-400 transition-colors"
            >
              {isAr ? "تسجيل الدخول" : isDe ? "Anmelden" : "Sign In"}
            </Link>
          </nav>

          <div className="pt-2 border-t border-slate-800">
            <Link
              href={newCvLink}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs text-center flex items-center justify-center gap-1 shadow-lg shadow-blue-600/20"
            >
              <span>{isAr ? "أنشئ سيرتك الذاتية 🇩🇪" : isDe ? "Lebenslauf erstellen 🇩🇪" : "Create German CV 🇩🇪"}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
