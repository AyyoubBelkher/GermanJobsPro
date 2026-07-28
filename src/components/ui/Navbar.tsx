"use client";

import React from "react";
import Link from "next/link";

interface NavbarProps {
  locale?: string;
}

export default function Navbar({ locale = "ar" }: NavbarProps) {
  const isAr = locale === "ar";
  const blogLink = `/${locale}/blog`;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4" dir={isAr ? "rtl" : "ltr"}>
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center p-1.5 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 border border-blue-500/20 group-hover:scale-105 transition-transform">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://flagcdn.com/w40/de.png"
              alt="Germany Flag"
              className="w-6 h-4 rounded-xs object-cover shadow-xs"
            />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            GermanJobs<span className="text-blue-600 dark:text-blue-400">Pro</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-6 sm:gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <Link
            href="/"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            الرئيسية
          </Link>
          <Link
            href={blogLink}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            أحدث الوظائف
          </Link>
        </nav>
      </div>
    </header>
  );
}
