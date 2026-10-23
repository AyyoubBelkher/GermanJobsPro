"use client";

import React, { useState, useRef } from "react";
import { ATSImportedFix } from "./LebenslaufTool";
import UpgradeModal from "@/components/pricing/UpgradeModal";

export interface AtsResult {
  score: number;
  summary: string;
  missingKeywords?: string[];
  improvements?: string[];
  rewriteSuggestions?: string[];
  germanTips?: string[];
}

export interface ATSToolProps {
  onApplyFixToBuilder?: (fix: ATSImportedFix) => void;
}

export default function ATSTool({ onApplyFixToBuilder }: ATSToolProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");

  // Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [result, setResult] = useState<AtsResult | null>(null);

  // Auto-Fix states
  const [isFixing, setIsFixing] = useState<boolean>(false);
  const [fixError, setFixError] = useState<string>("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setAnalyzeError("حجم الملف يتجاوز الحد الأقصى (5 ميغابايت).");
        return;
      }
      setSelectedFile(file);
      setAnalyzeError(null);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setAnalyzeError("يرجى اختيار ملف السيرة الذاتية أولاً (PDF أو TXT).");
      return;
    }
    if (!jobTitle.trim()) {
      setAnalyzeError("يرجى إدخال المسمى الوظيفي المستهدف.");
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeError(null);
    setFixError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("jobTitle", jobTitle.trim());
      if (jobDesc.trim()) {
        formData.append("jobDesc", jobDesc.trim());
      }

      const res = await fetch("/api/tools/ats", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.status === 402 || data.error === "INSUFFICIENT_CREDITS" || data.outOfCredits) {
        setShowUpgradeModal(true);
        setIsAnalyzing(false);
        return;
      }
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تحليل السيرة الذاتية.");
      }

      setResult(data.result);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "حدث خطأ أثناء فحص السيرة الذاتية.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAutoFixCV = async () => {
    if (!selectedFile) {
      setFixError("ملف السيرة الذاتية مفقود، يرجى إعادة رفع الملف.");
      return;
    }

    setIsFixing(true);
    setFixError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("jobTitle", jobTitle.trim() || "Allgemeine Position");
      if (jobDesc.trim()) {
        formData.append("jobDesc", jobDesc.trim());
      }
      if (result) {
        formData.append("atsReport", JSON.stringify(result));
      }

      const res = await fetch("/api/tools/ats-fix", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.status === 402 || data.error === "INSUFFICIENT_CREDITS" || data.outOfCredits) {
        setShowUpgradeModal(true);
        setIsFixing(false);
        return;
      }
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تصحيح السيرة الذاتية بواسطة الذكاء الاصطناعي.");
      }

      if (onApplyFixToBuilder) {
        onApplyFixToBuilder({
          cvData: data.cvData,
          originalScore: result?.score || data.originalScore || 65,
          projectedScore: data.projectedScore,
          appliedFixes: data.appliedFixes || [],
          unverifiedSkills: data.unverifiedSkills || [],
        });
      }
    } catch (err) {
      setFixError(err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء معالجة السيرة الذاتية.");
    } finally {
      setIsFixing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setAnalyzeError(null);
    setFixError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
    if (score >= 60) return "text-amber-400 border-amber-500/40 bg-amber-500/10";
    return "text-rose-400 border-rose-500/40 bg-rose-500/10";
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 font-sans" dir="rtl">
      {/* TOOL INTRO HEADER */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
          <span>🎯 فاحص التوافق المهني</span>
          <span>•</span>
          <span>German ATS & DIN 5008 Audit</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
          فحص السيرة الذاتية الألمانية وتخطي فلاتر الـ ATS
        </h2>
        <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          ارفع سيرتك الذاتية الحالية وقارنها بمتطلبات الوظيفة المستهدفة في ألمانيا لكشف الكلمات المفتاحية الناقصة وعيوب التنسيق.
        </p>
      </div>

      {/* INPUT FORM (WHEN NO RESULT) */}
      {!result ? (
        <form onSubmit={handleAnalyze} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          {/* File Upload Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              ملف السيرة الذاتية (PDF أو TXT - الحد الأقصى 5 ميغابايت) <span className="text-rose-400">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                selectedFile
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-slate-700 hover:border-blue-500 bg-slate-950/40 hover:bg-slate-950/80"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,application/pdf,text/plain"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="space-y-2">
                <span className="text-3xl">📄</span>
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-bold text-emerald-400">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • جاهز للتحليل
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-bold text-white">انقر هنا لاختيار ملف السيرة الذاتية</p>
                    <p className="text-xs text-slate-400">يدعم ملفات PDF وTXT القابلة للقراءة</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Job Target Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                المسمى الوظيفي المستهدف في ألمانيا (Job Title) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="z.B. Frontend Developer, Pflegefachkraft, Sales Manager"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                dir="ltr"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                وصف الوظيفة أو شروط الإعلان (اختياري)
              </label>
              <input
                type="text"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                placeholder="الصق متطلبات الإعلان الوظيفي هنا لنتائج أدق..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {analyzeError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
              {analyzeError}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isAnalyzing}
              className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-xl shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  <span>جاري فحص التوافق وتحليل الكلمات المفتاحية...</span>
                </>
              ) : (
                <>
                  <span>فحص السيرة الذاتية الآن</span>
                  <span>⚡</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* RESULTS VIEW */
        (() => {
          const isCvAccepted = result.score >= 80;
          return (
            <div className="space-y-6">
              {/* Top Score & Summary Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center font-black ${getScoreColor(
                        result.score
                      )}`}
                    >
                      <span className="text-2xl">{result.score}%</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider">ATS Score</span>
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white">
                        نتيجة توافق السيرة الذاتية مع نظام الفرز الآلي
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        الوظيفة المستهدفة: <span className="text-blue-400 font-semibold" dir="ltr">{jobTitle}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    🔄 فحص ملف آخر
                  </button>
                </div>

                {/* Summary Text */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <p className="text-sm text-slate-200 leading-relaxed">{result.summary}</p>
                </div>
              </div>

              {/* CONDITIONAL CALLOUT: ACCEPTED & READY vs AI AUTO-FIX */}
              {isCvAccepted ? (
                /* ACCEPTED & READY CARD (HONESTY & CREDIBILITY) */
                <div className="rounded-3xl border border-emerald-500/40 bg-emerald-950/20 p-6 sm:p-8 shadow-2xl space-y-4">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <span className="text-2xl">✅</span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      ✅ سيرتك الذاتية مقبولة وجاهزة للتقديم ولا تحتاج إلى تعديل!
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed text-justify">
                    سيرتك الذاتية الحالية تحقق معايير الفرز الآلي (ATS) والتنسيق الألماني (DIN 5008) بنسبة ممتازة. حفاظاً على مصداقيتنا معك، لا نقترح أي تعديل إضافي — يمكنك التقديم بها مباشرة على الوظائف بثقة.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-emerald-300">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-bold">
                      <span>✓</span>
                      <span>معايير التنسيق الألماني DIN 5008 محققة</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-bold">
                      <span>✓</span>
                      <span>جاهزة للمراسلة والتقديم المباشر بأمان</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-bold">
                      <span>✓</span>
                      <span>لا تتطلب أي تدخل أو إعادة هيكلة إضافية</span>
                    </span>
                  </div>
                </div>
              ) : (
                /* PROMINENT AI AUTO-FIX CALLOUT CARD */
                <div className="rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/40 p-6 sm:p-8 shadow-2xl space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✨</span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      إصلاح السيرة الذاتية بالذكاء الاصطناعي وفق المعايير الألمانية (DIN 5008)
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed text-justify">
                    سيرتك الذاتية تحتاج إلى إعادة هيكلة وترجمة لتجاوز فلاتر الفرز الآلي (ATS) في ألمانيا بنجاح. يقوم هذا الخيار الذكي بإعادة هيكلة وترجمة سيرتك الذاتية الحالية بدقة، وصياغة المهام بأسلوب الفعل الألماني المهني (Substantivstil)، وإضافة نبذة مهنية احترافية (Kurzprofil) مع المحافظة التامة على مصداقية بياناتك الحقيقية وتفاصيل خبراتك الفعلية دون أي تزييف.
                  </p>

                  {fixError && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
                      {fixError}
                    </div>
                  )}

                  <div className="pt-1 flex flex-wrap items-center justify-between gap-4">
                    <span className="text-xs text-blue-300/80">
                      • يتم نقل البيانات المصححة فوراً إلى أداة السيرة الذاتية للمعاينة والتحميل.
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoFixCV}
                      disabled={isFixing}
                      className="py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-blue-900/40 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {isFixing ? (
                        <>
                          <span className="inline-block animate-spin">⚙️</span>
                          <span>جاري تصحيح السيرة الذاتية وترجمتها وفق DIN 5008...</span>
                        </>
                      ) : (
                        <>
                          <span>إصلاح السيرة الذاتية وإنشاء نسخة ألمانية مصححة الآن</span>
                          <span>🚀</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

          {/* Missing Keywords & Recommendations Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Missing Keywords */}
            {result.missingKeywords && result.missingKeywords.length > 0 && (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <span>⚠️</span>
                  <h4 className="text-sm font-bold">كلمات مفتاحية ألمانية ناقصة (Fehlende Fachbegriffe)</h4>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {result.missingKeywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono font-medium"
                      dir="ltr"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Improvements */}
            {result.improvements && result.improvements.length > 0 && (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <span>💡</span>
                  <h4 className="text-sm font-bold">أهم نقاط التحسين المطلوبة</h4>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {result.improvements.map((imp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* German Tips */}
          {result.germanTips && result.germanTips.length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <span>🇩🇪</span>
                <h4 className="text-sm font-bold">إرشادات معيار التوظيف الألماني (DIN 5008 Standards)</h4>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {result.germanTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-emerald-400">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              ← فحص سيرة ذاتية أخرى
            </button>
            {!isCvAccepted ? (
              <button
                type="button"
                onClick={handleAutoFixCV}
                disabled={isFixing}
                className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isFixing ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    <span>جاري التجهيز...</span>
                  </>
                ) : (
                  <>
                    <span>إصلاح السيرة الذاتية وإنشاء نسخة ألمانية مصححة الآن</span>
                    <span>🚀</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
                <span>✓</span>
                <span>سيرتك الذاتية مقبولة وجاهزة للتقديم المباشر</span>
              </div>
            )}
          </div>
        </div>
      );
    })()
  )}

      {/* Contextual Paywall Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        locale="ar"
        triggerFeature="ats"
      />
    </div>
  );
}
