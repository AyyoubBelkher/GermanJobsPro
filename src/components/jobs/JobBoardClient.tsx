"use client";

import React, { useState, useEffect, useRef, useTransition, useCallback } from "react";
import Link from "next/link";
import { extractGermanJobTitle, stripHtml } from "@/lib/cover-letter";
import GermanTtsButton from "@/components/blog/GermanTtsButton";
import { getDictionary, isValidLocale, DEFAULT_LOCALE, LOCALE_METADATA, type Locale } from "@/lib/i18n";
import { splitBilingualTitle, extractCleanHrEmail } from "@/lib/jobUtils";

export { stripHtml };

export interface JobItem {
  id: string;
  title: string;
  company: string;
  city: string | null;
  category: string;
  jobType: string | null;
  languageReq: string | null;
  languageLevel?: string | null;
  salary: string | null;
  applyUrl: string;
  contactEmail?: string | null;
  requirements?: string | null;
  descriptionRaw: string | null;
  publishedAt: string | Date;
}

const formatLangLevel = (lvl?: string | null) => (!lvl || lvl.toLowerCase() === "none") ? "Deutsch (B1/B2)" : lvl;

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
  const isAr = activeLocale === "ar";
  const isDe = activeLocale === "de";
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

  const topGermanCities = [
    { id: "all", label: isAr ? "📍 كل المدن" : isDe ? "📍 Alle Städte" : "📍 All Cities" },
    { id: "Berlin", label: "Berlin" },
    { id: "München", label: "München" },
    { id: "Hamburg", label: "Hamburg" },
    { id: "Frankfurt", label: "Frankfurt" },
    { id: "Köln", label: "Köln" },
    { id: "Stuttgart", label: "Stuttgart" },
    { id: "Düsseldorf", label: "Düsseldorf" },
    { id: "Leipzig", label: "Leipzig" },
    { id: "Hannover", label: "Hannover" },
    { id: "Nürnberg", label: "Nürnberg" },
  ];

  const [jobs, setJobs] = useState<JobItem[]>(initialJobs);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [language, setLanguage] = useState("all");
  const [city, setCity] = useState("all");
  const [directEmailOnly, setDirectEmailOnly] = useState(false);

  const [isPending, startTransition] = useTransition();
  const isInitialMount = useRef(true);

  const fetchJobs = useCallback(
    async (
      searchQuery: string,
      cat: string,
      lang: string,
      selectedCity: string,
      directEmail: boolean,
      targetPage: number
    ) => {
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        if (cat && cat !== "all") params.set("category", cat);
        if (lang && lang !== "all") params.set("language", lang);
        if (selectedCity && selectedCity !== "all") params.set("city", selectedCity);
        if (directEmail) params.set("directEmail", "true");
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
    },
    []
  );

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      startTransition(() => {
        fetchJobs(search, category, language, city, directEmailOnly, 1);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, category, language, city, directEmailOnly, fetchJobs]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    startTransition(() => {
      fetchJobs(search, category, language, city, directEmailOnly, newPage);
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
      <div className="bg-[#061838] border border-[#0A2552] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-white">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold">
            <span>🇩🇪</span>
            <span>{dict.jobs.marketBadge}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {dict.jobs.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {dict.jobs.subtitle}
          </p>
        </div>

        {/* Search Bar & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
          <div className="sm:col-span-2 md:col-span-6 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={dict.jobs.searchPlaceholder}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden transition-all shadow-xs"
            />
            <span className="absolute left-4 top-4 text-slate-400 text-base">🔍</span>
          </div>

          <div className="sm:col-span-1 md:col-span-3">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:border-blue-500 focus:outline-hidden transition-all cursor-pointer shadow-xs"
            >
              {topGermanCities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1 md:col-span-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:border-blue-500 focus:outline-hidden transition-all cursor-pointer shadow-xs"
            >
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills & Direct Email Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none flex-nowrap snap-x">
          <button
            type="button"
            onClick={() => setDirectEmailOnly((prev) => !prev)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 snap-start ${
              directEmailOnly
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-400/50"
                : "bg-[#0A2552] hover:bg-[#0E3572] text-emerald-300 border border-emerald-500/30"
            }`}
          >
            <span>✉️</span>
            <span>
              {isAr
                ? "تقديم مباشر بالإيميل"
                : isDe
                ? "Direkte E-Mail-Bewerbung"
                : "Direct HR Email"}
            </span>
            {directEmailOnly && (
              <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full font-bold">✓</span>
            )}
          </button>

          <div className="h-5 w-px bg-white/10 hidden sm:block shrink-0" />

          {categories.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 snap-start ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "bg-[#0A2552] hover:bg-[#0E3572] text-slate-200 border border-white/10"
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
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        <div>
          {isPending ? (
            <span className="text-blue-600 flex items-center gap-1.5">
              <svg className="animate-spin h-3.5 w-3.5 text-blue-600" viewBox="0 0 24 24">
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
        <div className="text-center py-20 px-4 rounded-3xl bg-white border border-dashed border-slate-300 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto text-2xl">
            💼
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#061838]">
              {dict.jobs.noJobsFound}
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              {dict.jobs.noJobsDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCategory("all");
              setLanguage("all");
              setCity("all");
              setDirectEmailOnly(false);
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200"
          >
            {dict.jobs.resetFilters}
          </button>
        </div>
      ) : (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => {
            const cleanEmail = extractCleanHrEmail(job);
            const hasDirectEmail = Boolean(cleanEmail);
            const { primaryTitle, latinSubtitle } = splitBilingualTitle(job.title);
            const spokenGermanTitle = latinSubtitle || extractGermanJobTitle(job.title) || job.title;

            return (
              <div
                key={job.id}
                className="bg-white border border-slate-200 hover:border-blue-400 rounded-3xl p-6 space-y-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                        {job.category}
                      </span>
                      {hasDirectEmail ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1">
                          <span>✉️</span>
                          <span>
                            {isAr
                              ? "تقديم مباشر عبر البريد الإلكتروني"
                              : isDe
                              ? "Direkte E-Mail-Bewerbung"
                              : "Direct Email Application"}
                          </span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1">
                          <span>🌐</span>
                          <span>
                            {isAr
                              ? "تقديم مباشر عبر الموقع الرسمي للشركة"
                              : isDe
                              ? "Offizielles Unternehmensportal"
                              : "Official Company Portal"}
                          </span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">{formatDate(job.publishedAt)}</span>
                  </div>

                  <div dir="auto" className="text-start">
                    <div className="flex items-start justify-between gap-2">
                      <h3 dir="auto" className="font-extrabold text-[#061838] text-base leading-snug hover:text-blue-600 transition-colors text-start flex-1">
                        <Link href={`/${activeLocale}/jobs/${job.id}`} className="block text-start" dir="auto">
                          <span>{primaryTitle}</span>
                          {latinSubtitle && (
                            <span
                              dir="ltr"
                              className="block mt-1.5 font-medium text-xs text-slate-500 dir-ltr text-left [direction:ltr] [unicode-bidi:isolate]"
                            >
                              {latinSubtitle}
                            </span>
                          )}
                        </Link>
                      </h3>
                      <GermanTtsButton
                        text={spokenGermanTitle}
                        size="sm"
                        variant="blue"
                      />
                    </div>
                    <p dir="auto" className="text-xs text-slate-600 mt-1.5 text-start">🏢 {job.company}</p>
                  </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                    📍 {job.city || dict.jobs.details.germany}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                    🇩🇪 {formatLangLevel(job.languageLevel || job.languageReq)}
                  </span>
                  {job.salary && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-medium">
                      💰 {job.salary}
                    </span>
                  )}
                </div>

                {job.descriptionRaw && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed text-start" dir="auto">
                    {stripHtml(job.descriptionRaw)}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
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
                    className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 font-bold text-xs text-center transition-all flex items-center justify-center gap-1"
                  >
                    <span>{dict.jobs.generateAnschreiben}</span>
                  </Link>

                  <Link
                    href={`/${activeLocale}/dashboard/ats-analyzer?jobDescription=${encodeURIComponent(
                      job.requirements || job.descriptionRaw || ""
                    )}`}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs text-center transition-all flex items-center justify-center gap-1 border border-slate-200"
                  >
                    <span>🔍</span>
                    <span>{dict.jobs.auditAts}</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 text-xs font-bold transition-all cursor-pointer shadow-sm"
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
                      ? "bg-[#061838] text-white shadow-sm"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-xs"
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
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            {dict.jobs.next}
          </button>
        </div>
      )}
    </div>
  );
}
