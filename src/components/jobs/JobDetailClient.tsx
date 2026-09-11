"use client";

import React, { useState } from "react";
import Link from "next/link";
import { stripHtml } from "@/components/jobs/JobBoardClient";
import { extractGermanJobTitle } from "@/lib/cover-letter";

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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // تنظيف وتقسيم الشروط واستبعاد النقاط والشرطات المكررة في بداية كل سطر
  let parsedRequirements: string[] = [];
  if (job.requirements) {
    try {
      const parsed = JSON.parse(job.requirements);
      if (Array.isArray(parsed)) {
        parsedRequirements = parsed
          .map((item) => String(item).replace(/^[•\-\*\.،:\s]+/, "").trim())
          .filter(Boolean);
      }
    } catch {
      parsedRequirements = job.requirements
        .split(/\r?\n|•|-|\*/)
        .map((r) => r.replace(/^[•\-\*\.،:\s]+/, "").trim())
        .filter((r) => r.length > 2);
    }
  }

  const germanTitle = extractGermanJobTitle(job.title) || job.title;

  // إعداد روابط التوجيه لأدوات الذكاء الاصطناعي مع التعبئة المسبقة
  const coverLetterUrl = `/${locale}/dashboard/cover-letters/new?jobTitle=${encodeURIComponent(
    germanTitle
  )}&companyName=${encodeURIComponent(job.company)}&jobDescription=${encodeURIComponent(
    job.requirements || job.descriptionRaw || ""
  )}`;

  const atsAnalyzerUrl = `/${locale}/dashboard/ats-analyzer?jobDescription=${encodeURIComponent(
    job.requirements || job.descriptionRaw || ""
  )}`;

  const cleanedDescription = stripHtml(job.descriptionRaw);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    try {
      if (navigator?.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      console.warn("navigator.clipboard failed, attempting execCommand fallback:", err);
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.warn("Fallback clipboard copy failed:", err);
      return false;
    }
  };

  const handleCopyEmail = async () => {
    if (!job.contactEmail) return;
    await copyToClipboard(job.contactEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleCopyLink = async () => {
    if (typeof window !== "undefined") {
      await copyToClipboard(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const emailSubject = `Bewerbung als ${job.title} - ${job.company}`;
  const emailBody = `Sehr geehrte Damen und Herren,\n\nhiermit bewerbe ich mich auf die von Ihnen ausgeschriebene Stelle als ${job.title} in ${job.city || "Deutschland"}.\n\nAnbei finden Sie meine vollständigen Bewerbungsunterlagen (Lebenslauf und Anschreiben nach DIN 5008).\n\nMit freundlichen Grüßen,\n[Ihr Name]`;

  const handleSmartMailSend = async () => {
    if (!job.contactEmail) return;

    // 1. Copy contact email with graceful fallback
    await copyToClipboard(job.contactEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);

    // 2. Show notification
    const toastMessage = isAr
      ? "✓ تم نسخ بريد الشركة وفتح مسودة التقديم!"
      : "✓ E-Mail kopiert & Bewerbungsentwurf geöffnet!";
    setToast(toastMessage);
    setTimeout(() => setToast(null), 4500);

    // 3. Open Gmail Web Compose in a new browser tab with prefilled parameters
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      job.contactEmail
    )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    if (typeof window !== "undefined") {
      window.open(gmailUrl, "_blank", "noopener,noreferrer");
    }
  };

  const mailtoLink = job.contactEmail
    ? `mailto:${job.contactEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    : "";

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* العمود الرئيسي: تفاصيل الوظيفة والشروط */}
        <div className="lg:col-span-8 space-y-8">
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-xl">
            {/* وسوم الوظيفة */}
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

            {/* عنوان الوظيفة واسم الشركة */}
            <div dir={isAr ? "rtl" : "ltr"} className={`space-y-2 ${isAr ? "text-right" : "text-left"}`}>
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
                  <span>{job.city || (isAr ? "ألمانيا" : "Deutschland")}</span>
                </span>
              </div>
            </div>

            {/* بانر التقديم السريع بالذكاء الاصطناعي */}
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

            {/* نبذة وتفاصيل الوظيفة */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📄</span>
                <span>{isAr ? "نبذة وتفاصيل الوظيفة" : isDe ? "Stellenbeschreibung" : "Job Description"}</span>
              </h3>

              {cleanedDescription ? (
                <div
                  dir={isAr ? "rtl" : "ltr"}
                  className={`text-sm text-slate-300 leading-relaxed space-y-3 whitespace-pre-line font-normal ${
                    isAr ? "text-right" : "text-left"
                  }`}
                >
                  {cleanedDescription}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  {isAr
                    ? "لم يتم إدراج وصف تفصيلي إضافي، يمكنك الاطلاع على متطلبات التقديم المباشرة أدناه."
                    : "Keine ausführliche Beschreibung hinterlegt."}
                </p>
              )}
            </div>

            {/* شروط ومتطلبات الوظيفة */}
            {(parsedRequirements.length > 0 || job.requirements) && (
              <div className="space-y-4 pt-6 border-t border-slate-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🎯</span>
                  <span>{isAr ? "شروط ومتطلبات الوظيفة" : isDe ? "Anforderungen & Qualifikationen" : "Requirements & Qualifications"}</span>
                </h3>

                {parsedRequirements.length > 0 ? (
                  <ul className="space-y-2.5 text-sm text-slate-200" dir={isAr ? "rtl" : "ltr"}>
                    {parsedRequirements.map((req, idx) => (
                      <li key={idx} className={`flex items-start gap-3 ${isAr ? "text-right" : "text-left"}`}>
                        <span className="text-blue-400 font-bold shrink-0 mt-0.5 select-none">✓</span>
                        <span className="leading-relaxed flex-1">{req}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div
                    dir={isAr ? "rtl" : "ltr"}
                    className={`text-sm text-slate-300 leading-relaxed whitespace-pre-line ${
                      isAr ? "text-right" : "text-left"
                    }`}
                  >
                    {job.requirements}
                  </div>
                )}
              </div>
            )}

            {/* نصائح ملف التقديم الألماني */}
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
                      ? "اعتمد تنسيق السيرة الذاتية القياسي DIN 5008 مع ترتيب زمني عكسي وصورة شخصية مهنية."
                      : "Verwenden Sie einen tabellarischen Lebenslauf nach DIN 5008 im umgekehrt chronologischen Format."}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">2.</span>
                  <span>
                    {isAr
                      ? "قم بتضمين خطاب دافع (Anschreiben) مخصص لهذه الوظيفة يركز على متطلبات الشركة."
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

        {/* الشريط الجانبي: التقديم المباشر وأدوات الذكاء الاصطناعي */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          
          {/* بطاقة التقديم المباشر بالإيميل */}
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
                  ? "تواصل مباشرة مع قسم التوظيف في الشركة عبر البريد الإلكتروني الرسمي."
                  : "Bewerben Sie sich direkt per E-Mail bei der Personalabteilung."}
              </p>
            </div>

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
                  <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 font-mono text-xs text-white" dir="ltr">
                    <span className="truncate">{job.contactEmail}</span>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="text-blue-400 hover:text-white shrink-0 cursor-pointer font-sans text-[11px] font-bold"
                    >
                      {copiedEmail ? (isAr ? "✓ تم النسخ" : "Copied!") : (isAr ? "نسخ" : "Copy")}
                    </button>
                  </div>
                </div>

                {toast && (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-inner">
                    <span className="text-sm shrink-0">✓</span>
                    <span className="leading-snug">{toast}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSmartMailSend}
                      className="flex-1 py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm text-center shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <span>✉️</span>
                      <span>{isAr ? "إرسال بريد التقديم المباشر" : isDe ? "Per E-Mail bewerben" : "Apply via Email"}</span>
                    </button>

                    <a
                      href={mailtoLink}
                      title={isAr ? "فتح في تطبيق البريد بالجهاز (Mailto)" : isDe ? "Standard-Mailprogramm öffnen" : "Open native mail app"}
                      className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center justify-center cursor-pointer shrink-0"
                    >
                      <span className="text-base" aria-hidden="true">📱</span>
                      <span className="sr-only">Mailto</span>
                    </a>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span className="text-slate-500 flex items-center gap-1">
                      <span>🚀</span>
                      <span>{isAr ? "يفتح في Gmail وينسخ البريد" : "Opens Gmail Web Compose"}</span>
                    </span>
                    <a
                      href={mailtoLink}
                      className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-medium transition-colors"
                    >
                      <span>{isAr ? "تطبيق البريد (Mailto)" : "Native Mail App"}</span>
                      <span>↗</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowEmailModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>📝</span>
                    <span>{isAr ? "عرض نموذج الرسالة الألمانية الجاهزة" : "Show German Email Template"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <a
                  href={mailtoLink || `mailto:info@${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.de`}
                  className="w-full py-4 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm text-center shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>✉️</span>
                  <span>{isAr ? "التقديم المباشر للشركة" : "Direct Email Apply"}</span>
                </a>
              </div>
            )}
          </div>

          {/* بطاقات أدوات الذكاء الاصطناعي */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-xl">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span>⚡</span>
              <span>{isAr ? "أدوات الذكاء الاصطناعي لهذه الوظيفة" : isDe ? "KI-Integrationen für diesen Job" : "AI Tools for this Role"}</span>
            </h4>

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
                  : "Prefills job title, company, and requirements into our AI cover letter builder."}
              </p>
            </Link>

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
                  : "Checks your CV against this specific job's keywords and requirements."}
              </p>
            </Link>
          </div>

          {/* بطاقة ملخص المعلومات */}
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
                <span className="font-semibold text-white">{job.city || (isAr ? "ألمانيا" : "Germany")}</span>
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

      {/* نافذة نموذج رسالة التقديم بالألمانية */}
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
                dir="ltr"
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
                dir="ltr"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  await copyToClipboard(`${emailSubject}\n\n${emailBody}`);
                  setCopiedEmail(true);
                  setTimeout(() => setCopiedEmail(false), 2500);
                }}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>📋</span>
                <span>{copiedEmail ? (isAr ? "✓ تم نسخ النموذج!" : "Copied!") : (isAr ? "نسخ النموذج بالكامل" : "Copy Template")}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSmartMailSend();
                  setShowEmailModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold text-center shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>✉️</span>
                <span>{isAr ? "فتح في Gmail" : "Open in Gmail"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* إشعار عائم لتأكيد نسخ البريد وفتح المسودة */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-2xl border border-emerald-400/40 backdrop-blur-md animate-fadeIn">
          <span className="text-base sm:text-lg shrink-0">📬</span>
          <span>{toast}</span>
        </div>
      )}

    </div>
  );
}
