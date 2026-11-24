"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CvMagicImportModal from "@/components/cv/CvMagicImportModal";
import { formatNumericDateUTC } from "@/lib/cv-date-utils";
import { formatBidiInlineText } from "@/lib/courseUtils";
import {
  CV_LIST_PAGE_SIZE,
  filterCvSummaries,
  paginateItems,
} from "@/lib/cv-list-utils";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const isAr = locale === "ar";
  const isDe = locale === "de";
  const isFr = locale === "fr";

  const filteredCvs = useMemo(
    () => filterCvSummaries(cvs, searchQuery),
    [cvs, searchQuery]
  );

  const pagination = useMemo(
    () => paginateItems(filteredCvs, currentPage, CV_LIST_PAGE_SIZE),
    [filteredCvs, currentPage]
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/70 to-slate-900 border border-blue-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 end-0 -me-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-extrabold uppercase tracking-wider">
              <span>{formatBidiInlineText(isAr ? "تكييف ذكي (DIN 5008)" : "1-Click PDF to DIN 5008 Auto-Adapt", isAr)}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {formatBidiInlineText(
                isAr
                  ? "لديك سيرة ذاتية جاهزة؟ حولها فوراً إلى المعايير الألمانية DIN 5008"
                  : isDe
                  ? "Bestehenden Lebenslauf im Handumdrehen nach DIN 5008 optimieren"
                  : "Already have a CV? Convert it instantly to German DIN 5008 standard",
                isAr
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {formatBidiInlineText(
                isAr
                  ? "ارفع ملف PDF بأي لغة، وسيقوم الذكاء الاصطناعي باستخراج بياناتك وترجمتها وصياغتها بأسلوب ألماني احترافي (Substantivstil) متوافق تماماً مع أنظمة ATS."
                  : isDe
                  ? "PDF hochladen, Daten automatisch extrahieren und mit 1-Klick einen DIN 5008 konformen Lebenslauf im perfekten Substantivstil generieren."
                  : "Upload your existing PDF in any language to auto-extract, translate, and reformat into an ATS-friendly German resume.",
                isAr
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="shrink-0 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 active:scale-95 transition-all cursor-pointer flex items-center gap-2.5 border border-blue-400/30"
          >
            <span>
              {formatBidiInlineText(
                isAr ? "تحويل فوري (1-Click PDF)" : isDe ? "1-Klick PDF zu DIN 5008" : "Instant Convert (1-Click PDF)",
                isAr
              )}
            </span>
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
              <span>{formatBidiInlineText(isAr ? "تكييف ذكي (DIN 5008)" : isDe ? "Bestehende PDF anpassen" : "1-Click PDF (DIN 5008)", isAr)}</span>
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
        <div className="space-y-6">
          {/* Client-side Search & Summary Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 rounded-2xl p-3 sm:p-4">
            <div className="relative flex-1">
              <svg
                className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ltr:left-3.5 rtl:right-3.5 pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                aria-label={isAr ? "البحث في السير الذاتية" : isDe ? "Lebensläufe durchsuchen" : isFr ? "Rechercher dans vos CV" : "Search resumes"}
                placeholder={
                  isAr
                    ? "ابحث بعنوان السيرة الذاتية أو المسمى الوظيفي..."
                    : isDe
                    ? "Nach Lebenslauftitel oder Zielposition suchen..."
                    : isFr
                    ? "Rechercher par titre ou poste ciblé..."
                    : "Search by CV title or target job title..."
                }
                className="w-full py-2.5 ltr:pl-10 ltr:pr-9 rtl:pr-10 rtl:pl-9 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-400 text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  aria-label={isAr ? "مسح البحث" : isDe ? "Suche löschen" : "Clear search"}
                  className="absolute top-1/2 -translate-y-1/2 ltr:right-2.5 rtl:left-2.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="text-xs font-semibold text-slate-300 shrink-0 px-1">
              {isAr
                ? `عرض ${pagination.items.length} من ${pagination.totalItems} سيرة`
                : isDe
                ? `${pagination.items.length} von ${pagination.totalItems} Lebensläufen`
                : isFr
                ? `${pagination.items.length} sur ${pagination.totalItems} CV`
                : `Showing ${pagination.items.length} of ${pagination.totalItems} CVs`}
            </div>
          </div>

          {pagination.totalItems === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 space-y-3">
              <p className="text-base font-bold text-white">
                {isAr
                  ? "لا توجد سير ذاتية مطابقة لبحثك"
                  : isDe
                  ? "Keine passenden Lebensläufe gefunden"
                  : isFr
                  ? "Aucun CV correspondant trouvé"
                  : "No matching CVs found"}
              </p>
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {isAr ? "إظهار جميع السير الذاتية" : isDe ? "Alle anzeigen" : isFr ? "Tout afficher" : "Reset search"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pagination.items.map((cv) => (
                <div
                  key={cv.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 transition-all shadow-xl flex flex-col justify-between space-y-6 group"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-extrabold text-white text-lg line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors" dir="auto">
                          {formatBidiInlineText(cv.title, isAr)}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium truncate" dir="auto">
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
                      <time
                        dateTime={new Date(cv.updatedAt).toISOString()}
                        dir="ltr"
                        className="inline-block [unicode-bidi:isolate]"
                      >
                        {formatNumericDateUTC(cv.updatedAt, locale)}
                      </time>
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

          {/* Pagination Controls (WCAG AA high-contrast in light & dark modes) */}
          {pagination.totalPages > 1 && (
            <nav
              aria-label={isAr ? "ترقيم صفحات السير الذاتية" : isDe ? "Lebenslauf-Seitennavigation" : "CV list pagination"}
              className="flex flex-wrap items-center justify-between gap-4 pt-2"
            >
              <p className="text-xs font-semibold text-slate-300">
                {isAr
                  ? `صفحة ${pagination.currentPage} من ${pagination.totalPages}`
                  : isDe
                  ? `Seite ${pagination.currentPage} von ${pagination.totalPages}`
                  : isFr
                  ? `Page ${pagination.currentPage} sur ${pagination.totalPages}`
                  : `Page ${pagination.currentPage} of ${pagination.totalPages}`}
              </p>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, pagination.currentPage - 1))}
                  disabled={pagination.currentPage <= 1}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer bg-slate-900 dark:bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800 hover:text-white disabled:bg-slate-900/50 disabled:text-slate-500 disabled:border-slate-800 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  {isAr ? "السابق" : isDe ? "Zurück" : isFr ? "Précédent" : "Previous"}
                </button>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => {
                  const isActive = pageNum === pagination.currentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      aria-current={isActive ? "page" : undefined}
                      className={`min-w-[36px] h-9 px-2.5 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                        isActive
                          ? "bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/25"
                          : "bg-slate-900 dark:bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer bg-slate-900 dark:bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800 hover:text-white disabled:bg-slate-900/50 disabled:text-slate-500 disabled:border-slate-800 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  {isAr ? "التالي" : isDe ? "Weiter" : isFr ? "Suivant" : "Next"}
                </button>
              </div>
            </nav>
          )}
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
