/**
 * Deterministic domain validation, signal extraction, and heuristic checks for German ATS.
 * Pure stateless functions designed for 100% offline unit testing.
 */

export interface EmploymentEntry {
  id?: string;
  position?: string | null;
  company?: string | null;
  startDate: string; // e.g. "01.2020", "01/2020", "2020"
  endDate?: string | null; // e.g. "05.2023", "heute", null
  isCurrent?: boolean;
  rawText?: string;
}

export type ProvenanceState = "confirmed_present" | "confirmed_absent" | "unverified";

export interface ContactProvenance {
  email: ProvenanceState;
  phone: ProvenanceState;
  details: {
    textInspected: boolean;
    extractedPhoneInText: string | null;
    profileLoaded: boolean;
    profilePhoneInspected: boolean;
    profilePhoneValue: string | null;
    extractedEmailInText: string | null;
    profileEmailInspected: boolean;
    profileEmailValue: string | null;
  };
}

export type JobDescriptionStatus = "omitted" | "invalid_supplied" | "valid_supplied";

export interface JobDescriptionEvaluation {
  status: JobDescriptionStatus;
  text: string | null;
}

export type ActionCategory =
  | "category_a_safe_general"
  | "category_b_candidate_claim"
  | "category_c_job_claim"
  | "category_d_unsafe_or_invalid";

export interface ActionPlanClassification {
  rawText: string;
  category: ActionCategory;
  isValid: boolean;
  discardReason?: string;
}

export interface ValidationStatus {
  isValidated: boolean;
  deterministicChecksRun: {
    schemaValidated: boolean;
    dateInversionsChecked: boolean;
    contactProvenanceChecked: boolean;
    actionPlanClassified: boolean;
    jobDescriptionEvaluated: boolean;
  };
  provenance: ContactProvenance;
  jobDescriptionStatus: JobDescriptionStatus;
}

export interface ValidatedAtsOutput {
  overallScore: number;
  din5008Score: number;
  keywordMatchScore: number | null;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  actionPlan: string[];
}

/**
 * Strictly parses a month/year (MM.YYYY, MM/YYYY) or year-only (YYYY) token.
 * Rejects invalid months (< 1 or > 12) by returning null (never clamped).
 * Supported year range: 1950 to 2100.
 */
export function parseStrictMonthYear(token: string | null | undefined): Date | null {
  if (!token) return null;
  const clean = token.replace(/[:.,;()]+$/, "").replace(/^[:.,;()]+/, "").trim();
  const match = clean.match(/^(?:(\d{1,2})[./])?(\d{4})$/);
  if (!match) return null;

  const year = parseInt(match[2], 10);
  if (year < 1950 || year > 2100) return null;

  if (match[1] !== undefined) {
    const month = parseInt(match[1], 10);
    // Strict month validation: 1 to 12 only
    if (month < 1 || month > 12) return null;
    return new Date(Date.UTC(year, month - 1, 1));
  }

  return new Date(Date.UTC(year, 0, 1));
}

/**
 * Checks whether an end-date token indicates ongoing employment.
 */
export function isOngoingDate(token: string | null | undefined): boolean {
  if (!token) return false;
  return /^(?:heute|present|aktuell|laufend|current)$/i.test(token.trim());
}

/**
 * Normalizes a date string or Date object to a clean comparable token (e.g. "01.2020", "2020").
 */
export function normalizeDateForMatch(token: string | Date | null | undefined): string | null {
  if (!token) return null;
  if (token instanceof Date) {
    if (isNaN(token.getTime())) return null;
    const month = String(token.getUTCMonth() + 1).padStart(2, "0");
    const year = token.getUTCFullYear();
    return `${month}.${year}`;
  }
  const clean = String(token).trim();
  if (isOngoingDate(clean)) return "heute";
  const parsed = parseStrictMonthYear(clean);
  if (!parsed) return null;

  // If input was year-only
  if (/^\d{4}$/.test(clean)) {
    return clean;
  }
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const year = parsed.getUTCFullYear();
  return `${month}.${year}`;
}

/**
 * Checks whether an employment entry is referenced by an entity anchor in the finding text.
 * Requires company or position with minimum 3 characters.
 */
export function anchorMatches(normalizedFinding: string, entry: EmploymentEntry): boolean {
  const positionMatch = Boolean(
    entry.position &&
      entry.position.trim().length >= 3 &&
      normalizedFinding.includes(entry.position.trim().toLowerCase())
  );
  const companyMatch = Boolean(
    entry.company &&
      entry.company.trim().length >= 3 &&
      normalizedFinding.includes(entry.company.trim().toLowerCase())
  );
  return positionMatch || companyMatch;
}

/**
 * Checks whether finding text contains both start and end date tokens corresponding to an entry.
 */
function datesMatch(normalizedFinding: string, entry: EmploymentEntry): boolean {
  const startRaw = entry.startDate ? String(entry.startDate).trim().toLowerCase() : "";
  const endRaw = entry.endDate ? String(entry.endDate).trim().toLowerCase() : (entry.isCurrent ? "heute" : "");

  if (!startRaw) return false;

  const startToken = normalizeDateForMatch(startRaw);
  const endToken = normalizeDateForMatch(endRaw);

  const startYear = startToken ? startToken.slice(-4) : "";
  const endYear = endToken && endToken !== "heute" ? endToken.slice(-4) : "";

  const startMatched = Boolean(
    (startToken && normalizedFinding.includes(startToken.toLowerCase())) ||
    (startYear && normalizedFinding.includes(startYear))
  );

  let endMatched = false;
  if (entry.isCurrent || isOngoingDate(endRaw)) {
    endMatched = /heute|present|aktuell|laufend|current/.test(normalizedFinding);
  } else {
    endMatched = Boolean(
      (endToken && normalizedFinding.includes(endToken.toLowerCase())) ||
      (endYear && normalizedFinding.includes(endYear))
    );
  }

  return startMatched && endMatched;
}

/**
 * Validates a date inversion finding against the candidate's employment entries.
 *
 * Conservative Disambiguation Specification:
 * 1. Finding must cite an entity anchor (company or position, min 3 chars).
 * 2. If multiple entries match the anchor (e.g. duplicate company/position), date matching ALONE
 *    cannot be used to rescue or select an entry. The finding must be discarded as ambiguous (return false).
 * 3. Exactly one unique entry must be isolated by the anchor (anchorMatches.length === 1).
 * 4. The unique entry must bind BOTH start and end dates in the finding text.
 * 5. Ongoing roles (current: true or "heute") return false.
 * 6. Date math evaluated on the target entry: target.startDate > target.endDate.
 */
export function hasVerifiedDateInversion(
  findingText: string,
  entries: EmploymentEntry[]
): boolean {
  if (!findingText || entries.length === 0) return false;
  const normalizedFinding = findingText.toLowerCase();

  // Step 1: Filter entries by entity anchor (company or position)
  const anchorMatchedEntries = entries.filter((entry) => anchorMatches(normalizedFinding, entry));

  // If no entry anchor matches, finding cannot be anchored -> reject
  if (anchorMatchedEntries.length === 0) {
    return false;
  }

  // Conservative Rule: When company/position anchors match multiple entries,
  // date matching alone must not automatically establish that the original finding
  // uniquely identified the intended entry. Return false.
  if (anchorMatchedEntries.length > 1) {
    return false;
  }

  const target = anchorMatchedEntries[0];

  // Step 2: Ongoing employment cannot be inverted
  if (target.isCurrent || isOngoingDate(target.endDate)) {
    return false;
  }

  if (!target.startDate || !target.endDate) {
    return false;
  }

  // Step 3: Dual Date Binding on the uniquely anchored entry
  if (!datesMatch(normalizedFinding, target)) {
    return false;
  }

  // Step 4: Strict parsing of the target entry's own dates
  const parsedStart = parseStrictMonthYear(target.startDate);
  const parsedEnd = parseStrictMonthYear(target.endDate);

  if (!parsedStart || !parsedEnd) {
    return false;
  }

  // Step 5: Confirmed defect if start date is strictly after end date
  return parsedStart.getTime() > parsedEnd.getTime();
}

/**
 * Conservative phone number extractor from CV text.
 * Strictly excludes calendar date ranges, year ranges, and German postal codes.
 */
export function extractPhoneFromCvText(text: string): string | null {
  if (!text || text.trim().length === 0) return null;

  // First strip calendar date ranges to prevent false matches
  const strippedText = text
    .replace(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\s*[-–—/]\s*\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g, " ")
    .replace(/\b(19\d{2}|20\d{2})\s*[-–—/]\s*(19\d{2}|20\d{2})\b/g, " ")
    .replace(/\b\d{1,2}[./]\d{4}\s*[-–—/]\s*\d{1,2}[./]\d{4}\b/g, " ");

  // Phone regex requiring at least 7 digits, optional international prefix (+49 or 0049 or 0...)
  const phonePattern = /(?:(?:(?:\+|00)49\s*(?:\([0-9]+\))?|[0][1-9])[0-9\s/–-]{6,20}[0-9])/g;
  const matches = strippedText.match(phonePattern);
  if (!matches) return null;

  for (const match of matches) {
    const clean = match.replace(/[\s/–-]/g, "");
    const digitsOnly = clean.replace(/\D/g, "");
    if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      // Exclude German 5-digit postal codes
      if (/^\d{5}$/.test(digitsOnly)) continue;
      return match.trim();
    }
  }

  return null;
}

/**
 * Computes contact provenance across CV text and structured profile.
 *
 * Invariant:
 * The current pipeline has no OCR telemetry or source completeness metrics.
 * Therefore, confirmed_absent is NEVER emitted.
 * Missing contact fields evaluate strictly to "unverified".
 * Positively detected details evaluate to "confirmed_present".
 */
export function computeContactProvenance(params: {
  cvText: string;
  textExtractionSuccess: boolean;
  structuredProfile?: {
    personalInfo?: {
      email?: string | null;
      phone?: string | null;
    } | null;
  } | null;
  cvIdProvided?: boolean;
}): ContactProvenance {
  // 1. Text source processing
  const textInspected = params.textExtractionSuccess && typeof params.cvText === "string" && params.cvText.trim().length >= 30;
  const extractedPhoneInText = textInspected ? extractPhoneFromCvText(params.cvText) : null;
  const phoneInText = extractedPhoneInText !== null;

  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const emailMatch = textInspected ? params.cvText.match(emailRegex) : null;
  const extractedEmailInText = emailMatch ? emailMatch[0] : null;
  const emailInText = extractedEmailInText !== null;

  // 2. Profile source processing
  const profileLoaded = Boolean(params.cvIdProvided && params.structuredProfile !== null && typeof params.structuredProfile === "object");
  const profilePersonalInfoLoaded = profileLoaded && params.structuredProfile?.personalInfo !== undefined && params.structuredProfile?.personalInfo !== null;

  const profilePhoneInspected = profilePersonalInfoLoaded;
  const profilePhoneRaw = profilePhoneInspected ? params.structuredProfile?.personalInfo?.phone : null;
  const profilePhoneValue = profilePhoneRaw && String(profilePhoneRaw).trim().length > 0 ? String(profilePhoneRaw).trim() : null;

  const profileEmailInspected = profilePersonalInfoLoaded;
  const profileEmailRaw = profileEmailInspected ? params.structuredProfile?.personalInfo?.email : null;
  const profileEmailValue = profileEmailRaw && String(profileEmailRaw).trim().length > 0 ? String(profileEmailRaw).trim() : null;

  // 3. Provenance state determination (Phone)
  // confirmed_absent is never emitted due to lack of source-completeness evidence.
  let phoneState: ProvenanceState = "unverified";
  if (phoneInText || profilePhoneValue !== null) {
    phoneState = "confirmed_present";
  }

  // 4. Provenance state determination (Email)
  let emailState: ProvenanceState = "unverified";
  if (emailInText || profileEmailValue !== null) {
    emailState = "confirmed_present";
  }

  return {
    email: emailState,
    phone: phoneState,
    details: {
      textInspected,
      extractedPhoneInText,
      profileLoaded,
      profilePhoneInspected,
      profilePhoneValue,
      extractedEmailInText,
      profileEmailInspected,
      profileEmailValue,
    },
  };
}

/**
 * Classifies job description input into omitted, invalid_supplied, or valid_supplied.
 */
export function classifyJobDescription(jd: string | null | undefined): JobDescriptionEvaluation {
  if (!jd || jd.trim().length === 0) {
    return { status: "omitted", text: null };
  }
  const clean = jd.trim();
  if (clean.length < 30) {
    return { status: "invalid_supplied", text: clean };
  }
  return { status: "valid_supplied", text: clean };
}

/**
 * Detects whether a string is actually a statement that no weaknesses or errors exist,
 * or is just punctuation, none, or n/a across Arabic, German, English, and French.
 */
export function isNonWeaknessStatement(text: string | null | undefined): boolean {
  if (!text) return true;
  const clean = text.trim();
  if (clean.length === 0 || /^[-—_./\\*]+$/.test(clean)) return true;

  const normalized = clean.toLowerCase();

  // Arabic patterns for "No weaknesses / No gaps / Free of errors / Ready without changes"
  const arPattern =
    /(?:لا\s*توجد|لا\s*يوجد|ليس\s*هناك|خالية\s*من|لا\s*تحتوي\s*على|لم\s*يتم\s*(?:العثور|رصد)(?:\s*على)?|لم\s*نلاحظ)\s*(?:أي\s*)?(?:نقاط\s*ضعف|نواقص|فجوات|أخطاء|عيوب|مشاكل|ملاحظات\s*(?:سلبية|جوهرية)?|ضعف|نقص|خلل)|لا\s+توجد\s+نقاط\s+ضعف\s+جوهرية|(?:ولا|لا)\s*تحتاج\s*(?:إلى\s*|لأي\s*)?(?:أي\s*)?(?:تعديل|تغيير|إصلاح)|(?:سيرة\s*(?:ذاتية\s*)?)?(?:ممتازة|مقبولة|جاهزة|متوافقة).*(?:ولا|لا)\s*تحتاج|لا\s*توجد\s*(?:أي\s*)?فروقات|لا\s*يوجد\s*(?:أي\s*)?تعارض/i;
  if (arPattern.test(clean)) return true;

  // German patterns
  const dePattern =
    /(?:keine\s+(?:wesentlichen\s+|nennenswerten\s+|gravierenden\s+|echten\s+|relevanten\s+|signifikanten\s+)?(?:schwächen|schwaechen|mängel|maengel|lücken|luecken|fehler|defizite|probleme|kritikpunkte|red\s*flags)|nichts\s+zu\s+bemängeln|vollständig\s+und\s+fehlerfrei)/i;
  if (dePattern.test(normalized)) return true;

  // English patterns
  const enPattern =
    /(?:no\s+(?:significant\s+|major\s+|notable\s+|real\s+|apparent\s+|critical\s+|obvious\s+)?(?:weaknesses|flaws|defects|red\s*flags|issues|gaps|deficiencies|errors)\b|^none\.?$|^n\/a\.?$|none\s+(?:found|detected|identified)|no\s+weaknesses\s+(?:found|detected|identified))/i;
  if (enPattern.test(normalized)) return true;

  // French patterns
  const frPattern =
    /aucune\s+(?:faiblesse|lacune|erreur)|pas\s+de\s+(?:faiblesse|points\s+faibles)/i;
  if (frPattern.test(normalized)) return true;

  return false;
}

export const isNoWeaknessPlaceholder = isNonWeaknessStatement;

/**
 * Classifies an action plan item into Category A, B, C, or D.
 */
export function classifyActionPlanItem(
  item: string,
  context?: {
    jobDescriptionStatus?: JobDescriptionStatus;
    provenance?: ContactProvenance;
  }
): ActionPlanClassification {
  if (!item || item.trim().length === 0) {
    return { rawText: item, category: "category_d_unsafe_or_invalid", isValid: false, discardReason: "Empty item" };
  }

  const normalized = item.toLowerCase();

  // Discard "no action/modification needed" placeholder statements across languages
  const isNoActionNeeded =
    /لا\s*حاجة\s*(?:لأي|إلى)\s*تعديل|لا\s*تحتاج\s*(?:إلى\s*)?تعديل|جاهزة\s*للتقديم\s*المباشر|keine\s+(?:änderungen|anpassungen|überarbeitung)\s+(?:erforderlich|nötig)|no\s+(?:changes|modifications|action)\s+(?:needed|required)/i.test(
      normalized
    ) ||
    /سيرتك\s*الذاتية\s*مكتملة|لا\s*توجد\s*خطوات\s*إضافية/i.test(normalized);

  if (isNoActionNeeded) {
    return {
      rawText: item,
      category: "category_d_unsafe_or_invalid",
      isValid: false,
      discardReason: "No-action placeholder discarded from action plan",
    };
  }

  // Category D: Discriminatory, photo mandates, or fabricated statistics
  if (
    /foto|photo|bild|headshot|صورة|صورة\s*شخصية/i.test(normalized) &&
    /din\s*5008|pflicht|muss|erforderlich|einfügen|hinzufügen|إلزام|إلزامية|ضروري|إجبار|مطلوبة|mandat|require|must/i.test(normalized)
  ) {
    return {
      rawText: item,
      category: "category_d_unsafe_or_invalid",
      isValid: false,
      discardReason: "Bewerbungsfoto is voluntary under German AGG law and not mandated by DIN 5008",
    };
  }

  if (/familienstand|konfession|religion|kinder|staatsangehörigkeit|geburtsdatum|الحالة\s*الاجتماعية|الديانة|المذهب|الأطفال|الجنسية|تاريخ\s*الميلاد|marital\s*status|religion|nationality|birth\s*date/i.test(normalized)) {
    return {
      rawText: item,
      category: "category_d_unsafe_or_invalid",
      isValid: false,
      discardReason: "Personal demographics are voluntary and non-mandatory under German standards",
    };
  }

  if (/\b\d+%\s*(?:mehr|höhere)\s*chancen\b|\berhöht.*?\b\d+%\b|\b\d+%\s*(?:أعلى|أفضل|زيادة|فرص)\b|\b\d+%\s*(?:higher|more|increase)\b/i.test(normalized)) {
    return {
      rawText: item,
      category: "category_d_unsafe_or_invalid",
      isValid: false,
      discardReason: "Arbitrary percentage claim",
    };
  }

  // Category B: Candidate-specific absence claims
  const isPhoneClaim = /(?:telefon|phone|rufnummer|handy|هاتف|رقم\s*الهاتف|جوال)/i.test(normalized) &&
    /(?:fehlt|ergänzen|hinzufügen|angeben|مفقود|ناقص|إضافة|تضمين|missing|add|include|provide)/i.test(normalized);
  const isEmailClaim = /(?:e-?mail|بريد|إيميل)/i.test(normalized) &&
    /(?:fehlt|ergänzen|hinzufügen|angeben|مفقود|ناقص|إضافة|تضمين|missing|add|include|provide)/i.test(normalized);

  if (isPhoneClaim) {
    if (context?.provenance?.phone === "confirmed_absent") {
      return { rawText: item, category: "category_b_candidate_claim", isValid: true };
    }
    return { rawText: item, category: "category_b_candidate_claim", isValid: false, discardReason: "Phone absence not confirmed across sources" };
  }

  if (isEmailClaim) {
    if (context?.provenance?.email === "confirmed_absent") {
      return { rawText: item, category: "category_b_candidate_claim", isValid: true };
    }
    return { rawText: item, category: "category_b_candidate_claim", isValid: false, discardReason: "Email absence not confirmed across sources" };
  }

  // Category C: Job-specific claims
  const isJobSpecificClaim =
    /(?:stellenanzeige|stelle|anforderung|anforderungsprofil|job|إعلان\s*الوظيفة|الوظيفة\s*المستهدفة|متطلبات\s*الوظيفة|job\s*description|job\s*posting|requirements)/i.test(normalized) &&
    /(?:fehlt|erforderlich|anpass|ergänz|abgleich|\bpassen\b|مطابقة|تعديل|مواءمة|تضمين|align|tailor|match|adapt)/i.test(normalized);

  if (isJobSpecificClaim) {
    if (context?.jobDescriptionStatus === "valid_supplied") {
      return { rawText: item, category: "category_c_job_claim", isValid: true };
    }
    return { rawText: item, category: "category_c_job_claim", isValid: false, discardReason: "Job-specific claim without valid job description" };
  }

  // Category A: Safe general pedagogical advice across German, Arabic, and English
  const hasCandidateAssertions =
    /(?:fehlt|fehlen|ergänzen sie ihre|fügen sie ihre|nicht vorhanden|keine angabe|entfernen sie|korrigieren sie|sie haben|ihr lebenslauf enthält nicht|ينقصك|سيرتك\s*لا\s*تحتوي|لم\s*تذكر|قم\s*بإضافة\s*بياناتك|تصحيح\s*بياناتك|you\s*are\s*missing|your\s*cv\s*lacks|you\s*did\s*not\s*include|remove\s*your|correct\s*your)/i.test(
      normalized
    );

  const isGeneralPedagogy =
    /(?:tabellarisch|umgekehrt chronologisch|anti-chronologisch|pdf\/a|übersichtlich|struktur|rechtschreibung|gegenlesen|stichpunkte|layout|substantivstil|chronolog|quantif|zertifikat|sprachniveau|lückenlos|تنسيق\s*جدولي|جدولي|ترتيب\s*زمني|عكسي|تدقيق\s*لغوي|نقاط\s*مختصرة|هيكلة|أرقام\s*وقياس|مستوى\s*اللغة|صيغة\s*pdf|شهادات|دين\s*5008|tabular|reverse\s*chronological|chronological|proofread|bullet\s*points|layout|formatting|structure|metrics|quantify|cefr|din\s*5008)/i.test(
      normalized
    );

  if (!hasCandidateAssertions && isGeneralPedagogy) {
    return { rawText: item, category: "category_a_safe_general", isValid: true };
  }

  // Default: Discard unknown or ambiguous items
  return { rawText: item, category: "category_d_unsafe_or_invalid", isValid: false, discardReason: "Unverified or ambiguous recommendation" };
}

export interface StructuredCvGuarantees {
  cvIdProvided?: boolean;
  hasExperiences?: boolean;
  hasEducations?: boolean;
  hasSkills?: boolean;
}

/**
 * Filters raw AI weaknesses through deterministic verification rules.
 * Does not suppress valid recruiter findings, but discards unverified defects.
 */
export function filterVerifiedWeaknesses(
  weaknesses: string[],
  entries: EmploymentEntry[],
  provenance: ContactProvenance,
  guarantees?: StructuredCvGuarantees
): string[] {
  if (!Array.isArray(weaknesses) || weaknesses.length === 0) return [];

  const verified: string[] = [];

  for (const item of weaknesses) {
    const raw = String(item || "").trim();
    if (!raw) continue;

    // Strip "no weakness" placeholder statements across all languages
    if (isNonWeaknessStatement(raw)) {
      continue;
    }

    const lower = raw.toLowerCase();

    // 0. If CV is managed by structured DIN 5008 renderer, discard false plain-text layout artifacts
    if (guarantees?.cvIdProvided) {
      const isTabularOrDin5008FormatClaim =
        /(?:nicht\s+tabellarisch|kein\s+tabellarischer|fehlt\s+tabellarisch|tabellarischen\s+aufbau|din\s*5008.*?(?:fehlt|entspricht\s+nicht|nicht\s+eingehalten|nicht\s+erfüllt|anpassen)|not\s+tabular|lacks\s+tabular|not\s+din\s*5008|ليس\s*جدولياً|غير\s*جدولي|لا\s*يتبع\s*معيار\s*din\s*5008|تحويل.*?إلى\s*تنسيق\s*جدولي)/i.test(
          lower
        );
      if (isTabularOrDin5008FormatClaim) {
        continue;
      }

      if (guarantees.hasExperiences && /(?:berufserfahrung\s+fehlt|keine\s+berufserfahrung|missing\s+experience|لا\s*توجد\s*خبرة)/i.test(lower)) {
        continue;
      }
      if (guarantees.hasEducations && /(?:ausbildung\s+fehlt|keine\s+ausbildung|missing\s+education|لا\s*يوجد\s*تعليم)/i.test(lower)) {
        continue;
      }
      if (guarantees.hasSkills && /(?:kenntnisse\s+fehlen|fähigkeiten\s+fehlen|missing\s+skills|لا\s*توجد\s*مهارات)/i.test(lower)) {
        continue;
      }
    }

    // 1. Date finding check
    const isDateFinding = /datum|chronolog|reihenfolge|zeitraum|startdatum|enddatum|jahr/i.test(lower);
    if (isDateFinding) {
      if (hasVerifiedDateInversion(raw, entries)) {
        verified.push(raw);
      }
      // If date inversion cannot be verified against entries, discard to prevent false defects
      continue;
    }

    // 2. Phone absence check
    const isPhoneFinding = /telefon|phone|rufnummer|handy/i.test(lower) && /fehlt|nicht angegeben|hinzufügen/i.test(lower);
    if (isPhoneFinding) {
      if (provenance.phone === "confirmed_absent") {
        verified.push(raw);
      }
      continue;
    }

    // 3. Email absence check
    const isEmailFinding = /e-?mail/i.test(lower) && /fehlt|nicht angegeben|hinzufügen/i.test(lower);
    if (isEmailFinding) {
      if (provenance.email === "confirmed_absent") {
        verified.push(raw);
      }
      continue;
    }

    // 4. Photo/demographics claims are strictly discarded
    if (/foto|photo|bild|familienstand|konfession|religion|kinder|zukunft/i.test(lower)) {
      continue;
    }

    // 5. Retain genuine recruiter observations that do not assert ungrounded defects
    verified.push(raw);
  }

  return verified;
}

/**
 * Strict Top-Level Schema Validator.
 * Validates all required AI fields, types, and ranges.
 * Scores must be finite integers from 0 to 100.
 * Rejects missing, float, string, or out-of-range scores (throws UNRECOVERABLE_VALIDATION_FAILURE).
 */
export function validateAtsTopLevelSchema(
  parsed: unknown,
  hasValidJd: boolean
): ValidatedAtsOutput {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("UNRECOVERABLE_VALIDATION_FAILURE: AI output is not a JSON object");
  }

  const obj = parsed as Record<string, unknown>;

  // 1. overallScore
  const overall = obj.overallScore;
  if (typeof overall !== "number" || !Number.isFinite(overall) || !Number.isInteger(overall) || overall < 0 || overall > 100) {
    throw new Error(`UNRECOVERABLE_VALIDATION_FAILURE: overallScore must be a finite integer between 0 and 100. Received: ${JSON.stringify(overall)}`);
  }

  // 2. din5008Score
  const din = obj.din5008Score;
  if (typeof din !== "number" || !Number.isFinite(din) || !Number.isInteger(din) || din < 0 || din > 100) {
    throw new Error(`UNRECOVERABLE_VALIDATION_FAILURE: din5008Score must be a finite integer between 0 and 100. Received: ${JSON.stringify(din)}`);
  }

  // 3. keywordMatchScore
  let keywordMatchScore: number | null = null;
  if (!hasValidJd) {
    keywordMatchScore = null;
  } else {
    const kw = obj.keywordMatchScore;
    if (typeof kw !== "number" || !Number.isFinite(kw) || !Number.isInteger(kw) || kw < 0 || kw > 100) {
      throw new Error(`UNRECOVERABLE_VALIDATION_FAILURE: keywordMatchScore must be a finite integer between 0 and 100 when a valid job description is supplied. Received: ${JSON.stringify(kw)}`);
    }
    keywordMatchScore = kw;
  }

  // 4. summary
  const summary = obj.summary;
  if (typeof summary !== "string" || summary.trim().length === 0) {
    throw new Error(`UNRECOVERABLE_VALIDATION_FAILURE: summary must be a non-empty string. Received: ${JSON.stringify(summary)}`);
  }

  // Helper for string arrays
  const validateStringArray = (fieldName: string, value: unknown): string[] => {
    if (!Array.isArray(value)) {
      throw new Error(`UNRECOVERABLE_VALIDATION_FAILURE: ${fieldName} must be an array. Received: ${JSON.stringify(value)}`);
    }
    for (let i = 0; i < value.length; i++) {
      if (typeof value[i] !== "string") {
        throw new Error(`UNRECOVERABLE_VALIDATION_FAILURE: ${fieldName}[${i}] must be a string. Received: ${JSON.stringify(value[i])}`);
      }
    }
    return value as string[];
  };

  // 5. strengths
  const strengths = validateStringArray("strengths", obj.strengths);

  // 6. weaknesses
  const weaknesses = validateStringArray("weaknesses", obj.weaknesses);

  // 7. missingKeywords
  let missingKeywords: string[] = [];
  if (!hasValidJd) {
    missingKeywords = [];
  } else {
    missingKeywords = validateStringArray("missingKeywords", obj.missingKeywords);
  }

  // 8. actionPlan
  const actionPlan = validateStringArray("actionPlan", obj.actionPlan);

  return {
    overallScore: overall,
    din5008Score: din,
    keywordMatchScore,
    summary: summary.trim(),
    strengths,
    weaknesses,
    missingKeywords,
    actionPlan,
  };
}
