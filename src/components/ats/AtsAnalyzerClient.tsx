"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { AtsAnalysisResult } from "@/lib/gemini";

interface CvOption {
  id: string;
  title: string;
  language: string;
}

interface AtsAnalyzerClientProps {
  userCvs: CvOption[];
  locale: string;
}

export default function AtsAnalyzerClient({ userCvs, locale }: AtsAnalyzerClientProps) {
  const isAr = locale === "ar";
  const isDe = locale === "de";

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<"saved" | "paste" | "upload">(
    userCvs.length > 0 ? "saved" : "upload"
  );
  const [selectedCvId, setSelectedCvId] = useState<string>(userCvs[0]?.id || "");
  const [cvText, setCvText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [language, setLanguage] = useState(locale || "de");

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
                  <span>{isAr ? "جاري الفحص بالذكاء الاصطناعي..." : isDe ? "Analyse läuft..." : "Analyzing with Gemini AI..."}</span>
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
      {analysis && (
        <div className="space-y-8 animate-fadeIn">
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
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <span>⚠️</span>
                <span>{isAr ? "النقاط السلبية والفجوات (Red Flags)" : isDe ? "Schwächen & Lücken" : "Weaknesses & Red Flags"}</span>
              </h3>
              <ul className="space-y-2.5">
                {analysis.weaknesses.map((item, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2 leading-relaxed">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Missing Keywords */}
          {analysis.missingKeywords.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <span>🔑</span>
                <span>{isAr ? "كلمات مفتاحية ألمانية موصى بإضافتها" : isDe ? "Fehlende Schlüsselbegriffe" : "Missing Keywords to Include"}</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.missingKeywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold"
                  >
                    + {kw}
                  </span>
                ))}
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
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md"
                >
                  <span>✏️</span>
                  <span>{isAr ? "تعديل هذه السيرة الذاتية الآن" : isDe ? "Diesen Lebenslauf bearbeiten" : "Edit this CV in Builder"}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
