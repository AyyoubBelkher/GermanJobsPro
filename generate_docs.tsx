import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToFile } from "@react-pdf/renderer";
import path from "path";
import os from "os";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#0f172a",
    lineHeight: 1.45,
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    paddingBottom: 8,
    marginBottom: 14,
  },
  mainTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
    marginBottom: 3,
  },
  subTitle: {
    fontSize: 9.5,
    color: "#64748b",
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 3,
    marginBottom: 6,
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  paragraph: {
    fontSize: 8.8,
    color: "#334155",
    marginBottom: 4,
    lineHeight: 1.4,
  },
  bulletItem: {
    fontSize: 8.5,
    color: "#334155",
    marginBottom: 3,
    paddingLeft: 8,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  badgeContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginVertical: 4,
  },
  badge: {
    fontSize: 7.5,
    backgroundColor: "#f1f5f9",
    color: "#1e293b",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
  },
  table: {
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    borderRadius: 3,
  },
  tableRow: {
    display: "flex",
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    padding: 4,
  },
  tableHeader: {
    backgroundColor: "#f8fafc",
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  col1: { width: "30%", fontSize: 8 },
  col2: { width: "70%", fontSize: 8 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 4,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: "#94a3b8",
  },
});

const DocumentationPDF = () => (
  <Document title="GermanJobsPro Technical Blueprint" author="GermanJobsPro Team">
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>GermanJobsPro SaaS - Technical & Architecture Blueprint</Text>
        <Text style={styles.subTitle}>Full System Specification, DIN 5008 Engine & Production Review</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Project Vision & Core Capabilities</Text>
        <Text style={styles.paragraph}>
          GermanJobsPro is a specialized full-stack SaaS ecosystem engineered to empower international job seekers and Ausbildung applicants targeting the German job market. It delivers strict compliance with German application standards (DIN 5008) and Applicant Tracking Systems (ATS).
        </Text>
        <View style={styles.badgeContainer}>
          <Text style={styles.badge}>Next.js App Router</Text>
          <Text style={styles.badge}>TypeScript</Text>
          <Text style={styles.badge}>Google Gemini 2.5/Flash</Text>
          <Text style={styles.badge}>Prisma ORM</Text>
          <Text style={styles.badge}>React-PDF & pdf-lib</Text>
          <Text style={styles.badge}>CapRover & Docker</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Tech Stack Architecture</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.col1}>Component Layer</Text>
            <Text style={styles.col2}>Technologies & Responsibility</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.col1}>Frontend UI/UX</Text>
            <Text style={styles.col2}>Next.js (App Router), Tailwind CSS, Lucide Icons, Responsive Layouts.</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.col1}>AI & Document Parsing</Text>
            <Text style={styles.col2}>Google Gemini API, unpdf fast server-side extraction, prompt guardrails.</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.col1}>PDF Generation & Merge</Text>
            <Text style={styles.col2}>@react-pdf/renderer (Vector PDF) + pdf-lib (Multi-page binary merger).</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.col1}>Data & Subscriptions</Text>
            <Text style={styles.col2}>PostgreSQL / SQLite, Prisma ORM, Lemon Squeezy Webhooks (Idempotent).</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.col1}>DevOps & Hosting</Text>
            <Text style={styles.col2}>Self-hosted Dockerized VPS via CapRover, Automated Zero-Downtime Builds.</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Core Functional Modules</Text>
        <Text style={styles.bulletItem}>
          • <Text style={styles.bold}>DIN 5008 Cover Letter Studio (Anschreiben):</Text> Ingests candidate CVs (via saved DB profile or uploaded PDF) to tailor targeted German cover letters matching job postings. Auto-cleans AI output to prevent duplicate letterheads and closings.
        </Text>
        <Text style={styles.bulletItem}>
          • <Text style={styles.bold}>Dossier Compiler (Bewerbungsmappe Studio):</Text> Merges Cover Page (Deckblatt) + Anschreiben + CV (Lebenslauf) + Certificates (Zeugnisse) in standardized German recruitment order into a single PDF document.
        </Text>
        <Text style={styles.bulletItem}>
          • <Text style={styles.bold}>Interactive AI CV Copilot:</Text> Real-time Moroccan Darija / Arabic to German professional translator and career consultant following DIN 5008.
        </Text>
        <Text style={styles.bulletItem}>
          • <Text style={styles.bold}>ATS Audit Engine:</Text> Analyzes CVs against German employer keywords, formatting gaps, and CEFR language indicators.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text>GermanJobsPro SaaS - Production Documentation</Text>
        <Text>Page 1 of 2</Text>
      </View>
    </Page>

    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Senior Engineering Review & Security Guardrails</Text>
        <Text style={styles.subTitle}>Quota Protection, Webhook Idempotency & Production Reliability</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Monetization & Fair-Use Engine</Text>
        <Text style={styles.bulletItem}>
          • <Text style={styles.bold}>Job Seeker PRO Tier (90-Day Pass / $9.99 / ~100 MAD):</Text> Unlocks full Bewerbungsmappe compilation, unlimited exports, and direct AI cover letters.
        </Text>
        <Text style={styles.bulletItem}>
          • <Text style={styles.bold}>Atomic Daily Quota (20 AI Requests/Day):</Text> Prevents API depletion and automated scraping. Auto-resets every 24 hours using atomic SQL updates.
        </Text>
        <Text style={styles.bulletItem}>
          • <Text style={styles.bold}>Race Condition & Failure Protection:</Text> Uses atomic credit decrements with automated refund logic (`refundAiCredit`) if upstream AI calls encounter rate-limits.
        </Text>
        <Text style={styles.bulletItem}>
          • <Text style={styles.bold}>Payment Webhook Security:</Text> Verifies HMAC SHA-256 signatures with constant-time equality (`crypto.timingSafeEqual`) and logs unique event IDs in `ProcessedWebhookEvent` to prevent replay exploits.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. PDF Engine Memory & Performance Optimizations</Text>
        <Text style={styles.bulletItem}>
          • <Text style={styles.bold}>Single Buffer Allocation:</Text> Uploaded PDF streams are converted to Node Buffers once, preventing duplicate reads and heap overflows during large uploads (up to 15MB).
        </Text>
        <Text style={styles.bulletItem}>
          • <Text style={styles.bold}>Decryption & Fast Parsing:</Text> Enabled `ignoreEncryption: true` and `ParseSpeeds.Fast` in `pdf-lib` to seamlessly handle protected attachments.
        </Text>
        <Text style={styles.bulletItem}>
          • <Text style={styles.bold}>Dynamic Deckblatt Layout:</Text> Automatically adapts to full-width card layout if candidate omits portrait photo, avoiding empty placeholders.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Production Deployment & Operations</Text>
        <Text style={styles.paragraph}>
          The application is deployed via CapRover Docker container on a self-hosted Linux VPS. Automated health checks, zero-downtime rolling updates, and standalone Node.js runtime guarantee high availability.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text>GermanJobsPro SaaS - Production Documentation</Text>
        <Text>Page 2 of 2</Text>
      </View>
    </Page>
  </Document>
);

const outputPath = path.join(os.homedir(), "Ayyoub-Portfolio", "GermanJobsPro_Documentation.pdf");

renderToFile(<DocumentationPDF />, outputPath).then(() => {
  console.log("\n=======================================================");
  console.log("✅ PDF Generated successfully inside Ayyoub-Portfolio!");
  console.log("📄 File location: " + outputPath);
  console.log("=======================================================\n");
});
