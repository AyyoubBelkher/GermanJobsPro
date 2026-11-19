/**
 * Utility functions for German Cover Letters (DIN 5008 Anschreiben)
 */

export function extractGermanJobTitle(rawTitle: string): string {
  if (!rawTitle) return "";
  
  // إذا كان العنوان يحتوي على المسمى الأصلي بين قوسين، استخرجه
  const match = rawTitle.match(/\(([^)]+)\)/);
  if (match && /[a-zA-Z]/.test(match[1])) {
    return match[1].trim();
  }
  
  // أو قم بإزالة أي أحرف عربية والإبقاء على الحروف اللاتينية
  const latinOnly = rawTitle.replace(/[\u0600-\u06FF]/g, "").replace(/^[-–—:\s]+|[-–—:\s]+$/g, "").trim();
  return latinOnly || rawTitle;
}

export function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>?/gm, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strips raw markdown bold asterisks (**text** or ***text***) from cover letter text
 * while preserving standard DIN 5008 line breaks and plain text layout.
 */
export function stripMarkdownAsterisks(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*{2,3}(.*?)\*{2,3}/g, "$1")
    .replace(/\*\*/g, "");
}
