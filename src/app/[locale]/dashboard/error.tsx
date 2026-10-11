"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Root Error]:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-3xl mb-4">
        ⚠️
      </div>
      <h2 className="text-xl font-bold text-slate-100 mb-2">حدث خطأ غير متوقع / Ein Fehler ist aufgetreten</h2>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        {error?.message || "تعذر تحميل محتوى لوحة التحكم. يرجى المحاولة مرة أخرى."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
        >
          إعادة المحاولة / Erneut versuchen
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs sm:text-sm transition-all"
        >
          الصفحة الرئيسية / Startseite
        </Link>
      </div>
    </div>
  );
}
