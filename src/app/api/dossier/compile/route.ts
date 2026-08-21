import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserSession } from "@/lib/user-session";
import {
  compileApplicationDossier,
  compileBewerbungsmappe,
  DossierAttachment,
} from "@/lib/pdf/dossier-compiler";
import { CvPdfData } from "@/lib/pdf/cv-template";
import { CoverLetterPdfData } from "@/lib/pdf/cover-letter-template";
import { DeckblattData } from "@/lib/pdf/deckblatt-template";
import { extractApplicantInfoAI } from "@/lib/gemini";
import { extractText } from "unpdf";

const MAX_TOTAL_SIZE = 15 * 1024 * 1024; // 15MB

/**
 * POST /api/dossier/compile
 * Compiles a complete German Application Dossier (Bewerbungsmappe) PDF.
 * Supports both saved database CVs and direct uploaded CV PDFs.
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

    const cvId = formData.get("cvId") as string | null;
    const cvFileEntry = formData.get("cvFile");
    const cvFile =
      cvFileEntry && cvFileEntry instanceof Blob && cvFileEntry.size > 0 ? cvFileEntry : null;

    if ((!cvId || cvId.trim() === "" || cvId === "none") && !cvFile) {
      return NextResponse.json(
        { success: false, error: "A CV selection or uploaded PDF file is required for the dossier." },
        { status: 400 }
      );
    }

    const coverLetterId = formData.get("coverLetterId") as string | null;
    const includeDeckblatt = formData.get("includeDeckblatt") === "true";

    // Extract applicant photo if provided for Deckblatt
    const photoFileEntry = formData.get("photoFile") || formData.get("photo");
    let photoBuffer: Buffer | null = null;
    if (photoFileEntry && photoFileEntry instanceof Blob && photoFileEntry.size > 0) {
      const isImage =
        photoFileEntry.type.startsWith("image/") ||
        /\.(jpe?g|png|webp|jpg)$/i.test(photoFileEntry instanceof File ? photoFileEntry.name : "");
      if (isImage && photoFileEntry.size <= 5 * 1024 * 1024) {
        photoBuffer = Buffer.from(await photoFileEntry.arrayBuffer());
      }
    }

    // 1. Process Attachment Files (Zeugnisse & Nachweise)
    const rawFiles = formData.getAll("files");
    const attachmentBuffers: DossierAttachment[] = [];
    let totalAttachmentSize = 0;

    for (const item of rawFiles) {
      if (item instanceof Blob && item.size > 0) {
        const file = item as File;
        const fileName = file.name || "Anhang.pdf";
        const fileType = file.type;

        // Check if PDF
        const isPdf = fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
        if (!isPdf) {
          return NextResponse.json(
            { success: false, error: `File "${fileName}" is not a valid PDF document.` },
            { status: 400 }
          );
        }

        totalAttachmentSize += file.size;
        if (totalAttachmentSize > MAX_TOTAL_SIZE) {
          return NextResponse.json(
            { success: false, error: "Total attachment size exceeds the 15MB limit." },
            { status: 400 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        attachmentBuffers.push({
          name: fileName,
          buffer: new Uint8Array(arrayBuffer),
        });
      }
    }

    let compiledPdfBytes: Uint8Array;
    let applicantName = authResult.user.name || "Bewerber";

    // 2. Handle Direct Uploaded CV PDF
    if (cvFile) {
      const fileName = cvFile instanceof File ? cvFile.name : "Lebenslauf.pdf";
      const fileType = cvFile.type;

      const isPdf =
        fileType === "application/pdf" ||
        fileType === "application/x-pdf" ||
        fileName.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        return NextResponse.json(
          { success: false, error: "Uploaded CV file must be a valid PDF document (.pdf)." },
          { status: 400 }
        );
      }

      if (cvFile.size > MAX_TOTAL_SIZE) {
        return NextResponse.json(
          { success: false, error: "Uploaded CV file exceeds size limit." },
          { status: 400 }
        );
      }

      // Read array buffer once into a Node Buffer
      const cvFileBuffer = Buffer.from(await cvFile.arrayBuffer());

      // Extract text from CV to extract candidate contact details for the Deckblatt
      let deckblattMetadata: DeckblattData = {
        fullName: authResult.user.name || "Bewerber",
        email: authResult.user.email,
        phone: null,
        address: "Deutschland",
        targetJobTitle: null,
        companyName: null,
        attachments: [],
      };

      try {
        const { text } = await extractText(cvFileBuffer);
        const rawText = Array.isArray(text) ? text.join("\n") : String(text || "");
        const cleanedText = rawText.trim();
        if (cleanedText.length >= 25) {
          const extracted = await extractApplicantInfoAI(cleanedText).catch(() => null);
          if (extracted) {
            if (extracted.fullName) {
              deckblattMetadata.fullName = extracted.fullName;
              applicantName = extracted.fullName;
            }
            if (extracted.email) deckblattMetadata.email = extracted.email;
            if (extracted.phone) deckblattMetadata.phone = extracted.phone;
            if (extracted.address) deckblattMetadata.address = extracted.address;
            if (extracted.targetJobTitle) deckblattMetadata.targetJobTitle = extracted.targetJobTitle;
          }
        }
      } catch (extractErr: unknown) {
        console.warn("[Dossier CV text extract warning]:", extractErr);
      }

      // Fetch Cover Letter if selected
      let coverLetterData: CoverLetterPdfData | null = null;
      if (coverLetterId && coverLetterId.trim() !== "" && coverLetterId !== "none") {
        const coverLetter = await prisma.coverLetter.findFirst({
          where: {
            id: coverLetterId,
            userId: authResult.user.id,
          },
        });

        if (coverLetter) {
          deckblattMetadata.companyName = coverLetter.companyName;
          if (coverLetter.jobTitle) {
            deckblattMetadata.targetJobTitle = coverLetter.jobTitle;
          }

          coverLetterData = {
            title: coverLetter.title,
            jobTitle: coverLetter.jobTitle,
            companyName: coverLetter.companyName,
            recipientName: coverLetter.recipientName,
            language: coverLetter.language,
            tone: coverLetter.tone,
            generatedContent: coverLetter.generatedContent,
            sender: {
              fullName: deckblattMetadata.fullName,
              email: deckblattMetadata.email,
              phone: deckblattMetadata.phone,
              address: deckblattMetadata.address,
            },
          };
        }
      }

      compiledPdfBytes = await compileApplicationDossier({
        cvPdfBuffer: cvFileBuffer,
        coverLetterData,
        includeDeckblatt,
        deckblattMetadata,
        photoBuffer,
        attachmentBuffers,
      });
    } else {
      // 3. Handle Saved Database CV
      const cv = await prisma.cv.findFirst({
        where: {
          id: cvId!,
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
          { success: false, error: "Selected CV not found or access denied." },
          { status: 404 }
        );
      }

      applicantName = cv.personalInfo?.fullName || authResult.user.name || "Bewerber";

      let coverLetterData: CoverLetterPdfData | null = null;
      if (coverLetterId && coverLetterId.trim() !== "" && coverLetterId !== "none") {
        const coverLetter = await prisma.coverLetter.findFirst({
          where: {
            id: coverLetterId,
            userId: authResult.user.id,
          },
        });

        if (coverLetter) {
          coverLetterData = {
            title: coverLetter.title,
            jobTitle: coverLetter.jobTitle,
            companyName: coverLetter.companyName,
            recipientName: coverLetter.recipientName,
            language: coverLetter.language,
            tone: coverLetter.tone,
            generatedContent: coverLetter.generatedContent,
            sender: cv.personalInfo
              ? {
                  fullName: cv.personalInfo.fullName,
                  email: cv.personalInfo.email,
                  phone: cv.personalInfo.phone,
                  address: cv.personalInfo.address,
                }
              : {
                  fullName: authResult.user.name || "Bewerber",
                  email: authResult.user.email,
                  phone: null,
                  address: "Deutschland",
                },
          };
        }
      }

      const cvData: CvPdfData = {
        title: cv.title,
        language: cv.language,
        personalInfo: cv.personalInfo,
        experiences: cv.experiences,
        educations: cv.educations,
        skills: cv.skills,
        languages: cv.languages,
        certifications: cv.certifications,
        projects: cv.projects,
      };

      compiledPdfBytes = await compileApplicationDossier({
        cvData,
        coverLetterData,
        includeDeckblatt,
        photoBuffer,
        attachmentBuffers,
      });
    }

    const safeName = applicantName.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, "_");

    return new NextResponse(compiledPdfBytes as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Bewerbungsmappe_${safeName}.pdf"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: unknown) {
    console.error("[Dossier Compile Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to compile dossier PDF",
      },
      { status: 500 }
    );
  }
}
