import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserSession } from "@/lib/user-session";
import { generateCoverLetterSchema } from "@/lib/validations/ai";
import {
  generateCoverLetterAI,
  extractApplicantInfoAI,
  CvContext,
  ExtractedApplicantInfo,
} from "@/lib/gemini";
import { consumeAiCredit, refundAiCredit } from "@/lib/monetization";
import { checkRateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";
import { extractText } from "unpdf";

const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/ai/generate-cover-letter
 * Generates a tailored German cover letter using server-side Gemini AI.
 * Supports both JSON and multipart/form-data with direct PDF CV uploads.
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, AUTH_RATE_LIMITS.AI_API);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

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

    const contentType = request.headers.get("content-type") || "";
    let rawInput: Record<string, unknown> = {};
    let cvFile: Blob | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData().catch(() => null);
      if (!formData) {
        return NextResponse.json(
          { success: false, error: "Invalid form data submission." },
          { status: 400 }
        );
      }

      rawInput = {
        jobTitle: (formData.get("jobTitle") as string) || "",
        companyName: (formData.get("companyName") as string) || "",
        recipientName: (formData.get("recipientName") as string) || null,
        jobDescriptionRaw: (formData.get("jobDescriptionRaw") as string) || "",
        tone: (formData.get("tone") as string) || "professional",
        language: (formData.get("language") as string) || "de",
        cvId: (formData.get("cvId") as string) || null,
      };

      const fileEntry = formData.get("cvFile");
      if (fileEntry && fileEntry instanceof Blob && fileEntry.size > 0) {
        cvFile = fileEntry;
      }
    } else {
      const body = await request.json().catch(() => null);
      if (!body) {
        return NextResponse.json(
          { success: false, error: "Invalid JSON request body." },
          { status: 400 }
        );
      }
      rawInput = body;
    }

    const parseResult = generateCoverLetterSchema.safeParse(rawInput);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { jobTitle, companyName, recipientName, jobDescriptionRaw, tone, language, cvId } =
      parseResult.data;

    let cvContext: CvContext | null = null;
    let cvRawText: string | null = null;
    let resolvedCvId: string | null = cvId || null;
    let applicantInfo: ExtractedApplicantInfo | null = null;

    // Handle Direct PDF CV Upload
    if (cvFile) {
      const fileName = cvFile instanceof File ? cvFile.name : "Lebenslauf.pdf";
      const fileType = cvFile.type;

      const isPdf =
        fileType === "application/pdf" ||
        fileType === "application/x-pdf" ||
        fileName.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        return NextResponse.json(
          { success: false, error: "Invalid file format. Please upload a valid PDF document (.pdf)." },
          { status: 400 }
        );
      }

      if (cvFile.size > MAX_PDF_SIZE_BYTES) {
        return NextResponse.json(
          { success: false, error: "File size exceeds the 5MB maximum limit." },
          { status: 400 }
        );
      }

      let parsedPdfText = "";
      try {
        const arrayBuffer = await cvFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Validate PDF magic bytes: %PDF-
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

        const { text } = await extractText(uint8Array);
        parsedPdfText = Array.isArray(text) ? text.join("\n") : String(text || "");
      } catch (parseErr: unknown) {
        console.error("[Cover Letter PDF parse error]:", parseErr);
        return NextResponse.json(
          { success: false, error: "Failed to parse PDF document. The file may be password-protected or corrupted." },
          { status: 422 }
        );
      }

      const cleanedPdfText = parsedPdfText
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\t/g, " ")
        .replace(/[ ]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (cleanedPdfText.length < 25) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The uploaded PDF contains insufficient extractable text (fewer than 25 characters). Please ensure it is a text-based PDF.",
          },
          { status: 400 }
        );
      }

      cvRawText = cleanedPdfText;

      // Extract applicant personal contact info from the PDF
      applicantInfo = await extractApplicantInfoAI(cleanedPdfText);

      // Create a CV profile in Prisma to persist applicant details for the Cover Letter & PDF generator
      const savedFullName = applicantInfo.fullName || authResult.user.name || "Bewerber";
      const savedEmail = applicantInfo.email || authResult.user.email;
      const savedPhone = applicantInfo.phone || null;
      const savedAddress = applicantInfo.address || "Deutschland";
      const savedTargetJob = applicantInfo.targetJobTitle || jobTitle;

      const createdCv = await prisma.cv.create({
        data: {
          userId: authResult.user.id,
          title: `CV (${applicantInfo.fullName || fileName.replace(/\.pdf$/i, "")})`,
          language: language || "de",
          isDraft: false,
          personalInfo: {
            create: {
              fullName: savedFullName,
              email: savedEmail,
              phone: savedPhone,
              address: savedAddress,
              targetJobTitle: savedTargetJob,
            },
          },
        },
        include: {
          personalInfo: true,
        },
      });

      resolvedCvId = createdCv.id;

      // If user has no name set on their user profile, update it
      if (!authResult.user.name && applicantInfo.fullName) {
        await prisma.user
          .update({
            where: { id: authResult.user.id },
            data: { name: applicantInfo.fullName },
          })
          .catch((e) => console.warn("[Update User Name Error]:", e));
      }

      cvContext = {
        fullName: savedFullName,
        email: savedEmail,
        phone: savedPhone,
        address: savedAddress,
        targetJobTitle: savedTargetJob,
      };
    } else if (cvId) {
      // Load existing CV from database
      const userCv = await prisma.cv.findFirst({
        where: {
          id: cvId,
          userId: authResult.user.id,
        },
        include: {
          personalInfo: true,
          experiences: { orderBy: { order: "asc" } },
          educations: { orderBy: { order: "asc" } },
          skills: { orderBy: { order: "asc" } },
          languages: { orderBy: { order: "asc" } },
        },
      });

      if (userCv) {
        cvContext = {
          fullName: userCv.personalInfo?.fullName || authResult.user.name,
          email: userCv.personalInfo?.email || authResult.user.email,
          phone: userCv.personalInfo?.phone,
          address: userCv.personalInfo?.address,
          targetJobTitle: userCv.personalInfo?.targetJobTitle,
          summary: userCv.personalInfo?.summary,
          experiences: userCv.experiences.map((exp) => ({
            company: exp.company,
            position: exp.position,
            description: exp.description,
            startDate: exp.startDate,
            endDate: exp.endDate,
            isCurrent: exp.isCurrent,
          })),
          educations: userCv.educations.map((edu) => ({
            institution: edu.institution,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy,
          })),
          skills: userCv.skills.map((skill) => ({
            name: skill.name,
            level: skill.level,
            category: skill.category,
          })),
          languages: userCv.languages.map((lang) => ({
            language: lang.language,
            proficiency: lang.proficiency,
          })),
        };

        if (userCv.personalInfo) {
          applicantInfo = {
            fullName: userCv.personalInfo.fullName,
            email: userCv.personalInfo.email,
            phone: userCv.personalInfo.phone || undefined,
            address: userCv.personalInfo.address || undefined,
            targetJobTitle: userCv.personalInfo.targetJobTitle || undefined,
          };
        }
      }
    }

    // AI Credit Guardrail (Atomic reservation/decrement)
    const creditResult = await consumeAiCredit(authResult.user.id);
    if (!creditResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: creditResult.error || "نفد رصيد الذكاء الاصطناعي الخاص بك. يرجى الترقية إلى Pro أو إدخال كود ترويجي.",
          outOfCredits: true,
        },
        { status: 403 }
      );
    }

    try {
      const generatedContent = await generateCoverLetterAI({
        jobTitle,
        companyName,
        recipientName,
        jobDescriptionRaw,
        tone,
        language,
        cvContext,
        cvRawText,
      });

      return NextResponse.json(
        {
          success: true,
          generatedContent,
          cvId: resolvedCvId,
          applicantInfo,
          remainingCredits: creditResult.remainingCredits,
          isPro: creditResult.isPro,
        },
        { status: 200 }
      );
    } catch (aiError) {
      await refundAiCredit(authResult.user.id);
      throw aiError;
    }
  } catch (error: unknown) {
    console.error("[Generate Cover Letter Error]:", error instanceof Error ? error.message : error);

    const errorMessage =
      error instanceof Error && error.message.includes("GEMINI_API_KEY")
        ? "AI service is temporarily unavailable. Please check server configuration."
        : "Failed to generate cover letter. Please try again.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
