import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserSession } from "@/lib/user-session";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { CoverLetterDocument } from "@/lib/pdf/cover-letter-template";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/cover-letters/[id]/pdf
 * Generates and downloads a high-fidelity DIN 5008 PDF for the Cover Letter (Anschreiben).
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
          include: {
            personalInfo: true,
          },
        },
      },
    });

    if (!coverLetter) {
      return NextResponse.json(
        { success: false, error: "Cover letter not found or access denied" },
        { status: 404 }
      );
    }

    // Determine sender details from linked CV personalInfo or fallback to user
    const sender = coverLetter.cv?.personalInfo
      ? {
          fullName: coverLetter.cv.personalInfo.fullName,
          email: coverLetter.cv.personalInfo.email,
          phone: coverLetter.cv.personalInfo.phone,
          address: coverLetter.cv.personalInfo.address,
        }
      : {
          fullName: authResult.user.name || "Bewerber",
          email: authResult.user.email,
          phone: null,
          address: "Deutschland",
        };

    const pdfElement = React.createElement(CoverLetterDocument, {
      data: {
        title: coverLetter.title,
        jobTitle: coverLetter.jobTitle,
        companyName: coverLetter.companyName,
        recipientName: coverLetter.recipientName,
        language: coverLetter.language,
        tone: coverLetter.tone,
        generatedContent: coverLetter.generatedContent,
        sender,
      },
    }) as unknown as React.ReactElement<DocumentProps>;

    const pdfBuffer = await renderToBuffer(pdfElement);

    const safeCompany = coverLetter.companyName.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, "_");

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Anschreiben_${safeCompany}.pdf"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: unknown) {
    console.error("[GET /api/cover-letters/[id]/pdf Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Failed to render Cover Letter PDF" },
      { status: 500 }
    );
  }
}
