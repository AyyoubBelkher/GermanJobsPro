import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserSession } from "@/lib/user-session";
import { analyzeCvAtsSchema } from "@/lib/validations/ai";
import { analyzeCvAtsAI } from "@/lib/gemini";

/**
 * POST /api/ai/analyze-cv-ats
 * Analyzes a CV for German ATS compatibility and DIN 5008 compliance.
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
    const parseResult = analyzeCvAtsSchema.safeParse(body);

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

    const { cvText, cvId, jobDescription, language } = parseResult.data;

    let finalCvText = cvText || "";

    // If cvId is provided, fetch full CV and structure into formatted text
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
          certifications: { orderBy: { order: "asc" } },
          projects: { orderBy: { order: "asc" } },
        },
      });

      if (!userCv) {
        return NextResponse.json(
          { success: false, error: "CV not found or does not belong to you" },
          { status: 404 }
        );
      }

      const lines: string[] = [];
      lines.push(`=== LEBENSLAUF: ${userCv.title} ===`);
      if (userCv.personalInfo) {
        lines.push(`Name: ${userCv.personalInfo.fullName}`);
        lines.push(`E-Mail: ${userCv.personalInfo.email}`);
        if (userCv.personalInfo.phone) lines.push(`Telefon: ${userCv.personalInfo.phone}`);
        if (userCv.personalInfo.address) lines.push(`Adresse: ${userCv.personalInfo.address}`);
        if (userCv.personalInfo.birthDate) lines.push(`Geburtsdatum: ${userCv.personalInfo.birthDate.toISOString().split("T")[0]}`);
        if (userCv.personalInfo.birthPlace) lines.push(`Geburtsort: ${userCv.personalInfo.birthPlace}`);
        if (userCv.personalInfo.nationality) lines.push(`Staatsangehörigkeit: ${userCv.personalInfo.nationality}`);
        if (userCv.personalInfo.targetJobTitle) lines.push(`Angestrebte Position: ${userCv.personalInfo.targetJobTitle}`);
        if (userCv.personalInfo.summary) lines.push(`Kurzprofil: ${userCv.personalInfo.summary}`);
      }

      if (userCv.experiences.length > 0) {
        lines.push(`\n--- BERUFSERFAHRUNG ---`);
        userCv.experiences.forEach((exp) => {
          const start = exp.startDate.toISOString().split("T")[0];
          const end = exp.isCurrent ? "heute" : exp.endDate ? exp.endDate.toISOString().split("T")[0] : "heute";
          lines.push(`* ${start} - ${end}: ${exp.position} bei ${exp.company} (${exp.city || "Deutschland"})`);
          if (exp.description) lines.push(`  ${exp.description}`);
        });
      }

      if (userCv.educations.length > 0) {
        lines.push(`\n--- AUSBILDUNG & STUDIUM ---`);
        userCv.educations.forEach((edu) => {
          const start = edu.startDate.toISOString().split("T")[0];
          const end = edu.isCurrent ? "heute" : edu.endDate ? edu.endDate.toISOString().split("T")[0] : "heute";
          lines.push(`* ${start} - ${end}: ${edu.degree} in ${edu.fieldOfStudy || "Fachrichtung"} an ${edu.institution}`);
          if (edu.grade) lines.push(`  Abschlussnote: ${edu.grade}`);
        });
      }

      if (userCv.skills.length > 0) {
        lines.push(`\n--- KENNTNISSE & FÄHIGKEITEN ---`);
        lines.push(userCv.skills.map((s) => `${s.name} (${s.level || "Gut"})`).join(", "));
      }

      if (userCv.languages.length > 0) {
        lines.push(`\n--- SPRACHEN ---`);
        lines.push(userCv.languages.map((l) => `${l.language}: ${l.proficiency}`).join(", "));
      }

      if (userCv.certifications.length > 0) {
        lines.push(`\n--- ZERTIFIKATE ---`);
        userCv.certifications.forEach((c) => lines.push(`* ${c.name} (${c.issuer})`));
      }

      if (userCv.projects.length > 0) {
        lines.push(`\n--- PROJEKTE ---`);
        userCv.projects.forEach((p) => lines.push(`* ${p.title}: ${p.description || ""}`));
      }

      finalCvText = lines.join("\n");
    }

    if (!finalCvText || finalCvText.trim().length < 30) {
      return NextResponse.json(
        { success: false, error: "CV content is too short for analysis." },
        { status: 400 }
      );
    }

    const analysis = await analyzeCvAtsAI({
      cvText: finalCvText,
      jobDescription: jobDescription || null,
      language: language || "de",
    });

    return NextResponse.json(
      {
        success: true,
        analysis,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[ATS Analyzer Error]:", error instanceof Error ? error.message : error);

    const errorMessage =
      error instanceof Error && error.message.includes("GEMINI_API_KEY")
        ? "AI service is temporarily unavailable. Please check server configuration."
        : "Failed to analyze CV. Please try again.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
