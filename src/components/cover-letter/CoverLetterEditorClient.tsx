"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface CoverLetterData {
  id: string;
  userId: string;
  cvId?: string | null;
  title: string;
  jobTitle: string;
  companyName: string;
  recipientName?: string | null;
  jobDescriptionRaw?: string | null;
  language: string;
  tone: string;
  generatedContent: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  cv?: {
    id: string;
    title: string;
  } | null;
}

interface CoverLetterEditorClientProps {
  initialCoverLetter: CoverLetterData;
  locale: string;
}

export default function CoverLetterEditorClient({
  initialCoverLetter,
  locale,
}: CoverLetterEditorClientProps) {
  const router = useRouter();
  const [coverLetter, setCoverLetter] = useState<CoverLetterData>(initialCoverLetter);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving" | "error">("saved");
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAr = locale === "ar";
  const isDe = locale === "de";

  const markUnsaved = () => {
    if (saveStatus !== "unsaved") setSaveStatus("unsaved");
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/cover-letters/${coverLetter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: coverLetter.title,
          jobTitle: coverLetter.jobTitle,
          companyName: coverLetter.companyName,
          recipientName: coverLetter.recipientName || null,
          jobDescriptionRaw: coverLetter.jobDescriptionRaw || null,
          language: coverLetter.language,
          tone: coverLetter.tone,
          generatedContent: coverLetter.generatedContent,
          cvId: coverLetter.cvId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update cover letter");
      }

      setSaveStatus("saved");
      router.refresh();
    } catch (err: unknown) {
      setSaveStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Error saving cover letter");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/cover-letters/${coverLetter.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete cover letter");
      }

      router.push(`/${locale}/dashboard/cover-letters`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error deleting cover letter");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter.generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/dashboard/cover-letters`}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            ←
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={coverLetter.title}
                onChange={(e) => {
                  setCoverLetter({ ...coverLetter, title: e.target.value });
                  markUnsaved();
                }}
                className="bg-transparent text-white font-extrabold text-lg sm:text-xl border-b border-transparent hover:border-slate-700 focus:border-purple-500 focus:outline-hidden px-1"
              />
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
                {coverLetter.tone}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              🏢 {coverLetter.companyName} • {coverLetter.jobTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <a
            href={`/api/cover-letters/${coverLetter.id}/pdf`}
            download
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>📥</span>
            <span>{isAr ? "تحميل PDF (DIN 5008)" : isDe ? "DIN 5008 PDF" : "Download PDF"}</span>
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>{copied ? "✓" : "📋"}</span>
            <span>{copied ? (isAr ? "تم النسخ" : "Copied") : isAr ? "نسخ الخطاب" : "Copy"}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>🖨️</span>
            <span>{isAr ? "طباعة" : "Print"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
          >
            {saveStatus === "saving" ? (
              <span>{isAr ? "جاري الحفظ..." : "Saving..."}</span>
            ) : saveStatus === "unsaved" ? (
              <span>{isAr ? "💾 حفظ التغييرات *" : "💾 Save Changes *"}</span>
            ) : (
              <span>{isAr ? "✓ محفوظ" : "✓ Saved"}</span>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {/* Main Content Grid: Editor & Printable Paper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Metadata & Form Controls */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="font-bold text-white text-sm">
            {isAr ? "بيانات الخطاب والمستلم" : isDe ? "Anschreiben Details" : "Letter Details"}
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">{isAr ? "المسمى الوظيفي" : "Job Title"}</label>
            <input
              type="text"
              value={coverLetter.jobTitle}
              onChange={(e) => {
                setCoverLetter({ ...coverLetter, jobTitle: e.target.value });
                markUnsaved();
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-purple-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">{isAr ? "اسم الشركة" : "Company Name"}</label>
            <input
              type="text"
              value={coverLetter.companyName}
              onChange={(e) => {
                setCoverLetter({ ...coverLetter, companyName: e.target.value });
                markUnsaved();
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-purple-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">{isAr ? "اسم المسؤول (Ansprechpartner)" : "Recipient Name"}</label>
            <input
              type="text"
              value={coverLetter.recipientName || ""}
              onChange={(e) => {
                setCoverLetter({ ...coverLetter, recipientName: e.target.value });
                markUnsaved();
              }}
              placeholder="z.B. Frau Schmidt"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-purple-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">{isAr ? "النبرة" : "Tone"}</label>
            <select
              value={coverLetter.tone}
              onChange={(e) => {
                setCoverLetter({ ...coverLetter, tone: e.target.value });
                markUnsaved();
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-purple-500 focus:outline-hidden"
            >
              <option value="professional">Professional / Professionell</option>
              <option value="modern">Modern & Dynamic</option>
              <option value="confident">Confident / Selbstbewusst</option>
            </select>
          </div>

          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-300 space-y-1">
            <p className="font-bold">DIN 5008 German Standard</p>
            <p className="text-[11px] text-slate-400">
              {isAr
                ? "تمت صياغة هذا الخطاب وفقاً لمعايير الخطابات الألمانية الرسمية DIN 5008 مع تركيز على القيمة المضافة للمؤسسة."
                : "Formatiert nach deutscher Geschäftsbriefnorm DIN 5008."}
            </p>
          </div>
        </div>

        {/* Right: Letter Text Editor / Printable Letter */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">
                {isAr ? "محرر نص الخطاب (Anschreiben Text)" : "Cover Letter Body"}
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {coverLetter.generatedContent.length} chars
              </span>
            </div>

            <textarea
              dir="ltr"
              rows={24}
              value={coverLetter.generatedContent}
              onChange={(e) => {
                setCoverLetter({ ...coverLetter, generatedContent: e.target.value });
                markUnsaved();
              }}
              className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 text-sm font-sans leading-relaxed focus:border-purple-500 focus:outline-hidden text-left"
            />
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                {isAr ? "تأكيد حذف خطاب التغطية" : "Confirm Delete"}
              </h3>
              <p className="text-sm text-slate-400">
                {isAr
                  ? "هل أنت متأكد من رغبتك في حذف هذا الخطاب؟"
                  : "Are you sure you want to delete this cover letter?"}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
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
