import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-session";
import { updateApplicationSchema } from "@/lib/validations/application";
import { ApplicationStatus } from "@/generated/prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/applications/[id]
 * Retrieves single application detail, strictly scoped to authenticated user.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await getUserSession(request);

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const application = await prisma.application.findFirst({
      where: {
        id,
        userId: authResult.user.id,
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
            salary: true,
            category: true,
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

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, application }, { status: 200 });
  } catch (error: unknown) {
    console.error("[GET /api/applications/[id] Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/applications/[id]
 * Updates status, notes, follow-up date, or linked CV/CoverLetter.
 * Strictly verifies ownership (IDOR guard).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await getUserSession(request);

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Strict IDOR ownership check
    const existing = await prisma.application.findFirst({
      where: {
        id,
        userId: authResult.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    const parseResult = updateApplicationSchema.safeParse(body);

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

    // Validate IDOR on cvId if provided
    if (data.cvId !== undefined && data.cvId !== null) {
      const cvRecord = await prisma.cv.findFirst({
        where: { id: data.cvId, userId: authResult.user.id },
      });
      if (!cvRecord) {
        return NextResponse.json(
          { success: false, error: "Selected CV not found or does not belong to you" },
          { status: 400 }
        );
      }
    }

    // Validate IDOR on coverLetterId if provided
    if (data.coverLetterId !== undefined && data.coverLetterId !== null) {
      const clRecord = await prisma.coverLetter.findFirst({
        where: { id: data.coverLetterId, userId: authResult.user.id },
      });
      if (!clRecord) {
        return NextResponse.json(
          { success: false, error: "Selected Cover Letter not found or does not belong to you" },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.status !== undefined) {
      updateData.status = data.status as ApplicationStatus;
      // If moving to APPLIED and appliedAt is not set, default to now
      if (data.status === "APPLIED" && !existing.appliedAt && data.appliedAt === undefined) {
        updateData.appliedAt = new Date();
      }
    }
    if (data.appliedAt !== undefined) updateData.appliedAt = data.appliedAt;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.followUpAt !== undefined) updateData.followUpAt = data.followUpAt;
    if (data.cvId !== undefined) updateData.cvId = data.cvId;
    if (data.coverLetterId !== undefined) updateData.coverLetterId = data.coverLetterId;
    if (data.jobId !== undefined) updateData.jobId = data.jobId;

    const updated = await prisma.application.update({
      where: { id },
      data: updateData,
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
        application: updated,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[PATCH /api/applications/[id] Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Failed to update application" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/applications/[id]
 * Deletes an application owned by the authenticated user.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await getUserSession(request);

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Strict IDOR ownership check
    const existing = await prisma.application.findFirst({
      where: {
        id,
        userId: authResult.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    await prisma.application.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Application deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[DELETE /api/applications/[id] Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Failed to delete application" },
      { status: 500 }
    );
  }
}
