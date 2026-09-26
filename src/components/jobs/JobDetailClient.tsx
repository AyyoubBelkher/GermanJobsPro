"use client";

import React, { useState } from "react";
import Link from "next/link";
import { stripHtml } from "@/components/jobs/JobBoardClient";
import { getDictionary, isValidLocale, DEFAULT_LOCALE, LOCALE_METADATA, type Locale } from "@/lib/i18n";

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
  initialUser?: {
    id: string;
    email: string;
    name: string | null;
    plan: string;
  } | null;
  initialApplication?: {
    id: string;
    status: string;
  } | null;
}

// Extracts Latin/German title inside parentheses e.g. "مدير تسويق (Marketing Manager)" -> "Marketing Manager"
const extractGermanTitle = (rawTitle: string): string => {
  const match = rawTitle.match(/\(([A-Za-z0-9\s/&+\-_.,]+)\)/);
  if (match && match[1]?.trim()) {
    return match[1].trim();
  }
  const latinOnly = rawTitle.replace(/[\u0600-\u06FF:،–—]/g, "").trim();
  return latinOnly.length > 2 ? latinOnly : rawTitle;
};

const GERMAN_CITIES_MAP: Record<string, string> = {
  "برلين": "Berlin",
  "ميونخ": "München",
  "ميونيخ": "München",
  "هامبورغ": "Hamburg",
  "فرانكفورت": "Frankfurt am Main",
  "كولونيا": "Köln",
  "كولن": "Köln",
  "دوسلدورف": "Düsseldorf",
  "شتوتغارت": "Stuttgart",
  "لايبزيغ": "Leipzig",
  "دورتموند": "Dortmund",
  "إسن": "Essen",
  "إيسن": "Essen",
  "بريمن": "Bremen",
  "درسدن": "Dresden",
  "هانوفر": "Hannover",
  "نورنبرغ": "Nürnberg",
  "بون": "Bonn",
  "مانهايم": "Mannheim",
  "كارلسروه": "Karlsruhe",
  "أوغسبورغ": "Augsburg",
  "فيسبادن": "Wiesbaden",
  "ألمانيا": "Deutschland",
};

const extractGermanCity = (rawCity?: string | null): string => {
  if (!rawCity) return "Deutschland";
  const trimmed = rawCity.trim();
  if (GERMAN_CITIES_MAP[trimmed]) {
    return GERMAN_CITIES_MAP[trimmed];
  }
  for (const [ar, de] of Object.entries(GERMAN_CITIES_MAP)) {
    if (trimmed.includes(ar)) return de;
  }
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    const latinOnly = trimmed.replace(/[\u0600-\u06FF:،–—]/g, "").trim();
    return latinOnly.length > 2 ? latinOnly : "Deutschland";
  }
  return trimmed;
};

const isArabicText = (text: string) => /[\u0600-\u06FF]/.test(text);

export default function JobDetailClient({
  job,
  locale,
  initialUser,
  initialApplication,
}: JobDetailClientProps) {
  const activeLocale: Locale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(activeLocale);
  const currentMeta = LOCALE_METADATA[activeLocale];
  const isAr = activeLocale === "ar";
  const isDe = activeLocale === "de";
  const dir = currentMeta.dir;

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [trackedStatus, setTrackedStatus] = useState<string | null>(
    initialApplication?.status || null
  );
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Clean and parse requirements
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

  const germanTitle = extractGermanTitle(job.title);
  const germanCity = extractGermanCity(job.city);
  const cleanCompany = job.company?.replace(/[\u0600-\u06FF]/g, "").trim() || job.company;

  const coverLetterUrl = `/${activeLocale}/dashboard/cover-letters/new?jobTitle=${encodeURIComponent(
    germanTitle
  )}&companyName=${encodeURIComponent(cleanCompany)}&jobDescription=${encodeURIComponent(
    job.requirements || job.descriptionRaw || ""
  )}`;

  const atsAnalyzerUrl = `/${activeLocale}/dashboard/ats-analyzer?jobDescription=${encodeURIComponent(
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

  const emailSubject = `Bewerbung als ${germanTitle} - ${cleanCompany}`;
  const LRM = "\u200E";
  const emailBody = [
    `${LRM}Sehr geehrte Damen und Herren,${LRM}`,
    "",
    `${LRM}hiermit bewerbe ich mich auf die von Ihnen ausgeschriebene Stelle als ${germanTitle} in ${germanCity}.${LRM}`,
    "",
    `${LRM}Anbei sende ich Ihnen meine vollständigen Bewerbungsunterlagen (Lebenslauf und Anschreiben nach DIN 5008).${LRM}`,
    "",
    `${LRM}Über eine Einladung zu einem persönlichen Gespräch freue ich mich sehr.${LRM}`,
    "",
    `${LRM}Mit freundlichen Grüßen,${LRM}`,
    `${LRM}[Ihr Vorname und Nachname]${LRM}`,
  ].join("\n");

  const handleSmartMailSend = async () => {
    if (!job.contactEmail) return;

    // Auto-track as APPLIED if user is logged in and not already APPLIED
    if (initialUser && trackedStatus !== "APPLIED") {
      handleTrackApplication("APPLIED");
    }

    await copyToClipboard(job.contactEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);

    const toastMessage = dict.jobs.details.emailDraftToast;
    setToast(toastMessage);
    setTimeout(() => setToast(null), 4500);

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&hl=en&to=${encodeURIComponent(
      job.contactEmail
    )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    if (typeof window !== "undefined") {
      window.open(gmailUrl, "_blank", "noopener,noreferrer");
    }
  };

  const mailtoLink = job.contactEmail
    ? `mailto:${job.contactEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    : "";

  const handleTrackApplication = async (newStatus: "SAVED" | "APPLIED" = "SAVED") => {
    if (!initialUser) {
      window.location.href = `/${activeLocale}/auth/login?redirect=${encodeURIComponent(
        `/${activeLocale}/jobs/${job.id}`
      )}`;
      return;
    }

    setTrackingLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: job.id,
          companyName: cleanCompany,
          jobTitle: germanTitle,
          location: germanCity || job.city || "Deutschland",
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTrackedStatus(data.application.status);
        setToast(
          isAr
            ? newStatus === "APPLIED"
              ? "تم تسجيل تقديمك وتتبع طلبك بنجاح!"
              : "تم حفظ الوظيفة في قائمة تقديماتك بنجاح!"
            : isDe
            ? newStatus === "APPLIED"
              ? "Bewerbung erfolgreich erfasst!"
              : "Job in deinen Bewerbungen gespeichert!"
            : newStatus === "APPLIED"
            ? "Application successfully tracked as Applied!"
            : "Job successfully saved to your Applications!"
        );
        setTimeout(() => setToast(null), 5000);
      } else {
        setToast(data.error || "Failed to track application");
        setTimeout(() => setToast(null), 5000);
      }
    } catch (err) {
      console.error("[Track Application Error]:", err);
      setToast(isAr ? "حدث خطأ أثناء حفظ التقديم." : "Failed to track application.");
      setTimeout(() => setToast(null), 5000);
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="space-y-10" dir={dir}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Column: Details & Requirements */}
        <div className="lg:col-span-8 space-y-8">
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-xl">
            {/* Job Tags */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
                {job.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium">
                {job.jobType || dict.jobs.details.fullTime}
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

            {/* Job Title & Company */}
            <div dir={dir} className={`space-y-2 ${isAr ? "text-right" : "text-left"}`}>
              <h1 dir="auto" className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug text-start">
                <bdi>{job.title}</bdi>
              </h1>
              <div className="flex items-center gap-4 text-sm sm:text-base text-slate-300 flex-wrap">
                <span className="font-bold text-blue-400 flex items-center gap-1.5" dir="auto">
                  <span>🏢</span>
                  <span>{job.company}</span>
                </span>
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span>📍</span>
                  <span>{job.city || dict.jobs.details.germany}</span>
                </span>
              </div>
            </div>

            {/* Quick AI Apply Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <span className="font-bold text-white text-sm">
                    {dict.jobs.details.quickAiApplyBanner}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {dict.jobs.details.quickAiApplyDesc}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleTrackApplication(trackedStatus === "SAVED" ? "APPLIED" : "SAVED")}
                  disabled={trackingLoading}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                    trackedStatus === "APPLIED"
                      ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                      : trackedStatus === "SAVED"
                      ? "bg-blue-600/30 text-blue-300 border border-blue-500/40"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  }`}
                >
                  <span>{trackedStatus === "APPLIED" ? "✅" : trackedStatus === "SAVED" ? "📌" : "💼"}</span>
                  <span>
                    {trackingLoading
                      ? isAr
                        ? "جاري الحفظ..."
                        : "Saving..."
                      : trackedStatus === "APPLIED"
                      ? isAr
                        ? "تم التقديم"
                        : "Applied"
                      : trackedStatus === "SAVED"
                      ? isAr
                        ? "محفوظ في التقديمات"
                        : "Saved"
                      : isAr
                      ? "حفظ في قائمة تقديماتي / Track Application"
                      : "Track Application"}
                  </span>
                </button>
                <Link
                  href={coverLetterUrl}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>✨</span>
                  <span>{dict.jobs.details.draftCoverLetter}</span>
                </Link>
              </div>
            </div>

            {/* Job Description */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📄</span>
                <span>{dict.jobs.details.jobDescription}</span>
              </h3>

              {cleanedDescription ? (
                <div
                  dir="auto"
                  className="text-sm text-slate-300 leading-relaxed space-y-3 whitespace-pre-line font-normal text-start"
                >
                  {cleanedDescription}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  {dict.jobs.details.noDescription}
                </p>
              )}
            </div>

            {/* Job Requirements */}
            {(parsedRequirements.length > 0 || job.requirements) && (
              <div className="space-y-4 pt-6 border-t border-slate-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🎯</span>
                  <span>{dict.jobs.details.requirements}</span>
                </h3>

                {parsedRequirements.length > 0 ? (
                  <ul className="space-y-2.5 text-sm text-slate-300 text-start">
                    {parsedRequirements.map((req, idx) => {
                      const isRtl = isArabicText(req);
                      return (
                        <li
                          key={idx}
                          dir={isRtl ? "rtl" : "ltr"}
                          className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed text-start"
                        >
                          <span className="text-blue-400 mt-1 shrink-0 select-none">✓</span>
                          <span className="flex-1">{req}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div
                    dir={isArabicText(job.requirements || "") ? "rtl" : "ltr"}
                    className="text-sm text-slate-300 leading-relaxed whitespace-pre-line text-start"
                  >
                    {job.requirements}
                  </div>
                )}
              </div>
            )}

            {/* Application Success Tips */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800/80 p-5 space-y-3">
              <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                <span>🇩🇪</span>
                <span>{dict.jobs.details.successTipsTitle}</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">1.</span>
                  <span>{dict.jobs.details.tip1}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">2.</span>
                  <span>{dict.jobs.details.tip2}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">3.</span>
                  <span>{dict.jobs.details.tip3}</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* Sidebar: Direct Application & AI Tools */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          
          {/* Direct Email Application Card */}
          <div className="rounded-3xl bg-slate-900 border-2 border-blue-500/40 p-6 space-y-5 shadow-2xl">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                {dict.jobs.details.applyTitle}
              </span>
              <h3 className="text-lg font-black text-white">
                {dict.jobs.details.applyTitle}
              </h3>
              <p className="text-xs text-slate-400">
                {dict.jobs.details.applySubtitle}
              </p>
            </div>

            {job.contactEmail ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">{dict.jobs.details.companyEmail}</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span>✓</span>
                      <span>{dict.jobs.details.directApplyBadge}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 font-mono text-xs text-white" dir="ltr">
                    <span className="truncate">{job.contactEmail}</span>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="text-blue-400 hover:text-white shrink-0 cursor-pointer font-sans text-[11px] font-bold"
                    >
                      {copiedEmail ? dict.jobs.details.copiedSuccess : dict.common.copy}
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
                      <span>{dict.jobs.details.sendDirectEmail}</span>
                    </button>

                    <a
                      href={mailtoLink}
                      title={dict.jobs.details.openMailApp}
                      className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center justify-center cursor-pointer shrink-0"
                    >
                      <span className="text-base" aria-hidden="true">📱</span>
                      <span className="sr-only">Mailto</span>
                    </a>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span className="text-slate-500 flex items-center gap-1">
                      <span>🚀</span>
                      <span>{dict.jobs.details.gmailNotice}</span>
                    </span>
                    <a
                      href={mailtoLink}
                      className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-medium transition-colors"
                    >
                      <span>{dict.jobs.details.mailAppNotice}</span>
                      <span>↗</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowEmailModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>📝</span>
                    <span>{dict.jobs.details.showTemplate}</span>
                  </button>

                  {/* Application OS Direct Track Action */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleTrackApplication(trackedStatus === "SAVED" ? "APPLIED" : "SAVED")}
                      disabled={trackingLoading}
                      className={`w-full py-3 px-4 rounded-2xl font-bold text-xs text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                        trackedStatus === "APPLIED"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                          : trackedStatus === "SAVED"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      <span>{trackedStatus === "APPLIED" ? "✅" : trackedStatus === "SAVED" ? "📌" : "💼"}</span>
                      <span>
                        {trackingLoading
                          ? isAr
                            ? "جاري الحفظ في التقديمات..."
                            : isDe
                            ? "Wird gespeichert..."
                            : "Saving to Tracker..."
                          : trackedStatus === "APPLIED"
                          ? isAr
                            ? "تم التقديم (مسجل في قائمة تقديماتك)"
                            : isDe
                            ? "✓ Als beworben erfasst"
                            : "✓ Applied (In Tracker)"
                          : trackedStatus === "SAVED"
                          ? isAr
                            ? "محفوظ في قائمة تقديماتي (اضغط للتعيين كتم التقديم)"
                            : isDe
                            ? "✓ Gespeichert (Klick für Beworben)"
                            : "✓ Saved (Click to set as Applied)"
                          : isAr
                          ? "حفظ في قائمة تقديماتي / Track Application"
                          : isDe
                          ? "In Bewerbungen speichern / Tracken"
                          : "Track Application"}
                      </span>
                    </button>

                    {trackedStatus && (
                      <div className="text-center">
                        <Link
                          href={`/${activeLocale}/dashboard`}
                          className="text-[11px] text-blue-400 hover:text-blue-300 underline font-medium transition-colors"
                        >
                          {isAr
                            ? "متابعة حالة التقديم في لوحة التحكم ←"
                            : isDe
                            ? "Bewerbungsstatus im Dashboard ansehen ←"
                            : "Manage applications in Dashboard →"}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <a
                  href={mailtoLink || `mailto:info@${cleanCompany.toLowerCase().replace(/[^a-z0-9]/g, "")}.de`}
                  className="w-full py-4 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm text-center shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>✉️</span>
                  <span>{dict.jobs.details.directEmailApply}</span>
                </a>

                {/* Application OS Direct Track Action */}
                <button
                  type="button"
                  onClick={() => handleTrackApplication(trackedStatus === "SAVED" ? "APPLIED" : "SAVED")}
                  disabled={trackingLoading}
                  className={`w-full py-3 px-4 rounded-2xl font-bold text-xs text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    trackedStatus === "APPLIED"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                      : trackedStatus === "SAVED"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <span>{trackedStatus === "APPLIED" ? "✅" : trackedStatus === "SAVED" ? "📌" : "💼"}</span>
                  <span>
                    {trackingLoading
                      ? isAr
                        ? "جاري الحفظ في التقديمات..."
                        : isDe
                        ? "Wird gespeichert..."
                        : "Saving to Tracker..."
                      : trackedStatus === "APPLIED"
                      ? isAr
                        ? "تم التقديم (مسجل في قائمة تقديماتك)"
                        : isDe
                        ? "✓ Als beworben erfasst"
                        : "✓ Applied (In Tracker)"
                      : trackedStatus === "SAVED"
                      ? isAr
                        ? "محفوظ في قائمة تقديماتي (اضغط للتعيين كتم التقديم)"
                        : isDe
                        ? "✓ Gespeichert (Klick für Beworben)"
                        : "✓ Saved (Click to set as Applied)"
                      : isAr
                      ? "حفظ في قائمة تقديماتي / Track Application"
                      : isDe
                      ? "In Bewerbungen speichern / Tracken"
                      : "Track Application"}
                  </span>
                </button>

                {trackedStatus && (
                  <div className="text-center">
                    <Link
                      href={`/${activeLocale}/dashboard`}
                      className="text-[11px] text-blue-400 hover:text-blue-300 underline font-medium transition-colors"
                    >
                      {isAr
                        ? "متابعة حالة التقديم في لوحة التحكم ←"
                        : isDe
                        ? "Bewerbungsstatus im Dashboard ansehen ←"
                        : "Manage applications in Dashboard →"}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Tools Cards */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-xl">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span>⚡</span>
              <span>{dict.jobs.details.aiToolsTitle}</span>
            </h4>

            <Link
              href={coverLetterUrl}
              className="group block p-3.5 rounded-2xl bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/40 transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between text-white font-bold text-xs group-hover:text-blue-400 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-base">✨</span>
                  <span>{dict.jobs.details.aiCoverLetterTitle}</span>
                </div>
                <span className={dir === "rtl" ? "rotate-180" : ""}>→</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {dict.jobs.details.aiCoverLetterDesc}
              </p>
            </Link>

            <Link
              href={atsAnalyzerUrl}
              className="group block p-3.5 rounded-2xl bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/40 transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between text-white font-bold text-xs group-hover:text-blue-400 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔍</span>
                  <span>{dict.jobs.details.aiAtsTitle}</span>
                </div>
                <span className={dir === "rtl" ? "rotate-180" : ""}>→</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {dict.jobs.details.aiAtsDesc}
              </p>
            </Link>
          </div>

          {/* Quick Overview Card */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 space-y-4 text-xs">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span>ℹ️</span>
              <span>{dict.jobs.details.overviewTitle}</span>
            </h4>

            <div className="space-y-2.5 text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">{dict.jobs.details.company}</span>
                <span className="font-semibold text-white">{job.company}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">{dict.jobs.details.city}</span>
                <span className="font-semibold text-white">{job.city || dict.jobs.details.germany}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">{dict.jobs.details.jobType}</span>
                <span className="font-semibold text-white">{job.jobType || dict.jobs.details.fullTime}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">{dict.jobs.details.languageLevel}</span>
                <span className="font-semibold text-emerald-400 font-mono">{job.languageReq || "B1/B2"}</span>
              </div>
              {job.salary && (
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">{dict.jobs.details.salary}</span>
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
                <span>{copiedLink ? dict.jobs.details.linkCopied : dict.jobs.details.shareJob}</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* German Application Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📝</span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {dict.jobs.details.templateModalTitle}
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
                {dict.jobs.details.subject}
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
                {dict.jobs.details.bodyText}
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
                <span>{copiedEmail ? dict.jobs.details.copiedSuccess : dict.jobs.details.copyTemplate}</span>
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
                <span>{dict.jobs.details.openGmail}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-2xl border border-emerald-400/40 backdrop-blur-md animate-fadeIn">
          <span className="text-base sm:text-lg shrink-0">📬</span>
          <span>{toast}</span>
        </div>
      )}

    </div>
  );
}
