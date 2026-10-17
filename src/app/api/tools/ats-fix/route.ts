import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GoogleGenAI } from "@google/genai";
import { extractText } from "unpdf";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyUserSession } from "@/lib/user-session";
import { deductAiCreditAtomic, refundAiCredit } from "@/lib/monetization";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const FALLBACK_MODELS = [
  process.env.GEMINI_MODEL || "gemini-2.5-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];

interface PriorAtsReport {
  score?: number;
  missingKeywords?: string[];
  improvements?: string[];
  rewriteSuggestions?: string[];
  germanTips?: string[];
}

/**
 * Extracts plain text from an uploaded PDF or TXT file.
 */
async function extractCvText(file: Blob, fileName: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const isPdf =
    fileName.toLowerCase().endsWith(".pdf") ||
    file.type === "application/pdf" ||
    file.type === "application/x-pdf";

  if (isPdf) {
    // Validate PDF magic bytes: %PDF-
    if (
      uint8Array.length < 5 ||
      uint8Array[0] !== 0x25 ||
      uint8Array[1] !== 0x50 ||
      uint8Array[2] !== 0x44 ||
      uint8Array[3] !== 0x46 ||
      uint8Array[4] !== 0x2d
    ) {
      throw new Error("Invalid PDF signature. Uploaded file is not a genuine PDF document.");
    }
    const { text } = await extractText(uint8Array);
    return Array.isArray(text) ? text.join("\n") : String(text || "");
  }

  // Treat as plain text (.txt)
  return new TextDecoder("utf-8").decode(uint8Array);
}

/**
 * Generates structured ATS auto-fix using Gemini with model fallback.
 */
async function generateAtsFixWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const models = Array.from(new Set(FALLBACK_MODELS));
  let lastError: unknown = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text?.trim();
      if (responseText) {
        return responseText;
      }
    } catch (err: unknown) {
      console.warn(`[ats-fix] Model ${model} failed, trying fallback:`, err instanceof Error ? err.message : err);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models failed to generate ATS fix.");
}

/**
 * POST /api/tools/ats-fix
 * Credible & Accurate ATS Auto-Fix & German DIN 5008 CV Generator.
 */
export async function POST(request: NextRequest) {
  // Rate limiting: 5 requests per minute per IP
  const rateLimitResponse = checkRateLimit(request, {
    action: "ats-fix",
    limit: 5,
    windowMs: 60 * 1000,
    message: "تم تجاوز عدد المحاولات المسموح بها لتصحيح السيرة الذاتية (5 في الدقيقة). يرجى الانتظار قليلاً.",
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("user_session")?.value;
  const authResult = await verifyUserSession(token);

  if (!authResult) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json(
        { success: false, error: "Invalid form data" },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    const rawJobTitle = formData.get("jobTitle");
    const rawJobDesc = formData.get("jobDesc");
    const rawAtsReport = formData.get("atsReport");

    // 1. Validate Target Job Title
    if (!rawJobTitle || typeof rawJobTitle !== "string" || rawJobTitle.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Target job title is required (jobTitle)." },
        { status: 400 }
      );
    }
    const jobTitle = rawJobTitle.trim().slice(0, 200);
    const jobDesc = typeof rawJobDesc === "string" ? rawJobDesc.trim().slice(0, 4000) : "";

    // Parse prior ATS report if provided
    let priorReport: PriorAtsReport | null = null;
    let originalScore = 65;
    if (typeof rawAtsReport === "string" && rawAtsReport.trim()) {
      try {
        priorReport = JSON.parse(rawAtsReport);
        if (typeof priorReport?.score === "number") {
          originalScore = Math.max(10, Math.min(99, priorReport.score));
        }
      } catch {
        // Non-fatal if atsReport parse fails
      }
    }

    // 2. Validate File (PDF or TXT, max 5MB)
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "Please upload a valid CV file (PDF or TXT)." },
        { status: 400 }
      );
    }

    const fileName = file instanceof File ? file.name : "cv.pdf";
    const fileExt = fileName.toLowerCase().split(".").pop();
    const isAllowedExt = fileExt === "pdf" || fileExt === "txt";
    const isAllowedMime =
      file.type === "application/pdf" ||
      file.type === "application/x-pdf" ||
      file.type === "text/plain";

    if (!isAllowedExt && !isAllowedMime) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only PDF (.pdf) and Text (.txt) files are supported." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "File size exceeds the 5MB maximum limit." },
        { status: 400 }
      );
    }

    // 3. Extract CV Text
    let rawCvText = "";
    try {
      rawCvText = await extractCvText(file, fileName);
    } catch (parseErr: unknown) {
      console.error("[ats-fix] Text extraction error:", parseErr);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to read the CV file. Ensure it is not encrypted or corrupted.",
        },
        { status: 422 }
      );
    }

    if (!rawCvText || rawCvText.trim().length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not extract sufficient text from the CV. Please upload a text-selectable PDF or plain text CV.",
        },
        { status: 422 }
      );
    }

    // 4. Construct Strict Prompt enforcing Non-Negotiable Factual Integrity
    const systemPrompt = `You are a Principal German ATS Optimization Architect and Certified Career Auditor adhering to strict German labor truthfulness (Strikte Wahrheitspflicht).

TARGET JOB TITLE: ${jobTitle}
TARGET JOB DESCRIPTION: ${jobDesc ? jobDesc : "General market requirements for " + jobTitle}
ORIGINAL ATS SCORE: ${originalScore}%
PRIOR ATS REPORT DATA: ${priorReport ? JSON.stringify(priorReport) : "None"}

CANDIDATE'S ORIGINAL RAW CV TEXT:
"""
${rawCvText.slice(0, 8000)}
"""

CRITICAL AUDIT & FACTUAL INTEGRITY RULES (NON-NEGOTIABLE):
1. ZERO FABRICATION (Strikte Wahrheitspflicht):
   - You MUST NEVER invent companies, dates, universities, degrees, certifications, or hard skills not evidenced in the original CV.
   - If a personal contact detail (phone, address, birthDate, nationality) is missing, return an empty string "" — NEVER generate fake numbers, addresses, or birthdays.
   - Extract real personal facts: firstName, lastName, email, phone, address, city, birthDate, birthPlace, nationality, maritalStatus.
2. TERMINOLOGY ALIGNMENT vs. UNVERIFIED GAPS:
   - If a missing ATS keyword is a German professional term (Fachbegriff) that accurately translates or refines work the candidate ACTUALLY performed (e.g. converting nursing duties to "Pflegedokumentation", or software engineering to "Softwareentwicklung"), integrate it naturally into personal.summary, experience[].description, or skills.
   - If a missing ATS keyword is a hard tool, license, framework, or language level NOT present in the candidate's CV (e.g. "SAP", "Führerschein Klasse B", "Deutsch C1", "Kubernetes"), DO NOT inject it into cvData. Instead, place it in "unverifiedSkills" so the candidate can honestly decide whether to add it.
3. GERMAN DIN 5008 FORMAT & BEWERBUNGSDEUTSCH:
   - Translate all non-German positions, education, and tasks into professional German (Bewerbungsdeutsch / Substantivstil).
   - Write a factual 2-3 sentence German "summary" (Kurzprofil) based strictly on real facts and the target role.
   - Rewrite experience[].description using strong German action verbs while remaining 100% faithful to the candidate's actual responsibilities.
   - Map languages[].level strictly to one of: ["Muttersprache", "C2", "C1", "B2", "B1", "A2", "A1"].
4. APPLIED FIXES (appliedFixes):
   - Provide 3 to 5 clear, encouraging Arabic strings explaining genuine improvements made (e.g. "ترجمة وتنسيق المسميات المهنية وفق المعيار الألماني DIN 5008", "صياغة نبذة مهنية (Kurzprofil) متوافقة مع متطلبات خوارزميات ATS", "إعادة هيكلة المهام الوظيفية بأسلوب الفعل الألماني المهني").
5. REALISTIC PROJECTED SCORE:
   - Calculate projectedScore realistically based on formatting, German translation, Kurzprofil, and terminology fixes. Must be a credible number between ${Math.min(80, originalScore + 10)} and 94 (NEVER an inflated 99%).

RETURN ONLY A VALID JSON OBJECT MATCHING THIS SCHEMA:
{
  "cvData": {
    "personal": {
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string",
      "address": "string",
      "city": "string",
      "birthDate": "string",
      "birthPlace": "string",
      "nationality": "string",
      "maritalStatus": "string",
      "targetJobTitle": "${jobTitle}",
      "photoUrl": "",
      "summary": "string (Kurzprofil in German)"
    },
    "experience": [
      {
        "id": "exp-1",
        "position": "string (in German)",
        "company": "string",
        "city": "string",
        "startDate": "string",
        "endDate": "string",
        "isCurrent": boolean,
        "description": "string (German bullets/tasks)"
      }
    ],
    "education": [
      {
        "id": "edu-1",
        "degree": "string (in German)",
        "institution": "string",
        "city": "string",
        "startDate": "string",
        "endDate": "string",
        "isCurrent": boolean,
        "description": "string"
      }
    ],
    "skills": ["string (German or standard tech/industry terms)"],
    "languages": [
      {
        "language": "string",
        "level": "Muttersprache" | "C2" | "C1" | "B2" | "B1" | "A2" | "A1"
      }
    ]
  },
  "projectedScore": number,
  "appliedFixes": ["string (Arabic)"],
  "unverifiedSkills": ["string (German keywords not found in CV)"]
}`;

    // Deduct AI Credit
    const creditResult = await deductAiCreditAtomic({
      userId: authResult.user.id,
      operation: "ATS_TOOL",
      requiredCredits: 1,
    });
    if (!creditResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "INSUFFICIENT_CREDITS",
          message: creditResult.error || "نفد رصيد الذكاء الاصطناعي الخاص بك. يرجى الترقية إلى Pro أو إدخال كود ترويجي.",
          outOfCredits: true,
        },
        { status: 402 }
      );
    }

    // 5. Call Gemini
    let geminiRaw: string;
    try {
      geminiRaw = await generateAtsFixWithGemini(systemPrompt);
    } catch (geminiError) {
      await refundAiCredit(authResult.user.id);
      throw geminiError;
    }

    // 6. Parse and Sanitize JSON safely
    let parsed: any;
    try {
      const cleaned = geminiRaw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[ats-fix] JSON Parse error from Gemini output:", parseErr);
      return NextResponse.json(
        { success: false, error: "Failed to parse AI optimization response. Please try again." },
        { status: 500 }
      );
    }

    // 7. Sanitize cvData to prevent frontend crashes
    const personal = parsed?.cvData?.personal || {};
    const sanitizedPersonal = {
      firstName: String(personal.firstName || "").trim(),
      lastName: String(personal.lastName || "").trim(),
      email: String(personal.email || "").trim(),
      phone: String(personal.phone || "").trim(),
      address: String(personal.address || "").trim(),
      city: String(personal.city || "").trim(),
      birthDate: String(personal.birthDate || "").trim(),
      birthPlace: String(personal.birthPlace || "").trim(),
      nationality: String(personal.nationality || "").trim(),
      maritalStatus: String(personal.maritalStatus || "").trim(),
      targetJobTitle: String(personal.targetJobTitle || jobTitle).trim(),
      photoUrl: String(personal.photoUrl || "").trim(),
      summary: String(personal.summary || "").trim(),
    };

    const experiences = Array.isArray(parsed?.cvData?.experience)
      ? parsed.cvData.experience.map((exp: any, index: number) => ({
          id: String(exp.id || `exp-${index + 1}`),
          position: String(exp.position || "Position").trim(),
          company: String(exp.company || "Unternehmen").trim(),
          city: String(exp.city || "").trim(),
          startDate: String(exp.startDate || "").trim(),
          endDate: String(exp.endDate || "").trim(),
          isCurrent: Boolean(exp.isCurrent),
          description: String(exp.description || "").trim(),
        }))
      : [];

    const educations = Array.isArray(parsed?.cvData?.education)
      ? parsed.cvData.education.map((edu: any, index: number) => ({
          id: String(edu.id || `edu-${index + 1}`),
          degree: String(edu.degree || "Abschluss").trim(),
          institution: String(edu.institution || "Bildungseinrichtung").trim(),
          city: String(edu.city || "").trim(),
          startDate: String(edu.startDate || "").trim(),
          endDate: String(edu.endDate || "").trim(),
          isCurrent: Boolean(edu.isCurrent),
          description: String(edu.description || "").trim(),
        }))
      : [];

    const skills = Array.isArray(parsed?.cvData?.skills)
      ? parsed.cvData.skills
          .map((s: any) => (typeof s === "string" ? s.trim() : String(s?.name || "").trim()))
          .filter(Boolean)
      : [];

    const languages = Array.isArray(parsed?.cvData?.languages)
      ? parsed.cvData.languages
          .map((l: any) => ({
            language: String(l.language || "").trim(),
            level: ["Muttersprache", "C2", "C1", "B2", "B1", "A2", "A1"].includes(l.level)
              ? l.level
              : "B2",
          }))
          .filter((l: any) => l.language.length > 0)
      : [];

    const sanitizedCvData = {
      personal: sanitizedPersonal,
      experience: experiences,
      education: educations,
      skills,
      languages,
    };

    // Calculate realistically clamped projected score
    const rawProjected = Number(parsed?.projectedScore);
    const projectedScore = Math.max(
      originalScore + 8,
      Math.min(94, !isNaN(rawProjected) && rawProjected > 0 ? rawProjected : originalScore + 18)
    );

    const appliedFixes = Array.isArray(parsed?.appliedFixes)
      ? parsed.appliedFixes.map((f: any) => String(f).trim()).filter(Boolean)
      : [
          "ترجمة المسميات المهنية والخبرات إلى المعيار الألماني DIN 5008",
          "صياغة نبذة مهنية احترافية (Kurzprofil) تبرز نقاط القوة وفق متطلبات الوظيفة",
          "إعادة هيكلة المهام الوظيفية والمصطلحات التخصصية لرفع التوافق مع أنظمة ATS",
        ];

    const unverifiedSkills = Array.isArray(parsed?.unverifiedSkills)
      ? parsed.unverifiedSkills.map((s: any) => String(s).trim()).filter(Boolean)
      : [];

    return NextResponse.json(
      {
        success: true,
        cvData: sanitizedCvData,
        originalScore,
        projectedScore,
        appliedFixes,
        unverifiedSkills,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/tools/ats-fix Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
