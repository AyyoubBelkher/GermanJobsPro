"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { isGermanA1Category, parseLessonTitle, calculateReadTime } from "@/lib/courseUtils";

export interface PostCardProps {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  slug?: string;
  locale?: string;
  imageUrl?: string | null;
  image_url?: string | null;
  cover_image?: string | null;
  readMoreText?: string;
  href?: string;
  lessonNumber?: number | null;
  germanTitle?: string | null;
  arabicSubtitle?: string | null;
  readTime?: string | null;
}

const DEFAULT_UNSPLASH_IMAGE =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80";

export default function PostCard({
  title,
  excerpt,
  category,
  date,
  slug,
  locale = "ar",
  imageUrl,
  image_url,
  cover_image,
  readMoreText,
  href,
  lessonNumber: propLessonNumber,
  germanTitle: propGermanTitle,
  arabicSubtitle: propArabicSubtitle,
  readTime: propReadTime,
}: PostCardProps) {
  const [imgError, setImgError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const isArabicLocale = locale === "ar";
  const isA1 = isGermanA1Category(category);

  // If A1, extract structured lesson details
  const parsedLesson = isA1 ? parseLessonTitle(title) : null;
  const lessonNum = propLessonNumber ?? parsedLesson?.lessonNumber;
  const germanTitle = propGermanTitle ?? parsedLesson?.germanTitle;
  const arabicSubtitle = propArabicSubtitle ?? parsedLesson?.arabicSubtitle;

  // Formulate localized Lesson Badge for A1
  const lessonBadgeText = isA1
    ? isArabicLocale
      ? `🇩🇪 الدرس ${lessonNum || "•"} • A1`
      : locale === "de"
      ? `🇩🇪 Lektion ${lessonNum || "•"} • A1`
      : locale === "fr"
      ? `🇩🇪 Leçon ${lessonNum || "•"} • A1`
      : `🇩🇪 Lesson ${lessonNum || "•"} • A1`
    : category;

  // Formulate read time badge for A1
  const estimatedReadTime = propReadTime || calculateReadTime(excerpt, locale);

  // Fallback read more text
  const defaultCta = isA1
    ? isArabicLocale
      ? "ابدأ الدرس ←"
      : locale === "de"
      ? "Lektion starten →"
      : "Start Lesson →"
    : isArabicLocale
    ? "اقرأ المزيد ←"
    : "Read More →";
  const actionText = readMoreText || defaultCta;

  // Inspect image source
  const rawImage = imageUrl || image_url || cover_image;
  const hasValidRawImage = Boolean(
    rawImage && typeof rawImage === "string" && rawImage.trim().length > 0
  );

  // Determine if dynamic CSS Cover should be displayed for A1
  const shouldRenderA1Cover = isA1 && (!hasValidRawImage || imgError);

  // Catch image load failure that might have occurred prior to client hydration
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth === 0) {
        setImgError(true);
      }
    }
  }, [hasValidRawImage, rawImage]);

  // Final image URL (with fallback for regular blog posts if missing or errored)
  const finalImageUrl =
    hasValidRawImage && !imgError ? rawImage!.trim() : DEFAULT_UNSPLASH_IMAGE;

  // Construct target link cleanly using encoded slug to prevent 404s
  const targetHref = href
    ? href
    : slug
    ? `/${locale}/blog/${encodeURIComponent(slug)}`
    : "#";

  return (
    <Link href={targetHref} className="block h-full group">
      <article
        className="flex flex-col h-full bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/50 dark:hover:border-blue-500/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer"
        dir={isArabicLocale ? "rtl" : "ltr"}
      >
        {/* Consistent Aspect-Ratio Image / CSS Placeholder Container */}
        <div className="w-full aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0 border-b border-slate-200/80 dark:border-slate-800/80">
          {shouldRenderA1Cover ? (
            /* Dynamic Branded CSS Cover for German A1 Lessons without Image or upon Image Error */
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-950/60 to-slate-900 flex flex-col items-center justify-center p-6 text-center relative group-hover:scale-[1.02] transition-transform duration-500 select-none">
              {/* Subtle Tech Blueprint Grid Overlay */}
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-radial from-blue-500/10 via-transparent to-transparent pointer-events-none"
              />

              {/* Centered Badge / Icon: 🇩🇪 A1 • Lektion [X] */}
              <span className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 font-bold text-xs shadow-inner backdrop-blur-md mb-2 tracking-wide">
                🇩🇪 A1 • Lektion {lessonNum || "•"}
              </span>

              {/* Prominent German Lesson Title */}
              <h4
                dir="ltr"
                className="relative z-10 text-base sm:text-lg font-black text-white text-center leading-snug line-clamp-2 px-3 font-sans tracking-tight group-hover:text-blue-300 transition-colors"
              >
                {germanTitle || title}
              </h4>

              {/* Arabic Subtitle if available */}
              {arabicSubtitle && (
                <p
                  dir="rtl"
                  className="relative z-10 text-xs font-semibold text-blue-300/80 text-center line-clamp-1 px-3 mt-1"
                >
                  {arabicSubtitle}
                </p>
              )}
            </div>
          ) : (
            /* Image Cover with Category / Lesson Badge Overlay */
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={finalImageUrl}
                alt={isA1 ? "" : title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Badge overlay on top of cover image */}
              {isA1 ? (
                <span className="absolute top-4 start-4 text-xs font-black px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white backdrop-blur-md border border-blue-400/40 shadow-lg shadow-blue-900/40 flex items-center gap-1.5 tracking-tight">
                  {lessonBadgeText}
                </span>
              ) : (
                <span className="absolute top-4 start-4 text-xs font-semibold px-3 py-1 rounded-full bg-slate-900/80 text-white backdrop-blur-sm border border-slate-700/50">
                  {category}
                </span>
              )}
            </>
          )}
        </div>

        {/* Card Content */}
        <div className="flex-1 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Header Meta: Evergreen Read-Time for A1 vs Published Date for standard posts */}
            {isA1 ? (
              <div className="flex items-center text-xs font-semibold text-blue-500 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 px-2.5 py-1 rounded-lg w-fit">
                <span>{estimatedReadTime}</span>
              </div>
            ) : (
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                <svg
                  className="w-3.5 h-3.5 me-1.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                  />
                </svg>
                <span>{date}</span>
              </div>
            )}

            {/* Title Section */}
            {isA1 && germanTitle ? (
              <div className="space-y-1 text-start">
                {/* German Title */}
                <h3
                  dir="ltr"
                  className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 leading-snug font-sans tracking-tight line-clamp-2"
                >
                  {germanTitle}
                </h3>

                {/* Arabic Subtitle */}
                {arabicSubtitle ? (
                  <p
                    dir="rtl"
                    className="text-sm font-bold text-blue-600 dark:text-sky-300 leading-snug line-clamp-2"
                  >
                    {arabicSubtitle}
                  </p>
                ) : null}
              </div>
            ) : (
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-2 text-start">
                {title}
              </h3>
            )}

            {/* Excerpt */}
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed text-start">
              {excerpt}
            </p>
          </div>

          {/* Action Link Indicator */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span className="inline-flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors gap-1.5">
              <span>{actionText}</span>
            </span>
            {isA1 && (
              <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md">
                A1 CEFR
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
