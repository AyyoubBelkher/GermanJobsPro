import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-session";
import { createApplicationSchema, applicationStatusEnum } from "@/lib/validations/application";
import { ApplicationStatus } from "@/generated/prisma/client";

/**
 * GET /api/applications
 * Returns paginated, filtered list of job applications for the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await getUserSession(request);

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const skip = (page - 1) * limit;

    // Build filter
    const whereClause: Record<string, unknown> = {
      userId: authResult.user.id,
    };

    if (statusParam && Object.values(ApplicationStatus).includes(statusParam as ApplicationStatus)) {
      whereClause.status = statusParam as ApplicationStatus;
    }

    if (search) {
      whereClause.OR = [
        { jobTitle: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, applications] = await Promise.all([
      prisma.application.count({ where: whereClause }),
      prisma.application.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              city: true,
              applyUrl: true,
              status: true,
            },
          },
          cv: {
            select: {
              id: true,
              title: true,
              language: true,
            },
          },
          coverLetter: {
            select: {
              id: true,
              title: true,
              language: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        applications,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[GET /api/applications Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/applications
 * Creates a new job application tracking entry for the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await getUserSession(request);

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const parseResult = createApplicationSchema.safeParse(body);

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

    const {
      jobId,
      cvId,
      coverLetterId,
      companyName,
      jobTitle,
      location,
      status,
      appliedAt,
      notes,
      followUpAt,
    } = parseResult.data;

    // Validate IDOR ownership of CV if provided
    let resolvedCvId: string | null = null;
    if (cvId) {
      const userCv = await prisma.cv.findFirst({
        where: { id: cvId, userId: authResult.user.id },
        select: { id: true },
      });
      if (!userCv) {
        return NextResponse.json(
          { success: false, error: "Selected CV not found or does not belong to you" },
          { status: 400 }
        );
      }
      resolvedCvId = userCv.id;
    }

    // Validate IDOR ownership of CoverLetter if provided
    let resolvedCoverLetterId: string | null = null;
    if (coverLetterId) {
      const userCoverLetter = await prisma.coverLetter.findFirst({
        where: { id: coverLetterId, userId: authResult.user.id },
        select: { id: true },
      });
      if (!userCoverLetter) {
        return NextResponse.json(
          { success: false, error: "Selected Cover Letter not found or does not belong to you" },
          { status: 400 }
        );
      }
      resolvedCoverLetterId = userCoverLetter.id;
    }

    // Validate Job existence if provided
    let resolvedJobId: string | null = null;
    if (jobId) {
      const jobRecord = await prisma.job.findUnique({
        where: { id: jobId },
        select: { id: true },
      });
      if (jobRecord) {
        resolvedJobId = jobRecord.id;
      }
    }

    const application = await prisma.application.create({
      data: {
        userId: authResult.user.id,
        jobId: resolvedJobId,
        cvId: resolvedCvId,
        coverLetterId: resolvedCoverLetterId,
        companyName,
        jobTitle,
        location: location || null,
        status: status as ApplicationStatus,
        appliedAt: appliedAt || (status === "APPLIED" ? new Date() : null),
        notes: notes || null,
        followUpAt: followUpAt || null,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            city: true,
            applyUrl: true,
            status: true,
          },
        },
        cv: {
          select: {
            id: true,
            title: true,
            language: true,
          },
        },
        coverLetter: {
          select: {
            id: true,
            title: true,
            language: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        application,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/applications Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Failed to create application" },
      { status: 500 }
    );
  }
}
