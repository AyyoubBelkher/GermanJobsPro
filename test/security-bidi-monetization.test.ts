import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { isExpiringSocialCdnUrl } from "../src/lib/imageUtils";
import { formatBidiInlineText } from "../src/lib/courseUtils";
import { GUMROAD_VARIANTS } from "../src/lib/gumroad";

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
