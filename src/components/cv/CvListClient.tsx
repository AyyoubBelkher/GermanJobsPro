"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CvMagicImportModal from "@/components/cv/CvMagicImportModal";

interface CvSummary {
  id: string;
  title: string;
  language: string;
  isDraft: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  personalInfo?: {
    fullName: string;
    targetJobTitle?: string | null;
  } | null;
  _count?: {
    experiences?: number;
    educations?: number;
    skills?: number;
  };
}

interface CvListClientProps {
  initialCvs: CvSummary[];
  locale: string;
}

export default function CvListClient({ initialCvs, locale }: CvListClientProps) {
  const router = useRouter();
  const [cvs, setCvs] = useState<CvSummary[]>(initialCvs);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAr = locale === "ar";
  const isDe = locale === "de";

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/cv/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete CV");
      }
      setCvs((prev) => prev.filter((cv) => cv.id !== id));
      setDeletingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error deleting CV");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (cv: CvSummary) => {
    try {
      // Fetch full CV
      const resFull = await fetch(`/api/cv/${cv.id}`);
      const dataFull = await resFull.json();
      if (!resFull.ok || !dataFull.success) {
        throw new Error("Failed to load CV for duplication");
      }

      const fullCv = dataFull.cv;

      // Create new draft
      const resCreate = await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${fullCv.title} (${isAr ? "نسخة" : isDe ? "Kopie" : "Copy"})`,
          language: fullCv.language,
          isDraft: true,
        }),
      });

      const dataCreate = await resCreate.json();
      if (!resCreate.ok || !dataCreate.success) {
        throw new Error("Failed to create duplicated CV");
      }

      const newCvId = dataCreate.cv.id;

      // Sync all contents to the new CV
      await fetch(`/api/cv/${newCvId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${fullCv.title} (${isAr ? "نسخة" : isDe ? "Kopie" : "Copy"})`,
          language: fullCv.language,
          isDraft: true,
          personalInfo: fullCv.personalInfo ? { ...fullCv.personalInfo, id: undefined } : undefined,
          experiences: fullCv.experiences?.map((e: { id?: string }) => ({ ...e, id: undefined })) || [],
          educations: fullCv.educations?.map((e: { id?: string }) => ({ ...e, id: undefined })) || [],
          skills: fullCv.skills?.map((s: { id?: string }) => ({ ...s, id: undefined })) || [],
          languages: fullCv.languages?.map((l: { id?: string }) => ({ ...l, id: undefined })) || [],
          certifications: fullCv.certifications?.map((c: { id?: string }) => ({ ...c, id: undefined })) || [],
          projects: fullCv.projects?.map((p: { id?: string }) => ({ ...p, id: undefined })) || [],
        }),
      });

      router.push(`/${locale}/dashboard/cv/${newCvId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error duplicating CV");
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* High-Converting Magic Import Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-purple-950/60 border border-blue-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 ltr:right-0 rtl:left-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-extrabold uppercase tracking-wider">
              <span>✨ 1-Click Magic Import & ATS Auto-Fix</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {isAr
                ? "لديك سيرة ذاتية جاهزة؟ حولها فوراً إلى المعايير الألمانية DIN 5008"
                : isDe
                ? "Bestehenden Lebenslauf im Handumdrehen nach DIN 5008 optimieren"
                : "Already have a CV? Convert it instantly to German DIN 5008 standard"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isAr
                ? "ارفع ملف PDF بأي لغة، وسيقوم الذكاء الاصطناعي باستخراج بياناتك وترجمتها وصياغتها بأسلوب ألماني احترافي (Substantivstil) متوافق تماماً مع أنظمة ATS."
                : isDe
                ? "PDF hochladen, Daten automatisch extrahieren und mit 1-Klick einen DIN 5008 konformen Lebenslauf im perfekten Substantivstil generieren."
                : "Upload your existing PDF in any language to auto-extract, translate, and reformat into an ATS-friendly German resume."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="shrink-0 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 active:scale-95 transition-all cursor-pointer flex items-center gap-2.5 border border-blue-400/30"
          >
            <span className="text-lg">✨</span>
            <span>{isAr ? "استيراد وتحسين سيرة ذاتية (PDF)" : isDe ? "Lebenslauf magisch importieren" : "1-Click PDF Magic Import"}</span>
          </button>
        </div>
      </div>

      {cvs.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto text-2xl">
            📄
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">
              {isAr ? "لا توجد أي سيرة ذاتية حتى الآن" : isDe ? "Keine Lebensläufe vorhanden" : "No CVs Created Yet"}
            </h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              {isAr
                ? "ابدأ الآن ببناء سيرتك الذاتية وفق معايير التوظيف الألمانية DIN 5008 لتصل إلى مسؤولي التوظيف الألمان."
                : isDe
                ? "Erstellen Sie Ihren ersten deutschen DIN 5008 Lebenslauf mit professionellen Vorlagen."
                : "Create your first DIN 5008 compliant German resume to impress German recruiters."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              <span>✨</span>
              <span>{isAr ? "استيراد سيرة ذاتية سابقة (PDF)" : isDe ? "Bestehende PDF importieren" : "Magic Import (PDF)"}</span>
            </button>
            <Link
              href={`/${locale}/dashboard/cv/new`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all border border-slate-700"
            >
              {isAr ? "+ إنشاء سيرة من الصفر" : isDe ? "+ Neu von Grund auf" : "+ Create From Scratch"}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cvs.map((cv) => (
            <div
              key={cv.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 transition-all shadow-xl flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-extrabold text-white text-lg truncate group-hover:text-blue-400 transition-colors">
                      {cv.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium truncate">
                      {cv.personalInfo?.targetJobTitle || (isAr ? "بدون مسمى وظيفي" : "No target title")}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                      cv.isDraft
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {cv.isDraft ? (isAr ? "مسودة" : isDe ? "Entwurf" : "Draft") : isAr ? "مكتمل" : isDe ? "Fertig" : "Completed"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono uppercase font-bold">
                    {cv.language}
                  </span>
                  <span>•</span>
                  <span>DIN 5008</span>
                  <span>•</span>
                  <span>{new Date(cv.updatedAt).toLocaleDateString(locale)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <Link
                  href={`/${locale}/dashboard/cv/${cv.id}`}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 font-bold text-xs text-center transition-all"
                >
                  {isAr ? "تعديل السيرة" : isDe ? "Bearbeiten" : "Edit CV"}
                </Link>

                <a
                  href={`/api/cv/${cv.id}/pdf`}
                  download
                  title={isAr ? "تحميل PDF رسمي (DIN 5008)" : isDe ? "DIN 5008 PDF herunterladen" : "Download PDF"}
                  className="p-2.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.5V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </a>

                <button
                  type="button"
                  onClick={() => handleDuplicate(cv)}
                  title={isAr ? "نسخ السيرة" : isDe ? "Duplizieren" : "Duplicate"}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v2.25A2.25 2.25 0 0 1 13.5 21.75h-7.5A2.25 2.25 0 0 1 3.75 19.5V7.5a2.25 2.25 0 0 1 2.25-2.25h2.25m3 0h7.5A2.25 2.25 0 0 1 21 7.5v12a2.25 2.25 0 0 1-2.25 2.25h-7.5" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setDeletingId(cv.id)}
                  title={isAr ? "حذف" : isDe ? "Löschen" : "Delete"}
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

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                {isAr ? "تأكيد حذف السيرة الذاتية" : isDe ? "Lebenslauf löschen" : "Confirm Delete CV"}
              </h3>
              <p className="text-sm text-slate-400">
                {isAr
                  ? "هل أنت متأكد من رغبتك في حذف هذه السيرة الذاتية؟ لا يمكن التراجع عن هذا الإجراء."
                  : isDe
                  ? "Sind Sie sicher, dass Sie diesen Lebenslauf unwiderruflich löschen möchten?"
                  : "Are you sure you want to delete this CV? This action cannot be undone."}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
              >
                {isAr ? "إلغاء" : isDe ? "Abbrechen" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (isAr ? "جاري الحذف..." : isDe ? "Wird gelöscht..." : "Deleting...") : isAr ? "حذف نهائي" : isDe ? "Endgültig löschen" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Magic Import & ATS Auto-Fix Modal */}
      <CvMagicImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        locale={locale}
      />
    </div>
  );
}
