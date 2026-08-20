"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface CvOption {
  id: string;
  title: string;
  language: string;
}

interface CoverLetterGeneratorClientProps {
  userCvs: CvOption[];
  locale: string;
}

export default function CoverLetterGeneratorClient({
  userCvs,
  locale,
}: CoverLetterGeneratorClientProps) {
  const router = useRouter();

  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [jobDescriptionRaw, setJobDescriptionRaw] = useState("");
  const [tone, setTone] = useState("professional");
  const [language, setLanguage] = useState("de");
  const [selectedCvId, setSelectedCvId] = useState<string>("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAr = locale === "ar";
  const isDe = locale === "de";

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !companyName.trim() || !jobDescriptionRaw.trim()) {
      setError(isAr ? "يرجى ملء المسمى الوظيفي، اسم الشركة، وإعلان الوظيفة" : "Please fill in job title, company name, and job description");
      return;
    }

    if (jobDescriptionRaw.trim().length < 20) {
      setError(isAr ? "يجب أن يحتوي نص إعلان الوظيفة على 20 حرفاً على الأقل" : "Job description must be at least 20 characters");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: jobTitle.trim(),
          companyName: companyName.trim(),
          recipientName: recipientName.trim() || undefined,
          jobDescriptionRaw: jobDescriptionRaw.trim(),
          tone,
          language,
          cvId: selectedCvId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate cover letter");
      }

      setGeneratedText(data.generatedContent);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error during AI generation");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedText.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/cover-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Anschreiben - ${jobTitle} (${companyName})`,
          jobTitle: jobTitle.trim(),
          companyName: companyName.trim(),
          recipientName: recipientName.trim() || null,
          jobDescriptionRaw: jobDescriptionRaw.trim() || null,
          language,
          tone,
          generatedContent: generatedText,
          cvId: selectedCvId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save cover letter");
      }

      router.push(`/${locale}/dashboard/cover-letters/${data.coverLetter.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving cover letter");
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          {isAr ? "✨ استوديو توليد خطابات التغطية (DIN 5008 Anschreiben)" : isDe ? "✨ Anschreiben-Generator (DIN 5008)" : "✨ AI Cover Letter Generator (DIN 5008)"}
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl">
          {isAr
            ? "يقوم Gemini AI بتحليل إعلان الوظيفة ومطابقته مع خبراتك لصياغة خطاب تقديم ألماني رسمي مقنع وفق معايير DIN 5008."
            : isDe
            ? "Gemini AI analysiert die Stellenanzeige und verfasst ein DIN 5008 konformes deutsches Anschreiben."
            : "Gemini AI analyzes the job posting and crafts a formal German cover letter strictly adhering to DIN 5008."}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Grid: Form Left, Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-xl">
          <form onSubmit={handleGenerate} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200">
                {isAr ? "المسمى الوظيفي المستهدف *" : isDe ? "Stellenbezeichnung *" : "Job Title *"}
              </label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="z.B. Frontend Developer / Pflegefachkraft"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-purple-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200">
                {isAr ? "اسم الشركة *" : isDe ? "Unternehmensname *" : "Company Name *"}
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="z.B. Siemens AG / BMW Group"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-purple-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200">
                {isAr ? "اسم المسؤول / جهة الاتصال (Ansprechpartner)" : isDe ? "Ansprechpartner" : "Contact Person (optional)"}
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="z.B. Frau Dr. Schmidt / Herr Müller"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-purple-500 focus:outline-hidden"
              />
            </div>

            {/* Link to existing CV for context */}
            {userCvs.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-400 flex items-center gap-1">
                  <span>📄</span>
                  <span>{isAr ? "ربط مع سيرة ذاتية لتخصيص المحتوى" : "Attach CV Profile for Context"}</span>
                </label>
                <select
                  value={selectedCvId}
                  onChange={(e) => setSelectedCvId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-slate-200 text-sm focus:border-purple-500 focus:outline-hidden"
                >
                  <option value="">{isAr ? "-- بدون ربط سيرة ذاتية --" : "-- No CV attached --"}</option>
                  {userCvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.title} ({cv.language.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200">{isAr ? "نبرة الخطاب" : "Tone"}</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-purple-500 focus:outline-hidden"
                >
                  <option value="professional">{isAr ? "رسمي كلاسيكي (Professionell)" : "Professional"}</option>
                  <option value="modern">{isAr ? "عصري وديناميكي (Modern)" : "Modern & Active"}</option>
                  <option value="confident">{isAr ? "واثق وقيادي (Selbstbewusst)" : "Confident & Leadership"}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200">{isAr ? "لغة الخطاب" : "Language"}</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-purple-500 focus:outline-hidden"
                >
                  <option value="de">Deutsch (الألمانية)</option>
                  <option value="en">English (الإنجليزية)</option>
                  <option value="ar">العربية (Arabic)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200">
                {isAr ? "نص إعلان الوظيفة (Job Description) *" : isDe ? "Stellenanzeige Text *" : "Job Description *"}
              </label>
              <textarea
                required
                rows={6}
                value={jobDescriptionRaw}
                onChange={(e) => setJobDescriptionRaw(e.target.value)}
                placeholder={isAr ? "الصق هنا متطلبات الوظيفة أو نص إعلان العمل بالألمانية..." : "Fügen Sie hier die Stellenbeschreibung oder Anforderungen ein..."}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-purple-500 focus:outline-hidden font-mono"
              />
              <p className="text-[11px] text-slate-500 text-end">
                {jobDescriptionRaw.length} / 4000
              </p>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-purple-600/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{isAr ? "جاري التوليد بـ Gemini AI..." : isDe ? "Wird generiert..." : "Generating with Gemini AI..."}</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>{isAr ? "توليد الخطاب بالألمانية (DIN 5008)" : isDe ? "Anschreiben generieren (DIN 5008)" : "Generate German Cover Letter"}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Live Editable Output */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                <h3 className="font-bold text-white text-base sm:text-lg">
                  {isAr ? "معاينة الخطاب ومحرر التعديل" : isDe ? "Anschreiben Vorschau & Editor" : "Cover Letter Preview & Editor"}
                </h3>
              </div>

              {generatedText && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{copied ? "✓" : "📋"}</span>
                    <span>{copied ? (isAr ? "تم النسخ" : "Copied") : isAr ? "نسخ" : "Copy"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (isAr ? "جاري الحفظ..." : "Saving...") : isAr ? "💾 حفظ في حسابي" : "💾 Save Cover Letter"}
                  </button>
                </div>
              )}
            </div>

            {generatedText ? (
              <div className="space-y-4">
                <textarea
                  rows={20}
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 text-sm font-sans leading-relaxed focus:border-purple-500 focus:outline-hidden"
                />
                <p className="text-xs text-slate-400 italic text-center">
                  {isAr
                    ? "💡 يمكنك تعديل النص مباشرة أعلاه قبل حفظه أو نسخه."
                    : "💡 You can edit the text directly above before saving or copying."}
                </p>
              </div>
            ) : (
              <div className="text-center py-20 px-4 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center mx-auto text-xl">
                  ✨
                </div>
                <p className="text-sm font-semibold text-slate-300">
                  {isAr ? "املأ بيانات الوظيفة واضغط توليد" : "Fill in job details and click generate"}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {isAr
                    ? "سيظهر هنا خطاب التقديم المنسق بمعايير DIN 5008 مع إمكانية التعديل والنسخ والتحميل."
                    : "Your DIN 5008 formatted cover letter will appear here ready to edit and save."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
