"use client";

import React, { useState } from "react";
import Link from "next/link";

interface CoverLetterSummary {
  id: string;
  title: string;
  jobTitle: string;
  companyName: string;
  language: string;
  tone: string;
  generatedContent: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  cv?: {
    id: string;
    title: string;
  } | null;
}

interface CoverLetterListClientProps {
  initialCoverLetters: CoverLetterSummary[];
  locale: string;
}

export default function CoverLetterListClient({
  initialCoverLetters,
  locale,
}: CoverLetterListClientProps) {
  const [letters, setLetters] = useState<CoverLetterSummary[]>(initialCoverLetters);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAr = locale === "ar";
  const isDe = locale === "de";

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/cover-letters/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete cover letter");
      }
      setLetters((prev) => prev.filter((l) => l.id !== id));
      setDeletingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error deleting cover letter");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}

      {letters.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto text-2xl">
            ✍️
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">
              {isAr ? "لا توجد خطابات تغطية محفوظة" : isDe ? "Keine Anschreiben vorhanden" : "No Cover Letters Yet"}
            </h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              {isAr
                ? "استخدم الذكاء الاصطناعي لتوليد خطاب تقديم احترافي (Anschreiben) متوافق مع معايير DIN 5008 ومخصص لإعلان الوظيفة."
                : isDe
                ? "Generieren Sie mit KI ein DIN 5008 Anschreiben, das perfekt auf Ihre Wunschstelle zugeschnitten ist."
                : "Use AI to generate a DIN 5008 German cover letter tailored to any job vacancy."}
            </p>
          </div>
          <Link
            href={`/${locale}/dashboard/cover-letters/new`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
          >
            {isAr ? "+ توليد أول خطاب تغطية" : isDe ? "+ Erstes Anschreiben generieren" : "+ Generate First Cover Letter"}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {letters.map((letter) => (
            <div
              key={letter.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 transition-all shadow-xl flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-950 text-blue-400 border border-blue-800/60 uppercase">
                      {letter.tone}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(letter.updatedAt).toLocaleDateString(locale)}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-white text-lg truncate group-hover:text-blue-400 transition-colors pt-1">
                    {letter.jobTitle}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400 truncate">
                    🏢 {letter.companyName}
                  </p>
                </div>

                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                  {letter.generatedContent}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <Link
                  href={`/${locale}/dashboard/cover-letters/${letter.id}`}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 font-bold text-xs text-center transition-all"
                >
                  {isAr ? "عرض وتعديل" : isDe ? "Ansehen & Bearbeiten" : "View & Edit"}
                </Link>

                <a
                  href={`/api/cover-letters/${letter.id}/pdf`}
                  download
                  title={isAr ? "تحميل PDF (DIN 5008)" : isDe ? "DIN 5008 PDF herunterladen" : "Download PDF"}
                  className="p-2.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.5V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy(letter.id, letter.generatedContent)}
                  title={isAr ? "نسخ النص" : "Copy Text"}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  {copiedId === letter.id ? (
                    <span className="text-xs text-emerald-400 font-bold">✓</span>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v2.25A2.25 2.25 0 0 1 13.5 21.75h-7.5A2.25 2.25 0 0 1 3.75 19.5V7.5a2.25 2.25 0 0 1 2.25-2.25h2.25m3 0h7.5A2.25 2.25 0 0 1 21 7.5v12a2.25 2.25 0 0 1-2.25 2.25h-7.5" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setDeletingId(letter.id)}
                  title={isAr ? "حذف" : "Delete"}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                {isAr ? "تأكيد حذف خطاب التغطية" : isDe ? "Anschreiben löschen" : "Confirm Delete Cover Letter"}
              </h3>
              <p className="text-sm text-slate-400">
                {isAr
                  ? "هل أنت متأكد من رغبتك في حذف هذا الخطاب؟ لا يمكن التراجع عن هذا الإجراء."
                  : isDe
                  ? "Sind Sie sicher, dass Sie dieses Anschreiben löschen möchten?"
                  : "Are you sure you want to delete this cover letter? This action cannot be undone."}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (isAr ? "جاري الحذف..." : "Deleting...") : isAr ? "حذف" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
