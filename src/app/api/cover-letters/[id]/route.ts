import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserSession } from "@/lib/user-session";
import { coverLetterUpdateSchema } from "@/lib/validations/cover-letter";
import { extractGermanJobTitle } from "@/lib/cover-letter";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/cover-letters/[id]
 * Fetches a single cover letter ensuring authenticated user ownership.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("user_session")?.value;
    const authResult = await verifyUserSession(token);

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const coverLetter = await prisma.coverLetter.findFirst({
      where: {
        id,
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
    });

    if (!coverLetter) {
      return NextResponse.json(
        { success: false, error: "Cover letter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        coverLetter,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[GET /api/cover-letters/[id] Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cover-letters/[id]
 * Updates cover letter details ensuring authenticated user ownership.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("user_session")?.value;
    const authResult = await verifyUserSession(token);

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const existingCoverLetter = await prisma.coverLetter.findFirst({
      where: {
        id,
        userId: authResult.user.id,
      },
    });

    if (!existingCoverLetter) {
      return NextResponse.json(
        { success: false, error: "Cover letter not found" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    const parseResult = coverLetterUpdateSchema.safeParse(body);

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

    // If updating cvId, ensure referenced CV belongs to the authenticated user
    if (data.cvId) {
      const referencedCv = await prisma.cv.findFirst({
        where: {
          id: data.cvId,
          userId: authResult.user.id,
        },
      });

      if (!referencedCv) {
        return NextResponse.json(
          {
            success: false,
            error: "Referenced CV not found or does not belong to you",
          },
          { status: 400 }
        );
      }
    }

    const updatedCoverLetter = await prisma.coverLetter.update({
      where: { id },
      data: {
        title: data.title,
        jobTitle: data.jobTitle !== undefined ? (extractGermanJobTitle(data.jobTitle) || data.jobTitle) : undefined,
        companyName: data.companyName,
        recipientName: data.recipientName !== undefined ? (data.recipientName || null) : undefined,
        jobDescriptionRaw: data.jobDescriptionRaw !== undefined ? (data.jobDescriptionRaw || null) : undefined,
        language: data.language,
        tone: data.tone,
        generatedContent: data.generatedContent,
        cvId: data.cvId !== undefined ? (data.cvId || null) : undefined,
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
        message: "Cover letter updated successfully",
        coverLetter: updatedCoverLetter,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[PUT /api/cover-letters/[id] Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cover-letters/[id]
 * Deletes cover letter ensuring authenticated user ownership.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("user_session")?.value;
    const authResult = await verifyUserSession(token);

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const existingCoverLetter = await prisma.coverLetter.findFirst({
      where: {
        id,
        userId: authResult.user.id,
      },
    });

    if (!existingCoverLetter) {
      return NextResponse.json(
        { success: false, error: "Cover letter not found" },
        { status: 404 }
      );
    }

    await prisma.coverLetter.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Cover letter deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[DELETE /api/cover-letters/[id] Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
