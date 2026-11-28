import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { getDocumentProxy, extractText } from "unpdf";
import {
  FRENCH_CV_DRAFT_STORAGE_KEY,
  MOROCCAN_DIPLOMA_PRESETS,
  buildFrenchCvFilename,
  createDefaultFrenchCv,
  createSampleFrenchCv,
  formatFrenchHeaderName,
  frenchCvSchema,
  getFrenchCvSectionOrder,
  parseFrenchCvDraft,
  serializeFrenchCvDraft,
  validatePhotoDataUrl,
} from "../src/lib/cv-fr";
import { FrenchCvPdfDocument } from "../src/components/cv-fr/FrenchCvPdfDocument";

test("French CV (Morocco): Schema validation, defaults & draft serialization", async (t) => {
  await t.test("createDefaultFrenchCv() produces a valid schema with Morocco defaults", () => {
    const def = createDefaultFrenchCv();
    const parsed = frenchCvSchema.safeParse(def);
    assert.strictEqual(parsed.success, true);
    assert.strictEqual(FRENCH_CV_DRAFT_STORAGE_KEY, "germanjobspro_cv_fr_draft_v1");
    assert.strictEqual(def.header.city, "Casablanca, Maroc");
    assert.strictEqual(def.header.showPhoto, false);
    assert.deepStrictEqual(
      def.languages.map((l) => l.language),
      ["Arabe", "Français", "Anglais"]
    );
    assert.ok(MOROCCAN_DIPLOMA_PRESETS.includes("Technicien Spécialisé (OFPPT / ISTA)"));
    assert.ok(MOROCCAN_DIPLOMA_PRESETS.includes("Cycle d'Ingénieur"));
  });

  await t.test("createSampleFrenchCv() passes strict frenchCvSchema validation", () => {
    const sample = createSampleFrenchCv();
    const parsed = frenchCvSchema.safeParse(sample);
    assert.strictEqual(parsed.success, true);
  });

  await t.test("serializeFrenchCvDraft & parseFrenchCvDraft round-trip cleanly and handle malformed JSON", () => {
    const sample = createSampleFrenchCv();
    const serialized = serializeFrenchCvDraft(sample);
    const restored = parseFrenchCvDraft(serialized);
    assert.ok(restored);
    assert.strictEqual(restored.header.firstName, "Oussama");
    assert.strictEqual(restored.header.lastName, "El Koromi");

    assert.strictEqual(parseFrenchCvDraft(null), null);
    assert.strictEqual(parseFrenchCvDraft(""), null);
    assert.strictEqual(parseFrenchCvDraft("{invalid json"), null);
    assert.strictEqual(parseFrenchCvDraft("123"), null);
  });

  await t.test("validatePhotoDataUrl allows PNG/JPEG within 2MB and rejects WebP/non-image/oversized", () => {
    assert.strictEqual(validatePhotoDataUrl("").valid, true);
    assert.strictEqual(
      validatePhotoDataUrl("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ").valid,
      true
    );
    assert.strictEqual(
      validatePhotoDataUrl("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAA==").valid,
      true
    );
    assert.strictEqual(
      validatePhotoDataUrl("data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=").valid,
      false
    );
    assert.strictEqual(validatePhotoDataUrl("data:text/plain;base64,SGVsbG8=").valid, false);
    const oversizedBase64 = "A".repeat(3_000_000);
    assert.strictEqual(
      validatePhotoDataUrl(`data:image/jpeg;base64,${oversizedBase64}`).valid,
      false
    );
  });
});

test("French CV (Morocco): Filename sanitization & header formatting", async (t) => {
  await t.test("buildFrenchCvFilename builds expected ASCII-safe filename", () => {
    assert.strictEqual(
      buildFrenchCvFilename("Oussama", "El Koromi"),
      "CV-Oussama-El-Koromi.pdf"
    );
    assert.strictEqual(
      buildFrenchCvFilename("Élodie", "Benjelloun-Chraïbi"),
      "CV-Elodie-Benjelloun-Chraibi.pdf"
    );
    assert.strictEqual(
      buildFrenchCvFilename("Maître", "Cœur/../Test"),
      "CV-Maitre-Coeur-Test.pdf"
    );
    assert.strictEqual(buildFrenchCvFilename("", ""), "CV-Candidat.pdf");
  });

  await t.test("formatFrenchHeaderName renders Prénom NOM", () => {
    assert.strictEqual(formatFrenchHeaderName("Oussama", "El Koromi"), "Oussama EL KOROMI");
    assert.strictEqual(formatFrenchHeaderName("Salma", ""), "Salma");
    assert.strictEqual(formatFrenchHeaderName("", ""), "Prénom NOM");
  });
});

test("French CV (Morocco): Section ordering & A4 PDF rendering", async (t) => {
  await t.test("getFrenchCvSectionOrder respects educationFirst toggle", () => {
    assert.deepStrictEqual(getFrenchCvSectionOrder(true), ["education", "experience"]);
    assert.deepStrictEqual(getFrenchCvSectionOrder(false), ["experience", "education"]);
  });

  await t.test("PDF output preserves French accented characters and honors educationFirst ordering", async () => {
    const base = createSampleFrenchCv();
    base.header.jobTitle = "Maître d'œuvre — Ingénieur Génie Civil";
    base.summary = "Expérience confirmée à Casablanca : contrôle qualité, études de coûts et coordination.";

    const eduFirstBuf = await renderToBuffer(
      React.createElement(FrenchCvPdfDocument, {
        data: { ...base, educationFirst: true, template: "ats-classic" },
      }) as unknown as React.ReactElement<DocumentProps>
    );
    const eduFirstProxy = await getDocumentProxy(new Uint8Array(eduFirstBuf));
    const eduFirstText = (await extractText(eduFirstProxy, { mergePages: true })).text;

    assert.ok(eduFirstText.includes("Oussama EL KOROMI"));
    assert.ok(eduFirstText.includes("Maître d'œuvre"));
    assert.ok(eduFirstText.includes("contrôle qualité"));
    assert.ok(!eduFirstText.includes("den ")); // No German DIN 5008 signature

    const eduPos = eduFirstText.indexOf("FORMATION");
    const expPos = eduFirstText.indexOf("EXPÉRIENCES PROFESSIONNELLES");
    assert.ok(eduPos !== -1 && expPos !== -1 && eduPos < expPos);

    const expFirstBuf = await renderToBuffer(
      React.createElement(FrenchCvPdfDocument, {
        data: { ...base, educationFirst: false, template: "maroc-modern" },
      }) as unknown as React.ReactElement<DocumentProps>
    );
    const expFirstProxy = await getDocumentProxy(new Uint8Array(expFirstBuf));
    const expFirstText = (await extractText(expFirstProxy, { mergePages: true })).text;

    const expPos2 = expFirstText.indexOf("EXPÉRIENCES PROFESSIONNELLES");
    const eduPos2 = expFirstText.indexOf("FORMATION");
    assert.ok(expPos2 !== -1 && eduPos2 !== -1 && expPos2 < eduPos2);
  });
});
