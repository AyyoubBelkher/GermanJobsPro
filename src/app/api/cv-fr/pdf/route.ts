export const runtime = "nodejs";
export const maxDuration = 30;

import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { verifyUserSession } from "@/lib/user-session";
import { buildFrenchCvFilename, frenchCvSchema } from "@/lib/cv-fr";
import { FrenchCvPdfDocument } from "@/components/cv-fr/FrenchCvPdfDocument";

/**
 * POST /api/cv-fr/pdf
 * Validates payload with Zod and renders an ATS-readable French A4 PDF.
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
    const parsed = frenchCvSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const cvData = parsed.data;
    const pdfElement = React.createElement(FrenchCvPdfDocument, {
      data: cvData,
    }) as unknown as React.ReactElement<DocumentProps>;

    const pdfBuffer = await renderToBuffer(pdfElement);
    const filename = buildFrenchCvFilename(
      cvData.header.firstName,
      cvData.header.lastName
    );

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: unknown) {
    console.error(
      "[POST /api/cv-fr/pdf Error]:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { success: false, error: "Failed to generate French CV PDF" },
      { status: 500 }
    );
  }
}
