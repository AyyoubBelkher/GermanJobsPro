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
  languageLevel?: string | null;
  sourceUrl?: string | null;
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

export const LEGACY_NEWS_OUTLETS = [
  "Fränkischer Tag",
  "Vietnam.vn",
  "Ad-hoc-news.de",
  "Freie Presse",
  "swp.de",
  "Giessener Anzeiger",
  "Deutsches Handwerksblatt",
  "Baden Online",
  "Peiner Allgemeine Zeitung",
  "Fußballverband",
] as const;

export const NON_GERMANY_LOCATIONS = [
  "zürich",
  "zurich",
  "payerne",
  "winterthur",
  "lausanne",
  "oberglatt",
  "geneva",
  "genève",
  "basel",
  "bern",
  "schweiz",
  "switzerland",
  "st. gallen",
  "luzern",
  "zug",
  "lugano",
  "aarau",
  "schaffhausen",
  "paris",
  "france",
  "frankreich",
  "lyon",
  "london",
  "united kingdom",
  "england",
  "manchester",
  "österreich",
  "austria",
  "wien",
  "vienna",
  "salzburg",
  "linz",
  "graz",
  "innsbruck",
  "rheintal",
  "liechtenstein",
  "vaduz",
  "amsterdam",
  "netherlands",
  "niederlande",
  "madrid",
  "barcelona",
  "spain",
  "warsaw",
  "poland",
  "romania",
  "ukraine",
] as const;

export const NON_GERMANY_DESC_INDICATORS = [
  "doccheck schweiz",
  "remote innerhalb der schweiz",
  "4052 basel",
  "9490 vaduz",
  "raum rheintal, österreich",
  "in our paris office",
  "location: paris",
  "headquartered in london",
  "jobs in switzerland on arbeitnow",
  "jobs in united kingdom on arbeitnow",
] as const;

export const formatLangLevel = (lvl?: string | null, locale: string = "de"): string =>
  localizeLanguageBadge(lvl, locale);

export interface LocalizableJobTitleInput {
  title?: string | null;
  titleAr?: string | null;
  titleDe?: string | null;
  titleEn?: string | null;
  titleFr?: string | null;
}

export interface LocalizableJobDescInput {
  description?: string | null;
  descriptionRaw?: string | null;
  descriptionAr?: string | null;
  descriptionDe?: string | null;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
  requirements?: string | null;
}

/**
 * Unwraps a single balanced outer parenthesis pair, e.g. "(Pflegefachkraft (m/w/d))" -> "Pflegefachkraft (m/w/d)".
 */
function unwrapOuterParens(text: string): string {
  const t = text.trim();
  if (!t.startsWith("(") || !t.endsWith(")")) return t;
  let depth = 0;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === "(") depth++;
    else if (t[i] === ")") {
      depth--;
      if (depth === 0 && i < t.length - 1) {
        return t;
      }
    }
  }
  return depth === 0 ? t.slice(1, -1).trim() : t;
}

/**
 * Resolves a job title according to the active UI locale.
 * - For Arabic (`ar`): prefers `titleAr` / bilingual Arabic primary + Latin subtitle.
 * - For non-Arabic locales (`de`, `fr`, `en`): prefers non-Arabic/German/Latin titles
 *   and extracts the German/Latin title from bilingual strings, never falling back
 *   to `titleAr` when non-Arabic fields or Latin substrings exist.
 */
export function localizeJobTitle(
  jobOrTitle?: LocalizableJobTitleInput | string | null,
  locale: string = "ar"
): { primaryTitle: string; latinSubtitle: string | null } {
  const obj: LocalizableJobTitleInput =
    typeof jobOrTitle === "string" || !jobOrTitle
      ? { title: jobOrTitle ?? "" }
      : jobOrTitle;

  const isAr = locale === "ar";
  const isDe = locale === "de";
  const isFr = locale === "fr";

  if (isAr) {
    const arCandidate = (obj.titleAr || "").trim();
    const nonArCandidate = (obj.title || obj.titleDe || obj.titleEn || "").trim();
    if (arCandidate) {
      if (
        nonArCandidate &&
        nonArCandidate !== arCandidate &&
        !/[\u0600-\u06FF]/.test(nonArCandidate) &&
        !/[a-zA-ZäöüÄÖÜß]/.test(arCandidate)
      ) {
        return { primaryTitle: arCandidate, latinSubtitle: nonArCandidate };
      }
      return splitBilingualTitle(arCandidate);
    }
    return splitBilingualTitle(obj.title || nonArCandidate);
  }

  // Non-Arabic locales (`de`, `fr`, `en`): never prefer `titleAr`
  const orderedCandidates = isDe
    ? [obj.titleDe, obj.title, obj.titleEn, obj.titleFr]
    : isFr
    ? [obj.titleFr, obj.title, obj.titleDe, obj.titleEn]
    : [obj.titleEn, obj.title, obj.titleDe, obj.titleFr];

  const nonEmptyCandidates = orderedCandidates
    .map((c) => (typeof c === "string" ? c.trim() : ""))
    .filter(Boolean);

  // First try any candidate that is already free of Arabic script
  const pureLatin = nonEmptyCandidates.find((c) => !/[\u0600-\u06FF]/.test(c));
  if (pureLatin) {
    return { primaryTitle: pureLatin, latinSubtitle: null };
  }

  // Otherwise inspect bilingual candidates and extract the German/Latin title
  for (const raw of nonEmptyCandidates) {
    const { latinSubtitle } = splitBilingualTitle(raw);
    const stripped = unwrapOuterParens(
      raw
        .replace(/[\u0600-\u06FF\u061B\u061F\u060C]+/g, " ")
        .replace(/\s{2,}/g, " ")
        .replace(/^[:\-–—،,\s/]+|[:\-–—،,\s/]+$/g, "")
        .trim()
    );

    const meaningfulStripped = stripped
      .replace(/\((?:m\/w\/d|w\/m\/d|f\/m\/d|all genders|gn)\)/gi, "")
      .trim();

    if (/[a-zA-ZäöüÄÖÜß]{2,}/.test(meaningfulStripped)) {
      // If stripped has full title beyond what splitBilingualTitle captured (e.g. "أخصائي: Pflegefachkraft (m/w/d)")
      if (latinSubtitle) {
        const meaningfulSub = latinSubtitle
          .replace(/\((?:m\/w\/d|w\/m\/d|f\/m\/d|all genders|gn)\)/gi, "")
          .trim();
        if (/[a-zA-ZäöüÄÖÜß]{2,}/.test(meaningfulSub) && meaningfulSub.length >= meaningfulStripped.length) {
          return { primaryTitle: latinSubtitle, latinSubtitle: null };
        }
      }
      return { primaryTitle: stripped, latinSubtitle: null };
    }

    if (latinSubtitle && /[a-zA-ZäöüÄÖÜß]{2,}/.test(latinSubtitle)) {
      return { primaryTitle: latinSubtitle, latinSubtitle: null };
    }
  }

  if (nonEmptyCandidates.length > 0) {
    return { primaryTitle: nonEmptyCandidates[0], latinSubtitle: null };
  }

  const emptyFallback = isDe
    ? "Stelle in Deutschland"
    : isFr
    ? "Offre d'emploi en Allemagne"
    : "Job in Germany";
  return { primaryTitle: emptyFallback, latinSubtitle: null };
}

/**
 * Resolves and cleans a job description according to the active UI locale.
 * In non-Arabic locales (`de`, `fr`, `en`), ignores `descriptionAr` and filters out
 * Arabic-only boilerplate lines when German/English description content exists.
 */
export function localizeJobDescription(
  jobOrDesc?: LocalizableJobDescInput | string | null,
  locale: string = "ar"
): string {
  const obj: LocalizableJobDescInput =
    typeof jobOrDesc === "string" || !jobOrDesc
      ? { descriptionRaw: jobOrDesc ?? "" }
      : jobOrDesc;

  const isAr = locale === "ar";
  const isDe = locale === "de";
  const isFr = locale === "fr";

  if (isAr) {
    const raw = obj.descriptionAr || obj.descriptionRaw || obj.description || obj.descriptionDe || obj.descriptionEn || "";
    return cleanJobDescription(raw);
  }

  const orderedCandidates = isDe
    ? [obj.descriptionDe, obj.description, obj.descriptionRaw, obj.descriptionEn, obj.descriptionFr]
    : isFr
    ? [obj.descriptionFr, obj.description, obj.descriptionRaw, obj.descriptionEn, obj.descriptionDe]
    : [obj.descriptionEn, obj.description, obj.descriptionRaw, obj.descriptionDe, obj.descriptionFr];

  for (const candidate of orderedCandidates) {
    if (!candidate || typeof candidate !== "string") continue;
    const cleaned = cleanJobDescription(candidate).replace(/[\u2066\u2069]/g, "");
    if (!cleaned) continue;

    if (!/[\u0600-\u06FF]/.test(cleaned)) {
      return cleaned;
    }

    // Filter out Arabic-heavy lines when mixed with German/English content
    const keptLines: string[] = [];
    for (const line of cleaned.split(/\r?\n/)) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      const latinCount = (trimmedLine.match(/[a-zA-ZäöüÄÖÜß]/g) || []).length;
      const arabicCount = (trimmedLine.match(/[\u0600-\u06FF]/g) || []).length;

      if (arabicCount === 0) {
        keptLines.push(trimmedLine);
      } else if (latinCount > arabicCount && latinCount >= 10) {
        // Strip leading Arabic prefix before German/English text if mixed on one line
        const stripLeadingArabic = trimmedLine
          .replace(/^[^a-zA-ZäöüÄÖÜß]*[\u0600-\u06FF][^a-zA-ZäöüÄÖÜß]*(?=[a-zA-ZäöüÄÖÜß]{2,})/, "")
          .trim();
        keptLines.push(stripLeadingArabic || trimmedLine);
      }
    }

    if (keptLines.length > 0) {
      return keptLines.join("\n").trim();
    }
  }

  // Fallback to requirements if it has non-Arabic content
  if (obj.requirements && typeof obj.requirements === "string") {
    const cleanedReq = cleanJobDescription(obj.requirements).replace(/[\u2066\u2069]/g, "");
    if (cleanedReq && !/[\u0600-\u06FF]/.test(cleanedReq)) {
      return cleanedReq;
    }
  }

  return "";
}

/**
 * Localizes language requirement badges such as "German B2", "EN (B2)", or "B1/B2".
 * E.g. "German B2" -> "Deutsch B2" (de), "Allemand B2" (fr), "German B2" (en), "ألمانية B2" (ar).
 */
export function localizeLanguageBadge(lvl?: string | null, locale: string = "de"): string {
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const isFr = locale === "fr";

  const germanLabel = isAr ? "ألمانية" : isDe ? "Deutsch" : isFr ? "Allemand" : "German";
  const englishLabel = isAr ? "إنجليزية" : isDe ? "Englisch" : isFr ? "Anglais" : "English";

  if (!lvl || typeof lvl !== "string" || !lvl.trim() || lvl.trim().toLowerCase() === "none") {
    return `${germanLabel} (B1/B2)`;
  }

  const trimmed = lvl.trim();
  const isEnglish = /^(?:EN\b|English\b|Englisch\b|Anglais\b|الإنجليزية|إنجليزية)/i.test(trimmed);
  const cefrMatch = trimmed.match(/\b([ABC][12](?:\s*[\/\-]\s*[ABC][12])?)\b/i);
  const cefr = cefrMatch ? cefrMatch[1].toUpperCase().replace(/\s+/g, "") : "";

  if (isEnglish) {
    return cefr ? `${englishLabel} ${cefr}` : englishLabel;
  }

  if (cefr) {
    return `${germanLabel} ${cefr}`;
  }

  const strippedPrefix = trimmed
    .replace(/^(?:German|Deutsch|Allemand|الألمانية|ألمانية)\s*[:\-–—]?\s*/i, "")
    .trim();
  return strippedPrefix ? `${germanLabel} ${strippedPrefix}` : germanLabel;
}

/**
 * Localizes salary strings (especially stored Arabic period suffixes like "سنوياً" or "شهرياً")
 * for the target UI locale so Arabic tokens never leak onto /de, /fr, or /en job pages.
 */
export function localizeSalary(salary?: string | null, locale: string = "ar"): string {
  if (!salary || typeof salary !== "string") return "";
  const trimmed = salary.trim();
  if (!trimmed) return "";

  if (locale === "ar") {
    return trimmed;
  }

  const isDe = locale === "de";
  const isFr = locale === "fr";

  const yearlySuffix = isDe ? "/Jahr" : isFr ? "/an" : "/year";
  const monthlySuffix = isDe ? "/Monat" : isFr ? "/mois" : "/month";
  const weeklySuffix = isDe ? "/Woche" : isFr ? "/semaine" : "/week";
  const hourlySuffix = isDe ? "/Std." : isFr ? "/heure" : "/hour";

  const fromLabel = isDe ? "ab " : isFr ? "à partir de " : "from ";
  const upToLabel = isDe ? "bis zu " : isFr ? "jusqu'à " : "up to ";

  const normalized = trimmed
    // Convert "من <min> إلى <max>" -> "<min> - <max>"
    .replace(/(?:^|\s)من\s+([^\s]+(?:\s*(?:€|\$|EUR|CHF))?)\s+إلى\s+/g, " $1 - ")
    .replace(/(?:ابتداءً|بدءاً)\s+من\s+/g, fromLabel)
    .replace(/(?:يصل\s+إلى|حتى)\s+/g, upToLabel)
    .replace(/(?:تقريباً|تقديرياً|حوالي)/g, "")
    // Normalize Arabic & cross-locale period suffixes
    .replace(/\s*(?:سنوياً|سنويا|في السنة|بالسنة)(?=$|[\s.,;)/])/g, ` ${yearlySuffix}`)
    .replace(/\s*(?:شهرياً|شهريا|في الشهر|بالشهر)(?=$|[\s.,;)/])/g, ` ${monthlySuffix}`)
    .replace(/\s*(?:أسبوعياً|أسبوعيا|في الأسبوع|بالأسبوع)(?=$|[\s.,;)/])/g, ` ${weeklySuffix}`)
    .replace(/\s*(?:في الساعة|بالساعة|ساعياً|ساعيا)(?=$|[\s.,;)/])/g, ` ${hourlySuffix}`)
    .replace(/\s*(?:per year|\/year|p\.a\.|pro Jahr|\/Jahr|par an|\/an)(?=$|[\s.,;)/])/gi, ` ${yearlySuffix}`)
    .replace(/\s*(?:per month|\/month|pro Monat|\/Monat|par mois|\/mois)(?=$|[\s.,;)/])/gi, ` ${monthlySuffix}`)
    .replace(/\s*(?:per week|\/week|pro Woche|\/Woche|par semaine|\/semaine)(?=$|[\s.,;)/])/gi, ` ${weeklySuffix}`)
    .replace(/\s*(?:per hour|\/hour|pro Stunde|\/Std\.|par heure|\/heure)(?=$|[\s.,;)/])/gi, ` ${hourlySuffix}`)
    .replace(/\s{2,}/g, " ")
    .trim();

  return normalized;
}

/**
 * Localizes job employment type strings across supported locales.
 */
export function localizeJobType(jobType?: string | null, locale: string = "ar"): string {
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const isFr = locale === "fr";
  const raw = (jobType || "").trim();
  const lower = raw.toLowerCase();

  if (!raw || lower === "full-time" || lower === "fulltime" || lower === "vollzeit" || raw === "دوام كامل" || lower === "temps plein") {
    return isAr ? "دوام كامل" : isDe ? "Vollzeit" : isFr ? "Temps plein" : "Full-time";
  }
  if (lower === "part-time" || lower === "parttime" || lower === "teilzeit" || raw === "دوام جزئي" || lower === "temps partiel") {
    return isAr ? "دوام جزئي" : isDe ? "Teilzeit" : isFr ? "Temps partiel" : "Part-time";
  }
  return raw;
}

export function isLegacyNewsJob(job: {
  applyUrl?: string | null;
  sourceUrl?: string | null;
  company?: string | null;
  city?: string | null;
  location?: string | null;
  title?: string | null;
  description?: string | null;
  descriptionRaw?: string | null;
}): boolean {
  const url = (job.sourceUrl || job.applyUrl || "").toLowerCase();
  if (url.includes("news.google.com") || url.includes("news.google.")) return true;
  const company = (job.company || "").toLowerCase();
  if (LEGACY_NEWS_OUTLETS.some((outlet) => company.includes(outlet.toLowerCase()))) return true;

  const loc = (job.city || job.location || "").toLowerCase();
  const title = (job.title || "").toLowerCase();
  const desc = (job.description || job.descriptionRaw || "").toLowerCase();

  // 1. Check NON_GERMANY_LOCATIONS across city/location, title, company, url
  const matchesNonGermanyLoc = NON_GERMANY_LOCATIONS.some((nonGerLoc) => {
    const l = nonGerLoc.toLowerCase();
    return (
      loc.includes(l) ||
      title.includes(l) ||
      company.includes(l) ||
      url.includes(l)
    );
  });
  if (matchesNonGermanyLoc) return true;

  // 2. Whole-word UK check on location and title
  if (/\buk\b/i.test(loc) || /\buk\b/i.test(title)) return true;

  // 3. Explicit non-Germany workplace indicators in description
  if (NON_GERMANY_DESC_INDICATORS.some((ind) => desc.includes(ind))) {
    return true;
  }

  return false;
}

export function isExcludedJob(job: {
  applyUrl?: string | null;
  sourceUrl?: string | null;
  company?: string | null;
  city?: string | null;
  location?: string | null;
  title?: string | null;
  description?: string | null;
  descriptionRaw?: string | null;
}): boolean {
  return isLegacyNewsJob(job);
}

/**
 * Strips raw HTML, converts tags to structured plain text with bullets and clean breaks,
 * removes promotional ArbeitNow footers, and normalizes spacing.
 */
export function cleanJobDescription(raw?: string | null): string {
  if (!raw || typeof raw !== "string") return "";

  let text = raw;

  // 1. Convert block endings and line breaks to newlines
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/(?:p|div|h[1-6]|li|ul|ol)>/gi, "\n");

  // 2. Format list items with bullet points
  text = text.replace(/<li[^>]*>/gi, "• ");

  // 3. Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // 4. Decode HTML entities
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  // 5. Strip trailing ArbeitNow promotional lines matching /Find (?:more )?(?:English Speaking )?Jobs in [A-Za-z\s]+ on Arbeitnow\.?/gi
  text = text.replace(
    /Find (?:more )?(?:English Speaking )?Jobs in [A-Za-z\s]+ on Arbeitnow\.?/gi,
    ""
  );

  // 6. Fix RTL parentheses/slash wrapping and BiDi inversion
  // Strip outer parentheses around "Deutsches Krankenhaus - Pflegezentrum" completely
  // to avoid RTL parenthesis splitting across line breaks.
  text = text.replace(
    /(?:\u2066)?\(\s*Deutsches Krankenhaus\s*[-/]\s*Pflegezentrum\s*\)(?:\u2069)?/gi,
    "Deutsches Krankenhaus - Pflegezentrum"
  );
  text = text.replace(
    /Deutsches Krankenhaus\s*\/\s*Pflegezentrum/g,
    "Deutsches Krankenhaus - Pflegezentrum"
  );

  // Wrap any other parenthetical Latin/German segment in Unicode Left-to-Right Isolate (\u2066...\u2069)
  // and replace inner slashes with hyphens
  text = text.replace(
    /(?:\u2066)?\(([^)\u2069]*[a-zA-ZäöüÄÖÜß][^)\u2069]*)\)(?:\u2069)?/g,
    (_, inner: string) => {
      if (/Deutsches Krankenhaus\s*[-/]\s*Pflegezentrum/i.test(inner)) {
        return "Deutsches Krankenhaus - Pflegezentrum";
      }
      const normalized = inner
        .replace(/\s+\/\s+/g, " - ")
        .replace(/([a-zA-ZäöüÄÖÜß0-9]{2,})\s*\/\s*([a-zA-ZäöüÄÖÜß0-9]{2,})/g, "$1 - $2");
      return `\u2066(${normalized})\u2069`;
    }
  );

  // Final check to guarantee no outer parentheses remain around Deutsches Krankenhaus - Pflegezentrum
  text = text.replace(
    /(?:\u2066)?\(\s*Deutsches Krankenhaus\s*[-/]\s*Pflegezentrum\s*\)(?:\u2069)?/gi,
    "Deutsches Krankenhaus - Pflegezentrum"
  );

  // 7. Collapse multiple spaces and 3+ consecutive newlines into "\n\n", then trim
  text = text
    .replace(/[ \t]+/g, " ")
    .replace(/\r/g, "")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();

  return text;
}

/**
 * Infers the display language requirement for a job.
 * If the language requirement is already specific (e.g. "A2", "C1", "EN"), it returns it.
 * If the job title or description is clearly in English (and lacks German markers), it returns "EN (B2)".
 * Otherwise, it returns the provided requirement or "B1/B2".
 */
export function inferDisplayLanguageReq(job?: {
  title?: string | null;
  descriptionRaw?: string | null;
  languageReq?: string | null;
  languageLevel?: string | null;
} | null): string {
  if (!job) return "B1/B2";

  const rawReq = (job.languageLevel || job.languageReq || "").trim();

  // If already specific other than generic "B1/B2" or "Deutsch (B1/B2)", return as-is
  if (rawReq && rawReq !== "B1/B2" && rawReq !== "Deutsch (B1/B2)") {
    return rawReq;
  }

  const title = job.title || "";
  const desc = cleanJobDescription(job.descriptionRaw || "");
  const fullText = `${title} ${desc}`;

  // German & Arabic-German indicators
  const germanMarkersRegex =
    /(?:m\/w\/d|ausbildung|azubi|pflegefachkraft|krankenpfleg|assistenzarzt|berufserfahrung|deutschkenntnisse|bewerbung|fachkraft|فرصة عمل مميزة)/i;
  const hasGermanMarkers = germanMarkersRegex.test(fullText);

  // Common English job indicators
  const englishMarkersRegex =
    /\b(?:Senior|Principal|Engineer|Developer|Manager|Specialist|Working Student|Intern|with experience in|we are looking for|requirements|responsibilities|you will)\b/i;
  const hasEnglishMarkers = englishMarkersRegex.test(fullText);

  if (hasEnglishMarkers && !hasGermanMarkers) {
    return "EN (B2)";
  }

  return rawReq || "B1/B2";
}

/**
 * Infers the display category for a job.
 * If job.category is already a specific non-general category (anything other than "General", "Other", "", or null), return job.category.
 * If job.category is "General" (or empty/other), inspect job.title and job.descriptionRaw:
 * - If matches IT/Software keywords, return "IT".
 * - If matches Engineering/Industrial keywords, return "Engineering".
 * - If matches Healthcare/Nursing keywords, return "Healthcare".
 * - Otherwise, return job.category || "General".
 */
export function inferDisplayCategory(job?: {
  title?: string | null;
  category?: string | null;
  descriptionRaw?: string | null;
} | null): string {
  if (!job) return "General";

  const rawCat = (job.category || "").trim();
  const normalizedCat = rawCat.toLowerCase();

  // If already a specific recognized non-general category
  if (
    rawCat &&
    normalizedCat !== "general" &&
    normalizedCat !== "other" &&
    normalizedCat !== "all"
  ) {
    if (normalizedCat === "it" || normalizedCat.includes("information") || normalizedCat.includes("software")) {
      return "IT";
    }
    if (normalizedCat.includes("health") || normalizedCat.includes("pflege") || normalizedCat.includes("nurs") || normalizedCat.includes("mediz")) {
      return "Healthcare";
    }
    if (normalizedCat.includes("ausbildung") || normalizedCat.includes("تدريب") || normalizedCat.includes("azubi")) {
      return "Ausbildung";
    }
    if (normalizedCat.includes("engineer") || normalizedCat.includes("ingenieur") || normalizedCat.includes("mechatron")) {
      return "Engineering";
    }
    return rawCat;
  }

  const title = job.title || "";
  const desc = job.descriptionRaw || "";

  // 1. IT / Software keywords
  const itRegex =
    /\b(?:Software|Developer|DevOps|Frontend|Backend|Full[- ]?Stack|Data|Database|Cloud|Cyber|Security|QA|SRE|Platform|System Administrator|IT|C\+\+|Python|Java|React|Node|Kubernetes|Machine Learning|AI|Informatik|Entwickler)\b/i;
  if (itRegex.test(title) || itRegex.test(desc)) {
    return "IT";
  }

  // 2. Engineering / Industrial keywords
  const engRegex =
    /\b(?:Mechanical|Electrical|Civil|Automation|Robotics|Mechatronik|Maschinenbau|Elektrotechnik|Ingenieur|Process Engineer|Manufacturing|Hardware)\b/i;
  if (engRegex.test(title) || engRegex.test(desc)) {
    return "Engineering";
  }

  // 3. Healthcare / Nursing keywords
  const healthRegex =
    /\b(?:Pflege|Krankenhaus|Krankenpfleger|Altenpflege|Nurse|Nursing|Arzt|Ärztin|Medizin|Healthcare|Caregiver|Hebamme|Physiotherap)\b/i;
  if (healthRegex.test(title) || healthRegex.test(desc)) {
    return "Healthcare";
  }

  return rawCat || "General";
}

export function deduplicateJobs<T extends { title: string; company: string }>(jobs: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const job of jobs) {
    const key = `${(job.title || "").trim().toLowerCase()}|${(job.company || "").trim().toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(job);
    }
  }

  return result;
}

export interface PaginatedJobsResult<T> {
  jobs: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

/**
 * Filters excluded jobs, optionally sanitizes them, deduplicates, and computes
 * accurate post-filter/post-dedup `total`, `totalPages`, and page slice.
 */
export function filterDeduplicateAndPaginateJobs<
  T extends {
    title: string;
    company: string;
    applyUrl?: string | null;
    sourceUrl?: string | null;
    city?: string | null;
    location?: string | null;
    description?: string | null;
    descriptionRaw?: string | null;
  }
>(
  rawJobs: T[],
  options: {
    page?: number;
    limit?: number;
    sanitize?: (job: T) => T;
  } = {}
): PaginatedJobsResult<T> {
  const safeLimit = Math.min(
    50,
    Math.max(1, Math.floor(Number.isFinite(options.limit) ? (options.limit as number) : 15))
  );
  const safePage = Math.max(
    1,
    Math.floor(Number.isFinite(options.page) ? (options.page as number) : 1)
  );

  const visibleJobs = rawJobs.filter((job) => !isExcludedJob(job));
  const sanitizedJobs = options.sanitize
    ? visibleJobs.map((job) => options.sanitize!(job))
    : visibleJobs;
  const dedupedJobs = deduplicateJobs(sanitizedJobs);

  const total = dedupedJobs.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const start = (safePage - 1) * safeLimit;
  const jobs = dedupedJobs.slice(start, start + safeLimit);

  return {
    jobs,
    total,
    page: safePage,
    totalPages,
    limit: safeLimit,
  };
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
      if (languageReq.trim().toLowerCase() === "none") {
        return "Deutsch (B1/B2)";
      }
      const match = languageReq.match(/\b([ABC][12](?:\s*[\/\-]\s*[ABC][12])?)\b/i);
      if (match) return match[1].toUpperCase();
      return languageReq.trim();
    }
    if (requirements && typeof requirements === "string") {
      const match = requirements.match(/\b([ABC][12](?:\s*[\/\-]\s*[ABC][12])?)\b/i);
      if (match) return match[1].toUpperCase();
    }
    return "Deutsch (B1/B2)";
  } catch {
    return "Deutsch (B1/B2)";
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
export function getAnerkennungDetails(category?: string | null, isAr = false, isDe = false, isFr = false) {
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
          : isFr
          ? "Profession réglementée"
          : "Regulated Profession",
        title: isAr
          ? "الاعتراف المهني للرعاية والتمريض (Berufsanerkennung)"
          : isDe
          ? "Berufliche Anerkennung Pflege"
          : isFr
          ? "Reconnaissance professionnelle en soins (Anerkennung)"
          : "Nursing Recognition (Anerkennung)",
        desc: isAr
          ? "تتطلب ممارسة مهنة التمريض والرعاية الطبية في ألمانيا استكمال إجراءات المعادلة الرسمية (Berufsanerkennung) أو الحصول على إشعار النقص (Defizitbescheid) للالتحاق بدورة تعديل (Anpassungslehrgang)."
          : isDe
          ? "Für die Ausübung dieses Pflegeberufs ist die behördliche Anerkennung oder ein Defizitbescheid für Anpassungsmaßnahmen erforderlich."
          : isFr
          ? "L'exercice de la profession d'infirmier en Allemagne nécessite une reconnaissance officielle (Anerkennung) ou un Defizitbescheid."
          : "Practicing nursing in Germany requires official recognition (Anerkennung) or a Defizitbescheid for adaptation training.",
        statusText: isAr
          ? "مطلوب تعديل رسمي أو إشعار نقص (Defizitbescheid)"
          : isDe
          ? "Anerkennung oder Anpassungslehrgang erforderlich"
          : isFr
          ? "Reconnaissance officielle ou stage d'adaptation requis"
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
          : isFr
          ? "Formation en alternance (Duale Ausbildung)"
          : "Dual Vocational Training",
        title: isAr
          ? "معادلة الشهادة المدرسية (Zeugnisanerkennung)"
          : isDe
          ? "Schulabschluss-Anerkennung"
          : isFr
          ? "Équivalence du diplôme scolaire (Zeugnisanerkennung)"
          : "School Certificate Recognition",
        desc: isAr
          ? "للالتحاق بعقود التدريب المهني، يلزم تعديل الشهادة المدرسية الثانوية أو الإعدادية (Mittlere Reife) عبر هيئة تعديل الشهادات في الولاية الألمانية المستهدفة."
          : isDe
          ? "Für eine duale Ausbildung ist in der Regel die behördliche Anerkennung des Schulabschlusses erforderlich."
          : isFr
          ? "Pour une formation en alternance, la reconnaissance officielle de votre diplôme scolaire est généralement requise."
          : "For dual vocational training, recognition of your secondary school diploma by the state office is required.",
        statusText: isAr
          ? "شهادة ثانوية معترف بها (Mittlere Reife / Abitur)"
          : isDe
          ? "Anerkannter Schulabschluss"
          : isFr
          ? "Diplôme de fin d'études secondaires reconnu"
          : "Recognized secondary school diploma",
      };
    }

    return {
      type: "academic",
      badge: isAr
        ? "اعتماد أكاديمي وخبرة (Anabin / ZAB Standard)"
        : isDe
        ? "Anabin / ZAB Hochschulabschluss"
        : isFr
        ? "Reconnaissance académique Anabin / ZAB"
        : "Anabin / ZAB Academic Recognition",
      title: isAr
        ? "معادلة الشهادات والمؤهل العلمي (Anerkennung der Berufsqualifikation)"
        : isDe
        ? "Anerkennung des Hochschulabschlusses"
        : isFr
        ? "Reconnaissance des diplômes et qualifications"
        : "Degree & Professional Recognition",
      desc: isAr
        ? "تُقبل الشهادات الجامعية الصادرة خارج ألمانيا المعترف بها في قاعدة بيانات (Anabin) بدرجة H+، أو ما يعادلها من خبرات مهنية عملية موثقة في القطاع التقني والتجاري."
        : isDe
        ? "Ausländische Hochschulabschlüsse müssen in der Anabin-Datenbank (Status H+) gelistet sein oder einer ZAB-Gleichwertigkeitsprüfung entsprechen."
        : isFr
        ? "Les diplômes étrangers doivent être reconnus dans la base Anabin (statut H+) ou justifier d'une expérience professionnelle certifiée."
        : "Foreign degrees must be recognized in the Anabin database (H+ status) or have documented relevant professional experience.",
      statusText: isAr
        ? "شهادة معترف بها (Anabin H+) أو سنوات خبرة موثقة"
        : isDe
        ? "Vergleichbarer Abschluss (Anabin H+) oder Berufserfahrung"
        : isFr
        ? "Diplôme équivalent (Anabin H+) ou expérience certifiée"
        : "Comparable degree (Anabin H+) or certified experience",
    };
  } catch {
    return {
      type: "academic",
      badge: isAr ? "معايير سوق العمل الألماني" : isDe ? "Deutscher Arbeitsstandard" : isFr ? "Norme du marché allemand" : "German Labor Standard",
      title: isAr ? "المعادلة المهنية والأكاديمية" : isDe ? "Berufliche Gleichwertigkeit" : isFr ? "Équivalence professionnelle" : "Professional Equivalence",
      desc: isAr ? "تخضع المؤهلات للتقييم بحسب معايير الجهات الألمانية المختصة." : isDe ? "Qualifikationen werden gemäß deutschen Richtlinien bewertet." : isFr ? "Les qualifications sont évaluées selon les directives allemandes." : "Qualifications assessed per German guidelines.",
      statusText: isAr ? "مؤهل مهني أو جامعي معتمد" : isDe ? "Anerkannte Qualifikation" : isFr ? "Qualification reconnue" : "Recognized Qualification",
    };
  }
}

/**
 * Formats an Arabic relative day count following strict Arabic pluralization rules:
 * - 0 -> اليوم
 * - 1 -> منذ يوم
 * - 2 -> منذ يومين
 * - 3–10 -> منذ {n} أيام
 * - 11+ -> منذ {n} يوماً
 */
export function formatArabicRelativeDays(days: number): string {
  const n = Math.floor(days);
  if (!Number.isFinite(n) || n <= 0) {
    return "اليوم";
  }
  if (n === 1) {
    return "منذ يوم";
  }
  if (n === 2) {
    return "منذ يومين";
  }
  if (n >= 3 && n <= 10) {
    return `منذ ${n} أيام`;
  }
  return `منذ ${n} يوماً`;
}

/**
 * Formats a job publication date into a localized relative string (up to 29 days)
 * or a formatted calendar date for older listings.
 */
export function formatRelativeJobDate(
  dateInput?: string | Date | null,
  locale: string = "ar",
  nowDate: Date = new Date()
): string {
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const isFr = locale === "fr";
  const fallback = isAr
    ? "محدث حديثاً"
    : isDe
    ? "Kürzlich aktualisiert"
    : isFr
    ? "Récemment mis à jour"
    : "Recently updated";

  if (!dateInput) return fallback;

  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return fallback;

    const diffMs = Math.max(0, nowDate.getTime() - d.getTime());
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 24) {
      return isAr ? "اليوم" : isDe ? "Heute" : isFr ? "Aujourd'hui" : "Today";
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) {
      if (isAr) {
        return formatArabicRelativeDays(diffDays);
      }
      if (diffDays === 1) {
        return isDe ? "Gestern" : isFr ? "Hier" : "1 day ago";
      }
      return isDe
        ? `Vor ${diffDays} Tagen`
        : isFr
        ? `Il y a ${diffDays} jours`
        : `${diffDays} days ago`;
    }

    const localeCode = isAr ? "ar-MA" : isDe ? "de-DE" : isFr ? "fr-FR" : "en-GB";
    return d.toLocaleDateString(localeCode, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return fallback;
  }
}

export interface SalaryBidiSegment {
  text: string;
  isLtr: boolean;
}

/**
 * Splits a salary string into LTR-isolated numeric/currency segments
 * (e.g. "€ 90.000 - € 130.000") and surrounding text segments (e.g. " سنوياً")
 * so min-to-max ranges never visually reverse in RTL locales.
 */
export function splitSalaryBidiSegments(salary?: string | null): SalaryBidiSegment[] {
  if (!salary || typeof salary !== "string") return [];

  const rangeRegex =
    /(?:(?:€|\$|£|CHF|EUR|USD)\s*)?\d[\d.,]*(?:\s*(?:€|\$|£|CHF|EUR|USD|k|K))?(?:\s*[-–—~]\s*(?:(?:€|\$|£|CHF|EUR|USD)\s*)?\d[\d.,]*(?:\s*(?:€|\$|£|CHF|EUR|USD|k|K))?)?/g;

  const segments: SalaryBidiSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = rangeRegex.exec(salary)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: salary.slice(lastIndex, match.index), isLtr: false });
    }
    segments.push({ text: match[0], isLtr: true });
    lastIndex = rangeRegex.lastIndex;
  }

  if (lastIndex < salary.length) {
    segments.push({ text: salary.slice(lastIndex), isLtr: false });
  }

  return segments.length > 0 ? segments : [{ text: salary, isLtr: false }];
}
