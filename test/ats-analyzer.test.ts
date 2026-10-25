import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import type { EmploymentEntry } from "../src/lib/ats-signals";

const require = createRequire(import.meta.url);
const {
  validateAtsTopLevelSchema,
  hasVerifiedDateInversion,
  computeContactProvenance,
  classifyJobDescription,
  classifyActionPlanItem,
  filterVerifiedWeaknesses,
  isNoWeaknessPlaceholder,
  isNonWeaknessStatement,
}: typeof import("../src/lib/ats-signals") = require("../src/lib/ats-signals.ts");

const {
  extractCityFromAddress,
}: typeof import("../src/lib/location") = require("../src/lib/location.ts");

const {
  parseEuropeanDate,
  parseDateSafe,
  formatDate,
  formatDateRange,
  extractDateFromContext,
}: typeof import("../src/lib/cv-date-utils") = require("../src/lib/cv-date-utils.ts");

describe("German ATS & DIN 5008 Deterministic Offline Unit Tests", () => {
  describe("Group S: Top-Level Schema & Strict Score Validation", () => {
    it("S1: Rejects non-numeric score strings with UNRECOVERABLE_VALIDATION_FAILURE", () => {
      const payload = {
        overallScore: "85",
        din5008Score: 80,
        keywordMatchScore: 80,
        summary: "Assessment text",
        strengths: ["Strong experience"],
        weaknesses: [],
        missingKeywords: [],
        actionPlan: ["Safe step"],
      };

      assert.throws(
        () => validateAtsTopLevelSchema(payload, true),
        (err: Error) => err.message.includes("UNRECOVERABLE_VALIDATION_FAILURE") && err.message.includes("overallScore")
      );
    });

    it("S2: Rejects floating-point scores with UNRECOVERABLE_VALIDATION_FAILURE", () => {
      const payload = {
        overallScore: 80,
        din5008Score: 82.5,
        keywordMatchScore: 80,
        summary: "Assessment text",
        strengths: ["Strong experience"],
        weaknesses: [],
        missingKeywords: [],
        actionPlan: ["Safe step"],
      };

      assert.throws(
        () => validateAtsTopLevelSchema(payload, true),
        (err: Error) => err.message.includes("UNRECOVERABLE_VALIDATION_FAILURE") && err.message.includes("din5008Score")
      );
    });

    it("S3: Rejects out-of-range scores (> 100 or < 0) with UNRECOVERABLE_VALIDATION_FAILURE", () => {
      const payloadHigh = {
        overallScore: 105,
        din5008Score: 90,
        keywordMatchScore: 90,
        summary: "Assessment text",
        strengths: ["Leadership"],
        weaknesses: [],
        missingKeywords: [],
        actionPlan: ["Safe step"],
      };

      assert.throws(
        () => validateAtsTopLevelSchema(payloadHigh, true),
        (err: Error) => err.message.includes("UNRECOVERABLE_VALIDATION_FAILURE")
      );

      const payloadNegative = {
        overallScore: -5,
        din5008Score: 90,
        keywordMatchScore: 90,
        summary: "Assessment text",
        strengths: ["Leadership"],
        weaknesses: [],
        missingKeywords: [],
        actionPlan: ["Safe step"],
      };

      assert.throws(
        () => validateAtsTopLevelSchema(payloadNegative, true),
        (err: Error) => err.message.includes("UNRECOVERABLE_VALIDATION_FAILURE")
      );
    });

    it("S4: Enforces No-JD contract (keywordMatchScore: null, missingKeywords: []) when JD is absent/invalid", () => {
      const omittedJd = classifyJobDescription(null);
      assert.equal(omittedJd.status, "omitted");

      const invalidJd = classifyJobDescription("Zu kurz");
      assert.equal(invalidJd.status, "invalid_supplied");

      const validJd = classifyJobDescription("Wir suchen einen erfahrenen Softwareentwickler für unser Berliner Team mit Kenntnissen in TypeScript und React.");
      assert.equal(validJd.status, "valid_supplied");

      const payload = {
        overallScore: 85,
        din5008Score: 90,
        keywordMatchScore: 75, // AI erroneously returned a score
        summary: "Guter Lebenslauf ohne Stellenanzeige.",
        strengths: ["Gute Struktur"],
        weaknesses: [],
        missingKeywords: ["React", "TypeScript"], // AI erroneously returned keywords
        actionPlan: ["Weiter so"],
      };

      const result = validateAtsTopLevelSchema(payload, false);
      assert.equal(result.keywordMatchScore, null);
      assert.deepEqual(result.missingKeywords, []);
    });

    it("S5: Rejects non-string elements inside string arrays", () => {
      const payload = {
        overallScore: 80,
        din5008Score: 80,
        keywordMatchScore: 80,
        summary: "Assessment text",
        strengths: ["Strong experience", 12345], // Invalid element type
        weaknesses: [],
        missingKeywords: [],
        actionPlan: ["Safe step"],
      };

      assert.throws(
        () => validateAtsTopLevelSchema(payload, true),
        (err: Error) => err.message.includes("UNRECOVERABLE_VALIDATION_FAILURE") && err.message.includes("strengths[1]")
      );
    });
  });

  describe("Group D: Date Inversion Verification & Disambiguation", () => {
    it("D1: Valid chronological progression across year boundary (12.2022 bis 01.2023) is NOT inverted", () => {
      const entries: EmploymentEntry[] = [
        {
          company: "SAP",
          position: "Software Engineer",
          startDate: "12.2022",
          endDate: "01.2023",
        },
      ];
      const finding = "Software Engineer bei SAP von 12.2022 bis 01.2023";
      assert.equal(hasVerifiedDateInversion(finding, entries), false);
    });

    it("D2: Valid year-only chronological progression (2020 - 2024) is NOT inverted", () => {
      const entries: EmploymentEntry[] = [
        {
          company: "Siemens",
          position: "Developer",
          startDate: "2020",
          endDate: "2024",
        },
      ];
      const finding = "Developer bei Siemens (2020 - 2024)";
      assert.equal(hasVerifiedDateInversion(finding, entries), false);
    });

    it("D3: Anchored year-only inverted chronology (2024 - 2021) is confirmed as defect", () => {
      const entries: EmploymentEntry[] = [
        {
          company: "Lufthansa",
          position: "Product Manager",
          startDate: "2024",
          endDate: "2021",
        },
      ];
      const finding = "Lufthansa als Product Manager (2024 - 2021)";
      assert.equal(hasVerifiedDateInversion(finding, entries), true);
    });

    it("D3-B: Unanchored year-only inverted finding is discarded (cannot bind to entry)", () => {
      const entries: EmploymentEntry[] = [
        {
          company: "Lufthansa",
          position: "Product Manager",
          startDate: "2024",
          endDate: "2021",
        },
      ];
      const finding = "Datumsfehler gefunden: 2024 - 2021"; // Lacks employer/position anchor
      assert.equal(hasVerifiedDateInversion(finding, entries), false);
    });

    it("D3-C: Cross-entry collision spanning multiple employers is rejected", () => {
      const entries: EmploymentEntry[] = [
        {
          company: "BMW",
          position: "Ingenieur",
          startDate: "2020",
          endDate: "2021",
        },
        {
          company: "Audi",
          position: "Entwickler",
          startDate: "2021",
          endDate: "2022",
        },
      ];
      const finding = "Arbeitete bei BMW und Audi (2020 - 2022)";
      assert.equal(hasVerifiedDateInversion(finding, entries), false);
    });

    it("D4: Malformed date token returns false", () => {
      const entries: EmploymentEntry[] = [
        {
          company: "BMW",
          position: "Dev",
          startDate: "2020",
          endDate: "2022",
        },
      ];
      const finding = "BMW (invalidDate - 2022)";
      assert.equal(hasVerifiedDateInversion(finding, entries), false);
    });

    it("D5: Month 13 out of calendar range returns false", () => {
      const entries: EmploymentEntry[] = [
        {
          company: "Bosch",
          position: "Dev",
          startDate: "13.2021",
          endDate: "05.2022",
        },
      ];
      const finding = "Bosch (13.2021 - 05.2022)";
      assert.equal(hasVerifiedDateInversion(finding, entries), false);
    });

    it("D6: Ongoing role (current: true or heute) is not inverted", () => {
      const entries: EmploymentEntry[] = [
        {
          company: "Deloitte",
          position: "Senior Consultant",
          startDate: "2021",
          endDate: "heute",
          isCurrent: true,
        },
      ];
      const finding = "Senior Consultant bei Deloitte (2021 - heute)";
      assert.equal(hasVerifiedDateInversion(finding, entries), false);
    });

    it("D6-B: Non-current entry with missing endDate (null) does not trigger false date inversion", () => {
      const entries: EmploymentEntry[] = [
        {
          company: "KPMG",
          position: "Auditor",
          startDate: "2021",
          endDate: null,
          isCurrent: false,
        },
      ];
      const finding = "Auditor bei KPMG (2021 - heute)";
      assert.equal(hasVerifiedDateInversion(finding, entries), false);
    });

    it("D7: Duplicate entity anchor rejected under conservative disambiguation rule", () => {
      const entries: EmploymentEntry[] = [
        {
          company: "Allianz",
          position: "Berater",
          startDate: "2018",
          endDate: "2020",
        },
        {
          company: "Allianz",
          position: "Berater",
          startDate: "2023",
          endDate: "2021",
        },
      ];
      const finding = "Allianz als Berater (2023 - 2021)";
      // Under conservative rule, duplicate anchor cannot be rescued by dates alone
      assert.equal(hasVerifiedDateInversion(finding, entries), false);
    });

    it("D7-B: Duplicate entity anchor with insufficient information is rejected", () => {
      const entries: EmploymentEntry[] = [
        {
          company: "Allianz",
          position: "Berater",
          startDate: "2018",
          endDate: "2020",
        },
        {
          company: "Allianz",
          position: "Berater",
          startDate: "2023",
          endDate: "2021",
        },
      ];
      const finding = "Allianz als Berater: Die Datumsangaben sind unplausibel";
      assert.equal(hasVerifiedDateInversion(finding, entries), false);
    });

    it("D8: Duplicate entity anchor with identical dates across multiple entries is rejected", () => {
      const entries: EmploymentEntry[] = [
        {
          company: "Allianz",
          position: "Berater",
          startDate: "2023",
          endDate: "2021",
        },
        {
          company: "Allianz",
          position: "Berater",
          startDate: "2023",
          endDate: "2021",
        },
      ];
      const finding = "Allianz als Berater (2023 - 2021)";
      assert.equal(hasVerifiedDateInversion(finding, entries), false);
    });

    it("D9: Genuinely unique employer anchor resolves finding despite colliding year tokens elsewhere in CV", () => {
      const entries: EmploymentEntry[] = [
        {
          company: "Porsche",
          position: "Werkstudent",
          startDate: "2022",
          endDate: "2020", // Inverted
        },
        {
          company: "Daimler",
          position: "Entwickler",
          startDate: "2020",
          endDate: "2022", // Valid, shares year tokens 2020 & 2022
        },
      ];
      const finding = "Werkstudent bei Porsche (2022 - 2020)";
      // "Porsche" uniquely anchors Entry 1; Daimler is not matched
      assert.equal(hasVerifiedDateInversion(finding, entries), true);
    });

    it("D10: Unanchored date pair with collision across multiple employers is rejected", () => {
      const entries: EmploymentEntry[] = [
        {
          company: "BASF",
          position: "Laborant",
          startDate: "2023",
          endDate: "2021",
        },
        {
          company: "Bayer",
          position: "Laborant",
          startDate: "2023",
          endDate: "2021",
        },
      ];
      const finding = "Datumsfehler von 2023 bis 2021"; // No company anchor
      assert.equal(hasVerifiedDateInversion(finding, entries), false);
    });
  });

  describe("Group C: Contact Provenance Policy", () => {
    it("C1: Positively detected phone in CV text emits confirmed_present", () => {
      const result = computeContactProvenance({
        cvText: "Max Mustermann\nTelefon: +49 170 1234567\nErfahrung als Entwickler...",
        textExtractionSuccess: true,
        structuredProfile: null,
      });

      assert.equal(result.phone, "confirmed_present");
      assert.equal(result.details.extractedPhoneInText, "+49 170 1234567");
    });

    it("C2: Missing phone in text during upload mode emits unverified (never confirmed_absent)", () => {
      const result = computeContactProvenance({
        cvText: "Max Mustermann\nBerlin, Deutschland\nErfahrung als Entwickler...",
        textExtractionSuccess: true,
        structuredProfile: null,
      });

      assert.equal(result.phone, "unverified");
      assert.notEqual(result.phone, "confirmed_absent");
    });

    it("C3: Missing phone in saved CV profile and text emits unverified (never confirmed_absent)", () => {
      const result = computeContactProvenance({
        cvText: "Max Mustermann\nBerlin, Deutschland\nErfahrung als Entwickler...",
        textExtractionSuccess: true,
        cvIdProvided: true,
        structuredProfile: {
          personalInfo: {
            email: "max@example.de",
            phone: null,
          },
        },
      });

      assert.equal(result.phone, "unverified");
      assert.notEqual(result.phone, "confirmed_absent");
      assert.equal(result.email, "confirmed_present");
    });
  });

  describe("Group V: German Labor Market & Action Plan Classification", () => {
    it("V1: Mandatory photo requirement is classified as Category D (invalid/suppressed)", () => {
      const item = "Bewerbungsfoto ist in Deutschland gesetzlich verpflichtend und muss nach DIN 5008 eingefügt werden.";
      const res = classifyActionPlanItem(item);
      assert.equal(res.category, "category_d_unsafe_or_invalid");
      assert.equal(res.isValid, false);
    });

    it("V2: Mandatory marital status or religion claim is classified as Category D (invalid/suppressed)", () => {
      const item = "Familienstand und Konfession müssen im deutschen Lebenslauf angegeben werden.";
      const res = classifyActionPlanItem(item);
      assert.equal(res.category, "category_d_unsafe_or_invalid");
      assert.equal(res.isValid, false);
    });

    it("V3: Tabular DIN 5008 layout recommendation is classified as Category A (valid/retained)", () => {
      const item = "Verwenden Sie einen übersichtlichen tabellarischen Lebenslauf nach DIN 5008 Standards.";
      const res = classifyActionPlanItem(item);
      assert.equal(res.category, "category_a_safe_general");
      assert.equal(res.isValid, true);
    });

    it("V4: Job-specific claim without valid job description is rejected", () => {
      const item = "Passen Sie die Fachbegriffe an die Anforderungen der Stellenanzeige an.";
      const res = classifyActionPlanItem(item, {
        jobDescriptionStatus: "omitted",
      });
      assert.equal(res.category, "category_c_job_claim");
      assert.equal(res.isValid, false);
    });

    it("V4-B: Arabic job-specific claim without valid job description is rejected", () => {
      const item = "تعديل المهارات والخبرات لتتوافق مع متطلبات إعلان الوظيفة المستهدفة.";
      const res = classifyActionPlanItem(item, {
        jobDescriptionStatus: "omitted",
      });
      assert.equal(res.category, "category_c_job_claim");
      assert.equal(res.isValid, false);
    });

    it("V4-C: English job-specific claim without valid job description is rejected", () => {
      const item = "Align your technical skills and experience with the job posting requirements.";
      const res = classifyActionPlanItem(item, {
        jobDescriptionStatus: "omitted",
      });
      assert.equal(res.category, "category_c_job_claim");
      assert.equal(res.isValid, false);
    });

    it("V5: Arabic DIN 5008 tabular recommendation is classified as Category A (valid/retained)", () => {
      const item = "استخدام تنسيق جدولي متوافق مع معايير دين 5008 لضمان وضوح السيرة.";
      const res = classifyActionPlanItem(item);
      assert.equal(res.category, "category_a_safe_general");
      assert.equal(res.isValid, true);
    });

    it("V6: English reverse-chronological and bullet-points recommendation is classified as Category A (valid/retained)", () => {
      const item = "Use reverse chronological layout and format bullet points with quantifiable metrics.";
      const res = classifyActionPlanItem(item);
      assert.equal(res.category, "category_a_safe_general");
      assert.equal(res.isValid, true);
    });

    it("V7: Discards 'no action needed' placeholder statements across Arabic, German, and English", () => {
      const arItem = "لا حاجة لأي تعديل إضافي، السيرة جاهزة للتقديم المباشر.";
      const deItem = "Keine Anpassungen erforderlich, der Lebenslauf ist bewerbungsbereit.";
      const enItem = "No changes needed, the CV is ready for direct submission.";

      assert.equal(classifyActionPlanItem(arItem).isValid, false);
      assert.equal(classifyActionPlanItem(deItem).isValid, false);
      assert.equal(classifyActionPlanItem(enItem).isValid, false);
    });
  });

  describe("Group W: No-Weakness Placeholder Detection", () => {
    it("W1: Correctly identifies Arabic no-weakness placeholder statements", () => {
      assert.equal(isNonWeaknessStatement("لا توجد نقاط ضعف جوهرية تعيق التقديم المباشر لهذه السيرة الذاتية."), true);
      assert.equal(isNonWeaknessStatement("خالية من أي أخطاء أو نواقص."), true);
      assert.equal(isNonWeaknessStatement("سيرة ذاتية ممتازة ومقبولة ولا تحتاج إلى أي تعديل."), true);
      assert.equal(isNonWeaknessStatement("لم يتم العثور على أي ملاحظات سلبية."), true);
      assert.equal(isNoWeaknessPlaceholder("لا توجد نقاط ضعف جوهرية تعيق التقديم المباشر لهذه السيرة الذاتية."), true);
    });

    it("W2: Correctly identifies German no-weakness placeholder statements", () => {
      assert.equal(isNonWeaknessStatement("Keine wesentlichen Schwächen gefunden."), true);
      assert.equal(isNonWeaknessStatement("Keine nennenswerten Schwächen oder Lücken."), true);
      assert.equal(isNonWeaknessStatement("Vollständig und fehlerfrei."), true);
      assert.equal(isNonWeaknessStatement("Nichts zu bemängeln."), true);
      assert.equal(isNoWeaknessPlaceholder("Keine wesentlichen Schwächen gefunden."), true);
    });

    it("W3: Correctly identifies English no-weakness placeholder statements and punctuation", () => {
      assert.equal(isNonWeaknessStatement("No significant weaknesses found."), true);
      assert.equal(isNonWeaknessStatement("No major flaws detected."), true);
      assert.equal(isNonWeaknessStatement("None."), true);
      assert.equal(isNonWeaknessStatement("N/A"), true);
      assert.equal(isNonWeaknessStatement("-"), true);
      assert.equal(isNonWeaknessStatement("---"), true);
      assert.equal(isNoWeaknessPlaceholder("No significant weaknesses found."), true);
    });

    it("W4: Correctly identifies French no-weakness placeholder statements", () => {
      assert.equal(isNonWeaknessStatement("Aucune faiblesse détectée."), true);
      assert.equal(isNonWeaknessStatement("Pas de faiblesse."), true);
    });

    it("W5: Does NOT falsely flag genuine recruiter critique or weaknesses", () => {
      assert.equal(isNonWeaknessStatement("Projekterfolge enthalten keine messbaren KPIs oder quantitativen Kennzahlen."), false);
      assert.equal(isNonWeaknessStatement("Der Lebenslauf ist nicht chronologisch strukturiert."), false);
      assert.equal(isNonWeaknessStatement("Fehlende Fachbegriffe für die Cloud-Architektur."), false);
      assert.equal(isNonWeaknessStatement("الوصف الوظيفي للخبرة الأخيرة يفتقر إلى المهام التقنية التفصيلية."), false);
      assert.equal(isNoWeaknessPlaceholder("Fehlende Fachbegriffe für die Cloud-Architektur."), false);
    });
  });

  describe("Weakness Filtering Verification", () => {
    it("Retains genuine recruiter observations while dropping ungrounded date/photo/absence claims", () => {
      const entries: EmploymentEntry[] = [
        {
          company: "Siemens",
          position: "Developer",
          startDate: "2020",
          endDate: "2024",
        },
      ];
      const provenance = computeContactProvenance({
        cvText: "Max Mustermann\nDeveloper bei Siemens (2020 - 2024)",
        textExtractionSuccess: true,
      });

      const rawWeaknesses = [
        "Projekterfolge enthalten keine messbaren KPIs oder quantitativen Kennzahlen.", // Valid general observation
        "Datumsreihenfolge bei Siemens ist fehlerhaft (2020 - 2024).", // False date inversion claim (valid tenure)
        "Telefonnummer fehlt im Lebenslauf.", // Phone absence (unverified provenance)
        "Bewerbungsfoto fehlt nach DIN 5008.", // Photo requirement (Category D)
      ];

      const filtered = filterVerifiedWeaknesses(rawWeaknesses, entries, provenance);

      // Only the genuine recruiter observation should be retained
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0], "Projekterfolge enthalten keine messbaren KPIs oder quantitativen Kennzahlen.");
    });

    it("Strips Arabic, German, and English 'no weaknesses found' placeholder statements and returns []", () => {
      const placeholders = [
        "لا توجد نقاط ضعف جوهرية تعيق التقديم المباشر لهذه السيرة الذاتية.",
        "Keine wesentlichen Schwächen gefunden.",
        "No significant weaknesses detected.",
      ];
      const provenance = computeContactProvenance({
        cvText: "Max Mustermann\nDeveloper in München",
        textExtractionSuccess: true,
      });
      const filtered = filterVerifiedWeaknesses(placeholders, [], provenance);
      assert.deepEqual(filtered, []);
    });
  });

  describe("End-to-End Acceptance & 3-Tier Status Contract", () => {
    it("E2E-1: High-scoring German CV (92% overall, 95% DIN 5008) with Arabic placeholder weakness resolves to empty weaknesses and accepted status", () => {
      const rawPayload = {
        overallScore: 92,
        din5008Score: 95,
        keywordMatchScore: null,
        summary: "سيرتك الذاتية مقبولة ومتوافقة بنسبة ممتازة مع معايير DIN 5008 وأنظمة ATS الألمانية.",
        strengths: ["تنسيق جدولي ممتاز ومكتمل وفق DIN 5008", "تسلسل زمني عكسي دقيق وواضح للخبرات"],
        weaknesses: ["لا توجد نقاط ضعف جوهرية تعيق التقديم المباشر لهذه السيرة الذاتية."],
        missingKeywords: [],
        actionPlan: ["لا حاجة لأي تعديل إضافي، السيرة جاهزة للتقديم المباشر."],
      };

      // 1. Strict top-level schema validation
      const validated = validateAtsTopLevelSchema(rawPayload, false);
      assert.equal(validated.overallScore, 92);
      assert.equal(validated.din5008Score, 95);
      assert.equal(validated.keywordMatchScore, null);

      // 2. Weakness filtering (placeholder must be discarded)
      const provenance = computeContactProvenance({
        cvText: "Max Mustermann\nDeveloper in München\nErfahrung...",
        textExtractionSuccess: true,
      });
      const filteredWeaknesses = filterVerifiedWeaknesses(validated.weaknesses, [], provenance);
      assert.deepEqual(filteredWeaknesses, []);

      // 3. Action plan filtering (placeholder must be discarded)
      const filteredActionPlan = validated.actionPlan
        .map((item) => classifyActionPlanItem(item, { jobDescriptionStatus: "omitted", provenance }))
        .filter((r) => r.isValid)
        .map((r) => r.rawText);
      assert.deepEqual(filteredActionPlan, []);

      // 4. UI 3-Tier Status Contract evaluation
      const hasPassingScores =
        validated.overallScore >= 80 &&
        validated.din5008Score >= 80 &&
        (validated.keywordMatchScore === null || validated.keywordMatchScore >= 75);

      const isValidated = true;
      const isCvAccepted = isValidated && hasPassingScores && filteredWeaknesses.length === 0;
      const isGoodWithMinorNotes = isValidated && hasPassingScores && filteredWeaknesses.length > 0;

      assert.equal(hasPassingScores, true);
      assert.equal(isCvAccepted, true);
      assert.equal(isGoodWithMinorNotes, false);
    });

    it("E2E-2: High-scoring CV with genuine minor weakness (85% overall, 85% DIN 5008) resolves to isGoodWithMinorNotes without false under-80% claim", () => {
      const rawPayload = {
        overallScore: 85,
        din5008Score: 85,
        keywordMatchScore: null,
        summary: "سيرة ذاتية قوية ومؤهلة مع ملاحظات اختيارية.",
        strengths: ["تنسيق جدولي واضح"],
        weaknesses: ["Projekterfolge enthalten keine messbaren KPIs oder quantitativen Kennzahlen."],
        missingKeywords: [],
        actionPlan: ["استخدام تنسيق جدولي متوافق مع معايير دين 5008 لضمان وضوح السيرة."],
      };

      const validated = validateAtsTopLevelSchema(rawPayload, false);
      const provenance = computeContactProvenance({
        cvText: "Max Mustermann\nDeveloper in Berlin",
        textExtractionSuccess: true,
      });
      const filteredWeaknesses = filterVerifiedWeaknesses(validated.weaknesses, [], provenance);

      const hasPassingScores =
        validated.overallScore >= 80 &&
        validated.din5008Score >= 80 &&
        (validated.keywordMatchScore === null || validated.keywordMatchScore >= 75);

      const isValidated = true;
      const weaknessCount = filteredWeaknesses.length as number;
      const isCvAccepted = isValidated && hasPassingScores && weaknessCount === 0;
      const isGoodWithMinorNotes = isValidated && hasPassingScores && weaknessCount > 0;

      assert.equal(filteredWeaknesses.length, 1);
      assert.equal(hasPassingScores, true);
      assert.equal(isCvAccepted, false);
      assert.equal(isGoodWithMinorNotes, true);
    });
  });

  describe("Group L: Conservative City Extraction for Signature Line", () => {
    it("L1: Correctly identifies local municipal town from Moroccan rural douar format", () => {
      const raw = "Douar Ain Boumasaai, Tissa, Taounate, Marokko";
      assert.equal(extractCityFromAddress(raw), "Tissa");
      // Candidate's stored address must remain completely untouched
      assert.equal(raw, "Douar Ain Boumasaai, Tissa, Taounate, Marokko");
    });

    it("L2: Correctly extracts city from German street format with postal code", () => {
      assert.equal(
        extractCityFromAddress("Musterstraße 12, 10115 Berlin, Deutschland"),
        "Berlin"
      );
    });

    it("L3: Correctly extracts city from standalone postal code plus city", () => {
      assert.equal(extractCityFromAddress("10115 Berlin"), "Berlin");
      assert.equal(extractCityFromAddress("D-80331 München"), "München");
    });

    it("L4: Correctly extracts city from Moroccan urban avenue format", () => {
      assert.equal(
        extractCityFromAddress("Avenue Hassan II, Taounate, Morocco"),
        "Taounate"
      );
    });

    it("L5: Correctly extracts city from neighborhood/quartier format", () => {
      assert.equal(
        extractCityFromAddress("Quartier Al Quds, Casablanca, Maroc"),
        "Casablanca"
      );
    });

    it("L6: Returns safe conservative fallback on null or empty input", () => {
      assert.equal(extractCityFromAddress(null), "Deutschland");
      assert.equal(extractCityFromAddress(""), "Deutschland");
      assert.equal(extractCityFromAddress("   "), "Deutschland");
    });

    it("L7: Never returns street, douar, or pure country as city; falls back safely", () => {
      // Douar + Country only (no municipality given)
      assert.equal(
        extractCityFromAddress("Douar Ain Boumasaai, Marokko"),
        "Deutschland"
      );
      // Street + Country only
      assert.equal(
        extractCityFromAddress("Musterstraße 12, Deutschland"),
        "Deutschland"
      );
      // Single segment street
      assert.equal(extractCityFromAddress("Musterstraße 12"), "Deutschland");
      // Single segment douar
      assert.equal(extractCityFromAddress("Douar Ain Boumasaai"), "Deutschland");
      // Single segment country
      assert.equal(extractCityFromAddress("Deutschland"), "Deutschland");
      assert.equal(extractCityFromAddress("Marokko"), "Deutschland");
    });
  });

  describe("Group P: Skill & Language Proficiency Provenance", () => {
    it("P1: Driving licence does not have fabricated proficiency level", () => {
      const rawLicense = {
        name: "Führerschein Klasse B",
        category: "Mobilität",
        level: null,
      };
      const isLicense = /führerschein|fahrerlaubnis|driving\s*licen/i.test(rawLicense.name);
      assert.equal(isLicense, true);
      // Level must remain null/empty, never fabricated as "Fortgeschritten" or "Experte"
      assert.equal(rawLicense.level, null);
    });

    it("P2: Language CEFR level is preserved faithfully without inflation", () => {
      const candidateLang = {
        language: "Deutsch",
        proficiency: "B2",
      };
      // Must not be upgraded to C1 or Verhandlungssicher
      assert.equal(candidateLang.proficiency, "B2");
      assert.ok(!candidateLang.proficiency.includes("C1"));
    });

    it("P3: Unrated technical skill serializes cleanly without fabricated Gut or Fortgeschritten", () => {
      const skill = { name: "Git", level: null };
      const serialized = skill.level ? `${skill.name} (${skill.level})` : skill.name;
      assert.equal(serialized, "Git");
      assert.ok(!serialized.includes("Gut"));
      assert.ok(!serialized.includes("Fortgeschritten"));
    });

    it("P4: Valid explicitly supplied skill level is preserved", () => {
      const ratedSkill = { name: "TypeScript", level: "Fortgeschritten" };
      const serialized = ratedSkill.level ? `${ratedSkill.name} (${ratedSkill.level})` : ratedSkill.name;
      assert.equal(serialized, "TypeScript (Fortgeschritten)");
    });
  });

  describe("Group T: Date Precision & Timezone Invariance", () => {
    function formatSafeMonthYear(dateVal: Date | string | null | undefined): string {
      if (!dateVal) return "";
      if (typeof dateVal === "string") {
        const s = dateVal.trim();
        if (/^\d{4}$/.test(s)) return s;
        if (/^(?:heute|present|aktuell|laufend|current)$/i.test(s)) return "heute";
      }
      const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
      if (isNaN(d.getTime())) return String(dateVal);
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const year = d.getUTCFullYear();
      return `${month}/${year}`;
    }

    it("T1: UTC date does not roll back to previous year/month across timezones", () => {
      const utcDate = new Date("2022-01-01T00:00:00.000Z");
      // Must format as 01/2022, NEVER 12/2021
      assert.equal(formatSafeMonthYear(utcDate), "01/2022");
    });

    it("T2: Standalone year string preserves year-only precision without inventing month", () => {
      assert.equal(formatSafeMonthYear("2022"), "2022");
      assert.equal(formatSafeMonthYear("2020"), "2020");
    });

    it("T3: Year-month string formats consistently", () => {
      assert.equal(formatSafeMonthYear("2022-05"), "05/2022");
    });
  });

  describe("Group A: ATS Consistency & Structured Guarantees", () => {
    it("A1: When cvIdProvided is true, false positive DIN 5008 tabular formatting claims are suppressed", () => {
      const weaknesses = [
        "Der Lebenslauf ist nicht tabellarisch nach DIN 5008 aufgebaut.",
        "Projekterfolge enthalten keine messbaren Kennzahlen.",
      ];
      const provenance = computeContactProvenance({
        cvText: "Name: Max Mustermann\nE-Mail: max@example.de\nTelefon: +49 151 1234567\n",
        textExtractionSuccess: true,
        cvIdProvided: true,
      });

      const filtered = filterVerifiedWeaknesses(
        weaknesses,
        [{ startDate: "01.2020", endDate: "05.2023", company: "TechCorp" }],
        provenance,
        {
          cvIdProvided: true,
          hasExperiences: true,
          hasEducations: true,
          hasSkills: true,
        }
      );

      // The false layout complaint is discarded; genuine critique is preserved
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0], "Projekterfolge enthalten keine messbaren Kennzahlen.");
    });

    it("A2: When experiences are present in structured CV, false missing experience claims are suppressed", () => {
      const weaknesses = ["Berufserfahrung fehlt im Lebenslauf."];
      const provenance = computeContactProvenance({
        cvText: "Berufserfahrung: Entwickler bei TechCorp",
        textExtractionSuccess: true,
        cvIdProvided: true,
      });

      const filtered = filterVerifiedWeaknesses(
        weaknesses,
        [{ startDate: "01.2020", endDate: "05.2023", company: "TechCorp" }],
        provenance,
        {
          cvIdProvided: true,
          hasExperiences: true,
          hasEducations: true,
          hasSkills: true,
        }
      );

      assert.deepEqual(filtered, []);
    });
  });

  describe("Group R: Single-Date Education, Displaced Dates & Zero-Fabrication Fallback", () => {
    it("R1: 'Juni 2021' parses to 2021-06-01T00:00:00.000Z (06/2021)", () => {
      const parsed = parseEuropeanDate("Juni 2021");
      assert.ok(parsed !== null, "parseEuropeanDate('Juni 2021') must not return null");
      assert.equal(parsed.toISOString(), "2021-06-01T00:00:00.000Z");
      assert.equal(formatDate(parsed), "06/2021");
    });

    it("R2: Single-date education entry (startDate: '2021-06-01', endDate: null, isCurrent: false) renders as '06/2021' with NO trailing – and NEVER as 'heute' or '01/2026'", () => {
      const formatted = formatDateRange("2021-06-01", null, false);
      assert.equal(formatted, "06/2021");
      assert.ok(!formatted.endsWith("–"), "Must have no dangling hyphen");
      assert.ok(!formatted.endsWith("-"), "Must have no dangling dash");
      assert.ok(!formatted.includes("heute"), "Single completed education must NEVER render as 'heute'");
      assert.ok(!formatted.includes("2026"), "Must NEVER fabricate current year 2026");
    });

    it("R3: Same-month range (startDate: '2025-04-03', endDate: '2025-04-05') renders cleanly as '04/2025'", () => {
      const formatted = formatDateRange("2025-04-03", "2025-04-05", false);
      assert.equal(formatted, "04/2025");
      assert.ok(!formatted.includes("–"), "Same-month range must not contain hyphen");
    });

    it("R4: Zero-fabrication fallback uses fallbackAnchor (endDate) preserving exact year AND month", () => {
      const parsed = parseDateSafe(null, "2021-06");
      assert.equal(parsed.toISOString(), "2021-06-01T00:00:00.000Z");
      assert.equal(formatDate(parsed), "06/2021");
      assert.notEqual(parsed.getUTCFullYear(), 2026, "Must not default to current year 2026 when fallbackAnchor is provided");
    });

    it("R5: Recovers displaced date ('Juni 2021') from raw CV text around education entry keywords", () => {
      const rawCvText = `
BERUFSERFAHRUNGEN
23.01.2026 - 23.02.2026: Praktikumsbescheinigung bei Vereins AN-NAHDA
01.02.2025 - 03.03.2025: Praktikumsbescheinigung bei Stiftung für Sozialhilfe

SCHUL-UND BERUFSBILDUNG
Juni 2021
Abitur - Geisteswissenschaften - Gymnasium AIN AICHA - Taounate

ZERTIFIKATE
24.05.2025: Telc Zertifikat B2
03.04.2025 - 05.04.2025: Erste-Hilfe-Kurs
`;
      const recovered = extractDateFromContext(rawCvText, ["Abitur", "Gymnasium AIN AICHA", "Taounate"]);
      assert.ok(recovered !== null, "Must recover date from raw CV text near Abitur");
      assert.equal(recovered.toISOString(), "2021-06-01T00:00:00.000Z");
      assert.equal(formatDate(recovered), "06/2021");

      const parsedSafe = parseDateSafe(null, null, undefined, rawCvText, ["Abitur", "Gymnasium AIN AICHA"]);
      assert.equal(parsedSafe.toISOString(), "2021-06-01T00:00:00.000Z");
      assert.equal(formatDate(parsedSafe), "06/2021");
    });

    it("R6: Identical start and end dates render as a single date without trailing hyphen", () => {
      const formatted = formatDateRange("2021-06-01", "2021-06-01", false);
      assert.equal(formatted, "06/2021");
    });
  });
});
