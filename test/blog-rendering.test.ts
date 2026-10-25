import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { createRequire } from "node:module";
import type {
  ParsedBranchingDiagram,
  ParsedTimelineDiagram,
  ParsedGenericDiagram,
} from "../src/lib/courseUtils";

const require = createRequire(import.meta.url);
const {
  parseAsciiOrMarkdownTable,
  parseAsciiDiagram,
  localizeCategoryLabel,
  formatBidiInlineText,
  normalizeMarkdownFormatting,
}: typeof import("../src/lib/courseUtils") = require("../src/lib/courseUtils.ts");

describe("Blog Articles Rendering & Layout Unit Tests", () => {
  describe("Bug 1: parseAsciiOrMarkdownTable", () => {
    it("parses Blue Card ASCII grid table with single-cell header and 2-column rows", () => {
      const rawAsciiTable = `
+-----------------------------------------------------------+
|          متطلبات الراتب السنوي الإجمالي (Bruttogehalt)      |
+-----------------------------------------------------------+
| المهن العامة (General Mangelberufe):      ~45,300 يورو    |
| التخصصات النادرة والمبتدئين:            ~41,041 يورو    |
+-----------------------------------------------------------+
`;
      const result = parseAsciiOrMarkdownTable(rawAsciiTable);
      assert.notEqual(result, null);
      assert.equal(result!.headers.length, 1);
      assert.equal(result!.headers[0], "متطلبات الراتب السنوي الإجمالي (Bruttogehalt)");
      assert.equal(result!.rows.length, 2);
      assert.equal(result!.rows[0][0], "المهن العامة (General Mangelberufe):");
      assert.equal(result!.rows[0][1], "~45,300 يورو");
      assert.equal(result!.rows[1][0], "التخصصات النادرة والمبتدئين:");
      assert.equal(result!.rows[1][1], "~41,041 يورو");
    });

    it("parses standard Markdown pipe tables", () => {
      const rawPipeTable = `
| المسار | المدة | المتطلبات |
|---|---|---|
| دورة التعديل | 6-18 شهراً | تدريب عملي + نظري |
| امتحان المعرفة | تحضير مكثف | اختبار عملي + شفوي |
`;
      const result = parseAsciiOrMarkdownTable(rawPipeTable);
      assert.notEqual(result, null);
      assert.deepEqual(result!.headers, ["المسار", "المدة", "المتطلبات"]);
      assert.equal(result!.rows.length, 2);
      assert.deepEqual(result!.rows[0], ["دورة التعديل", "6-18 شهراً", "تدريب عملي + نظري"]);
      assert.deepEqual(result!.rows[1], ["امتحان المعرفة", "تحضير مكثف", "اختبار عملي + شفوي"]);
    });

    it("returns null for non-table raw code blocks", () => {
      const nonTableCode = `
function hello() {
  console.log("Not a table");
}
`;
      assert.equal(parseAsciiOrMarkdownTable(nonTableCode), null);
    });
  });

  describe("Bug 1: parseAsciiDiagram", () => {
    it("parses Nursing recognition branching diagram with strictly paired pathways", () => {
      const nursingDiagramRaw = `
                  [ التقديم على معادلة الشهادة Defizitbescheid ]
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
   [ المسار الأول: دورة التعديل ]                   [ المسار الثاني: امتحان المعرفة ]
       Anpassungslehrgang                              Kenntnisprüfung
              │                                               │
   • تدريب عملي + نظري                                • اختبار عملي + شفوي
   • المدة: 6 إلى 18 شهراً                            • التجهيز: تحضير مكثف
              │                                               │
              └───────────────────────┬───────────────────────┘
                                      ▼
                        [ الحصول على الترخيص النهائي ]
                             Berufserlaubnis / Urkunde
`;
      const result = parseAsciiDiagram(nursingDiagramRaw);
      assert.notEqual(result, null);
      assert.equal(result!.type, "branching");

      const branching = result as ParsedBranchingDiagram;
      assert.equal(branching.root.title, "التقديم على معادلة الشهادة");
      assert.equal(branching.root.subtitle, "Defizitbescheid");

      assert.equal(branching.branches.length, 2);
      // Strictly pairs Anpassungslehrgang with المسار الأول: دورة التعديل
      assert.equal(branching.branches[0].title, "المسار الأول: دورة التعديل");
      assert.equal(branching.branches[0].germanTerm, "Anpassungslehrgang");
      assert.deepEqual(branching.branches[0].points, [
        "تدريب عملي + نظري",
        "المدة: 6 إلى 18 شهراً",
      ]);

      // Strictly pairs Kenntnisprüfung with المسار الثاني: امتحان المعرفة
      assert.equal(branching.branches[1].title, "المسار الثاني: امتحان المعرفة");
      assert.equal(branching.branches[1].germanTerm, "Kenntnisprüfung");
      assert.deepEqual(branching.branches[1].points, [
        "اختبار عملي + شفوي",
        "التجهيز: تحضير مكثف",
      ]);

      assert.equal(branching.outcome?.title, "الحصول على الترخيص النهائي");
      assert.equal(branching.outcome?.subtitle, "Berufserlaubnis / Urkunde");
    });

    it("parses Blue Card timeline flowchart with milestones and durations", () => {
      const blueCardTimelineRaw = `
         مسار الحصول على الإقامة الدائمة (Niederlassungserlaubnis)
         ----------------------------------------------------
         
   [ الحصول على البطاقة الزرقاء ]
                 |
                 +---> مستقرة + B1 لغة ألمانية -------> بعد 21 شهراً
                 |
                 +---> مستقرة + A1 لغة ألمانية -------> بعد 27 شهراً
`;
      const result = parseAsciiDiagram(blueCardTimelineRaw);
      assert.notEqual(result, null);
      assert.equal(result!.type, "timeline");

      const timeline = result as ParsedTimelineDiagram;
      assert.ok(timeline.title?.includes("الإقامة الدائمة"));
      assert.equal(timeline.root, "الحصول على البطاقة الزرقاء");
      assert.equal(timeline.steps.length, 2);
      assert.equal(timeline.steps[0].condition, "مستقرة + B1 لغة ألمانية");
      assert.equal(timeline.steps[0].duration, "بعد 21 شهراً");
      assert.equal(timeline.steps[1].condition, "مستقرة + A1 لغة ألمانية");
      assert.equal(timeline.steps[1].duration, "بعد 27 شهراً");
    });

    it("extracts structured nodes in generic diagram fallback without box-drawing characters", () => {
      const genericDiagramRaw = `
┌───────────────────────────┐
│ الخطوة الأولى: تجهيز الملف │
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│ الخطوة الثانية: تقديم الطلب│
└───────────────────────────┘
`;
      const result = parseAsciiDiagram(genericDiagramRaw);
      assert.notEqual(result, null);
      assert.equal(result!.type, "generic");

      const generic = result as ParsedGenericDiagram;
      assert.equal(generic.nodes.length, 2);
      assert.ok(!/[┌┐└┘─│┬┴├┤┼▼▲►◄]/.test(generic.nodes[0].title));
      assert.ok(generic.nodes[0].title.includes("الخطوة الأولى"));
      assert.ok(generic.nodes[1].title.includes("الخطوة الثانية"));
    });

    it("returns null for non-diagram code blocks", () => {
      const normalCode = `const x = 10;\nconst y = 20;`;
      assert.equal(parseAsciiDiagram(normalCode), null);
    });
  });

  describe("Bug 2: BiDi Parenthesis & Status Token Isolation (formatBidiInlineText)", () => {
    it("fixes nested / unbalanced parentheses (ZAB (Zentralstelle...", () => {
      const input = "وفق تقييم (ZAB (Zentralstelle für ausländisches Bildungswesen للحصول على المعادلة";
      const result = formatBidiInlineText(input, true);
      // Ensure the unbalanced paren was replaced
      const text = React.Children.toArray(result)
        .map((child: any) => (typeof child === "string" ? child : child?.props?.children))
        .flat()
        .join("");
      assert.ok(!text.includes("(ZAB ("));
      assert.ok(text.includes("(ZAB - Zentralstelle für ausländisches Bildungswesen)"));
    });

    it("wraps parenthetical German terms in <bdi dir='ltr'> and anchors trailing punctuation with \\u200F", () => {
      const input = "شروط (Blaue Karte EU): ومصطلح (Anerkennung): ومجال (Altenpflege)؟";
      const result = formatBidiInlineText(input, true);
      const children = React.Children.toArray(result);

      // Verify that React elements with bdi dir="ltr" are generated
      const bdiElements = children.filter(
        (c: any) =>
          c &&
          (c.type === "bdi" ||
            (c.props?.children &&
              Array.isArray(c.props.children) &&
              c.props.children.some((sub: any) => sub?.type === "bdi")))
      );
      assert.ok(bdiElements.length >= 3);

      // Verify that trailing colons / question marks have \\u200F
      const frags = children.filter((c: any) => typeof c !== "string");
      const hasRlmPunct = frags.some((f: any) => {
        const text = Array.isArray(f.props?.children)
          ? f.props.children.find((x: any) => typeof x === "string")
          : "";
        return typeof text === "string" && text.includes("\u200F");
      });
      assert.ok(hasRlmPunct);
    });

    it("isolates technical status tokens H+, H-, H+/- with <bdi dir='ltr'> and \\u200F", () => {
      const input = "في قاعدة بيانات Anabin تصنف الجامعة كـ H+ أو H+/- أو H- للتقديم";
      const result = formatBidiInlineText(input, true);
      const children = React.Children.toArray(result);

      const hasStatusBdi = children.some((c: any) => {
        if (c?.type === "bdi" && (c.props?.children === "H+" || c.props?.children === "H+/-")) {
          return true;
        }
        if (c?.props?.children && Array.isArray(c.props.children)) {
          return c.props.children.some(
            (sub: any) => sub?.type === "bdi" && (sub.props?.children === "H+" || sub.props?.children === "H+/-")
          );
        }
        return false;
      });
      assert.ok(hasStatusBdi);
    });

    it("applies inline break-words for multi-word or long parentheticals and whitespace-nowrap only for short single tokens", () => {
      const input = "مستوى (B2) مطلوب للحصول على (Blaue Karte EU) مع تصنيف H+ ومصطلح (Zentralstelle für ausländisches Bildungswesen)";
      const result = formatBidiInlineText(input, true);
      const children = React.Children.toArray(result);

      const bdis: any[] = [];
      children.forEach((c: any) => {
        if (!c) return;
        if (c.type === "bdi") {
          bdis.push(c);
        } else if (c.props?.children) {
          const innerChildren = Array.isArray(c.props.children)
            ? c.props.children
            : [c.props.children];
          innerChildren.forEach((child: any) => {
            if (child?.type === "bdi") {
              bdis.push(child);
            }
          });
        }
      });

      const b2El = bdis.find((el) => el.props.children === "(B2)");
      assert.ok(b2El, "Found (B2) bdi element");
      assert.equal(b2El.props.className, "inline-block whitespace-nowrap");

      const blaueKarteEl = bdis.find((el) => el.props.children === "(Blaue Karte EU)");
      assert.ok(blaueKarteEl, "Found (Blaue Karte EU) bdi element");
      assert.equal(blaueKarteEl.props.className, "inline break-words");

      const longGermanEl = bdis.find((el) =>
        typeof el.props.children === "string" && el.props.children.includes("Zentralstelle")
      );
      assert.ok(longGermanEl, "Found long German term bdi element");
      assert.equal(longGermanEl.props.className, "inline break-words");

      const statusEl = bdis.find((el) => el.props.children === "H+");
      assert.ok(statusEl, "Found H+ status token element");
      assert.equal(statusEl.props.className, "inline-block whitespace-nowrap font-mono font-bold");
    });

    it("leaves text unchanged when isAr is false", () => {
      const input = "Requirements for (Blaue Karte EU): German job market.";
      const result = formatBidiInlineText(input, false);
      assert.equal(result, input);
    });
  });

  describe("Bug 4: Category Localization (localizeCategoryLabel)", () => {
    it("localizes Jobs / Karriere category across languages", () => {
      assert.equal(localizeCategoryLabel("Jobs", "ar"), "فرص العمل والتأشيرة");
      assert.equal(localizeCategoryLabel("Karriere", "ar"), "فرص العمل والتأشيرة");
      assert.equal(localizeCategoryLabel("Jobs", "de"), "Jobs & Visum");
      assert.equal(localizeCategoryLabel("Jobs", "fr"), "Emplois & Visa");
      assert.equal(localizeCategoryLabel("Jobs", "en"), "Jobs & Visa");
    });

    it("localizes General / عام category across languages", () => {
      assert.equal(localizeCategoryLabel("General", "ar"), "دليل المعيشة والاستقرار");
      assert.equal(localizeCategoryLabel("عام", "ar"), "دليل المعيشة والاستقرار");
      assert.equal(localizeCategoryLabel("General", "de"), "Ratgeber & Leben");
      assert.equal(localizeCategoryLabel("General", "fr"), "Guides & Vie");
      assert.equal(localizeCategoryLabel("General", "en"), "Guides & Life");
    });

    it("localizes German A1 category across languages", () => {
      assert.equal(localizeCategoryLabel("German A1", "ar"), "كورس الألمانية A1");
      assert.equal(localizeCategoryLabel("Deutsch A1", "de"), "Deutsch A1 Kurs");
      assert.equal(localizeCategoryLabel("German A1", "fr"), "Cours d'allemand A1");
      assert.equal(localizeCategoryLabel("German A1", "en"), "German A1 Course");
    });

    it("provides safe localized fallback for empty/undefined category", () => {
      assert.equal(localizeCategoryLabel(null, "ar"), "فرص العمل والتأشيرة");
      assert.equal(localizeCategoryLabel(undefined, "de"), "Jobs & Visum");
      assert.equal(localizeCategoryLabel("", "en"), "Jobs & Visa");
    });
  });

  describe("Markdown Normalization (normalizeMarkdownFormatting)", () => {
    it("merges split numbered headings across lines", () => {
      const splitHeading = "### 1.\n\n### متطلبات التأشيرة";
      const normalized = normalizeMarkdownFormatting(splitHeading);
      assert.equal(normalized, "### 1. متطلبات التأشيرة");
    });

    it("converts short single-line triple backticks to inline code", () => {
      const shortCodeBlock = "```45,300 يورو```";
      const normalized = normalizeMarkdownFormatting(shortCodeBlock);
      assert.equal(normalized, "`45,300 يورو`");
    });

    it("normalizes unbalanced parens in raw markdown", () => {
      const text = "قرار (ZAB (Zentralstelle für ausländisches Bildungswesen الصادر";
      const normalized = normalizeMarkdownFormatting(text);
      assert.ok(normalized.includes("(ZAB - Zentralstelle für ausländisches Bildungswesen)"));
    });
  });
});
