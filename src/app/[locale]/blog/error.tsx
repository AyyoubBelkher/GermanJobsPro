"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";

interface BlogErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BlogError({ error, reset }: BlogErrorProps) {
  const params = useParams();
  // Safe extraction of locale, defaulting to Arabic
  const locale = (params?.locale as string) || "ar";

  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error("Blog boundary error:", error);
  }, [error]);

  // Localized messages
  const translations: Record<
    string,
    { title: string; message: string; buttonText: string }
  > = {
    ar: {
      title: "تنبيه: حدث خطأ غير متوقع",
      message: "حدث خطأ أثناء جلب المقالات. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.",
      buttonText: "إعادة المحاولة",
    },
    en: {
      title: "Oops! Something went wrong",
      message: "An error occurred while fetching the blog posts. Please check your connection and try again.",
      buttonText: "Try Again",
    },
    de: {
      title: "Hoppla! Etwas ist schief gelaufen",
      message: "Beim Laden der Blogbeiträge ist ein Fehler aufgetreten. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.",
      buttonText: "Erneut versuchen",
    },
    fr: {
      title: "Oups ! Quelque chose s'est mal passé",
      message: "Une erreur s'est produite lors de la récupération des articles. Veuillez vérifier votre connexion et réessayer.",
      buttonText: "Réessayer",
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

        {/* Digest Info (if present, shown in a clean, subtle format) */}
        {error.digest && (
          <div className="text-[10px] text-slate-600 font-mono select-all">
            ID: {error.digest}
          </div>
        )}

        {/* Retry Button */}
        <button
          onClick={() => reset()}
          className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all duration-300 shadow-lg shadow-blue-900/30 active:scale-[0.98] flex items-center justify-center gap-2"
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
          <span>{current.buttonText}</span>
        </button>
      </div>
    </div>
  );
}
