"use client";

import React from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface LessonContentRendererProps {
  content: string;
  category?: string;
  locale: string;
}

/**
 * Strips all square brackets [ and ] completely from a string.
 */
function stripBrackets(str: string): string {
  if (!str) return "";
  return str.replace(/[\[\]]/g, "").trim();
}

/**
 * Sanitizes leading punctuation, boundary markers, and markdown bold artifacts from speaker / dialogue / vocab lines.
 * Handles RTL/LTR artifacts like '?Herr Müller:', '• Frau Al-Mansoor:', '؟Lukas:', '**Herr Müller:**'.
 */
function sanitizeSpeakerLine(line: string): string {
  if (!line) return "";
  return line
    .replace(/^[\s?؟•\-\*🗣️💬:\uFEFF\u200E\u200F]+/, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .trim();
}

/**
 * Recursively extracts plain text from React nodes / children.
 */
function getNodeText(node: React.ReactNode): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join("");
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return getNodeText(props?.children);
  }
  return "";
}

/**
 * Checks whether a ReactNode tree contains a link (<a> or Next.js Link) or href prop.
 */
function hasLink(node: React.ReactNode): boolean {
  if (!node) return false;
  if (React.isValidElement(node)) {
    if (
      node.type === "a" ||
      (typeof node.type === "function" && (node.type.name === "a" || node.type.name === "Link"))
    ) {
      return true;
    }
    const props = node.props as { href?: string; children?: React.ReactNode };
    if (props?.href) return true;
    if (props?.children) return hasLink(props.children);
  }
  if (Array.isArray(node)) {
    return node.some(hasLink);
  }
  return false;
}

/**
 * Recursively extracts all links from a ReactNode tree.
 */
function extractLinks(node: React.ReactNode): Array<{ href: string; text: string }> {
  const links: Array<{ href: string; text: string }> = [];
  function traverse(n: React.ReactNode) {
    if (!n) return;
    if (React.isValidElement(n)) {
      const props = n.props as { href?: string; children?: React.ReactNode };
      if (props?.href) {
        links.push({
          href: props.href,
          text: getNodeText(props.children) || props.href,
        });
      }
      if (props?.children) {
        traverse(props.children);
      }
    } else if (Array.isArray(n)) {
      n.forEach(traverse);
    }
  }
  traverse(node);
  return links;
}

/**
 * Safely resolves relative or absolute href with current locale.
 */
function resolveHref(href: string, locale: string): string {
  if (!href) return "#";
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#")
  ) {
    return href;
  }
  if (/^\/(ar|en|de|fr)(\/|$)/.test(href)) {
    return href;
  }
  const cleanPath = href.startsWith("/") ? href : `/${href}`;
  return `/${locale}${cleanPath}`;
}

export interface ToolMetadata {
  isTool: boolean;
  title: string;
  description: string;
  badge: string;
  icon: string;
  gradientClass: string;
  borderClass: string;
  hoverBorderClass: string;
  buttonBgClass: string;
  badgeClass: string;
}

/**
 * Classifies tool URLs and keywords to construct Enterprise CTA Card styling.
 */
export function getToolMetadata(href: string, text: string): ToolMetadata {
  const lowerHref = (href || "").toLowerCase();
  const lowerText = (text || "").toLowerCase();
  const combined = `${lowerHref} ${lowerText}`;

  if (
    combined.includes("ats-analyzer") ||
    combined.includes("ats") ||
    combined.includes("فاحص السيرة") ||
    combined.includes("فحص السيرة")
  ) {
    return {
      isTool: true,
      title: text || "فاحص السيرة الذاتية (ATS Analyzer)",
      description: "افحص توافق سيرتك الذاتية مع نظام ATS وخوارزميات التوظيف في الشركات الألمانية",
      badge: "فحص فوري 🎯",
      icon: "🎯",
      gradientClass:
        "bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-blue-500/10 dark:from-emerald-950/40 dark:via-slate-900/80 dark:to-teal-950/30",
      borderClass: "border-emerald-300/80 dark:border-emerald-800/70",
      hoverBorderClass:
        "hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-emerald-500/10",
      buttonBgClass: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25",
      badgeClass:
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300/50 dark:border-emerald-700/50",
    };
  }

  if (
    combined.includes("cover-letter") ||
    combined.includes("cover-letters") ||
    combined.includes("anschreiben") ||
    combined.includes("خطاب التقديم") ||
    combined.includes("خطاب التغطية") ||
    combined.includes("خطابات التقديم") ||
    combined.includes("مولد خطابات")
  ) {
    return {
      isTool: true,
      title: text || "مولد خطابات التقديم (Cover Letter Builder)",
      description: "أنشئ خطاب تقديم احترافي مخصص باللغة الألمانية وفق معايير DIN 5008 المعتمدة",
      badge: "ذكاء اصطناعي ✨",
      icon: "✍️",
      gradientClass:
        "bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-cyan-500/10 dark:from-blue-950/40 dark:via-slate-900/80 dark:to-indigo-950/30",
      borderClass: "border-blue-300/80 dark:border-blue-800/70",
      hoverBorderClass:
        "hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-blue-500/10",
      buttonBgClass: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25",
      badgeClass:
        "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300/50 dark:border-blue-700/50",
    };
  }

  if (
    combined.includes("/cv") ||
    combined.includes("lebenslauf") ||
    combined.includes("سيرة ذاتية") ||
    combined.includes("منشئ السيرة")
  ) {
    return {
      isTool: true,
      title: text || "منشئ السيرة الذاتية الألمانية (German CV Builder)",
      description: "صمم سيرتك الذاتية المتوافقة مع معايير الشركات الألمانية DIN 5008 في دقائق معدودة",
      badge: "معايير DIN 5008 📄",
      icon: "📄",
      gradientClass:
        "bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-indigo-500/10 dark:from-sky-950/40 dark:via-slate-900/80 dark:to-blue-950/30",
      borderClass: "border-sky-300/80 dark:border-sky-800/70",
      hoverBorderClass:
        "hover:border-sky-500 dark:hover:border-sky-400 hover:shadow-sky-500/10",
      buttonBgClass: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25",
      badgeClass:
        "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-300/50 dark:border-sky-700/50",
    };
  }

  if (
    combined.includes("dossier") ||
    combined.includes("bewerbungsmappe") ||
    combined.includes("ملف الترشيح") ||
    combined.includes("ملف التقديم")
  ) {
    return {
      isTool: true,
      title: text || "ملف التقديم الشامل (Bewerbungsmappe)",
      description: "اجمع صفحة الغلاف والسيرة الذاتية وخطاب التقديم في ملف PDF واحد متكامل للتقديم",
      badge: "ملف PDF شامل 📁",
      icon: "📁",
      gradientClass:
        "bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 dark:from-amber-950/40 dark:via-slate-900/80 dark:to-orange-950/30",
      borderClass: "border-amber-300/80 dark:border-amber-800/70",
      hoverBorderClass:
        "hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-amber-500/10",
      buttonBgClass: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25",
      badgeClass:
        "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300/50 dark:border-amber-700/50",
    };
  }

  if (
    combined.includes("/jobs") ||
    combined.includes("وظائف") ||
    combined.includes("فرص عمل")
  ) {
    return {
      isTool: true,
      title: text || "وظائف ألمانيا المحدثة (Job Board)",
      description: "تصفح أحدث الوظائف وفرص العمل المتاحة في مختلف المدن والقطاعات الألمانية",
      badge: "فرص محدثة 💼",
      icon: "💼",
      gradientClass:
        "bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-blue-500/10 dark:from-teal-950/40 dark:via-slate-900/80 dark:to-blue-950/30",
      borderClass: "border-teal-300/80 dark:border-teal-800/70",
      hoverBorderClass:
        "hover:border-teal-500 dark:hover:border-teal-400 hover:shadow-teal-500/10",
      buttonBgClass: "bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/25",
      badgeClass:
        "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-300/50 dark:border-teal-700/50",
    };
  }

  if (
    lowerHref.includes("dashboard") ||
    lowerHref.startsWith("/ar/dashboard") ||
    lowerHref.startsWith("/dashboard")
  ) {
    return {
      isTool: true,
      title: text || "أداة GermanJobsPro للتوظيف",
      description: "انتقل مباشرة إلى الأداة لبدء التقديم والعمل في ألمانيا",
      badge: "أداة احترافية 🚀",
      icon: "🚀",
      gradientClass:
        "bg-gradient-to-r from-blue-500/10 via-slate-900/5 to-emerald-500/10 dark:from-blue-950/40 dark:via-slate-900/80 dark:to-emerald-950/30",
      borderClass: "border-blue-300/80 dark:border-blue-800/70",
      hoverBorderClass:
        "hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-blue-500/10",
      buttonBgClass: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25",
      badgeClass:
        "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300/50 dark:border-blue-700/50",
    };
  }

  return {
    isTool: false,
    title: text,
    description: "",
    badge: "",
    icon: "🔗",
    gradientClass: "",
    borderClass: "",
    hoverBorderClass: "",
    buttonBgClass: "",
    badgeClass: "",
  };
}

/**
 * Renders an interactive, clickable Enterprise CTA Button / Card.
 */
function EnterpriseCtaCard({
  href,
  title,
  description,
  badge,
  icon,
  gradientClass,
  borderClass,
  hoverBorderClass,
  buttonBgClass,
  badgeClass,
  locale,
  isAr,
}: ToolMetadata & { href: string; locale: string; isAr: boolean }) {
  const resolvedHref = resolveHref(href, locale);
  const isInternal =
    !resolvedHref.startsWith("http://") &&
    !resolvedHref.startsWith("https://") &&
    !resolvedHref.startsWith("mailto:");

  const cardInner = (
    <div
      className={`group relative overflow-hidden rounded-3xl p-5 sm:p-6 border shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-5 my-3 ${gradientClass} ${borderClass} ${hoverBorderClass}`}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Background ambient glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-white/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Main Content Info */}
      <div className="flex items-start sm:items-center gap-4 min-w-0 z-10">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-2xl sm:text-3xl shrink-0 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 select-none">
          {icon}
        </div>

        <div className="space-y-1.5 min-w-0 text-right">
          <div className="flex items-center gap-2.5 flex-wrap">
            {badge && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase border ${badgeClass}`}
              >
                {badge}
              </span>
            )}
            <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
              {title}
            </h4>
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* CTA Action Button */}
      <div className="flex items-center justify-end shrink-0 z-10 pt-2 sm:pt-0">
        <span
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:scale-105 active:scale-95 whitespace-nowrap cursor-pointer ${buttonBgClass}`}
        >
          <span>{isAr ? "تجربة الأداة الآن" : "Launch Tool"}</span>
          <span className="text-sm transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1">
            🚀
          </span>
        </span>
      </div>
    </div>
  );

  if (isInternal) {
    return (
      <Link href={resolvedHref} className="block no-underline">
        {cardInner}
      </Link>
    );
  }

  return (
    <a
      href={resolvedHref}
      target="_blank"
      rel="noopener noreferrer"
      className="block no-underline"
    >
      {cardInner}
    </a>
  );
}

/**
 * Parses and formats inline text:
 * - Converts Arabic phonetic guides [نطق عربي مع تشكيل] into styled amber badges
 * - Preserves React elements like links and tags
 */
function renderInlineContent(node: React.ReactNode): React.ReactNode {
  if (node === null || node === undefined) return null;

  if (typeof node !== "string") {
    if (Array.isArray(node)) {
      return React.Children.map(node, (child) => renderInlineContent(child));
    }
    if (React.isValidElement(node)) {
      const element = node as React.ReactElement<{ children?: React.ReactNode }>;
      if (element.props?.children) {
        return React.cloneElement(
          element,
          undefined,
          renderInlineContent(element.props.children)
        );
      }
      return node;
    }
    return node;
  }

  const text = node;
  // Regex to match bracketed Arabic phonetic guides like [هَالُو] or [إِخْ]
  const bracketRegex = /\[([\u0600-\u06FF\s:!؟،.\-_…]+)\]/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = bracketRegex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = bracketRegex.lastIndex;

    // Skip if followed by '(' which indicates a markdown link like [text](url)
    if (text[matchEnd] === "(") {
      continue;
    }

    if (matchStart > lastIndex) {
      parts.push(text.substring(lastIndex, matchStart));
    }

    const innerPhonetic = match[1];
    const cleanPhonetic = stripBrackets(innerPhonetic);
    const hasArabic = /[\u0600-\u06FF]/.test(cleanPhonetic);

    if (hasArabic && cleanPhonetic.length > 0) {
      parts.push(
        <span
          key={`phonetic-${matchStart}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 my-0.5 mx-1 rounded-xl bg-amber-500/10 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 font-semibold text-sm sm:text-base shadow-2xs"
          dir="rtl"
        >
          <span className="text-xs text-amber-600 dark:text-amber-400 select-none">🔊</span>
          <span>{cleanPhonetic}</span>
        </span>
      );
    } else {
      parts.push(cleanPhonetic);
    }

    lastIndex = matchEnd;
  }

  if (lastIndex === 0) {
    return text;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

/**
 * Detects if a text block is an Alert / Callout card:
 * - 💡 / الشرح الصوتي -> Blue Callout
 * - 📌 / ملاحظة / ملاحظة أكاديمية -> Emerald Callout
 * - ⚠️ / تنبيه / تنبيه هام -> Amber Callout
 */
function parseAlertBox(rawText: string) {
  const trimmed = rawText.trim();

  // 1. Warning / Alert (Amber)
  if (
    trimmed.startsWith("⚠️") ||
    trimmed.startsWith("تنبيه") ||
    trimmed.startsWith("تحذير") ||
    trimmed.startsWith("تنبيه هام")
  ) {
    const cleanText = trimmed.replace(/^(⚠️|تنبيه هام جداً:|تنبيه هام:|تنبيه:|تحذير:)\s*/, "");
    return {
      type: "warning" as const,
      title: "تنبيه هام",
      icon: "⚠️",
      content: cleanText,
    };
  }

  // 2. Academic Note / Note (Emerald)
  if (
    trimmed.startsWith("📌") ||
    trimmed.startsWith("ملاحظة") ||
    trimmed.startsWith("ملاحظة أكاديمية:") ||
    trimmed.startsWith("ملاحظة:") ||
    trimmed.startsWith("قاعدة ذهبية:")
  ) {
    const cleanText = trimmed.replace(/^(📌|ملاحظة أكاديمية:|ملاحظة:|قاعدة ذهبية:)\s*/, "");
    return {
      type: "note" as const,
      title: "ملاحظة هامة",
      icon: "📌",
      content: cleanText,
    };
  }

  // 3. Phonetic Guide / Insight (Blue)
  if (
    trimmed.startsWith("💡") ||
    trimmed.startsWith("الشرح الصوتي:") ||
    trimmed.startsWith("الشرح الصوتي") ||
    trimmed.startsWith("نصيحة:") ||
    trimmed.startsWith("إضاءة:")
  ) {
    const cleanText = trimmed.replace(/^(💡|الشرح الصوتي:|الشرح الصوتي|نصيحة:|إضاءة:)\s*/, "");
    return {
      type: "info" as const,
      title: "الشرح الصوتي وإضاءات",
      icon: "💡",
      content: cleanText,
    };
  }

  return null;
}

export interface DialogueTurnData {
  speaker: string;
  german: string;
  phonetic?: string;
  translation?: string;
}

export type DialogueTurn = DialogueTurnData;

/**
 * Speaker theme styling for dialogue message bubbles / cards.
 * - Speaker 1 (Herr Müller, Herr ..., Lukas, Thomas, السيد ..., Person 1, A): Blue Theme + 🗣️ Blue badge.
 * - Speaker 2 (Frau Schlein, Frau ..., السيدة ..., Sarah, Mona, Emma, Anna, Lisa, Person 2, B): Emerald Theme + 💬 Green badge.
 */
export function getSpeakerTheme(speaker: string) {
  const s = speaker ? speaker.toLowerCase().trim() : "";
  const cleanName = sanitizeSpeakerLine(s).toLowerCase();

  const isSpeaker1 =
    cleanName.startsWith("herr") ||
    cleanName.startsWith("السيد") ||
    cleanName.includes("müller") ||
    cleanName.includes("mueller") ||
    cleanName.includes("lukas") ||
    cleanName.includes("thomas") ||
    cleanName.includes("max") ||
    cleanName.includes("alex") ||
    cleanName.includes("jan") ||
    cleanName.includes("tim") ||
    cleanName.includes("david") ||
    cleanName.includes("felix") ||
    cleanName.includes("noah") ||
    cleanName.includes("elias") ||
    cleanName.includes("jonas") ||
    cleanName.includes("ben") ||
    cleanName.includes("leon") ||
    cleanName.includes("paul") ||
    cleanName.includes("sami") ||
    cleanName.includes("شخص 1") ||
    cleanName.includes("الشخص 1") ||
    cleanName.includes("طرف أ") ||
    cleanName.includes("الطرف أ") ||
    cleanName.includes("person 1") ||
    cleanName.includes("sprecher 1") ||
    cleanName === "a" ||
    cleanName === "أ";

  if (isSpeaker1) {
    return {
      badgeBg: "bg-blue-600 text-white shadow-xs",
      speakerText: "text-blue-600 dark:text-blue-400 font-bold",
      hoverBorder: "hover:border-blue-400/80 dark:hover:border-blue-700/80",
      accentBar: "from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500",
      icon: "🗣️",
      roleLabel: "Speaker 1",
    };
  }

  return {
    badgeBg: "bg-emerald-600 text-white shadow-xs",
    speakerText: "text-emerald-600 dark:text-emerald-400 font-bold",
    hoverBorder: "hover:border-emerald-400/80 dark:hover:border-emerald-700/80",
    accentBar: "from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500",
    icon: "💬",
    roleLabel: "Speaker 2",
  };
}

/**
 * Isolated Dialogue Card component:
 * - Group each speaker turn into ONE unified message bubble / dialogue card.
 * - Header/Top: Speaker name badge (e.g. 'Herr Müller' / 'Frau Weber') + German text aligned to the LEFT (dir='ltr', font-bold).
 * - Body/Bottom (same card): Phonetic pronunciation badge + Arabic translation aligned to the RIGHT (dir='rtl').
 */
export function DialogueCard({
  speaker,
  german,
  phonetic,
  translation,
  className = "",
}: DialogueTurnData & { className?: string }) {
  const cleanSpeaker = sanitizeSpeakerLine(speaker) || "Speaker";
  const theme = getSpeakerTheme(cleanSpeaker);

  // Clean German text and normalize punctuation
  let cleanGerman = (german || "")
    .replace(/^[\s\uFEFF\u200E\u200F•\-\*🗣️💬:\d\.\)\(]+/, "")
    .replace(/[\s\uFEFF\u200E\u200F]+$/, "")
    .trim();
  cleanGerman = cleanGerman.replace(/؟/g, "?").replace(/،/g, ",").replace(/؛/g, ";");

  const cleanPhonetic = phonetic ? stripBrackets(phonetic) : "";
  let cleanTranslation = translation ? translation.trim() : "";
  cleanTranslation = cleanTranslation.replace(/^[:\-–—\s]+/, "").trim();

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 my-3.5 space-y-3 ${theme.hoverBorder} ${className}`}
      dir="rtl"
    >
      {/* Accent bar on the left indicating German LTR / speaker role */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b ${theme.accentBar} opacity-80 group-hover:w-1.5 transition-all`}
      />

      {/* Header / Top: Speaker name badge + German text aligned to the LEFT (dir='ltr', font-bold) */}
      <div
        dir="ltr"
        className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-left font-sans pl-1"
      >
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-bold shadow-2xs shrink-0 select-none ${theme.badgeBg}`}
        >
          <span className="text-xs select-none">{theme.icon}</span>
          <span>{cleanSpeaker}</span>
        </span>
        <span className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl tracking-wide leading-snug flex-1 select-text">
          {cleanGerman}
        </span>
      </div>

      {/* Body / Bottom (same card): Phonetic pronunciation badge + Arabic translation aligned to the RIGHT (dir='rtl') */}
      {(cleanPhonetic || cleanTranslation) ? (
        <div
          dir="rtl"
          className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2.5 sm:gap-3 text-right"
        >
          {cleanPhonetic && (
            <span
              dir="rtl"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 font-semibold text-xs sm:text-sm shadow-2xs shrink-0 select-none"
            >
              <span className="text-xs text-amber-600 dark:text-amber-400 select-none">🔊</span>
              <span>{cleanPhonetic}</span>
            </span>
          )}

          {cleanTranslation && (
            <span
              dir="rtl"
              className="text-slate-700 dark:text-slate-200 text-sm sm:text-base font-normal leading-relaxed text-right flex-1 min-w-[200px] select-text"
            >
              {cleanTranslation}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Extracts German text, phonetic guide, and Arabic translation from a single speaker line content.
 */
/**
 * Extracts German text, phonetic guide, and Arabic translation from a single speaker line content.
 */
function parseDialogueLineContent(rawContent: string): {
  german: string;
  phonetic: string;
  translation: string;
} {
  const clean = rawContent.trim();
  if (!clean) return { german: "", phonetic: "", translation: "" };

  // 1. Check for German [Phonetic] (: / - / space) Translation
  const matchWithPhoneticAndTrans = clean.match(
    /^([A-Za-zäöüÄÖÜß0-9\s\-.,?!/’'"()…]+?)\s*\[([\u0600-\u06FFa-zA-ZäöüÄÖÜß\s:!؟،.\-_…]+)\](?:\s*[:\-–—]\s*|\s+)(.+)$/u
  );
  if (matchWithPhoneticAndTrans) {
    return {
      german: matchWithPhoneticAndTrans[1].trim(),
      phonetic: stripBrackets(matchWithPhoneticAndTrans[2]),
      translation: matchWithPhoneticAndTrans[3].replace(/^[:\-–—\s]+/, "").trim(),
    };
  }

  // 2. Check for German [Phonetic] (no translation)
  const matchPhoneticOnly = clean.match(
    /^([A-Za-zäöüÄÖÜß0-9\s\-.,?!/’'"()…]+?)\s*\[([\u0600-\u06FFa-zA-ZäöüÄÖÜß\s:!؟،.\-_…]+)\]\s*$/u
  );
  if (matchPhoneticOnly) {
    return {
      german: matchPhoneticOnly[1].trim(),
      phonetic: stripBrackets(matchPhoneticOnly[2]),
      translation: "",
    };
  }

  // 3. Check for German : / - / – / — Arabic Translation
  const matchTransWithSeparator = clean.match(
    /^([A-Za-zäöüÄÖÜß0-9\s\-.,?!/’'"()…]+?)\s*[:\-–—]\s*([\u0600-\u06FF].+)$/u
  );
  if (matchTransWithSeparator) {
    return {
      german: matchTransWithSeparator[1].trim(),
      phonetic: "",
      translation: matchTransWithSeparator[2].trim(),
    };
  }

  // 4. Check for German (Arabic Translation)
  const matchTransParen = clean.match(
    /^([A-Za-zäöüÄÖÜß0-9\s\-.,?!/’'"()…]+?)\s*\(([\u0600-\u06FF].+?)\)\s*$/u
  );
  if (matchTransParen) {
    return {
      german: matchTransParen[1].trim(),
      phonetic: "",
      translation: matchTransParen[2].trim(),
    };
  }

  // 5. Check for German followed directly by Arabic translation
  const matchGermanArabic = clean.match(
    /^([A-Za-zäöüÄÖÜß0-9\s\-.,?!/’'"()…]+?)\s+([\u0600-\u06FF].+)$/u
  );
  if (matchGermanArabic) {
    return {
      german: matchGermanArabic[1].trim(),
      phonetic: "",
      translation: matchGermanArabic[2].trim(),
    };
  }

  // 6. If content contains only Arabic (or Arabic with phonetic/punctuation), with no German/Latin letters
  if (!/[A-Za-zäöüÄÖÜß]/.test(clean) && /[\u0600-\u06FF]/.test(clean)) {
    const phoneticMatch = clean.match(/\[([\u0600-\u06FFa-zA-ZäöüÄÖÜß\s:!؟،.\-_…]+)\]/u);
    if (phoneticMatch) {
      const ph = stripBrackets(phoneticMatch[1]);
      const tr = clean
        .replace(/\[[\u0600-\u06FFa-zA-ZäöüÄÖÜß\s:!؟،.\-_…]+\]/u, "")
        .replace(/^[:\-–—\s]+/, "")
        .trim();
      return {
        german: "",
        phonetic: ph,
        translation: tr,
      };
    }
    return {
      german: "",
      phonetic: "",
      translation: clean,
    };
  }

  // Fallback: entire string is German text
  return {
    german: clean,
    phonetic: "",
    translation: "",
  };
}

/**
 * Parses raw text into one or more DialogueTurns.
 * Correctly sanitizes leading punctuation, splits multiple turns in a single block,
 * attaches Arabic translations to preceding German speaker turns, and extracts unified cards.
 */
export function parseDialogues(rawText: string): DialogueTurnData[] | null {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const dialogueSpeakerRegex = /^([A-Za-zäöüÄÖÜß\u0600-\u06FF0-9\s\-.\(\)/']+?)\s*[:：]\s*(.+)$/u;

  const hasDialogueIndicator = lines.some((line) => {
    const sanitized = sanitizeSpeakerLine(line);
    const match = sanitized.match(dialogueSpeakerRegex);
    if (!match) return false;
    const spk = match[1].trim();
    return (
      /^(Herr|Frau|Lukas|Sami|Thomas|Mona|Sarah|Emma|Anna|Max|Alex|Lisa|Jan|Tim|Laura|Julia|Marie|Leon|Paul|Felix|David|Noah|Elias|Jonas|Ben|Lea|Mia|Hannah|Sofia|Lena|Emily|Lina|Clara|Elena|Person\s*\d*|Sprecher\s*\d*|Kunde|Verkäufer|Kellner|Gast|Arzt|Patient|Lehrer|Schüler|Chef|Kollege|Bewerber|Interviewer|A|B|السيد|السيدة|الشخص|الطرف)/iu.test(
        spk
      ) ||
      /^[A-Za-zäöüÄÖÜß\u0600-\u06FF\s\-.]+$/u.test(spk) ||
      lines.some(
        (l) =>
          l.startsWith("النطق:") ||
          l.startsWith("الترجمة:") ||
          l.startsWith("🗣️") ||
          l.startsWith("💬")
      )
    );
  });

  if (!hasDialogueIndicator) return null;

  const turns: DialogueTurnData[] = [];
  let currentTurn: Partial<DialogueTurnData> | null = null;

  for (const line of lines) {
    const sanitized = sanitizeSpeakerLine(line);

    // 1. Explicit phonetic line (e.g. "النطق: [جوتن تاج]" or "🗣️ [جوتن تاج]" or "[جوتن تاج]")
    if (
      sanitized.startsWith("النطق:") ||
      sanitized.startsWith("🗣️") ||
      (/^\[[\u0600-\u06FFa-zA-ZäöüÄÖÜß\s:!؟،.\-_…]+\]$/u.test(sanitized) && currentTurn)
    ) {
      const rawPhonetic = sanitized.replace(/^(النطق:|🗣️)\s*/, "");
      const cleanPhonetic = stripBrackets(rawPhonetic);
      if (currentTurn) {
        currentTurn.phonetic = cleanPhonetic;
      }
      continue;
    }

    // 2. Explicit translation line (e.g. "الترجمة: نهارك سعيد" or "💬 نهارك سعيد")
    if (sanitized.startsWith("الترجمة:") || sanitized.startsWith("💬")) {
      const rawTranslation = sanitized.replace(/^(الترجمة:|💬)\s*/, "").trim();
      if (currentTurn) {
        currentTurn.translation = rawTranslation;
      }
      continue;
    }

    // Skip non-dialogue prefixes like notes, rules, warnings, examples
    if (
      sanitized.startsWith("ملاحظة:") ||
      sanitized.startsWith("قاعدة:") ||
      sanitized.startsWith("تنبيه:") ||
      sanitized.startsWith("مثال:") ||
      sanitized.startsWith("Beispiel:")
    ) {
      continue;
    }

    const speakerMatch = sanitized.match(dialogueSpeakerRegex);

    // 3. If it's a speaker line (e.g. "Herr Müller: Guten Tag!" or "السيد مولر: نهارك سعيد!")
    if (speakerMatch) {
      const spk = speakerMatch[1].trim();
      const contentAfterSpeaker = speakerMatch[2].trim();

      const isKnownSpeaker =
        /^(Herr|Frau|Lukas|Sami|Thomas|Mona|Sarah|Emma|Anna|Max|Alex|Lisa|Jan|Tim|Laura|Julia|Marie|Leon|Paul|Felix|David|Noah|Elias|Jonas|Ben|Lea|Mia|Hannah|Sofia|Lena|Emily|Lina|Clara|Elena|Person\s*\d*|Sprecher\s*\d*|Kunde|Verkäufer|Kellner|Gast|Arzt|Patient|Lehrer|Schüler|Chef|Kollege|Bewerber|Interviewer|A|B|السيد|السيدة|الشخص|الطرف)/iu.test(
          spk
        ) || /^[A-Za-zäöüÄÖÜß\u0600-\u06FF0-9\s\-.\(\)/']+$/u.test(spk);

      if (isKnownSpeaker) {
        const parsedContent = parseDialogueLineContent(contentAfterSpeaker);

        // Check if this line is an Arabic translation line (no German Latin characters)
        const isPureArabicContent =
          !/[A-Za-zäöüÄÖÜß]/.test(contentAfterSpeaker) &&
          /[\u0600-\u06FF]/.test(contentAfterSpeaker);

        if (isPureArabicContent) {
          // If we have an active German turn, attach this Arabic line to its translation
          if (currentTurn && currentTurn.german) {
            currentTurn.translation = parsedContent.translation || contentAfterSpeaker;
            if (parsedContent.phonetic && !currentTurn.phonetic) {
              currentTurn.phonetic = parsedContent.phonetic;
            }
            continue;
          }
        }

        // If it has German/Latin characters, it is a genuine German speaker turn!
        if (parsedContent.german && /[A-Za-zäöüÄÖÜß]/.test(parsedContent.german)) {
          // Push previous completed turn if valid
          if (currentTurn && currentTurn.german && /[A-Za-zäöüÄÖÜß]/.test(currentTurn.german)) {
            turns.push({
              speaker: currentTurn.speaker || "Speaker",
              german: currentTurn.german,
              phonetic: currentTurn.phonetic || "",
              translation: currentTurn.translation || "",
            });
          }

          currentTurn = {
            speaker: spk,
            german: parsedContent.german,
            phonetic: parsedContent.phonetic,
            translation: parsedContent.translation,
          };
          continue;
        }

        // If there's translation content on a speaker line, attach it to currentTurn
        if (currentTurn && currentTurn.german && parsedContent.translation) {
          currentTurn.translation = parsedContent.translation;
          if (parsedContent.phonetic && !currentTurn.phonetic) {
            currentTurn.phonetic = parsedContent.phonetic;
          }
          continue;
        }
      }
    }

    // 4. Plain Arabic line without prefix that follows a German speaker turn
    if (currentTurn && currentTurn.german && !currentTurn.translation && /^[\u0600-\u06FF]/.test(sanitized)) {
      currentTurn.translation = sanitized;
      continue;
    }
  }

  // Push the final turn if it contains German text
  if (currentTurn && currentTurn.german && /[A-Za-zäöüÄÖÜß]/.test(currentTurn.german)) {
    turns.push({
      speaker: currentTurn.speaker || "Speaker",
      german: currentTurn.german,
      phonetic: currentTurn.phonetic || "",
      translation: currentTurn.translation || "",
    });
  }

  // Filter out any orphaned translation-only turns (ensure german exists and contains Latin/German chars)
  const validTurns = turns.filter(
    (t) => Boolean(t.german) && /[A-Za-zäöüÄÖÜß]/.test(t.german)
  );

  return validTurns.length > 0 ? validTurns : null;
}

export interface VocabularyItemData {
  german: string;
  phonetic?: string;
  translation?: string;
}

/**
 * Detects if a string is a single vocabulary / phrase item:
 * e.g. "Hallo [هالو] مرحباً"
 * e.g. "Wie heißen Sie? [في هايسن زي؟] ما اسم حضرتك؟"
 * e.g. "Guten Tag! [جوتن تاج] : نهارك سعيد"
 * e.g. "Auf Wiedersehen [أوف فيدرزين] - إلى اللقاء / مع السلامة"
 * e.g. "Wie geht es Ihnen? : كيف حالك؟"
 * e.g. "Danke schön (شكراً جزيلاً)"
 * e.g. "der Tisch [دير تيش]"
 */
export function parseVocabularyLine(rawText: string): VocabularyItemData | null {
  if (!rawText) return null;

  // Clean leading bullet markers, numbering, or speaker emojis
  const clean = rawText
    .trim()
    .replace(/^[\s\uFEFF\u200E\u200F•\-\*🗣️💬:\d\.\)\(]+/, "")
    .trim();

  if (!clean) return null;

  // Skip dialogue speaker lines so Dialogue parser handles them
  if (
    /^(Herr|Frau|Lukas|Sami|Thomas|Mona|Sarah|Emma|Anna|Max|Alex|Lisa|Jan|Tim|Laura|Julia|Marie|Leon|Paul|Felix|David|Noah|Elias|Jonas|Ben|Lea|Mia|Hannah|Sofia|Lena|Emily|Lina|Clara|Elena|Person\s*\d*|Sprecher\s*\d*|Kunde|Verkäufer|Kellner|Gast|Arzt|Patient|Lehrer|Schüler|Chef|Kollege|Bewerber|Interviewer|A|B|السيد|السيدة|الشخص|الطرف)\s*[:：]/iu.test(
      clean
    )
  ) {
    return null;
  }

  // Must start with Latin/German character
  if (!/^[A-Za-zäöüÄÖÜß]/.test(clean)) {
    return null;
  }

  // Do not parse if it's a URL or known non-vocab keyword
  if (
    clean.startsWith("http://") ||
    clean.startsWith("https://") ||
    clean.startsWith("www.") ||
    clean.startsWith("Aussagesatz") ||
    clean.startsWith("Satzbau") ||
    clean.startsWith("W-Frage")
  ) {
    return null;
  }

  // Pattern 1: German [Phonetic] : Translation (or with - / – / — or whitespace)
  // Matches phrases like "Wie heißen Sie? [في هايسن زي؟] ما اسم حضرتك؟" or "Hallo [هالو] مرحباً"
  const match1 = clean.match(
    /^([A-Za-zäöüÄÖÜß0-9\s\-.,?!/’'"()…]+?)\s*\[([\u0600-\u06FF\s:!؟،.A-Za-z0-9\-_…]+)\](?:\s*[:\-–—]\s*|\s+)(.+)$/
  );
  if (match1) {
    const german = match1[1].trim();
    const phonetic = stripBrackets(match1[2]);
    const translation = match1[3].trim();
    if (german.length > 0) {
      return { german, phonetic, translation };
    }
  }

  // Pattern 2: German [Phonetic] (no translation, standalone word with pronunciation)
  const matchPhoneticOnly = clean.match(
    /^([A-Za-zäöüÄÖÜß0-9\s\-.,?!/’'"()…]+?)\s*\[([\u0600-\u06FF\s:!؟،.A-Za-z0-9\-_…]+)\]\s*$/
  );
  if (matchPhoneticOnly) {
    const german = matchPhoneticOnly[1].trim();
    const phonetic = stripBrackets(matchPhoneticOnly[2]);
    if (german.length > 0) {
      return { german, phonetic, translation: "" };
    }
  }

  // Pattern 3: German : Arabic Translation (or with - / – / —)
  const match2 = clean.match(
    /^([A-Za-zäöüÄÖÜß0-9\s\-.,?!/’'"()…]+?)\s*[:\-–—]\s*([\u0600-\u06FF].+)$/
  );
  if (match2) {
    const german = match2[1].trim();
    const translation = match2[2].trim();
    if (german.length > 0 && translation.length > 0) {
      return { german, phonetic: "", translation };
    }
  }

  // Pattern 4: German (Arabic Translation)
  const match3 = clean.match(
    /^([A-Za-zäöüÄÖÜß0-9\s\-.,?!/’'"()…]+?)\s*\(([\u0600-\u06FF].+?)\)\s*$/
  );
  if (match3) {
    const german = match3[1].trim();
    const translation = match3[2].trim();
    if (german.length > 0 && translation.length > 0) {
      return { german, phonetic: "", translation };
    }
  }

  // Pattern 5: German followed directly by Arabic translation (separated by space)
  const match4 = clean.match(
    /^([A-Za-zäöüÄÖÜß0-9\s\-.,?!/’'"()…]+?)\s+([\u0600-\u06FF].+)$/
  );
  if (match4) {
    const german = match4[1].trim();
    const translation = match4[2].trim();
    if (german.length >= 2 && translation.length > 0) {
      return { german, phonetic: "", translation };
    }
  }

  return null;
}

/**
 * Parses bullet items into vocabulary items or generic items.
 */
function parseBulletItem(rawText: string) {
  const clean = rawText.trim().replace(/^[-*•]\s*/, "");
  const vocab = parseVocabularyLine(clean);
  if (vocab) {
    return {
      type: "vocab" as const,
      data: vocab,
    };
  }
  return { type: "generic" as const, text: clean };
}

/**
 * Detects if a paragraph represents an Exercise prompt:
 * e.g. "التمرين الأول: اختر الضمير أو الفعل الصحيح مما بين القوسين."
 */
function parseExercisePrompt(rawText: string) {
  const trimmed = rawText.trim();
  const match = trimmed.match(/^(التمرين\s+[^\n:]+|تمرين\s*\d*):?\s*(.*)$/);
  if (match) {
    return {
      title: match[1].trim(),
      instruction: match[2] ? match[2].trim() : "",
    };
  }
  return null;
}

/**
 * Detects and parses Grammar Rule blocks.
 */
function parseGrammarRule(rawText: string) {
  const clean = rawText.trim().replace(/^\d+[\.\-\)]\s*/, "").trim();

  // Check if this block describes a grammar rule
  const isGrammar =
    /^(ترتيب الجملة|Aussagesatz|شرح القاعدة|قاعدة|قواعد|تصريف الفعل|الضمائر|الضمير|Satzbau|Satzstruktur|W-Frage|Ja\/Nein)/i.test(clean) ||
    clean.includes("Aussagesatz") ||
    clean.includes("ترتيب الجملة") ||
    clean.includes("الفعل المصرّف") ||
    clean.includes("في المركز الثاني") ||
    clean.includes("شرح القاعدة:") ||
    clean.includes("قاعدة ذهبية:") ||
    clean.includes("قاعدة:") ||
    clean.includes("تصريف الفعل") ||
    clean.includes("الضمائر الشخصية");

  if (!isGrammar) return null;

  const lines = rawText.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  let title = "";
  let description = "";
  let exampleSentence = "";
  let breakdownChips: string[] = [];
  const remainingLines: string[] = [];

  // Title extraction
  const firstLine = lines[0].replace(/^\d+[\.\-\)]\s*/, "").trim();
  const titleColonMatch = firstLine.match(/^([^:\n]+)[:\-–—]\s*(.*)$/);
  if (titleColonMatch && !firstLine.startsWith("مثال") && !firstLine.startsWith("Beispiel")) {
    title = titleColonMatch[1].trim();
    if (titleColonMatch[2]) {
      description = titleColonMatch[2].trim();
    }
  } else {
    title = firstLine;
  }

  // Parse subsequent lines
  const linesToScan = lines.slice(1);
  for (const line of linesToScan) {
    const exMatch = line.match(/^(?:مثال|Beispiel|نموذج)[:\-–—]\s*(.+)$/i);
    if (exMatch) {
      const fullEx = exMatch[1].trim();
      const parenMatch = fullEx.match(/^([^(]+?)\s*\((.+)\)[\.\s]*$/);
      if (parenMatch) {
        exampleSentence = parenMatch[1].trim();
        const breakdownRaw = parenMatch[2].trim();
        breakdownChips = breakdownRaw
          .split(/[,،|;؛]/)
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        exampleSentence = fullEx;
      }
      continue;
    }

    if (!description) {
      description = line;
    } else {
      remainingLines.push(line);
    }
  }

  return {
    title,
    description,
    exampleSentence,
    breakdownChips,
    remainingLines,
  };
}

/**
 * Detects and parses Solution blocks.
 */
function parseSolutionBlock(rawText: string) {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const firstLine = lines[0];
  const isSolution = /^(حلول التمارين|حل التمرين|الحلول|الإجابات)/.test(firstLine);
  if (!isSolution) return null;

  return {
    header: firstLine,
    contentLines: lines.slice(1),
  };
}

/**
 * Isolated Vocabulary Card component:
 * - Tier 1: German text strictly on its own top line, Left-Aligned (text-left) with dir="ltr",
 *   bold font (text-lg sm:text-xl font-sans tracking-wide). Ensures question marks (?) and exclamation marks (!)
 *   stay correctly on the right/end of German sentences.
 * - Tier 2: Pronunciation & Arabic Translation on a separate line below the German text (dir="rtl" text-right):
 *   * Phonetic Guide: Clean amber badge with 🔊.
 *   * Arabic Translation / Explanation: Clean text explaining the meaning.
 * - Prevents single-line RTL wrapping where German words get entangled with Arabic text and phonetics.
 */
export function VocabularyCard({
  german,
  phonetic,
  translation,
  className = "",
}: VocabularyItemData & { className?: string }) {
  // Clean German text and normalize punctuation
  let cleanGerman = german
    .replace(/^[\s\uFEFF\u200E\u200F•\-\*🗣️💬:\d\.\)\(]+/, "")
    .replace(/[\s\uFEFF\u200E\u200F]+$/, "")
    .trim();
  // Normalize any Arabic punctuation in German text
  cleanGerman = cleanGerman.replace(/؟/g, "?").replace(/،/g, ",").replace(/؛/g, ";");

  const cleanPhonetic = phonetic ? stripBrackets(phonetic) : "";
  let cleanTranslation = translation ? translation.trim() : "";
  cleanTranslation = cleanTranslation.replace(/^[:\-–—\s]+/, "").trim();

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-blue-400/80 dark:hover:border-blue-700/80 transition-all duration-200 my-3.5 space-y-3 ${className}`}
    >
      {/* Subtle accent bar on the left indicating German LTR */}
      <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 opacity-80 group-hover:w-1.5 transition-all" />

      {/* Tier 1: German Text (Strictly top line, Left-Aligned, LTR, Bold, German typography) */}
      <div
        dir="ltr"
        className="text-left font-bold text-slate-900 dark:text-white text-lg sm:text-xl font-sans tracking-wide leading-snug pl-1 select-text flex items-center justify-between gap-3"
      >
        <span className="text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {cleanGerman}
        </span>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 select-none shrink-0">
          DE
        </span>
      </div>

      {/* Tier 2: Pronunciation & Arabic Translation (Strictly separate bottom line, RTL, Right-aligned) */}
      {(cleanPhonetic || cleanTranslation) ? (
        <div
          dir="rtl"
          className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2.5 sm:gap-3 text-right"
        >
          {cleanPhonetic && (
            <span
              dir="rtl"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 font-semibold text-xs sm:text-sm shadow-2xs shrink-0 select-none"
            >
              <span className="text-xs text-amber-600 dark:text-amber-400 select-none">🔊</span>
              <span>{cleanPhonetic}</span>
            </span>
          )}

          {cleanTranslation && (
            <span
              dir="rtl"
              className="text-slate-700 dark:text-slate-200 text-sm sm:text-base font-normal leading-relaxed text-right flex-1 min-w-[200px]"
            >
              {cleanTranslation}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Detects Vocabulary Trio inside a paragraph block.
 */
function parseVocabularyTrio(rawText: string): VocabularyItemData | null {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    const firstLine = sanitizeSpeakerLine(lines[0]);
    // Skip dialogue lines
    if (
      /^(Herr|Frau|Lukas|Sami|Thomas|Mona|Sarah|Emma|Anna|Max|Alex|Lisa|Jan|Tim|Laura|Julia|Marie|Leon|Paul|Felix|David|Noah|Elias|Jonas|Ben|Lea|Mia|Hannah|Sofia|Lena|Emily|Lina|Clara|Elena|Person\s*\d*|Sprecher\s*\d*|Kunde|Verkäufer|Kellner|Gast|Arzt|Patient|Lehrer|Schüler|Chef|Kollege|Bewerber|Interviewer|A|B|السيد|السيدة|الشخص|الطرف)\s*[:：]/iu.test(
        firstLine
      )
    ) {
      return null;
    }
    const hasLatin = /^[A-Za-zäöüÄÖÜß\s\-?,!.]+$/.test(firstLine);
    const hasPhonetic = lines.some((l) => l.startsWith("النطق:") || l.startsWith("🗣️"));
    const hasTranslation = lines.some((l) => l.startsWith("الترجمة:") || l.startsWith("💬"));

    if (hasLatin && (hasPhonetic || hasTranslation)) {
      const rawPhoneticLine =
        lines.find((l) => l.startsWith("النطق:") || l.startsWith("🗣️"))?.replace(/^(النطق:|🗣️)\s*/, "") || "";
      const cleanPhonetic = stripBrackets(rawPhoneticLine);
      const translationLine =
        lines.find((l) => l.startsWith("الترجمة:") || l.startsWith("💬"))?.replace(/^(الترجمة:|💬)\s*/, "") || "";

      return {
        german: firstLine,
        phonetic: cleanPhonetic,
        translation: translationLine,
      };
    }
  }
  return null;
}

/**
 * Detects if a paragraph contains one or more vocabulary lines.
 */
function parseVocabularyBlock(rawText: string): VocabularyItemData[] | null {
  // 1. Multi-line trio format
  const trio = parseVocabularyTrio(rawText);
  if (trio) {
    return [trio];
  }

  // 2. Lines separated by newline
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const parsedItems: VocabularyItemData[] = [];
  for (const line of lines) {
    const item = parseVocabularyLine(line);
    if (item) {
      parsedItems.push(item);
    } else {
      return null;
    }
  }

  return parsedItems.length > 0 ? parsedItems : null;
}

/**
 * Normalizes dialogue markdown content before passing to ReactMarkdown:
 * Merges empty lines between a speaker line and its followup lines (phonetic, translation, Arabic speaker translation),
 * so they remain together in a single markdown paragraph block.
 */
export function normalizeDialogueMarkdown(markdownContent: string): string {
  if (!markdownContent) return "";

  const lines = markdownContent.split(/\r?\n/);
  const result: string[] = [];

  const isSpeakerLine = (l: string) => {
    const s = sanitizeSpeakerLine(l);
    return (
      /^(?:Herr|Frau|Lukas|Sami|Thomas|Mona|Sarah|Emma|Anna|Max|Alex|Lisa|Jan|Tim|Laura|Julia|Marie|Leon|Paul|Felix|David|Noah|Elias|Jonas|Ben|Lea|Mia|Hannah|Sofia|Lena|Emily|Lina|Clara|Elena|Person\s*\d*|Sprecher\s*\d*|Kunde|Verkäufer|Kellner|Gast|Arzt|Patient|Lehrer|Schüler|Chef|Kollege|Bewerber|Interviewer|A|B|السيد|السيدة|الشخص|الطرف)(?:[\s:：]|$)/iu.test(
        s
      ) && /[:：]/.test(s)
    );
  };

  const isDialogueFollowupLine = (l: string) => {
    const s = sanitizeSpeakerLine(l);
    return (
      s.startsWith("النطق:") ||
      s.startsWith("الترجمة:") ||
      s.startsWith("🗣️") ||
      s.startsWith("💬") ||
      /^\[[\u0600-\u06FFa-zA-ZäöüÄÖÜß\s:!؟،.\-_…]+\]$/u.test(s) ||
      (/^(?:السيد|السيدة|الشخص|الطرف)(?:[\s:：]|$)/iu.test(s) && /[:：]/.test(s) && !/[A-Za-zäöüÄÖÜß]/.test(s)) ||
      (!/[A-Za-zäöüÄÖÜß]/.test(s) && /[\u0600-\u06FF]/.test(s) && s.length > 0 && !s.startsWith("#") && !s.startsWith("---"))
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // If this line is empty, check if it's between a speaker line and its followup lines
    if (trimmed === "") {
      let prevIdx = result.length - 1;
      while (prevIdx >= 0 && result[prevIdx].trim() === "") {
        prevIdx--;
      }
      let nextIdx = i + 1;
      while (nextIdx < lines.length && lines[nextIdx].trim() === "") {
        nextIdx++;
      }

      if (prevIdx >= 0 && nextIdx < lines.length) {
        const prevLine = result[prevIdx];
        const nextLine = lines[nextIdx];

        if (
          (isSpeakerLine(prevLine) || isDialogueFollowupLine(prevLine)) &&
          isDialogueFollowupLine(nextLine)
        ) {
          // Collapse empty line so dialogue turn remains unified in one paragraph
          continue;
        }
      }
    }

    result.push(line);
  }

  return result.join("\n");
}

/**
 * High-performance, rich markdown renderer tailored for German A1 educational lessons
 * with Enterprise CTA Cards, Grammar Cards, 3-tier Vocabulary & Dialogue layouts, and clickable links.
 */
export default function LessonContentRenderer({
  content,
  category,
  locale,
}: LessonContentRendererProps) {
  const isAr = locale === "ar";
  const normalizedContent = React.useMemo(() => normalizeDialogueMarkdown(content), [content]);

  /**
   * Helper to render the Enterprise Grammar Card
   */
  const renderGrammarCard = (grammar: ReturnType<typeof parseGrammarRule>) => {
    if (!grammar) return null;

    if (grammar.exampleSentence || grammar.description || grammar.remainingLines.length > 0) {
      return (
        <div
          className="my-8 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 border-t-4 border-t-emerald-500 shadow-sm space-y-4"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center gap-3.5 border-b border-slate-100 dark:border-slate-800/80 pb-3.5 text-right">
            <span className="w-10 h-10 rounded-2xl bg-emerald-500/15 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300/40 dark:border-emerald-700/50 flex items-center justify-center text-xl shrink-0 select-none shadow-2xs">
              📐
            </span>
            <div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                قاعدة نحوية
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white text-right leading-tight">
                {grammar.title}
              </h3>
            </div>
          </div>

          {/* Rule Description */}
          {grammar.description && (
            <div className="text-slate-700 dark:text-slate-200 text-base sm:text-lg leading-relaxed font-normal text-right pt-1" dir="rtl">
              {renderInlineContent(grammar.description)}
            </div>
          )}

          {/* Example Breakdown Box */}
          {grammar.exampleSentence && (
            <div className="mt-5 p-5 sm:p-6 rounded-2xl bg-slate-50/90 dark:bg-slate-950/70 border border-blue-200/80 dark:border-blue-900/50 space-y-4">
              <div className="flex items-center gap-2" dir="rtl">
                <span className="px-3 py-1 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-2xs select-none">
                  💡 مثال توضيحي
                </span>
              </div>

              <div
                dir="ltr"
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-blue-300/60 dark:border-blue-800/80 shadow-2xs text-left"
              >
                <span className="font-extrabold text-blue-600 dark:text-white text-lg sm:text-xl font-sans tracking-wide">
                  {grammar.exampleSentence}
                </span>
              </div>

              {grammar.breakdownChips.length > 0 && (
                <div className="pt-1 space-y-2">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 text-right" dir="rtl">
                    التحليل النحوي ومواقع الكلمات في الجملة:
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5" dir="rtl">
                    {grammar.breakdownChips.map((chip, cIdx) => (
                      <span
                        key={`chip-${cIdx}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60 font-semibold text-xs sm:text-sm shadow-2xs"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span>{chip}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Remaining explanation lines */}
          {grammar.remainingLines.length > 0 && (
            <div className="space-y-2 pt-2 text-right" dir="rtl">
              {grammar.remainingLines.map((rLine, rIdx) => (
                <div key={`rem-${rIdx}`} className="text-slate-700 dark:text-slate-200 text-base leading-relaxed">
                  {renderInlineContent(rLine)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Title-only Grammar Header Card
    return (
      <div
        className="mt-8 mb-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 border-r-4 border-r-emerald-500 shadow-2xs"
        dir="rtl"
      >
        <span className="w-8 h-8 rounded-xl bg-emerald-500/15 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300/40 dark:border-emerald-700/50 flex items-center justify-center font-bold text-sm shrink-0 select-none">
          📚
        </span>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white text-right">
          {grammar.title}
        </h3>
      </div>
    );
  };

  return (
    <div className={`prose-container space-y-6 ${isAr ? "text-right" : "text-left"}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mt-12 mb-6 leading-tight border-b border-slate-200 dark:border-slate-800 pb-4 text-right" dir="rtl">
              {children}
            </h1>
          ),
          h2: ({ children }) => {
            const headingText = getNodeText(children);
            const isCtaSection =
              headingText.includes("هل تستعد للعمل في ألمانيا") ||
              headingText.includes("هل ترغب في العمل في ألمانيا") ||
              headingText.includes("العمل في ألمانيا") ||
              headingText.includes("أدوات التوظيف") ||
              headingText.includes("أدواتنا للعمل في ألمانيا") ||
              headingText.includes("أدوات احترافية") ||
              headingText.includes("الاستعداد للعمل في ألمانيا");

            if (isCtaSection) {
              return (
                <div
                  className="mt-14 mb-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900/30 via-slate-900/70 to-emerald-900/30 border border-blue-500/30 dark:border-blue-800/60 shadow-lg text-right"
                  dir="rtl"
                >
                  <div className="flex items-center gap-3.5 mb-2">
                    <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-md select-none">
                      🚀
                    </span>
                    <div>
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                        أدوات التوظيف الذكية في ألمانيا
                      </span>
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mt-1 leading-snug">
                        {children}
                      </h2>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
                    استخدم أدواتنا الذكية المعتمدة لتجهيز ملفك الوظيفي وزيادة فرص قبولك في الشركات الألمانية:
                  </p>
                </div>
              );
            }

            const isLessonSection =
              headingText.includes("المفردات") ||
              headingText.includes("الشرح الصوتي") ||
              headingText.includes("الحوار") ||
              headingText.includes("القواعد") ||
              headingText.includes("التعارف") ||
              headingText.includes("التحية") ||
              headingText.includes("تمارين") ||
              headingText.includes("حلول");

            let badgeIcon = "🇩🇪";
            if (headingText.includes("المفردات")) badgeIcon = "📚";
            else if (headingText.includes("الشرح الصوتي")) badgeIcon = "💡";
            else if (headingText.includes("الحوار")) badgeIcon = "💬";
            else if (headingText.includes("القواعد")) badgeIcon = "📐";
            else if (headingText.includes("تمارين")) badgeIcon = "📝";
            else if (headingText.includes("حلول")) badgeIcon = "🎯";

            return (
              <div className="mt-12 mb-6 pt-4" dir="rtl">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white leading-snug flex items-center gap-3 text-right">
                  {isLessonSection && (
                    <span className="w-9 h-9 rounded-xl bg-blue-600/15 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-300/40 dark:border-blue-800/50 flex items-center justify-center text-lg shrink-0">
                      {badgeIcon}
                    </span>
                  )}
                  <span>{children}</span>
                </h2>
                <div className="mt-2 h-0.5 w-full bg-gradient-to-r from-blue-500/40 via-slate-200 dark:via-slate-800 to-transparent" />
              </div>
            );
          },
          h3: ({ children }) => {
            const headingText = getNodeText(children);
            const isCtaSection =
              headingText.includes("هل تستعد للعمل في ألمانيا") ||
              headingText.includes("هل ترغب في العمل في ألمانيا") ||
              headingText.includes("العمل في ألمانيا") ||
              headingText.includes("أدوات التوظيف") ||
              headingText.includes("أدواتنا للعمل في ألمانيا") ||
              headingText.includes("أدوات احترافية") ||
              headingText.includes("الاستعداد للعمل في ألمانيا");

            if (isCtaSection) {
              return (
                <div
                  className="mt-10 mb-5 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-900/30 via-slate-900/70 to-emerald-900/30 border border-blue-500/30 dark:border-blue-800/60 shadow-md text-right"
                  dir="rtl"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-600 text-white flex items-center justify-center text-xl shrink-0 shadow-sm select-none">
                      🚀
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
                      {children}
                    </h3>
                  </div>
                </div>
              );
            }

            return (
              <h3
                className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-4 leading-snug flex items-center gap-2 text-right"
                dir="rtl"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
                <span>{children}</span>
              </h3>
            );
          },
          h4: ({ children }) => (
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-6 mb-3 text-right" dir="rtl">
              {children}
            </h4>
          ),
          p: ({ children }) => {
            const rawContent = getNodeText(children);
            const trimmed = rawContent.trim();

            // 1. Check for CTA Cards / Links in Paragraph
            if (hasLink(children)) {
              const extracted = extractLinks(children);
              const toolLinks = extracted.filter((l) => getToolMetadata(l.href, l.text).isTool);

              // If paragraph contains tool links, render them as Enterprise CTA cards
              if (toolLinks.length > 0) {
                return (
                  <div className="my-5 space-y-3">
                    {toolLinks.map((tl, tIdx) => {
                      const meta = getToolMetadata(tl.href, tl.text);
                      return (
                        <EnterpriseCtaCard
                          key={`p-tool-${tIdx}`}
                          {...meta}
                          href={tl.href}
                          title={tl.text || meta.title}
                          locale={locale}
                          isAr={isAr}
                        />
                      );
                    })}
                  </div>
                );
              }
            }

            // 2. Check for Grammar Rule Block
            const grammar = parseGrammarRule(rawContent);
            if (grammar) {
              return renderGrammarCard(grammar);
            }

            // 3. Check for Exercise Section Title (e.g. "تمارين")
            if (trimmed === "تمارين" || trimmed === "تمارين وتطبيقات" || trimmed === "التمارين") {
              return (
                <div className="mt-10 mb-4 pt-4 border-t border-slate-200 dark:border-slate-800" dir="rtl">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-blue-600/15 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-300/40 dark:border-blue-800/50 flex items-center justify-center text-lg shrink-0">
                      📝
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white text-right">
                      {trimmed}
                    </h3>
                  </div>
                </div>
              );
            }

            // 4. Check for Exercise Instruction Prompt (e.g. "التمرين الأول: اختر الضمير أو الفعل الصحيح...")
            const exercisePrompt = parseExercisePrompt(rawContent);
            if (exercisePrompt) {
              return (
                <div
                  className="mt-6 mb-3 p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 flex flex-wrap items-center gap-2.5 shadow-2xs"
                  dir="rtl"
                >
                  <span className="px-3 py-1 rounded-xl bg-blue-600 text-white font-bold text-xs sm:text-sm shadow-2xs select-none shrink-0">
                    📝 {exercisePrompt.title}
                  </span>
                  {exercisePrompt.instruction && (
                    <span className="text-slate-800 dark:text-slate-200 font-semibold text-sm sm:text-base text-right leading-relaxed">
                      {exercisePrompt.instruction}
                    </span>
                  )}
                </div>
              );
            }

            // 5. Check for Alert Box
            const alert = parseAlertBox(rawContent);
            if (alert) {
              const borderClasses =
                alert.type === "warning"
                  ? "border-r-4 border-amber-500 bg-amber-50/80 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100"
                  : alert.type === "note"
                  ? "border-r-4 border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100"
                  : "border-r-4 border-blue-500 bg-blue-50/80 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100";

              return (
                <div
                  className={`my-6 p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xs border ${borderClasses} space-y-2 text-right`}
                  dir="rtl"
                >
                  <div className="flex items-center gap-2.5 font-bold text-base sm:text-lg text-right">
                    <span className="text-xl select-none">{alert.icon}</span>
                    <span>{alert.title}</span>
                  </div>
                  <div className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-200 text-right">
                    {renderInlineContent(alert.content)}
                  </div>
                </div>
              );
            }

            // 6. Check for Solution Block
            const solution = parseSolutionBlock(rawContent);
            if (solution) {
              return (
                <div className="my-8 p-5 sm:p-7 rounded-3xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-300/70 dark:border-emerald-800/60 shadow-sm space-y-4" dir="rtl">
                  {/* Solution Header (RTL Right-Aligned) */}
                  <div className="flex items-center gap-2.5 border-b border-emerald-200/60 dark:border-emerald-900/60 pb-3 text-right">
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-2xs select-none">
                      🎯 {solution.header}
                    </span>
                  </div>

                  {/* Solution Content Lines */}
                  <div className="space-y-3 pt-1">
                    {solution.contentLines.map((line, idx) => {
                      const isGermanAnswer = /^[0-9\.\s]*[A-Za-zäöüÄÖÜß]/.test(line) && !line.includes("التمرين");
                      if (isGermanAnswer) {
                        return (
                          <div
                            key={`sol-line-${idx}`}
                            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-emerald-200/70 dark:border-emerald-900/60 shadow-2xs text-left"
                            dir="ltr"
                          >
                            <span className="font-bold text-slate-900 dark:text-white text-base sm:text-lg font-sans tracking-wide">
                              {line}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`sol-line-${idx}`}
                          className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-emerald-200/50 dark:border-emerald-900/40 text-slate-800 dark:text-slate-200 text-sm sm:text-base font-semibold text-right leading-relaxed"
                          dir="rtl"
                        >
                          {line}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // 7. Check for Dialogues (Multi-turn or single turn)
            const dialogueTurns = parseDialogues(rawContent);
            if (dialogueTurns && dialogueTurns.length > 0) {
              return (
                <div className="space-y-3.5 my-4">
                  {dialogueTurns.map((turn, idx) => (
                    <DialogueCard key={`dialogue-turn-${idx}`} {...turn} />
                  ))}
                </div>
              );
            }

            // 8. Check for Vocabulary Block (single-line or multi-line vocabulary phrases / trio)
            const vocabItems = parseVocabularyBlock(rawContent);
            if (vocabItems && vocabItems.length > 0) {
              return (
                <div className="space-y-3 my-4">
                  {vocabItems.map((vItem, vIdx) => (
                    <VocabularyCard key={`p-vocab-${vIdx}`} {...vItem} />
                  ))}
                </div>
              );
            }

            // Pure German paragraph (no Arabic, latin-only)
            const hasArabic = /[\u0600-\u06FF]/.test(rawContent);
            const isPureGermanParagraph = !hasArabic && /^[A-Za-zäöüÄÖÜß0-9\s\-.,?!…/():;]+$/.test(trimmed);
            if (isPureGermanParagraph) {
              return (
                <div
                  dir="ltr"
                  className="text-left font-bold text-slate-900 dark:text-white text-base sm:text-lg font-sans tracking-wide p-3.5 my-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800"
                >
                  {children}
                </div>
              );
            }

            // Standalone phonetic line fallback
            if (trimmed.startsWith("النطق:") || trimmed.startsWith("🗣️")) {
              const cleanPh = stripBrackets(trimmed.replace(/^(النطق:|🗣️)\s*/, ""));
              if (cleanPh) {
                return (
                  <div dir="rtl" className="my-2 text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 font-semibold text-xs sm:text-sm shadow-2xs shrink-0 select-none">
                      <span className="text-xs text-amber-600 dark:text-amber-400 select-none">🔊</span>
                      <span>{cleanPh}</span>
                    </span>
                  </div>
                );
              }
            }

            // Standalone translation line fallback
            if (trimmed.startsWith("الترجمة:") || trimmed.startsWith("💬")) {
              const cleanTr = trimmed.replace(/^(الترجمة:|💬)\s*/, "").trim();
              if (cleanTr) {
                return (
                  <div dir="rtl" className="my-2 text-right text-slate-700 dark:text-slate-200 text-sm sm:text-base font-normal leading-relaxed">
                    {cleanTr}
                  </div>
                );
              }
            }

            return (
              <p
                className="text-base sm:text-lg lg:text-xl text-slate-700 dark:text-slate-300 leading-relaxed sm:leading-loose mb-6 font-normal text-right"
                dir={isAr ? "rtl" : "ltr"}
              >
                {renderInlineContent(children)}
              </p>
            );
          },
          ul: ({ children }) => (
            <ul className="space-y-3 my-6 list-none p-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-3 my-4 list-none p-0">
              {children}
            </ol>
          ),
          li: ({ children }) => {
            const rawText = getNodeText(children);
            const clean = rawText.trim();

            // 1. Check if list item contains a Tool Link / CTA Card
            if (hasLink(children)) {
              const extracted = extractLinks(children);
              const toolLink = extracted.find((l) => getToolMetadata(l.href, l.text).isTool);

              if (toolLink) {
                const meta = getToolMetadata(toolLink.href, toolLink.text);
                // Check if there is extra description after the link in the bullet item
                let extraDesc = "";
                const colonIdx = clean.indexOf(":");
                if (colonIdx !== -1 && colonIdx < clean.length - 1) {
                  extraDesc = clean.substring(colonIdx + 1).trim();
                }

                return (
                  <li className="list-none my-3">
                    <EnterpriseCtaCard
                      {...meta}
                      href={toolLink.href}
                      title={toolLink.text || meta.title}
                      description={extraDesc || meta.description}
                      locale={locale}
                      isAr={isAr}
                    />
                  </li>
                );
              }

              // Generic list item containing non-tool links (keep link fully interactive)
              return (
                <li
                  className="text-base sm:text-lg lg:text-xl text-slate-700 dark:text-slate-300 leading-relaxed my-2 text-right list-none"
                  dir={isAr ? "rtl" : "ltr"}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-2.5 shrink-0" />
                    <div className="flex-1 select-text">
                      {renderInlineContent(children)}
                    </div>
                  </div>
                </li>
              );
            }

            // 2. Check for Grammar Rule in list item
            const grammar = parseGrammarRule(clean);
            if (grammar) {
              return <li className="list-none my-4">{renderGrammarCard(grammar)}</li>;
            }

            // 3. Check for Dialogue Turn in list item
            const dialogueTurns = parseDialogues(clean);
            if (dialogueTurns && dialogueTurns.length > 0) {
              return (
                <li className="list-none my-3">
                  {dialogueTurns.map((turn, idx) => (
                    <DialogueCard key={`li-dialogue-${idx}`} {...turn} />
                  ))}
                </li>
              );
            }

            const parsed = parseBulletItem(clean);

            // 4. Vocabulary Card for vocabulary / phrase item in list
            if (parsed.type === "vocab") {
              return (
                <li className="list-none my-3">
                  <VocabularyCard {...parsed.data} />
                </li>
              );
            }

            // 5. Check for German Exercise Question / Sentence
            const hasLatin = /[A-Za-zäöüÄÖÜß]/.test(clean);
            const hasArabic = /[\u0600-\u06FF]/.test(clean);
            const isPureGermanOrExercise =
              hasLatin &&
              !hasArabic &&
              !clean.includes("صوت") &&
              !clean.includes("حرف") &&
              !clean.includes("ملاحظة") &&
              !clean.includes("قاعدة");

            if (isPureGermanOrExercise) {
              return (
                <li className="list-none my-2.5">
                  <div
                    dir="ltr"
                    className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/85 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-blue-400 dark:hover:border-blue-800/70 transition-all text-left"
                  >
                    <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center font-mono font-bold text-xs sm:text-sm shrink-0 select-none">
                      •
                    </span>
                    <span className="text-left font-bold text-slate-900 dark:text-white text-base sm:text-lg font-sans tracking-wide select-text">
                      {clean}
                    </span>
                  </div>
                </li>
              );
            }

            // Generic Bullet Item (Arabic notes/explanations)
            return (
              <li
                className="text-base sm:text-lg lg:text-xl text-slate-700 dark:text-slate-300 leading-relaxed my-2 text-right"
                dir="rtl"
              >
                {renderInlineContent(children)}
              </li>
            );
          },
          blockquote: ({ children }) => (
            <blockquote
              className={`${
                isAr ? "border-r-4 rounded-l-2xl text-right" : "border-l-4 rounded-r-2xl text-left"
              } border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 text-slate-700 dark:text-slate-300 p-6 my-8 shadow-2xs text-base sm:text-lg leading-relaxed`}
              dir={isAr ? "rtl" : "ltr"}
            >
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => {
            const resolvedHref = resolveHref(href || "", locale);
            const isInternal =
              !resolvedHref.startsWith("http://") &&
              !resolvedHref.startsWith("https://") &&
              !resolvedHref.startsWith("mailto:");

            const linkClass =
              "inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 underline underline-offset-4 decoration-blue-500/50 hover:decoration-blue-500 hover:text-blue-500 dark:hover:text-blue-300 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer select-text";

            if (isInternal) {
              return (
                <Link href={resolvedHref} className={linkClass}>
                  <span>{children}</span>
                  <span className="text-xs opacity-75 select-none">↗</span>
                </Link>
              );
            }

            return (
              <a
                href={resolvedHref}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <span>{children}</span>
                <span className="text-xs opacity-75 select-none">↗</span>
              </a>
            );
          },
          code: ({ children }) => (
            <code className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 py-1 rounded-md text-sm font-mono dir-ltr inline-block text-left" dir="ltr">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-slate-900 text-slate-100 p-5 rounded-2xl overflow-x-auto my-8 text-left dir-ltr border border-slate-800 shadow-md" dir="ltr">
              {children}
            </pre>
          ),
          hr: () => <hr className="my-12 border-slate-200 dark:border-slate-800" />,
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
