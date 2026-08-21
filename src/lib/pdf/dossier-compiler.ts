import React from "react";
import { PDFDocument, ParseSpeeds } from "pdf-lib";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { CvDocument, CvPdfData } from "./cv-template";
import { CoverLetterDocument, CoverLetterPdfData } from "./cover-letter-template";
import { DeckblattDocument, DeckblattData } from "./deckblatt-template";

export interface DossierAttachment {
  name: string;
  buffer: Uint8Array | Buffer;
}

export interface CompileDossierParams {
  cvData?: CvPdfData | null;
  cvPdfBuffer?: Uint8Array | Buffer | null;
  coverLetterData?: CoverLetterPdfData | null;
  includeDeckblatt?: boolean;
  deckblattMetadata?: DeckblattData | null;
  photoBuffer?: Uint8Array | Buffer | null;
  attachmentBuffers?: DossierAttachment[];
}

/**
 * Compiles a complete German Application Dossier ("Vollständige Bewerbungsmappe")
 * in strict German recruitment order:
 * 1. Deckblatt (Application Cover Page - optional)
 * 2. Anschreiben (DIN 5008 Cover Letter - optional)
 * 3. Lebenslauf (DIN 5008 Tabular CV or direct uploaded CV PDF)
 * 4. Anlagen & Zeugnisse (Merged PDF certificates, diplomas, references)
 */
export async function compileBewerbungsmappe({
  cvData,
  cvPdfBuffer,
  coverLetterData,
  includeDeckblatt = true,
  deckblattMetadata,
  photoBuffer,
  attachmentBuffers = [],
}: CompileDossierParams): Promise<Uint8Array> {
  const masterPdf = await PDFDocument.create();

  // 1. Deckblatt (Cover Page)
  if (includeDeckblatt) {
    const defaultAnlagenList: string[] = ["Lebenslauf (Tabellarisch)"];
    if (coverLetterData) defaultAnlagenList.unshift("Anschreiben");
    if (attachmentBuffers.length > 0) {
      attachmentBuffers.forEach((att) => defaultAnlagenList.push(att.name.replace(/\.pdf$/i, "")));
    } else {
      defaultAnlagenList.push("Arbeitszeugnisse & Nachweise");
    }

    const deckblattData: DeckblattData = deckblattMetadata || {
      fullName: cvData?.personalInfo?.fullName || "Bewerber",
      email: cvData?.personalInfo?.email || "",
      phone: cvData?.personalInfo?.phone,
      address: cvData?.personalInfo?.address,
      photoUrl: cvData?.personalInfo?.photoUrl,
      targetJobTitle: coverLetterData?.jobTitle || cvData?.personalInfo?.targetJobTitle,
      companyName: coverLetterData?.companyName,
      linkedinUrl: cvData?.personalInfo?.linkedinUrl,
      xingUrl: cvData?.personalInfo?.xingUrl,
      attachments: defaultAnlagenList,
    };

    if (photoBuffer) {
      deckblattData.photoBuffer = photoBuffer;
    }

    if (!deckblattData.attachments || deckblattData.attachments.length === 0) {
      deckblattData.attachments = defaultAnlagenList;
    }

    const deckblattElement = React.createElement(DeckblattDocument, {
      data: deckblattData,
    }) as unknown as React.ReactElement<DocumentProps>;

    const deckblattBuffer = await renderToBuffer(deckblattElement);
    const deckblattDoc = await PDFDocument.load(deckblattBuffer, {
      parseSpeed: ParseSpeeds.Fast,
    });
    const copiedPages = await masterPdf.copyPages(deckblattDoc, deckblattDoc.getPageIndices());
    copiedPages.forEach((page) => masterPdf.addPage(page));
  }

  // 2. Anschreiben (Cover Letter)
  if (coverLetterData) {
    const coverLetterElement = React.createElement(CoverLetterDocument, {
      data: coverLetterData,
    }) as unknown as React.ReactElement<DocumentProps>;

    const coverLetterBuffer = await renderToBuffer(coverLetterElement);
    const coverLetterDoc = await PDFDocument.load(coverLetterBuffer, {
      parseSpeed: ParseSpeeds.Fast,
    });
    const copiedPages = await masterPdf.copyPages(coverLetterDoc, coverLetterDoc.getPageIndices());
    copiedPages.forEach((page) => masterPdf.addPage(page));
  }

  // 3. Lebenslauf (CV)
  if (cvPdfBuffer) {
    try {
      const cvPdfDoc = await PDFDocument.load(cvPdfBuffer, {
        ignoreEncryption: true,
        parseSpeed: ParseSpeeds.Fast,
      });
      const copiedPages = await masterPdf.copyPages(cvPdfDoc, cvPdfDoc.getPageIndices());
      copiedPages.forEach((page) => masterPdf.addPage(page));
    } catch (err: unknown) {
      console.error("[Dossier Compile Error - Uploaded CV]:", err);
      throw new Error(
        "Failed to merge uploaded CV PDF document. The file may be password-protected or corrupted."
      );
    }
  } else if (cvData) {
    const cvElement = React.createElement(CvDocument, {
      cv: cvData,
      includeDeckblatt: false,
    }) as unknown as React.ReactElement<DocumentProps>;

    const cvBuffer = await renderToBuffer(cvElement);
    const cvDoc = await PDFDocument.load(cvBuffer, {
      parseSpeed: ParseSpeeds.Fast,
    });
    const cvPages = await masterPdf.copyPages(cvDoc, cvDoc.getPageIndices());
    cvPages.forEach((page) => masterPdf.addPage(page));
  }

  // 4. Anlagen & Zeugnisse (Candidate Attachments)
  for (const attachment of attachmentBuffers) {
    try {
      const attachmentDoc = await PDFDocument.load(attachment.buffer, {
        ignoreEncryption: true,
        parseSpeed: ParseSpeeds.Fast,
      });
      const pages = await masterPdf.copyPages(attachmentDoc, attachmentDoc.getPageIndices());
      pages.forEach((page) => masterPdf.addPage(page));
    } catch (err: unknown) {
      console.error(`[Dossier Compile Error - Attachment "${attachment.name}"]:`, err);
      throw new Error(
        `Failed to merge PDF attachment "${attachment.name}". The file may be password-protected or corrupted.`
      );
    }
  }

  const mergedPdfBytes = await masterPdf.save();
  return mergedPdfBytes;
}

export const compileApplicationDossier = compileBewerbungsmappe;
