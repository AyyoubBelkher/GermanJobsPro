"use client";

import React, { useState } from "react";
import Link from "next/link";
import { stripHtml } from "@/components/jobs/JobBoardClient";

export interface JobDetailData {
  id: string;
  title: string;
  company: string;
  city: string | null;
  category: string;
  jobType: string | null;
  languageReq: string | null;
  salary: string | null;
  applyUrl: string;
  contactEmail: string | null;
  requirements: string | null;
  descriptionRaw: string | null;
  publishedAt: string | Date;
}

interface JobDetailClientProps {
  job: JobDetailData;
  locale: string;
}

export default function JobDetailClient({ job, locale }: JobDetailClientProps) {
  const isAr = locale === "ar";
  const isDe = locale === "de";

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPortalNotice, setShowPortalNotice] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Parse requirements if stored as JSON or multiline text
  let parsedRequirements: string[] = [];
  if (job.requirements) {
    try {
      const parsed = JSON.parse(job.requirements);
      if (Array.isArray(parsed)) {
        parsedRequirements = parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      parsedRequirements = job.requirements
        .split(/\r?\n|•|-|\*/)
        .map((r) => r.trim())
        .filter((r) => r.length > 2);
    }
  }

  // Pre-fill parameters for Cover Letter Generator and ATS Analyzer
  const coverLetterUrl = `/${locale}/dashboard/cover-letters/new?jobTitle=${encodeURIComponent(
    job.title
  )}&companyName=${encodeURIComponent(job.company)}&jobDescription=${encodeURIComponent(
    job.requirements || job.descriptionRaw || ""
  )}`;

  const atsAnalyzerUrl = `/${locale}/dashboard/ats-analyzer?jobDescription=${encodeURIComponent(
    job.requirements || job.descriptionRaw || ""
  )}`;

  const cleanedDescription = stripHtml(job.descriptionRaw);

  const handleCopyEmail = () => {
    if (!job.contactEmail) return;
    navigator.clipboard.writeText(job.contactEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const emailSubject = `Bewerbung als ${job.title} - [Ihr Name / Your Name]`;
  const emailBody = `Sehr geehrte Damen und Herren,

mit großem Interesse bewerbe ich mich hiermit um die ausgeschriebene Stelle als ${job.title} bei ${job.company}.

Anbei finden Sie meine vollständigen Bewerbungsunterlagen (Lebenslauf nach DIN 5008, Anschreiben sowie relevante Zeugnisse).

Über eine Einladung zu einem persönlichen Vorstellungsgespräch freue ich mich sehr.

Mit freundlichen Grüßen,
[Ihr vollständiger Name]
[Ihre Telefonnummer]`;

  const mailtoLink = job.contactEmail
    ? `mailto:${job.contactEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    : "";

  return (
    <div className="space-y-10">
      {/* Top Main Grid: Left Details & Right Actions Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Job Overview & Description (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-xl">
            {/* Category & Tags Row */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
                {job.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium">
                {job.jobType || (isAr ? "دوام كامل" : "Vollzeit")}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                <span>🇩🇪</span>
                <span>{job.languageReq || "B1/B2"}</span>
              </span>
              {job.salary && (
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-1">
                  <span>💰</span>
                  <span>{job.salary}</span>
                </span>
              )}
            </div>

            {/* Job Title & Company (LTR text-start to prevent RTL truncation) */}
            <div dir="ltr" className="space-y-2 text-start">
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
                {job.title}
              </h1>
              <div className="flex items-center gap-4 text-sm sm:text-base text-slate-300 flex-wrap">
                <span className="font-bold text-blue-400 flex items-center gap-1.5">
                  <span>🏢</span>
                  <span>{job.company}</span>
                </span>
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span>📍</span>
                  <span>{job.city || "Deutschland"}</span>
                </span>
              </div>
            </div>

            {/* AI Action Highlight Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <span className="font-bold text-white text-sm">
                    {isAr
                      ? "هل ترغب بالتقديم السريع على هذه الوظيفة؟"
                      : isDe
                      ? "Möchten Sie sich direkt auf diese Stelle bewerben?"
                      : "Ready to apply for this job in Germany?"}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {isAr
                    ? "استخدم أدوات الذكاء الاصطناعي لتوليد خطاب الدافع وفحص توافق سيرتك الذاتية بضغطة واحدة."
                    : isDe
                    ? "Nutzen Sie unsere KI für ein maßgeschneidertes Anschreiben und den ATS-Check."
                    : "Generate a DIN 5008 cover letter and audit your ATS match with 1 click."}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Link
                  href={coverLetterUrl}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>✨</span>
                  <span>{isAr ? "توليد خطاب الدافع" : isDe ? "Anschreiben erstellen" : "Draft Cover Letter"}</span>
                </Link>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📄</span>
                <span>{isAr ? "نبذة وتفاصيل الوظيفة" : isDe ? "Stellenbeschreibung" : "Job Description"}</span>
              </h3>

              {cleanedDescription ? (
                <div dir="ltr" className="text-start text-sm text-slate-300 leading-relaxed space-y-3 whitespace-pre-line font-normal">
                  {cleanedDescription}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  {isAr
                    ? "لم يتم إدراج وصف تفصيلي إضافي، يمكنك الاطلاع على متطلبات التقديم المباشرة أدناه أو عبر رابط التقديم."
                    : "Keine ausführliche Beschreibung hinterlegt. Bitte beachten Sie die Anforderungen oder den Bewerbungslink."}
                </p>
              )}
            </div>

            {/* Requirements / Conditions Section */}
            {(parsedRequirements.length > 0 || job.requirements) && (
              <div className="space-y-4 pt-6 border-t border-slate-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🎯</span>
                  <span>{isAr ? "شروط ومتطلبات الوظيفة" : isDe ? "Anforderungen & Qualifikationen" : "Requirements & Qualifications"}</span>
                </h3>

                {parsedRequirements.length > 0 ? (
                  <ul className="space-y-2.5 text-sm text-slate-200" dir="ltr">
                    {parsedRequirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-start">
                        <span className="text-blue-400 font-bold shrink-0 mt-0.5">✓</span>
                        <span className="leading-relaxed">{req}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div dir="ltr" className="text-start text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {job.requirements}
                  </div>
                )}
              </div>
            )}

            {/* German Application Checklist & Best Practices */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800/80 p-5 space-y-3">
              <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                <span>🇩🇪</span>
                <span>
                  {isAr
                    ? "نصائح GermanJobsPro لقبول ملفك لدى صاحب العمل الألماني"
                    : isDe
                    ? "Erfolgstipps für Ihre Bewerbung in Deutschland"
                    : "GermanJobsPro Tips for German Employer Success"}
                </span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">1.</span>
                  <span>
                    {isAr
                      ? "اعتمد تنسيق السيرة الذاتية القياسي DIN 5008 مع ترتيب زمني عكسي وصورة شخصية مهنية موجهة نحو النص."
                      : "Verwenden Sie einen tabellarischen Lebenslauf nach DIN 5008 im umgekehrt chronologischen Format."}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">2.</span>
                  <span>
                    {isAr
                      ? "قم بتضمين خطاب دافع (Anschreiben) مخصص لهذه الوظيفة يركز على المهارات التي تطلبها الشركة بصيغة الأسماء الفعلية (Substantivstil)."
                      : "Fügen Sie ein individuelles Anschreiben bei, das genau auf die Anforderungen dieser Position eingeht."}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">3.</span>
                  <span>
                    {isAr
                      ? "اجمع كافة مستنداتك في ملف PDF واحد متكامل (Bewerbungsmappe) لا يتجاوز حجمه 5-10 ميغابايت."
                      : "Fassen Sie Lebenslauf, Anschreiben und Zeugnisse zu einer vollständigen Bewerbungsmappe im PDF-Format zusammen."}
                  </span>
                </li>
              </ul>
            </div>

          </div>

        </div>


        {/* Right Column: Application & AI Integrations Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          
          {/* Main Direct Apply Action Card */}
          <div className="rounded-3xl bg-slate-900 border-2 border-blue-500/40 p-6 space-y-5 shadow-2xl">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                {isAr ? "مركز التقديم الفوري" : isDe ? "Bewerbungsportal" : "Application Hub"}
              </span>
              <h3 className="text-lg font-black text-white">
                {isAr ? "التقديم على هذه الفرصة" : isDe ? "Jetzt bewerben" : "Apply for this Role"}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? "اختر وسيلة التقديم الأنسب المتاحة من قبل الشركة المشغلة."
                  : "Wählen Sie Ihren bevorzugten Bewerbungsweg."}
              </p>
            </div>

            {/* Option A: Direct Company Email Available */}
            {job.contactEmail ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">{isAr ? "بريد الشركة المباشر:" : "Company Email:"}</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span>✓</span>
                      <span>{isAr ? "تقديم مباشر" : "Direct"}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 font-mono text-xs text-white">
                    <span className="truncate">{job.contactEmail}</span>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="text-blue-400 hover:text-white shrink-0 cursor-pointer font-sans text-[11px] font-bold"
                    >
                      {copiedEmail ? "✓ تم النسخ" : "نسخ"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <a
                    href={mailtoLink}
                    className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm text-center shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>✉️</span>
                    <span>{isAr ? "إرسال بريد التقديم المباشر" : isDe ? "Per E-Mail bewerben" : "Apply via Email"}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowEmailModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>📝</span>
                    <span>{isAr ? "عرض نموذج الرسالة الألمانية الجاهزة" : "Show German Email Template"}</span>
                  </button>
                </div>

                {job.applyUrl && (
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowPortalNotice(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>🌐</span>
                      <span>{isAr ? "أو التقديم عبر رابط الموقع الخارجي" : "Or Apply via External Site"}</span>
                      <span className="text-slate-500">↗</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Option B: External Apply Portal */
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowPortalNotice(true)}
                  className="w-full py-4 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm text-center shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-98"
                >
                  <span>🚀</span>
                  <span>{isAr ? "الانتقال لبوابة التقديم الرسمية" : isDe ? "Zur offiziellen Bewerbung" : "Apply on Company Website"}</span>
                  <span>↗</span>
                </button>
                <p className="text-[11px] text-center text-slate-400">
                  {isAr
                    ? "تنبيه: ستنتقل للموقع الرسمي للشركة المشغلة لإتمام طلبك."
                    : "You will be redirected to the official company recruitment portal."}
                </p>
              </div>
            )}
          </div>

          {/* TWO PRIMARY INTEGRATION BUTTONS */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-xl">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span>⚡</span>
              <span>{isAr ? "أدوات الذكاء الاصطناعي لهذه الوظيفة" : isDe ? "KI-Integrationen für diesen Job" : "AI Tools for this Role"}</span>
            </h4>

            {/* Button 1: Cover Letter Generator with prefill */}
            <Link
              href={coverLetterUrl}
              className="group block p-3.5 rounded-2xl bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/40 transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between text-white font-bold text-xs group-hover:text-blue-400 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-base">✨</span>
                  <span>{isAr ? "تجهيز خطاب التقديم (Anschreiben)" : isDe ? "Anschreiben generieren" : "Generate Cover Letter"}</span>
                </div>
                <span>→</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isAr
                  ? "توليد خطاب دافع بالذكاء الاصطناعي معبأ مسبقاً بمسمى الوظيفة واسم الشركة ومتطلباتها طبقاً لمعايير DIN 5008."
                  : isDe
                  ? "Erstellt automatisch ein maßgeschneidertes DIN 5008 Anschreiben mit den Daten dieses Jobs."
                  : "Prefills job title, company, and requirements into our AI cover letter builder."}
              </p>
            </Link>

            {/* Button 2: ATS Resume Compatibility Audit */}
            <Link
              href={atsAnalyzerUrl}
              className="group block p-3.5 rounded-2xl bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/40 transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between text-white font-bold text-xs group-hover:text-blue-400 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔍</span>
                  <span>{isAr ? "فحص توافق السيرة (ATS) مع الوظيفة" : isDe ? "ATS-Check für diese Stelle" : "Run ATS Match Audit"}</span>
                </div>
                <span>→</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isAr
                  ? "فحص نسبة تطابق سيرتك الذاتية مع متطلبات وشروط هذه الوظيفة، واكتشاف الكلمات المفتاحية الناقصة."
                  : isDe
                  ? "Prüft Ihren Lebenslauf auf Übereinstimmung mit den Schlüsselwörtern dieser Stelle."
                  : "Checks your CV against this specific job's keywords and requirements."}
              </p>
            </Link>
          </div>

          {/* Quick Summary Info Card */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 space-y-4 text-xs">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span>ℹ️</span>
              <span>{isAr ? "بطاقة معلومات سريعة" : "Job Overview"}</span>
            </h4>

            <div className="space-y-2.5 text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">{isAr ? "الشركة:" : "Company:"}</span>
                <span className="font-semibold text-white">{job.company}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">{isAr ? "المدينة:" : "City:"}</span>
                <span className="font-semibold text-white">{job.city || "Germany"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">{isAr ? "نوع العمل:" : "Job Type:"}</span>
                <span className="font-semibold text-white">{job.jobType || "Full-time"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">{isAr ? "مستوى اللغة:" : "Language:"}</span>
                <span className="font-semibold text-emerald-400 font-mono">{job.languageReq || "B1/B2"}</span>
              </div>
              {job.salary && (
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">{isAr ? "الراتب التقديري:" : "Salary:"}</span>
                  <span className="font-semibold text-amber-300">{job.salary}</span>
                </div>
              )}
            </div>

            {/* Share / Copy Link Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🔗</span>
                <span>{copiedLink ? (isAr ? "✓ تم نسخ رابط الوظيفة!" : "Link Copied!") : (isAr ? "مشاركة رابط الوظيفة" : "Share Job Link")}</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* MODAL 1: Prepared Readiness Notice Before External Redirect */}
      {showPortalNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-2xl shrink-0">
                🚀
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isAr ? "تأكيد الانتقال لبوابة التقديم" : isDe ? "Weiterleitung zur Bewerbung" : "Proceed to External Application"}
                </h3>
                <p className="text-xs text-slate-400">
                  {job.company} • {job.title}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300 leading-relaxed">
              <p className="font-bold text-amber-300">
                {isAr
                  ? "🛡️ نصيحة تأكد قبل تقديم طلبك:"
                  : "🛡️ Important check before applying:"}
              </p>
              <p>
                {isAr
                  ? "الشركات الألمانية تفضل استلام ملف الترشيح متكاملاً (Bewerbungsmappe) وفق معيار DIN 5008. تأكد من تحميل نسختك بصيغة PDF لتكون جاهزة للرفع على بوابة الشركة."
                  : "German employers expect DIN 5008 compliant resumes and job-tailored cover letters."}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPortalNotice(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                {isAr ? "إلغاء والعودة" : "Cancel"}
              </button>
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowPortalNotice(false)}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold text-center shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>{isAr ? "الانتقال للتقديم الآن" : "Continue to Portal"}</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: German Application Email Template Viewer */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📝</span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {isAr ? "نموذج رسالة التقديم بالألمانية (Email Template)" : "German Email Application Template"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-white text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400">
                {isAr ? "عنوان الرسالة (Betreff):" : "Subject:"}
              </label>
              <input
                type="text"
                readOnly
                value={emailSubject}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400">
                {isAr ? "نص الرسالة (Text):" : "Body text:"}
              </label>
              <textarea
                readOnly
                rows={8}
                value={emailBody}
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs leading-relaxed resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${emailSubject}\n\n${emailBody}`);
                  setCopiedEmail(true);
                  setTimeout(() => setCopiedEmail(false), 2500);
                }}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>📋</span>
                <span>{copiedEmail ? (isAr ? "✓ تم نسخ النموذج!" : "Copied!") : (isAr ? "نسخ النموذج بالكامل" : "Copy Template")}</span>
              </button>

              <a
                href={mailtoLink}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold text-center shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>✉️</span>
                <span>{isAr ? "فتح في برنامج البريد" : "Open Mail Client"}</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
