import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  localizeSalary,
  localizeLanguageBadge,
  localizeJobTitle,
  localizeJobDescription,
}: typeof import("../src/lib/jobUtils") = require("../src/lib/jobUtils.ts");

const ARABIC_CHAR_REGEX = /[\u0600-\u06FF]/;

describe("Salary Period Localization (localizeSalary)", () => {
  it("normalizes Arabic yearly salary suffix (سنوياً) into de, fr, en, and preserves ar", () => {
    const rawYearly = "90.000 € - 130.000 € سنوياً";

    const de = localizeSalary(rawYearly, "de");
    const fr = localizeSalary(rawYearly, "fr");
    const en = localizeSalary(rawYearly, "en");
    const ar = localizeSalary(rawYearly, "ar");

    assert.equal(de, "90.000 € - 130.000 € /Jahr");
    assert.equal(fr, "90.000 € - 130.000 € /an");
    assert.equal(en, "90.000 € - 130.000 € /year");
    assert.equal(ar, rawYearly);

    for (const nonAr of [de, fr, en]) {
      assert.equal(ARABIC_CHAR_REGEX.test(nonAr), false, `Unexpected Arabic char in: ${nonAr}`);
    }
  });

  it("normalizes Arabic monthly salary suffix (شهرياً) and range words for non-Arabic locales", () => {
    const rawMonthly = "من 3.500 € إلى 4.200 € شهرياً";

    const de = localizeSalary(rawMonthly, "de");
    const fr = localizeSalary(rawMonthly, "fr");
    const en = localizeSalary(rawMonthly, "en");
    const ar = localizeSalary(rawMonthly, "ar");

    assert.equal(de, "3.500 € - 4.200 € /Monat");
    assert.equal(fr, "3.500 € - 4.200 € /mois");
    assert.equal(en, "3.500 € - 4.200 € /month");
    assert.equal(ar, rawMonthly);
  });
});

describe("Language Requirement Badge Localization (localizeLanguageBadge)", () => {
  it("localizes German CEFR requirements per UI locale", () => {
    assert.equal(localizeLanguageBadge("German B2", "de"), "Deutsch B2");
    assert.equal(localizeLanguageBadge("German B2", "fr"), "Allemand B2");
    assert.equal(localizeLanguageBadge("German B2", "en"), "German B2");
    assert.equal(localizeLanguageBadge("German B2", "ar"), "ألمانية B2");

    assert.equal(localizeLanguageBadge("German C1", "de"), "Deutsch C1");
    assert.equal(localizeLanguageBadge("German C1", "fr"), "Allemand C1");
    assert.equal(localizeLanguageBadge("B1/B2", "de"), "Deutsch B1/B2");
  });

  it("localizes English job language requirements and empty fallbacks", () => {
    assert.equal(localizeLanguageBadge("EN (B2)", "de"), "Englisch B2");
    assert.equal(localizeLanguageBadge("EN (B2)", "fr"), "Anglais B2");
    assert.equal(localizeLanguageBadge("EN (B2)", "en"), "English B2");
    assert.equal(localizeLanguageBadge("EN (B2)", "ar"), "إنجليزية B2");

    assert.equal(localizeLanguageBadge("none", "de"), "Deutsch (B1/B2)");
    assert.equal(localizeLanguageBadge("none", "fr"), "Allemand (B1/B2)");
    assert.equal(localizeLanguageBadge(null, "en"), "German (B1/B2)");
    assert.equal(localizeLanguageBadge(null, "ar"), "ألمانية (B1/B2)");
  });
});

describe("Job Title & Description Locale Isolation", () => {
  it("never falls back to titleAr/descriptionAr in de, fr, or en when German/English fields exist", () => {
    const job = {
      title: "Steuerberater (m/w/d)",
      titleAr: "مستشار ضريبي (Steuerberater (m/w/d))",
      description: "Wir suchen einen erfahrenen Steuerberater für unsere Kanzlei in München.",
      descriptionAr: "نبحث عن مستشار ضريبي ذو خبرة للعمل في ميونخ.",
    };

    for (const locale of ["de", "fr", "en"]) {
      const titleRes = localizeJobTitle(job, locale);
      assert.equal(titleRes.primaryTitle, "Steuerberater (m/w/d)");
      assert.equal(titleRes.latinSubtitle, null);
      assert.equal(ARABIC_CHAR_REGEX.test(titleRes.primaryTitle), false);

      const descRes = localizeJobDescription(job, locale);
      assert.equal(descRes, job.description);
      assert.equal(ARABIC_CHAR_REGEX.test(descRes), false);
    }

    const arTitle = localizeJobTitle(job, "ar");
    assert.equal(arTitle.primaryTitle, "مستشار ضريبي");
    assert.equal(arTitle.latinSubtitle, "Steuerberater (m/w/d)");
    assert.equal(localizeJobDescription(job, "ar"), job.descriptionAr);
  });

  it("extracts German titles from bilingual DB title strings in de/fr/en", () => {
    const bilingual1 = "مستشار ضريبي (Steuerberater)";
    assert.deepEqual(localizeJobTitle(bilingual1, "de"), {
      primaryTitle: "Steuerberater",
      latinSubtitle: null,
    });
    assert.deepEqual(localizeJobTitle(bilingual1, "fr"), {
      primaryTitle: "Steuerberater",
      latinSubtitle: null,
    });

    const bilingualNested = "أخصائي تمريض (Pflegefachkraft (m/w/d))";
    assert.deepEqual(localizeJobTitle(bilingualNested, "de"), {
      primaryTitle: "Pflegefachkraft (m/w/d)",
      latinSubtitle: null,
    });

    const bilingualDash = "أخصائي تمريض - Pflegefachkraft (m/w/d)";
    assert.deepEqual(localizeJobTitle(bilingualDash, "de"), {
      primaryTitle: "Pflegefachkraft (m/w/d)",
      latinSubtitle: null,
    });

    assert.deepEqual(localizeJobTitle(bilingualNested, "ar"), {
      primaryTitle: "أخصائي تمريض",
      latinSubtitle: "Pflegefachkraft (m/w/d)",
    });
  });

  it("strips Arabic boilerplate lines from mixed descriptions in de/fr/en and omits Arabic-only text", () => {
    const mixed =
      "فرصة عمل مميزة في ألمانيا لوظيفة مطور برمجيات.\nWir suchen ab sofort einen Softwareentwickler (m/w/d) in Berlin.\n• React & TypeScript";
    const deDesc = localizeJobDescription({ descriptionRaw: mixed }, "de");
    assert.equal(ARABIC_CHAR_REGEX.test(deDesc), false);
    assert.ok(deDesc.includes("Wir suchen ab sofort einen Softwareentwickler (m/w/d) in Berlin."));
    assert.ok(deDesc.includes("• React & TypeScript"));

    const arabicOnly = {
      descriptionRaw: "وصف كامل باللغة العربية فقط بدون أي نص ألماني.",
      descriptionAr: "وصف باللغة العربية.",
    };
    assert.equal(localizeJobDescription(arabicOnly, "de"), "");
    assert.equal(localizeJobDescription(arabicOnly, "fr"), "");
    assert.equal(localizeJobDescription(arabicOnly, "ar"), "وصف باللغة العربية.");
  });
});
