export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { deductCreditInTx } from "@/lib/monetization";
import {
  parseDateSafe,
  parseNullableDate,
} from "@/lib/cv-date-utils";

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
      const skillsData: Array<{ name: string; category: string; level: string | null; order: number }> = [];
      validatedCvData.skills.forEach((s, idx) => {
        if (typeof s === "string") {
          const isLicense = /führerschein|fahrerlaubnis|driving\s*licen|permis\s*de\s*conduire|رخصة/i.test(s);
          skillsData.push({
            name: s,
            category: isLicense ? "Mobilität" : "Fachkenntnisse",
            level: null,
            order: idx,
          });
        } else {
          const isLicense = /führerschein|fahrerlaubnis|driving\s*licen|permis\s*de\s*conduire|رخصة/i.test(s.name);
          skillsData.push({
            name: s.name,
            category: s.category || (isLicense ? "Mobilität" : "Fachkenntnisse"),
            level: isLicense ? null : (s.level && s.level.trim() ? s.level.trim() : null),
            order: idx,
          });
        }
      });

      if (validatedCvData.driverLicense && validatedCvData.driverLicense.trim()) {
        skillsData.push({
          name: `Führerschein (${validatedCvData.driverLicense.trim()})`,
          category: "Mobilität",
          level: null,
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
              const startDate = parseDateSafe(
                exp.startDate,
                exp.endDate,
                undefined,
                undefined,
                [exp.company, exp.position, exp.organization, exp.title, desc]
              );
              return {
                company: exp.company || exp.organization || "Unternehmen",
                position: exp.position || exp.title || "Position",
                city: exp.city || exp.location || null,
                country: exp.country || "Deutschland",
                startDate,
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
              const startDate = parseDateSafe(
                edu.startDate,
                edu.endDate,
                undefined,
                undefined,
                [edu.degree, edu.institution, edu.fieldOfStudy, edu.description]
              );
              return {
                institution: edu.institution || "Ausbildungsstätte",
                degree: edu.degree || "Abschluss",
                fieldOfStudy: edu.fieldOfStudy || null,
                city: edu.city || edu.location || null,
                country: edu.country || null,
                startDate,
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
              proficiency: (l.proficiency && l.proficiency.trim()) || (l.level && l.level.trim()) || "Kenntnisse",
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
