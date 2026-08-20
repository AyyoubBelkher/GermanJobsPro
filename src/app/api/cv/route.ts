import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserSession } from "@/lib/user-session";
import { cvCreateSchema } from "@/lib/validations/cv";

/**
 * GET /api/cv
 * Fetches all CV summaries for the authenticated user.
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

    const cvs = await prisma.cv.findMany({
      where: {
        userId: authResult.user.id,
      },
      select: {
        id: true,
        title: true,
        language: true,
        isDraft: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        cvs,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[GET /api/cv Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cv
 * Creates a new CV draft with default title and initial CvPersonalInfo for the authenticated user.
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

    const body = await request.json().catch(() => ({}));
    const parseResult = cvCreateSchema.safeParse(body);

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

    const { title, language, isDraft } = parseResult.data;

    const newCv = await prisma.cv.create({
      data: {
        userId: authResult.user.id,
        title: title || "Lebenslauf",
        language: language || "de",
        isDraft: isDraft !== undefined ? isDraft : true,
        personalInfo: {
          create: {
            fullName: authResult.user.name || "",
            email: authResult.user.email,
          },
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

    return NextResponse.json(
      {
        success: true,
        message: "CV created successfully",
        cv: newCv,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/cv Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
