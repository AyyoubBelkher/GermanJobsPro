import React from "react";
import Image from "next/image";

interface PostCardProps {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  imageUrl?: string;
  readMoreText?: string;
  href?: string;
}

export default function PostCard({
  title,
  excerpt,
  category,
  date,
  imageUrl,
  readMoreText = "اقرأ المزيد",
  href = "#",
}: PostCardProps) {
  // Check if title contains Arabic characters to determine alignment hints (though text-start handles most cases)
  const isArabic = /[\u0600-\u06FF]/.test(title);

  return (
    <article 
      className="flex flex-col h-full bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/50 dark:hover:border-blue-500/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 group"
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* Aspect-ratio wrapper for cover image */}
      <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800/80 relative overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          /* Premium SVG/Gradient Fallback Placeholder */
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800/60 flex flex-col items-center justify-center p-4">
            <div className="p-3 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-2 border border-blue-500/20">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.778.099-1.533.284-2.253"
                />
              </svg>
            </div>
            <span className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              {category}
            </span>
          </div>
        )}

        {/* Category Badge overlay on top of images */}
        {imageUrl && (
          <span className="absolute top-4 start-4 text-xs font-semibold px-3 py-1 rounded-full bg-slate-900/80 text-white backdrop-blur-sm border border-slate-700/50">
            {category}
          </span>
        )}
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

        {/* Read More Link */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <a
            href={href}
            className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group/link"
          >
            <span>{readMoreText}</span>
            <svg
              className={`w-4 h-4 ms-1 transform transition-transform group-hover/link:translate-x-1 rtl:group-hover/link:-translate-x-1 ${
                isArabic ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}
