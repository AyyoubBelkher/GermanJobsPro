// European, German, French, English & Arabic date parser conforming to DIN standards and pure UTC

export function normalizeDateStr(val: string): string {
  return val
    .trim()
    // Eastern Arabic numerals (٠-٩)
    .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    // Persian numerals (۰-۹)
    .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06F0))
    // Arabic comma
    .replace(/،/g, ",")
    .replace(/\s+/g, " ");
}

export const MONTH_MAP_LATIN: Record<string, number> = {
  jan: 0, janv: 0, januar: 0, january: 0, janvier: 0,
  feb: 1, febr: 1, fev: 1, fevr: 1, februar: 1, february: 1, fevrier: 1,
  mar: 2, maerz: 2, march: 2, mars: 2,
  apr: 3, avr: 3, april: 3, avril: 3,
  may: 4, mai: 4,
  jun: 5, juni: 5, june: 5, juin: 5,
  jul: 6, juil: 6, juli: 6, july: 6, juillet: 6,
  aug: 7, august: 7, aout: 7,
  sep: 8, sept: 8, september: 8, septembre: 8,
  oct: 9, okt: 9, oktober: 9, october: 9, octobre: 9,
  nov: 10, november: 10, novembre: 10,
  dec: 11, dez: 11, dezember: 11, december: 11, decembre: 11,
};

export const MONTH_MAP_AR: Record<string, number> = {
  "يناير": 0, "فبراير": 1, "مارس": 2, "ابريل": 3, "مايو": 4, "ماي": 4,
  "يونيو": 5, "جوان": 5, "يوليو": 6, "جويليه": 6, "جويلية": 6, "يوليوز": 6,
  "اغسطس": 7, "اوت": 7, "غشت": 7, "سبتمبر": 8, "شتنبر": 8, "اكتوبر": 9,
  "نوفمبر": 10, "نونبر": 10, "ديسمبر": 11, "دجنبر": 11,
  "كانون الثاني": 0, "كانون 2": 0, "شباط": 1, "اذار": 2, "نيسان": 3,
  "ايار": 4, "حزيران": 5, "تموز": 6, "اب": 7, "ايلول": 8,
  "تشرين الاول": 9, "تشرين 1": 9, "تشرين الثاني": 10, "تشرين 2": 10,
  "كانون الاول": 11, "كانون 1": 11,
};

export const SORTED_LATIN_MONTHS = Object.keys(MONTH_MAP_LATIN).sort((a, b) => b.length - a.length);
export const SORTED_ARABIC_MONTHS = Object.keys(MONTH_MAP_AR).sort((a, b) => b.length - a.length);

export function normalizeLatin(s: string): string {
  return s
    .toLowerCase()
    .replace(/[éèêë]/g, "e")
    .replace(/[àâ]/g, "a")
    .replace(/[îï]/g, "i")
    .replace(/[ûù]/g, "u")
    .replace(/[ç]/g, "c")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

export function normalizeArabic(s: string): string {
  return s
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ـ/g, "");
}

/**
 * Parses European, German, French, English, and Arabic dates into a UTC Date object.
 */
export function parseEuropeanDate(val?: string | null, isSubCheck = false): Date | null {
  if (!val || typeof val !== "string") return null;
  let s = normalizeDateStr(val);
  if (
    !s ||
    /^(heute|present|current|jetzt|laufend|aktuell|actuel|en cours|حالي|حاليا|حالياً|الآن|الان)$/i.test(s)
  ) {
    return null;
  }

  // Strip common leading prepositions: "von ", "من ", "du ", "from ", "since ", "ab "
  s = s.replace(/^(?:von|from|du|de|since|ab|من|منذ)\s+/i, "").trim();

  // Range splitting (e.g. "2021 - 2023", "01/2021 - 05/2023", "2021 bis 2023", "2021 إلى 2023")
  if (!isSubCheck) {
    // Two 4-digit years without spaces: e.g. "2021-2023", "2021/2023", "2021–2023"
    const yrYrMatch = s.match(/^(\d{4})\s*[-–—/]\s*(\d{4})$/);
    if (yrYrMatch) {
      const startYear = parseInt(yrYrMatch[1], 10);
      if (startYear >= 1900 && startYear <= 2100) {
        return new Date(Date.UTC(startYear, 0, 1));
      }
    }

    const rangeParts = s.split(/\s+[-–—/]\s+|\s+(?:bis|to|à|au|الى|إلى|حتى)\s+/i);
    if (rangeParts.length > 1) {
      const parsedStart = parseEuropeanDate(rangeParts[0], true);
      if (parsedStart) return parsedStart;
    }
  }

  // 1. ISO standard: YYYY-MM-DD, YYYY-MM, YYYY/MM, YYYY.MM
  const isoMatch = s.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = isoMatch[3] ? parseInt(isoMatch[3], 10) : 1;
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      return new Date(Date.UTC(year, month, day));
    }
  }

  // 2. Numeric DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      return new Date(Date.UTC(year, month, day));
    }
  }

  // 3. Numeric MM/YYYY, MM.YYYY, MM-YYYY
  const myMatch = s.match(/^(\d{1,2})[./\-](\d{4})$/);
  if (myMatch) {
    const month = parseInt(myMatch[1], 10) - 1;
    const year = parseInt(myMatch[2], 10);
    if (month >= 0 && month <= 11) {
      return new Date(Date.UTC(year, month, 1));
    }
  }

  // 4. Standalone 4-digit year: "2020"
  const yMatch = s.match(/^(\d{4})$/);
  if (yMatch) {
    const year = parseInt(yMatch[1], 10);
    if (year >= 1900 && year <= 2100) {
      return new Date(Date.UTC(year, 0, 1));
    }
  }

  // 5. Text month with year (Latin: EN/DE/FR) - e.g. "Juni 2021", "June 2021", "juin 2021"
  const normLatin = normalizeLatin(s);
  const yrMatch = normLatin.match(/\b(19\d{2}|20\d{2})\b/);
  if (yrMatch) {
    const year = parseInt(yrMatch[1], 10);
    for (const mName of SORTED_LATIN_MONTHS) {
      const reg = new RegExp(`(?:^|[^a-z])${mName}(?:$|[^a-z])`, "i");
      if (reg.test(normLatin)) {
        const month = MONTH_MAP_LATIN[mName];
        const withoutMonthAndYear = normLatin
          .replace(new RegExp(mName, "i"), " ")
          .replace(yrMatch[0], " ");
        const dayMatch = withoutMonthAndYear.match(/\b(\d{1,2})\b/);
        const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;
        const validDay = day >= 1 && day <= 31 ? day : 1;
        return new Date(Date.UTC(year, month, validDay));
      }
    }
  }

  // 6. Text month with year (Arabic)
  const normArabic = normalizeArabic(s);
  const yrMatchAr = normArabic.match(/\b(19\d{2}|20\d{2})\b/);
  if (yrMatchAr) {
    const year = parseInt(yrMatchAr[1], 10);
    for (const mName of SORTED_ARABIC_MONTHS) {
      const normMName = normalizeArabic(mName);
      if (normArabic.includes(normMName)) {
        const month = MONTH_MAP_AR[mName];
        const withoutMonthAndYear = normArabic
          .replace(normMName, " ")
          .replace(yrMatchAr[0], " ");
        const dayMatch = withoutMonthAndYear.match(/\b(\d{1,2})\b/);
        const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;
        const validDay = day >= 1 && day <= 31 ? day : 1;
        return new Date(Date.UTC(year, month, validDay));
      }
    }
  }

  return null;
}

/**
 * Recovers candidate dates from raw CV text or surrounding context fields
 * when dates are detached or displaced in multi-column PDF extractions.
 */
export function extractDateFromContext(
  contextText?: string,
  searchTerms?: (string | null | undefined)[]
): Date | null {
  // 1. First check if any search term itself contains an embedded date
  if (searchTerms && searchTerms.length > 0) {
    for (const term of searchTerms) {
      if (term && typeof term === "string") {
        const directParsed = parseEuropeanDate(term);
        if (directParsed) return directParsed;
        const yrMatch = term.match(/\b(19[7-9]\d|20[0-2]\d|2030)\b/);
        if (yrMatch) return new Date(Date.UTC(parseInt(yrMatch[1], 10), 0, 1));
      }
    }
  }

  if (!contextText || typeof contextText !== "string") {
    return null;
  }

  // 2. Scan windows around matching search terms in contextText
  const validTerms = (searchTerms || [])
    .filter((t): t is string => typeof t === "string" && t.trim().length >= 3)
    .map((t) => t.trim().toLowerCase());

  const datePatterns = [
    // Month name + 4-digit year (e.g. "Juni 2021", "June 2021", "juin 2021")
    /\b(?:januar|februar|märz|maerz|april|mai|juni|june|juin|juli|july|juillet|august|aout|september|septembre|oktober|octobre|october|november|novembre|dezember|december|decembre|jan|feb|mär|apr|jun|jul|aug|sep|okt|oct|nov|dez|dec)\s+(19\d{2}|20\d{2})\b/gi,
    // Arabic month + year
    /(?:يناير|فبراير|مارس|ابريل|مايو|ماي|يونيو|جوان|يوليو|جويليه|جويلية|يوليوز|اغسطس|اوت|غشت|سبتمبر|شتنبر|اكتوبر|نوفمبر|نونبر|ديسمبر|دجنبر)\s+(19\d{2}|20\d{2})/g,
    // Numeric DD.MM.YYYY or MM/YYYY or DD/MM/YYYY
    /\b(\d{1,2}[./-]\d{1,2}[./-](?:19\d{2}|20\d{2}))\b/g,
    /\b(\d{1,2}[./-](?:19\d{2}|20\d{2}))\b/g,
    // 4-digit year range: e.g. 2018 - 2021
    /\b(19\d{2}|20\d{2})\s*[-–—/]\s*(19\d{2}|20\d{2})\b/g,
    // Standalone 4-digit year
    /\b(19[7-9]\d|20[0-2]\d|2030)\b/g,
  ];

  const windows: string[] = [];

  for (const term of validTerms) {
    let searchIndex = 0;
    const lowerContext = contextText.toLowerCase();
    while (searchIndex < lowerContext.length) {
      const idx = lowerContext.indexOf(term, searchIndex);
      if (idx === -1) break;
      const start = Math.max(0, idx - 250);
      const end = Math.min(contextText.length, idx + term.length + 250);
      windows.push(contextText.slice(start, end));
      searchIndex = idx + term.length;
    }
  }

  // Also check common education section headers if no specific windows found
  if (windows.length === 0) {
    const sectionKeywords = [
      "schul-und berufsbildung",
      "schulbildung",
      "ausbildung",
      "education",
      "abitur",
      "baccalauréat",
      "baccalaureat",
      "gymnasium",
      "lycée",
      "lycee",
    ];
    const lowerContext = contextText.toLowerCase();
    for (const kw of sectionKeywords) {
      const idx = lowerContext.indexOf(kw);
      if (idx !== -1) {
        const start = Math.max(0, idx - 100);
        const end = Math.min(contextText.length, idx + 400);
        windows.push(contextText.slice(start, end));
      }
    }
  }

  for (const windowText of windows) {
    for (const pattern of datePatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(windowText);
      if (match) {
        const parsed = parseEuropeanDate(match[0]);
        if (parsed) return parsed;
      }
    }
  }

  return null;
}

/**
 * Safely parses start/end dates with zero-fabrication fallback.
 * Uses fallbackAnchor (endDate) when startDate is missing, preserving exact month and year.
 * Scans raw CV text before ever falling back to current year.
 */
export function parseDateSafe(
  val?: string | null,
  fallbackAnchor?: string | null | number,
  fallbackYear?: number,
  contextText?: string,
  searchTerms?: (string | null | undefined)[]
): Date {
  let anchorStr: string | null = null;
  let customFallbackYear: number | undefined = undefined;

  if (typeof fallbackAnchor === "number") {
    customFallbackYear = fallbackAnchor;
  } else if (typeof fallbackAnchor === "string") {
    anchorStr = fallbackAnchor;
  }
  if (typeof fallbackYear === "number") {
    customFallbackYear = fallbackYear;
  }

  // 1. Try parsing val directly with parseEuropeanDate
  const d = parseEuropeanDate(val);
  if (d !== null) return d;

  // 2. Check if val has any 4-digit year between 1970 and 2030
  if (val && typeof val === "string") {
    const normalizedVal = normalizeDateStr(val);
    const yrMatch = normalizedVal.match(/\b(19[7-9]\d|20[0-2]\d|2030)\b/);
    if (yrMatch) {
      return new Date(Date.UTC(parseInt(yrMatch[1], 10), 0, 1));
    }
  }

  // 3. If startDate is missing or unparseable, check if endDate (fallbackAnchor) is valid
  // Preserve exact year AND month from fallbackAnchor
  if (anchorStr && typeof anchorStr === "string") {
    const anchorDate = parseEuropeanDate(anchorStr);
    if (anchorDate !== null) {
      return new Date(Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth(), 1));
    }

    const normalizedAnchor = normalizeDateStr(anchorStr);
    const anchorYrMatch = normalizedAnchor.match(/\b(19[7-9]\d|20[0-2]\d|2030)\b/);
    if (anchorYrMatch) {
      return new Date(Date.UTC(parseInt(anchorYrMatch[1], 10), 0, 1));
    }
  }

  // 4. Try recovering date from searchTerms and raw contextText
  const recoveredDate = extractDateFromContext(contextText, searchTerms);
  if (recoveredDate !== null) {
    return recoveredDate;
  }

  // 5. Fallback: only if completely unparseable and no year exists anywhere
  const resolvedFallbackYear = customFallbackYear ?? new Date().getUTCFullYear();
  console.warn(
    `[CV Date Safe Warning] Unparseable date encountered. Missing/unparseable startDate="${val}" and endDate="${anchorStr}". Defaulting to ${resolvedFallbackYear}-01-01 UTC to prevent gap fabrication.`
  );
  return new Date(Date.UTC(resolvedFallbackYear, 0, 1));
}

export function parseNullableDate(val?: string | null): Date | null {
  return parseEuropeanDate(val);
}

/**
 * Standard German/DIN 5008 date formatter (MM/YYYY) with UTC timezone invariance.
 */
export function formatDate(
  dateVal: Date | string | null | undefined,
  isCurrent?: boolean,
  isArabic = false
): string {
  if (isCurrent) return isArabic ? "حتى الآن" : "heute";
  if (!dateVal) return "";
  if (typeof dateVal === "string") {
    const s = dateVal.trim();
    if (!s) return "";
    if (/^(?:heute|present|aktuell|laufend|current|actuel|en cours|حالي|حاليا|الآن|الان)$/i.test(s)) {
      return isArabic ? "حتى الآن" : "heute";
    }
    // Preserve year-only precision (e.g. "2022")
    if (/^\d{4}$/.test(s)) return s;
    // Preserve year range (e.g. "2020 - 2022")
    if (/^\d{4}\s*[-–—/]\s*\d{4}$/.test(s)) return s;

    // Use parseEuropeanDate to guarantee pure UTC representation (avoids local midnight V8 timezone rollback)
    const europeanDate = parseEuropeanDate(s);
    if (europeanDate) {
      const month = String(europeanDate.getUTCMonth() + 1).padStart(2, "0");
      const year = europeanDate.getUTCFullYear();
      return `${month}/${year}`;
    }
  }
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) {
    return String(dateVal);
  }
  // Pure UTC extraction prevents timezone rollback in negative offsets
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${month}/${year}`;
}

/**
 * Formats a clean date range adhering to German DIN 5008 standards:
 * - Single-date entries (endDate is null and !isCurrent): returns "MM/YYYY" alone (NO trailing " - ").
 * - Identical start and end dates (e.g. "06/2021" and "06/2021" or 1-month range): returns "MM/YYYY" alone.
 * - Standard ranges: returns "MM/YYYY – MM/YYYY" (or "MM/YYYY – heute").
 */
export function formatDateRange(
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined,
  isCurrent?: boolean,
  isArabic = false
): string {
  const startStr = formatDate(startDate, false, isArabic);
  const endStr = formatDate(endDate, isCurrent, isArabic);

  if (!startStr && !endStr) return "";
  if (!startStr) return endStr;
  if (!endStr) return startStr;
  if (startStr === endStr) return startStr;

  return `${startStr} – ${endStr}`;
}

export function formatFullDate(dateVal: Date | string | null | undefined): string {
  if (!dateVal) return "";
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}.${month}.${year}`;
}
