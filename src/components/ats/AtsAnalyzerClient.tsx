"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AtsAnalysisResult } from "@/lib/gemini";
import UpgradeModal from "@/components/pricing/UpgradeModal";

interface CvOption {
  id: string;
  title: string;
  language: string;
}

interface AtsAnalyzerClientProps {
  userCvs: CvOption[];
  locale: string;
  initialJobDescription?: string;
}

export default function AtsAnalyzerClient({
  userCvs,
  locale,
  initialJobDescription = "",
}: AtsAnalyzerClientProps) {
  const router = useRouter();
  const isAr = locale === "ar";
  const isDe = locale === "de";

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<"saved" | "paste" | "upload">(
    userCvs.length > 0 ? "saved" : "upload"
  );
  const [selectedCvId, setSelectedCvId] = useState<string>(userCvs[0]?.id || "");
  const [cvText, setCvText] = useState("");
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [language, setLanguage] = useState(locale || "de");

  // Magic Import / Auto-Fix states
  const [isMagicImporting, setIsMagicImporting] = useState(false);
  const [magicImportError, setMagicImportError] = useState<string | null>(null);

  // PDF Upload states
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedCharCount, setUploadedCharCount] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AtsAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Interactive Keywords states
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);
  const [addedKeywords, setAddedKeywords] = useState<string[]>([]);

  // Inline CV Text Editor states
  const [isEditingText, setIsEditingText] = useState(false);
  const textEditorRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    setError(null);

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setUploadError(isAr ? "يرجى رفع ملف بصيغة PDF فقط (.pdf)" : "Please upload a valid PDF file (.pdf)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError(isAr ? "حجم الملف يتجاوز الحد الأقصى 5 ميغابايت" : "File size exceeds 5MB limit");
      return;
    }

    setIsUploadingPdf(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/cv/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to extract text from PDF");
      }

      setCvText(data.text);
      setUploadedFileName(data.filename);
      setUploadedCharCount(data.charCount);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Error uploading PDF");
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (inputMode === "saved" && !selectedCvId) {
      setError(isAr ? "يرجى اختيار سيرة ذاتية من القائمة" : "Please select a CV from the list");
      return;
    }

    if ((inputMode === "paste" || inputMode === "upload") && cvText.trim().length < 30) {
      setError(
        isAr
          ? "يرجى رفع ملف PDF يحتوي على نص أو لصق سيرة ذاتية لا تقل عن 30 حرفاً"
          : "Please upload a text-containing PDF or paste at least 30 characters of CV text"
      );
      return;
    }

    setIsAnalyzing(true);

    try {
      const payload = {
        cvId: inputMode === "saved" ? selectedCvId : undefined,
        cvText: inputMode === "paste" || inputMode === "upload" ? cvText.trim() : undefined,
        jobDescription: jobDescription.trim() || undefined,
        language,
      };

      const res = await fetch("/api/ai/analyze-cv-ats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.status === 402 || data.error === "INSUFFICIENT_CREDITS" || data.outOfCredits) {
        setShowUpgradeModal(true);
        setIsAnalyzing(false);
        return;
      }
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze CV");
      }

      setAnalysis(data.analysis);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error analyzing CV");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyKeyword = (kw: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(kw);
      setCopiedKeyword(kw);
      setTimeout(() => {
        setCopiedKeyword((current) => (current === kw ? null : current));
      }, 2000);
    }
  };

  const handleAddKeywordToText = (kw: string) => {
    if (addedKeywords.includes(kw)) return;
    setCvText((prev) => {
      const sectionHeader = "Fähigkeiten & Fachbegriffe:";
      if (prev.includes(sectionHeader)) {
        return prev.replace(sectionHeader, `${sectionHeader}\n• ${kw}`);
      } else {
        const cleanPrev = prev.trim();
        return cleanPrev ? `${cleanPrev}\n\n${sectionHeader}\n• ${kw}\n` : `${sectionHeader}\n• ${kw}\n`;
      }
    });
    setAddedKeywords((prev) => [...prev, kw]);
  };

  const openTextEditor = () => {
    setIsEditingText(true);
    setTimeout(() => {
      textEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleMagicImport = async () => {
    if (!cvText || cvText.trim().length < 30) {
      setMagicImportError(
        isAr
          ? "نص السيرة الذاتية غير كافٍ للإصلاح والتوليد."
          : isDe
          ? "Der Lebenslauftext ist zu kurz für die Optimierung."
          : "CV text is too short for auto-fix."
      );
      return;
    }

    setIsMagicImporting(true);
    setMagicImportError(null);

    try {
      const res = await fetch("/api/cv/magic-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText: cvText.trim(),
          targetJobTitle: undefined,
          locale,
        }),
      });

      const data = await res.json();
      if (res.status === 402 || data.error === "INSUFFICIENT_CREDITS" || data.outOfCredits) {
        setShowUpgradeModal(true);
        setIsMagicImporting(false);
        return;
      }
      if (!res.ok || !data.success || !data.cvId) {
        throw new Error(
          data.message ||
            data.error ||
            (isAr ? "فشل إصلاح وترجمة السيرة الذاتية." : "Failed to auto-fix and translate CV.")
        );
      }

      router.push(`/${locale}/dashboard/cv/${data.cvId}`);
    } catch (err: unknown) {
      setMagicImportError(
        err instanceof Error
          ? err.message
          : isAr
          ? "حدث خطأ غير متوقع أثناء المعالجة."
          : "An unexpected error occurred."
      );
      setIsMagicImporting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 60) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          {isAr
            ? "🔍 فاحص السيرة الذاتية (ATS & DIN 5008 Checker)"
            : isDe
            ? "🔍 ATS & DIN 5008 Lebenslauf-Checker"
            : "🔍 German ATS & DIN 5008 CV Analyzer"}
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl">
          {isAr
            ? "افحص توافق سيرتك الذاتية مع أنظمة التوظيف الآلية ATS ومعايير DIN 5008 الألمانية عبر رفع ملف PDF مباشرة أو اختيار سيرة محفوظة."
            : isDe
            ? "Überprüfen Sie Ihren Lebenslauf auf ATS-Kompatibilität und DIN 5008 durch direkten PDF-Upload oder Textanalyse."
            : "Audit your CV against German ATS parsers and DIN 5008 standards by uploading a PDF or choosing a saved CV."}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Input Form Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-xl">
        <form onSubmit={handleAnalyze} className="space-y-6">
          {/* Mode Switcher (3 Tabs) */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setInputMode("upload")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                inputMode === "upload"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>📄</span>
              <span>{isAr ? "رفع ملف PDF" : isDe ? "PDF hochladen" : "Upload PDF"}</span>
            </button>

            {userCvs.length > 0 && (
              <button
                type="button"
                onClick={() => setInputMode("saved")}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  inputMode === "saved"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>💾</span>
                <span>{isAr ? "سيرة محفوظة" : isDe ? "Gespeicherter Lebenslauf" : "Saved CV"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setInputMode("paste")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                inputMode === "paste"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>✍️</span>
              <span>{isAr ? "لصق نص" : isDe ? "Text einfügen" : "Paste Text"}</span>
            </button>
          </div>

          {/* Mode 1: PDF Drag-and-Drop Dropzone */}
          {inputMode === "upload" && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
                    : "border-slate-800 hover:border-slate-700 bg-slate-950/60"
                }`}
              >
                {isUploadingPdf ? (
                  <div className="space-y-3">
                    <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <p className="text-sm font-bold text-white">
                      {isAr ? "جاري قراءة واستخراج النص من ملف PDF..." : "Extracting text from PDF..."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-3xl shadow-md">
                      📥
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-bold text-white">
                        {isAr
                          ? "اسحب وأفلت ملف PDF هنا أو اضغط للاختيار"
                          : isDe
                          ? "PDF-Datei hierher ziehen oder klicken zum Auswählen"
                          : "Drag and drop your PDF here, or browse"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {isAr ? "يدعم ملفات PDF حتى 5 ميغابايت" : "Supports PDF files up to 5MB"}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                  {uploadError}
                </div>
              )}

              {uploadedFileName && cvText && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 truncate">
                      <span>✓</span>
                      <span className="truncate">
                        {isAr
                          ? `تم استخراج النص بنجاح من: ${uploadedFileName} (${uploadedCharCount} حرف)`
                          : `Extracted text from ${uploadedFileName} (${uploadedCharCount} chars)`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="text-xs text-slate-300 hover:text-white underline shrink-0 font-semibold cursor-pointer"
                    >
                      {isAr ? "تغيير الملف" : "Change File"}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      {isAr ? "معاينة وتعديل النص المستخرج من الـ PDF:" : "Extracted CV Text Preview / Edit:"}
                    </label>
                    <textarea
                      rows={6}
                      value={cvText}
                      onChange={(e) => setCvText(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Select Saved CV */}
          {inputMode === "saved" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200">
                {isAr ? "اختر السيرة الذاتية للفحص" : isDe ? "Lebenslauf auswählen" : "Select CV to Analyze"}
              </label>
              <select
                value={selectedCvId}
                onChange={(e) => setSelectedCvId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-hidden"
              >
                {userCvs.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.title} ({cv.language.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mode 3: Raw Text Paste */}
          {inputMode === "paste" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200">
                {isAr ? "نص السيرة الذاتية *" : isDe ? "Lebenslauf Text *" : "CV Text *"}
              </label>
              <textarea
                required
                rows={8}
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder={
                  isAr
                    ? "الصق هنا نص سيرتك الذاتية (الخبرات، التعليم، المهارات، اللغات)..."
                    : "Fügen Sie hier Ihren Lebenslauf-Text ein..."
                }
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          )}

          {/* Optional Job Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>
                {isAr
                  ? "إعلان الوظيفة المستهدفة (اختياري - لمطابقة الكلمات المفتاحية)"
                  : "Target Job Description (Optional for Keyword Match)"}
              </span>
              <span className="text-[11px] text-slate-500 font-normal">Optional</span>
            </label>
            <textarea
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder={
                isAr
                  ? "الصق متطلبات الوظيفة المعنية للحصول على نسبة مطابقة الكلمات المفتاحية..."
                  : "Stellenanzeige für Keyword-Matching einfügen..."
              }
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-300">{isAr ? "لغة التقرير:" : "Report Language:"}</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-blue-500 focus:outline-hidden"
              >
                <option value="ar">العربية (Arabic)</option>
                <option value="de">Deutsch (الألمانية)</option>
                <option value="en">English (الإنجليزية)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isAnalyzing}
              className="py-3 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{isAr ? "جاري الفحص بالذكاء الاصطناعي..." : isDe ? "Analyse läuft..." : "Analyzing with AI..."}</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>{isAr ? "بدء فحص ATS & DIN 5008" : isDe ? "Jetzt analysieren" : "Run ATS & DIN 5008 Audit"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Analysis Results Display */}
      {analysis && (() => {
        const isCvAccepted = analysis.overallScore >= 80;
        return (
          <div className="space-y-8 animate-fadeIn">
            {/* Inline CV Text Editor & Instant Re-scan Panel */}
            {isEditingText && (
              <div
                ref={textEditorRef}
                className="p-6 rounded-3xl bg-slate-900 border border-blue-500/40 shadow-2xl space-y-4 animate-fadeIn"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-blue-400">
                    <span className="text-xl">✏️</span>
                    <h4 className="text-base font-bold text-white">
                      {isAr
                        ? "تعديل نص السيرة الذاتية وتصحيح الأخطاء يدوياً"
                        : isDe
                        ? "Lebenslauf-Text manuell korrigieren"
                        : "Edit CV Text & Correct Manually"}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingText(false)}
                    className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {isAr ? "إغلاق ✕" : isDe ? "Schließen ✕" : "Close ✕"}
                  </button>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {isAr
                    ? "قم بتعديل التواريخ أو المسميات أو إضافة الأقسام والكلمات الناقصة مباشرة في المربع أدناه، ثم اضغط على زر إعادة الفحص لتحديث التقييم فوراً."
                    : isDe
                    ? "Korrigieren Sie Daten, Begriffe oder fehlende Abschnitte direkt hier und starten Sie eine erneute Prüfung."
                    : "Correct dates, terms, or missing sections directly below, then click re-scan to update your evaluation immediately."}
                </p>

                <textarea
                  dir="ltr"
                  rows={10}
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                  placeholder="CV text..."
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="text-xs text-slate-400 font-mono">
                    {cvText.length} {isAr ? "حرف" : "characters"}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditingText(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {isAr ? "إلغاء" : isDe ? "Abbrechen" : "Cancel"}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleAnalyze(e)}
                      disabled={isAnalyzing}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isAnalyzing ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>{isAr ? "جاري إعادة الفحص..." : isDe ? "Prüfung läuft..." : "Re-scanning..."}</span>
                        </>
                      ) : (
                        <>
                          <span>🔄</span>
                          <span>
                            {isAr
                              ? "🔄 إعادة فحص السيرة بعد التصحيح"
                              : isDe
                              ? "🔄 Nach Korrektur erneut prüfen"
                              : "🔄 Re-scan Corrected CV"}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Top Score Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Overall ATS Score */}
              <div className={`p-6 rounded-3xl border ${getScoreColor(analysis.overallScore)} flex flex-col items-center justify-center text-center space-y-2 shadow-xl`}>
                <span className="text-xs font-bold uppercase tracking-wider">
                  {isAr ? "التقييم العام (ATS Score)" : "Overall ATS Score"}
                </span>
                <div className="text-4xl sm:text-5xl font-black">{analysis.overallScore}%</div>
                <span className="text-xs font-semibold">
                  {analysis.overallScore >= 80
                    ? isAr ? "ممتاز وجاهز للتقديم ✅" : "Excellent Readiness"
                    : analysis.overallScore >= 60
                    ? isAr ? "جيد ويحتاج تحسينات ⚠️" : "Moderate Readiness"
                    : isAr ? "ضعيف ويتطلب تعديل ❌" : "Needs Immediate Revision"}
                </span>
              </div>

              {/* DIN 5008 Standard Score */}
              <div className={`p-6 rounded-3xl border ${getScoreColor(analysis.din5008Score)} flex flex-col items-center justify-center text-center space-y-2 shadow-xl`}>
                <span className="text-xs font-bold uppercase tracking-wider">
                  {isAr ? "معايير ألمانيا (DIN 5008)" : "DIN 5008 Standard"}
                </span>
                <div className="text-4xl sm:text-5xl font-black">{analysis.din5008Score}%</div>
                <span className="text-xs font-semibold">
                  {analysis.din5008Score >= 80 ? "DIN 5008 Konform" : "Strukturanpassung nötig"}
                </span>
              </div>

              {/* Keyword Match Score */}
              <div className={`p-6 rounded-3xl border ${getScoreColor(analysis.keywordMatchScore)} flex flex-col items-center justify-center text-center space-y-2 shadow-xl`}>
                <span className="text-xs font-bold uppercase tracking-wider">
                  {isAr ? "مطابقة الكلمات المفتاحية" : "Keyword Match"}
                </span>
                <div className="text-4xl sm:text-5xl font-black">{analysis.keywordMatchScore}%</div>
                <span className="text-xs font-semibold">
                  {jobDescription.trim() ? (isAr ? "بناءً على إعلان الوظيفة" : "Based on Job Posting") : (isAr ? "بناءً على معايير المجال" : "Industry Standard Match")}
                </span>
              </div>
            </div>

            {/* Prominent Credibility & Status Banner */}
            {isCvAccepted ? (
              <div className="rounded-3xl border border-emerald-500/40 bg-emerald-950/20 p-6 sm:p-8 shadow-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <span className="text-3xl">✅</span>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-white">
                        {isAr
                          ? "✅ سيرتك الذاتية مقبولة وجاهزة للتقديم ولا تحتاج إلى تعديل!"
                          : isDe
                          ? "✅ Ihr Lebenslauf ist ATS-konform und bereit zur Bewerbung!"
                          : "✅ Your CV is Accepted & Ready for Application!"}
                      </h3>
                      <p className="text-xs text-emerald-300 font-semibold mt-0.5">
                        {isAr
                          ? "توافق عالي مع معايير DIN 5008 وأنظمة الفرز الآلي الألمانية"
                          : isDe
                          ? "Hohe Übereinstimmung mit DIN 5008 und deutschen ATS-Systemen"
                          : "High compliance with DIN 5008 and German ATS standards"}
                      </p>
                    </div>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                    {isAr ? "معتمد للتقديم المباشر" : isDe ? "Bewerbungsbereit" : "Ready to Apply"}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed text-justify">
                  {isAr
                    ? "سيرتك الذاتية الحالية تحقق معايير الفرز الآلي (ATS) والتنسيق الألماني (DIN 5008) بنسبة ممتازة. حفاظاً على مصداقيتنا وشفافيتنا معك، لا نقترح أي إعادة هيكلة أو تعديل إضافي — يمكنك التقديم بها مباشرة على الوظائف في ألمانيا بثقة كاملة."
                    : isDe
                    ? "Ihr aktueller Lebenslauf erfüllt die deutschen ATS- und DIN 5008-Standards hervorragend. Aus Gründen der Glaubwürdigkeit und Transparenz empfehlen wir keine weiteren Überarbeitungen — Sie können sich direkt und selbstbewusst bewerben."
                    : "Your current CV meets German ATS and DIN 5008 standards with an excellent score. In keeping with our strict credibility and transparency standards, no remediation is required — you can apply directly to employers in Germany with confidence."}
                </p>

                <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-emerald-300">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-bold">
                    <span>✓</span>
                    <span>{isAr ? "تنسيق ألماني قياسي DIN 5008" : isDe ? "DIN 5008 Standard erfüllt" : "DIN 5008 Compliant"}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-bold">
                    <span>✓</span>
                    <span>{isAr ? "جاهزة للإرسال إلى الشركات الألمانية" : isDe ? "Bereit für Arbeitgeber in DE" : "Ready for German Employers"}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-bold">
                    <span>✓</span>
                    <span>{isAr ? "لا تتطلب أي إصلاحات إجبارية" : isDe ? "Keine Nachbesserung nötig" : "No remediation needed"}</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-amber-500/40 bg-amber-950/20 p-6 sm:p-8 shadow-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-amber-400">
                    <span className="text-3xl">⚠️</span>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-white">
                        {isAr
                          ? "⚠️ السيرة الذاتية تحتاج إلى تحسين وتعديل قبل التقديم"
                          : isDe
                          ? "⚠️ Lebenslauf benötigt Optimierung vor der Bewerbung"
                          : "⚠️ CV Needs Improvement Before Applying"}
                      </h3>
                      <p className="text-xs text-amber-300 font-semibold mt-0.5">
                        {isAr
                          ? "النتيجة الحالية أقل من الحد الأدنى الموصى به للقبول التلقائي (80%)"
                          : isDe
                          ? "Ergebnis liegt unter dem empfohlenen Mindestwert von 80%"
                          : "Current score is below the recommended 80% passing threshold"}
                      </p>
                    </div>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
                    {isAr ? "يُنصح بالتحسين" : isDe ? "Optimierung empfohlen" : "Revision Recommended"}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed text-justify">
                  {isAr
                    ? "التقييم الحالي أقل من النسبة الموصى بها لتخطي فلاتر التوظيف الألمانية بنجاح. نوصي بتعديل وتطوير السيرة الذاتية ومعالجة الفجوات وإضافة الكلمات المفتاحية الناقصة الموضحة أدناه لرفع حظوظك في الحصول على مقابلات عمل."
                    : isDe
                    ? "Die aktuelle Bewertung liegt unter der empfohlenen Schwelle für deutsche ATS-Filter. Wir empfehlen, die unten aufgeführten Lücken zu schließen und fehlende Fachbegriffe zu ergänzen, um Ihre Interviewchancen zu maximieren."
                    : "The current score is below the recommended threshold to successfully pass German ATS parsers. We recommend addressing the identified gaps and adding missing keywords below to maximize your interview chances."}
                </p>

                {selectedCvId && inputMode === "saved" && (
                  <div className="pt-1">
                    <Link
                      href={`/${locale}/dashboard/cv/${selectedCvId}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md"
                    >
                      <span>✏️</span>
                      <span>{isAr ? "الانتقال لتعديل وتحسين هذه السيرة في المحرر" : isDe ? "Jetzt im CV-Editor optimieren" : "Optimize this CV in Builder Now"}</span>
                    </Link>
                  </div>
                )}

                {(inputMode === "upload" || inputMode === "paste") && cvText.trim().length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    {magicImportError && (
                      <div className="w-full p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
                        {magicImportError}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleMagicImport}
                      disabled={isMagicImporting}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-900/40 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isMagicImporting ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>
                            {isAr
                              ? "جاري إصلاح وترجمة السيرة وفق DIN 5008..."
                              : isDe
                              ? "Lebenslauf wird nach DIN 5008 optimiert..."
                              : "Optimizing and translating CV to DIN 5008..."}
                          </span>
                        </>
                      ) : (
                        <span>
                          {isAr
                            ? "✨ إصلاح وتنسيق السيرة الذاتية تلقائياً (DIN 5008)"
                            : isDe
                            ? "✨ Lebenslauf automatisch nach DIN 5008 optimieren"
                            : "✨ Auto-Optimize CV to DIN 5008 Standard"}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={openTextEditor}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      <span>✏️</span>
                      <span>
                        {isAr
                          ? "✏️ تعديل نص السيرة وتصحيح الأخطاء يدوياً"
                          : isDe
                          ? "✏️ Text manuell korrigieren"
                          : "✏️ Edit CV Text Manually"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Executive Summary */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📋</span>
              <span>{isAr ? "الملخص التنفيذي للتقييم" : isDe ? "Zusammenfassung" : "Executive Assessment"}</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              {analysis.summary}
            </p>
          </div>

          {/* Strengths & Weaknesses 2-Col Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-slate-900/80 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <span>✅</span>
                <span>{isAr ? "نقاط القوة في سيرتك" : isDe ? "Stärken" : "Key Strengths"}</span>
              </h3>
              <ul className="space-y-2.5">
                {analysis.strengths.map((item, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2 leading-relaxed">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses / Red Flags */}
            <div className="bg-slate-900/80 border border-rose-500/20 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{isAr ? "النقاط السلبية والفجوات (Red Flags)" : isDe ? "Schwächen & Lücken" : "Weaknesses & Red Flags"}</span>
                </h3>
                {(inputMode === "upload" || inputMode === "paste") && cvText.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={openTextEditor}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>✏️</span>
                    <span>
                      {isAr
                        ? "✏️ تعديل نص السيرة وتصحيح الأخطاء يدوياً"
                        : isDe
                        ? "✏️ Text manuell korrigieren"
                        : "✏️ Edit CV Text Manually"}
                    </span>
                  </button>
                )}
              </div>
              {analysis.weaknesses.length === 0 ? (
                <p className="text-xs sm:text-sm text-emerald-400 font-medium">
                  {isAr
                    ? "لا توجد فجوات أو أخطاء جوهرية في سيرتك الذاتية! التنسيق والمحتوى ممتاز."
                    : isDe
                    ? "Keine wesentlichen Schwächen oder Lücken gefunden! Struktur und Inhalt sind hervorragend."
                    : "No significant weaknesses or red flags detected! Formatting and content are solid."}
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {analysis.weaknesses.map((item, idx) => (
                    <li key={idx} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2 leading-relaxed">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Interactive German Keywords */}
          {analysis.missingKeywords.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <span>🔑</span>
                  <span>{isAr ? "كلمات مفتاحية ألمانية موصى بإضافتها" : isDe ? "Fehlende Schlüsselbegriffe" : "Missing Keywords to Include"}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {isAr ? "انقر لنسخ الكلمة للحافظة" : isDe ? "Klicken zum Kopieren" : "Click to copy keyword"}
                </span>
              </div>

              {addedKeywords.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                    <span>ℹ️</span>
                    <span>
                      {isAr
                        ? `تمت إضافة (${addedKeywords.length}) من الكلمات المفتاحية إلى نص السيرة بنجاح!`
                        : isDe
                        ? `(${addedKeywords.length}) Schlüsselbegriffe wurden zum Lebenslauf hinzugefügt!`
                        : `(${addedKeywords.length}) keywords added to CV text successfully!`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleAnalyze(e)}
                    disabled={isAnalyzing}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>🔄</span>
                    <span>
                      {isAr
                        ? "إعادة فحص السيرة الآن"
                        : isDe
                        ? "Jetzt erneut prüfen"
                        : "Re-scan CV Now"}
                    </span>
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2.5">
                {analysis.missingKeywords.map((kw, idx) => {
                  const isCopied = copiedKeyword === kw;
                  const isAdded = addedKeywords.includes(kw);
                  const canAddToText = inputMode === "upload" || inputMode === "paste";

                  return (
                    <div
                      key={idx}
                      className={`inline-flex items-center gap-1.5 rounded-xl border p-1 text-xs font-semibold transition-all ${
                        isAdded
                          ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-300 hover:border-amber-500/40"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleCopyKeyword(kw)}
                        title={isAr ? "نسخ الكلمة للحافظة" : "Copy keyword"}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-amber-500/20 transition-colors cursor-pointer"
                      >
                        <span>{isCopied ? "✓" : "📋"}</span>
                        <span className="font-mono">{kw}</span>
                        {isCopied && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                            {isAr ? "تم النسخ" : "Copied"}
                          </span>
                        )}
                      </button>

                      {canAddToText && (
                        <button
                          type="button"
                          onClick={() => handleAddKeywordToText(kw)}
                          disabled={isAdded}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                            isAdded
                              ? "bg-blue-600/20 text-blue-400 cursor-default"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white"
                          }`}
                          title={isAr ? "إضافة الكلمة مباشرة إلى نص السيرة" : "Add keyword directly into CV text"}
                        >
                          {isAdded ? (
                            <span>✓ {isAr ? "مضافة" : isDe ? "Hinzugefügt" : "Added"}</span>
                          ) : (
                            <span>{isAr ? "+ إضافتها للنص" : isDe ? "+ Zum Text hinzufügen" : "+ Add to CV"}</span>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Prioritized Action Plan */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-blue-400 flex items-center gap-2">
              <span>🎯</span>
              <span>{isAr ? "خطة العمل لتحسين السيرة (Action Plan)" : isDe ? "Handlungsempfehlungen" : "Action Plan"}</span>
            </h3>
            <div className="space-y-3">
              {analysis.actionPlan.map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                    {step}
                  </p>
                </div>
              ))}
            </div>

            {selectedCvId && inputMode === "saved" && (
              <div className="pt-4 flex justify-end">
                <Link
                  href={`/${locale}/dashboard/cv/${selectedCvId}`}
                  className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md ${
                    isCvAccepted
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                  }`}
                >
                  <span>✏️</span>
                  <span>
                    {isCvAccepted
                      ? isAr
                        ? "معاينة السيرة الذاتية في المحرر"
                        : isDe
                        ? "Lebenslauf im Editor anzeigen"
                        : "View CV in Builder"
                      : isAr
                      ? "تعديل وإصلاح هذه السيرة الذاتية الآن"
                      : isDe
                      ? "Diesen Lebenslauf bearbeiten & optimieren"
                      : "Edit & Fix this CV in Builder"}
                  </span>
                </Link>
              </div>
            )}

            {!isCvAccepted && (inputMode === "upload" || inputMode === "paste") && cvText.trim().length > 0 && (
              <div className="pt-4 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={openTextEditor}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  <span>✏️</span>
                  <span>
                    {isAr
                      ? "✏️ تعديل نص السيرة وتصحيح الأخطاء يدوياً"
                      : isDe
                      ? "✏️ Text manuell korrigieren"
                      : "✏️ Edit CV Text Manually"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleMagicImport}
                  disabled={isMagicImporting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isMagicImporting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>
                        {isAr
                          ? "جاري إصلاح وترجمة السيرة وفق DIN 5008..."
                          : isDe
                          ? "Lebenslauf wird nach DIN 5008 optimiert..."
                          : "Optimizing and translating CV to DIN 5008..."}
                      </span>
                    </>
                  ) : (
                    <span>
                      {isAr
                        ? "✨ إصلاح وتنسيق السيرة الذاتية تلقائياً (DIN 5008)"
                        : isDe
                        ? "✨ Lebenslauf automatisch nach DIN 5008 optimieren"
                        : "✨ Auto-Optimize CV to DIN 5008 Standard"}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      );
    })()}

      {/* Contextual Paywall Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        locale={locale}
        triggerFeature="ats"
      />
    </div>
  );
}
