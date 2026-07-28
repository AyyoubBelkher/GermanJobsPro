import React from "react";
import Link from "next/link";

interface PostCardProps {
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
  readMoreText = "اقرأ المزيد ←",
  href,
}: PostCardProps) {
  const isArabic = /[\u0600-\u06FF]/.test(title);

  // Determine final image URL with fallback to reliable Unsplash job cover image
  const rawImage = imageUrl || image_url || cover_image;
  const finalImageUrl =
    rawImage && typeof rawImage === "string" && rawImage.trim().length > 0 && !rawImage.startsWith("/images/")
      ? rawImage.trim()
      : DEFAULT_UNSPLASH_IMAGE;

  // Construct target link cleanly using encoded slug to prevent 404s
  const targetHref = href
    ? href
    : slug
    ? `/${locale}/blog/${encodeURIComponent(slug)}`
    : "#";

  return (
    <Link href={targetHref} className="block h-full group">
      <article
        className="flex flex-col h-full bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/50 dark:hover:border-blue-500/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer"
        dir={isArabic ? "rtl" : "ltr"}
      >
        {/* Full-width Cover Image */}
        <div className="w-full h-48 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={finalImageUrl}
            alt={title}
            className="w-full h-48 object-cover rounded-t-xl group-hover:scale-105 transition-transform duration-500"
          />

          {/* Category Badge overlay on top of cover image */}
          <span className="absolute top-4 start-4 text-xs font-semibold px-3 py-1 rounded-full bg-slate-900/80 text-white backdrop-blur-sm border border-slate-700/50">
            {category}
          </span>
        </div>

        {/* Card Content */}
        <div className="flex-1 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            {/* Date */}
            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium">
              <svg
                className="w-3.5 h-3.5 me-1.5"
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

            {/* Title */}
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-2 text-start">
              {title}
            </h3>

            {/* Excerpt */}
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed text-start">
              {excerpt}
            </p>
          </div>

          {/* Read More Link / Button indicator */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
              {readMoreText}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
