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

async function extractCvText(file: Blob, fileName: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const isPdf =
    fileName.toLowerCase().endsWith(".pdf") ||
    file.type === "application/pdf" ||
    file.type === "application/x-pdf";

  if (isPdf) {
    const { text } = await extractText(uint8Array);
    return Array.isArray(text) ? text.join("\n") : String(text || "");
  }

  return new TextDecoder("utf-8").decode(uint8Array);
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, {
    action: "tools:ats",
    limit: 10,
    windowMs: 60 * 1000,
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
      return NextResponse.json({ success: false, error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file");
    const rawJobTitle = formData.get("jobTitle");
    const rawJobDesc = formData.get("jobDesc");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ success: false, error: "No CV file provided." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ success: false, error: "File exceeds 5MB limit." }, { status: 400 });
    }

    const fileName = file instanceof File ? file.name : "cv.pdf";
    const cvText = await extractCvText(file, fileName);

    if (!cvText || cvText.trim().length < 50) {
      return NextResponse.json(
        { success: false, error: "Could not extract sufficient text from CV." },
        { status: 422 }
      );
    }

    const jobTitle = typeof rawJobTitle === "string" ? rawJobTitle.trim() : "Allgemeine Position";
    const jobDesc = typeof rawJobDesc === "string" ? rawJobDesc.trim() : "";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GEMINI_API_KEY is not configured." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a Senior German ATS Auditor and Career Specialist.
Analyze this CV against the German ATS standard and target position with STRICT PRODUCT CREDIBILITY AND FAIRNESS.

TARGET JOB: ${jobTitle}
TARGET JOB DESCRIPTION: ${jobDesc || "General industry standards for " + jobTitle}
CV TEXT:
"""
${cvText.slice(0, 8000)}
"""

CRITICAL FAIR SCORING & INTEGRITY RULES:
1. STRICT FAIRNESS & CREDIBILITY:
   - If the uploaded CV is already well-structured in German (tabular DIN 5008 layout, clear reverse-chronological experience and education, required contact details, language proficiencies) and aligns well with the target role:
     * Give it an honest passing score (score >= 80, typically between 80 and 95).
     * State CLEARLY and EXPLICITLY in "summary" (in Arabic) that the CV is accepted, meets German ATS and DIN 5008 standards, and is ready for submission to German employers without requiring modifications (e.g. "سيرتك الذاتية مقبولة ومتوافقة بنسبة ممتازة مع معايير الـ ATS والتنسيق الألماني DIN 5008، وهي جاهزة للتقديم مباشرة على أرباب العمل في ألمانيا ولا تحتاج إلى أي تعديل إضافي.").
     * DO NOT invent artificial flaws, phantom red flags, or fake criticisms on an already good CV.
     * Keep "missingKeywords", "improvements", and "rewriteSuggestions" empty or strictly limited to optional minor polish if the CV is already solid.
2. DEFICIENT OR NON-GERMAN CVs:
   - If the CV is written in another language (Arabic, English, French), lacks German DIN 5008 tabular formatting, lacks essential German technical terminology (Fachbegriffe), or has major gaps:
     * Give an accurate score reflecting genuine deficiencies (score < 80).
     * In "summary" (in Arabic), explain why it needs restructuring/translation to pass German ATS filters.
     * Provide concrete Arabic suggestions in "improvements" and relevant German keywords in "missingKeywords".

Return JSON:
{
  "score": number (0-100),
  "summary": "Arabic summary of ATS compatibility and German market readiness (explicitly confirming acceptance and readiness if score >= 80)",
  "missingKeywords": ["German keywords/Fachbegriffe missing for this role (empty array if none missing)"],
  "improvements": ["Concrete Arabic suggestions for improvements (empty array if none needed)"],
  "rewriteSuggestions": ["Bullet point rewrite suggestions in German (empty array if none needed)"],
  "germanTips": ["Tips for German DIN 5008 standards"]
}`;

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

    let lastError: unknown = null;
    let responseText = "";

    try {
      for (const model of FALLBACK_MODELS) {
        try {
          const res = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          });
          if (res.text) {
            responseText = res.text.trim();
            break;
          }
        } catch (err) {
          lastError = err;
        }
      }

      if (!responseText) {
        throw lastError || new Error("Failed to generate ATS analysis.");
      }
    } catch (geminiError) {
      await refundAiCredit(authResult.user.id);
      throw geminiError;
    }

    const parsed = JSON.parse(
      responseText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim()
    );

    const safeScore =
      typeof parsed.score === "number" && !isNaN(parsed.score)
        ? Math.min(100, Math.max(0, Math.round(parsed.score)))
        : 70;

    const result = {
      score: safeScore,
      summary: String(parsed.summary || ""),
      missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      rewriteSuggestions: Array.isArray(parsed.rewriteSuggestions) ? parsed.rewriteSuggestions : [],
      germanTips: Array.isArray(parsed.germanTips) ? parsed.germanTips : [],
    };

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    console.error("[POST /api/tools/ats Error]:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
