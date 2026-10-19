"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export default function JobNotFound() {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const dir = isAr ? "rtl" : "ltr";

  const content: Record<
    string,
    {
      badge: string;
      title: string;
      description: string;
      browseBtn: string;
      homeBtn: string;
    }
  > = {
    ar: {
      badge: "404 - غير متوفرة",
      title: "الوظيفة غير موجودة أو انتهت صلاحيتها",
      description:
        "عذراً، الشاغر الوظيفي الذي تبحث عنه لم يعد متاحاً أو قد تم حذفه من قِبل جهة العمل. يمكنك تصفح مئات الوظائف الحالية الأخرى في ألمانيا.",
      browseBtn: "تصفح جميع الوظائف الشاغرة",
      homeBtn: "العودة للرئيسية",
    },
    de: {
      badge: "404 - Nicht gefunden",
      title: "Stellenangebot nicht mehr verfügbar",
      description:
        "Entschuldigung, die gesuchte Stelle ist nicht mehr verfügbar oder wurde beendet. Entdecken Sie viele weitere aktuelle Jobs in Deutschland.",
      browseBtn: "Alle Stellenangebote ansehen",
      homeBtn: "Zur Startseite",
    },
    en: {
      badge: "404 - Not Found",
      title: "Job Offer No Longer Available",
      description:
        "Sorry, the job posting you are looking for is no longer active or has been removed. Explore hundreds of other verified opportunities in Germany.",
      browseBtn: "Browse All Jobs",
      homeBtn: "Return Home",
    },
  };

  const current = content[locale] || content.ar;

  return (
    <div
      dir={dir}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white"
    >
      <Navbar locale={locale} initialUser={null} />

      <main className="max-w-2xl mx-auto px-4 py-16 sm:py-24 w-full flex-1 flex flex-col items-center justify-center text-center space-y-6">
        {/* Visual Badge Icon */}
        <div className="w-20 h-20 bg-amber-500/10 text-amber-400 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/20 shadow-xl shadow-amber-950/20">
          <svg
            className="w-10 h-10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
            />
          </svg>
        </div>

        {/* Status Tag */}
        <div>
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold tracking-wide">
            {current.badge}
          </span>
        </div>

        {/* Headings */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {current.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg mx-auto">
            {current.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto pt-2">
          <Link
            href={`/${locale}/jobs`}
            className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all duration-300 shadow-xl shadow-blue-950/40 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>{current.browseBtn}</span>
            <span className={dir === "rtl" ? "rotate-180" : ""}>→</span>
          </Link>

          <Link
            href={`/${locale}`}
            className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition-all border border-slate-800 active:scale-[0.98] flex items-center justify-center"
          >
            {current.homeBtn}
          </Link>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
