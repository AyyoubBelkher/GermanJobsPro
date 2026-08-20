"use client";

import React, { useState } from "react";

interface LogoutButtonProps {
  locale?: string;
}

export default function LogoutButton({ locale = "ar" }: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const isAr = locale === "ar";

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = `/${locale}/auth/login`;
    } catch {
      window.location.href = `/${locale}/auth/login`;
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      type="button"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 font-semibold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
    >
      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
      </svg>
      <span>{loading ? (isAr ? "جاري الخروج..." : "Logging out...") : isAr ? "تسجيل الخروج" : "Sign Out"}</span>
    </button>
  );
}
