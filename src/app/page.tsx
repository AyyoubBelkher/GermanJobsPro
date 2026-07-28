import React from "react";
import ReactMarkdown from "react-markdown";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

// Force dynamic rendering so database updates are instantly reflected
export const revalidate = 0;

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 relative">
      {/* Background Visual Effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 bg-[radial-gradient(100%_100%_at_top_center,rgba(59,130,246,0.08),transparent)] dark:bg-[radial-gradient(100%_100%_at_top_center,rgba(59,130,246,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.03] dark:opacity-[0.07]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Navigation & Header */}
        <header className="mb-16 text-center sm:text-left border-b border-slate-200/80 dark:border-slate-800/80 pb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                Database Live Feed
              </span>
            </div>
            {/* Link back to localization selector or direct blog index */}
            <Link
              href="/en/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Go to Multilingual Blog
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
            Insights & Automations
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            A premium, clean layout displaying all posts fetched directly from the database, rendered dynamically on every load.
          </p>
        </header>

        {/* Posts Feed */}
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
              No posts found
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Please trigger webhooks or create database entries to see your posts listed here.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {posts.map((post) => {
              const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });

              return (
                <article
                  key={post.id}
                  className="group relative bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-300 backdrop-blur-sm"
                >
                  {/* Hover visual accent */}
                  <div className="absolute inset-0 -z-10 rounded-3xl opacity-0 group-hover:opacity-100 bg-gradient-to-br from-blue-500/5 to-purple-500/5 transition-opacity duration-500" />

                  {/* Badges and Timestamp */}
                  <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {post.category}
                    </span>
                    {post.generated_by_ai && (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        AI Generated
                      </span>
                    )}
                    <span className="text-slate-400 dark:text-slate-600 font-bold">•</span>
                    <time
                      dateTime={post.createdAt.toISOString()}
                      className="text-slate-500 dark:text-slate-400 font-medium"
                    >
                      {formattedDate}
                    </time>
                  </div>

                  {/* Title & Link */}
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                    <Link href={`/en/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h2>

                  {/* Rendered Markdown Body */}
                  <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-2xl">
                    <ReactMarkdown>{post.markdown_content}</ReactMarkdown>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
