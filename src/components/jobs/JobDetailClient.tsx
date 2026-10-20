"use client";

import React, { useState } from "react";
import Link from "next/link";
import { stripHtml } from "@/lib/cover-letter";
import GermanTtsButton from "@/components/blog/GermanTtsButton";
import { getDictionary, isValidLocale, DEFAULT_LOCALE, LOCALE_METADATA, type Locale } from "@/lib/i18n";

import {
  JobDetailData,
  extractGermanTitle,
  splitBilingualTitle,
  GERMAN_CITIES_MAP,
  extractGermanCity,
  extractReferenceNumber,
  extractCefrLevel,
  detectPortalInfo,
  FAKE_EMAIL_DOMAINS,
  FAKE_EMAIL_EXACT,
  isValidHrEmail,
  extractCleanHrEmail,
  getAnerkennungDetails,
} from "@/lib/jobUtils";

interface JobDetailClientProps {
  job?: JobDetailData | null;
  locale?: string | null;
  initialUser?: {
    id: string;
    email: string;
    name: string | null;
    plan: string;
    aiCredits?: number;
    planExpiresAt?: string | null;
  } | null;
}

// Parses raw description into clean, structured segments
interface ParsedDescription {
  intro: string;
  responsibilities: string[];
  additionalDetails: string[];
}

function parseDescriptionSections(raw?: string | null): ParsedDescription {
  if (!raw || typeof raw !== "string") {
    return { intro: "", responsibilities: [], additionalDetails: [] };
  }
  try {
    const cleaned = stripHtml(raw);
    if (!cleaned) {
      return { intro: "", responsibilities: [], additionalDetails: [] };
    }

    // Split into paragraphs by newlines
    const rawParagraphs = cleaned
      .split(/\r?\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (rawParagraphs.length === 0) {
      return { intro: "", responsibilities: [], additionalDetails: [] };
    }

    const intro = rawParagraphs[0];
    const responsibilities: string[] = [];
    const additionalDetails: string[] = [];

    for (let i = 1; i < rawParagraphs.length; i++) {
      const p = rawParagraphs[i];

      // Check if the paragraph has bullet characters
      if (/[•\-\*\u2022]/.test(p)) {
        const items = p
          .split(/[•\-\*\u2022]/)
          .map((s) => s.trim().replace(/^[:،.\s]+|[:،.\s]+$/g, ""))
          .filter((s) => s.length > 5);
        responsibilities.push(...items);
      } else {
        // Split by sentence delimiters if it's a long paragraph
        const sentences = p
          .split(/(?<=[.!؟])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 15);

        if (sentences.length > 1) {
          for (const s of sentences) {
            if (
              /ستعمل|ستتركز|مسؤولياتك|مهامك|ستقوم|تتضمن|ستشارك|ستتولى|تقديم الدعم|تطوير|متابعة|إدارة|Aufgaben|Verantwortung|Tasks|Responsibilities/i.test(
                s
              ) ||
              responsibilities.length < 6
            ) {
              responsibilities.push(s);
            } else {
              additionalDetails.push(s);
            }
          }
        } else {
          if (responsibilities.length < 5) {
            responsibilities.push(p);
          } else {
            additionalDetails.push(p);
          }
        }
      }
    }

    // Fallback: If no subsequent paragraphs, extract sentences from intro
    if (responsibilities.length === 0 && intro.length > 150) {
      const sentences = intro
        .split(/(?<=[.!؟])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 15);
      if (sentences.length >= 3) {
        return {
          intro: sentences.slice(0, 1).join(" "),
          responsibilities: sentences.slice(1),
          additionalDetails: [],
        };
      }
    }

    return { intro, responsibilities, additionalDetails };
  } catch {
    return { intro: "", responsibilities: [], additionalDetails: [] };
  }
}

// Parses raw requirements into structured categories
interface ParsedRequirements {
  languageItem: string | null;
  degreeItem: string | null;
  skillsItems: string[];
}

function parseRequirementsSections(
  rawRequirements?: string | null,
  languageReq?: string | null
): ParsedRequirements {
  let list: string[] = [];

  if (rawRequirements && typeof rawRequirements === "string") {
    try {
      const parsed = JSON.parse(rawRequirements);
      if (Array.isArray(parsed)) {
        list = parsed
          .map((item) => String(item).replace(/^[•\-\*\.،:\s]+/, "").trim())
          .filter(Boolean);
      }
    } catch {
      list = rawRequirements
        .split(/\r?\n|[•\-\*\u2022]/)
        .map((r) => r.replace(/^[•\-\*\.،:\s]+/, "").trim())
        .filter((r) => r.length > 2);
    }
  }

  const safeLangReq = typeof languageReq === "string" ? languageReq : null;
  let languageItem: string | null = null;
  let degreeItem: string | null = null;
  const skillsItems: string[] = [];

  for (const item of list) {
    if (!item || typeof item !== "string") continue;
    const lower = item.toLowerCase();
    const isLang =
      /لغة|لغوي|ألمانية|إنجليزية|deutsch|englisch|sprache|cefr|c1|c2|b1|b2|a1|a2/i.test(
        lower
      );
    const isDegree =
      /مؤهل|شهادة|جامعي|دبلوم|بكالوريوس|ماجستير|studium|abschluss|ausbildung|universität|bachelor|master/i.test(
        lower
      );

    if (isLang && !languageItem) {
      languageItem = item;
    } else if (isDegree && !degreeItem) {
      degreeItem = item;
    } else {
      skillsItems.push(item);
    }
  }

  return {
    languageItem:
      languageItem ||
      (safeLangReq ? `إتقان اللغة الألمانية / الإنجليزية بمستوى ${safeLangReq}` : null),
    degreeItem,
    skillsItems,
  };
}

function formatJobDate(dateInput?: string | Date | null, isAr = false, isDe = false): string {
  if (!dateInput) return isAr ? "محدث حديثاً" : isDe ? "Kürzlich aktualisiert" : "Recently updated";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return isAr ? "محدث حديثاً" : isDe ? "Kürzlich aktualisiert" : "Recently updated";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays <= 0) {
      return isAr ? "اليوم" : isDe ? "Heute" : "Today";
    }
    if (diffDays === 1) {
      return isAr ? "منذ يوم واحد" : isDe ? "Gestern" : "Yesterday";
    }
    if (diffDays < 7) {
      return isAr ? `منذ ${diffDays} أيام` : isDe ? `Vor ${diffDays} Tagen` : `${diffDays} days ago`;
    }
    return d.toLocaleDateString(isAr ? "ar-EG" : isDe ? "de-DE" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isAr ? "محدث حديثاً" : "Recently updated";
  }
}

function toSafeIsoString(val: unknown): string {
  if (!val) return new Date().toISOString();
  try {
    if (val instanceof Date) {
      return isNaN(val.getTime()) ? new Date().toISOString() : val.toISOString();
    }
    if (typeof val === "string" || typeof val === "number") {
      const d = new Date(val);
      return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    }
  } catch {
    return new Date().toISOString();
  }
  return new Date().toISOString();
}

function toSafeOptionalIsoString(val: unknown): string | null {
  if (!val) return null;
  try {
    if (val instanceof Date) {
      return isNaN(val.getTime()) ? null : val.toISOString();
    }
    if (typeof val === "string" || typeof val === "number") {
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d.toISOString();
    }
  } catch {
    return null;
  }
  return null;
}

export default function JobDetailClient({
  job: initialJob,
  locale = "ar",
  initialUser = null,
}: JobDetailClientProps) {
  const safeLocaleStr = typeof locale === "string" ? locale : DEFAULT_LOCALE;
  const activeLocale: Locale = isValidLocale(safeLocaleStr) ? (safeLocaleStr as Locale) : DEFAULT_LOCALE;
  const dict = getDictionary(activeLocale);
  const currentMeta = LOCALE_METADATA[activeLocale];
  const isAr = activeLocale === "ar";
  const isDe = activeLocale === "de";
  const dir = currentMeta?.dir || (isAr ? "rtl" : "ltr");

  // Defensive fallback job object to prevent SSR crashes if job is null or undefined
  const job: JobDetailData = {
    id: initialJob?.id || "job-default",
    title: initialJob?.title || (isAr ? "فرصة عمل في ألمانيا" : "Stelle in Deutschland"),
    company: initialJob?.company || (isAr ? "جهة عمل معتمدة" : "Arbeitgeber"),
    city: initialJob?.city || "Deutschland",
    category: initialJob?.category || "General",
    jobType: initialJob?.jobType || "Vollzeit",
    languageReq: initialJob?.languageReq || "B1",
    salary: initialJob?.salary || null,
    applyUrl: initialJob?.applyUrl || "",
    contactEmail: initialJob?.contactEmail || null,
    requirements: initialJob?.requirements || null,
    descriptionRaw: initialJob?.descriptionRaw || "",
    publishedAt: toSafeIsoString(initialJob?.publishedAt),
    expiresAt: toSafeOptionalIsoString(initialJob?.expiresAt),
    createdAt: toSafeOptionalIsoString(initialJob?.createdAt),
    updatedAt: toSafeOptionalIsoString(initialJob?.updatedAt),
    isVerified: initialJob?.isVerified ?? true,
  };

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Derived metadata & helpers
  const { primaryTitle, latinSubtitle } = splitBilingualTitle(job.title);
  const germanTitle = latinSubtitle || extractGermanTitle(job.title);
  const germanCity = extractGermanCity(job.city);
  const cleanCompany =
    (job.company || "").replace(/[\u0600-\u06FF]/g, "").trim() ||
    job.company ||
    "Arbeitgeber";
  const referenceNumber = extractReferenceNumber(job);
  const cefrLevel = extractCefrLevel(job.languageReq, job.requirements);
  const portalInfo = detectPortalInfo(job.applyUrl);
  const anerkennung = getAnerkennungDetails(job.category, isAr, isDe);
  const formattedDate = formatJobDate(job.publishedAt, isAr, isDe);

  const parsedDescription = parseDescriptionSections(job.descriptionRaw);
  const parsedRequirements = parseRequirementsSections(job.requirements, job.languageReq);

  // URLs for AI suites with safe URI encoding
  const coverLetterUrl = `/${activeLocale}/dashboard/cover-letters/new?jobTitle=${encodeURIComponent(
    job.title || ""
  )}&companyName=${encodeURIComponent(cleanCompany || "")}&jobId=${encodeURIComponent(
    job.id || ""
  )}&jobDescription=${encodeURIComponent(
    job.requirements || job.descriptionRaw || ""
  )}`;

  const atsAnalyzerUrl = `/${activeLocale}/dashboard/ats-analyzer?jobDescription=${encodeURIComponent(
    job.requirements || job.descriptionRaw || ""
  )}`;

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

  const effectiveEmail = extractCleanHrEmail(job);

  const isApplyUrlWeb = Boolean(
    job.applyUrl &&
      typeof job.applyUrl === "string" &&
      !job.applyUrl.toLowerCase().startsWith("mailto:") &&
      (job.applyUrl.startsWith("http://") ||
        job.applyUrl.startsWith("https://") ||
        job.applyUrl.includes("."))
  );

  const hasPortal = Boolean(job.applyUrl && isApplyUrlWeb);
  const hasEmail = Boolean(effectiveEmail && effectiveEmail.length > 0);

  const handleCopyEmail = async (emailToCopy?: string | null) => {
    const target = (emailToCopy || effectiveEmail || job.contactEmail || "").trim();
    if (!target) return;
    await copyToClipboard(target);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleCopyRef = async () => {
    if (!referenceNumber) return;
    await copyToClipboard(referenceNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const handleCopyLink = async () => {
    if (typeof window !== "undefined") {
      await copyToClipboard(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const emailSubject = `Bewerbung als ${germanTitle} (${referenceNumber}) - ${cleanCompany}`;
  const LRM = "\u200E";
  const emailBody = [
    `${LRM}Sehr geehrte Damen und Herren,${LRM}`,
    "",
    `${LRM}hiermit bewerbe ich mich auf die von Ihnen ausgeschriebene Stelle als ${germanTitle} in ${germanCity} (Referenznummer: ${referenceNumber}).${LRM}`,
    "",
    `${LRM}Anbei sende ich Ihnen meine vollständigen Bewerbungsunterlagen (Lebenslauf und Anschreiben nach DIN 5008).${LRM}`,
    "",
    `${LRM}Über eine Einladung zu einem persönlichen Gespräch freue ich mich sehr.${LRM}`,
    "",
    `${LRM}Mit freundlichen Grüßen,${LRM}`,
    `${LRM}[Ihr Vorname und Nachname]${LRM}`,
  ].join("\n");

  const handleSmartMailSend = async (emailToSend?: string | null) => {
    const target = (emailToSend || effectiveEmail || job.contactEmail || "").trim();
    if (!target) return;

    await copyToClipboard(target);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);

    const toastMessage =
      dict?.jobs?.details?.emailDraftToast ||
      (isAr
        ? "✓ تم نسخ بريد الشركة وفتح مسودة التقديم!"
        : "✓ E-Mail kopiert & Bewerbungsentwurf geöffnet!");
    setToast(toastMessage);
    setTimeout(() => setToast(null), 4500);

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&hl=en&to=${encodeURIComponent(
      target
    )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    if (typeof window !== "undefined") {
      window.open(gmailUrl, "_blank", "noopener,noreferrer");
    }
  };

  const mailtoLink = effectiveEmail
    ? `mailto:${encodeURIComponent(effectiveEmail)}?subject=${encodeURIComponent(emailSubject)}`
    : "";

  const getVerificationBadgeText = (): string => {
    try {
      if (effectiveEmail) {
        return isAr
          ? "✉️ تقديم مباشر عبر البريد الإلكتروني"
          : isDe
          ? "✉️ Direkte E-Mail-Bewerbung"
          : "✉️ Direct Email Application";
      }
      return isAr
        ? "🌐 تقديم مباشر عبر الموقع الرسمي للشركة"
        : isDe
        ? "🌐 Direkte Bewerbung über das Unternehmensportal"
        : "🌐 Direct Official Portal Application";
    } catch {
      return isAr
        ? "🌐 تقديم مباشر عبر الموقع الرسمي للشركة"
        : "🌐 Direct Official Portal Application";
    }
  };

  const reassuringMicrocopy = isAr
    ? "جميع الوظائف من مصادر رسمية معتمدة في ألمانيا ولا توجد أي رسوم وساطة."
    : isDe
    ? "Alle Stellenangebote stammen aus offiziell verifizierten Quellen in Deutschland – 100% gebührenfrei ohne Vermittler."
    : "All job openings are sourced from verified official German feeds with zero intermediary fees.";

  // Renders the Direct HR Email or Official Portal Application Card
  const renderDirectApplicationChannels = (keyPrefix = "desktop") => (
    <div
      key={`${keyPrefix}-apply-card`}
      className={`rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl backdrop-blur-xl relative overflow-hidden text-slate-100 ${
        hasEmail
          ? "bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30"
          : "bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/30 border border-blue-500/30"
      }`}
    >
      <div
        className={`absolute top-0 right-0 w-64 h-64 blur-3xl pointer-events-none -mr-20 -mt-20 ${
          hasEmail ? "bg-emerald-600/10" : "bg-blue-600/10"
        }`}
      />

      <div className="relative space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {hasEmail ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-400">
                <span>✉️</span>
                <span>{isAr ? "تقديم مباشر عبر البريد الإلكتروني" : isDe ? "Direkte E-Mail-Bewerbung" : "Direct Email Application"}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-xs font-bold text-blue-400">
                <span>🌐</span>
                <span>{isAr ? "تقديم مباشر عبر الموقع الرسمي للشركة" : isDe ? "Offizielles Unternehmensportal" : "Official Company Portal"}</span>
              </span>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white">
            {hasEmail
              ? isAr
                ? "التقديم المباشر عبر البريد الإلكتروني"
                : isDe
                ? "Direkt per E-Mail bewerben"
                : "Direct Email Application"
              : isAr
              ? "التقديم عبر موقع الشركة الرسمي"
              : isDe
              ? "Bewerbung über das offizielle Portal"
              : "Apply via Official Company Portal"}
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed">
            {hasEmail
              ? isAr
                ? `يمكنك مراسلة قسم التوظيف لدى ${cleanCompany} مباشرة وإرسال سيرتك الذاتية دون أي وسيط.`
                : `Direct recruiter contact for ${cleanCompany}. Send your CV directly to their hiring inbox.`
              : isAr
              ? `يتم التقديم لهذه الفرصة مباشرة عبر بوابة التوظيف الرسمية الخاصة بـ ${cleanCompany} بدون أي رسوم أو وسطاء.`
              : `Apply directly through ${cleanCompany}'s official careers portal with zero intermediary fees.`}
          </p>
        </div>

        {/* State A: Direct HR Email Display & Actions */}
        {hasEmail && effectiveEmail && (
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">
                  {isAr ? "البريد الإلكتروني للتوظيف:" : isDe ? "E-Mail für Bewerbungen:" : "Official Recruiter Email:"}
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                  <span>✉️</span>
                  <span>{isAr ? "بريد رسمي مباشر" : isDe ? "Direktkontakt" : "Direct Email"}</span>
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 font-mono text-xs sm:text-sm text-white" dir="ltr">
                <span className="break-all font-bold select-all text-emerald-300 dir-ltr text-left [direction:ltr]" dir="ltr">
                  {effectiveEmail}
                </span>
              </div>
            </div>

            {/* 1 Primary (Open in Gmail) + 1 Secondary (Copy Email) right next to it */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSmartMailSend(effectiveEmail)}
                className="w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/40"
              >
                <span>✉️</span>
                <span>
                  {isAr
                    ? "فتح في Gmail وإرسال السيرة ✉️"
                    : isDe
                    ? "In Gmail öffnen & senden ✉️"
                    : "Open in Gmail & Send ✉️"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyEmail(effectiveEmail)}
                className="w-full min-h-[48px] py-3.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-100 hover:text-white border border-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <span>📋</span>
                <span>
                  {copiedEmail
                    ? isAr
                      ? "✓ تم نسخ الإيميل!"
                      : "✓ Copied!"
                    : isAr
                    ? "نسخ الإيميل 📋"
                    : "Copy Email 📋"}
                </span>
              </button>
            </div>

            {/* Preparation secondary CTA */}
            <Link
              href={coverLetterUrl}
              className="w-full min-h-[44px] py-2.5 px-3.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>✨</span>
              <span>
                {isAr
                  ? "تجهيز خطاب الدافع (Anschreiben) لهذه الوظيفة ✨"
                  : isDe
                  ? "Anschreiben für diese Stelle vorbereiten ✨"
                  : "Prepare Tailored Cover Letter ✨"}
              </span>
            </Link>

            {/* German Template Toggle & Optional Company Web Page Link */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                className="w-full sm:flex-1 min-h-[42px] py-2.5 px-3 rounded-xl bg-slate-950/70 hover:bg-slate-950 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>📝</span>
                <span>
                  {isAr
                    ? "عرض نموذج الإيميل بالألمانية (Muster-Vorlage)"
                    : isDe
                    ? "E-Mail-Vorlage anzeigen"
                    : "Show German Email Template"}
                </span>
              </button>

              {hasPortal && (
                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 min-h-[42px] py-2.5 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <span>🌐</span>
                  <span>
                    {isAr
                      ? "زيارة إعلان الوظيفة بموقع الشركة ↗"
                      : isDe
                      ? "Unternehmensseite besuchen ↗"
                      : "View on company site ↗"}
                  </span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* State B: Official Employer Portal (when no direct email) */}
        {!hasEmail && hasPortal && (
          <div className="space-y-4 pt-1">
            {/* One primary, prominent button */}
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[52px] py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-black text-sm sm:text-base text-center shadow-xl shadow-blue-600/30 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer ring-1 ring-blue-400/40"
            >
              <span>🌐</span>
              <span>
                {isAr
                  ? "التقديم الآن عبر موقع الشركة الرسمي ↗"
                  : isDe
                  ? "Jetzt über Unternehmensportal bewerben ↗"
                  : "Apply Now on Company Portal ↗"}
              </span>
            </a>

            {/* Secondary button: prepare Anschreiben */}
            <Link
              href={coverLetterUrl}
              className="w-full min-h-[46px] py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-100 hover:text-white border border-slate-700 font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>✨</span>
              <span>
                {isAr
                  ? "تجهيز خطاب الدافع (Anschreiben) لهذه الوظيفة ✨"
                  : isDe
                  ? "Anschreiben für diese Stelle vorbereiten ✨"
                  : "Prepare Tailored Cover Letter (Anschreiben) ✨"}
              </span>
            </Link>

            {/* German Bewerbungsformular Guide */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2 text-start">
              <div className="flex items-center gap-1.5 font-bold text-blue-400 text-[11px]">
                <span>💡</span>
                <span>
                  {isAr
                    ? "دليل التقديم في استمارة الشركة الرسمية (Bewerbungsformular):"
                    : isDe
                    ? "Leitfaden für das offizielle Bewerbungsformular:"
                    : "Guide for the Official Application Form (Bewerbungsformular):"}
                </span>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-300 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="shrink-0 select-none">1️⃣</span>
                  <span>
                    {isAr
                      ? "جهّز ملف سيرتك الذاتية (Lebenslauf) وخطاب الدافع (Anschreiben) بصيغة PDF."
                      : isDe
                      ? "Bereiten Sie Lebenslauf & Anschreiben als PDF vor."
                      : "Prepare your CV (Lebenslauf) and cover letter (Anschreiben) as PDF."}
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="shrink-0 select-none">2️⃣</span>
                  <span>
                    {isAr
                      ? "اضغط على زر التقديم الرسمي أعلاه لفتح استمارة جهة العمل المباشرة."
                      : isDe
                      ? "Klicken Sie oben auf den Button, um das Bewerbungsformular zu öffnen."
                      : "Click the official button above to open the employer's form."}
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="shrink-0 select-none">3️⃣</span>
                  <span>
                    {isAr
                      ? "في استمارة الشركة: املأ اسمك وبريدك وارفع ملف PDF في خانة (Lebenslauf / Unterlagen) ثم اضغط (Bewerbung absenden)."
                      : isDe
                      ? "Im Formular: Name & E-Mail eintragen, PDF bei (Lebenslauf / Unterlagen) hochladen und absenden."
                      : "In the form: enter your name and email, upload your PDF under (Lebenslauf / Unterlagen) and submit."}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* State C: Neither (Rare fallback) */}
        {!hasEmail && !hasPortal && (
          <div className="space-y-3 pt-1">
            <Link
              href={coverLetterUrl}
              className="w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-extrabold text-sm text-center shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>✨</span>
              <span>{isAr ? "تجهيز خطاب الدافع (Anschreiben) لهذه الوظيفة ✨" : "Prepare Tailored Cover Letter ✨"}</span>
            </Link>
          </div>
        )}

        {/* Reassuring Source Transparency Micro-Copy */}
        <div className="flex items-center gap-2 text-[11px] text-slate-300 pt-3 border-t border-slate-800/80">
          <span className="text-emerald-400 text-sm shrink-0">🛡️</span>
          <span className="leading-relaxed">{reassuringMicrocopy}</span>
        </div>

        {/* In-Card Toast Notification */}
        {toast && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-inner">
            <span className="text-sm shrink-0">✓</span>
            <span className="leading-snug">{toast}</span>
          </div>
        )}
      </div>
    </div>
  );

  // Renders the AI Career Suite Box
  const renderAiSuiteBox = (keyPrefix = "desktop") => (
    <div
      key={`${keyPrefix}-ai-box`}
      className="rounded-3xl bg-slate-900/90 border border-blue-500/20 p-6 space-y-4 shadow-xl backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">⚡</span>
          <h3 className="font-bold text-white text-xs sm:text-sm">
            {isAr ? "أدوات الذكاء الاصطناعي التنافسية" : "AI Career Suite"}
          </h3>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-[11px] font-bold">
          +85% ATS Score
        </span>
      </div>

      {/* Tool 1: Cover Letter Generator */}
      <Link
        href={coverLetterUrl}
        className="group block p-4 rounded-2xl bg-slate-950 hover:bg-slate-950/80 border border-slate-800 hover:border-blue-500/40 transition-all space-y-1.5 min-h-[48px]"
      >
        <div className="flex items-center justify-between text-white font-bold text-xs group-hover:text-blue-400 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <span>{isAr ? "توليد خطاب الدافع (Anschreiben)" : "DIN 5008 Cover Letter Studio"}</span>
          </div>
          <span className={dir === "rtl" ? "rotate-180" : ""}>→</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {isAr
            ? `صياغة خطاب دافع ألماني مخصص لـ ${cleanCompany} طبقاً لمعايير DIN 5008 معبأ بمتطلبات الشاغر.`
            : `Generate a tailored DIN 5008 cover letter pre-filled with ${cleanCompany} and role details.`}
        </p>
      </Link>

      {/* Tool 2: ATS Analyzer */}
      <Link
        href={atsAnalyzerUrl}
        className="group block p-4 rounded-2xl bg-slate-950 hover:bg-slate-950/80 border border-slate-800 hover:border-blue-500/40 transition-all space-y-1.5 min-h-[48px]"
      >
        <div className="flex items-center justify-between text-white font-bold text-xs group-hover:text-blue-400 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-base">🔍</span>
            <span>{isAr ? "فاحص التوافق مع أنظمة الفرز (ATS)" : "ATS Job-Resume Matcher"}</span>
          </div>
          <span className={dir === "rtl" ? "rotate-180" : ""}>→</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {isAr
            ? "فحص نسبة تطابق سيرتك الذاتية مع متطلبات هذا الإعلان واكتشاف الكلمات المفتاحية الناقصة فوراً."
            : "Audit your CV against this job's keywords and score higher on recruiter ATS scans."}
        </p>
      </Link>
    </div>
  );

  // Renders the 3-Step Roadmap Stepper
  const renderRoadmapStepper = (keyPrefix = "desktop") => (
    <div
      key={`${keyPrefix}-stepper`}
      className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl backdrop-blur-xl"
    >
      <div className="flex items-center gap-2">
        <span className="text-base select-none">🧭</span>
        <h3 className="font-bold text-white text-xs sm:text-sm">
          {isAr
            ? "مسار الخطوات الثلاث لضمان القبول"
            : isDe
            ? "3-Schritte-Erfolgsplan zur Bewerbung"
            : "3-Step Acceptance Roadmap"}
        </h3>
      </div>

      <div className="space-y-4 pt-1">
        <div className="flex items-start gap-3 relative">
          <div className="flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">
              1
            </span>
            <div className="w-0.5 h-10 bg-slate-800 mt-1" />
          </div>
          <div className="space-y-0.5 flex-1">
            <h4 className="text-xs font-bold text-white">
              {isAr ? "تجهيز السيرة الذاتية (DIN 5008)" : "Lebenslauf vorbereiten (DIN 5008)"}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isAr
                ? "سيرة ذاتية بترتيب عكسي متوافقة أوروبياً مع خوارزميات الفرز الآلي."
                : "ATS-optimized reverse chronological resume formatted to German standards."}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 relative">
          <div className="flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">
              2
            </span>
            <div className="w-0.5 h-10 bg-slate-800 mt-1" />
          </div>
          <div className="space-y-0.5 flex-1">
            <h4 className="text-xs font-bold text-white">
              {isAr
                ? `صياغة خطاب الدافع المخصص لـ ${cleanCompany}`
                : `Anschreiben für ${cleanCompany} erstellen`}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isAr
                ? "خطاب رسمي يستهدف مسمى الوظيفة ومتطلبات صاحب العمل بدقة."
                : "Official German Anschreiben addressing role specifications."}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0">
            3
          </span>
          <div className="space-y-0.5 flex-1">
            <h4 className="text-xs font-bold text-white">
              {isAr
                ? "إرسال الملف الموحد (Bewerbungsmappe) مباشرة"
                : "Bewerbungsmappe direkt einreichen"}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isAr
                ? "إرسال الملف عبر البوابة الرسمية للشركة أو بريد الموارد البشرية."
                : "Submit via official ATS portal or directly to HR email."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Renders the Quick Overview / Share Card
  const renderOverviewCard = (keyPrefix = "desktop") => (
    <div
      key={`${keyPrefix}-overview`}
      className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 space-y-4 text-xs"
    >
      <h3 className="font-bold text-white text-sm flex items-center gap-2">
        <span>ℹ️</span>
        <span>{isAr ? "بيانات الاعتماد والشاغر" : dict?.jobs?.details?.overviewTitle || "Übersicht"}</span>
      </h3>

      <div className="space-y-2.5 text-slate-300">
        <div className="flex justify-between py-1 border-b border-slate-800/80 gap-2">
          <span className="text-slate-400 shrink-0">{dict?.jobs?.details?.company || (isAr ? "الشركة" : "Unternehmen")}</span>
          <span className="font-semibold text-white text-end break-words [overflow-wrap:anywhere]">{job.company}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-800/80 gap-2">
          <span className="text-slate-400 shrink-0">{dict?.jobs?.details?.city || (isAr ? "المدينة" : "Standort")}</span>
          <span className="font-semibold text-white text-end break-words">{job.city || dict?.jobs?.details?.germany || "Deutschland"}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-800/80 gap-2">
          <span className="text-slate-400 shrink-0">{dict?.jobs?.details?.jobType || (isAr ? "نوع العمل" : "Anstellungsart")}</span>
          <span className="font-semibold text-white text-end">{job.jobType || dict?.jobs?.details?.fullTime || "Vollzeit"}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-800/80 gap-2">
          <span className="text-slate-400 shrink-0">{dict?.jobs?.details?.languageLevel || (isAr ? "مستوى اللغة" : "Sprachniveau")}</span>
          <span className="font-semibold text-emerald-400 font-mono text-end">{cefrLevel}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-800/80 gap-2">
          <span className="text-slate-400 shrink-0">{isAr ? "كود المرجع:" : "Ref-Nr:"}</span>
          <span dir="ltr" className="font-mono text-slate-300 font-bold">{referenceNumber}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-800/80 gap-2">
          <span className="text-slate-400 shrink-0">{isAr ? "معيار التقديم:" : "Standard:"}</span>
          <span dir="ltr" className="font-mono text-blue-400 font-bold">DIN 5008</span>
        </div>

        {job.salary && (
          <div className="flex justify-between py-1 border-b border-slate-800/80 gap-2">
            <span className="text-slate-400 shrink-0">{dict?.jobs?.details?.salary || (isAr ? "الراتب" : "Gehalt")}</span>
            <span className="font-semibold text-emerald-400 text-end break-words">
              {job.salary}
            </span>
          </div>
        )}
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={handleCopyLink}
          className="w-full min-h-[48px] py-3 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 active:scale-[0.98] border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <span>🔗</span>
          <span>{copiedLink ? (dict?.jobs?.details?.linkCopied || "✓ Kopiert!") : (dict?.jobs?.details?.shareJob || "Job teilen")}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8" dir={dir}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================= */}
        {/* Main Column: Trust Header, Primary CTA, Scannable Cards   */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. Header & Official Verification Seal (Trust Layer) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-xl">
            
            {/* Top Verification Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
              {/* Official Seal with Pulse Indicator */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shadow-[0_0_20px_rgba(16,185,129,0.12)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>{getVerificationBadgeText()}</span>
              </div>

              {/* German Standards & Reference ID Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* DIN 5008 Compliance Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300 text-xs font-medium">
                  <span className="text-blue-400 font-bold">DIN</span>
                  <span>
                    {isAr ? "معيار التقديم:" : "Standard:"}{" "}
                    <span dir="ltr" className="font-mono text-white font-semibold">DIN 5008</span>
                  </span>
                </span>

                {/* Official Reference Number */}
                <button
                  type="button"
                  onClick={handleCopyRef}
                  title={isAr ? "اضغط لنسخ كود المرجع" : "Click to copy Reference Number"}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 hover:border-blue-500/40 text-slate-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                >
                  <span className="text-slate-500">Ref-Nr:</span>
                  <span dir="ltr" className="text-slate-200 font-bold">{referenceNumber}</span>
                  <span className="text-[10px] text-blue-400">
                    {copiedRef ? (isAr ? "✓ تم" : "✓") : "📋"}
                  </span>
                </button>
              </div>
            </div>

            {/* Job Title & Corporate Details */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-2 flex-1">
                  <h1
                    dir="auto"
                    className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug text-start break-words [overflow-wrap:anywhere]"
                  >
                    <bdi>{primaryTitle}</bdi>
                  </h1>
                  {latinSubtitle && (
                    <div className="pt-0.5">
                      <span
                        dir="ltr"
                        className="inline-block px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-medium text-xs sm:text-sm font-mono dir-ltr text-left [direction:ltr] [unicode-bidi:isolate]"
                      >
                        {latinSubtitle}
                      </span>
                    </div>
                  )}
                </div>
                <GermanTtsButton
                  text={latinSubtitle || germanTitle || "Stelle in Deutschland"}
                  size="sm"
                  variant="blue"
                  label={isAr ? "نطق المسمى بالألمانية" : isDe ? "Aussprache" : "Pronounce"}
                />
              </div>

              <div className="flex items-center gap-4 text-sm sm:text-base text-slate-300 flex-wrap">
                <span className="font-bold text-blue-400 flex items-center gap-1.5 break-words [overflow-wrap:anywhere]" dir="auto">
                  <span>🏢</span>
                  <span>{job.company}</span>
                </span>
                <span className="text-slate-400 flex items-center gap-1.5 break-words">
                  <span>📍</span>
                  <span>{job.city || dict?.jobs?.details?.germany || "Deutschland"}</span>
                  {isAr && job.city && GERMAN_CITIES_MAP[job.city] && (
                    <span dir="ltr" className="text-xs text-slate-500 font-mono">
                      ({GERMAN_CITIES_MAP[job.city]})
                    </span>
                  )}
                </span>
                <span className="text-slate-400 flex items-center gap-1.5 text-xs">
                  <span>📅</span>
                  <span suppressHydrationWarning>{formattedDate}</span>
                </span>
              </div>
            </div>

            {/* Official Meta Chips */}
            <div className="flex items-center gap-2.5 flex-wrap pt-2">
              <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center gap-1.5">
                <span>🌐</span>
                <span>{job.category}</span>
              </span>

              <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5">
                <span>💼</span>
                <span>{job.jobType || dict?.jobs?.details?.fullTime || "Vollzeit"}</span>
              </span>

              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <span>🇩🇪</span>
                <span>
                  {isAr ? "المستوى اللغوي الإلزامي:" : "Language:"}{" "}
                  <span dir="ltr" className="font-mono">{cefrLevel}</span>
                </span>
              </span>

              {job.salary && (
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-1.5 break-words">
                  <span>💰</span>
                  <span>{job.salary}</span>
                </span>
              )}
            </div>

            {/* 2. Direct Application Action Hub (Case A: Direct Verified Email / Case B: Official Portal) */}
            {renderDirectApplicationChannels("main-hero")}

          </div>

          {/* 3. Deconstructing the Wall of Text (Modern Card Layout) */}
          <div className="space-y-6">

            {/* ==================================================== */}
            {/* Card A: نبذة ومسؤوليات العمل (Aufgaben & Verantwortung) */}
            {/* ==================================================== */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-sm font-bold">
                    📋
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-white">
                      {isAr ? "نبذة ومسؤوليات العمل" : isDe ? "Aufgaben & Verantwortung" : "Role & Responsibilities"}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {isAr
                        ? "نظرة شاملة على المهام التشغيلية اليومية والدور الوظيفي داخل المؤسسة"
                        : "Operational overview of daily duties and corporate scope"}
                    </p>
                  </div>
                </div>

                <span dir="ltr" className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  Aufgaben & Verantwortung
                </span>
              </div>

              {/* Executive Overview Highlight */}
              {parsedDescription.intro && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 text-slate-200 text-sm leading-relaxed space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                    <span>🏢</span>
                    <span>
                      {isAr
                        ? `سياق الدور في ${cleanCompany}:`
                        : `Context at ${cleanCompany}:`}
                    </span>
                  </div>
                  <p dir="auto" className="text-start text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {parsedDescription.intro}
                  </p>
                </div>
              )}

              {/* Structured Responsibilities Checklist */}
              {parsedDescription.responsibilities.length > 0 ? (
                <div className="space-y-3 pt-1">
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>
                      {isAr
                        ? "المهام والمسؤوليات الأساسية (Kernaufgaben):"
                        : isDe
                        ? "Ihre Kernaufgaben im Überblick:"
                        : "Key Core Responsibilities:"}
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 gap-2.5">
                    {parsedDescription.responsibilities.map((resp, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70 hover:border-slate-700 transition-colors"
                      >
                        <span className="w-5 h-5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 select-none">
                          ✓
                        </span>
                        <span
                          dir="auto"
                          className="text-xs sm:text-sm text-slate-300 leading-relaxed text-start flex-1"
                        >
                          {resp}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  {dict?.jobs?.details?.noDescription || (isAr ? "لا يوجد وصف إضافي متوفر للشاغر حالياً." : "Keine Beschreibung verfügbar.")}
                </p>
              )}

              {/* Additional Context or Benefits if present */}
              {parsedDescription.additionalDetails.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2 text-xs text-slate-400">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <span>💡</span>
                    <span>{isAr ? "معلومات إضافية عن بيئة العمل:" : "Additional Workplace Context:"}</span>
                  </span>
                  <div className="space-y-1.5 leading-relaxed" dir="auto">
                    {parsedDescription.additionalDetails.map((detail, idx) => (
                      <p key={idx}>{detail}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Stack: AI Career Tools */}
            <div className="block lg:hidden space-y-6">
              {renderAiSuiteBox("mobile-primary")}
            </div>

            {/* ==================================================== */}
            {/* Card B: الشروط والمؤهلات المطلوبة (Anforderungen & Anerkennung) */}
            {/* ==================================================== */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-sm font-bold">
                    🎯
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-white">
                      {isAr ? "الشروط والمؤهلات المطلوبة" : isDe ? "Anforderungen & Anerkennung" : "Requirements & Recognition"}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {isAr
                        ? "المعايير المحددة لقبول طلب الترشيح وفق اشتراطات سوق العمل الألماني"
                        : "Official prerequisites and criteria under German labor standards"}
                    </p>
                  </div>
                </div>

                <span dir="ltr" className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  Anforderungen & Qualifikation
                </span>
              </div>

              {/* Module 1: Language Requirement Box (صندوق الكفاءة اللغوية - CEFR Level) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-blue-500/20 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center text-lg shrink-0">
                      🇩🇪
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {isAr ? "شرط الكفاءة اللغوية الأوروبي (CEFR Sprachniveau)" : "Mandatory CEFR Language Level"}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                          {cefrLevel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {isAr
                          ? "وفق الإطار المرجعي الأوروبي المشترك للغات (Goethe / telc / TestDaF / ÖSD)"
                          : "Common European Framework of Reference for Languages standard"}
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs font-semibold">
                    Zertifikat: {cefrLevel}
                  </span>
                </div>

                <p dir="auto" className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-start">
                  {parsedRequirements.languageItem
                    ? parsedRequirements.languageItem
                    : isAr
                    ? `يتطلب هذا الدور إتقان اللغة بالمستوى المحدد (${cefrLevel}) لضمان التواصل المهني السلس، ويوصى بإرفاق شهادة لغة معتمدة ضمن ملف الترشيح.`
                    : `This position requires proficiency at level ${cefrLevel}. An accredited language certificate is strongly recommended.`}
                </p>
              </div>

              {/* Module 2: Degree & Equivalence Status (Anerkennung der ausländischen Berufsqualifikation) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base select-none">🎓</span>
                    <h3 className="text-xs sm:text-sm font-bold text-white">
                      {anerkennung.title}
                    </h3>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px] font-semibold">
                    {anerkennung.badge}
                  </span>
                </div>

                <p dir="auto" className="text-xs text-slate-300 leading-relaxed text-start">
                  {parsedRequirements.degreeItem ? (
                    <span className="font-semibold text-slate-200 block mb-1">
                      {parsedRequirements.degreeItem}
                    </span>
                  ) : null}
                  {anerkennung.desc}
                </p>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                  <span className="text-blue-400 font-bold">✓</span>
                  <span>{anerkennung.statusText}</span>
                </div>
              </div>

              {/* Module 3: Clinical / Technical Skills Checklist */}
              {parsedRequirements.skillsItems.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>
                      {isAr
                        ? "المهارات والخبرات العملية المطلوبة:"
                        : isDe
                        ? "Fachliche & persönliche Anforderungen:"
                        : "Technical & Practical Qualifications:"}
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 gap-2.5">
                    {parsedRequirements.skillsItems.map((req, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70 hover:border-slate-700 transition-colors"
                      >
                        <span className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 select-none">
                          ✓
                        </span>
                        <span
                          dir="auto"
                          className="text-xs sm:text-sm text-slate-300 leading-relaxed text-start flex-1"
                        >
                          {req}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ==================================================== */}
            {/* Card C: إرشادات التقديم وقبول الملف لدى صاحب العمل (Bewerbungstipps) */}
            {/* ==================================================== */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-sm font-bold">
                    🇩🇪
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-white">
                      {isAr
                        ? "إرشادات التقديم وقبول الملف لدى صاحب العمل (Bewerbungstipps)"
                        : isDe
                        ? "Bewerbungstipps & DIN 5008 Standards"
                        : "German Application Guidelines & DIN 5008"}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {isAr
                        ? "المعايير المتبعة لدى إدارات الموارد البشرية الألمانية لضمان دعوة المقابلة"
                        : "German HR recruiter standards to maximize interview invitation rates"}
                    </p>
                  </div>
                </div>

                <span dir="ltr" className="text-xs font-mono font-bold text-slate-300 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                  Standard: DIN 5008
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tip 1: Anti-chronological CV */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <h3 className="text-xs font-bold text-white">
                      {isAr ? "الترتيب الزمني العكسي" : "Antichronologischer Aufbau"}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isAr
                      ? "نسّق سيرتك الذاتية من الأحدث للأقدم طبقاً لمعايير DIN 5008 لتجتاز خوارزميات الفرز الآلي (ATS)."
                      : "Structure your CV starting with your most recent experience according to DIN 5008 rules."}
                  </p>
                </div>

                {/* Tip 2: Targeted Cover Letter */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <h3 className="text-xs font-bold text-white">
                      {isAr ? "خطاب دافع مخصص (Anschreiben)" : "Passgenaues Anschreiben"}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isAr
                      ? `وجّه الخطاب لشركة ${cleanCompany} مباشرة مع ذكر الرمز المرجعي (${referenceNumber}) في سطر الموضوع.`
                      : `Address the cover letter directly to ${cleanCompany} including the reference number (${referenceNumber}).`}
                  </p>
                </div>

                {/* Tip 3: Unified Dossier */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <h3 className="text-xs font-bold text-white">
                      {isAr ? "ملف موحد (Bewerbungsmappe)" : "Vollständige Bewerbungsmappe"}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isAr
                      ? "اجمع سيرتك الذاتية وخطاب الدافع وشهادات الخبرة ومستوى اللغة في ملف PDF واحد لا يتجاوز 10 ميغابايت."
                      : "Bundle your resume, cover letter, diplomas, and language certificates into a single PDF under 10MB."}
                  </p>
                </div>
              </div>

              {/* Action Buttons for Builders */}
              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <Link
                  href={`/${activeLocale}/dashboard/cv`}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📄</span>
                  <span>{isAr ? "منشئ السيرة الذاتية (DIN 5008)" : "DIN 5008 CV Builder"}</span>
                </Link>

                <Link
                  href={coverLetterUrl}
                  className="px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>✨</span>
                  <span>{isAr ? "صياغة خطاب الدافع للوظيفة" : "Draft Tailored Cover Letter"}</span>
                </Link>
              </div>
            </div>

            {/* Mobile Stack: Acceptance Roadmap & Quick Overview (placed at bottom on mobile screens) */}
            <div className="block lg:hidden space-y-6">
              {renderRoadmapStepper("mobile-secondary")}
              {renderOverviewCard("mobile-secondary")}
            </div>

          </div>

        </div>

        {/* ========================================================= */}
        {/* Desktop Sidebar: Sticky Top 24                            */}
        {/* ========================================================= */}
        <div className="hidden lg:block lg:col-span-4 space-y-6 sticky top-24">
          {renderRoadmapStepper("desktop")}
          {renderAiSuiteBox("desktop")}
          {renderOverviewCard("desktop")}
        </div>

      </div>

      {/* German Application Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-2xl">📝</span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {dict?.jobs?.details?.templateModalTitle || (isAr ? "نموذج رسالة التقديم بالألمانية" : "Muster-Bewerbungsschreiben")}
                </h3>
                <GermanTtsButton
                  text={emailBody || ""}
                  size="sm"
                  variant="emerald"
                  label={isAr ? "استمع لنص الرسالة" : isDe ? "Vorlesen" : "Listen"}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-white text-lg p-1 cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400">
                {dict?.jobs?.details?.subject || (isAr ? "موضوع الرسالة" : "Betreff")}
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
                {dict?.jobs?.details?.bodyText || (isAr ? "نص الرسالة" : "Nachrichtentext")}
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
                className="flex-1 min-h-[48px] py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>📋</span>
                <span>{copiedEmail ? (dict?.jobs?.details?.copiedSuccess || "✓ Kopiert!") : (dict?.jobs?.details?.copyTemplate || "Vorlage kopieren")}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSmartMailSend(effectiveEmail);
                  setShowEmailModal(false);
                }}
                className="flex-1 min-h-[48px] py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs sm:text-sm font-extrabold text-center shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>✉️</span>
                <span>{dict?.jobs?.details?.openGmail || "In Gmail öffnen"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-900 border border-blue-500/40 text-white font-bold text-xs sm:text-sm shadow-2xl backdrop-blur-md animate-fadeIn">
          <span className="text-base sm:text-lg shrink-0">📬</span>
          <span>{toast}</span>
        </div>
      )}

    </div>
  );
}
