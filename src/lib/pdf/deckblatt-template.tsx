import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { containsArabic } from "./font-amiri";
import { extractCityFromAddress } from "../location";

export interface DeckblattData {
  targetJobTitle?: string | null;
  companyName?: string | null;
  fullName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  photoUrl?: string | null;
  photoBuffer?: Uint8Array | Buffer | null;
  photoBase64?: string | null;
  linkedinUrl?: string | null;
  xingUrl?: string | null;
  attachments?: string[];
}

export function getInitials(name: string): string {
  if (!name || typeof name !== "string") return "B";
  const cleaned = name.replace(/^(Dr\.|Prof\.|Herr|Frau|Mr\.|Ms\.|Mrs\.)\s+/i, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "B";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatGermanDate(d: Date = new Date()): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 24,
    paddingHorizontal: 45,
    fontFamily: "Helvetica",
    color: "#0f172a",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
  },
  topAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    flexDirection: "row",
  },
  topAccentNavy: {
    flex: 7,
    backgroundColor: "#0f172a",
    height: 5,
  },
  topAccentBlue: {
    flex: 3,
    backgroundColor: "#2563eb",
    height: 5,
  },
  headerSection: {
    alignItems: "center",
    textAlign: "center",
    marginBottom: 8,
  },
  trackingBadge: {
    fontSize: 11,
    letterSpacing: 4,
    color: "#2563eb",
    fontFamily: "Helvetica-Bold",
    fontWeight: "bold",
    textAlign: "center",
  },
  dividerLine: {
    width: 48,
    height: 2,
    backgroundColor: "#2563eb",
    marginVertical: 10,
  },
  mainTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    fontWeight: "bold",
    color: "#0f172a",
    lineHeight: 1.25,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#475569",
    fontFamily: "Helvetica",
    marginTop: 6,
    textAlign: "center",
  },
  middleSection: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginVertical: "auto",
  },
  photoContainer: {
    padding: 5,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  photoImage: {
    width: 130,
    height: 170,
    objectFit: "cover",
    borderRadius: 4,
  },
  monogramBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#eff6ff",
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
    alignItems: "center",
    justifyContent: "center",
  },
  monogramText: {
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
    textAlign: "center",
  },
  candidateName: {
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    letterSpacing: 0.5,
    marginTop: 18,
    textAlign: "center",
  },
  contactCard: {
    width: "82%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 14,
  },
  contactItem: {
    fontSize: 10,
    color: "#475569",
    marginBottom: 4,
    lineHeight: 1.4,
    textAlign: "center",
  },
  contactLabel: {
    fontFamily: "Helvetica-Bold",
    fontWeight: "bold",
    color: "#334155",
  },
  bottomSection: {
    width: "100%",
    marginTop: 10,
  },
  anlagenHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 8,
  },
  anlagenHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#cbd5e1",
  },
  anlagenHeaderText: {
    fontSize: 9.5,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
    letterSpacing: 2,
    paddingHorizontal: 12,
    textAlign: "center",
  },
  anlagenGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 6,
  },
  anlageItem: {
    width: "48%",
    marginBottom: 6,
    backgroundColor: "#f8fafc",
    borderLeftWidth: 2.5,
    borderLeftColor: "#2563eb",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  anlageBadge: {
    fontSize: 8.5,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    marginRight: 6,
  },
  anlageTitle: {
    fontSize: 9.5,
    color: "#1e293b",
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  footer: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 9,
    color: "#64748b",
    fontFamily: "Helvetica",
  },
});

function getImageMimeType(buf: Uint8Array | Buffer): string {
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return "image/png";
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    return "image/jpeg";
  }
  return "image/jpeg";
}

export function DeckblattPage({ data }: { data: DeckblattData }) {
  const defaultAttachments =
    data.attachments && data.attachments.length > 0
      ? data.attachments
      : [
          "Lebenslauf (Curriculum Vitae)",
          "Anschreiben (Cover Letter)",
          "Arbeitszeugnisse & Zertifikate",
          "Diplome & Nachweise",
        ];

  const hasArabic = containsArabic(
    data.targetJobTitle,
    data.companyName,
    data.fullName,
    data.address,
    data.phone,
    data.email,
    ...(data.attachments || [])
  );

  // Resolve image source: data.photoBase64 || data.photoUrl || data.photoBuffer
  let imageSource: string | null = null;
  if (data.photoBase64 && typeof data.photoBase64 === "string" && data.photoBase64.trim() !== "") {
    const trimmed = data.photoBase64.trim();
    imageSource =
      trimmed.startsWith("data:") || trimmed.startsWith("http")
        ? trimmed
        : `data:image/png;base64,${trimmed}`;
  } else if (data.photoUrl && typeof data.photoUrl === "string" && data.photoUrl.trim() !== "") {
    imageSource = data.photoUrl.trim();
  } else if (data.photoBuffer && data.photoBuffer.byteLength > 0) {
    imageSource = `data:${getImageMimeType(data.photoBuffer)};base64,${Buffer.from(data.photoBuffer).toString("base64")}`;
  }

  const trackingText = data.targetJobTitle ? "BEWERBUNG" : "BEWERBUNGSUNTERLAGEN";
  const mainTitleText = data.targetJobTitle ? `als ${data.targetJobTitle}` : "Bewerbungsmappe";
  const city = data.address ? extractCityFromAddress(data.address, "") : "";
  const todayFormatted = formatGermanDate();
  const dateFooterString = city ? `${city}, ${todayFormatted}` : todayFormatted;

  return (
    <Page size="A4" wrap={false} style={[styles.page, hasArabic ? { fontFamily: "Amiri" } : undefined]}>
      {/* Top Accent Bar */}
      <View style={styles.topAccentBar}>
        <View style={styles.topAccentNavy} />
        <View style={styles.topAccentBlue} />
      </View>

      {/* Centered Header Section */}
      <View style={styles.headerSection}>
        <Text style={[styles.trackingBadge, hasArabic ? { fontFamily: "Amiri", fontWeight: "bold" } : undefined]}>
          {trackingText}
        </Text>
        <View style={styles.dividerLine} />
        <Text style={[styles.mainTitle, hasArabic ? { fontFamily: "Amiri", fontWeight: "bold" } : undefined]}>
          {mainTitleText}
        </Text>
        {data.companyName && (
          <Text style={[styles.subtitle, hasArabic ? { fontFamily: "Amiri" } : undefined]}>
            bei {data.companyName}
          </Text>
        )}
      </View>

      {/* Middle Candidate Identity Block */}
      <View style={styles.middleSection}>
        {imageSource ? (
          <View style={styles.photoContainer}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={imageSource} style={styles.photoImage} />
          </View>
        ) : (
          <View style={styles.monogramBadge}>
            <Text style={[styles.monogramText, hasArabic ? { fontFamily: "Amiri", fontWeight: "bold" } : undefined]}>
              {getInitials(data.fullName)}
            </Text>
          </View>
        )}

        <Text style={[styles.candidateName, hasArabic ? { fontFamily: "Amiri", fontWeight: "bold" } : undefined]}>
          {data.fullName}
        </Text>

        {/* Centered Structured Contact Card */}
        <View style={styles.contactCard}>
          {data.address && (
            <Text style={[styles.contactItem, hasArabic ? { fontFamily: "Amiri" } : undefined]}>
              <Text style={[styles.contactLabel, hasArabic ? { fontFamily: "Amiri", fontWeight: "bold" } : undefined]}>
                Adresse:{" "}
              </Text>
              {data.address}
            </Text>
          )}
          {data.phone && (
            <Text style={[styles.contactItem, hasArabic ? { fontFamily: "Amiri" } : undefined]}>
              <Text style={[styles.contactLabel, hasArabic ? { fontFamily: "Amiri", fontWeight: "bold" } : undefined]}>
                Telefon:{" "}
              </Text>
              {data.phone}
            </Text>
          )}
          {data.email && (
            <Text style={[styles.contactItem, hasArabic ? { fontFamily: "Amiri" } : undefined]}>
              <Text style={[styles.contactLabel, hasArabic ? { fontFamily: "Amiri", fontWeight: "bold" } : undefined]}>
                E-Mail:{" "}
              </Text>
              {data.email}
            </Text>
          )}
          {data.linkedinUrl && (
            <Text style={[styles.contactItem, hasArabic ? { fontFamily: "Amiri" } : undefined]}>
              <Text style={[styles.contactLabel, hasArabic ? { fontFamily: "Amiri", fontWeight: "bold" } : undefined]}>
                LinkedIn:{" "}
              </Text>
              {data.linkedinUrl}
            </Text>
          )}
          {data.xingUrl && (
            <Text style={[styles.contactItem, hasArabic ? { fontFamily: "Amiri" } : undefined]}>
              <Text style={[styles.contactLabel, hasArabic ? { fontFamily: "Amiri", fontWeight: "bold" } : undefined]}>
                Xing:{" "}
              </Text>
              {data.xingUrl}
            </Text>
          )}
        </View>
      </View>

      {/* Bottom Attachments Directory (Anlagenverzeichnis) & Footer */}
      <View style={styles.bottomSection}>
        <View style={styles.anlagenHeaderContainer}>
          <View style={styles.anlagenHeaderLine} />
          <Text style={[styles.anlagenHeaderText, hasArabic ? { fontFamily: "Amiri", fontWeight: "bold" } : undefined]}>
            INHALT DER BEWERBUNGSMAPPE
          </Text>
          <View style={styles.anlagenHeaderLine} />
        </View>

        <View style={styles.anlagenGrid}>
          {defaultAttachments.map((item, idx) => (
            <View key={idx} style={styles.anlageItem}>
              <Text style={[styles.anlageBadge, hasArabic ? { fontFamily: "Amiri", fontWeight: "bold" } : undefined]}>
                {String(idx + 1).padStart(2, "0")}
              </Text>
              <Text
                style={[styles.anlageTitle, hasArabic ? { fontFamily: "Amiri", fontWeight: "bold" } : undefined]}
              >
                {item}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, hasArabic ? { fontFamily: "Amiri" } : undefined]}>
            Bewerbungsdossier • {data.fullName}
          </Text>
          <Text style={[styles.footerText, hasArabic ? { fontFamily: "Amiri" } : undefined]}>
            {dateFooterString}
          </Text>
        </View>
      </View>
    </Page>
  );
}

export function DeckblattDocument({ data }: { data: DeckblattData }) {
  return (
    <Document title={`Deckblatt_${data.fullName.replace(/\s+/g, "_")}`} author={data.fullName}>
      <DeckblattPage data={data} />
    </Document>
  );
}
