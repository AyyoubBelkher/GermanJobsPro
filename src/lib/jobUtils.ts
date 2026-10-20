/**
 * Core Job utilities and data interfaces.
 * 
 * IMPORTANT: This module MUST remain environment-agnostic (pure TypeScript/JS).
 * Do NOT add "use client", React hooks, or browser-only APIs here so it can be
 * safely imported in both React Server Components (RSC) and Client Components.
 */

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
  expiresAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  isVerified?: boolean;
}

export const GENERIC_HR_PREFIXES = [
  "jobs@",
  "hr@",
  "karriere@",
  "info@",
  "contact@",
  "recruiting@",
  "bewerbung@",
  "personal@",
  "careers@",
  "bewerbungen@",
  "kontakt@",
];

/**
 * Splits a bilingual job title (Arabic + German/English in parentheses)
 * so that the Arabic title and Latin subtitle can be rendered with independent text directions,
 * preventing bidirectional parenthesis flipping (e.g. "(m/w/d)" jumping or breaking).
 */
export function splitBilingualTitle(rawTitle?: string | null): {
  primaryTitle: string;
  latinSubtitle: string | null;
} {
  if (!rawTitle || typeof rawTitle !== "string") {
    return { primaryTitle: "", latinSubtitle: null };
  }
  const trimmed = rawTitle.trim();
  if (!trimmed) {
    return { primaryTitle: "", latinSubtitle: null };
  }

  // If no Arabic characters exist, it's already purely Latin/German/English
  const hasArabic = /[\u0600-\u06FF]/.test(trimmed);
  if (!hasArabic) {
    return { primaryTitle: trimmed, latinSubtitle: null };
  }

  // Scan top-level parenthesized blocks
  const blocks: Array<{ start: number; end: number; content: string; isLatin: boolean }> = [];
  let depth = 0;
  let startIdx = -1;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === "(") {
      if (depth === 0) startIdx = i;
      depth++;
    } else if (ch === ")") {
      if (depth > 0) {
        depth--;
        if (depth === 0) {
          const content = trimmed.slice(startIdx + 1, i).trim();
          const latinCount = (content.match(/[a-zA-Z]/g) || []).length;
          const arabicCount = (content.match(/[\u0600-\u06FF]/g) || []).length;
          const isGenderPill = /^(m\/w\/d|w\/m\/d|f\/m\/d|all genders|gn)$/i.test(content);
          const isLatin = (latinCount >= 2 && latinCount > arabicCount) || isGenderPill;
          blocks.push({
            start: startIdx,
            end: i + 1,
            content,
            isLatin,
          });
        }
      }
    }
  }

  const latinBlocks = blocks.filter((b) => b.isLatin);
  if (latinBlocks.length === 0) {
    return { primaryTitle: trimmed, latinSubtitle: null };
  }

  const firstBlock = latinBlocks[0];
  const lastBlock = latinBlocks[latinBlocks.length - 1];
  const between = trimmed.slice(firstBlock.end, lastBlock.start).trim();

  let mergedSubtitle = "";
  let startCut = firstBlock.start;
  let endCut = lastBlock.end;

  if (latinBlocks.length > 1 && (!between || /^[/\-,\s]+$/.test(between))) {
    mergedSubtitle = latinBlocks
      .map((b) => {
        return /^(m\/w\/d|w\/m\/d|f\/m\/d|all genders|gn)$/i.test(b.content)
          ? `(${b.content})`
          : b.content;
      })
      .join(" ");
  } else {
    const mainBlock = latinBlocks.reduce((prev, curr) =>
      (curr.content.match(/[a-zA-Z]/g) || []).length >
      (prev.content.match(/[a-zA-Z]/g) || []).length
        ? curr
        : prev
    );
    const mainIdx = blocks.indexOf(mainBlock);
    if (mainIdx !== -1 && mainIdx + 1 < blocks.length && blocks[mainIdx + 1].isLatin) {
      const nextB = blocks[mainIdx + 1];
      const gap = trimmed.slice(mainBlock.end, nextB.start).trim();
      if (!gap) {
        startCut = mainBlock.start;
        endCut = nextB.end;
        mergedSubtitle = `${mainBlock.content} (${nextB.content})`;
      } else {
        startCut = mainBlock.start;
        endCut = mainBlock.end;
        mergedSubtitle = mainBlock.content;
      }
    } else {
      startCut = mainBlock.start;
      endCut = mainBlock.end;
      mergedSubtitle = mainBlock.content;
    }
  }

  const before = trimmed.slice(0, startCut).trim();
  const after = trimmed.slice(endCut).trim();
  const primaryTitle = [before, after]
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[:\-\s،,]+|[:\-\s،,]+$/g, "")
    .trim();

  if (!primaryTitle) {
    return { primaryTitle: mergedSubtitle, latinSubtitle: null };
  }

  return { primaryTitle, latinSubtitle: mergedSubtitle };
}

// Extracts Latin/German title inside parentheses e.g. "مدير تسويق (Marketing Manager)" -> "Marketing Manager"
export const extractGermanTitle = (rawTitle?: string | null): string => {
  if (!rawTitle || typeof rawTitle !== "string") return "Stelle in Deutschland";
  try {
    const match = rawTitle.match(/\(([A-Za-z0-9\s/&+\-_.,]+)\)/);
    if (match && match[1]?.trim()) {
      return match[1].trim();
    }
    const latinOnly = rawTitle.replace(/[\u0600-\u06FF:،–—]/g, "").trim();
    return latinOnly.length > 2 ? latinOnly : rawTitle;
  } catch {
    return rawTitle || "Stelle in Deutschland";
  }
};

export const GERMAN_CITIES_MAP: Record<string, string> = {
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

export const extractGermanCity = (rawCity?: string | null): string => {
  if (!rawCity || typeof rawCity !== "string") return "Deutschland";
  try {
    const trimmed = rawCity.trim();
    if (!trimmed) return "Deutschland";
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
  } catch {
    return "Deutschland";
  }
};

// Generates an official German job reference ID (Ref-Nr: DE-2026-XXXX)
export function extractReferenceNumber(job?: Partial<JobDetailData> | null): string {
  if (!job) return "DE-2026-8421";
  try {
    if (job.applyUrl && typeof job.applyUrl === "string") {
      const urlMatch = job.applyUrl.match(/-(\d{5,8})(?:[/?#]|$)/);
      if (urlMatch && urlMatch[1]) {
        return `DE-2026-${urlMatch[1]}`;
      }
    }
    const idStr = typeof job.id === "string" ? job.id : "";
    const cleanId = idStr.replace(/[^a-zA-Z0-9]/g, "").slice(-5).toUpperCase();
    return `DE-2026-${cleanId || "8421"}`;
  } catch {
    return "DE-2026-8421";
  }
}

// Extracts or normalizes the CEFR language requirement (e.g. B2, C1, B1/B2)
export function extractCefrLevel(languageReq?: string | null, requirements?: string | null): string {
  try {
    if (languageReq && typeof languageReq === "string" && languageReq.trim()) {
      const match = languageReq.match(/\b([ABC][12](?:\s*[\/\-]\s*[ABC][12])?)\b/i);
      if (match) return match[1].toUpperCase();
      return languageReq.trim();
    }
    if (requirements && typeof requirements === "string") {
      const match = requirements.match(/\b([ABC][12](?:\s*[\/\-]\s*[ABC][12])?)\b/i);
      if (match) return match[1].toUpperCase();
    }
    return "B1/B2";
  } catch {
    return "B1/B2";
  }
}

// Detects the ATS or portal service name
export function detectPortalInfo(applyUrl?: string | null): { name: string; isAgentur: boolean; isArbeitNow: boolean } {
  const fallback = { name: "بوابة التوظيف المباشرة للشركة", isAgentur: false, isArbeitNow: false };
  if (!applyUrl || typeof applyUrl !== "string") return fallback;
  try {
    const lower = applyUrl.toLowerCase();
    if (lower.includes("arbeitsagentur.de")) {
      return { name: "Bundesagentur für Arbeit (BA)", isAgentur: true, isArbeitNow: false };
    }
    if (lower.includes("arbeitnow.com")) {
      return { name: "ArbeitNow Partnernetzwerk", isAgentur: false, isArbeitNow: true };
    }
    if (lower.includes("personio")) {
      return { name: "Personio Recruiting Portal", isAgentur: false, isArbeitNow: false };
    }
    if (lower.includes("workday") || lower.includes("myworkday")) {
      return { name: "Workday ATS", isAgentur: false, isArbeitNow: false };
    }
    if (lower.includes("softgarden")) {
      return { name: "Softgarden e-Recruiting", isAgentur: false, isArbeitNow: false };
    }
    if (lower.includes("greenhouse")) {
      return { name: "Greenhouse Portal", isAgentur: false, isArbeitNow: false };
    }
    if (lower.includes("lever.co")) {
      return { name: "Lever Portal", isAgentur: false, isArbeitNow: false };
    }
    if (lower.includes("recruitee")) {
      return { name: "Recruitee Portal", isAgentur: false, isArbeitNow: false };
    }
    if (lower.includes("join.com")) {
      return { name: "JOIN Portal", isAgentur: false, isArbeitNow: false };
    }
    if (lower.includes("smartrecruiters")) {
      return { name: "SmartRecruiters Portal", isAgentur: false, isArbeitNow: false };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Known placeholder / fake email domains and prefixes from scrapers or dummy templates.
 */
export const FAKE_EMAIL_DOMAINS = new Set([
  "company.com",
  "company.de",
  "example.com",
  "example.de",
  "example.org",
  "domain.com",
  "domain.de",
  "placeholder.com",
  "test.com",
  "test.de",
  "email.com",
  "sample.com",
  "yoursite.com",
  "arbeitnow.com",
  "arbeitsagentur.de",
]);

export const FAKE_EMAIL_EXACT = new Set([
  "hr@company.com",
  "hr@company.de",
  "jobs@company.com",
  "jobs@company.de",
  "karriere@company.de",
  "karriere@company.com",
  "info@company.com",
  "info@company.de",
  "info@example.com",
  "contact@company.com",
  "contact@company.de",
  "user@domain.com",
  "test@test.de",
  "email@example.com",
  "noreply@arbeitnow.com",
  "no-reply@arbeitnow.com",
]);

/**
 * Validates whether an email string is a legitimate, non-placeholder HR email.
 */
export function isValidHrEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  try {
    const clean = email.trim().toLowerCase().replace(/^mailto:/i, "").trim();
    if (!clean) return false;

    // Basic RFC 5322 regex validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(clean)) return false;

    if (FAKE_EMAIL_EXACT.has(clean)) return false;

    const parts = clean.split("@");
    if (parts.length !== 2) return false;
    const domain = parts[1];
    if (!domain || FAKE_EMAIL_DOMAINS.has(domain)) return false;

    // Filter out image extensions or syntax accidents (e.g. user@domain.png)
    if (/\.(png|jpg|jpeg|gif|svg|webp|pdf)$/i.test(clean)) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts a robust, verified HR email from contactEmail, applyUrl (mailto:), or description/requirements.
 * 
 * Strict Zero-Fabrication Rule:
 * - If applyUrl starts with "http" (e.g. ArbeitNow, Arbeitsagentur, or external ATS portal)
 *   AND contactEmail is NOT literally present inside descriptionRaw or requirements,
 *   generic prefixes (jobs@, hr@, karriere@, info@, contact@, recruiting@, bewerbung@, personal@, careers@)
 *   are treated as unverified/guessed and REJECTED (returns null).
 * - contactEmail is ONLY trusted if an explicit @ email address literally appears in original raw job description,
 *   requirements, or applyUrl (mailto:).
 */
export function extractCleanHrEmail(job?: {
  contactEmail?: string | null;
  applyUrl?: string | null;
  descriptionRaw?: string | null;
  requirements?: string | null;
} | null): string | null {
  if (!job) return null;
  try {
    const rawApplyUrl = typeof job.applyUrl === "string" ? job.applyUrl.trim() : "";
    const isApplyMailto = rawApplyUrl.toLowerCase().startsWith("mailto:");
    const isApplyHttp =
      rawApplyUrl.toLowerCase().startsWith("http://") ||
      rawApplyUrl.toLowerCase().startsWith("https://");

    const desc = typeof job.descriptionRaw === "string" ? job.descriptionRaw : "";
    const reqs = typeof job.requirements === "string" ? job.requirements : "";
    const textToScan = `${desc} ${reqs}`.trim();
    const combinedLower = textToScan.toLowerCase();

    // 1. Check applyUrl for mailto:
    if (isApplyMailto) {
      const rawMailto = rawApplyUrl.replace(/^mailto:/i, "").split("?")[0]?.trim();
      if (isValidHrEmail(rawMailto)) {
        return rawMailto.toLowerCase();
      }
    }

    // 2. Check contactEmail if provided
    if (job.contactEmail && isValidHrEmail(job.contactEmail)) {
      const emailCandidate = job.contactEmail.trim().toLowerCase();
      const hasGenericPrefix = GENERIC_HR_PREFIXES.some((prefix) => emailCandidate.startsWith(prefix));

      if (isApplyHttp) {
        // If applying via external HTTP portal:
        // Must literally appear in job descriptionRaw or requirements!
        if (combinedLower.includes(emailCandidate)) {
          return emailCandidate;
        }
        // Generic prefixes not found in text are 100% guessed/fabricated -> discard
        if (hasGenericPrefix) {
          // Fall through to text scanning
        } else {
          // Even non-generic emails are unverified if not in the source text
          // Fall through to text scanning
        }
      } else {
        return emailCandidate;
      }
    }

    // 3. Scan descriptionRaw and requirements for verified HR email
    if (textToScan) {
      const emailMatches = textToScan.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (emailMatches && emailMatches.length > 0) {
        // Prioritize HR/application-specific mailboxes
        for (const candidate of emailMatches) {
          if (isValidHrEmail(candidate)) {
            const lower = candidate.toLowerCase();
            if (/bewerbung|karriere|jobs|recruiting|personal|hr|kontakt|contact|careers/i.test(lower)) {
              return lower;
            }
          }
        }
        // Otherwise, take the first valid non-fake email
        for (const candidate of emailMatches) {
          if (isValidHrEmail(candidate)) {
            return candidate.toLowerCase();
          }
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Returns Anerkennung (diploma equivalence) guidance based on role category
export function getAnerkennungDetails(category?: string | null, isAr = false, isDe = false) {
  try {
    const cat = typeof category === "string" ? category.toLowerCase() : "";
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
  } catch {
    return {
      type: "academic",
      badge: isAr ? "معايير سوق العمل الألماني" : "German Labor Standard",
      title: isAr ? "المعادلة المهنية والأكاديمية" : "Professional Equivalence",
      desc: isAr ? "تخضع المؤهلات للتقييم بحسب معايير الجهات الألمانية المختصة." : "Qualifications assessed per German guidelines.",
      statusText: isAr ? "مؤهل مهني أو جامعي معتمد" : "Recognized Qualification",
    };
  }
}
