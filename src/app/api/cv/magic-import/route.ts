import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserSession } from "@/lib/user-session";
import { extractText } from "unpdf";
import { magicImportCvAI } from "@/lib/gemini";
import { consumeAiCredit, refundAiCredit, deductAiCreditAtomic } from "@/lib/monetization";
import { logAiUsage } from "@/lib/ai-telemetry";
import { checkRateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";
import {
  parseDateSafe,
  parseNullableDate,
} from "@/lib/cv-date-utils";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/cv/magic-import
 * 1-Click PDF to DIN 5008 CV Auto-Fix:
 * Ingests an existing CV (PDF file or raw text), translates and optimizes it into German DIN 5008 standards,
 * and atomically persists the full CV structure into SQLite database.
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, AUTH_RATE_LIMITS.AI_API);
  if (rateLimitResponse) return rateLimitResponse;

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
              startDate: parseDateSafe(
                exp.startDate,
                exp.endDate,
                undefined,
                rawCvText,
                [exp.company, exp.position, exp.description]
              ),
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
              startDate: parseDateSafe(
                edu.startDate,
                edu.endDate,
                undefined,
                rawCvText,
                [edu.degree, edu.institution, edu.fieldOfStudy, edu.description]
              ),
              endDate: edu.isCurrent ? null : parseNullableDate(edu.endDate),
              isCurrent: Boolean(edu.isCurrent),
              grade: edu.grade || null,
              description: edu.description || null,
              order: idx,
            })),
          },
          skills: {
            create: (parsedCv.skills || []).map((s, idx) => {
              const name = s.name || "Fähigkeit";
              const isLicense = /führerschein|fahrerlaubnis|driving\s*licen|permis\s*de\s*conduire|رخصة/i.test(name);
              return {
                name,
                category: s.category || (isLicense ? "Mobilität" : "Fachkenntnisse"),
                level: isLicense ? null : (s.level && s.level.trim() ? s.level.trim() : null),
                order: idx,
              };
            }),
          },
          languages: {
            create: (parsedCv.languages || []).map((l, idx) => ({
              language: l.language || "Deutsch",
              proficiency: l.proficiency && l.proficiency.trim() ? l.proficiency.trim() : "Kenntnisse",
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
