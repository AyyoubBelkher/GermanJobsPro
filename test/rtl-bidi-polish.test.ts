import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  formatArabicRelativeDays,
  formatRelativeJobDate,
  splitSalaryBidiSegments,
}: typeof import("../src/lib/jobUtils") = require("../src/lib/jobUtils.ts");
const {
  formatBidiInlineText,
  isolateBidiText,
  extractCleanExcerpt,
}: typeof import("../src/lib/courseUtils") = require("../src/lib/courseUtils.ts");
const {
  formatNumericDateUTC,
}: typeof import("../src/lib/cv-date-utils") = require("../src/lib/cv-date-utils.ts");
const {
  CV_LIST_PAGE_SIZE,
  filterCvSummaries,
  paginateItems,
}: typeof import("../src/lib/cv-list-utils") = require("../src/lib/cv-list-utils.ts");

function flattenReactText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenReactText).join("");
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return flattenReactText(props?.children);
  }
  return "";
}

describe("Arabic Relative Date Pluralization", () => {
  it("formats 0, 1, 2, 3-10, and 11+ days according to Arabic grammar rules", () => {
    assert.equal(formatArabicRelativeDays(0), "اليوم");
    assert.equal(formatArabicRelativeDays(1), "منذ يوم");
    assert.equal(formatArabicRelativeDays(2), "منذ يومين");
    assert.equal(formatArabicRelativeDays(3), "منذ 3 أيام");
    assert.equal(formatArabicRelativeDays(7), "منذ 7 أيام");
    assert.equal(formatArabicRelativeDays(10), "منذ 10 أيام");
    assert.equal(formatArabicRelativeDays(11), "منذ 11 يوماً");
    assert.equal(formatArabicRelativeDays(12), "منذ 12 يوماً");
    assert.equal(formatArabicRelativeDays(25), "منذ 25 يوماً");
  });

  it("formats Date timestamps accurately via formatRelativeJobDate in Arabic and LTR locales", () => {
    const now = new Date("2026-11-24T12:00:00Z");
    const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

    assert.equal(formatRelativeJobDate(now, "ar", now), "اليوم");
    assert.equal(formatRelativeJobDate(daysAgo(1), "ar", now), "منذ يوم");
    assert.equal(formatRelativeJobDate(daysAgo(2), "ar", now), "منذ يومين");
    assert.equal(formatRelativeJobDate(daysAgo(3), "ar", now), "منذ 3 أيام");
    assert.equal(formatRelativeJobDate(daysAgo(10), "ar", now), "منذ 10 أيام");
    assert.equal(formatRelativeJobDate(daysAgo(12), "ar", now), "منذ 12 يوماً");

    assert.equal(formatRelativeJobDate(daysAgo(2), "de", now), "Vor 2 Tagen");
    assert.equal(formatRelativeJobDate(daysAgo(2), "en", now), "2 days ago");
    assert.equal(formatRelativeJobDate(daysAgo(2), "fr", now), "Il y a 2 jours");
  });
});

describe("Salary Range LTR BiDi Splitting", () => {
  it("isolates min-to-max Euro ranges while keeping Arabic labels in RTL flow", () => {
    const segments = splitSalaryBidiSegments("€ 90.000 - € 130.000 سنوياً");
    assert.deepEqual(segments, [
      { text: "€ 90.000 - € 130.000", isLtr: true },
      { text: " سنوياً", isLtr: false },
    ]);

    const rangeOnly = splitSalaryBidiSegments("€ 90.000 - € 130.000");
    assert.deepEqual(rangeOnly, [{ text: "€ 90.000 - € 130.000", isLtr: true }]);

    const trailingEuro = splitSalaryBidiSegments("3.500 € - 4.200 € شهرياً");
    assert.deepEqual(trailingEuro, [
      { text: "3.500 € - 4.200 €", isLtr: true },
      { text: " شهرياً", isLtr: false },
    ]);

    const arabicBound = splitSalaryBidiSegments("من 45.000 € إلى 60.000 €");
    assert.deepEqual(arabicBound, [
      { text: "من ", isLtr: false },
      { text: "45.000 €", isLtr: true },
      { text: " إلى ", isLtr: false },
      { text: "60.000 €", isLtr: true },
    ]);
  });
});

describe("BiDi Isolation for Blog Titles & Homepage Comparison Bullets", () => {
  it("isolates parenthesized Latin terms followed by colons without flipping punctuation", () => {
    const samples = [
      "ثقافة العمل في ألمانيا (Arbeitskultur): 15 قاعدة أساسية",
      "البحث عن سكن في ألمانيا (Wohnungssuche): نصائح عملية",
      "التأمين الصحي في ألمانيا (Krankenkasse): الدليل الكامل",
    ];

    for (const input of samples) {
      const isolatedStr = isolateBidiText(input, true);
      assert.ok(isolatedStr.includes("\u2066("), `Expected LRI before paren in: ${input}`);
      assert.ok(isolatedStr.includes(")\u2069\u200F:"), `Expected PDI+RLM+colon in: ${input}`);

      const reactResult = formatBidiInlineText(input, true);
      const children = React.Children.toArray(reactResult);
      const hasBdiAndColon = children.some((c: any) => {
        if (!c?.props?.children || !Array.isArray(c.props.children)) return false;
        const hasBdi = c.props.children.some(
          (sub: any) => sub?.type === "bdi" && sub?.props?.dir === "ltr"
        );
        const hasAnchoredColon = c.props.children.some(
          (sub: any) => typeof sub === "string" && sub.includes("\u200F:")
        );
        return hasBdi && hasAnchoredColon;
      });
      assert.ok(hasBdiAndColon, `Expected <bdi dir="ltr"> + \\u200F: for: ${input}`);
      assert.equal(flattenReactText(reactResult).replace(/\u200F/g, ""), input);
    }
  });

  it("preserves DIN 5008 intact without dropping D and isolates ATS. trailing period", () => {
    const blogTitle =
      "الدليل الشامل لكتابة السيرة الذاتية الألمانية (Lebenslauf) وفق معيار DIN 5008: الأخطاء الشائعة";
    const isolatedTitle = isolateBidiText(blogTitle, true);
    assert.ok(isolatedTitle.includes("\u2066DIN 5008\u2069\u200F:"));
    assert.ok(isolatedTitle.includes("\u2066(Lebenslauf)\u2069"));

    const renderedTitle = formatBidiInlineText(blogTitle, true);
    assert.equal(flattenReactText(renderedTitle).replace(/\u200F/g, ""), blogTitle);

    const bullet1 = "تنسيق عشوائي غير متطابق مع معيار DIN 5008 يفشل في فلاتر ATS.";
    const isolatedBullet1 = isolateBidiText(bullet1, true);
    assert.ok(isolatedBullet1.includes("\u2066DIN 5008\u2069"));
    assert.ok(isolatedBullet1.includes("\u2066ATS\u2069\u200F."));

    const renderedBullet1 = formatBidiInlineText(bullet1, true);
    const bulletChildren = React.Children.toArray(renderedBullet1);
    const hasAtsBdi = bulletChildren.some((c: any) => {
      if (!c?.props?.children || !Array.isArray(c.props.children)) return false;
      const hasBdi = c.props.children.some(
        (sub: any) => sub?.type === "bdi" && sub?.props?.dir === "ltr" && sub?.props?.children === "ATS"
      );
      const hasPeriod = c.props.children.some(
        (sub: any) => typeof sub === "string" && sub.includes("\u200F.")
      );
      return hasBdi && hasPeriod;
    });
    assert.ok(hasAtsBdi, "Expected <bdi dir='ltr'>ATS</bdi> anchored with \\u200F.");
    assert.equal(flattenReactText(renderedBullet1).replace(/\u200F/g, ""), bullet1);
  });

  it("truncates long excerpts on clean word boundaries", () => {
    const text = "الدليل الشامل لكتابة السيرة الذاتية الألمانية وفق معيار DIN 5008 للمهندسين";
    const excerpt = extractCleanExcerpt(text, undefined, 45);
    assert.ok(excerpt.endsWith("..."));
    assert.ok(!excerpt.endsWith("ا..."));
  });
});

describe("BiDi Isolation for Digit-Prefixed Latin Phrases (1-Click PDF)", () => {
  it("isolates parenthesized (1-Click PDF) and (1-Click PDF to DIN 5008) in RTL Arabic", () => {
    const samples = [
      {
        input: "تحويل فوري (1-Click PDF)",
        token: "(1-Click PDF)",
      },
      {
        input: "تحويل فوري وتكييف ذكي للسيرة الذاتية (1-Click PDF to DIN 5008)",
        token: "(1-Click PDF to DIN 5008)",
      },
    ];

    for (const { input, token } of samples) {
      const isolated = isolateBidiText(input, true);
      assert.ok(isolated.includes(`\u2066${token}\u2069`), `Expected LRI/PDI around ${token}`);

      const rendered = formatBidiInlineText(input, true);
      const children = React.Children.toArray(rendered);
      const hasBdi = children.some(
        (c: any) => c?.type === "bdi" && c?.props?.dir === "ltr" && c?.props?.children === token
      );
      assert.ok(hasBdi, `Expected <bdi dir="ltr">${token}</bdi>`);
      assert.equal(flattenReactText(rendered), input);
    }
  });

  it("isolates unparenthesized 1-Click PDF and 1-Click PDF to DIN 5008 inside Arabic copy", () => {
    const phrase1 = "ميزة 1-Click PDF لتحويل السيرة الذاتية";
    assert.ok(isolateBidiText(phrase1, true).includes("\u20661-Click PDF\u2069"));
    const rendered1 = formatBidiInlineText(phrase1, true);
    const bdi1 = React.Children.toArray(rendered1).find(
      (c: any) => c?.type === "bdi" && c?.props?.dir === "ltr" && c?.props?.children === "1-Click PDF"
    );
    assert.ok(bdi1, "Expected <bdi dir='ltr'>1-Click PDF</bdi>");

    const phrase2 = "خدمة 1-Click PDF to DIN 5008 المتقدمة.";
    assert.ok(isolateBidiText(phrase2, true).includes("\u20661-Click PDF to DIN 5008\u2069"));
    const rendered2 = formatBidiInlineText(phrase2, true);
    assert.equal(flattenReactText(rendered2).replace(/\u200F/g, ""), phrase2);

    const phrase3 = "استخدم ميزة 1-Click PDF to DIN 5008.";
    assert.ok(isolateBidiText(phrase3, true).includes("\u20661-Click PDF to DIN 5008\u2069\u200F."));
  });
});

describe("UTC Numeric Date Formatting for RTL Isolation", () => {
  it("formats dates deterministically in UTC without Unicode RTL marks", () => {
    const iso = "2026-11-19T23:30:00.000Z";
    const arDate = formatNumericDateUTC(iso, "ar");
    const frDate = formatNumericDateUTC(iso, "fr");
    const deDate = formatNumericDateUTC(iso, "de");
    const enDate = formatNumericDateUTC(iso, "en");

    assert.equal(arDate, "19/11/2026");
    assert.equal(frDate, "19/11/2026");
    assert.equal(deDate, "19.11.2026");
    assert.equal(enDate, "11/19/2026");

    assert.equal(arDate.includes("\u200F"), false);
    assert.equal(arDate.includes("\u200E"), false);
    assert.equal(formatNumericDateUTC(null, "ar"), "");
    assert.equal(formatNumericDateUTC("not-a-date", "ar"), "");
  });
});

describe("CV List Search & Pagination Helpers", () => {
  const sampleCvs = Array.from({ length: 30 }, (_, idx) => ({
    id: `cv-${idx + 1}`,
    title: idx === 0 ? "Backend Engineer CV" : `Lebenslauf #${idx + 1}`,
    personalInfo: {
      targetJobTitle: idx === 5 ? "Automation Specialist" : "Software Developer",
    },
  }));

  it("filters CV summaries by title or targetJobTitle case-insensitively", () => {
    assert.equal(filterCvSummaries(sampleCvs, "").length, 30);
    assert.equal(filterCvSummaries(sampleCvs, "  backend  ").map((c) => c.id).join(","), "cv-1");
    assert.equal(filterCvSummaries(sampleCvs, "automation").map((c) => c.id).join(","), "cv-6");
    assert.equal(filterCvSummaries(sampleCvs, "nonexistent").length, 0);
  });

  it("paginates 12 items per page and clamps out-of-range page numbers", () => {
    assert.equal(CV_LIST_PAGE_SIZE, 12);

    const page1 = paginateItems(sampleCvs, 1, CV_LIST_PAGE_SIZE);
    assert.equal(page1.items.length, 12);
    assert.equal(page1.currentPage, 1);
    assert.equal(page1.totalPages, 3);
    assert.equal(page1.items[0].id, "cv-1");

    const page3 = paginateItems(sampleCvs, 3, CV_LIST_PAGE_SIZE);
    assert.equal(page3.items.length, 6);
    assert.equal(page3.currentPage, 3);
    assert.equal(page3.items[0].id, "cv-25");

    const clampedHigh = paginateItems(sampleCvs, 99, CV_LIST_PAGE_SIZE);
    assert.equal(clampedHigh.currentPage, 3);

    const clampedLow = paginateItems(sampleCvs, 0, CV_LIST_PAGE_SIZE);
    assert.equal(clampedLow.currentPage, 1);
  });
});
