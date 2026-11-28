import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import {
  FrenchCvData,
  formatFrenchHeaderName,
  getFrenchCvSectionOrder,
} from "../../lib/cv-fr";

interface FrenchCvPdfDocumentProps {
  data: FrenchCvData;
}

const createStyles = (isModern: boolean, accent: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 28,
      paddingBottom: 28,
      paddingHorizontal: 32,
      fontFamily: "Helvetica",
      fontSize: 9.5,
      lineHeight: 1.38,
      color: "#1e293b",
      backgroundColor: "#ffffff",
    },
    headerClassic: {
      borderBottomWidth: 1.5,
      borderBottomColor: "#0f172a",
      paddingBottom: 10,
      marginBottom: 12,
    },
    headerModern: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      borderBottomWidth: 2,
      borderBottomColor: accent,
      paddingBottom: 10,
      marginBottom: 12,
      gap: 12,
    },
    headerMain: {
      flex: 1,
    },
    nameText: {
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
      color: isModern ? accent : "#0f172a",
      marginBottom: 3,
      letterSpacing: 0.3,
    },
    jobTitleText: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: isModern ? "#334155" : "#1e293b",
      marginBottom: 6,
    },
    contactRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
    },
    contactItem: {
      fontSize: 8.8,
      color: "#475569",
      marginRight: 10,
      marginBottom: 2,
    },
    photoBox: {
      width: 64,
      height: 76,
      borderRadius: 4,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: accent,
    },
    photoImage: {
      width: 64,
      height: 76,
      objectFit: "cover",
    },
    section: {
      marginBottom: 11,
    },
    sectionTitle: {
      fontSize: 10.5,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
      letterSpacing: 0.7,
      color: isModern ? accent : "#0f172a",
      borderBottomWidth: isModern ? 1 : 0.75,
      borderBottomColor: isModern ? accent : "#cbd5e1",
      paddingBottom: 2.5,
      marginBottom: 6,
    },
    summaryText: {
      fontSize: 9.5,
      color: "#1e293b",
      lineHeight: 1.42,
      textAlign: "left",
    },
    entryBlock: {
      marginBottom: 7,
    },
    entryTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 8,
    },
    entryTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#0f172a",
      flex: 1,
    },
    entryPeriod: {
      fontSize: 8.8,
      fontFamily: "Helvetica-Bold",
      color: isModern ? accent : "#475569",
    },
    entrySubtitle: {
      fontSize: 9.2,
      fontFamily: "Helvetica-Oblique",
      color: "#475569",
      marginTop: 1,
      marginBottom: 2.5,
    },
    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 1.5,
      paddingLeft: 4,
    },
    bulletMarker: {
      width: 10,
      fontSize: 9.5,
      color: isModern ? accent : "#0f172a",
    },
    bulletText: {
      flex: 1,
      fontSize: 9.2,
      color: "#1e293b",
      lineHeight: 1.35,
    },
    detailsText: {
      fontSize: 9,
      color: "#334155",
      marginTop: 1.5,
    },
    skillGroupRow: {
      marginBottom: 4,
      flexDirection: "row",
      flexWrap: "wrap",
    },
    skillGroupLabel: {
      fontFamily: "Helvetica-Bold",
      fontSize: 9.2,
      color: "#0f172a",
    },
    skillGroupValue: {
      fontSize: 9.2,
      color: "#1e293b",
    },
    languagesList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    languageItem: {
      fontSize: 9.2,
      color: "#1e293b",
      marginRight: 14,
      marginBottom: 2,
    },
    languageName: {
      fontFamily: "Helvetica-Bold",
      color: "#0f172a",
    },
    interestsText: {
      fontSize: 9.2,
      color: "#1e293b",
    },
  });

export function FrenchCvPdfDocument({ data }: FrenchCvPdfDocumentProps) {
  const isModern = data.template === "maroc-modern";
  const accent = data.accentColor || "#1e3a5f";
  const styles = createStyles(isModern, accent);
  const fullName = formatFrenchHeaderName(data.header.firstName, data.header.lastName);

  const contactItems = [
    data.header.city?.trim(),
    data.header.phone?.trim(),
    data.header.email?.trim(),
    data.header.mobility?.trim(),
    data.header.drivingLicense?.trim(),
    data.header.linkedin?.trim(),
  ].filter((item): item is string => Boolean(item && item.length > 0));

  const showPhoto =
    isModern &&
    Boolean(data.header.showPhoto) &&
    Boolean(data.header.photoDataUrl && data.header.photoDataUrl.trim().length > 0);

  const validExperiences = data.experiences.filter(
    (exp) =>
      exp.role.trim() ||
      exp.company.trim() ||
      exp.bullets.some((b) => b.trim().length > 0)
  );

  const validEducations = data.educations.filter(
    (edu) => edu.degree.trim() || edu.institution.trim() || edu.year.trim()
  );

  const validLanguages = data.languages.filter(
    (lang) => lang.language.trim() || lang.level.trim()
  );

  const sectionOrder = getFrenchCvSectionOrder(data.educationFirst);

  const renderExperiences = () => {
    if (validExperiences.length === 0) return null;
    return (
      <View key="experience" style={styles.section}>
        <Text style={styles.sectionTitle}>Expériences Professionnelles</Text>
        {validExperiences.map((exp) => {
          const period = exp.current
            ? exp.startDate
              ? `${exp.startDate} – Présent`
              : "Présent"
            : [exp.startDate, exp.endDate].filter(Boolean).join(" – ");
          const cleanBullets = exp.bullets.map((b) => b.trim()).filter(Boolean);

          return (
            <View key={exp.id} style={styles.entryBlock} wrap={false}>
              <View style={styles.entryTopRow}>
                <Text style={styles.entryTitle}>{exp.role || "Poste"}</Text>
                {period ? <Text style={styles.entryPeriod}>{period}</Text> : null}
              </View>
              {(exp.company || exp.city) ? (
                <Text style={styles.entrySubtitle}>
                  {[exp.company, exp.city].filter(Boolean).join(" — ")}
                </Text>
              ) : null}
              {cleanBullets.map((bullet, idx) => (
                <View key={`${exp.id}-b-${idx}`} style={styles.bulletRow}>
                  <Text style={styles.bulletMarker}>•</Text>
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    );
  };

  const renderEducations = () => {
    if (validEducations.length === 0) return null;
    return (
      <View key="education" style={styles.section}>
        <Text style={styles.sectionTitle}>Formation</Text>
        {validEducations.map((edu) => (
          <View key={edu.id} style={styles.entryBlock} wrap={false}>
            <View style={styles.entryTopRow}>
              <Text style={styles.entryTitle}>{edu.degree || "Diplôme"}</Text>
              {edu.year ? <Text style={styles.entryPeriod}>{edu.year}</Text> : null}
            </View>
            {(edu.institution || edu.city) ? (
              <Text style={styles.entrySubtitle}>
                {[edu.institution, edu.city].filter(Boolean).join(" — ")}
              </Text>
            ) : null}
            {edu.details?.trim() ? (
              <Text style={styles.detailsText}>{edu.details.trim()}</Text>
            ) : null}
          </View>
        ))}
      </View>
    );
  };

  const hasSkills =
    data.skills.technicalSkills.length > 0 ||
    data.skills.softSkills.length > 0 ||
    data.skills.certifications.length > 0;

  return (
    <Document
      title={`CV - ${fullName}`}
      author={fullName}
      subject={data.header.jobTitle || "Curriculum Vitae"}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={isModern ? styles.headerModern : styles.headerClassic}>
          <View style={styles.headerMain}>
            <Text style={styles.nameText}>{fullName}</Text>
            {data.header.jobTitle?.trim() ? (
              <Text style={styles.jobTitleText}>{data.header.jobTitle.trim()}</Text>
            ) : null}
            {contactItems.length > 0 ? (
              <View style={styles.contactRow}>
                {contactItems.map((item, idx) => (
                  <Text key={`c-${idx}`} style={styles.contactItem}>
                    {item}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
          {showPhoto ? (
            <View style={styles.photoBox}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={data.header.photoDataUrl} style={styles.photoImage} />
            </View>
          ) : null}
        </View>

        {/* Profil Professionnel */}
        {data.summary?.trim() ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profil Professionnel</Text>
            <Text style={styles.summaryText}>{data.summary.trim()}</Text>
          </View>
        ) : null}

        {/* Ordered Sections: Formation / Expériences */}
        {sectionOrder.map((key) =>
          key === "education" ? renderEducations() : renderExperiences()
        )}

        {/* Compétences */}
        {hasSkills ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Compétences</Text>
            {data.skills.technicalSkills.length > 0 ? (
              <Text style={styles.skillGroupRow}>
                <Text style={styles.skillGroupLabel}>Compétences techniques : </Text>
                <Text style={styles.skillGroupValue}>
                  {data.skills.technicalSkills.join(" • ")}
                </Text>
              </Text>
            ) : null}
            {data.skills.softSkills.length > 0 ? (
              <Text style={styles.skillGroupRow}>
                <Text style={styles.skillGroupLabel}>Qualités personnelles : </Text>
                <Text style={styles.skillGroupValue}>
                  {data.skills.softSkills.join(" • ")}
                </Text>
              </Text>
            ) : null}
            {data.skills.certifications.length > 0 ? (
              <Text style={styles.skillGroupRow}>
                <Text style={styles.skillGroupLabel}>Certifications : </Text>
                <Text style={styles.skillGroupValue}>
                  {data.skills.certifications.join(" • ")}
                </Text>
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Langues */}
        {validLanguages.length > 0 ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Langues</Text>
            <View style={styles.languagesList}>
              {validLanguages.map((lang) => (
                <Text key={lang.id} style={styles.languageItem}>
                  <Text style={styles.languageName}>{lang.language}</Text>
                  {lang.level ? ` (${lang.level})` : ""}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {/* Centres d'intérêt & Vie associative */}
        {data.interests.length > 0 ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Centres d&apos;intérêt &amp; Vie associative</Text>
            <Text style={styles.interestsText}>{data.interests.join(" • ")}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
