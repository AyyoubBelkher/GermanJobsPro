"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import Link from "next/link";
import { extractGermanJobTitle } from "@/lib/cover-letter";
import { getDictionary, isValidLocale, DEFAULT_LOCALE, LOCALE_METADATA, type Locale } from "@/lib/i18n";

export interface JobItem {
  id: string;
  title: string;
  company: string;
  city: string | null;
  category: string;
  jobType: string | null;
  languageReq: string | null;
  salary: string | null;
  applyUrl: string;
  contactEmail?: string | null;
  requirements?: string | null;
  descriptionRaw: string | null;
  publishedAt: string | Date;
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

interface JobBoardClientProps {
  initialJobs: JobItem[];
  total: number;
  page: number;
  totalPages: number;
  locale: string;
}

export default function JobBoardClient({
  initialJobs,
  total: initialTotal,
  page: initialPage,
  totalPages: initialTotalPages,
  locale,
}: JobBoardClientProps) {
  const activeLocale: Locale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(activeLocale);
  const currentMeta = LOCALE_METADATA[activeLocale];
  const dir = currentMeta.dir;

  const categories = [
    { id: "all", label: dict.jobs.categories.all, icon: "🌐" },
    { id: "IT", label: dict.jobs.categories.it, icon: "💻" },
    { id: "Healthcare", label: dict.jobs.categories.healthcare, icon: "🏥" },
    { id: "Ausbildung", label: dict.jobs.categories.ausbildung, icon: "🎓" },
    { id: "Engineering", label: dict.jobs.categories.engineering, icon: "⚙️" },
    { id: "General", label: dict.jobs.categories.general, icon: "💼" },
  ];

  const languages = [
    { id: "all", label: dict.jobs.allLanguages },
    { id: "English", label: "🇬🇧 English" },
    { id: "B1", label: "🇩🇪 Deutsch B1" },
    { id: "B2", label: "🇩🇪 Deutsch B2" },
    { id: "C1", label: "🇩🇪 Deutsch C1" },
  ];

  const [jobs, setJobs] = useState<JobItem[]>(initialJobs);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [language, setLanguage] = useState("all");

  const [isPending, startTransition] = useTransition();

  const fetchJobs = useCallback(async (searchQuery: string, cat: string, lang: string, targetPage: number) => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (cat && cat !== "all") params.set("category", cat);
      if (lang && lang !== "all") params.set("language", lang);
      params.set("page", String(targetPage));
      params.set("limit", "15");

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load jobs");
      const data = await res.json();

      if (data.success) {
        setJobs(data.jobs);
        setTotal(data.total);
        setPage(data.page);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        fetchJobs(search, category, language, 1);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, category, language, fetchJobs]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    startTransition(() => {
      fetchJobs(search, category, language, newPage);
    });
    window.scrollTo({ top: 200, behavior: "smooth" });
  };

  const formatDate = (dateVal: string | Date) => {
    const d = new Date(dateVal);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));

    if (diffHours < 24) {
      return dict.jobs.dateToday;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return dict.jobs.dateYesterday;
    }
    if (diffDays < 7) {
      return dict.jobs.dateDaysAgo.replace("{days}", String(diffDays));
    }
    const localeCode =
      activeLocale === "ar"
        ? "ar-EG"
        : activeLocale === "de"
        ? "de-DE"
        : activeLocale === "fr"
        ? "fr-FR"
        : "en-US";
    return d.toLocaleDateString(localeCode, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8" dir={dir}>
      {/* Search & Header Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
            <span>🇩🇪</span>
            <span>{dict.jobs.marketBadge}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {dict.jobs.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            {dict.jobs.subtitle}
          </p>
        </div>

        {/* Search Bar & Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={dict.jobs.searchPlaceholder}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm placeholder:text-slate-500 focus:border-blue-500 focus:outline-hidden transition-all shadow-inner"
            />
            <span className="absolute left-4 top-4 text-slate-500 text-base">🔍</span>
          </div>

          <div className="md:col-span-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-hidden transition-all cursor-pointer"
            >
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800/80"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          {isPending ? (
            <span className="text-blue-400 flex items-center gap-1.5">
              <svg className="animate-spin h-3.5 w-3.5 text-blue-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>{dict.jobs.updating}</span>
            </span>
          ) : (
            <span>{dict.jobs.foundJobs.replace("{count}", String(total))}</span>
          )}
        </div>

        {totalPages > 1 && (
          <span>
            {dict.jobs.pageOf.replace("{page}", String(page)).replace("{totalPages}", String(totalPages))}
          </span>
        )}
      </div>

      {/* Jobs Listing */}
      {jobs.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto text-2xl">
            💼
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">
              {dict.jobs.noJobsFound}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {dict.jobs.noJobsDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCategory("all");
              setLanguage("all");
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            {dict.jobs.resetFilters}
          </button>
        </div>
      ) : (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 space-y-5 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
                    {job.category}
                  </span>
                  <span className="text-[11px] text-slate-500">{formatDate(job.publishedAt)}</span>
                </div>

                <div dir="auto" className="text-start">
                  <h3 dir="auto" className="font-extrabold text-white text-base leading-snug hover:text-blue-400 transition-colors text-start">
                    <Link href={`/${activeLocale}/jobs/${job.id}`} className="block text-start" dir="auto">
                      {job.title}
                    </Link>
                  </h3>
                  <p dir="auto" className="text-xs text-slate-400 mt-1 text-start">🏢 {job.company}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-medium">
                    📍 {job.city || dict.jobs.details.germany}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                    🇩🇪 {job.languageReq || "B1/B2"}
                  </span>
                  {job.salary && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
                      💰 {job.salary}
                    </span>
                  )}
                </div>

                {job.descriptionRaw && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed text-start" dir="auto">
                    {stripHtml(job.descriptionRaw)}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <Link
                  href={`/${activeLocale}/jobs/${job.id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs text-center transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>{dict.jobs.viewDetailsAndApply}</span>
                  <span className={dir === "rtl" ? "rotate-180" : ""}>→</span>
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/${activeLocale}/dashboard/cover-letters/new?jobTitle=${encodeURIComponent(
                      extractGermanJobTitle(job.title) || job.title
                    )}&companyName=${encodeURIComponent(
                      job.company
                    )}&jobDescription=${encodeURIComponent(job.requirements || job.descriptionRaw || "")}`}
                    className="py-2 px-3 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 font-bold text-xs text-center transition-all flex items-center justify-center gap-1"
                  >
                    <span>✨</span>
                    <span>{dict.jobs.generateAnschreiben}</span>
                  </Link>

                  <Link
                    href={`/${activeLocale}/dashboard/ats-analyzer?jobDescription=${encodeURIComponent(
                      job.requirements || job.descriptionRaw || ""
                    )}`}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs text-center transition-all flex items-center justify-center gap-1"
                  >
                    <span>🔍</span>
                    <span>{dict.jobs.auditAts}</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 text-xs font-bold transition-all cursor-pointer"
          >
            {dict.jobs.previous}
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePageChange(p)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    page === p
                      ? "bg-blue-600 text-white"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 text-xs font-bold transition-all cursor-pointer"
          >
            {dict.jobs.next}
          </button>
        </div>
      )}
    </div>
  );
}
