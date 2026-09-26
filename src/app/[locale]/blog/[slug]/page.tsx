import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import SocialShare from "@/components/ui/SocialShare";
import AdminBar from "@/components/admin/AdminBar";
import NewsletterForm from "@/components/NewsletterForm";
import LessonContentRenderer from "@/components/blog/LessonContentRenderer";
import CommentSection, { CommentItem } from "@/components/blog/CommentSection";
import { verifySessionToken } from "@/lib/session";
import {
  isGermanA1Category,
  parseLessonTitle,
  calculateReadTime,
} from "@/lib/courseUtils";

export const revalidate = 60;

/**
 * Safely decodes a URI component without throwing URIError on malformed strings.
 */
function safeDecodeURIComponent(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

/**
 * Strips the first `# Heading` (H1) from markdown content if present at the beginning of the text,
 * preventing duplicate main title rendering.
 */
function stripLeadingH1(content: string | null | undefined): string {
  if (!content) return "";
  return content.replace(/^[\s\uFEFF]*#[ \t]+[^\r\n]+(\r?\n)*/, "");
}

/**
 * Extracts plain text summary (first 150 characters) from markdown content for SEO description.
 */
function extractDescription(markdownText: string | null | undefined): string {
  if (!markdownText) return "";
  const plainText = markdownText
    .replace(/#+\s?/g, "")
    .replace(/[*_`~>#-]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return plainText.substring(0, 150);
}

/**
 * Helper to fetch a post safely by decoded or raw slug.
 */
async function fetchPostBySlug(rawSlug: string) {
  const decoded = safeDecodeURIComponent(rawSlug);

  try {
    let post = await prisma.post.findFirst({
      where: { slug: decoded, published: true },
    });

    if (!post && rawSlug !== decoded) {
      post = await prisma.post.findFirst({
        where: { slug: rawSlug, published: true },
      });
    }

    // Secondary fallback: normalized trim
    if (!post) {
      post = await prisma.post.findFirst({
        where: {
          OR: [
            { slug: decoded.trim(), published: true },
            { slug: rawSlug.trim(), published: true },
          ],
        },
      });
    }

    return post;
  } catch (err) {
    console.error("[fetchPostBySlug] DB Query Error:", err);
    return null;
  }
}

/**
 * Resolves the author name dynamically based on whether the post was generated
 * by AI or written by editorial staff, localized per page locale.
 */
function getAuthorName(generatedByAi: boolean, locale: string): string {
  const isAr = locale === "ar";
  if (generatedByAi) {
    return isAr ? "فريق GermanJobsPro" : "GermanJobsPro Team";
  }
  return isAr ? "إدارة التحرير" : "Editorial Team";
}

/**
 * Dynamic SEO metadata generation for Next.js App Router.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug, locale } = await params;
  const post = await fetchPostBySlug(rawSlug);

  if (!post) {
    return {
      title: locale === "ar" ? "المقالة غير موجودة" : "Post Not Found",
      description: "The requested blog post could not be found.",
    };
  }

  const isA1 = isGermanA1Category(post.category);
  const parsedLesson = isA1 ? parseLessonTitle(post.title, post.markdown_content) : null;
  const title = parsedLesson?.fullTitle || post.title;
  const description = extractDescription(post.markdown_content);
  const images = post.image_url ? [post.image_url] : [];
  const authorName = getAuthorName(Boolean(post.generated_by_ai), locale);

  return {
    title: `${title} | GermanJobsPro`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      authors: [authorName],
      tags: [post.category],
      images: images.length > 0 ? images : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.length > 0 ? images : undefined,
    },
  };
}

/**
 * Async Server Component representing the single post page / course lesson view.
 */
export default async function SinglePostPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug: rawSlug, locale } = await params;
  const post = await fetchPostBySlug(rawSlug);

  if (!post) {
    notFound();
  }

  // Check admin session cookie safely inside try/catch
  let isAdmin = false;
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    if (adminSession) {
      isAdmin = await verifySessionToken(adminSession);
    }
  } catch {
    isAdmin = false;
  }

  const isA1 = isGermanA1Category(post.category);
  const currentLessonParsed = isA1 ? parseLessonTitle(post.title, post.markdown_content) : null;
  const readTime = calculateReadTime(post.markdown_content, locale);

  // Linear Stepper Navigation state for German A1 Course
  let prevLesson: {
    slug: string;
    title: string;
    lessonNumber: number;
    germanTitle: string;
    arabicSubtitle: string;
  } | null = null;

  let nextLesson: {
    slug: string;
    title: string;
    lessonNumber: number;
    germanTitle: string;
    arabicSubtitle: string;
  } | null = null;

  let totalCourseLessons = 0;

  if (isA1) {
    try {
      const allA1Posts = await prisma.post.findMany({
        where: {
          published: true,
          OR: [
            { category: { equals: "German A1", mode: "insensitive" } },
            { category: { contains: "A1", mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          slug: true,
          title: true,
          markdown_content: true,
        },
      });

      totalCourseLessons = allA1Posts.length;

      const parsedA1List = allA1Posts
        .map((p) => {
          const parsed = parseLessonTitle(p.title, p.markdown_content);
          return {
            id: p.id,
            slug: p.slug,
            fullTitle: parsed.fullTitle,
            lessonNumber: parsed.lessonNumber ?? 9999,
            germanTitle: parsed.germanTitle,
            arabicSubtitle: parsed.arabicSubtitle,
          };
        })
        .sort((a, b) => a.lessonNumber - b.lessonNumber);

      const currentIndex = parsedA1List.findIndex(
        (p) => p.id === post.id || p.slug === post.slug || p.slug === rawSlug
      );

      if (currentIndex !== -1) {
        if (currentIndex > 0) {
          const prev = parsedA1List[currentIndex - 1];
          prevLesson = {
            slug: prev.slug,
            title: prev.fullTitle,
            lessonNumber: prev.lessonNumber,
            germanTitle: prev.germanTitle,
            arabicSubtitle: prev.arabicSubtitle,
          };
        }
        if (currentIndex < parsedA1List.length - 1) {
          const next = parsedA1List[currentIndex + 1];
          nextLesson = {
            slug: next.slug,
            title: next.fullTitle,
            lessonNumber: next.lessonNumber,
            germanTitle: next.germanTitle,
            arabicSubtitle: next.arabicSubtitle,
          };
        }
      }
    } catch (err) {
      console.error("[SinglePostPage] A1 sequence query error:", err);
    }
  }

  // Fetch comments safely
  let comments: CommentItem[] = [];
  try {
    const rawComments = await prisma.comment.findMany({
      where: { postId: post.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        content: true,
        createdAt: true,
      },
    });

    comments = rawComments.map((c) => ({
      id: c.id,
      name: c.name,
      content: c.content,
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
    }));
  } catch (err) {
    console.error("[SinglePostPage] Comments fetch error:", err);
    comments = [];
  }

  // Fetch 3 related published posts safely
  let relatedPosts: typeof post[] = [];
  try {
    if (isA1) {
      relatedPosts = await prisma.post.findMany({
        where: {
          id: { not: post.id },
          published: true,
          OR: [
            { category: { equals: "German A1", mode: "insensitive" } },
            { category: { contains: "A1", mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      });
    } else {
      relatedPosts = await prisma.post.findMany({
        where: {
          id: { not: post.id },
          published: true,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      });
    }
  } catch (err) {
    console.error("[SinglePostPage] Related posts fetch error:", err);
    relatedPosts = [];
  }

  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  // Localized static strings
  const labels: Record<
    string,
    {
      backToBlog: string;
      authorLabel: string;
      publishedLabel: string;
      minutesRead: string;
      relatedPosts: string;
      viewAllPosts: string;
      readArticle: string;
      applyLinkTitle: string;
      applyLinkDesc: string;
      applyButton: string;
      a1CourseIndex: string;
      a1CourseTitle: string;
      blogRoot: string;
      prevLesson: string;
      nextLesson: string;
      firstLessonAlert: string;
      completedAllLessons: string;
      lessonWord: string;
    }
  > = {
    ar: {
      backToBlog: "← العودة إلى المدونة",
      authorLabel: "الكاتب:",
      publishedLabel: "تاريخ النشر:",
      minutesRead: "قراءة ٥ دقائق",
      relatedPosts: isA1 ? "دروس أخرى من مسار A1" : "مقالات ذات صلة",
      viewAllPosts: isA1 ? "فهرس دروس A1 ←" : "عرض جميع المقالات ←",
      readArticle: isA1 ? "ابدأ الدرس ←" : "اقرأ المقال ←",
      applyLinkTitle: "رابط التقديم على الوظيفة",
      applyLinkDesc: "اضغط على الزر أدناه للانتقال المباشر إلى صفحة التقديم الرسمية.",
      applyButton: "التقديم الآن 🚀",
      a1CourseIndex: "فهرس دروس A1",
      a1CourseTitle: "مسار تعلم اللغة الألمانية A1",
      blogRoot: "المدونة",
      prevLesson: "← الدرس السابق",
      nextLesson: "الدرس التالي →",
      firstLessonAlert: "أنت في الدرس الأول من المسار 🌟",
      completedAllLessons: "🎉 أكملت جميع الدروس المتاحة في هذا المسار!",
      lessonWord: "الدرس",
    },
    en: {
      backToBlog: "← Back to Blog",
      authorLabel: "Author:",
      publishedLabel: "Published:",
      minutesRead: "5 min read",
      relatedPosts: isA1 ? "Other Lessons from A1 Track" : "Related Articles",
      viewAllPosts: isA1 ? "A1 Course Index →" : "View all articles →",
      readArticle: isA1 ? "Start Lesson →" : "Read Article →",
      applyLinkTitle: "Job Application Link",
      applyLinkDesc: "Click the button below to go directly to the official application page.",
      applyButton: "Apply Now 🚀",
      a1CourseIndex: "A1 Course Index",
      a1CourseTitle: "German A1 Course",
      blogRoot: "Blog",
      prevLesson: "← Previous Lesson",
      nextLesson: "Next Lesson →",
      firstLessonAlert: "You are at the first lesson 🌟",
      completedAllLessons: "🎉 You have reached the latest lesson in this track!",
      lessonWord: "Lesson",
    },
    de: {
      backToBlog: "← Zurück zum Blog",
      authorLabel: "Autor:",
      publishedLabel: "Veröffentlicht:",
      minutesRead: "5 Min. Lesezeit",
      relatedPosts: isA1 ? "Weitere Lektionen aus Kurs A1" : "Ähnliche Artikel",
      viewAllPosts: isA1 ? "A1 Kursübersicht →" : "Alle Artikel anzeigen →",
      readArticle: isA1 ? "Lektion starten →" : "Artikel lesen →",
      applyLinkTitle: "Bewerbungslink zur Stelle",
      applyLinkDesc: "Klicken Sie auf den Button, um direkt zur offiziellen Bewerbungsseite zu gelangen.",
      applyButton: "Jetzt bewerben 🚀",
      a1CourseIndex: "A1 Kursübersicht",
      a1CourseTitle: "Deutsch A1 Lernpfad",
      blogRoot: "Blog",
      prevLesson: "← Vorherige Lektion",
      nextLesson: "Nächste Lektion →",
      firstLessonAlert: "Sie sind bei der ersten Lektion 🌟",
      completedAllLessons: "🎉 Sie haben die letzte verfügbare Lektion erreicht!",
      lessonWord: "Lektion",
    },
    fr: {
      backToBlog: "← Retour au blog",
      authorLabel: "Auteur :",
      publishedLabel: "Publié le :",
      minutesRead: "5 min de lecture",
      relatedPosts: isA1 ? "Autres leçons du cours A1" : "Articles connexes",
      viewAllPosts: isA1 ? "Index du cours A1 →" : "Voir tous les articles →",
      readArticle: isA1 ? "Commencer la leçon →" : "Lire l'article →",
      applyLinkTitle: "Lien de candidature à l'emploi",
      applyLinkDesc: "Cliquez sur le bouton ci-dessous pour accéder directement à la page de candidature officielle.",
      applyButton: "Postuler maintenant 🚀",
      a1CourseIndex: "Index des leçons A1",
      a1CourseTitle: "Cours d'allemand A1",
      blogRoot: "Blog",
      prevLesson: "← Leçon précédente",
      nextLesson: "Leçon suivante →",
      firstLessonAlert: "Vous êtes à la première leçon 🌟",
      completedAllLessons: "🎉 Vous êtes à la dernière leçon disponible !",
      lessonWord: "Leçon",
    },
  };

  const ui = labels[locale] || labels.en;

  const formattedDate = new Date(post.createdAt).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const author = getAuthorName(Boolean(post.generated_by_ai), locale);

  return (
    <div dir={dir} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 py-16 px-4 sm:px-6 lg:px-8">
      {/* Invisible Admin Controls - Rendered ONLY if admin_session cookie is active */}
      {isAdmin && <AdminBar post={post} locale={locale} />}

      <article dir={dir} className={`max-w-4xl mx-auto space-y-8 ${isAr ? "text-right" : "text-left"}`}>
        
        {/* Navigation Breadcrumb / Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-slate-200 dark:border-slate-800/80 mb-6">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
            <Link href={`/${locale}/blog`} className="hover:text-blue-500 transition-colors">
              {ui.blogRoot}
            </Link>
            {isA1 ? (
              <>
                <span>/</span>
                <Link href={`/${locale}/blog?category=German+A1`} className="hover:text-blue-500 transition-colors flex items-center gap-1 text-slate-400">
                  <span>🇩🇪</span>
                  <span>{ui.a1CourseTitle}</span>
                </Link>
                <span>/</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {currentLessonParsed?.lessonNumber ? `${ui.lessonWord} ${currentLessonParsed.lessonNumber}` : post.title}
                </span>
              </>
            ) : (
              <>
                <span>/</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold line-clamp-1 max-w-[200px] sm:max-w-xs">
                  {post.title}
                </span>
              </>
            )}
          </div>

          {isA1 ? (
            <Link
              href={`/${locale}/blog?category=German+A1`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>📚</span>
              <span>{ui.a1CourseIndex}</span>
            </Link>
          ) : (
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors"
            >
              {ui.backToBlog}
            </Link>
          )}
        </div>

        {/* Post Metadata Header */}
        <header className={`space-y-4 ${isAr ? "text-right" : "text-left"}`}>
          <div className="flex items-center justify-start gap-3">
            {isA1 ? (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-blue-400/30 shadow-md">
                {isAr
                  ? `🇩🇪 الدرس ${currentLessonParsed?.lessonNumber || "•"} • A1`
                  : locale === "de"
                  ? `🇩🇪 Lektion ${currentLessonParsed?.lessonNumber || "•"} • A1`
                  : `🇩🇪 Lesson ${currentLessonParsed?.lessonNumber || "•"} • A1`}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
                {post.category}
              </span>
            )}

            <span className="flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 px-2.5 py-1 rounded-lg">
              {readTime}
            </span>
          </div>

          {/* Title Presentation: Clean separation for German A1 */}
          {isA1 && currentLessonParsed?.germanTitle ? (
            <div className="space-y-2 text-start">
              <h1
                dir="ltr"
                className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight font-sans"
              >
                {currentLessonParsed.germanTitle}
              </h1>
              {currentLessonParsed.arabicSubtitle && (
                <p
                  dir="rtl"
                  className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-sky-300 leading-snug"
                >
                  {currentLessonParsed.arabicSubtitle}
                </p>
              )}
            </div>
          ) : (
            <h1 dir="auto" className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight text-start">
              {currentLessonParsed?.fullTitle || post.title}
            </h1>
          )}

          {/* Meta Info Row */}
          <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400 pt-2 border-b border-slate-200 dark:border-slate-800/80 pb-6">
            <div>
              <span className="font-light">{ui.authorLabel} </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{author}</span>
            </div>
            
            {isA1 ? (
              <>
                <div className="hidden sm:inline">•</div>
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold text-xs sm:text-sm">
                  <span>🇩🇪</span>
                  <span>{isAr ? "منهاج معتمد Goethe-Zertifikat A1" : "CEFR A1 Standard"}</span>
                </div>
                {totalCourseLessons > 0 && (
                  <>
                    <div className="hidden sm:inline">•</div>
                    <div className="text-xs sm:text-sm font-medium">
                      <span>
                        {isAr
                          ? `الدرس ${currentLessonParsed?.lessonNumber || 1} من ${totalCourseLessons}`
                          : `Lesson ${currentLessonParsed?.lessonNumber || 1} of ${totalCourseLessons}`}
                      </span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="hidden sm:inline">•</div>
                <div>
                  <span className="font-light">{ui.publishedLabel} </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{formattedDate}</span>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Hero Image or Fallback SVG Banner */}
        {post.image_url ? (
          <div className="aspect-video w-full relative rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full object-cover rounded-3xl"
            />
          </div>
        ) : (
          <div className="aspect-video w-full relative rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-8 text-center text-white">
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:30px_30px]" />
              <div className="p-4 rounded-3xl bg-white/10 backdrop-blur-md mb-4 border border-white/20">
                <svg
                  className="w-12 h-12 text-blue-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582"
                  />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight max-w-xl">
                {isA1 ? `${ui.a1CourseTitle} • ${ui.lessonWord} ${currentLessonParsed?.lessonNumber || ""}` : post.category}
              </h2>
            </div>
          </div>
        )}

        {/* Enhanced Article Content Renderer (German A1 aware & general markdown) */}
        <div dir="auto" className="prose prose-slate dark:prose-invert prose-lg max-w-none leading-relaxed text-slate-800 dark:text-slate-200 text-start">
          <LessonContentRenderer
            content={stripLeadingH1(post.markdown_content)}
            category={post.category}
            locale={locale}
          />
        </div>

        {/* Linear Stepper Navigation for German A1 Course Track */}
        {isA1 && (
          <nav
            aria-label="A1 Course Navigation"
            className="my-12 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xl shrink-0">
                  🇩🇪
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {ui.a1CourseTitle}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAr
                      ? `الدرس ${currentLessonParsed?.lessonNumber || 1} من إجمالي ${totalCourseLessons} درساً`
                      : `Lesson ${currentLessonParsed?.lessonNumber || 1} of ${totalCourseLessons} lessons`}
                  </p>
                </div>
              </div>

              {/* Direct button to return to A1 Course Index */}
              <Link
                href={`/${locale}/blog?category=German+A1`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-blue-500/30 text-xs sm:text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                <span>📚</span>
                <span>{ui.a1CourseIndex}</span>
              </Link>
            </div>

            {/* Stepper Navigation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Previous Lesson */}
              {prevLesson ? (
                <Link
                  href={`/${locale}/blog/${encodeURIComponent(prevLesson.slug)}`}
                  className="group flex flex-col justify-between p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/90 hover:border-blue-500/40 transition-all shadow-md text-start"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-blue-400 transition-colors mb-2">
                    <span>{ui.prevLesson}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono text-slate-300">
                      {ui.lessonWord} {prevLesson.lessonNumber}
                    </span>
                  </div>
                  <p className="font-extrabold text-white group-hover:text-blue-300 text-sm sm:text-base line-clamp-1 transition-colors" dir="ltr">
                    {prevLesson.germanTitle || prevLesson.title}
                  </p>
                  {prevLesson.arabicSubtitle && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1" dir="rtl">
                      {prevLesson.arabicSubtitle}
                    </p>
                  )}
                </Link>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 text-slate-500 text-xs flex items-center justify-center font-bold">
                  <span>{ui.firstLessonAlert}</span>
                </div>
              )}

              {/* Next Lesson */}
              {nextLesson ? (
                <Link
                  href={`/${locale}/blog/${encodeURIComponent(nextLesson.slug)}`}
                  className="group flex flex-col justify-between p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/90 hover:border-blue-500/40 transition-all shadow-md text-start sm:text-end"
                >
                  <div className="flex items-center justify-start sm:justify-end gap-2 text-xs font-bold text-slate-400 group-hover:text-blue-400 transition-colors mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono text-slate-300">
                      {ui.lessonWord} {nextLesson.lessonNumber}
                    </span>
                    <span>{ui.nextLesson}</span>
                  </div>
                  <p className="font-extrabold text-white group-hover:text-blue-300 text-sm sm:text-base line-clamp-1 transition-colors" dir="ltr">
                    {nextLesson.germanTitle || nextLesson.title}
                  </p>
                  {nextLesson.arabicSubtitle && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1" dir="rtl">
                      {nextLesson.arabicSubtitle}
                    </p>
                  )}
                </Link>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 text-slate-500 text-xs flex items-center justify-center font-bold">
                  <span>{ui.completedAllLessons}</span>
                </div>
              )}
            </div>
          </nav>
        )}

        {/* High-Converting CTA Box (Jobs / Application) */}
        {post.source_link && (
          <div className="my-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-blue-500/30">
            <div className={`space-y-2 ${isAr ? "text-right" : "text-left"}`}>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {ui.applyLinkTitle}
              </h3>
              <p className="text-blue-100 text-sm sm:text-base">
                {ui.applyLinkDesc}
              </p>
            </div>
            <a
              href={post.source_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white text-blue-600 font-bold text-base hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              {ui.applyButton}
            </a>
          </div>
        )}

        {/* Viral Social Share Component */}
        <SocialShare title={currentLessonParsed?.fullTitle || post.title} locale={locale} />

        {/* Interactive Comment Section */}
        <CommentSection
          postId={post.id}
          initialComments={comments}
          locale={locale}
        />

        {/* Newsletter Subscription Section */}
        <NewsletterForm locale={locale} />

        {/* Back Link / Course Index Return */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <Link
            href={isA1 ? `/${locale}/blog?category=German+A1` : `/${locale}/blog`}
            className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors"
          >
            {isA1 ? (isAr ? "← فهرس دروس A1" : "← A1 Course Index") : ui.backToBlog}
          </Link>
          {isA1 && (
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center text-xs text-slate-500 hover:text-slate-400 transition-colors"
            >
              {ui.backToBlog}
            </Link>
          )}
        </div>

        {/* Related Posts Section */}
        {relatedPosts.length > 0 && (
          <section className={`mt-16 pt-12 border-t border-slate-200 dark:border-slate-800/80 space-y-8 ${isAr ? "text-right" : "text-left"}`} dir={dir}>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {ui.relatedPosts}
              </h2>
              <Link
                href={isA1 ? `/${locale}/blog?category=German+A1` : `/${locale}/blog`}
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {ui.viewAllPosts}
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relPost) => {
                const relIsA1 = isGermanA1Category(relPost.category);
                const relParsed = relIsA1 ? parseLessonTitle(relPost.title, relPost.markdown_content) : null;
                const relTitle = relParsed?.fullTitle || relPost.title;

                return (
                  <div
                    key={relPost.id}
                    className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                      {relPost.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={relPost.image_url}
                          alt={relTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-600 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 text-white text-center">
                          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md mb-2 border border-white/20">
                            <svg
                              className="w-8 h-8 text-blue-200"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582"
                              />
                            </svg>
                          </div>
                          <span className="font-bold text-xs tracking-wider text-blue-100 uppercase">
                            {relIsA1 && relParsed?.lessonNumber ? `${ui.lessonWord} ${relParsed.lessonNumber}` : relPost.category}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          {relIsA1 && relParsed?.lessonNumber ? `🇩🇪 ${ui.lessonWord} ${relParsed.lessonNumber}` : relPost.category}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {relTitle}
                        </h3>
                      </div>

                      <Link
                        href={`/${locale}/blog/${encodeURIComponent(relPost.slug)}`}
                        className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {ui.readArticle}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
