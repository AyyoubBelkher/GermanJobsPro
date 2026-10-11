export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { deductCreditInTx } from "@/lib/monetization";

// European, German & English date parser conforming to DIN standards and pure UTC
const MONTH_MAP: Record<string, number> = {
  jan: 0, januar: 0, january: 0,
  feb: 1, februar: 1, february: 1,
  mar: 2, marz: 2, maerz: 2, märz: 2, march: 2,
  apr: 3, april: 3,
  may: 4, mai: 4,
  jun: 5, juni: 5, june: 5,
  jul: 6, juli: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, okt: 9, oktober: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, dez: 11, dezember: 11, december: 11,
};

function parseEuropeanDate(val?: string | null): Date | null {
  if (!val || typeof val !== "string") return null;
  const s = val.trim();
  if (!s || /^(heute|present|current|jetzt|laufend)$/i.test(s)) return null;

  // 1. ISO standard: YYYY-MM-DD or YYYY-MM
  const isoMatch = s.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = isoMatch[3] ? parseInt(isoMatch[3], 10) : 1;
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      return new Date(Date.UTC(year, month, day));
    }
  }

  // 2. Numeric DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      return new Date(Date.UTC(year, month, day));
    }
  }

  // 3. Numeric MM/YYYY or MM.YYYY or MM-YYYY
  const myMatch = s.match(/^(\d{1,2})[./\-](\d{4})$/);
  if (myMatch) {
    const month = parseInt(myMatch[1], 10) - 1;
    const year = parseInt(myMatch[2], 10);
    if (month >= 0 && month <= 11) {
      return new Date(Date.UTC(year, month, 1));
    }
  }

  // 4. Text month with year: "Jan 2020", "Januar 2020", "März 2022", "15. Mai 2021", "January 15, 2020"
  const norm = s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue");

  // Format: optional day, month text, optional comma/dot, 4-digit year
  const textMonthMatch = norm.match(/^(?:(\d{1,2})[.\s/-]+)?([a-z]+)[.,\s/-]+(\d{4})$/);
  if (textMonthMatch) {
    const day = textMonthMatch[1] ? parseInt(textMonthMatch[1], 10) : 1;
    const monthStr = textMonthMatch[2].replace(/\.$/, "");
    const year = parseInt(textMonthMatch[3], 10);
    if (monthStr in MONTH_MAP) {
      const month = MONTH_MAP[monthStr];
      return new Date(Date.UTC(year, month, day));
    }
  }

  // Format: Month Day, Year (e.g. "January 15, 2020")
  const mdyTextMatch = norm.match(/^([a-z]+)[.,\s/-]+(\d{1,2})[.,\s/-]+(\d{4})$/);
  if (mdyTextMatch) {
    const monthStr = mdyTextMatch[1];
    const day = parseInt(mdyTextMatch[2], 10);
    const year = parseInt(mdyTextMatch[3], 10);
    if (monthStr in MONTH_MAP) {
      const month = MONTH_MAP[monthStr];
      return new Date(Date.UTC(year, month, day));
    }
  }

  // 5. Standalone 4-digit year: "2020"
  const yMatch = s.match(/^(\d{4})$/);
  if (yMatch) {
    const year = parseInt(yMatch[1], 10);
    return new Date(Date.UTC(year, 0, 1));
  }

  return null;
}

function parseDateSafe(val?: string | null, fallbackYear = 2020): Date {
  const d = parseEuropeanDate(val);
  if (d !== null) return d;
  if (val && typeof val === "string") {
    const yrMatch = val.match(/\b(19\d{2}|20\d{2})\b/);
    if (yrMatch) {
      return new Date(Date.UTC(parseInt(yrMatch[1], 10), 0, 1));
    }
  }
  // Deterministic fallback: never defaults to current timestamp
  return new Date(Date.UTC(fallbackYear, 0, 1));
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
                exp.isCurrent || (exp.endDate && /heute|present|current/i.test(exp.endDate))
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
                startDate: parseDateSafe(exp.startDate),
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
                startDate: parseDateSafe(edu.startDate),
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
