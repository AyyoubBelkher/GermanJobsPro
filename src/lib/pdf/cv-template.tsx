import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";
import { DeckblattPage } from "./deckblatt-template";

/**
 * Safely resolves local font file paths on the Node.js server without leaking
 * Node built-in imports (`fs`, `path`) into client-side bundles.
 */
function resolveLocalFont(filename: string): string {
  if (typeof window === "undefined" && typeof process !== "undefined" && typeof process.cwd === "function") {
    try {
      // Server-only runtime resolution
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pathModule = require("path");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fsModule = require("fs");
      const localDiskPath = pathModule.resolve(process.cwd(), "public", "fonts", filename);
      if (fsModule.existsSync(localDiskPath)) {
        return localDiskPath;
      }
    } catch {
      // Fallback if filesystem access is restricted or during non-node execution
    }
  }
  return `/fonts/${filename}`;
}

// Single consolidated font registration for Amiri using local static assets
Font.register({
  family: "Amiri",
  fonts: [
    {
      src: resolveLocalFont("Amiri-Regular.ttf"),
      fontWeight: "normal",
    },
    {
      src: resolveLocalFont("Amiri-Bold.ttf"),
      fontWeight: "bold",
    },
    {
      src: resolveLocalFont("Amiri-Italic.ttf"),
      fontStyle: "italic",
    },
  ],
});

// Prevent breaking Arabic words with hyphens
Font.registerHyphenationCallback((word) => [word]);

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
    fontFamily: "Amiri",
    color: "#0f172a",
    fontSize: 9,
    lineHeight: 1.35,
    backgroundColor: "#ffffff",
    textAlign: "left",
  },
  rtlText: {
    textAlign: "right",
  },
  rtlRow: {
    flexDirection: "row-reverse",
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
  rtlHeaderInfo: {
    textAlign: "right",
    paddingRight: 0,
    paddingLeft: 14,
  },
  mainTitle: {
    fontSize: 18,
    fontFamily: "Amiri",
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: 0.5,
    marginBottom: 3,
    lineHeight: 1.2,
    textAlign: "left",
  },
  targetTitle: {
    fontSize: 11,
    fontFamily: "Amiri",
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
    fontSize: 8.5,
    color: "#475569",
    width: "48%",
    textAlign: "left",
    lineHeight: 1.3,
  },
  personalLabel: {
    fontFamily: "Amiri",
    fontWeight: "bold",
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
    fontSize: 10,
    fontFamily: "Amiri",
    fontWeight: "bold",
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
    lineHeight: 1.4,
    backgroundColor: "#f8fafc",
    padding: 6,
    marginBottom: 6,
    borderRadius: 3,
    borderLeftWidth: 2,
    borderLeftColor: "#3b82f6",
    textAlign: "left",
  },
  rtlSummaryText: {
    textAlign: "right",
    borderLeftWidth: 0,
    borderRightWidth: 2,
    borderRightColor: "#3b82f6",
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
    fontFamily: "Amiri",
    fontWeight: "bold",
    paddingRight: 8,
    textAlign: "left",
    lineHeight: 1.3,
  },
  rtlDateCol: {
    textAlign: "right",
    paddingRight: 0,
    paddingLeft: 8,
  },
  contentCol: {
    flex: 1,
    textAlign: "left",
  },
  entryTitle: {
    fontSize: 9.5,
    fontFamily: "Amiri",
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "left",
    lineHeight: 1.25,
  },
  entrySub: {
    fontSize: 8.5,
    color: "#2563eb",
    marginBottom: 2,
    textAlign: "left",
    lineHeight: 1.2,
  },
  entryDesc: {
    fontSize: 8.5,
    color: "#475569",
    lineHeight: 1.35,
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
    lineHeight: 1.3,
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
    fontFamily: "Amiri",
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "right",
  },
  signatureNameArabic: {
    fontSize: 8.5,
    fontFamily: "Amiri",
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "left",
  },
});

function formatDate(dateVal: Date | string | null | undefined, isCurrent?: boolean, isArabic = false): string {
  if (isCurrent) return isArabic ? "حتى الآن" : "heute";
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${year}`;
}

function formatFullDate(dateVal: Date | string | null | undefined): string {
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

  // Check if CV language is Arabic or contains Arabic characters
  const isArabic =
    cv.language === "ar" ||
    /[\u0600-\u06FF]/.test(
      fullName + (p?.summary || "") + (p?.targetJobTitle || "") + (p?.address || "")
    );

  const todayFormatted = new Date().toLocaleDateString(isArabic ? "ar-EG" : "de-DE", {
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
      <Page size="A4" style={[styles.page, isArabic ? styles.rtlText : undefined]}>
        {/* Header with Details & Photo */}
        <View style={[styles.header, isArabic ? styles.rtlRow : undefined]}>
          <View style={[styles.headerInfo, isArabic ? styles.rtlHeaderInfo : undefined]}>
            <Text style={[styles.mainTitle, isArabic ? styles.rtlText : undefined]}>{fullName}</Text>
            {p?.targetJobTitle && (
              <Text style={[styles.targetTitle, isArabic ? styles.rtlText : undefined]}>
                {p.targetJobTitle}
              </Text>
            )}

            <View style={[styles.personalGrid, isArabic ? styles.rtlRow : undefined]}>
              {p?.email && (
                <Text style={[styles.personalItem, isArabic ? styles.rtlText : undefined]}>
                  <Text style={styles.personalLabel}>
                    {isArabic ? "البريد الإلكتروني: " : "E-Mail: "}
                  </Text>
                  {p.email}
                </Text>
              )}
              {p?.phone && (
                <Text style={[styles.personalItem, isArabic ? styles.rtlText : undefined]}>
                  <Text style={styles.personalLabel}>{isArabic ? "الهاتف: " : "Telefon: "}</Text>
                  {p.phone}
                </Text>
              )}
              {p?.address && (
                <Text style={[styles.personalItem, isArabic ? styles.rtlText : undefined]}>
                  <Text style={styles.personalLabel}>{isArabic ? "العنوان: " : "Adresse: "}</Text>
                  {p.address}
                </Text>
              )}
              {p?.birthDate && (
                <Text style={[styles.personalItem, isArabic ? styles.rtlText : undefined]}>
                  <Text style={styles.personalLabel}>
                    {isArabic ? "تاريخ الميلاد: " : "Geboren: "}
                  </Text>
                  {formatFullDate(p.birthDate)}
                  {p.birthPlace ? (isArabic ? ` في ${p.birthPlace}` : ` in ${p.birthPlace}`) : ""}
                </Text>
              )}
              {p?.nationality && (
                <Text style={[styles.personalItem, isArabic ? styles.rtlText : undefined]}>
                  <Text style={styles.personalLabel}>
                    {isArabic ? "الجنسية: " : "Staatsangehörigkeit: "}
                  </Text>
                  {p.nationality}
                </Text>
              )}
              {p?.linkedinUrl && (
                <Text style={[styles.personalItem, isArabic ? styles.rtlText : undefined]}>
                  <Text style={styles.personalLabel}>LinkedIn: </Text>
                  {p.linkedinUrl}
                </Text>
              )}
              {p?.xingUrl && (
                <Text style={[styles.personalItem, isArabic ? styles.rtlText : undefined]}>
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
            <Text style={[styles.sectionTitle, isArabic ? styles.rtlText : undefined]}>
              {isArabic ? "الملف التعريفي" : "Kurzprofil"}
            </Text>
            <Text style={[styles.summaryText, isArabic ? styles.rtlSummaryText : undefined]}>
              {p.summary}
            </Text>
          </View>
        )}

        {/* Work Experience */}
        {cv.experiences && cv.experiences.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isArabic ? styles.rtlText : undefined]}>
              {isArabic ? "الخبرات المهنية" : "Berufserfahrung"}
            </Text>
            {cv.experiences.map((exp, idx) => (
              <View
                key={idx}
                style={[styles.entryRow, isArabic ? styles.rtlRow : undefined]}
                wrap={false}
              >
                <Text style={[styles.dateCol, isArabic ? styles.rtlDateCol : undefined]}>
                  {formatDate(exp.startDate, false, isArabic)} –{" "}
                  {formatDate(exp.endDate, exp.isCurrent, isArabic)}
                </Text>
                <View style={[styles.contentCol, isArabic ? styles.rtlText : undefined]}>
                  <Text style={[styles.entryTitle, isArabic ? styles.rtlText : undefined]}>
                    {exp.position}
                  </Text>
                  <Text style={[styles.entrySub, isArabic ? styles.rtlText : undefined]}>
                    {exp.company}
                    {exp.city ? `, ${exp.city}` : ""}
                  </Text>
                  {exp.description && (
                    <Text style={[styles.entryDesc, isArabic ? styles.rtlText : undefined]}>
                      {exp.description}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {cv.educations && cv.educations.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isArabic ? styles.rtlText : undefined]}>
              {isArabic ? "التعليم والمؤهلات" : "Ausbildung & Studium"}
            </Text>
            {cv.educations.map((edu, idx) => (
              <View
                key={idx}
                style={[styles.entryRow, isArabic ? styles.rtlRow : undefined]}
                wrap={false}
              >
                <Text style={[styles.dateCol, isArabic ? styles.rtlDateCol : undefined]}>
                  {formatDate(edu.startDate, false, isArabic)} –{" "}
                  {formatDate(edu.endDate, edu.isCurrent, isArabic)}
                </Text>
                <View style={[styles.contentCol, isArabic ? styles.rtlText : undefined]}>
                  <Text style={[styles.entryTitle, isArabic ? styles.rtlText : undefined]}>
                    {edu.degree}
                    {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}
                  </Text>
                  <Text style={[styles.entrySub, isArabic ? styles.rtlText : undefined]}>
                    {edu.institution}
                    {edu.city ? `, ${edu.city}` : ""}
                    {edu.grade ? ` • ${isArabic ? "التقدير: " : "Note: "}${edu.grade}` : ""}
                  </Text>
                  {edu.description && (
                    <Text style={[styles.entryDesc, isArabic ? styles.rtlText : undefined]}>
                      {edu.description}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {cv.skills && cv.skills.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={[styles.sectionTitle, isArabic ? styles.rtlText : undefined]}>
              {isArabic ? "المهارات والقدرات" : "Kenntnisse & Qualifikationen"}
            </Text>
            <View style={[styles.skillsContainer, isArabic ? styles.rtlRow : undefined]}>
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
            <Text style={[styles.sectionTitle, isArabic ? styles.rtlText : undefined]}>
              {isArabic ? "اللغات" : "Sprachkenntnisse"}
            </Text>
            <View style={[styles.languagesContainer, isArabic ? styles.rtlRow : undefined]}>
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
            <Text style={[styles.sectionTitle, isArabic ? styles.rtlText : undefined]}>
              {isArabic ? "الشهادات والدورات" : "Zertifikate & Weiterbildung"}
            </Text>
            {cv.certifications.map((cert, idx) => (
              <View
                key={idx}
                style={[styles.entryRow, isArabic ? styles.rtlRow : undefined]}
                wrap={false}
              >
                <Text style={[styles.dateCol, isArabic ? styles.rtlDateCol : undefined]}>
                  {cert.issueDate
                    ? formatDate(cert.issueDate, false, isArabic)
                    : isArabic
                    ? "شهادة"
                    : "Zertifikat"}
                </Text>
                <View style={[styles.contentCol, isArabic ? styles.rtlText : undefined]}>
                  <Text style={[styles.entryTitle, isArabic ? styles.rtlText : undefined]}>
                    {cert.name}
                  </Text>
                  <Text style={[styles.entrySub, isArabic ? styles.rtlText : undefined]}>
                    {cert.issuer}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {cv.projects && cv.projects.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={[styles.sectionTitle, isArabic ? styles.rtlText : undefined]}>
              {isArabic ? "المشاريع" : "Projekte"}
            </Text>
            {cv.projects.map((proj, idx) => (
              <View key={idx} style={styles.projectItem} wrap={false}>
                <Text style={[styles.entryTitle, isArabic ? styles.rtlText : undefined]}>
                  {proj.title}
                  {proj.role ? ` (${proj.role})` : ""}
                </Text>
                {proj.description && (
                  <Text style={[styles.entryDesc, isArabic ? styles.rtlText : undefined]}>
                    {proj.description}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Formal Closing Signature */}
        <View style={[styles.signatureSection, isArabic ? styles.rtlRow : undefined]} wrap={false}>
          <Text style={[styles.signatureLine, isArabic ? styles.rtlText : undefined]}>
            {isArabic ? `${city}، في ${todayFormatted}` : `${city}, den ${todayFormatted}`}
          </Text>
          <Text style={isArabic ? styles.signatureNameArabic : styles.signatureName}>
            {fullName}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
