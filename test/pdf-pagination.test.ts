import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import ReactPDF, { renderToBuffer } from "@react-pdf/renderer";
import { getDocumentProxy } from "unpdf";
import { CvDocument, CvPdfData, formatDate, formatDateRange } from "../src/lib/pdf/cv-template.js";
import { DeckblattDocument, DeckblattData } from "../src/lib/pdf/deckblatt-template.js";
import { compileBewerbungsmappe } from "../src/lib/pdf/dossier-compiler.js";
import { extractCityFromAddress } from "../src/lib/location.js";

async function countPages(doc: React.ReactElement<any>): Promise<number> {
  const stream = await ReactPDF.renderToStream(doc);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  const buffer = Buffer.concat(chunks);
  const uint8 = new Uint8Array(buffer);
  const pdfProxy = await getDocumentProxy(uint8);
  return pdfProxy.numPages;
}

test("PDF Pagination & Visual Integrity Suite", async (t) => {
  await t.test("P1: Typical entry-level German CV fits strictly on 1 page with attached signature", async () => {
    const entryLevelCv: CvPdfData = {
      title: "Lebenslauf - Junior Web Developer",
      language: "de",
      personalInfo: {
        fullName: "Anas El Amrani",
        email: "anas.elamrani@example.com",
        phone: "+212 612 345678",
        address: "Douar Ain Boumasaai, Tissa, Taounate, Marokko",
        birthDate: "1998-04-12",
        birthPlace: "Tissa",
        nationality: "Marokkanisch",
        targetJobTitle: "Junior Frontend-Entwickler",
        summary: "Motivierter Frontend-Entwickler mit soliden Kenntnissen in React, TypeScript und modernem CSS.",
      },
      experiences: [
        {
          company: "Digital Solutions SARL",
          position: "Frontend Praktikant",
          city: "Fès",
          country: "Marokko",
          startDate: "2023-01-01",
          endDate: "2023-06-30",
          description: "• Entwicklung interaktiver Benutzeroberflächen mit React\n• Optimierung der mobilen Reaktionsfähigkeit",
        },
      ],
      educations: [
        {
          institution: "Universität Sidi Mohamed Ben Abdellah",
          degree: "Bachelor of Science",
          fieldOfStudy: "Informatik",
          city: "Fès",
          country: "Marokko",
          startDate: "2019-09-01",
          endDate: "2022-07-01",
        },
      ],
      skills: [
        { name: "JavaScript", category: "IT & Software", level: "Fortgeschritten" },
        { name: "TypeScript", category: "IT & Software", level: "Fortgeschritten" },
        { name: "React", category: "IT & Software", level: "Fortgeschritten" },
        { name: "HTML & CSS", category: "IT & Software" },
        { name: "Git", category: "Methoden & Tools" },
        { name: "Führerschein Klasse B", category: "Mobilität" },
      ],
      languages: [
        { language: "Deutsch", proficiency: "Gute Kenntnisse (B1)" },
        { language: "Englisch", proficiency: "Fließend (B2)" },
        { language: "Arabisch", proficiency: "Muttersprache" },
      ],
    };

    const pages = await countPages(React.createElement(CvDocument, { cv: entryLevelCv }));
    assert.strictEqual(pages, 1, `Entry-level CV must fit on 1 page without orphaned signature, but produced ${pages} pages`);
  });

  await t.test("P2: Multi-page CV with extensive experience paginates cleanly across >= 2 pages", async () => {
    const longCv: CvPdfData = {
      title: "Lebenslauf - Senior Full-Stack Engineer",
      language: "de",
      personalInfo: {
        fullName: "Dr. Max Mustermann",
        email: "max.mustermann@example.de",
        phone: "+49 30 12345678",
        address: "Musterstraße 12, 10115 Berlin, Deutschland",
        birthDate: "1985-05-20",
        birthPlace: "Berlin",
        nationality: "Deutsch",
        targetJobTitle: "Lead Cloud Architect",
        summary: "Erfahrener Softwarearchitekt mit 12 Jahren Praxis in verteilten Cloud-Systemen und Hochverfügbarkeit.",
      },
      experiences: [
        {
          company: "CloudScale Systems GmbH",
          position: "Lead Software Architect",
          city: "Berlin",
          country: "Deutschland",
          startDate: "2021-01-01",
          endDate: null,
          isCurrent: true,
          description: "• Führung eines 15-köpfigen Entwicklerteams für Enterprise SaaS\n• Migration auf Kubernetes und Microservices mit 99.99% Uptime\n• Architektur und Implementierung von Event-Driven Pipelines",
        },
        {
          company: "TechNova Solutions",
          position: "Senior Full Stack Entwickler",
          city: "München",
          country: "Deutschland",
          startDate: "2017-04-01",
          endDate: "2020-12-31",
          description: "• Entwicklung skalierbarer Webplattformen mit React, Node.js und PostgreSQL\n• Einführung automatisierter CI/CD-Pipelines mit GitHub Actions",
        },
        {
          company: "Digital Consulting Berlin",
          position: "Softwareentwickler",
          city: "Berlin",
          country: "Deutschland",
          startDate: "2013-09-01",
          endDate: "2017-03-31",
          description: "• Konzeption von REST-APIs und Webanwendungen für DAX-Konzerne\n• Implementierung von Microservices in Java und Node.js",
        },
        {
          company: "WebFoundry GmbH",
          position: "Junior Web Developer",
          city: "Potsdam",
          country: "Deutschland",
          startDate: "2011-03-01",
          endDate: "2013-08-31",
          description: "• Frontend-Entwicklung mit HTML5, CSS3 und JavaScript\n• Anbindung relationaler Datenbanken",
        },
        {
          company: "Init Systems AG",
          position: "Software Developer",
          city: "Hamburg",
          country: "Deutschland",
          startDate: "2008-01-01",
          endDate: "2011-02-28",
          description: "• Entwicklung nativer Java Enterprise Backend-Services\n• Schnittstellenintegration und Performance-Tuning",
        },
        {
          company: "MediaTech GbR",
          position: "Junior Entwickler",
          city: "Kiel",
          country: "Deutschland",
          startDate: "2005-08-01",
          endDate: "2007-12-31",
          description: "• Wartung und Entwicklung interner Webapplikationen\n• Fehlerbehebung und automatisiertes Testing",
        },
      ],
      educations: [
        {
          institution: "Technische Universität Berlin",
          degree: "Master of Science",
          fieldOfStudy: "Informatik",
          city: "Berlin",
          country: "Deutschland",
          startDate: "2003-10-01",
          endDate: "2005-07-31",
          grade: "1.2",
        },
        {
          institution: "Universität Potsdam",
          degree: "Bachelor of Science",
          fieldOfStudy: "Informatik",
          city: "Potsdam",
          country: "Deutschland",
          startDate: "2000-10-01",
          endDate: "2003-09-30",
          grade: "1.5",
        },
      ],
      skills: [
        { name: "TypeScript / JavaScript", category: "IT & Software", level: "Experte" },
        { name: "Go & Rust", category: "IT & Software", level: "Fortgeschritten" },
        { name: "Kubernetes & Docker", category: "IT & Software", level: "Experte" },
        { name: "AWS & Google Cloud", category: "IT & Software", level: "Experte" },
        { name: "Systemarchitektur", category: "Fachkenntnisse", level: "Experte" },
        { name: "Agile Führung", category: "Methoden & Tools", level: "Experte" },
        { name: "Führerschein Klasse B", category: "Mobilität" },
      ],
      languages: [
        { language: "Deutsch", proficiency: "Muttersprache" },
        { language: "Englisch", proficiency: "Verhandlungssicher (C2)" },
        { language: "Französisch", proficiency: "Grundkenntnisse (A2)" },
      ],
      certifications: [
        { name: "AWS Certified Solutions Architect Professional", issuer: "Amazon Web Services", issueDate: "2022-05-15" },
        { name: "Certified Kubernetes Administrator (CKA)", issuer: "Cloud Native Computing Foundation", issueDate: "2020-11-10" },
      ],
      projects: [
        {
          title: "Distributed EventBus Framework",
          role: "Lead Maintainer",
          description: "Hochperformanter Open-Source Eventbus auf Basis von Go und WebAssembly mit über 3.000 GitHub Stars.",
        },
      ],
    };

    const pages = await countPages(React.createElement(CvDocument, { cv: longCv }));
    assert.ok(pages >= 2, `Long CV should span at least 2 pages, got ${pages}`);
  });

  await t.test("P3: City extraction accurately extracts municipal city for signature line", () => {
    assert.strictEqual(
      extractCityFromAddress("Douar Ain Boumasaai, Tissa, Taounate, Marokko"),
      "Tissa"
    );
    assert.strictEqual(
      extractCityFromAddress("Musterstraße 12, 10115 Berlin, Deutschland"),
      "Berlin"
    );
    assert.strictEqual(
      extractCityFromAddress("10115 Berlin"),
      "Berlin"
    );
    assert.strictEqual(
      extractCityFromAddress("D-80331 München"),
      "München"
    );
    assert.strictEqual(
      extractCityFromAddress("Avenue Hassan II, Taounate, Morocco"),
      "Taounate"
    );
    assert.strictEqual(
      extractCityFromAddress("Quartier Al Quds, Casablanca, Maroc"),
      "Casablanca"
    );
    assert.strictEqual(
      extractCityFromAddress("Douar Ain Boumasaai, Marokko"),
      "Deutschland"
    );
    assert.strictEqual(
      extractCityFromAddress("Musterstraße 12, Deutschland"),
      "Deutschland"
    );
    assert.strictEqual(
      extractCityFromAddress("Musterstraße 12"),
      "Deutschland"
    );
    assert.strictEqual(
      extractCityFromAddress(null),
      "Deutschland"
    );
    assert.strictEqual(
      extractCityFromAddress(""),
      "Deutschland"
    );
  });

  await t.test("P4: Single-date education entry and same-month ranges format without dangling hyphens", () => {
    // "Juni 2021" parses and formats to "06/2021"
    assert.strictEqual(formatDate("Juni 2021"), "06/2021");

    // Single-date degree (startDate: "2021-06-01", endDate: null, isCurrent: false) -> "06/2021"
    const singleDateRender = formatDateRange("2021-06-01", null, false);
    assert.strictEqual(singleDateRender, "06/2021");
    assert.ok(!singleDateRender.endsWith("–"), "Must NOT end with dangling en-dash");
    assert.ok(!singleDateRender.endsWith("-"), "Must NOT end with hyphen");
    assert.ok(!singleDateRender.includes("heute"), "Completed degree must NOT display 'heute'");
    assert.ok(!singleDateRender.includes("2026"), "Must NOT fabricate 2026");

    // Same-month range -> "04/2025"
    const sameMonthRender = formatDateRange("2025-04-03", "2025-04-05", false);
    assert.strictEqual(sameMonthRender, "04/2025");

    // Identical start & end date -> "06/2021"
    const identicalRender = formatDateRange("2021-06-01", "2021-06-01", false);
    assert.strictEqual(identicalRender, "06/2021");
  });

  await t.test("P5: PDF Document with single-date Abitur degree renders to exactly 1 page", async () => {
    const oussamaCv: CvPdfData = {
      title: "Lebenslauf - Oussama El Koromi",
      language: "de",
      personalInfo: {
        fullName: "Oussama El Koromi",
        email: "oussama@example.com",
        phone: "+212 600 000000",
        address: "Taounate, Marokko",
        birthDate: "2002-05-15",
        birthPlace: "Taounate",
        nationality: "Marokkanisch",
        targetJobTitle: "Pflegefachkraft (m/w/d)",
        summary: "Engagierter Bewerber mit praktischer Erfahrung im sozialen Bereich und bestandener B2-Prüfung.",
      },
      experiences: [
        {
          company: "Vereins AN-NAHDA",
          position: "Praktikant",
          city: "Taounate",
          country: "Marokko",
          startDate: "2026-01-23",
          endDate: "2026-02-23",
          description: "• Praktikum im sozialen Bereich",
        },
        {
          company: "Stiftung für Sozialhilfe",
          position: "Praktikant",
          city: "Taounate",
          country: "Marokko",
          startDate: "2025-02-01",
          endDate: "2025-03-03",
          description: "• Betreuung und Unterstützung",
        },
      ],
      educations: [
        {
          institution: "Gymnasium AIN AICHA",
          degree: "Abitur",
          fieldOfStudy: "Geisteswissenschaften",
          city: "Taounate",
          country: "Marokko",
          startDate: "2021-06-01",
          endDate: null,
          isCurrent: false,
        },
      ],
      skills: [
        { name: "Teamfähigkeit", category: "Kenntnisse" },
        { name: "Einfühlungsvermögen", category: "Kenntnisse" },
      ],
      languages: [
        { language: "Deutsch", proficiency: "Fließend (B2)" },
        { language: "Arabisch", proficiency: "Muttersprache" },
      ],
      certifications: [
        { name: "Telc Zertifikat B2", issuer: "telc", issueDate: "2025-05-24" },
        { name: "Erste-Hilfe-Kurs", issuer: "Rotes Kreuz", issueDate: "2025-04-03" },
      ],
    };

    const pages = await countPages(React.createElement(CvDocument, { cv: oussamaCv }));
    assert.strictEqual(pages, 1, `Oussama CV must render cleanly on 1 page, got ${pages}`);
  });

  await t.test("P6: DeckblattDocument renders strictly to 1 page both with and without photo", async () => {
    const sampleDeckblattWithPhoto: DeckblattData = {
      fullName: "Max Mustermann",
      email: "max.mustermann@example.de",
      phone: "+49 170 1234567",
      address: "Musterstraße 1, 10115 Berlin",
      targetJobTitle: "Senior Frontend-Entwickler",
      companyName: "TechCorp GmbH",
      photoBase64:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      linkedinUrl: "https://linkedin.com/in/maxmustermann",
      attachments: [
        "Anschreiben",
        "Lebenslauf",
        "Arbeitszeugnis TechCorp",
        "Bachelor-Urkunde Informatik",
      ],
    };

    const sampleDeckblattNoPhoto: DeckblattData = {
      fullName: "Erika Musterfrau",
      email: "erika.musterfrau@example.de",
      phone: "+49 171 9876543",
      address: "Hauptstraße 42, 80331 München",
      targetJobTitle: "Projektleiterin Marketing",
      companyName: "Medienwerk AG",
      photoBase64: undefined,
      photoUrl: null,
      photoBuffer: null,
      attachments: [
        "Anschreiben",
        "Lebenslauf (Tabellarisch)",
        "Referenzen & Zeugnisse",
      ],
    };

    // 1. Render with photo using @react-pdf/renderer renderToBuffer
    const bufferWithPhoto = await renderToBuffer(
      React.createElement(DeckblattDocument, { data: sampleDeckblattWithPhoto }) as any
    );
    assert.ok(bufferWithPhoto.byteLength > 0, "Buffer with photo must not be empty");
    const proxyWithPhoto = await getDocumentProxy(new Uint8Array(bufferWithPhoto));
    assert.strictEqual(
      proxyWithPhoto.numPages,
      1,
      `Deckblatt with photo must render to exactly 1 page, got ${proxyWithPhoto.numPages}`
    );

    // 2. Render without photo using @react-pdf/renderer renderToBuffer (initials monogram crest)
    const bufferNoPhoto = await renderToBuffer(
      React.createElement(DeckblattDocument, { data: sampleDeckblattNoPhoto }) as any
    );
    assert.ok(bufferNoPhoto.byteLength > 0, "Buffer without photo must not be empty");
    const proxyNoPhoto = await getDocumentProxy(new Uint8Array(bufferNoPhoto));
    assert.strictEqual(
      proxyNoPhoto.numPages,
      1,
      `Deckblatt without photo must render to exactly 1 page, got ${proxyNoPhoto.numPages}`
    );
  });

  await t.test("P7: compileBewerbungsmappe integrates customJobTitle, customCompanyName, and includePhoto toggle", async () => {
    const dummyPngBytes = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const miniCv: CvPdfData = {
      title: "Lebenslauf",
      language: "de",
      personalInfo: {
        fullName: "Klaus Schmidt",
        email: "klaus@example.de",
        phone: "+49 30 11223344",
        address: "Alexanderplatz 1, 10178 Berlin",
        targetJobTitle: "Systemadministrator",
        summary: "Erfahrener Administrator",
      },
      experiences: [],
      educations: [],
      skills: [],
      languages: [],
    };

    // 1. Compile with includePhoto = false -> clears photo on Deckblatt
    const dossierNoPhotoBytes = await compileBewerbungsmappe({
      cvData: miniCv,
      includeDeckblatt: true,
      customJobTitle: "DevOps Engineer",
      customCompanyName: "CloudTech Berlin GmbH",
      includePhoto: false,
      photoBuffer: dummyPngBytes, // supplied but should be stripped by includePhoto: false
    });

    assert.ok(dossierNoPhotoBytes.byteLength > 0, "Dossier PDF bytes must not be empty");
    const proxyNoPhoto = await getDocumentProxy(dossierNoPhotoBytes);
    // At least Deckblatt (1) + CV (1) = 2 pages
    assert.ok(proxyNoPhoto.numPages >= 2, `Dossier should have at least 2 pages, got ${proxyNoPhoto.numPages}`);

    // 2. Compile with includePhoto = true -> attaches photoBuffer
    const dossierWithPhotoBytes = await compileBewerbungsmappe({
      cvData: miniCv,
      includeDeckblatt: true,
      customJobTitle: "Site Reliability Engineer",
      customCompanyName: "Platform Solutions AG",
      includePhoto: true,
      photoBuffer: dummyPngBytes,
    });

    assert.ok(dossierWithPhotoBytes.byteLength > 0, "Dossier PDF with photo must not be empty");
    const proxyWithPhoto = await getDocumentProxy(dossierWithPhotoBytes);
    assert.ok(proxyWithPhoto.numPages >= 2, `Dossier with photo should have at least 2 pages, got ${proxyWithPhoto.numPages}`);
  });
});
