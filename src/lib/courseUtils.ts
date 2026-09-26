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

  // If title was truncated or ends with colon without topic (e.g. "الدرس 2:"), recover from markdown content
  if ((title.endsWith(':') || title.length <= 10) && markdownContent) {
    const firstLines = markdownContent.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of firstLines) {
      const cleanLine = line.replace(/^#+\s*/, '').trim();
      if (cleanLine.startsWith('الدرس') && cleanLine.length > title.length) {
        title = cleanLine;
        break;
      }
    }
  }

  const num = extractLessonNumber(title);
  const lessonNumber = num !== 9999 ? num : null;

  // Remove "الدرس X:" prefix
  const remaining = title.replace(/^(?:الدرس|Lesson|Lektion)\s*\d+\s*[:\-–—]?\s*/i, '').trim();

  let germanTitle = '';
  let arabicSubtitle = '';

  // Check for parenthesis pattern: "Part 1 (Part 2)"
  const parenMatch = remaining.match(/^(.*?)\s*[\(\（](.*?)[\)\）]\s*$/);
  if (parenMatch) {
    const p1 = parenMatch[1].trim();
    const p2 = parenMatch[2].trim();
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
      const p1 = dashParts[0].trim();
      const p2 = dashParts[1].trim();
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

  return {
    lessonNumber,
    germanTitle,
    arabicSubtitle,
    fullTitle: title,
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
