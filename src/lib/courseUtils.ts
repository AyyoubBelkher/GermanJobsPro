import React from "react";

/**
 * Course and Lesson utilities for German A1 and educational modules.
 */

// Arabic-Indic to ASCII numeral map (for robustness with eastern Arabic numerals: ٠-٩)
const ARABIC_INDIC_DIGITS: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
};

/**
 * Converts eastern Arabic-Indic digits (٠-٩) to standard western Arabic digits (0-9).
 */
export function normalizeDigits(str: string): string {
  if (!str) return '';
  return str.replace(/[٠-٩]/g, (d) => ARABIC_INDIC_DIGITS[d] || d);
}

export type PostClassificationTarget =
  | {
      category?: string | null;
      slug?: string | null;
      title?: string | null;
    }
  | string
  | null
  | undefined;

/**
 * Checks if a post, category, slug, or title corresponds to the German A1 Course track.
 * Rock-solid deterministic classification for German A1 lessons.
 */
export function isCourseLesson(post?: PostClassificationTarget): boolean {
  if (!post) return false;

  if (typeof post === "string") {
    const s = post.trim();
    if (!s) return false;
    const lower = s.toLowerCase();
    if (lower === "german a1" || lower === "deutsch a1" || lower.includes("a1")) return true;
    if (lower.startsWith("german-a1-lesson-") || /lesson-\d+/i.test(lower)) return true;
    const norm = normalizeDigits(s);
    if (/^(?:الدرس|Lesson|Lektion)\s*\d+/iu.test(norm)) return true;
    return false;
  }

  const { category, slug, title } = post;

  // 1. Check category
  if (category) {
    const lowerCat = category.toLowerCase().trim();
    if (
      lowerCat === "german a1" ||
      lowerCat === "deutsch a1" ||
      lowerCat.includes("a1") ||
      lowerCat.includes("كورس") ||
      lowerCat.includes("course")
    ) {
      return true;
    }
  }

  // 2. Check slug
  if (slug) {
    const lowerSlug = slug.toLowerCase().trim();
    if (
      lowerSlug.startsWith("german-a1-lesson-") ||
      /lesson-\d+/i.test(lowerSlug) ||
      lowerSlug.includes("german-a1")
    ) {
      return true;
    }
  }

  // 3. Check title
  if (title) {
    const normTitle = normalizeDigits(title.trim());
    if (
      /^(?:الدرس|Lesson|Lektion)\s*\d+/iu.test(normTitle) ||
      /(?:الدرس|Lesson|Lektion)\s*\d+\s*[:\-–—]/iu.test(normTitle)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a target is an editorial article (NOT a course lesson).
 */
export function isArticle(post?: PostClassificationTarget): boolean {
  return !isCourseLesson(post);
}

/**
 * Backwards-compatible alias for isCourseLesson.
 */
export function isGermanA1Category(category?: string | null): boolean {
  return isCourseLesson(category);
}

/**
 * Prisma WHERE condition to query ONLY German A1 Course Lessons.
 */
export function getCourseLessonsPrismaFilter() {
  return {
    OR: [
      { category: { equals: "German A1", mode: "insensitive" as const } },
      { category: { equals: "Deutsch A1", mode: "insensitive" as const } },
      { category: { contains: "A1", mode: "insensitive" as const } },
      { slug: { startsWith: "german-a1-lesson-", mode: "insensitive" as const } },
      { title: { startsWith: "الدرس", mode: "insensitive" as const } },
      { title: { startsWith: "Lesson", mode: "insensitive" as const } },
      { title: { startsWith: "Lektion", mode: "insensitive" as const } },
    ],
  };
}

/**
 * Prisma WHERE condition to query ONLY Editorial Blog Articles (strictly excluding all course lessons).
 */
export function getArticlesOnlyPrismaFilter() {
  return {
    NOT: [
      { category: { equals: "German A1", mode: "insensitive" as const } },
      { category: { equals: "Deutsch A1", mode: "insensitive" as const } },
      { category: { contains: "A1", mode: "insensitive" as const } },
      { slug: { startsWith: "german-a1-lesson-", mode: "insensitive" as const } },
      { title: { startsWith: "الدرس", mode: "insensitive" as const } },
      { title: { startsWith: "Lesson", mode: "insensitive" as const } },
      { title: { startsWith: "Lektion", mode: "insensitive" as const } },
    ],
  };
}

/**
 * Extracts a numeric lesson sequence number (e.g., 1, 2, 14) from title, slug, or content.
 */
export function extractLessonNumber(title: string, slug?: string, markdown?: string): number {
  const normTitle = normalizeDigits(title || '');

  // 1. Match "الدرس X", "Lesson X", "Lektion X"
  const titleMatch = normTitle.match(/(?:الدرس|Lesson|Lektion)\s*(\d+)/i);
  if (titleMatch) {
    return parseInt(titleMatch[1], 10);
  }

  // 2. Match slug: e.g. "german-a1-lesson-X-..."
  if (slug) {
    const slugMatch = slug.match(/lesson-(\d+)/i);
    if (slugMatch) {
      return parseInt(slugMatch[1], 10);
    }
  }

  // 3. Fallback: match first 300 chars of markdown content
  if (markdown) {
    const normMd = normalizeDigits(markdown.slice(0, 300));
    const mdMatch = normMd.match(/(?:الدرس|Lesson|Lektion)\s*(\d+)/i);
    if (mdMatch) {
      return parseInt(mdMatch[1], 10);
    }
  }

  return 9999;
}

export interface ParsedLessonTitle {
  lessonNumber: number | null;
  germanTitle: string;
  arabicSubtitle: string;
  fullTitle: string;
}

/**
 * Parses raw title (and optional markdown fallback for truncated titles) into:
 * - lessonNumber: number
 * - germanTitle: Clean German topic (e.g. "Begrüßung und Vorstellung")
 * - arabicSubtitle: Clean Arabic translation (e.g. "التحية والتعريف بالنفس")
 * - fullTitle: Complete recovered title
 */
export function parseLessonTitle(rawTitle: string, markdownContent?: string): ParsedLessonTitle {
  let title = (rawTitle || '').trim();

  // Determine if raw title is truncated (e.g. "الدرس 19:", "الدرس 23:", ends with colon, length <= 10, or lacks topic)
  const prefixOnlyMatch = title.match(/^(?:(?:الدرس|Lesson|Lektion)\s*\d+\s*[:\-–—]?\s*)+$/iu);
  const isTruncated = !title || title.endsWith(':') || title.length <= 10 || !!prefixOnlyMatch;

  if (isTruncated && markdownContent) {
    let recovered = false;

    // 1. Scan first 15 lines of markdown content for # الدرس or الدرس headings with substantial text
    const firstLines = markdownContent.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of firstLines.slice(0, 15)) {
      const cleanLine = line.replace(/^#+\s*/, '').trim();
      const strippedTopic = cleanLine.replace(/^(?:(?:الدرس|Lesson|Lektion)\s*\d+\s*[:\-–—]?\s*)+/iu, '').trim();
      if (cleanLine.startsWith('الدرس') && strippedTopic.length > 3) {
        title = cleanLine.replace(/(?:^|\s*)العنوان\s*:\s*/gu, ' ').trim();
        recovered = true;
        break;
      }
    }

    // 2. Scan markdownContent for explicit "العنوان: ..." line
    if (!recovered) {
      const titleMetaMatch = markdownContent.match(/العنوان\s*:\s*([^\r\n]+)/u);
      if (titleMetaMatch && titleMetaMatch[1].trim()) {
        const topic = titleMetaMatch[1].trim();
        const num = extractLessonNumber(title, undefined, markdownContent);
        title = num !== 9999 ? `الدرس ${num}: ${topic}` : topic;
        recovered = true;
      }
    }

    // 3. Fallback: extract topic from the first intro sentence (e.g. "سنتعلم كيف نتحدث عن ...") if no # الدرس heading exists
    if (!recovered) {
      const introSlice = markdownContent.slice(0, 1500);
      const introTopicMatch = introSlice.match(/(?:سنتعلم\s+(?:في\s+هذا\s+الدرس\s+)?كيف\s+نتحدث\s+عن|سنتعلم\s+عن|سنتحدث\s+عن|سنتعلم)\s+([^.!\r\n]+)/u);
      if (introTopicMatch && introTopicMatch[1].trim()) {
        let extractedTopic = introTopicMatch[1].trim();
        extractedTopic = extractedTopic.replace(/\s*(?:الأهم\s+من\s+ذلك|استعدوا|وسنتدرب).*$/u, '').trim();
        const num = extractLessonNumber(title, undefined, markdownContent);

        if (extractedTopic.includes('العائلة') || extractedTopic.includes('الأقارب')) {
          const german = 'Die Familie und Verwandte';
          const arabic = 'العائلة والأقارب في اللغة الألمانية';
          title = num !== 9999 ? `الدرس ${num}: ${german} (${arabic})` : `${german} (${arabic})`;
        } else {
          title = num !== 9999 ? `الدرس ${num}: ${extractedTopic}` : extractedTopic;
        }
        recovered = true;
      }
    }
  }

  // Normalize duplicated "الدرس X: الدرس X:" -> "الدرس X:"
  title = title
    .replace(
      /^((?:الدرس|Lesson|Lektion)\s*\d+)\s*[:\-–—]?\s*(?:(?:الدرس|Lesson|Lektion)\s*\d+\s*[:\-–—]?\s*)+/iu,
      '$1: '
    )
    .replace(/(?:^|\s*)العنوان\s*:\s*/gu, ' ')
    .trim();

  const num = extractLessonNumber(title, undefined, markdownContent);
  const lessonNumber = num !== 9999 ? num : null;

  // Remove "الدرس X:" prefix
  let remaining = title.replace(/^(?:(?:الدرس|Lesson|Lektion)\s*\d+\s*[:\-–—]?\s*)+/i, '').trim();
  remaining = remaining.replace(/(?:^|\s*)العنوان\s*:\s*/gu, ' ').trim();

  let germanTitle = '';
  let arabicSubtitle = '';

  // Check for parenthesis pattern: "Part 1 (Part 2)"
  const parenMatch = remaining.match(/^(.*?)\s*[\(\（](.*?)[\)\）]\s*$/);
  if (parenMatch) {
    const p1 = parenMatch[1].replace(/(?:^|\s*)العنوان\s*:\s*/gu, ' ').trim();
    const p2 = parenMatch[2].replace(/(?:^|\s*)العنوان\s*:\s*/gu, ' ').trim();
    const p1HasAr = /[\u0600-\u06FF]/.test(p1);
    const p2HasAr = /[\u0600-\u06FF]/.test(p2);

    if (!p1HasAr && p2HasAr) {
      germanTitle = p1;
      arabicSubtitle = p2;
    } else if (p1HasAr && !p2HasAr) {
      arabicSubtitle = p1;
      germanTitle = p2;
    } else {
      germanTitle = p1;
      arabicSubtitle = p2;
    }
  } else {
    // Check dash or colon separator: "Part 1 - Part 2"
    const dashParts = remaining.split(/\s*[-–—:]\s*/);
    if (dashParts.length === 2) {
      const p1 = dashParts[0].replace(/(?:^|\s*)العنوان\s*:\s*/gu, ' ').trim();
      const p2 = dashParts[1].replace(/(?:^|\s*)العنوان\s*:\s*/gu, ' ').trim();
      const p1HasAr = /[\u0600-\u06FF]/.test(p1);
      const p2HasAr = /[\u0600-\u06FF]/.test(p2);

      if (!p1HasAr && p2HasAr) {
        germanTitle = p1;
        arabicSubtitle = p2;
      } else if (p1HasAr && !p2HasAr) {
        arabicSubtitle = p1;
        germanTitle = p2;
      } else {
        germanTitle = remaining;
      }
    } else {
      if (/[\u0600-\u06FF]/.test(remaining)) {
        arabicSubtitle = remaining;
      } else {
        germanTitle = remaining;
      }
    }
  }

  // Build clean unified fullTitle
  let fullTitle = title;
  if (germanTitle && arabicSubtitle) {
    fullTitle = lessonNumber !== null
      ? `الدرس ${lessonNumber}: ${germanTitle} (${arabicSubtitle})`
      : `${germanTitle} (${arabicSubtitle})`;
  } else if (germanTitle) {
    fullTitle = lessonNumber !== null
      ? `الدرس ${lessonNumber}: ${germanTitle}`
      : germanTitle;
  } else if (arabicSubtitle) {
    fullTitle = lessonNumber !== null
      ? `الدرس ${lessonNumber}: ${arabicSubtitle}`
      : arabicSubtitle;
  }

  return {
    lessonNumber,
    germanTitle,
    arabicSubtitle,
    fullTitle,
  };
}

/**
 * Generates an estimated read-time string based on markdown content length, localized.
 */
export function calculateReadTime(content?: string | null, locale = 'ar'): string {
  if (!content) {
    if (locale === 'ar') return '⏱️ ٥ دقائق';
    if (locale === 'de') return '⏱️ 5 Min. Lesezeit';
    if (locale === 'fr') return '⏱️ 5 min de lecture';
    return '⏱️ 5 min read';
  }

  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(3, Math.min(15, Math.ceil(words / 180)));

  if (locale === 'ar') return `⏱️ ${minutes} دقائق`;
  if (locale === 'de') return `⏱️ ${minutes} Min. Lesezeit`;
  if (locale === 'fr') return `⏱️ ${minutes} min de lecture`;
  return `⏱️ ${minutes} min read`;
}

/**
 * Extracts a clean, sanitized plain-text excerpt from article or lesson markdown content.
 * Strips leading H1/H2 headings, AI automation metadata lines, duplicated title prefixes,
 * and markdown formatting symbols, collapsing whitespace and truncating to maxLength.
 */
export function extractCleanExcerpt(
  markdown?: string | null,
  title?: string,
  maxLength = 150
): string {
  if (!markdown) return "";

  let text = markdown;

  // Run up to 4 passes to strip any combination of leading headings, metadata, and lesson prefixes
  for (let i = 0; i < 4; i++) {
    // a) Strips leading H1/H2 headings
    text = text.replace(/^[\s\uFEFF]*#+\s+[^\r\n]*(\r?\n)*/u, "");

    // b) Strip any inline repeated "الدرس X: ..." prefix before "المقدمة" or "أهلاً" or "مرحباً"
    text = text.replace(
      /^[\s\uFEFF]*(?:الدرس|Lesson|Lektion)\s*\d+[^]*?(?=(?:المقدمة|مقدمة|أهلاً|أهلا|مرحباً|مرحبا))/iu,
      ""
    );

    // c) Strip any leading lesson/title lines matching:
    text = text.replace(
      /^[\s\uFEFF]*(?:الدرس|Lesson|Lektion)\s*\d+\s*[:\-–—]?[^\r\n]*(\r?\n)+/gmiu,
      ""
    );

    // d) Strips raw lesson metadata patterns leaked by AI automation
    text = text
      .replace(/^[\s\uFEFF]*(?:تاريخ\s*(?:الدرس|النشر)|التاريخ)\s*:\s*[^\r\n]*(\r?\n)*/gmiu, "")
      .replace(
        /^[\s\uFEFF]*(?:المستوى\s*:\s*(?:CEFR\s*)?[A-C][12](?:\.\d)?(?:\s*-\s*[A-C][12](?:\.\d)?)?|[^\r\n]*CEFR\s*[A-C][12](?:\.\d)?)[^\r\n]*(\r?\n)*/gmiu,
        ""
      )
      .replace(/^[\s\uFEFF]*العنوان\s*:\s*[^\r\n]+(\r?\n)*/gmiu, "")
      .replace(/(?:تاريخ\s*(?:الدرس|النشر)|التاريخ)\s*:\s*\d{4}[\d\/\-]*/gu, " ")
      .replace(/\b202\d{5}\b/g, " ")
      .replace(/المستوى\s*:\s*(?:CEFR\s*)?[A-C][12](?:\.\d)?/giu, " ")
      .replace(/العنوان\s*:\s*[^\r\n]+/gu, " ");

    // e) Strip standalone "المقدمة" or "مقدمة" even when NOT followed by a colon (:)
    text = text.replace(/^[\s\uFEFF]*(?:#+\s*)?(?:المقدمة|مقدمة)\s*:?\s*(\r?\n)*/gmiu, "");

    // f) If remaining text starts with duplicated "الدرس X: الدرس X:", strip it
    text = text.replace(
      /^[\s\uFEFF]*(?:الدرس|Lesson|Lektion)\s*\d+\s*[:\-–—]?\s*(?:(?:الدرس|Lesson|Lektion)\s*\d+\s*[:\-–—]?\s*)+/iu,
      ""
    );

    // g) Strip repeated title if remaining text starts with title
    if (title) {
      const cleanTitle = title.trim();
      const escapedTitle = cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      text = text.replace(new RegExp(`^[\\s\\uFEFF]*#*\\s*${escapedTitle}\\s*[:\\-–—]?\\s*`, "iu"), "");
    }

    // Strip leading المقدمة / مقدمة again if it was placed after the title or metadata
    text = text.replace(/^[\s\uFEFF]*(?:#+\s*)?(?:المقدمة|مقدمة)\s*:?\s*(\r?\n)*/gmiu, "");
  }

  // 1. Strip markdown links [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 2. Neatly parenthesize bracketed phonetic transcriptions so they don't mash into adjacent words
  text = text.replace(/\[([\u0600-\u06FF\s:!؟،.\-_…]+)\]/gu, " ($1) ");

  // 3. Replace newlines between short vocabulary lines with " • " before collapsing whitespace
  const rawLines = text.split(/\r?\n/);
  const formattedChunks: string[] = [];
  let prevWasShort = false;

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const cleanLine = trimmed.replace(/^[-*•]\s+/, "");
    const hasLatin = /[a-zA-ZäöüÄÖÜß]/.test(cleanLine);
    const hasArabic = /[\u0600-\u06FF]/.test(cleanLine);
    const isVocabOrList =
      (hasLatin && hasArabic) ||
      /^(\d+\.|\*|-|•)\s*/.test(trimmed) ||
      /[:\-–—]/.test(cleanLine);
    const isShortVocab = cleanLine.length <= 100 && isVocabOrList;

    if (formattedChunks.length > 0) {
      if (prevWasShort && isShortVocab) {
        formattedChunks.push(" • ");
      } else {
        formattedChunks.push(" ");
      }
    }

    formattedChunks.push(cleanLine);
    prevWasShort = isShortVocab;
  }

  text = formattedChunks.join("");

  // 4. Strips markdown formatting symbols ([#*`>_~\[\]]) and collapses extra whitespace
  text = text
    .replace(/[#*`>_~\[\]]/g, "")
    .replace(/(?:\s*•\s*)+/g, " • ")
    .replace(/\s+/g, " ")
    .replace(/^[\s•\-–—]+\s*/, "")
    .trim();

  // Final sanity cleans on collapsed string
  text = text.replace(/^(?:المقدمة|مقدمة)\s*:?\s*/u, "").trim();
  text = text.replace(
    /^(?:الدرس|Lesson|Lektion)\s*\d+[^]*?(?=(?:أهلاً|أهلا|مرحباً|مرحبا))/iu,
    ""
  ).trim();

  if (!text) return "";

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength).trim() + "...";
}

/**
 * Checks if a string represents a custom uploaded or external image URL
 * (such as a Base64 data:image URL or an https:// / http:// URL).
 */
export function isCustomLessonImage(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  );
}

/**
 * Checks if a static lesson cover image exists on disk or in the client bundle.
 * - On server: verifies filesystem existence (public/images/lessons/german-a1-lesson-${lessonNum}.png).
 * - On client: lessons 1..17 and 19 exist (lesson 18 explicitly does NOT exist).
 */
export function hasStaticLessonImage(lessonNum: number): boolean {
  if (!lessonNum || lessonNum < 1 || lessonNum === 18) return false;

  if (typeof window === "undefined") {
    try {
      // Dynamic eval require to prevent client bundlers from bundling 'fs' / 'path'
      const fs = eval("require")("fs");
      const path = eval("require")("path");
      const filePath = path.resolve(
        process.cwd(),
        `public/images/lessons/german-a1-lesson-${lessonNum}.png`
      );
      return Boolean(fs.existsSync(filePath));
    } catch {
      // Server fallback if dynamic require fails
    }
  }

  // Client fallback: lessons 1..17 and 19 exist, lesson 18 does NOT
  return (lessonNum >= 1 && lessonNum <= 17) || lessonNum === 19;
}

/**
 * Resolves the cover image URL for a post / lesson with strict precedence:
 * 1. If post has a custom image (data:image/... Base64 or https:// / http://),
 *    the database image ALWAYS takes priority and is NEVER overridden.
 * 2. If the current image is a stale reference to a non-existent static file
 *    (such as "/images/lessons/german-a1-lesson-18.png"), it is stripped and falls back cleanly to null.
 * 3. Fallback to static asset `/images/lessons/german-a1-lesson-${num}.png` ONLY IF that file
 *    actually exists on disk (or lessons 1..17 and 19 on client) AND the post does not already have a custom image.
 * 4. If Lesson 18 has no custom image, returns null so the branded German A1 CSS cover renders.
 */
export function resolveLessonImage(
  rawImage?: string | null,
  lessonNumber?: number | null,
  slug?: string | null,
  title?: string | null
): string | null {
  const trimmed = typeof rawImage === "string" ? rawImage.trim() : null;

  // 1. If post has a custom image (data:image/ or https:// / http://), database image ALWAYS takes priority
  if (trimmed && isCustomLessonImage(trimmed)) {
    return trimmed;
  }

  // 2. If an image path is set, verify if it points to a static lesson image
  if (trimmed) {
    const staticMatch = trimmed.match(/\/images\/lessons\/german-a1-lesson-(\d+)\.png/i);
    if (staticMatch) {
      const num = parseInt(staticMatch[1], 10);
      if (hasStaticLessonImage(num)) {
        return trimmed;
      }
      // Stale or missing static lesson image (e.g., Lesson 18) -> fall back cleanly to null
      return null;
    }
    // Other custom relative path (not a stale lesson png)
    return trimmed;
  }

  // 3. Fallback logic: check if lesson has a verified static image file on disk
  const num =
    lessonNumber !== undefined && lessonNumber !== null && lessonNumber < 9999
      ? lessonNumber
      : extractLessonNumber(title || "", slug || undefined);

  if (num && num >= 1 && num < 9999 && hasStaticLessonImage(num)) {
    return `/images/lessons/german-a1-lesson-${num}.png`;
  }

  // Fall back cleanly to null (e.g. Lesson 18) so CSS cover renders
  return null;
}

/**
 * Maps raw category values ("Jobs", "Karriere", "General", "عام", "German A1")
 * to localized labels across languages (ar, de, fr, en).
 */
export function localizeCategoryLabel(
  category: string | null | undefined,
  locale: string = "ar"
): string {
  if (!category || typeof category !== "string") {
    if (locale === "ar") return "فرص العمل والتأشيرة";
    if (locale === "de") return "Jobs & Visum";
    if (locale === "fr") return "Emplois & Visa";
    return "Jobs & Visa";
  }

  const trimmed = category.trim();
  const lower = trimmed.toLowerCase();

  // 1. German A1 Course
  if (
    lower === "german a1" ||
    lower === "deutsch a1" ||
    lower.includes("a1") ||
    lower.includes("كورس")
  ) {
    if (locale === "ar") return "كورس الألمانية A1";
    if (locale === "de") return "Deutsch A1 Kurs";
    if (locale === "fr") return "Cours d'allemand A1";
    return "German A1 Course";
  }

  // 2. Jobs / Careers / Visas
  if (
    lower === "jobs" ||
    lower === "karriere" ||
    lower === "job" ||
    lower.includes("jobs") ||
    lower.includes("karriere") ||
    lower.includes("وظائف") ||
    lower.includes("فرص")
  ) {
    if (locale === "ar") return "فرص العمل والتأشيرة";
    if (locale === "de") return "Jobs & Visum";
    if (locale === "fr") return "Emplois & Visa";
    return "Jobs & Visa";
  }

  // 3. General / Life in Germany
  if (
    lower === "general" ||
    lower === "عام" ||
    lower.includes("leben") ||
    lower.includes("ratgeber") ||
    lower.includes("معيشة")
  ) {
    if (locale === "ar") return "دليل المعيشة والاستقرار";
    if (locale === "de") return "Ratgeber & Leben";
    if (locale === "fr") return "Guides & Vie";
    return "Guides & Life";
  }

  // Return original trimmed category if it is already localized or custom
  return trimmed;
}

/**
 * BiDi-safe inline formatter that processes string nodes in Arabic mode:
 * 1. Normalizes nested / unbalanced parentheses such as (ZAB (Zentralstelle...) -> (ZAB - Zentralstelle...)
 * 2. Wraps parenthetical segments containing Latin/German characters inside <bdi dir="ltr">...</bdi>
 *    followed by an explicit Right-to-Left Mark (\u200F) when followed by punctuation (:, ؟, ،, ., ;)
 * 3. Wraps standalone technical/status tokens like H+, H-, H+/- inside <bdi dir="ltr">...</bdi>\u200F
 */
export function formatBidiInlineText(
  text: string | null | undefined,
  isAr: boolean = true
): React.ReactNode {
  if (!text || typeof text !== "string") return text ?? "";
  if (!isAr) return text;

  // 1. Fix nested / unbalanced parentheses:
  // e.g. "(ZAB (Zentralstelle für ausländisches Bildungswesen" -> "(ZAB - Zentralstelle für ausländisches Bildungswesen)"
  const normalized = text.replace(
    /\(([A-Za-z0-9\s]+?)\s*\(([A-Za-zäöüÄÖÜß0-9\s\-/]+?)(?:\)+|(\s*)(?=[\u0600-\u06FF]|$))/g,
    (_m, p1, p2, space) => `(${p1.trim()} - ${p2.trim()})${space || ""}`
  );

  // 2. Tokenize parenthetical Latin/German segments and standalone status tokens
  // Group 1 & 2: Parenthetical segment and trailing punctuation
  // Group 3 & 4: Standalone H+, H-, H+/- and trailing punctuation
  const tokenRegex =
    /(\([A-Za-zäöüÄÖÜß0-9][^()]*\))([:؟،.;])?|(?<=^|[\s،,.:;!؟])(H\+\/-|H\+|H\-)([:؟،.;])?(?=[\s،,.:;!؟]|$)/g;

  if (!tokenRegex.test(normalized)) {
    return normalized;
  }
  tokenRegex.lastIndex = 0;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(normalized)) !== null) {
    const matchStart = match.index;
    const matchEnd = tokenRegex.lastIndex;

    if (matchStart > lastIndex) {
      parts.push(normalized.substring(lastIndex, matchStart));
    }

    const parenSegment = match[1];
    const parenPunct = match[2];
    const statusToken = match[3];
    const statusPunct = match[4];

    if (parenSegment) {
      const isShort = parenSegment.length <= 38;
      const bdiEl = React.createElement(
        "bdi",
        {
          key: `bdi-p-${matchStart}`,
          dir: "ltr",
          className: isShort ? "inline-block whitespace-nowrap" : "inline",
        },
        parenSegment
      );

      if (parenPunct) {
        parts.push(
          React.createElement(
            React.Fragment,
            { key: `frag-p-${matchStart}` },
            bdiEl,
            "\u200F" + parenPunct
          )
        );
      } else {
        parts.push(bdiEl);
      }
    } else if (statusToken) {
      const bdiEl = React.createElement(
        "bdi",
        {
          key: `bdi-s-${matchStart}`,
          dir: "ltr",
          className: "inline-block whitespace-nowrap font-mono font-bold",
        },
        statusToken
      );

      parts.push(
        React.createElement(
          React.Fragment,
          { key: `frag-s-${matchStart}` },
          bdiEl,
          statusPunct ? "\u200F" + statusPunct : "\u200F"
        )
      );
    }

    lastIndex = matchEnd;
  }

  if (lastIndex < normalized.length) {
    parts.push(normalized.substring(lastIndex));
  }

  return parts;
}

/**
 * Normalizes markdown formatting for both articles and lessons:
 * 1. Fixes nested / unbalanced parentheses like (ZAB (Zentralstelle... -> (ZAB - Zentralstelle...
 * 2. Merges broken numbered subheadings on two lines (e.g. "### 1." followed by "### Title" or "Title").
 * 3. Converts short single-line triple-backtick blocks (numbers, amounts, terms <= 80 chars) to inline code.
 * 4. Merges isolated inline code with previous/next line if they split a continuous sentence.
 */
export function normalizeMarkdownFormatting(raw: string): string {
  if (!raw || typeof raw !== "string") return "";

  let text = raw;

  // 1. Fix unbalanced / nested parentheses
  text = text.replace(
    /\(([A-Za-z0-9\s]+?)\s*\(([A-Za-zäöüÄÖÜß0-9\s\-/]+?)(?:\)+|(\s*)(?=[\u0600-\u06FF]|$))/g,
    (_m, p1, p2, space) => `(${p1.trim()} - ${p2.trim()})${space || ""}`
  );

  // 2. Convert single-line short triple backtick blocks (<= 80 chars, no \n) to inline code
  // Handles ```45,300 يورو``` or ```text 45,300 يورو``` or ```41,041.80 يورو```
  text = text.replace(/```(?:[a-zA-Z]{2,10}\s+)?([^\r\n`]{1,80})```/g, (_m, code) => {
    return `\`${code.trim()}\``;
  });

  // Handles 3-line blocks containing only a single short line between ```
  // ```
  // 45,300 يورو
  // ```
  text = text.replace(/^[ \t]*```[a-zA-Z0-9_-]*\r?\n([^\r\n`]{1,80})\r?\n[ \t]*```[ \t]*$/gm, (_m, code) => {
    return `\`${code.trim()}\``;
  });

  // 3. Merge split numbered headings on two lines:
  // e.g. "### 1." followed directly or with empty lines by "### Title" or "Title"
  // ^(#{1,4})\s*(\d+[\.\-\)]?)\s*$ followed by ^(?:#{1,4}\s*)?([^\n]+)$ -> $1 $2 $3
  const lines = text.split("\n");
  const mergedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,4})\s*(\d+[\.\-\)]?)\s*$/);

    if (headingMatch) {
      const hashes = headingMatch[1];
      const numPart = headingMatch[2];

      // Look ahead for the next non-empty line
      let nextIdx = i + 1;
      while (nextIdx < lines.length && lines[nextIdx].trim() === "") {
        nextIdx++;
      }

      if (nextIdx < lines.length) {
        const nextLine = lines[nextIdx].trim();
        // Check if next line is a title or title text (not another number heading, divider, list, quote)
        if (
          nextLine &&
          !nextLine.startsWith("---") &&
          !nextLine.startsWith("***") &&
          !nextLine.startsWith("___") &&
          !nextLine.startsWith("- ") &&
          !nextLine.startsWith("* ") &&
          !nextLine.startsWith("> ") &&
          !/^(#{1,4})\s*(\d+[\.\-\)]?)\s*$/.test(nextLine)
        ) {
          const titleMatch = nextLine.match(/^(?:#{1,4}\s*)?([^\n]+)$/);
          if (titleMatch && titleMatch[1].trim()) {
            const headingTitle = titleMatch[1].trim();
            mergedLines.push(`${hashes} ${numPart} ${headingTitle}`);
            i = nextIdx; // Skip past the merged line
            continue;
          }
        }
      }
    }

    mergedLines.push(line);
  }

  // 4. Merge short inline code that was isolated on its own line / paragraph and breaks a continuous Arabic sentence
  const finalLines: string[] = [];
  for (let i = 0; i < mergedLines.length; i++) {
    const curr = mergedLines[i];
    const trimmed = curr.trim();

    // Check if current line is solely an inline code block like `45,300 يورو`
    const isIsolatedInlineCode = /^`[^`\n]{1,80}`$/.test(trimmed);

    if (isIsolatedInlineCode && finalLines.length > 0) {
      // Find previous non-empty line
      let prevIdx = finalLines.length - 1;
      while (prevIdx >= 0 && finalLines[prevIdx].trim() === "") {
        prevIdx--;
      }

      // Find next non-empty line
      let nextIdx = i + 1;
      while (nextIdx < mergedLines.length && mergedLines[nextIdx].trim() === "") {
        nextIdx++;
      }

      const prevLine = prevIdx >= 0 ? finalLines[prevIdx].trim() : "";
      const nextLine = nextIdx < mergedLines.length ? mergedLines[nextIdx].trim() : "";

      const isHeadingOrSpecial = (l: string) =>
        /^#{1,6}\s/.test(l) ||
        /^[-*]\s/.test(l) ||
        /^\d+[\.\)]\s/.test(l) ||
        l.startsWith(">") ||
        l.startsWith("|") ||
        l.startsWith("---");

      // If previous line is regular text and not heading/list/special
      if (prevLine && !isHeadingOrSpecial(prevLine)) {
        // If next line is also regular continuation text
        if (nextLine && !isHeadingOrSpecial(nextLine)) {
          finalLines[prevIdx] = `${prevLine} ${trimmed} ${nextLine}`;
          finalLines.length = prevIdx + 1;
          i = nextIdx; // advance past nextLine
          continue;
        } else {
          finalLines[prevIdx] = `${prevLine} ${trimmed}`;
          finalLines.length = prevIdx + 1;
          continue;
        }
      }
    }

    finalLines.push(curr);
  }

  return finalLines.join("\n");
}

export interface ParsedTable {
  headers: string[];
  rows: string[][];
}

/**
 * Parses ASCII / Grid tables and standard Markdown pipe tables inside <pre> or <p> blocks.
 * Detects ASCII border lines like +---+---+ or | ... | ... | and extracts clean headers & rows.
 */
export function parseAsciiOrMarkdownTable(rawText: string): ParsedTable | null {
  if (!rawText || typeof rawText !== "string") return null;
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const hasAsciiBorders = lines.some((l) => /^\+[-=+]+\+$/.test(l));
  const hasPipeLines = lines.filter((l) => l.startsWith("|") && l.endsWith("|")).length >= 2;

  if (!hasAsciiBorders && !hasPipeLines) return null;

  // Filter out pure separator lines like +-------+-------+ or |-------|-------|
  const contentLines = lines.filter(
    (l) => !/^\+[-=+]+\+$/.test(l) && !/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(l)
  );

  if (contentLines.length === 0) return null;

  const rawRows: string[][] = [];

  for (const line of contentLines) {
    if (!line.includes("|")) continue;
    // Strip outer borders
    let stripped = line;
    if (stripped.startsWith("|")) stripped = stripped.substring(1);
    if (stripped.endsWith("|")) stripped = stripped.substring(0, stripped.length - 1);

    let cells: string[];
    if (stripped.includes("|")) {
      cells = stripped.split("|").map((c) => c.trim());
    } else {
      // Line has no internal pipe. Check if it contains 2 columns separated by 2+ spaces or \t
      const parts = stripped.split(/\s{2,}|\t+/).map((c) => c.trim()).filter(Boolean);
      if (parts.length >= 2) {
        cells = parts;
      } else {
        cells = [stripped.trim()];
      }
    }
    rawRows.push(cells);
  }

  if (rawRows.length < 2) return null;

  const headers = rawRows[0];
  const rows = rawRows.slice(1);
  return { headers, rows };
}

export type ParsedBranchingDiagram = {
  type: "branching";
  root: { title: string; subtitle?: string };
  branches: Array<{
    title: string;
    germanTerm?: string;
    points: string[];
  }>;
  outcome?: { title: string; subtitle?: string };
};

export type ParsedTimelineDiagram = {
  type: "timeline";
  title?: string;
  root?: string;
  steps: Array<{
    condition: string;
    duration?: string;
  }>;
};

export type ParsedGenericDiagram = {
  type: "generic";
  nodes: Array<{
    title: string;
    details?: string[];
  }>;
};

export type ParsedDiagram =
  | ParsedBranchingDiagram
  | ParsedTimelineDiagram
  | ParsedGenericDiagram;

/**
 * Parses ASCII / Box-Drawing Flowcharts & Timeline Diagrams inside <pre> blocks.
 * Detects Unicode box-drawing characters, ASCII flowchart arrows, and bracketed nodes.
 */
export function parseAsciiDiagram(rawText: string): ParsedDiagram | null {
  if (!rawText || typeof rawText !== "string") return null;

  const hasBoxChars = /[┌┐└┘─│┬┴├┤┼▼▲►◄]/.test(rawText);
  const hasArrows = /\+--->|--->|──►|===>/.test(rawText);
  const hasConnectedBrackets =
    /\[[^\]]+\]/.test(rawText) &&
    (rawText.includes("|") || rawText.includes("│") || rawText.includes("▼") || rawText.includes("->"));

  if (!hasBoxChars && !hasArrows && !hasConnectedBrackets) {
    return null;
  }

  // A. Branching Comparison / Pathway (e.g. Nursing recognition Anerkennung)
  if (
    rawText.includes("دورة التعديل") ||
    rawText.includes("Anpassungslehrgang") ||
    rawText.includes("امتحان المعرفة") ||
    rawText.includes("Kenntnisprüfung") ||
    (rawText.includes("┌") && rawText.includes("┴") && rawText.includes("┐") && rawText.includes("└") && rawText.includes("┬") && rawText.includes("┘"))
  ) {
    // Extract root
    const rootMatch = rawText.match(/\[\s*([^\]]+?)\s*\]/);
    let rootTitle = "التقديم على معادلة الشهادة";
    let rootSubtitle: string | undefined = "Defizitbescheid";

    if (rootMatch) {
      const full = rootMatch[1].trim();
      const latinMatch = full.match(/[A-Za-zÄÖÜäöüß]+/);
      if (latinMatch && latinMatch.index && latinMatch.index > 0) {
        rootTitle = full.substring(0, latinMatch.index).trim();
        rootSubtitle = full.substring(latinMatch.index).trim();
      } else {
        rootTitle = full;
        rootSubtitle = undefined;
      }
    }

    // Branch 1: Anpassungslehrgang
    // Strictly pair Arabic pathway with its German term and bullet points
    const branch1 = {
      title: "المسار الأول: دورة التعديل",
      germanTerm: "Anpassungslehrgang",
      points: ["تدريب عملي + نظري", "المدة: 6 إلى 18 شهراً"],
    };

    // Branch 2: Kenntnisprüfung
    const branch2 = {
      title: "المسار الثاني: امتحان المعرفة",
      germanTerm: "Kenntnisprüfung",
      points: ["اختبار عملي + شفوي", "التجهيز: تحضير مكثف"],
    };

    // Outcome
    let outcomeTitle = "الحصول على الترخيص النهائي";
    const outcomeSubtitle = "Berufserlaubnis / Urkunde";
    const allBrackets = [...rawText.matchAll(/\[\s*([^\]]+?)\s*\]/g)];
    if (allBrackets.length >= 2) {
      const last = allBrackets[allBrackets.length - 1][1].trim();
      if (last !== rootMatch?.[1].trim() && !last.includes("المسار")) {
        outcomeTitle = last;
      }
    }

    return {
      type: "branching",
      root: { title: rootTitle, subtitle: rootSubtitle },
      branches: [branch1, branch2],
      outcome: { title: outcomeTitle, subtitle: outcomeSubtitle },
    };
  }

  // B. Linear Step / Timeline Flowchart (e.g. Blue Card Niederlassungserlaubnis)
  if (
    hasArrows ||
    rawText.includes("Niederlassungserlaubnis") ||
    rawText.includes("الإقامة الدائمة")
  ) {
    const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
    let title: string | undefined;
    let root: string | undefined;
    const steps: Array<{ condition: string; duration?: string }> = [];

    for (const line of lines) {
      if (
        line.startsWith("مسار") ||
        line.includes("Niederlassungserlaubnis") ||
        (line.includes("(") && line.includes(")") && !line.includes("+--->") && !line.includes("--->"))
      ) {
        if (!title && !line.startsWith("[")) {
          title = line.replace(/^-+|-+$/g, "").trim();
          continue;
        }
      }

      if (line.startsWith("[") && line.endsWith("]")) {
        root = line.replace(/[\[\]]/g, "").trim();
        continue;
      }

      // Step arrow line: +---> condition -------> duration
      const arrowMatch = line.match(/\+?--->\s*(.+?)\s*---+>\s*(.+)/);
      if (arrowMatch) {
        steps.push({
          condition: arrowMatch[1].trim(),
          duration: arrowMatch[2].trim(),
        });
        continue;
      }

      // Simple step arrow: [Step A] ---> [Step B]
      if (line.includes("--->") || line.includes("──►") || line.includes("===>")) {
        const parts = line
          .split(/--->|──►|===>/)
          .map((p) => p.replace(/[\[\]]/g, "").trim())
          .filter(Boolean);
        if (parts.length >= 2 && steps.length === 0) {
          for (const p of parts) {
            steps.push({ condition: p });
          }
        }
      }
    }

    if (steps.length > 0) {
      return {
        type: "timeline",
        title: title || "مسار الحصول على الإقامة الدائمة",
        root: root || "الحصول على البطاقة الزرقاء",
        steps,
      };
    }
  }

  // C. Generic Diagram Fallback:
  // Extract all clean non-empty text lines without raw box-drawing characters
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const nodes: Array<{ title: string; details?: string[] }> = [];

  for (const line of lines) {
    const clean = line
      .replace(/[┌┐└┘─│┬┴├┤┼▼▲►◄|]/g, "")
      .replace(/\+--->|--->/g, "")
      .replace(/^[•\-\*]\s*/, "")
      .trim();

    if (clean.length >= 3 && !clean.match(/^[-=_+]+$/)) {
      nodes.push({ title: clean });
    }
  }

  if (nodes.length > 0) {
    return { type: "generic", nodes };
  }

  return null;
}



