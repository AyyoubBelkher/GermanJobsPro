import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserSession } from "@/lib/user-session";
import { generateCoverLetterSchema } from "@/lib/validations/ai";
import { generateCoverLetterAI, CvContext } from "@/lib/gemini";

/**
 * POST /api/ai/generate-cover-letter
 * Generates a tailored German cover letter using server-side Gemini AI.
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

    const body = await request.json().catch(() => null);
    const parseResult = generateCoverLetterSchema.safeParse(body);

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

    if (cvId) {
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
      }
    }

    const generatedContent = await generateCoverLetterAI({
      jobTitle,
      companyName,
      recipientName,
      jobDescriptionRaw,
      tone,
      language,
      cvContext,
    });

    return NextResponse.json(
      {
        success: true,
        generatedContent,
      },
      { status: 200 }
    );
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
