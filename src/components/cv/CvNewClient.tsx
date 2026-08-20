"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CvNewClientProps {
  locale: string;
}

export default function CvNewClient({ locale }: CvNewClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState("Lebenslauf");
  const [language, setLanguage] = useState("de");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAr = locale === "ar";
  const isDe = locale === "de";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/cv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim() || "Lebenslauf",
          language,
          isDraft: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create CV");
      }

      router.push(`/${locale}/dashboard/cv/${data.cv.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating CV");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-8">
        <div className="space-y-2 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto text-3xl shadow-md">
            🇩🇪
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {isAr ? "إنشاء سيرة ذاتية ألمانية جديدة" : isDe ? "Neuen deutschen Lebenslauf anlegen" : "Create New German CV"}
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {isAr
              ? "اختر عنواناً ولغة لبدء تصميم سيرتك الذاتية وفقاً لمعايير التوظيف DIN 5008."
              : isDe
              ? "Wählen Sie Titel und Sprache für Ihren DIN 5008 konformen Lebenslauf."
              : "Choose title and language to start building your DIN 5008 German resume."}
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-200">
              {isAr ? "عنوان السيرة الذاتية (للتمييز في حسابك)" : isDe ? "Titel des Lebenslaufs" : "CV Title (for your reference)"}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Lebenslauf - Software Engineer (Berlin)"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors text-sm font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-200">
              {isAr ? "لغة السيرة الذاتية" : isDe ? "Sprache des Lebenslaufs" : "CV Language"}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { code: "de", label: "Deutsch (الألمانية)", flag: "🇩🇪" },
                { code: "en", label: "English (الإنجليزية)", flag: "🇬🇧" },
                { code: "ar", label: "العربية (Arabic)", flag: "🇲🇦" },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLanguage(item.code)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    language === item.code
                      ? "bg-blue-600/10 border-blue-500 text-blue-400 font-bold"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span className="text-xl">{item.flag}</span>
                  <span className="text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
              <span>ℹ️</span>
              <span>
                {isAr ? "معيار التوظيف الألماني DIN 5008" : isDe ? "DIN 5008 Standard Hinweis" : "German DIN 5008 Standard"}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isAr
                ? "سيتم ترتيب سيرتك الذاتية بتسلسل زمني عكسي (Antichronologisch) مع أقسام مخصصة للصورة الشخصية، الخبرات المهنية، التعليم، ومستويات اللغات الأوروبية CEFR."
                : isDe
                ? "Ihr Lebenslauf wird automatisch antichronologisch und mit allen erforderlichen Abschnitten nach DIN 5008 strukturiert."
                : "Your CV will be formatted in reverse-chronological order with German standard sections (CEFR language levels, ATS-ready formatting)."}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <Link
              href={`/${locale}/dashboard/cv`}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
            >
              {isAr ? "إلغاء" : isDe ? "Abbrechen" : "Cancel"}
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (isAr ? "جاري الإنشاء..." : isDe ? "Wird erstellt..." : "Creating...") : isAr ? "متابعة وتعبئة البيانات ←" : isDe ? "Weiter zum Editor →" : "Continue to Editor →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
