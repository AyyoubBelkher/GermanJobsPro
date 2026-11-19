import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserSession } from "@/lib/user-session";
import { coverLetterSchema } from "@/lib/validations/cover-letter";
import { extractGermanJobTitle, stripMarkdownAsterisks } from "@/lib/cover-letter";

/**
 * GET /api/cover-letters
 * Fetches all cover letters for the authenticated user.
 */
export async function GET() {
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

    const coverLetters = await prisma.coverLetter.findMany({
      where: {
        userId: authResult.user.id,
      },
      include: {
        cv: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        coverLetters,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[GET /api/cover-letters Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cover-letters
 * Creates a new cover letter for the authenticated user.
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
    const parseResult = coverLetterSchema.safeParse(body);

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

    const data = parseResult.data;

    // If cvId is specified, ensure it belongs to the authenticated user
    let validCvId: string | null = null;
    const requestedCvId = typeof data.cvId === "string" ? data.cvId.trim() : null;
    if (requestedCvId) {
      const referencedCv = await prisma.cv.findFirst({
        where: {
          id: requestedCvId,
          userId: authResult.user.id,
        },
      });

      if (referencedCv) {
        validCvId = referencedCv.id;
      }
    }

    const cleanedContent = stripMarkdownAsterisks(data.generatedContent);

    const coverLetter = await prisma.coverLetter.create({
      data: {
        userId: authResult.user.id,
        cvId: validCvId,
        title: data.title,
        jobTitle: extractGermanJobTitle(data.jobTitle) || data.jobTitle,
        companyName: data.companyName,
        recipientName: data.recipientName || null,
        jobDescriptionRaw: data.jobDescriptionRaw || null,
        language: data.language,
        tone: data.tone,
        generatedContent: cleanedContent,
      },
      include: {
        cv: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Cover letter created successfully",
        coverLetter,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/cover-letters Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
