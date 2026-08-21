import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { DeckblattPage } from "./deckblatt-template";

export interface CvPdfData {
  title: string;
  language?: string;
  personalInfo?: {
    fullName: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    photoUrl?: string | null;
    birthDate?: Date | string | null;
    birthPlace?: string | null;
    nationality?: string | null;
    targetJobTitle?: string | null;
    linkedinUrl?: string | null;
    xingUrl?: string | null;
    summary?: string | null;
  } | null;
  experiences: Array<{
    id?: string;
    company: string;
    position: string;
    city?: string | null;
    country?: string | null;
    startDate: Date | string;
    endDate?: Date | string | null;
    isCurrent?: boolean;
    description?: string | null;
  }>;
  educations: Array<{
    id?: string;
    institution: string;
    degree: string;
    fieldOfStudy?: string | null;
    city?: string | null;
    country?: string | null;
    startDate: Date | string;
    endDate?: Date | string | null;
    isCurrent?: boolean;
    grade?: string | null;
    description?: string | null;
  }>;
  skills: Array<{
    id?: string;
    name: string;
    category?: string | null;
    level?: string | null;
  }>;
  languages: Array<{
    id?: string;
    language: string;
    proficiency: string;
  }>;
  certifications?: Array<{
    id?: string;
    name: string;
    issuer: string;
    issueDate?: Date | string | null;
    credentialUrl?: string | null;
  }>;
  projects?: Array<{
    id?: string;
    title: string;
    role?: string | null;
    url?: string | null;
    description?: string | null;
  }>;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 22,
    paddingHorizontal: 28,
    fontFamily: "Helvetica",
    color: "#0f172a",
    fontSize: 8.5,
    lineHeight: 1.28,
    backgroundColor: "#ffffff",
    textAlign: "left",
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1.5,
    borderBottomColor: "#2563eb",
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerInfo: {
    flex: 1,
    paddingRight: 14,
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
  },
  mainTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    letterSpacing: 0.5,
    marginBottom: 3,
    lineHeight: 1.2,
    textAlign: "left",
  },
  targetTitle: {
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#2563eb",
    marginBottom: 5,
    lineHeight: 1.2,
    textAlign: "left",
  },
  personalGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    textAlign: "left",
  },
  personalItem: {
    fontSize: 8,
    color: "#475569",
    width: "48%",
    textAlign: "left",
    lineHeight: 1.25,
  },
  personalLabel: {
    fontFamily: "Helvetica-Bold",
    color: "#334155",
  },
  photoContainer: {
    width: 72,
    height: 90,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
  },
  photo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  section: {
    marginBottom: 6,
    textAlign: "left",
  },
  sectionTitle: {
    fontSize: 9.8,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 2,
    marginBottom: 4,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "left",
  },
  summaryText: {
    fontSize: 8.5,
    color: "#334155",
    lineHeight: 1.35,
    backgroundColor: "#f8fafc",
    padding: 6,
    marginBottom: 6,
    borderRadius: 3,
    borderLeftWidth: 2,
    borderLeftColor: "#3b82f6",
    textAlign: "left",
  },
  entryRow: {
    display: "flex",
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "flex-start",
  },
  dateCol: {
    width: 110,
    fontSize: 8.5,
    color: "#64748b",
    fontFamily: "Helvetica-Bold",
    paddingRight: 8,
    textAlign: "left",
    lineHeight: 1.28,
  },
  contentCol: {
    flex: 1,
    textAlign: "left",
  },
  entryTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "left",
    lineHeight: 1.22,
  },
  entrySub: {
    fontSize: 8.5,
    color: "#2563eb",
    marginBottom: 2,
    textAlign: "left",
    lineHeight: 1.18,
  },
  entryDesc: {
    fontSize: 8.5,
    color: "#475569",
    lineHeight: 1.32,
    textAlign: "left",
    marginBottom: 2.5,
  },
  skillsContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    textAlign: "left",
  },
  skillBadge: {
    fontSize: 8,
    backgroundColor: "#f1f5f9",
    color: "#1e293b",
    paddingVertical: 2.5,
    paddingHorizontal: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    textAlign: "left",
  },
  languagesContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    textAlign: "left",
  },
  languageItem: {
    fontSize: 8.5,
    color: "#334155",
    textAlign: "left",
    lineHeight: 1.28,
  },
  projectItem: {
    marginBottom: 6,
    textAlign: "left",
  },
  signatureSection: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  signatureLine: {
    fontSize: 8,
    color: "#64748b",
    fontStyle: "italic",
    textAlign: "left",
  },
  signatureName: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "right",
  },
});

function formatDate(dateVal: Date | string | null | undefined, isCurrent?: boolean): string {
  if (isCurrent) return "heute";
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${year}`;
}

function formatFullGermanDate(dateVal: Date | string | null | undefined): string {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function getCityLocation(address?: string | null): string {
  if (!address) return "Deutschland";
  const parts = address.split(",");
  return parts[0].trim();
}

export function CvDocument({
  cv,
  includeDeckblatt = false,
}: {
  cv: CvPdfData;
  includeDeckblatt?: boolean;
}) {
  const p = cv.personalInfo;
  const fullName = p?.fullName || "Bewerber";
  const city = getCityLocation(p?.address);
  const todayGerman = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Document title={`Lebenslauf_${fullName.replace(/\s+/g, "_")}`} author={fullName}>
      {/* Optional Deckblatt Page */}
      {includeDeckblatt && (
        <DeckblattPage
          data={{
            fullName,
            email: p?.email || "",
            phone: p?.phone,
            address: p?.address,
            photoUrl: p?.photoUrl,
            targetJobTitle: p?.targetJobTitle,
            linkedinUrl: p?.linkedinUrl,
            xingUrl: p?.xingUrl,
          }}
        />
      )}

      {/* Main CV Page(s) */}
      <Page size="A4" style={styles.page}>
        {/* Header with Details & Photo */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.mainTitle}>{fullName}</Text>
            {p?.targetJobTitle && (
              <Text style={styles.targetTitle}>{p.targetJobTitle}</Text>
            )}

            <View style={styles.personalGrid}>
              {p?.email && (
                <Text style={styles.personalItem}>
                  <Text style={styles.personalLabel}>E-Mail: </Text>
                  {p.email}
                </Text>
              )}
              {p?.phone && (
                <Text style={styles.personalItem}>
                  <Text style={styles.personalLabel}>Telefon: </Text>
                  {p.phone}
                </Text>
              )}
              {p?.address && (
                <Text style={styles.personalItem}>
                  <Text style={styles.personalLabel}>Adresse: </Text>
                  {p.address}
                </Text>
              )}
              {p?.birthDate && (
                <Text style={styles.personalItem}>
                  <Text style={styles.personalLabel}>Geboren: </Text>
                  {formatFullGermanDate(p.birthDate)}
                  {p.birthPlace ? ` in ${p.birthPlace}` : ""}
                </Text>
              )}
              {p?.nationality && (
                <Text style={styles.personalItem}>
                  <Text style={styles.personalLabel}>Staatsangehörigkeit: </Text>
                  {p.nationality}
                </Text>
              )}
              {p?.linkedinUrl && (
                <Text style={styles.personalItem}>
                  <Text style={styles.personalLabel}>LinkedIn: </Text>
                  {p.linkedinUrl}
                </Text>
              )}
              {p?.xingUrl && (
                <Text style={styles.personalItem}>
                  <Text style={styles.personalLabel}>Xing: </Text>
                  {p.xingUrl}
                </Text>
              )}
            </View>
          </View>

          {p?.photoUrl && (
            <View style={styles.photoContainer}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={p.photoUrl} style={styles.photo} />
            </View>
          )}
        </View>

        {/* Summary / Kurzprofil */}
        {p?.summary && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Kurzprofil</Text>
            <Text style={styles.summaryText}>{p.summary}</Text>
          </View>
        )}

        {/* Work Experience */}
        {cv.experiences && cv.experiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Berufserfahrung</Text>
            {cv.experiences.map((exp, idx) => (
              <View key={idx} style={styles.entryRow} wrap={false}>
                <Text style={styles.dateCol}>
                  {formatDate(exp.startDate)} – {formatDate(exp.endDate, exp.isCurrent)}
                </Text>
                <View style={styles.contentCol}>
                  <Text style={styles.entryTitle}>{exp.position}</Text>
                  <Text style={styles.entrySub}>
                    {exp.company}
                    {exp.city ? `, ${exp.city}` : ""}
                  </Text>
                  {exp.description && (
                    <Text style={styles.entryDesc}>{exp.description}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {cv.educations && cv.educations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ausbildung & Studium</Text>
            {cv.educations.map((edu, idx) => (
              <View key={idx} style={styles.entryRow} wrap={false}>
                <Text style={styles.dateCol}>
                  {formatDate(edu.startDate)} – {formatDate(edu.endDate, edu.isCurrent)}
                </Text>
                <View style={styles.contentCol}>
                  <Text style={styles.entryTitle}>
                    {edu.degree}
                    {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}
                  </Text>
                  <Text style={styles.entrySub}>
                    {edu.institution}
                    {edu.city ? `, ${edu.city}` : ""}
                    {edu.grade ? ` • Note: ${edu.grade}` : ""}
                  </Text>
                  {edu.description && (
                    <Text style={styles.entryDesc}>{edu.description}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {cv.skills && cv.skills.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Kenntnisse & Qualifikationen</Text>
            <View style={styles.skillsContainer}>
              {cv.skills.map((skill, idx) => (
                <Text key={idx} style={styles.skillBadge}>
                  {skill.name}
                  {skill.level ? ` (${skill.level})` : ""}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Languages (CEFR) */}
        {cv.languages && cv.languages.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Sprachkenntnisse</Text>
            <View style={styles.languagesContainer}>
              {cv.languages.map((lang, idx) => (
                <Text key={idx} style={styles.languageItem}>
                  <Text style={styles.personalLabel}>{lang.language}: </Text>
                  {lang.proficiency}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Certifications */}
        {cv.certifications && cv.certifications.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Zertifikate & Weiterbildung</Text>
            {cv.certifications.map((cert, idx) => (
              <View key={idx} style={styles.entryRow} wrap={false}>
                <Text style={styles.dateCol}>
                  {cert.issueDate ? formatDate(cert.issueDate) : "Zertifikat"}
                </Text>
                <View style={styles.contentCol}>
                  <Text style={styles.entryTitle}>{cert.name}</Text>
                  <Text style={styles.entrySub}>{cert.issuer}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {cv.projects && cv.projects.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Projekte</Text>
            {cv.projects.map((proj, idx) => (
              <View key={idx} style={styles.projectItem} wrap={false}>
                <Text style={styles.entryTitle}>
                  {proj.title}
                  {proj.role ? ` (${proj.role})` : ""}
                </Text>
                {proj.description && (
                  <Text style={styles.entryDesc}>{proj.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Formal German Closing Signature */}
        <View style={styles.signatureSection} wrap={false}>
          <Text style={styles.signatureLine}>
            {city}, den {todayGerman}
          </Text>
          <Text style={styles.signatureName}>{fullName}</Text>
        </View>
      </Page>
    </Document>
  );
}
