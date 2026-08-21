import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

export interface DeckblattData {
  targetJobTitle?: string | null;
  companyName?: string | null;
  fullName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  photoUrl?: string | null;
  photoBuffer?: Uint8Array | Buffer | null;
  linkedinUrl?: string | null;
  xingUrl?: string | null;
  attachments?: string[];
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 45,
    fontFamily: "Helvetica",
    color: "#0f172a",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    textAlign: "left",
  },
  headerSection: {
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    paddingBottom: 15,
    marginBottom: 30,
    textAlign: "left",
  },
  subHeader: {
    fontSize: 12,
    color: "#64748b",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
    fontFamily: "Helvetica-Bold",
    textAlign: "left",
  },
  title: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 6,
    textAlign: "left",
  },
  company: {
    fontSize: 14,
    color: "#2563eb",
    fontFamily: "Helvetica",
    textAlign: "left",
  },
  centerContent: {
    display: "flex",
    flexDirection: "row",
    gap: 30,
    alignItems: "center",
    marginVertical: "auto",
    textAlign: "left",
  },
  centerContentNoPhoto: {
    display: "flex",
    flexDirection: "column",
    marginVertical: "auto",
    textAlign: "left",
    width: "100%",
  },
  photoContainer: {
    width: 140,
    height: 180,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  contactBox: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  contactBoxFull: {
    width: "100%",
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  contactName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 10,
  },
  contactItem: {
    fontSize: 10,
    color: "#475569",
    marginBottom: 5,
    lineHeight: 1.4,
  },
  contactLabel: {
    fontFamily: "Helvetica-Bold",
    color: "#334155",
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 15,
  },
  anlagenTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  anlagenList: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  anlageItem: {
    fontSize: 9,
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
  const defaultAttachments = data.attachments || [
    "Lebenslauf (Curriculum Vitae)",
    "Anschreiben (Cover Letter)",
    "Arbeitszeugnisse & Zertifikate",
    "Diplome & Nachweise",
  ];

  // Resolve image source: URL string or base64 data URL from buffer
  const imageSource =
    data.photoUrl ||
    (data.photoBuffer
      ? `data:${getImageMimeType(data.photoBuffer)};base64,${Buffer.from(data.photoBuffer).toString("base64")}`
      : null);

  return (
    <Page size="A4" style={styles.page}>
      {/* Header Banner */}
      <View style={styles.headerSection}>
        <Text style={styles.subHeader}>BEWERBUNGSUNTERLAGEN</Text>
        <Text style={styles.title}>
          {data.targetJobTitle ? `Bewerbung als ${data.targetJobTitle}` : "Bewerbung"}
        </Text>
        {data.companyName && (
          <Text style={styles.company}>bei {data.companyName}</Text>
        )}
      </View>

      {/* Middle Photo & Contact Information */}
      {imageSource ? (
        <View style={styles.centerContent}>
          <View style={styles.photoContainer}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={imageSource} style={styles.photo} />
          </View>

          <View style={styles.contactBox}>
            <Text style={styles.contactName}>{data.fullName}</Text>
            {data.address && (
              <Text style={styles.contactItem}>
                <Text style={styles.contactLabel}>Adresse: </Text>
                {data.address}
              </Text>
            )}
            {data.phone && (
              <Text style={styles.contactItem}>
                <Text style={styles.contactLabel}>Telefon: </Text>
                {data.phone}
              </Text>
            )}
            <Text style={styles.contactItem}>
              <Text style={styles.contactLabel}>E-Mail: </Text>
              {data.email}
            </Text>
            {data.linkedinUrl && (
              <Text style={styles.contactItem}>
                <Text style={styles.contactLabel}>LinkedIn: </Text>
                {data.linkedinUrl}
              </Text>
            )}
            {data.xingUrl && (
              <Text style={styles.contactItem}>
                <Text style={styles.contactLabel}>Xing: </Text>
                {data.xingUrl}
              </Text>
            )}
          </View>
        </View>
      ) : (
        /* Minimalist full-width layout when no photo is provided (no empty placeholder) */
        <View style={styles.centerContentNoPhoto}>
          <View style={styles.contactBoxFull}>
            <Text style={styles.contactName}>{data.fullName}</Text>
            {data.address && (
              <Text style={styles.contactItem}>
                <Text style={styles.contactLabel}>Adresse: </Text>
                {data.address}
              </Text>
            )}
            {data.phone && (
              <Text style={styles.contactItem}>
                <Text style={styles.contactLabel}>Telefon: </Text>
                {data.phone}
              </Text>
            )}
            <Text style={styles.contactItem}>
              <Text style={styles.contactLabel}>E-Mail: </Text>
              {data.email}
            </Text>
            {data.linkedinUrl && (
              <Text style={styles.contactItem}>
                <Text style={styles.contactLabel}>LinkedIn: </Text>
                {data.linkedinUrl}
              </Text>
            )}
            {data.xingUrl && (
              <Text style={styles.contactItem}>
                <Text style={styles.contactLabel}>Xing: </Text>
                {data.xingUrl}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Bottom Attachments (Anlagen) */}
      <View style={styles.bottomSection}>
        <Text style={styles.anlagenTitle}>ANLAGEN</Text>
        <View style={styles.anlagenList}>
          {defaultAttachments.map((item, idx) => (
            <Text key={idx} style={styles.anlageItem}>
              • {item}
            </Text>
          ))}
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

