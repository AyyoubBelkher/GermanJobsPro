import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface CoverLetterPdfData {
  title: string;
  jobTitle: string;
  companyName: string;
  recipientName?: string | null;
  language?: string;
  tone?: string;
  generatedContent: string;
  sender?: {
    fullName: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
  } | null;
  applicantCity?: string | null;
  applicantAddress?: string | null;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 45,
    paddingBottom: 45,
    paddingHorizontal: 45,
    fontFamily: "Helvetica",
    color: "#0f172a",
    fontSize: 10,
    lineHeight: 1.5,
    backgroundColor: "#ffffff",
    textAlign: "left",
  },
  returnAddressLine: {
    fontSize: 7.5,
    color: "#64748b",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 3,
    marginBottom: 20,
    textAlign: "left",
  },
  recipientBox: {
    marginBottom: 24,
    minHeight: 60,
    textAlign: "left",
  },
  recipientCompany: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 2,
    textAlign: "left",
  },
  recipientPerson: {
    fontSize: 9.5,
    color: "#334155",
    marginBottom: 2,
    textAlign: "left",
  },
  recipientAddress: {
    fontSize: 9.5,
    color: "#475569",
    textAlign: "left",
  },
  dateLine: {
    fontSize: 9,
    color: "#475569",
    textAlign: "right",
    marginBottom: 16,
  },
  subjectLine: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 16,
    textAlign: "left",
  },
  bodyParagraph: {
    fontSize: 9.5,
    color: "#1e293b",
    lineHeight: 1.5,
    marginBottom: 10,
    textAlign: "left",
  },
  closingSection: {
    marginTop: 20,
    textAlign: "left",
  },
  closingText: {
    fontSize: 9.5,
    color: "#1e293b",
    marginBottom: 35, // Space for handwritten signature
    textAlign: "left",
  },
  senderName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "left",
  },
  anlagenText: {
    marginTop: 30,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textAlign: "left",
  },
});

/**
 * Cleanly extracts the city name from a given address string.
 * e.g.:
 *  "Avenue Hassan II, Taounate, Morocco" => "Taounate"
 *  "Musterstraße 12, 10115 Berlin, Deutschland" => "Berlin"
 *  "Taounate, Morocco" => "Taounate"
 *  "10115 Berlin" => "Berlin"
 */
export function extractCityFromAddress(address?: string | null): string {
  if (!address || !address.trim()) return "Deutschland";

  const raw = address.trim();
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].replace(/^\d{4,5}\s+/, "").trim() || parts[0];
  }

  const isStreetPattern =
    /\b(?:stra(?:ß|ss)e|str\.?|avenue|ave\.?|rue|road|rd\.?|boulevard|blvd\.?|weg|platz|gasse|hay|residence|appt\.?|n°|\d+)\b/i;

  if (isStreetPattern.test(parts[0]) && parts.length >= 2) {
    const candidate = parts[1].replace(/^\d{4,5}\s+/, "").trim();
    if (candidate) return candidate;
  }

  const isCountryPattern =
    /^(?:Deutschland|Germany|Morocco|Maroc|المغرب|ألمانيا|France|Schweiz|Österreich|Austria|Switzerland)$/i;

  if (!isCountryPattern.test(parts[0])) {
    return parts[0].replace(/^\d{4,5}\s+/, "").trim();
  }

  return parts[0];
}

/**
 * Cleans raw generated cover letter markdown/text to prevent duplicate
 * headers, salutation issues, and trailing closing blocks in the PDF.
 */
export function cleanCoverLetterContent(rawContent: string): string[] {
  if (!rawContent) return [];

  // Normalize line endings and remove basic markdown styling
  let text = rawContent
    .replace(/\r\n/g, "\n")
    .replace(/^#+\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/__/g, "")
    .trim();

  // 1. Locate the first formal salutation line
  // If found, slice and discard EVERYTHING before that salutation line
  // so AI-generated address blocks, dates, and subjects never duplicate the template's layout header
  const salutationRegex =
    /(?:^|\n)\s*(?:Sehr\s+geehrte[rn]?\s+(?:Frau|Herr|Damen)|Sehr\s+geehrte[rn]?\b|Guten\s+Tag\b|Hallo\s+|Dear\s+|To\s+whom\s+it\s+may\s+concern|السيد[ة]?\s+|تحية\s+طيبة|إلى\s+من\s+يهمه\s+الأمر)/i;

  const salutationMatch = text.match(salutationRegex);

  if (salutationMatch && salutationMatch.index !== undefined) {
    text = text.slice(salutationMatch.index).trim();
  } else {
    // Fallback: strip leading subject/reference lines iteratively
    const leadingSubjectOrRefRegex =
      /^\s*(?:(?:Betreff|Subject|Re)\s*:\s*)?(?:(?:Bewerbung\s+(?:als|für|fuer|um|auf|nach)\b|Application\s+(?:for|as)\b|طلب\s+توظيف\s*(?:كـ?|في)?)[^\n]*|(?:Betreff|Subject)\s*:[^\n]*|(?:Referenz(?:nummer)?|Ref\.?-?Nr\.?|Kennziffer|Job-?ID)\s*:[^\n]*|Ihre\s+Stellen(?:ausschreibung|anzeige)\s+[^\n]*)(?:\n+|$)/i;

    let prevText = "";
    while (text !== prevText) {
      prevText = text;
      text = text.replace(leadingSubjectOrRefRegex, "").trim();
    }
  }

  // Trailing attachments pattern
  const trailingAttachmentsRegex =
    /(?:\n+|^)\s*(?:Anlagen?|\[Anlagen?\]|Attachments?|مرفقات|المرفقات)\s*:?\s*$/i;
  text = text.replace(trailingAttachmentsRegex, "").trim();

  // Trailing closing phrases pattern
  // Matches formal closing greetings (e.g. "Mit freundlichen Grüßen", "Best regards", etc.)
  // and strips everything from that closing line to the end of the text (including signature/name lines)
  const trailingClosingRegex =
    /(?:\n+|^)\s*(?:Mit\s+freundlichen\s+Gr(?:ü|ue|u)(?:ß|ss)(?:en|e)?|Mit\s+freundlichem\s+Gr(?:ü|ue|u)(?:ß|ss)|Mit\s+besten\s+Gr(?:ü|ue|u)(?:ß|ss)(?:en|e)?|Herzliche\s+Gr(?:ü|ue|u)(?:ß|ss)(?:en|e)?|Freundliche\s+Gr(?:ü|ue|u)(?:ß|ss)(?:en|e)?|Beste\s+Gr(?:ü|ue|u)(?:ß|ss)(?:en|e)?|Viele\s+Gr(?:ü|ue|u)(?:ß|ss)(?:en|e)?|Liebe\s+Gr(?:ü|ue|u)(?:ß|ss)(?:en|e)?|Schöne\s+Gr(?:ü|ue|u)(?:ß|ss)(?:en|e)?|Hochachtungsvoll|Mit\s+vorz(?:ü|ue|u)glicher\s+Hochachtung|Sincerely(?:\s+yours)?|Yours\s+(?:sincerely|faithfully)|Best\s+regards|Kind\s+regards|Warm\s+regards|Regards|مع\s+خالص\s+التحيات|مع\s+أطيب\s+التحيات|مع\s+فائق\s+الاحترام(?:\s+والتقدير)?|وتفضلوا\s+بقبول\s+فائق\s+الاحترام(?:\s+والتقدير)?|وتفضلوا\s+بقبول\s+خالص\s+التحية(?:\s+والتقدير)?|تحياتي\s+الخالصة)\s*[,.!]?[\s\S]*$/i;

  text = text.replace(trailingClosingRegex, "").trim();
  text = text.replace(trailingAttachmentsRegex, "").trim();

  // Split into paragraphs separated by one or more blank lines
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Additional sanity filter on paragraphs
  const filteredParagraphs = paragraphs.filter((p, index) => {
    // If the first paragraph is still somehow only a subject line
    if (
      index === 0 &&
      /^(?:(?:Betreff|Subject|Re)\s*:\s*)?Bewerbung\s+(?:als|für|fuer|um|auf)\b/i.test(p)
    ) {
      return false;
    }
    // If the last paragraph is purely a closing greeting or signature placeholder
    if (
      index === paragraphs.length - 1 &&
      /^(?:Mit\s+freundlichen\s+Gr(?:ü|ue|u)(?:ß|ss)(?:en|e)?|Mit\s+freundlichem\s+Gr(?:ü|ue|u)(?:ß|ss)|Mit\s+besten\s+Gr(?:ü|ue|u)(?:ß|ss)(?:en|e)?|Herzliche\s+Gr(?:ü|ue|u)(?:ß|ss)(?:en|e)?|Freundliche\s+Gr(?:ü|ue|u)(?:ß|ss)(?:en|e)?|Beste\s+Gr(?:ü|ue|u)(?:ß|ss)(?:en|e)?|Viele\s+Gr(?:ü|ue|u)(?:ß|ss)(?:en|e)?|Sincerely|Best\s+regards|Kind\s+regards|Regards|مع\s+خالص\s+التحيات|Anlagen?|\[.*\])$/i.test(
        p
      )
    ) {
      return false;
    }
    return true;
  });

  return filteredParagraphs;
}

export function CoverLetterDocument({ data }: { data: CoverLetterPdfData }) {
  const senderName = data.sender?.fullName || "Bewerber";
  const senderAddress = data.sender?.address || "Deutschland";
  const senderEmail = data.sender?.email || "";
  const senderPhone = data.sender?.phone ? ` • ${data.sender.phone}` : "";

  // Extract city cleanly for the date line (avoiding street names like "Avenue Hassan II")
  const city =
    data.applicantCity ||
    data.sender?.city ||
    extractCityFromAddress(senderAddress);

  const todayGerman = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Clean and split body text into paragraphs
  const paragraphs = cleanCoverLetterContent(data.generatedContent || "");

  return (
    <Document
      title={`Anschreiben_${data.companyName.replace(/\s+/g, "_")}`}
      author={senderName}
    >
      <Page size="A4" style={styles.page}>
        {/* DIN 5008 Absenderzeile (Return Address Header) */}
        <Text style={styles.returnAddressLine}>
          {senderName} • {senderAddress} • {senderEmail}
          {senderPhone}
        </Text>

        {/* DIN 5008 Empfängerfeld (Recipient Box) */}
        <View style={styles.recipientBox}>
          <Text style={styles.recipientCompany}>{data.companyName}</Text>
          {data.recipientName && (
            <Text style={styles.recipientPerson}>{data.recipientName}</Text>
          )}
          <Text style={styles.recipientAddress}>Deutschland</Text>
        </View>

        {/* Datum (Date right-aligned) */}
        <Text style={styles.dateLine}>
          {city}, den {todayGerman}
        </Text>

        {/* Betreffzeile (Bold Subject Line) */}
        <Text style={styles.subjectLine}>
          Bewerbung als {data.jobTitle}
        </Text>

        {/* Body Paragraphs */}
        {paragraphs.map((pText, idx) => (
          <Text key={idx} style={styles.bodyParagraph}>
            {pText}
          </Text>
        ))}

        {/* Formal Closing & Signature Space */}
        <View style={styles.closingSection} wrap={false}>
          <Text style={styles.closingText}>Mit freundlichen Grüßen</Text>
          <Text style={styles.senderName}>{senderName}</Text>
        </View>

        {/* Anlagen Note */}
        <Text style={styles.anlagenText}>Anlagen</Text>
      </Page>
    </Document>
  );
}
