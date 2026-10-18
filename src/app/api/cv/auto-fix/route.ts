export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { deductCreditInTx } from "@/lib/monetization";

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
    `[CV Auto-Fix Warning] Unparseable date encountered. Missing/unparseable startDate="${val}" and endDate="${anchorStr}". Defaulting to ${resolvedFallbackYear}-01-01 UTC to prevent gap fabrication.`
  );
  return new Date(Date.UTC(resolvedFallbackYear, 0, 1));
}

function parseNullableDate(val?: string | null): Date | null {
  return parseEuropeanDate(val);
}

function isValidUrl(val?: string | null): string | null {
  if (!val || typeof val !== "string") return null;
  const s = val.trim();
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" ? s : null;
  } catch {
    return null;
  }
}

function extractLocale(req: Request, bodyLocale?: string): string {
  if (bodyLocale && ["ar", "de", "en", "fr"].includes(bodyLocale)) {
    return bodyLocale;
  }
  try {
    const url = new URL(req.url);
    const qLocale = url.searchParams.get("locale");
    if (qLocale && ["ar", "de", "en", "fr"].includes(qLocale)) {
      return qLocale;
    }
    const referer = req.headers.get("referer");
    if (referer) {
      const match = referer.match(/\/(ar|de|en|fr)(\/|$)/);
      if (match) return match[1];
    }
  } catch {}
  return "de";
}

const remediatedCvSchema = z.object({
  locale: z.string().optional(),
  personalInfo: z.object({
    fullName: z.string().min(1),
    title: z.string().optional().nullable(),
    email: z.string().email().or(z.string()),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    dateOfBirth: z.string().optional().nullable(),
    placeOfBirth: z.string().optional().nullable(),
    summary: z.string().optional().nullable(),
    targetJobTitle: z.string().optional().nullable(),
    nationality: z.string().optional().nullable(),
    photoUrl: z.string().optional().nullable(),
    linkedinUrl: z.string().optional().nullable(),
    xingUrl: z.string().optional().nullable(),
  }),
  experiences: z
    .array(
      z.object({
        title: z.string().optional().nullable(),
        position: z.string().optional().nullable(),
        organization: z.string().optional().nullable(),
        company: z.string().optional().nullable(),
        location: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        country: z.string().optional().nullable(),
        startDate: z.string().optional().nullable(),
        endDate: z.string().optional().nullable(),
        isCurrent: z.boolean().optional(),
        bullets: z.array(z.string()).optional(),
        description: z.string().optional().nullable(),
      })
    )
    .optional()
    .default([]),
  education: z
    .array(
      z.object({
        degree: z.string().optional().nullable(),
        institution: z.string().optional().nullable(),
        fieldOfStudy: z.string().optional().nullable(),
        location: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        country: z.string().optional().nullable(),
        startDate: z.string().optional().nullable(),
        endDate: z.string().optional().nullable(),
        isCurrent: z.boolean().optional(),
        grade: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
      })
    )
    .optional()
    .default([]),
  coursesAndCertifications: z
    .array(
      z.object({
        title: z.string().optional().nullable(),
        name: z.string().optional().nullable(),
        provider: z.string().optional().nullable(),
        issuer: z.string().optional().nullable(),
        startDate: z.string().optional().nullable(),
        endDate: z.string().optional().nullable(),
        issueDate: z.string().optional().nullable(),
        credentialUrl: z.string().optional().nullable(),
        url: z.string().optional().nullable(),
        bullets: z.array(z.string()).optional(),
        description: z.string().optional().nullable(),
      })
    )
    .optional()
    .default([]),
  skills: z
    .array(
      z.union([
        z.string(),
        z.object({
          name: z.string(),
          category: z.string().optional().nullable(),
          level: z.string().optional().nullable(),
        }),
      ])
    )
    .optional()
    .default([]),
  languages: z
    .array(
      z.object({
        language: z.string(),
        level: z.string().optional().nullable(),
        proficiency: z.string().optional().nullable(),
      })
    )
    .optional()
    .default([]),
  hobbies: z.array(z.string()).optional().default([]),
  driverLicense: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: "غير مصرح بالوصول (Unauthorized)" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const validationResult = remediatedCvSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "بيانات السيرة الذاتية غير صالحة",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const validatedCvData = validationResult.data;
    const targetLocale = extractLocale(req, validatedCvData.locale);
    const userId = authResult.user.id;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct AI credit / verify limits atomically
      const creditResult = await deductCreditInTx(tx, {
        userId,
        operation: "CV_AUTO_FIX",
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
        requiredCredits: 1,
      });

      if (!creditResult.success) {
        return {
          insufficientCredits: true,
          error: creditResult.error || "INSUFFICIENT_CREDITS",
        };
      }

      // 2. Prepare Skills list (including optional driver license)
      const skillsData: Array<{ name: string; category: string; level: string; order: number }> = [];
      validatedCvData.skills.forEach((s, idx) => {
        if (typeof s === "string") {
          skillsData.push({
            name: s,
            category: "Fachkenntnisse",
            level: "Fortgeschritten",
            order: idx,
          });
        } else {
          skillsData.push({
            name: s.name,
            category: s.category || "Fachkenntnisse",
            level: s.level || "Fortgeschritten",
            order: idx,
          });
        }
      });

      if (validatedCvData.driverLicense && validatedCvData.driverLicense.trim()) {
        skillsData.push({
          name: `Führerschein (${validatedCvData.driverLicense.trim()})`,
          category: "Mobilität",
          level: "Vorhanden",
          order: skillsData.length,
        });
      }

      // 3. Create Full CV with Relational Sub-Tables
      const jobTitle =
        validatedCvData.personalInfo.title ||
        validatedCvData.personalInfo.targetJobTitle ||
        "Fachkraft";

      const newCv = await tx.cv.create({
        data: {
          userId,
          title: `${validatedCvData.personalInfo.fullName} (DIN 5008)`,
          language: "de",
          isDraft: false,
          personalInfo: {
            create: {
              fullName: validatedCvData.personalInfo.fullName,
              email: validatedCvData.personalInfo.email,
              phone: validatedCvData.personalInfo.phone || null,
              address: validatedCvData.personalInfo.address || null,
              birthDate: parseNullableDate(validatedCvData.personalInfo.dateOfBirth),
              birthPlace: validatedCvData.personalInfo.placeOfBirth || null,
              nationality: validatedCvData.personalInfo.nationality || null,
              targetJobTitle: jobTitle,
              linkedinUrl: validatedCvData.personalInfo.linkedinUrl || null,
              xingUrl: validatedCvData.personalInfo.xingUrl || null,
              summary: validatedCvData.personalInfo.summary || null,
              photoUrl: validatedCvData.personalInfo.photoUrl || null,
            },
          },
          experiences: {
            create: validatedCvData.experiences.map((exp, idx) => {
              const isCurrent = Boolean(
                exp.isCurrent ||
                  (exp.endDate &&
                    /heute|present|current|jetzt|laufend|actuel|en cours|حالي|حاليا|الآن|الان/i.test(
                      exp.endDate
                    ))
              );
              let desc = exp.description || null;
              if (exp.bullets && exp.bullets.length > 0) {
                desc = exp.bullets.map((b) => `• ${b}`).join("\n");
              }
              return {
                company: exp.company || exp.organization || "Unternehmen",
                position: exp.position || exp.title || "Position",
                city: exp.city || exp.location || null,
                country: exp.country || "Deutschland",
                startDate: parseDateSafe(exp.startDate, exp.endDate),
                endDate: isCurrent ? null : parseNullableDate(exp.endDate),
                isCurrent,
                description: desc,
                order: idx,
              };
            }),
          },
          educations: {
            create: validatedCvData.education.map((edu, idx) => {
              const isCurrent = Boolean(edu.isCurrent);
              return {
                institution: edu.institution || "Ausbildungsstätte",
                degree: edu.degree || "Abschluss",
                fieldOfStudy: edu.fieldOfStudy || null,
                city: edu.city || edu.location || null,
                country: edu.country || null,
                startDate: parseDateSafe(edu.startDate, edu.endDate),
                endDate: isCurrent ? null : parseNullableDate(edu.endDate),
                isCurrent,
                grade: edu.grade || null,
                description: edu.description || null,
                order: idx,
              };
            }),
          },
          skills: {
            create: skillsData,
          },
          languages: {
            create: validatedCvData.languages.map((l, idx) => ({
              language: l.language,
              proficiency: l.proficiency || l.level || "Gute Kenntnisse",
              order: idx,
            })),
          },
          certifications: {
            create: validatedCvData.coursesAndCertifications.map((c, idx) => {
              const rawName = c.name || c.title || "Zertifikat";
              let desc = c.description || null;
              if (c.bullets && c.bullets.length > 0) {
                desc = c.bullets.join("\n");
              }

              // Decouple description from credentialUrl: only valid HTTP/HTTPS URLs are accepted
              const credentialUrl =
                isValidUrl(c.credentialUrl) ||
                isValidUrl(c.url) ||
                (desc && isValidUrl(desc) ? desc : null);

              // If a non-URL description was provided, append it cleanly to the name so no candidate data is lost
              const finalName =
                desc && !isValidUrl(desc) && !rawName.includes(desc)
                  ? `${rawName} (${desc.replace(/\n+/g, ", ")})`.slice(0, 190)
                  : rawName;

              return {
                name: finalName,
                issuer: c.issuer || c.provider || "Weiterbildung",
                issueDate: parseNullableDate(c.issueDate || c.endDate || c.startDate),
                credentialUrl,
                order: idx,
              };
            }),
          },
        },
        include: {
          personalInfo: true,
          experiences: { orderBy: { order: "asc" } },
          educations: { orderBy: { order: "asc" } },
          skills: { orderBy: { order: "asc" } },
          languages: { orderBy: { order: "asc" } },
          certifications: { orderBy: { order: "asc" } },
          projects: { orderBy: { order: "asc" } },
        },
      });

      return {
        insufficientCredits: false,
        newCv,
        remainingCredits: creditResult.remainingCredits,
      };
    });

    if (result.insufficientCredits) {
      return NextResponse.json(
        {
          success: false,
          error: "INSUFFICIENT_CREDITS",
          message: "نفد رصيد الذكاء الاصطناعي الخاص بك. يرجى شحن الرصيد أو الترقية إلى Pro.",
        },
        { status: 402 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        cvId: result.newCv!.id,
        redirectUrl: `/${targetLocale}/dashboard/cv/${result.newCv!.id}`,
        cv: result.newCv,
        remainingCredits: result.remainingCredits,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[AUTO_FIX_CV_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء حفظ السيرة الذاتية المصححة" },
      { status: 500 }
    );
  }
}
