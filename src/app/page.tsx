import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import PostCard from "@/components/ui/PostCard";

// Force dynamic rendering so database updates are instantly reflected
export const revalidate = 0;

/**
 * Extracts a clean plain-text summary (first 160 characters) from markdown content for PostCard excerpts.
 */
function extractExcerpt(markdownText: string | null | undefined): string {
  if (!markdownText) return "";
  return markdownText
    .replace(/^[\s\uFEFF]*#[ \t]+[^\r\n]+(\r?\n)*/, "") // remove top h1 heading
    .replace(/#+\s?/g, "")
    .replace(/[*_`~>#-]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 160);
}

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 relative font-sans flex flex-col justify-between">
      {/* Sticky Glassmorphic Navbar */}
      <Navbar locale="ar" />

      {/* Background Visual Gradient & Grid Effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[600px] w-[1200px] -translate-x-1/2 bg-[radial-gradient(100%_100%_at_top_center,rgba(59,130,246,0.1),transparent)] dark:bg-[radial-gradient(100%_100%_at_top_center,rgba(59,130,246,0.18),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.03] dark:opacity-[0.07]" />
      </div>

      {/* Main Wide Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Redesigned Hero Section */}
        <section className="mb-20 text-center sm:text-right border-b border-slate-200/80 dark:border-slate-800/80 pb-16 pt-8 space-y-6">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <span className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-4 py-1.5 rounded-full text-sm font-semibold backdrop-blur-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://flagcdn.com/w20/de.png"
                alt="Germany"
                className="w-5 h-3.5 rounded-xs object-cover"
              />
              المنصة الأولى للوظائف والعيش في ألمانيا
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              بوابتك للعمل والاستقرار في ألمانيا
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://flagcdn.com/w40/de.png"
              alt="Germany Flag"
              className="inline-block w-10 h-7 rounded shadow-xs align-middle border border-slate-200/50 dark:border-slate-700/50"
            />
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            دليلك الشامل والمحدّث يومياً لأحدث الوظائف الشاغرة، فرص التدريب المهني (Ausbildung)، وإرشادات التأشيرة.
          </p>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4">
            <Link
              href="/ar/blog"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-blue-500/20 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <span>تصفح الوظائف</span>
              <svg
                className="w-5 h-5 transform rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>

            <Link
              href="/ar/blog"
              className="px-6 py-4 rounded-xl font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <span>عن المنصة</span>
            </Link>
          </div>
        </section>

        {/* Section Header */}
        <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <span>🔥 أحدث الفرص والوظائف</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              فرص عمل حقيقية وتدريب مهني محدث باستمرار في ألمانيا
            </p>
          </div>
          <Link
            href="/ar/blog"
            className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>جميع المقالات والفرص</span>
            <svg
              className="w-4 h-4 transform rotate-180"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        {/* Posts 3-Column Responsive Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-24 bg-white/50 dark:bg-slate-900/30 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
            <svg
              className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
              لا توجد مقالات أو وظائف حالياً
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              يرجى إضافة مقالات أو وظائف في قاعدة البيانات لتظهر هنا.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => {
              const formattedDate = new Date(post.createdAt).toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });

              return (
                <PostCard
                  key={post.id}
                  title={post.title}
                  excerpt={extractExcerpt(post.markdown_content)}
                  category={post.category}
                  date={formattedDate}
                  slug={post.slug}
                  locale="ar"
                  imageUrl={post.image_url}
                  readMoreText="اقرأ المزيد ←"
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Sleek Footer */}
      <Footer locale="ar" />
    </div>
  );
}
