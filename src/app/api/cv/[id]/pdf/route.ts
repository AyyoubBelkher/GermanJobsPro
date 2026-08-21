import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserSession } from "@/lib/user-session";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { CvDocument } from "@/lib/pdf/cv-template";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/cv/[id]/pdf
 * Generates and downloads a high-fidelity DIN 5008 PDF for the CV.
 * Optional query param: ?deckblatt=true
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

    const cv = await prisma.cv.findFirst({
      where: {
        id,
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

    if (!cv) {
      return NextResponse.json(
        { success: false, error: "CV not found or access denied" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeDeckblatt = searchParams.get("deckblatt") === "true";

    const pdfElement = React.createElement(CvDocument, { cv, includeDeckblatt }) as unknown as React.ReactElement<DocumentProps>;
    const pdfBuffer = await renderToBuffer(pdfElement);

    const safeName = (cv.personalInfo?.fullName || "Bewerber")
      .replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, "_");

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Lebenslauf_${safeName}.pdf"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: unknown) {
    console.error("[GET /api/cv/[id]/pdf Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Failed to render CV PDF" },
      { status: 500 }
    );
  }
}
