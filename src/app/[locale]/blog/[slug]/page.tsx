import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import ReactMarkdown from "react-markdown";
import { prisma } from "@/lib/prisma";
import SocialShare from "@/components/ui/SocialShare";
import AdminBar from "@/components/admin/AdminBar";

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
 * Dynamic SEO metadata generation for Next.js 15 App Router.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug, locale } = await params;
  const slug = decodeURIComponent(rawSlug);

  let post = await prisma.post.findUnique({
    where: { slug },
  });

  if (!post && rawSlug !== slug) {
    post = await prisma.post.findUnique({
      where: { slug: rawSlug },
    });
  }

  if (!post) {
    return {
      title: locale === "ar" ? "المقالة غير موجودة" : "Post Not Found",
      description: "The requested blog post could not be found.",
    };
  }

  const title = post.title;
  const description = extractDescription(post.markdown_content);
  const images = post.image_url ? [post.image_url] : [];

  return {
    title: `${title} | GermanJobsPro`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      authors: [post.generated_by_ai ? "AI Assistant" : "Author"],
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
  const slug = decodeURIComponent(rawSlug);

  let post = await prisma.post.findUnique({
    where: { slug },
  });

  if (!post && rawSlug !== slug) {
    post = await prisma.post.findUnique({
      where: { slug: rawSlug },
    });
  }

  if (!post) {
    notFound();
  }

  // Check admin session cookie invisibly on the server
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session")?.value;
  const isAdmin = adminSession === "authenticated" || adminSession === "true";

  // Fetch 3 related recent posts (excluding current post)
  const relatedPosts = await prisma.post.findMany({
    where: {
      id: { not: post.id },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  // Localized static strings
  const labels: Record<
    string,
    { backToBlog: string; authorLabel: string; publishedLabel: string; minutesRead: string }
  > = {
    ar: {
      backToBlog: "← العودة إلى المدونة",
      authorLabel: "الكاتب:",
      publishedLabel: "تاريخ النشر:",
      minutesRead: "قراءة ٥ دقائق",
    },
    en: {
      backToBlog: "← Back to Blog",
      authorLabel: "Author:",
      publishedLabel: "Published:",
      minutesRead: "5 min read",
    },
    de: {
      backToBlog: "← Zurück zum Blog",
      authorLabel: "Autor:",
      publishedLabel: "Veröffentlicht:",
      minutesRead: "5 Min. Lesezeit",
    },
    fr: {
      backToBlog: "← Retour au blog",
      authorLabel: "Auteur:",
      publishedLabel: "Publié le:",
      minutesRead: "5 min de lecture",
    },
  };

  const ui = labels[locale] || labels.en;

  const formattedDate = new Date(post.createdAt).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const author = post.generated_by_ai ? "AI Assistant" : "Author";

  return (
    <div dir={dir} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 py-16 px-4 sm:px-6 lg:px-8">
      {/* Invisible Admin Controls - Rendered ONLY if admin_session cookie is active */}
      {isAdmin && <AdminBar post={post} locale={locale} />}

      <article dir="rtl" className="max-w-4xl mx-auto space-y-8 text-right">
        
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
        <header className="space-y-4 text-right">
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
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-900 to-slate-950 flex flex-col items-center justify-center p-8 text-center text-white">
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

        {/* Article content with high-contrast markdown typography styling */}
        <div className="prose prose-slate dark:prose-invert prose-lg max-w-none text-right leading-relaxed text-slate-800 dark:text-slate-200">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-slate-100 mt-12 mb-6 leading-tight text-right border-b border-slate-200 dark:border-slate-800 pb-4">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mt-10 mb-5 leading-snug text-right border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-4 leading-snug text-right">
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-6 mb-3 text-right">
                  {children}
                </h4>
              ),
              p: ({ children }) => (
                <p className="text-base sm:text-lg lg:text-xl text-slate-700 dark:text-slate-300 leading-relaxed sm:leading-loose mb-8 text-right font-normal">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-3 my-8 text-right text-slate-700 dark:text-slate-300 leading-relaxed pr-3">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-3 my-8 text-right text-slate-700 dark:text-slate-300 leading-relaxed pr-3">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-base sm:text-lg lg:text-xl text-slate-700 dark:text-slate-300 leading-relaxed sm:leading-loose">
                  {children}
                </li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-r-4 border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 text-slate-700 dark:text-slate-300 italic p-6 my-8 rounded-l-2xl text-right shadow-sm text-base sm:text-lg leading-relaxed">
                  {children}
                </blockquote>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-4 hover:text-blue-500 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              code: ({ children }) => (
                <code className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 py-1 rounded-md text-sm font-mono dir-ltr inline-block">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-slate-900 text-slate-100 p-5 rounded-2xl overflow-x-auto my-8 text-left dir-ltr border border-slate-800 shadow-md">
                  {children}
                </pre>
              ),
              hr: () => (
                <hr className="my-12 border-slate-200 dark:border-slate-800" />
              ),
            }}
          >
            {post.markdown_content}
          </ReactMarkdown>
        </div>

        {/* High-Converting CTA Box */}
        {post.source_link && (
          <div className="my-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-blue-500/30">
            <div className="space-y-2 text-right">
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                رابط التقديم على الوظيفة
              </h3>
              <p className="text-blue-100 text-sm sm:text-base">
                اضغط على الزر أدناه للانتقال المباشر إلى صفحة التقديم الرسمية.
              </p>
            </div>
            <a
              href={post.source_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white text-blue-600 font-bold text-base hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              التقديم الآن 🚀
            </a>
          </div>
        )}

        {/* Viral Social Share Component */}
        <SocialShare title={post.title} locale={locale} />

        {/* Back Button */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80">
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors"
          >
            {ui.backToBlog}
          </Link>
        </div>

        {/* Related Posts Section ("مقالات ذات صلة") */}
        {relatedPosts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800/80 space-y-8 text-right" dir="rtl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                مقالات ذات صلة
              </h2>
              <Link
                href={`/${locale}/blog`}
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                عرض جميع المقالات ←
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
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-900 to-slate-950 flex flex-col items-center justify-center p-4 text-white text-center">
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
                      اقرأ المقال ←
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
