"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function CvEditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CV Editor Error]:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-3xl mb-4">
        📑
      </div>
      <h2 className="text-xl font-bold text-slate-100 mb-2">تعذر فتح محرر السيرة الذاتية</h2>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        {error?.message || "قد تكون السيرة المطلوبة غير موجودة أو حدث خطأ أثناء جلب بياناتها."}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium cursor-pointer"
        >
          إعادة المحاولة
        </button>
        <Link
          href="/dashboard/cv"
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium"
        >
          قائمة السير الذاتية
        </Link>
      </div>
    </div>
  );
}
