"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function AtsAnalyzerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ATS Analyzer Error]:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-2xl mb-4">
        🔍
      </div>
      <h2 className="text-lg font-bold text-slate-100 mb-2">تعذر تشغيل أداة فحص الـ ATS</h2>
      <p className="text-xs text-slate-400 max-w-md mb-6">
        {error?.message || "حدث خطأ أثناء تحميل أداة تحليل السيرة الذاتية."}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer"
        >
          إعادة المحاولة
        </button>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
        >
          لوحة التحكم
        </Link>
      </div>
    </div>
  );
}
