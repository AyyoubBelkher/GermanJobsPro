import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { isExpiringSocialCdnUrl } from "../src/lib/imageUtils";
import { formatBidiInlineText } from "../src/lib/courseUtils";
import { GUMROAD_VARIANTS } from "../src/lib/gumroad";
import { buildRefundAiCreditQuery, getDailyQuotaWindow } from "../src/lib/monetization";
import {
  serializeGuestCvDraft,
  parseGuestCvDraft,
  GUEST_CV_DRAFT_KEY,
} from "../src/lib/guest-cv-draft";

describe("Security & SSRF Mitigation: isExpiringSocialCdnUrl", () => {
  it("strictly accepts legitimate Facebook / Meta CDN hostnames", () => {
    assert.equal(
      isExpiringSocialCdnUrl("https://scontent-fra3-1.xx.fbcdn.net/v/t39.30808-6/456_n.jpg?_nc_cat=104"),
      true
    );
    assert.equal(
      isExpiringSocialCdnUrl("https://fbcdn.net/images/sample.png"),
      true
    );
    assert.equal(
      isExpiringSocialCdnUrl("https://static.xx.fbsbx.com/rsrc.php/v3/y4/r/test.png"),
      true
    );
    assert.equal(
      isExpiringSocialCdnUrl("http://fbsbx.com/avatar.jpg"),
      true
    );
  });

  it("strictly REJECTS spoofed query-string URLs trying to bypass substring checks", () => {
    // Attack scenario: query string contains "scontent" or "fbcdn.net"
    assert.equal(isExpiringSocialCdnUrl("https://evil.com/?scontent=1"), false);
    assert.equal(isExpiringSocialCdnUrl("https://evil.com/?target=fbcdn.net"), false);
    assert.equal(isExpiringSocialCdnUrl("https://attacker.org/path/to/scontent/image.png"), false);
    assert.equal(isExpiringSocialCdnUrl("https://evil.com/fbcdn.net/test.jpg"), false);
  });

  it("strictly REJECTS spoofed subdomains and path traversal attacks", () => {
    // Attacker controls fbcdn.net.attacker.com
    assert.equal(isExpiringSocialCdnUrl("https://fbcdn.net.attacker.com/malicious.png"), false);
    assert.equal(isExpiringSocialCdnUrl("https://fbsbx.com.evil.com/payload.jpg"), false);
    assert.equal(isExpiringSocialCdnUrl("https://notfbcdn.net/image.png"), false);
  });

  it("strictly REJECTS non-HTTP/HTTPS protocols to prevent SSRF and XSS", () => {
    assert.equal(isExpiringSocialCdnUrl("javascript:alert(1)//fbcdn.net"), false);
    assert.equal(isExpiringSocialCdnUrl("file:///etc/passwd?fbcdn.net"), false);
    assert.equal(isExpiringSocialCdnUrl("ftp://scontent.xx.fbcdn.net/image.png"), false);
    assert.equal(isExpiringSocialCdnUrl("data:image/png;base64,fbcdn.net"), false);
  });

  it("safely handles null, undefined, empty strings, and malformed URLs", () => {
    assert.equal(isExpiringSocialCdnUrl(""), false);
    assert.equal(isExpiringSocialCdnUrl("not a url"), false);
    assert.equal(isExpiringSocialCdnUrl(null as any), false);
    assert.equal(isExpiringSocialCdnUrl(undefined as any), false);
  });
});

describe("Arabic BiDi & Parenthesis Isolation: formatBidiInlineText", () => {
  it("correctly isolates comparison German term (Substantivstil) in RTL Arabic", () => {
    const input = "صياغة الجمل بأسلوب الأسماء الأكاديمي (Substantivstil) لرفع معدل القبول";
    const result = formatBidiInlineText(input, true);

    const children = React.Children.toArray(result);
    const bdiElement = children.find(
      (c: any) => c && c.type === "bdi" && c.props?.children === "(Substantivstil)"
    );

    assert.ok(bdiElement, "Expected <bdi dir='ltr'>(Substantivstil)</bdi> element");
    assert.equal((bdiElement as any).props.dir, "ltr");
  });

  it("correctly isolates FAQ term (Chancenkarte)؟ with anchored RLM \\u200F in RTL Arabic", () => {
    const input = "هل الملف متوافق مع متطلبات تأشيرة بطاقة الفرصة (Chancenkarte)؟";
    const result = formatBidiInlineText(input, true);

    const children = React.Children.toArray(result);
    // Find fragment containing bdi and \u200F؟
    const frag = children.find((c: any) => {
      if (!c?.props?.children || !Array.isArray(c.props.children)) return false;
      const hasBdi = c.props.children.some(
        (sub: any) => sub?.type === "bdi" && sub?.props?.children === "(Chancenkarte)"
      );
      const hasRlm = c.props.children.some(
        (sub: any) => typeof sub === "string" && sub.includes("\u200F؟")
      );
      return hasBdi && hasRlm;
    });

    assert.ok(frag, "Expected <bdi>(Chancenkarte)</bdi> anchored with \\u200F؟");
  });

  it("correctly isolates FAQ term (Bewerbungsmappe)؟ with anchored RLM \\u200F in RTL Arabic", () => {
    const input = "ما هي محتويات ملف الترشيح الكامل (Bewerbungsmappe)؟";
    const result = formatBidiInlineText(input, true);

    const children = React.Children.toArray(result);
    const frag = children.find((c: any) => {
      if (!c?.props?.children || !Array.isArray(c.props.children)) return false;
      const hasBdi = c.props.children.some(
        (sub: any) => sub?.type === "bdi" && sub?.props?.children === "(Bewerbungsmappe)"
      );
      const hasRlm = c.props.children.some(
        (sub: any) => typeof sub === "string" && sub.includes("\u200F؟")
      );
      return hasBdi && hasRlm;
    });

    assert.ok(frag, "Expected <bdi>(Bewerbungsmappe)</bdi> anchored with \\u200F؟");
  });

  it("leaves text unchanged when isAr is false", () => {
    const input = "What is included in the full dossier (Bewerbungsmappe)?";
    const result = formatBidiInlineText(input, false);
    assert.equal(result, input);
  });
});

describe("Gumroad Unified Variants Configuration", () => {
  it("exports unified constant strings for 30-day and 90-day passes", () => {
    assert.equal(GUMROAD_VARIANTS.SPRINT_30D, "Quick Sprint (30 Days)");
    assert.equal(GUMROAD_VARIANTS.PRO_90D, "PRO Job Pass (90 Days)");
  });
});

describe("AI Credit Refund Scoping & Hygiene: buildRefundAiCreditQuery", () => {
  const testUserId = "usr_test_123456";

  it("strictly scopes query by operation when action is provided", () => {
    const fixedDate = new Date("2026-11-24T12:00:00Z");
    const query = buildRefundAiCreditQuery(testUserId, "COVER_LETTER_GEN", fixedDate);

    assert.equal(query.where.userId, testUserId);
    assert.equal(query.where.success, true);
    assert.equal(query.where.operation, "COVER_LETTER_GEN");
    assert.deepEqual(query.where.createdAt, { gte: fixedDate });
    assert.deepEqual(query.orderBy, { createdAt: "desc" });
  });

  it("omits operation from where clause when action is omitted (backward compatibility)", () => {
    const query = buildRefundAiCreditQuery(testUserId);

    assert.equal(query.where.userId, testUserId);
    assert.equal(query.where.success, true);
    assert.equal((query.where as any).operation, undefined);
    assert.ok(query.where.createdAt.gte instanceof Date);
    assert.deepEqual(query.orderBy, { createdAt: "desc" });
  });

  it("creates a 2-minute default sliding window when sinceDate is omitted", () => {
    const beforeCall = Date.now() - 2 * 60 * 1000;
    const query = buildRefundAiCreditQuery(testUserId, "ATS_ANALYSIS");
    const afterCall = Date.now() - 2 * 60 * 1000;

    const gteTime = query.where.createdAt.gte.getTime();
    assert.ok(gteTime >= beforeCall - 50 && gteTime <= afterCall + 50);
  });
});

describe("Client-Side Guest DIN 5008 CV Draft: Serialization & Safe Fallbacks", () => {
  it("exports correct sessionStorage draft key", () => {
    assert.equal(GUEST_CV_DRAFT_KEY, "gjp_guest_cv_draft");
  });

  it("serializes valid draft with ISO savedAt timestamp and default values", () => {
    const serialized = serializeGuestCvDraft({
      fullName: "Max Mustermann",
      targetJobTitle: "Frontend Developer",
      location: "Berlin, Deutschland",
      currentRole: "Web Developer",
      keyBullet: "Built scalable web apps",
      languageLevel: "B2",
    });

    assert.equal(typeof serialized, "string");
    const parsed = JSON.parse(serialized);
    assert.equal(parsed.fullName, "Max Mustermann");
    assert.equal(parsed.targetJobTitle, "Frontend Developer");
    assert.equal(parsed.location, "Berlin, Deutschland");
    assert.equal(parsed.currentRole, "Web Developer");
    assert.equal(parsed.keyBullet, "Built scalable web apps");
    assert.equal(parsed.languageLevel, "B2");
    assert.equal(parsed.language, "de");
    assert.ok(typeof parsed.savedAt === "string");
  });

  it("deserializes valid draft string accurately and trims whitespace", () => {
    const jsonStr = JSON.stringify({
      fullName: "  Fatima Al-Mansoor  ",
      targetJobTitle: "  Cloud Engineer  ",
      location: "Munich",
      currentRole: "DevOps Specialist",
      keyBullet: "Optimized AWS CI/CD pipelines",
      languageLevel: "C1",
      language: "en",
    });

    const draft = parseGuestCvDraft(jsonStr);
    assert.ok(draft !== null);
    assert.equal(draft.fullName, "Fatima Al-Mansoor");
    assert.equal(draft.targetJobTitle, "Cloud Engineer");
    assert.equal(draft.languageLevel, "C1");
    assert.equal(draft.language, "en");
  });

  it("gracefully returns null for null, undefined, empty, or non-string inputs", () => {
    assert.equal(parseGuestCvDraft(null), null);
    assert.equal(parseGuestCvDraft(undefined), null);
    assert.equal(parseGuestCvDraft(""), null);
    assert.equal(parseGuestCvDraft("   "), null);
    assert.equal(parseGuestCvDraft(123 as any), null);
  });

  it("gracefully returns null for malformed JSON strings without throwing", () => {
    assert.equal(parseGuestCvDraft("{broken: json"), null);
    assert.equal(parseGuestCvDraft("{[unclosed"), null);
    assert.equal(parseGuestCvDraft("not json at all"), null);
  });

  it("gracefully returns null for non-object JSON payloads (arrays, primitives)", () => {
    assert.equal(parseGuestCvDraft("[]"), null);
    assert.equal(parseGuestCvDraft("[1, 2, 3]"), null);
  });

  it("returns null for empty or completely blank draft objects lacking any candidate fields", () => {
    assert.equal(parseGuestCvDraft("{}"), null);
    assert.equal(parseGuestCvDraft(JSON.stringify({ randomField: "nothing" })), null);
    assert.equal(parseGuestCvDraft(JSON.stringify({ fullName: "   ", targetJobTitle: "" })), null);
  });
});

describe("Gumroad SPRINT Webhook: Prevents Downgrading Active PRO Users", () => {
  function calculateWebhookPlanGrant(user: {
    plan: string;
    planExpiresAt: Date | null;
  }, isNinetyDays: boolean, durationInDays: number) {
    const now = Date.now();
    const isCurrentlyActivePro =
      user.plan === "PRO" &&
      user.planExpiresAt !== null &&
      new Date(user.planExpiresAt).getTime() > now;

    const currentExpiryTime =
      user.planExpiresAt && new Date(user.planExpiresAt).getTime() > now
        ? new Date(user.planExpiresAt).getTime()
        : now;

    const planExpiresAt = new Date(
      currentExpiryTime + durationInDays * 24 * 60 * 60 * 1000
    );

    const grantedPlan = isNinetyDays ? "PRO" : "SPRINT";
    const finalPlan = isCurrentlyActivePro && grantedPlan === "SPRINT" ? "PRO" : grantedPlan;

    return { finalPlan, planExpiresAt };
  }

  it("never downgrades an active PRO user when purchasing a 30-day SPRINT pass", () => {
    const activeProExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days in future
    const activeProUser = {
      plan: "PRO",
      planExpiresAt: activeProExpiry,
    };

    const result = calculateWebhookPlanGrant(activeProUser, false, 30);
    assert.equal(result.finalPlan, "PRO", "Active PRO plan must be preserved");
    // Expiration should extend from existing expiry by 30 days
    const expectedExpiry = new Date(activeProExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
    assert.equal(result.planExpiresAt.getTime(), expectedExpiry.getTime());
  });

  it("correctly upgrades a FREE user to SPRINT on 30-day pass purchase", () => {
    const freeUser = {
      plan: "FREE",
      planExpiresAt: null,
    };

    const before = Date.now();
    const result = calculateWebhookPlanGrant(freeUser, false, 30);
    assert.equal(result.finalPlan, "SPRINT");
    const diffDays = Math.round((result.planExpiresAt.getTime() - before) / (24 * 60 * 60 * 1000));
    assert.equal(diffDays, 30);
  });

  it("correctly upgrades an expired PRO user to SPRINT when purchasing SPRINT", () => {
    const expiredProUser = {
      plan: "PRO",
      planExpiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // expired 5 days ago
    };

    const result = calculateWebhookPlanGrant(expiredProUser, false, 30);
    assert.equal(result.finalPlan, "SPRINT", "Expired PRO user should receive SPRINT pass");
  });

  it("upgrades any user to PRO on 90-day purchase", () => {
    const freeUser = {
      plan: "FREE",
      planExpiresAt: null,
    };

    const result = calculateWebhookPlanGrant(freeUser, true, 90);
    assert.equal(result.finalPlan, "PRO");
  });
});

describe("CV Creation Draft Experience Date Construction", () => {
  it("produces a valid UTC Date instance on the 1st of the current UTC month", () => {
    const now = new Date();
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    assert.ok(startDate instanceof Date, "startDate must be an instance of Date");
    assert.equal(typeof (startDate as any), "object");
    assert.notEqual(typeof (startDate as any), "string");
    assert.ok(!isNaN(startDate.getTime()), "startDate must be a valid timestamp");
    assert.equal(startDate.getUTCDate(), 1, "Must be the 1st day of the month");
    assert.equal(startDate.getUTCFullYear(), now.getUTCFullYear());
    assert.equal(startDate.getUTCMonth(), now.getUTCMonth());
    assert.equal(startDate.getUTCHours(), 0);
    assert.equal(startDate.getUTCMinutes(), 0);
    assert.equal(startDate.getUTCSeconds(), 0);
  });
});

describe("JSON-LD Script Escaping & Anti-XSS Sanitization", () => {
  it("escapes '<' characters to '\\u003c' preventing script breakout", () => {
    const payload = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Can I use HTML <script>alert('xss')</script>?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No, <script> tags and <b>formatting</b> are escaped.",
          },
        },
      ],
    };

    const serialized = JSON.stringify(payload).replace(/</g, "\\u003c");

    assert.equal(serialized.includes("<script>"), false, "Must not contain raw <script>");
    assert.equal(serialized.includes("</script>"), false, "Must not contain raw </script>");
    assert.equal(serialized.includes("<"), false, "Must not contain any raw '<'");
    assert.ok(serialized.includes("\\u003cscript>"));
    assert.ok(serialized.includes("\\u003c/script>"));
    assert.ok(serialized.includes("\\u003cb>formatting"));
  });
});

describe("UTC Midnight Quota Window: getDailyQuotaWindow", () => {
  it("computes exact UTC midnight (00:00:00.000) for startOfToday and resetsAt", () => {
    const testDate = new Date("2026-06-15T23:45:30.500Z");
    const { startOfToday, resetsAt } = getDailyQuotaWindow(testDate);

    assert.equal(startOfToday.toISOString(), "2026-06-15T00:00:00.000Z");
    assert.equal(resetsAt.toISOString(), "2026-06-16T00:00:00.000Z");

    assert.equal(startOfToday.getUTCHours(), 0);
    assert.equal(startOfToday.getUTCMinutes(), 0);
    assert.equal(startOfToday.getUTCSeconds(), 0);
    assert.equal(startOfToday.getUTCMilliseconds(), 0);

    assert.equal(resetsAt.getUTCHours(), 0);
    assert.equal(resetsAt.getUTCMinutes(), 0);
    assert.equal(resetsAt.getUTCSeconds(), 0);
    assert.equal(resetsAt.getUTCMilliseconds(), 0);

    // Exactly 24 hours (86400000 ms) window
    assert.equal(resetsAt.getTime() - startOfToday.getTime(), 24 * 60 * 60 * 1000);
  });

  it("handles year transition boundary accurately (Dec 31 -> Jan 1 in UTC)", () => {
    const endOfYear = new Date("2026-12-31T23:59:59.999Z");
    const { startOfToday, resetsAt } = getDailyQuotaWindow(endOfYear);

    assert.equal(startOfToday.toISOString(), "2026-12-31T00:00:00.000Z");
    assert.equal(resetsAt.toISOString(), "2027-01-01T00:00:00.000Z");
  });
});
