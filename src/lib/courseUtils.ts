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

/**
 * Checks if a category corresponds to the German A1 Course track.
 */
export function isGermanA1Category(category?: string | null): boolean {
  if (!category) return false;
  const lower = category.toLowerCase().trim();
  return lower === 'german a1' || lower === 'deutsch a1' || lower.includes('a1');
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

  // Strips markdown formatting symbols ([#*`>_~\[\]]), links, and collapses extra whitespace
  text = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*`>_~\[\]]/g, "")
    .replace(/\s+/g, " ")
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

