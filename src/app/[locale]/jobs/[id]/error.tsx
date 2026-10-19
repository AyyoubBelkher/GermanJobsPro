"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface JobErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function JobDetailError({ error, reset }: JobErrorProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";

  useEffect(() => {
    console.error("[JobDetailError] Job page boundary caught error:", error);
  }, [error]);

  const translations: Record<
    string,
    {
      title: string;
      message: string;
      resetBtn: string;
      backBtn: string;
    }
  > = {
    ar: {
      title: "تعذر تحميل تفاصيل الوظيفة",
      message:
        "نعتذر، حدث خطأ غير متوقع أثناء عرض هذه الوظيفة. قد تكون الوظيفة قد أُزيلت مؤخراً أو هناك مشكلة مؤقتة في الاتصال.",
      resetBtn: "إعادة المحاولة",
      backBtn: "العودة إلى قائمة الوظائف",
    },
    de: {
      title: "Stellenangebot konnte nicht geladen werden",
      message:
        "Entschuldigung, beim Laden dieses Stellenangebots ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut oder durchsuchen Sie weitere Jobs.",
      resetBtn: "Erneut versuchen",
      backBtn: "Zurück zur Jobübersicht",
    },
    en: {
      title: "Unable to load job details",
      message:
        "Sorry, an unexpected error occurred while loading this job offer. It may have expired or there is a temporary network issue.",
      resetBtn: "Try Again",
      backBtn: "Back to Jobs List",
    },
    fr: {
      title: "Impossible de charger les détails de l'offre",
      message:
        "Désolé, une erreur inattendue est survenue lors du chargement de cette offre d'emploi. Veuillez réessayer.",
      resetBtn: "Réessayer",
      backBtn: "Retour à la liste des emplois",
    },
  };

  const current = translations[locale] || translations.ar;
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  return (
    <div
      dir={dir}
      className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-md w-full bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-fade-in backdrop-blur-md">
        {/* Error Icon */}
        <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        {/* Localized Error Texts */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-100">{current.title}</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{current.message}</p>
        </div>

        {/* Reference Digest Badge (Safe, non-sensitive identifier for support lookup) */}
        {error?.digest && (
          <div className="text-[10px] text-slate-500 font-mono select-all">
            Ref: {error.digest}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {/* Retry Button */}
          <button
            onClick={() => reset()}
            className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all duration-300 shadow-lg shadow-blue-900/30 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg
              className="w-4 h-4 animate-pulse"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            <span>{current.resetBtn}</span>
          </button>

          {/* Back to Jobs Link */}
          <Link
            href={`/${locale}/jobs`}
            className="w-full py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all duration-300 border border-slate-700/80 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>{current.backBtn}</span>
            <span className={dir === "rtl" ? "rotate-180" : ""}>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
