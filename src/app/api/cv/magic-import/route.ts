import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserSession } from "@/lib/user-session";
import { extractText } from "unpdf";
import { magicImportCvAI } from "@/lib/gemini";
import { consumeAiCredit, refundAiCredit, deductAiCreditAtomic } from "@/lib/monetization";
import { logAiUsage } from "@/lib/ai-telemetry";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// European, German, French, English & Arabic date parser conforming to DIN standards and pure UTC
function normalizeDateStr(val: string): string {
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

const MONTH_MAP_LATIN: Record<string, number> = {
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

const MONTH_MAP_AR: Record<string, number> = {
  "يناير": 0, "فبراير": 1, "مارس": 2, "ابريل": 3, "مايو": 4, "ماي": 4,
  "يونيو": 5, "جوان": 5, "يوليو": 6, "جويليه": 6, "جويلية": 6, "يوليوز": 6,
  "اغسطس": 7, "اوت": 7, "غشت": 7, "سبتمبر": 8, "شتنبر": 8, "اكتوبر": 9,
  "نوفمبر": 10, "نونبر": 10, "ديسمبر": 11, "دجنبر": 11,
  "كانون الثاني": 0, "كانون 2": 0, "شباط": 1, "اذار": 2, "نيسان": 3,
  "ايار": 4, "حزيران": 5, "تموز": 6, "اب": 7, "ايلول": 8,
  "تشرين الاول": 9, "تشرين 1": 9, "تشرين الثاني": 10, "تشرين 2": 10,
  "كانون الاول": 11, "كانون 1": 11,
};

const SORTED_LATIN_MONTHS = Object.keys(MONTH_MAP_LATIN).sort((a, b) => b.length - a.length);
const SORTED_ARABIC_MONTHS = Object.keys(MONTH_MAP_AR).sort((a, b) => b.length - a.length);

function normalizeLatin(s: string): string {
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

function normalizeArabic(s: string): string {
  return s
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ـ/g, "");
}

function parseEuropeanDate(val?: string | null, isSubCheck = false): Date | null {
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

  // 5. Text month with year (Latin: EN/DE/FR)
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

function parseDateSafe(
  val?: string | null,
  fallbackAnchor?: string | null | number,
  fallbackYear?: number
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
  if (anchorStr && typeof anchorStr === "string") {
    const anchorDate = parseEuropeanDate(anchorStr);
    if (anchorDate !== null) {
      // Use endDate at month/day 01 as the anchor date
      return new Date(Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth(), 1));
    }

    // Check if anchorStr has any 4-digit year (1970-2030)
    const normalizedAnchor = normalizeDateStr(anchorStr);
    const anchorYrMatch = normalizedAnchor.match(/\b(19[7-9]\d|20[0-2]\d|2030)\b/);
    if (anchorYrMatch) {
      return new Date(Date.UTC(parseInt(anchorYrMatch[1], 10), 0, 1));
    }
  }

  // 4. Fallback: only if both are completely unparseable and no 1970-2030 year exists anywhere in the string
  const resolvedFallbackYear = customFallbackYear ?? new Date().getUTCFullYear();
  console.warn(
    `[CV Magic Import Warning] Unparseable date encountered. Missing/unparseable startDate="${val}" and endDate="${anchorStr}". Defaulting to ${resolvedFallbackYear}-01-01 UTC to prevent gap fabrication.`
  );
  return new Date(Date.UTC(resolvedFallbackYear, 0, 1));
}

function parseNullableDate(val?: string | null): Date | null {
  return parseEuropeanDate(val);
}

/**
 * POST /api/cv/magic-import
 * 1-Click PDF to DIN 5008 CV Auto-Fix:
 * Ingests an existing CV (PDF file or raw text), translates and optimizes it into German DIN 5008 standards,
 * and atomically persists the full CV structure into SQLite database.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_session")?.value;
    const authResult = await verifyUserSession(token);

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let rawCvText = "";
    let targetJobTitle: string | undefined = undefined;
    let jobDescription: string | undefined = undefined;
    let priorAnalysis:
      | {
          overallScore?: number;
          weaknesses?: string[];
          missingKeywords?: string[];
          actionPlan?: string[];
        }
      | undefined = undefined;
    let locale = "ar";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData().catch(() => null);
      if (!formData) {
        return NextResponse.json(
          { success: false, error: "Invalid form data" },
          { status: 400 }
        );
      }

      const file = formData.get("file");
      const textParam = formData.get("cvText");
      const titleParam = formData.get("targetJobTitle");
      const jobDescParam = formData.get("jobDescription");
      const priorAnalysisParam = formData.get("priorAnalysis");
      const localeParam = formData.get("locale");

      if (typeof titleParam === "string" && titleParam.trim()) {
        targetJobTitle = titleParam.trim();
      }
      if (typeof jobDescParam === "string" && jobDescParam.trim()) {
        jobDescription = jobDescParam.trim();
      }
      if (typeof priorAnalysisParam === "string" && priorAnalysisParam.trim()) {
        try {
          priorAnalysis = JSON.parse(priorAnalysisParam);
        } catch {}
      }
      if (typeof localeParam === "string" && localeParam.trim()) {
        locale = localeParam.trim();
      }

      if (file && file instanceof Blob) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            { success: false, error: "File size exceeds 10MB limit." },
            { status: 400 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Validate PDF magic bytes: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
        const isPdfMagic =
          uint8Array.length >= 5 &&
          uint8Array[0] === 0x25 && // %
          uint8Array[1] === 0x50 && // P
          uint8Array[2] === 0x44 && // D
          uint8Array[3] === 0x46 && // F
          uint8Array[4] === 0x2d; // -

        if (!isPdfMagic) {
          return NextResponse.json(
            { success: false, error: "Invalid PDF signature. The uploaded file is not a genuine PDF document." },
            { status: 400 }
          );
        }

        try {
          const { text } = await extractText(uint8Array);
          rawCvText = Array.isArray(text) ? text.join("\n") : String(text || "");
        } catch (err) {
          console.error("[unpdf Magic Import Extract Error]:", err);
          return NextResponse.json(
            { success: false, error: "Failed to parse PDF document. It may be encrypted or corrupted." },
            { status: 422 }
          );
        }
      } else if (typeof textParam === "string" && textParam.trim()) {
        rawCvText = textParam.trim();
      }
    } else {
      // JSON body fallback
      const body = await request.json().catch(() => ({}));
      rawCvText = typeof body.cvText === "string" ? body.cvText.trim() : "";
      targetJobTitle = typeof body.targetJobTitle === "string" ? body.targetJobTitle.trim() : undefined;
      jobDescription = typeof body.jobDescription === "string" ? body.jobDescription.trim() : undefined;
      priorAnalysis = body.priorAnalysis && typeof body.priorAnalysis === "object" ? body.priorAnalysis : undefined;
      locale = typeof body.locale === "string" ? body.locale.trim() : "ar";
    }

    if (!rawCvText || rawCvText.trim().length < 30) {
      return NextResponse.json(
        {
          success: false,
          error: "The provided CV contains insufficient text (fewer than 30 characters). Please upload a text-based PDF or paste your CV text.",
        },
        { status: 400 }
      );
    }

    // 1. Consume AI Credit (Atomic reservation within transaction)
    const creditResult = await deductAiCreditAtomic({
      userId: authResult.user.id,
      operation: "CV_MAGIC_IMPORT",
      requiredCredits: 1,
    });
    if (!creditResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "INSUFFICIENT_CREDITS",
          message: creditResult.error || "You have run out of AI credits. Please upgrade to Pro or redeem a promo code.",
          outOfCredits: true,
        },
        { status: 402 }
      );
    }

    // 2. Execute AI Magic Import & DIN 5008 Optimization
    let parsedCv;
    const aiStartTime = performance.now();
    const cleanShortTitle =
      typeof targetJobTitle === "string" && targetJobTitle.trim().length > 0 && targetJobTitle.trim().length <= 60
        ? targetJobTitle.trim()
        : undefined;
    try {
      parsedCv = await magicImportCvAI({
        rawCvText,
        targetJobTitle: cleanShortTitle,
        jobDescription,
        priorAnalysis,
        locale,
      });
    } catch (aiErr) {
      const latencyMs = performance.now() - aiStartTime;
      logAiUsage({
        userId: authResult.user.id,
        operation: "CV_MAGIC_IMPORT",
        latencyMs,
        success: false,
        errorMessage: aiErr instanceof Error ? aiErr.message : String(aiErr),
      }).catch(() => {});

      await refundAiCredit(authResult.user.id);
      console.error("[Magic Import AI Generation Error]:", aiErr);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to optimize CV into DIN 5008 format. Your AI credit has been refunded. Please try again.",
        },
        { status: 500 }
      );
    }

    // 3. Atomically persist to Database in Prisma
    try {
      const jobTitle =
        cleanShortTitle ||
        parsedCv.personalInfo?.targetJobTitle ||
        (typeof targetJobTitle === "string" ? targetJobTitle.trim().slice(0, 60) : null) ||
        "Fachkraft";
      const cvTitle = parsedCv.title || `Lebenslauf - ${jobTitle}`;

      const newCv = await prisma.cv.create({
        data: {
          userId: authResult.user.id,
          title: cvTitle,
          language: "de",
          isDraft: false,
          personalInfo: {
            create: {
              fullName: parsedCv.personalInfo?.fullName || authResult.user.name || "Bewerber",
              email: parsedCv.personalInfo?.email || authResult.user.email,
              phone: parsedCv.personalInfo?.phone || null,
              address: parsedCv.personalInfo?.address || null,
              birthDate: parseNullableDate(parsedCv.personalInfo?.birthDate),
              birthPlace: parsedCv.personalInfo?.birthPlace || null,
              nationality: parsedCv.personalInfo?.nationality || null,
              targetJobTitle: jobTitle,
              linkedinUrl: parsedCv.personalInfo?.linkedinUrl || null,
              xingUrl: parsedCv.personalInfo?.xingUrl || null,
              summary: parsedCv.personalInfo?.summary || null,
            },
          },
          experiences: {
            create: (parsedCv.experiences || []).map((exp, idx) => ({
              company: exp.company || "Unternehmen",
              position: exp.position || "Position",
              city: exp.city || null,
              country: exp.country || null,
              startDate: parseDateSafe(exp.startDate, exp.endDate),
              endDate: exp.isCurrent ? null : parseNullableDate(exp.endDate),
              isCurrent: Boolean(exp.isCurrent),
              description: exp.description || null,
              order: idx,
            })),
          },
          educations: {
            create: (parsedCv.educations || []).map((edu, idx) => ({
              institution: edu.institution || "Ausbildungsstätte",
              degree: edu.degree || "Abschluss",
              fieldOfStudy: edu.fieldOfStudy || null,
              city: edu.city || null,
              country: edu.country || null,
              startDate: parseDateSafe(edu.startDate, edu.endDate),
              endDate: edu.isCurrent ? null : parseNullableDate(edu.endDate),
              isCurrent: Boolean(edu.isCurrent),
              grade: edu.grade || null,
              description: edu.description || null,
              order: idx,
            })),
          },
          skills: {
            create: (parsedCv.skills || []).map((s, idx) => ({
              name: s.name || "Fähigkeit",
              category: s.category || "Fachkenntnisse",
              level: s.level || "Fortgeschritten",
              order: idx,
            })),
          },
          languages: {
            create: (parsedCv.languages || []).map((l, idx) => ({
              language: l.language || "Deutsch",
              proficiency: l.proficiency || "Gute Kenntnisse (B1)",
              order: idx,
            })),
          },
          certifications: {
            create: (parsedCv.certifications || []).map((c, idx) => ({
              name: c.name || "Zertifikat",
              issuer: c.issuer || "Zertifizierungsstelle",
              issueDate: parseNullableDate(c.issueDate),
              order: idx,
            })),
          },
          projects: {
            create: (parsedCv.projects || []).map((p, idx) => ({
              title: p.title || "Projekt",
              role: p.role || null,
              url: p.url || null,
              description: p.description || null,
              order: idx,
            })),
          },
        },
      });

      return NextResponse.json(
        {
          success: true,
          cvId: newCv.id,
          message: "CV successfully imported and DIN 5008 optimized",
          remainingCredits: creditResult.remainingCredits,
          isPro: creditResult.isPro,
        },
        { status: 201 }
      );
    } catch (dbErr) {
      await refundAiCredit(authResult.user.id);
      console.error("[Magic Import DB Error]:", dbErr);
      return NextResponse.json(
        {
          success: false,
          error: "Error saving generated CV to database. Your credit has been refunded.",
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("[POST /api/cv/magic-import Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
