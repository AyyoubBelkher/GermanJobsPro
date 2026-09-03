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

  const title = post.title;
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
 * Async Server Component representing the single post page.
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

  // Fetch 3 related recent published posts safely
  let relatedPosts: typeof post[] = [];
  try {
    relatedPosts = await prisma.post.findMany({
      where: {
        id: { not: post.id },
        published: true,
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
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
    }
  > = {
    ar: {
      backToBlog: "← العودة إلى المدونة",
      authorLabel: "الكاتب:",
      publishedLabel: "تاريخ النشر:",
      minutesRead: "قراءة ٥ دقائق",
      relatedPosts: "مقالات ذات صلة",
      viewAllPosts: "عرض جميع المقالات ←",
      readArticle: "اقرأ المقال ←",
      applyLinkTitle: "رابط التقديم على الوظيفة",
      applyLinkDesc: "اضغط على الزر أدناه للانتقال المباشر إلى صفحة التقديم الرسمية.",
      applyButton: "التقديم الآن 🚀",
    },
    en: {
      backToBlog: "← Back to Blog",
      authorLabel: "Author:",
      publishedLabel: "Published:",
      minutesRead: "5 min read",
      relatedPosts: "Related Articles",
      viewAllPosts: "View all articles →",
      readArticle: "Read Article →",
      applyLinkTitle: "Job Application Link",
      applyLinkDesc: "Click the button below to go directly to the official application page.",
      applyButton: "Apply Now 🚀",
    },
    de: {
      backToBlog: "← Zurück zum Blog",
      authorLabel: "Autor:",
      publishedLabel: "Veröffentlicht:",
      minutesRead: "5 Min. Lesezeit",
      relatedPosts: "Ähnliche Artikel",
      viewAllPosts: "Alle Artikel anzeigen →",
      readArticle: "Artikel lesen →",
      applyLinkTitle: "Bewerbungslink zur Stelle",
      applyLinkDesc: "Klicken Sie auf den Button, um direkt zur offiziellen Bewerbungsseite zu gelangen.",
      applyButton: "Jetzt bewerben 🚀",
    },
    fr: {
      backToBlog: "← Retour au blog",
      authorLabel: "Auteur :",
      publishedLabel: "Publié le :",
      minutesRead: "5 min de lecture",
      relatedPosts: "Articles connexes",
      viewAllPosts: "Voir tous les articles →",
      readArticle: "Lire l'article →",
      applyLinkTitle: "Lien de candidature à l'emploi",
      applyLinkDesc: "Cliquez sur le bouton ci-dessous pour accéder directement à la page de candidature officielle.",
      applyButton: "Postuler maintenant 🚀",
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
        
        {/* Navigation Header */}
        <div className="flex justify-start">
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors"
          >
            {ui.backToBlog}
          </Link>
        </div>

        {/* Post Metadata Header */}
        <header className={`space-y-4 ${isAr ? "text-right" : "text-left"}`}>
          <div className="flex items-center justify-start gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
              {post.category}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {ui.minutesRead}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400 pt-2 border-b border-slate-200 dark:border-slate-800/80 pb-6">
            <div>
              <span className="font-light">{ui.authorLabel} </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{author}</span>
            </div>
            <div className="hidden sm:inline">•</div>
            <div>
              <span className="font-light">{ui.publishedLabel} </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{formattedDate}</span>
            </div>
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
                {post.category}
              </h2>
            </div>
          </div>
        )}

        {/* Enhanced Article Content Renderer (German A1 aware & general markdown) */}
        <div className={`prose prose-slate dark:prose-invert prose-lg max-w-none leading-relaxed text-slate-800 dark:text-slate-200 ${isAr ? "text-right" : "text-left"}`}>
          <LessonContentRenderer
            content={stripLeadingH1(post.markdown_content)}
            category={post.category}
            locale={locale}
          />
        </div>

        {/* High-Converting CTA Box */}
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
        <SocialShare title={post.title} locale={locale} />

        {/* Interactive Comment Section */}
        <CommentSection
          postId={post.id}
          initialComments={comments}
          locale={locale}
        />

        {/* Newsletter Subscription Section */}
        <NewsletterForm locale={locale} />

        {/* Back Button */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80">
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors"
          >
            {ui.backToBlog}
          </Link>
        </div>

        {/* Related Posts Section */}
        {relatedPosts.length > 0 && (
          <section className={`mt-16 pt-12 border-t border-slate-200 dark:border-slate-800/80 space-y-8 ${isAr ? "text-right" : "text-left"}`} dir={dir}>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {ui.relatedPosts}
              </h2>
              <Link
                href={`/${locale}/blog`}
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {ui.viewAllPosts}
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relPost) => (
                <div
                  key={relPost.id}
                  className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                    {relPost.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={relPost.image_url}
                        alt={relPost.title}
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
                        <span className="font-bold text-xs tracking-wider text-blue-100 uppercase">{relPost.category}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        {relPost.category}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {relPost.title}
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
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
