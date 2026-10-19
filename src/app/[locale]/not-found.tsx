"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export default function LocaleNotFound() {
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
      homeBtn: string;
      jobsBtn: string;
    }
  > = {
    ar: {
      badge: "404 - غير موجودة",
      title: "الصفحة المطلوبة غير موجودة",
      description:
        "عذراً، الرابط الذي تحاول الوصول إليه غير صحيح أو قد تم نقل الصفحة. تفضل بزيارة الصفحة الرئيسية أو استكشاف الوظائف المتاحة.",
      homeBtn: "العودة للرئيسية",
      jobsBtn: "تصفح الوظائف الشاغرة",
    },
    de: {
      badge: "404 - Nicht gefunden",
      title: "Seite nicht gefunden",
      description:
        "Entschuldigung, die angeforderte Seite existiert nicht oder wurde verschoben. Kehren Sie zur Startseite zurück oder durchsuchen Sie Stellenangebote.",
      homeBtn: "Zur Startseite",
      jobsBtn: "Stellenangebote",
    },
    en: {
      badge: "404 - Not Found",
      title: "Page Not Found",
      description:
        "Sorry, the page you are looking for does not exist or has been moved. Return to the home page or browse available job openings.",
      homeBtn: "Return Home",
      jobsBtn: "Browse Jobs",
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
        <div className="w-20 h-20 bg-blue-500/10 text-blue-400 rounded-3xl flex items-center justify-center mx-auto border border-blue-500/20 shadow-xl shadow-blue-950/20">
          <span className="text-3xl font-black">404</span>
        </div>

        <div>
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold tracking-wide">
            {current.badge}
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {current.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg mx-auto">
            {current.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto pt-2">
          <Link
            href={`/${locale}`}
            className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all duration-300 shadow-xl shadow-blue-950/40 active:scale-[0.98] flex items-center justify-center"
          >
            {current.homeBtn}
          </Link>

          <Link
            href={`/${locale}/jobs`}
            className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition-all border border-slate-800 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>{current.jobsBtn}</span>
            <span className={dir === "rtl" ? "rotate-180" : ""}>→</span>
          </Link>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
