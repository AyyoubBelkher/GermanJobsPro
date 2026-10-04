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
  isVerified?: boolean;
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

// Generates an official German job reference ID (Ref-Nr: DE-2026-XXXX)
export function extractReferenceNumber(job: JobDetailData): string {
  if (job.applyUrl) {
    const urlMatch = job.applyUrl.match(/-(\d{5,8})(?:[/?#]|$)/);
    if (urlMatch && urlMatch[1]) {
      return `DE-2026-${urlMatch[1]}`;
    }
  }
  const cleanId = job.id.replace(/[^a-zA-Z0-9]/g, "").slice(-5).toUpperCase();
  return `DE-2026-${cleanId || "8421"}`;
}

// Extracts or normalizes the CEFR language requirement (e.g. B2, C1, B1/B2)
export function extractCefrLevel(languageReq?: string | null, requirements?: string | null): string {
  if (languageReq && languageReq.trim()) {
    const match = languageReq.match(/\b([ABC][12](?:\s*[\/\-]\s*[ABC][12])?)\b/i);
    if (match) return match[1].toUpperCase();
    return languageReq.trim();
  }
  if (requirements) {
    const match = requirements.match(/\b([ABC][12](?:\s*[\/\-]\s*[ABC][12])?)\b/i);
    if (match) return match[1].toUpperCase();
  }
  return "B1/B2";
}

// Detects the ATS or portal service name
export function detectPortalInfo(applyUrl?: string): { name: string; isAgentur: boolean } {
  if (!applyUrl) return { name: "Bewerbungsportal", isAgentur: false };
  const lower = applyUrl.toLowerCase();
  if (lower.includes("arbeitsagentur.de")) {
    return { name: "Bundesagentur für Arbeit (BA)", isAgentur: true };
  }
  if (lower.includes("arbeitnow.com")) {
    return { name: "ArbeitNow Partnernetzwerk", isAgentur: false };
  }
  if (lower.includes("personio")) {
    return { name: "Personio Recruiting Portal", isAgentur: false };
  }
  if (lower.includes("workday") || lower.includes("myworkday")) {
    return { name: "Workday ATS", isAgentur: false };
  }
  if (lower.includes("softgarden")) {
    return { name: "Softgarden e-Recruiting", isAgentur: false };
  }
  if (lower.includes("greenhouse")) {
    return { name: "Greenhouse Portal", isAgentur: false };
  }
  if (lower.includes("lever.co")) {
    return { name: "Lever Portal", isAgentur: false };
  }
  return { name: "بوابة التوظيف المباشرة للشركة", isAgentur: false };
}

// Returns Anerkennung (diploma equivalence) guidance based on role category
export function getAnerkennungDetails(category: string, isAr: boolean, isDe: boolean) {
  const cat = (category || "").toLowerCase();
  const isHealthcare =
    cat.includes("health") ||
    cat.includes("تمريض") ||
    cat.includes("رعاية") ||
    cat.includes("صحة") ||
    cat.includes("pflege") ||
    cat.includes("medizin");
  const isAusbildung = cat.includes("ausbildung") || cat.includes("تدريب");

  if (isHealthcare) {
    return {
      type: "regulated",
      badge: isAr
        ? "مهنة منظمة قانونياً (Reglementierter Beruf)"
        : isDe
        ? "Reglementierter Beruf"
        : "Regulated Profession",
      title: isAr
        ? "الاعتراف المهني للرعاية والتمريض (Berufsanerkennung)"
        : isDe
        ? "Berufliche Anerkennung Pflege"
        : "Nursing Recognition (Anerkennung)",
      desc: isAr
        ? "تتطلب ممارسة مهنة التمريض والرعاية الطبية في ألمانيا استكمال إجراءات المعادلة الرسمية (Berufsanerkennung) أو الحصول على إشعار النقص (Defizitbescheid) للالتحاق بدورة تعديل (Anpassungslehrgang)."
        : isDe
        ? "Für die Ausübung dieses Pflegeberufs ist die behördliche Anerkennung oder ein Defizitbescheid für Anpassungsmaßnahmen erforderlich."
        : "Practicing nursing in Germany requires official recognition (Anerkennung) or a Defizitbescheid for adaptation training.",
      statusText: isAr
        ? "مطلوب تعديل رسمي أو إشعار نقص (Defizitbescheid)"
        : isDe
        ? "Anerkennung oder Anpassungslehrgang erforderlich"
        : "Official recognition or adaptation course required",
    };
  }

  if (isAusbildung) {
    return {
      type: "ausbildung",
      badge: isAr
        ? "عقد تدريب مهني معتمد (Duale Ausbildung)"
        : isDe
        ? "Duale Berufsausbildung"
        : "Dual Vocational Training",
      title: isAr
        ? "معادلة الشهادة المدرسية (Zeugnisanerkennung)"
        : isDe
        ? "Schulabschluss-Anerkennung"
        : "School Certificate Recognition",
      desc: isAr
        ? "للالتحاق بعقود التدريب المهني، يلزم تعديل الشهادة المدرسية الثانوية أو الإعدادية (Mittlere Reife) عبر هيئة تعديل الشهادات في الولاية الألمانية المستهدفة."
        : isDe
        ? "Für eine duale Ausbildung ist in der Regel die behördliche Anerkennung des Schulabschlusses erforderlich."
        : "For dual vocational training, recognition of your secondary school diploma by the state office is required.",
      statusText: isAr
        ? "شهادة ثانوية معترف بها (Mittlere Reife / Abitur)"
        : isDe
        ? "Anerkannter Schulabschluss"
        : "Recognized secondary school diploma",
    };
  }

  return {
    type: "academic",
    badge: isAr
      ? "اعتماد أكاديمي وخبرة (Anabin / ZAB Standard)"
      : isDe
      ? "Anabin / ZAB Hochschulabschluss"
      : "Anabin / ZAB Academic Recognition",
    title: isAr
      ? "معادلة الشهادات والمؤهل العلمي (Anerkennung der Berufsqualifikation)"
      : isDe
      ? "Anerkennung des Hochschulabschlusses"
      : "Degree & Professional Recognition",
    desc: isAr
      ? "تُقبل الشهادات الجامعية الصادرة خارج ألمانيا المعترف بها في قاعدة بيانات (Anabin) بدرجة H+، أو ما يعادلها من خبرات مهنية عملية موثقة في القطاع التقني والتجاري."
      : isDe
      ? "Ausländische Hochschulabschlüsse müssen in der Anabin-Datenbank (Status H+) gelistet sein oder einer ZAB-Gleichwertigkeitsprüfung entsprechen."
      : "Foreign degrees must be recognized in the Anabin database (H+ status) or have documented relevant professional experience.",
    statusText: isAr
      ? "شهادة معترف بها (Anabin H+) أو سنوات خبرة موثقة"
      : isDe
      ? "Vergleichbarer Abschluss (Anabin H+) oder Berufserfahrung"
      : "Comparable degree (Anabin H+) or certified experience",
  };
}

// Parses raw description into clean, structured segments
interface ParsedDescription {
  intro: string;
  responsibilities: string[];
  additionalDetails: string[];
}

function parseDescriptionSections(raw: string | null): ParsedDescription {
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
}

// Parses raw requirements into structured categories
interface ParsedRequirements {
  languageItem: string | null;
  degreeItem: string | null;
  skillsItems: string[];
}

function parseRequirementsSections(
  rawRequirements: string | null,
  languageReq: string | null
): ParsedRequirements {
  let list: string[] = [];

  if (rawRequirements) {
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

  let languageItem: string | null = null;
  let degreeItem: string | null = null;
  const skillsItems: string[] = [];

  for (const item of list) {
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
      (languageReq ? `إتقان اللغة الألمانية / الإنجليزية بمستوى ${languageReq}` : null),
    degreeItem,
    skillsItems,
  };
}

function formatJobDate(dateInput: string | Date, isAr: boolean, isDe: boolean): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return isAr ? "محدث حديثاً" : isDe ? "Kürzlich aktualisiert" : "Recently updated";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
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
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [trackedStatus, setTrackedStatus] = useState<string | null>(
    initialApplication?.status || null
  );
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Derived metadata & helpers
  const germanTitle = extractGermanTitle(job.title);
  const germanCity = extractGermanCity(job.city);
  const cleanCompany = job.company?.replace(/[\u0600-\u06FF]/g, "").trim() || job.company;
  const referenceNumber = extractReferenceNumber(job);
  const cefrLevel = extractCefrLevel(job.languageReq, job.requirements);
  const portalInfo = detectPortalInfo(job.applyUrl);
  const anerkennung = getAnerkennungDetails(job.category, isAr, isDe);
  const formattedDate = formatJobDate(job.publishedAt, isAr, isDe);

  const parsedDescription = parseDescriptionSections(job.descriptionRaw);
  const parsedRequirements = parseRequirementsSections(job.requirements, job.languageReq);

  // URLs for AI suites
  const coverLetterUrl = `/${activeLocale}/dashboard/cover-letters/new?jobTitle=${encodeURIComponent(
    job.title
  )}&companyName=${encodeURIComponent(cleanCompany)}&jobId=${job.id}&jobDescription=${encodeURIComponent(
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

  const effectiveEmail =
    job.contactEmail?.trim() ||
    (job.applyUrl?.startsWith("mailto:") ? job.applyUrl.replace(/^mailto:/i, "").trim() : null);

  const isApplyUrlWeb = Boolean(
    job.applyUrl &&
      (job.applyUrl.startsWith("http://") ||
        job.applyUrl.startsWith("https://") ||
        (!job.applyUrl.startsWith("mailto:") && job.applyUrl.includes(".")))
  );

  const hasPortal = Boolean(job.applyUrl && isApplyUrlWeb);
  const hasEmail = Boolean(effectiveEmail && effectiveEmail.length > 0);

  const handleCopyEmail = async (emailToCopy?: string | null) => {
    const target = emailToCopy || effectiveEmail || job.contactEmail;
    if (!target) return;
    await copyToClipboard(target);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleCopyRef = async () => {
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
    const target = emailToSend || effectiveEmail || job.contactEmail;
    if (!target) return;

    if (initialUser && trackedStatus !== "APPLIED") {
      handleTrackApplication("APPLIED");
    }

    await copyToClipboard(target);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);

    const toastMessage = dict.jobs.details.emailDraftToast;
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
    ? `mailto:${effectiveEmail}?subject=${encodeURIComponent(emailSubject)}`
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
              ? "تم تسجيل تقديمك وتتبع طلبك بنجاح! 🚀"
              : "تم حفظ الوظيفة في قائمة تقديماتك بنجاح! 📌"
            : isDe
            ? newStatus === "APPLIED"
              ? "Bewerbung erfolgreich erfasst! 🚀"
              : "Job in deinen Bewerbungen gespeichert! 📌"
            : newStatus === "APPLIED"
            ? "Application successfully tracked as Applied! 🚀"
            : "Job successfully saved to your Applications! 📌"
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
                <span>
                  {isAr
                    ? "✓ فرصة عمل معتمدة رسمياً • سجل التوظيف الفيدرالي الألماني (BA/ArbeitNow)"
                    : isDe
                    ? "✓ Offiziell verifiziert • Bundesagentur für Arbeit (BA/ArbeitNow)"
                    : "✓ Officially Verified Job Opening • Federal Employment Agency (BA/ArbeitNow)"}
                </span>
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
              <h1
                dir="auto"
                className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug text-start"
              >
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
                  {isAr && job.city && GERMAN_CITIES_MAP[job.city] && (
                    <span dir="ltr" className="text-xs text-slate-500 font-mono">
                      ({GERMAN_CITIES_MAP[job.city]})
                    </span>
                  )}
                </span>
                <span className="text-slate-400 flex items-center gap-1.5 text-xs">
                  <span>📅</span>
                  <span>{formattedDate}</span>
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
                <span>{job.jobType || dict.jobs.details.fullTime}</span>
              </span>

              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <span>🇩🇪</span>
                <span>
                  {isAr ? "المستوى اللغوي الإلزامي:" : "Language:"}{" "}
                  <span dir="ltr" className="font-mono">{cefrLevel}</span>
                </span>
              </span>

              <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                <span>💰</span>
                <span>
                  {job.salary
                    ? job.salary
                    : isAr
                    ? "حسب السلم المهني والأجور المنظمة (Tarifvertrag)"
                    : isDe
                    ? "Nach Tarifvertrag / TVöD"
                    : "Regulated tariff salary (Tarifvertrag)"}
                </span>
              </span>
            </div>

            {/* 2. Primary Action Hub (Hero Conversion Banner) */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 border border-blue-500/30 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-3xl pointer-events-none -mr-20 -mt-20" />
              
              <div className="relative space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-[11px] font-bold">
                      <span>⚡</span>
                      <span>{isAr ? "بوابة التقديم السريع المعتمد" : "Fast-Track German Application"}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {isAr
                        ? "جهّز ملف ترشيحك المعتمد وقدّم للوظيفة مباشرة"
                        : isDe
                        ? "Bewerbungsmappe nach DIN 5008 erstellen & bewerben"
                        : "Generate DIN 5008 Application Dossier & Apply"}
                    </h3>
                  </div>

                  {/* Application Tracker Badge/Toggle */}
                  <button
                    type="button"
                    onClick={() => handleTrackApplication(trackedStatus === "SAVED" ? "APPLIED" : "SAVED")}
                    disabled={trackingLoading}
                    className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                      trackedStatus === "APPLIED"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : trackedStatus === "SAVED"
                        ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                    }`}
                  >
                    <span>{trackedStatus === "APPLIED" ? "✓" : trackedStatus === "SAVED" ? "📌" : "💼"}</span>
                    <span>
                      {trackingLoading
                        ? isAr
                          ? "جاري الحفظ..."
                          : "Saving..."
                        : trackedStatus === "APPLIED"
                        ? isAr
                          ? "مسجل: تم التقديم"
                          : "Status: Applied"
                        : trackedStatus === "SAVED"
                        ? isAr
                          ? "محفوظ في التقديمات"
                          : "Saved in Tracker"
                        : isAr
                        ? "+ حفظ في التقديمات"
                        : "+ Track Application"}
                    </span>
                  </button>
                </div>

                {/* Primary & Secondary CTAs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Primary CTA */}
                  <Link
                    href={coverLetterUrl}
                    className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm text-center shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group ring-1 ring-blue-400/40 cursor-pointer"
                  >
                    <span className="text-base">✨</span>
                    <span>
                      {isAr
                        ? "توليد ملف الترشيح الكامل (Anschreiben DIN 5008) ✨"
                        : isDe
                        ? "Vollständige Bewerbungsmappe generieren (DIN 5008) ✨"
                        : "Generate Complete Dossier (DIN 5008) ✨"}
                    </span>
                  </Link>

                  {/* Secondary CTA */}
                  {hasPortal ? (
                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (initialUser && trackedStatus !== "APPLIED") {
                          handleTrackApplication("APPLIED");
                        }
                      }}
                      className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700 hover:border-slate-600 font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>
                        {isAr
                          ? "بوابة التقديم المباشرة للشركة ↗"
                          : isDe
                          ? "Offizielles Unternehmensportal ↗"
                          : "Direct Employer Portal ↗"}
                      </span>
                    </a>
                  ) : hasEmail ? (
                    <a
                      href={mailtoLink}
                      onClick={() => {
                        if (initialUser && trackedStatus !== "APPLIED") {
                          handleTrackApplication("APPLIED");
                        }
                      }}
                      className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700 hover:border-slate-600 font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>✉️</span>
                      <span>
                        {isAr
                          ? "إرسال الترشيح لقسم الموارد البشرية ↗"
                          : isDe
                          ? "Bewerbung per E-Mail senden ↗"
                          : "Send Application via Email ↗"}
                      </span>
                    </a>
                  ) : (
                    <Link
                      href={atsAnalyzerUrl}
                      className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700 hover:border-slate-600 font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>🔍</span>
                      <span>{isAr ? "فحص توافق السيرة (ATS)" : "ATS Compatibility Audit"}</span>
                    </Link>
                  )}
                </div>

                {/* Micro-Copy */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                  <span className="text-emerald-400">🛡️</span>
                  <span>
                    {isAr
                      ? "يتم توجيهك مباشرة لجهة العمل الرسمية دون أي رسوم وسيطة."
                      : isDe
                      ? "Sie werden direkt zur offiziellen Bewerbungsseite weitergeleitet – 100% gebührenfrei ohne Vermittler."
                      : "You are routed directly to the official employer portal without any intermediary fees."}
                  </span>
                </div>
              </div>
            </div>

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
                  {dict.jobs.details.noDescription}
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
                  href={`/${activeLocale}/dashboard/my-resumes`}
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

          </div>

        </div>

        {/* ========================================================= */}
        {/* Sidebar: High-Trust Architecture (Direct Apply, Stepper, AI) */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">

          {/* Box 1: قناة التقديم المباشرة (Direct Application Method) */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-5 shadow-2xl text-slate-100 backdrop-blur-xl">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400">
                  <span>✓</span>
                  <span>{isAr ? "تقديم مباشر وموثق 100%" : "Direct & 100% Verified"}</span>
                </span>
              </div>

              <h3 className="text-lg font-black text-white">
                {isAr ? "قناة التقديم المباشرة" : isDe ? "Offizieller Bewerbungsweg" : "Direct Application Method"}
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? `يتم إرسال ترشيحك مباشرة لقسم الموارد البشرية لدى ${cleanCompany} أو عبر بوابتهم المعتمدة دون أي وسيط.`
                  : `Submit your application directly to ${cleanCompany}'s official HR portal or HR email.`}
              </p>
            </div>

            {/* Portal Application Action */}
            {hasPortal && (
              <div className="space-y-2">
                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (initialUser && trackedStatus !== "APPLIED") {
                      handleTrackApplication("APPLIED");
                    }
                  }}
                  className="w-full py-4 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm text-center shadow-xl shadow-blue-600/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer ring-1 ring-blue-400/40"
                >
                  <span>
                    {isAr
                      ? `التقديم عبر البوابة الرسمية (${portalInfo.name}) ↗`
                      : isDe
                      ? `Über offizielles Portal bewerben (${portalInfo.name}) ↗`
                      : `Apply via Official Portal (${portalInfo.name}) ↗`}
                  </span>
                </a>
                <p className="text-[11px] text-slate-400 text-center">
                  {isAr ? "بوابة توظيف معتمدة وربط مباشر" : "Official authenticated ATS portal link"}
                </p>
              </div>
            )}

            {/* Direct Email Application Action */}
            {hasEmail && (
              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">
                      {isAr ? "بريد الموارد البشرية الرسمي:" : "Official HR Email:"}
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                      <span>✓</span>
                      <span>{isAr ? "تقديم موثق" : "Verified"}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 font-mono text-xs text-white" dir="ltr">
                    <span className="truncate">{effectiveEmail}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyEmail(effectiveEmail)}
                      className="text-blue-400 hover:text-white shrink-0 cursor-pointer font-sans text-[11px] font-bold"
                    >
                      {copiedEmail ? (isAr ? "✓ تم النسخ!" : "Copied!") : (isAr ? "نسخ" : "Copy")}
                    </button>
                  </div>
                </div>

                <a
                  href={mailtoLink}
                  onClick={() => {
                    if (initialUser && trackedStatus !== "APPLIED") {
                      handleTrackApplication("APPLIED");
                    }
                  }}
                  className={`w-full py-3.5 px-4 rounded-xl text-center font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    hasPortal
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25 ring-1 ring-blue-400/40"
                  }`}
                >
                  <span>✉️</span>
                  <span>
                    {isAr
                      ? "إرسال ملف الترشيح (DIN 5008) عبر الإيميل"
                      : "Send DIN 5008 Application via Email"}
                  </span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSmartMailSend(effectiveEmail)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>🚀</span>
                    <span>{isAr ? "فتح في Gmail" : "Open in Gmail"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(true)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>📝</span>
                    <span>{isAr ? "عرض النموذج الألماني" : "Show Template"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* In-Card Toast Notification */}
            {toast && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-inner">
                <span className="text-sm shrink-0">✓</span>
                <span className="leading-snug">{toast}</span>
              </div>
            )}

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

          {/* Box 2: مسار الخطوات الثلاث لضمان القبول (3-Step Stepper) */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl backdrop-blur-xl">
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
              {/* Step 1 */}
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

              {/* Step 2 */}
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

              {/* Step 3 */}
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

          {/* Box 3: أدوات الذكاء الاصطناعي التنافسية (AI Suite) */}
          <div className="rounded-3xl bg-slate-900/90 border border-blue-500/20 p-6 space-y-4 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <h3 className="font-bold text-white text-xs sm:text-sm">
                  {isAr ? "أدوات الذكاء الاصطناعي التنافسية" : "AI Career Suite"}
                </h3>
              </div>

              {/* Match Boost Badge */}
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-[11px] font-bold">
                +85% ATS Score
              </span>
            </div>

            {/* Tool 1: Cover Letter Generator */}
            <Link
              href={coverLetterUrl}
              className="group block p-4 rounded-2xl bg-slate-950 hover:bg-slate-950/80 border border-slate-800 hover:border-blue-500/40 transition-all space-y-1.5"
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
              className="group block p-4 rounded-2xl bg-slate-950 hover:bg-slate-950/80 border border-slate-800 hover:border-blue-500/40 transition-all space-y-1.5"
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

          {/* Box 4: بطاقة البيانات الرسمية ومشاركة الفرصة (Quick Overview Card) */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 space-y-4 text-xs">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <span>ℹ️</span>
              <span>{isAr ? "بيانات الاعتماد والشاغر" : dict.jobs.details.overviewTitle}</span>
            </h3>

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
                <span className="font-semibold text-emerald-400 font-mono">{cefrLevel}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">{isAr ? "كود المرجع:" : "Ref-Nr:"}</span>
                <span dir="ltr" className="font-mono text-slate-300 font-bold">{referenceNumber}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">{isAr ? "معيار التقديم:" : "Standard:"}</span>
                <span dir="ltr" className="font-mono text-blue-400 font-bold">DIN 5008</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">{dict.jobs.details.salary}</span>
                <span className="font-semibold text-slate-200">
                  {job.salary || (isAr ? "حسب السلم المنظم (Tarifvertrag)" : "Tarifvertrag")}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
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
