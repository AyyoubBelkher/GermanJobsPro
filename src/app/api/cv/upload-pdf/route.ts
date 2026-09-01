import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserSession } from "@/lib/user-session";
import { extractText } from "unpdf";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/cv/upload-pdf
 * Extracts and normalizes text from an uploaded PDF file for ATS Analysis using unpdf.
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

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json(
        { success: false, error: "Invalid form data" },
        { status: 400 }
      );
    }

    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "No PDF file provided in request." },
        { status: 400 }
      );
    }

    const fileName = file instanceof File ? file.name : "uploaded.pdf";
    const fileType = file.type;

    // Validate MIME type & file extension
    const isPdfMime = fileType === "application/pdf" || fileType === "application/x-pdf";
    const isPdfExt = fileName.toLowerCase().endsWith(".pdf");

    if (!isPdfMime && !isPdfExt) {
      return NextResponse.json(
        { success: false, error: "Invalid file format. Please upload a valid PDF document (.pdf)." },
        { status: 400 }
      );
    }

    // Validate size limit (5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "File size exceeds the 5MB maximum limit." },
        { status: 400 }
      );
    }

    // Convert file to Uint8Array for unpdf
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Validate PDF magic bytes: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
    const isPdfMagic =
      uint8Array.length >= 5 &&
      uint8Array[0] === 0x25 && // %
      uint8Array[1] === 0x50 && // P
      uint8Array[2] === 0x44 && // D
      uint8Array[3] === 0x46 && // F
      uint8Array[4] === 0x2d; // -

    if (!isPdfMagic) {
      return NextResponse.json(
        { success: false, error: "Invalid PDF signature. The uploaded file is not a genuine PDF document." },
        { status: 400 }
      );
    }

    let rawExtractedText = "";
    let pageCount = 1;

    try {
      const { text, totalPages } = await extractText(uint8Array);
      pageCount = totalPages || 1;
      rawExtractedText = Array.isArray(text) ? text.join("\n") : String(text || "");
    } catch (parseErr: unknown) {
      console.error("[unpdf Extraction Error]:", parseErr);
      return NextResponse.json(
        { success: false, error: "Failed to parse PDF document. The file may be password-protected or corrupted." },
        { status: 422 }
      );
    }

    // Clean and normalize text while preserving line structure
    const cleanedText = rawExtractedText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\t/g, " ")
      .replace(/[ ]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (cleanedText.length < 30) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The uploaded PDF contains insufficient extractable text (fewer than 30 characters). It may be a scanned image without an OCR text layer. Please use a text-based PDF or paste your CV text directly.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        text: cleanedText,
        filename: fileName,
        charCount: cleanedText.length,
        totalPages: pageCount,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/cv/upload-pdf Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
