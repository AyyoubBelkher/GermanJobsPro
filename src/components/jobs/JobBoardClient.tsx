"use client";

import React, { useState, useEffect, useRef, useTransition, useCallback, useMemo } from "react";
import Link from "next/link";
import { extractGermanJobTitle, stripHtml } from "@/lib/cover-letter";
import GermanTtsButton from "@/components/blog/GermanTtsButton";
import { getDictionary, isValidLocale, DEFAULT_LOCALE, LOCALE_METADATA, type Locale } from "@/lib/i18n";
import {
  extractGermanCity,
  extractCleanHrEmail,
  inferDisplayLanguageReq,
  inferDisplayCategory,
  formatRelativeJobDate,
  localizeJobTitle,
  localizeJobDescription,
  localizeLanguageBadge,
} from "@/lib/jobUtils";
import BidiSalary from "@/components/jobs/BidiSalary";

export { stripHtml };

export interface JobItem {
  id: string;
  title: string;
  titleAr?: string | null;
  titleDe?: string | null;
  titleEn?: string | null;
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
  descriptionAr?: string | null;
  descriptionDe?: string | null;
  descriptionEn?: string | null;
  publishedAt: string | Date;
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
  const isAr = activeLocale === "ar";
  const isDe = activeLocale === "de";
  const isFr = activeLocale === "fr";
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
    {
      id: "English",
      label: isAr
        ? "🇬🇧 الإنجليزية"
        : isDe
        ? "🇬🇧 Englisch"
        : isFr
        ? "🇬🇧 Anglais"
        : "🇬🇧 English",
    },
    { id: "B1", label: `🇩🇪 ${localizeLanguageBadge("B1", activeLocale)}` },
    { id: "B2", label: `🇩🇪 ${localizeLanguageBadge("B2", activeLocale)}` },
    { id: "C1", label: `🇩🇪 ${localizeLanguageBadge("C1", activeLocale)}` },
  ];

  const topGermanCities = [
    {
      id: "all",
      label: isAr
        ? "📍 كل المدن"
        : isDe
        ? "📍 Alle Städte"
        : isFr
        ? "📍 Toutes les villes"
        : "📍 All Cities",
    },
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
  const [page, setPage] = useState(initialPage);

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
      selectedCity: string,
      directEmail: boolean
    ) => {
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        if (selectedCity && selectedCity !== "all") params.set("city", selectedCity);
        if (directEmail) params.set("directEmail", "true");
        params.set("limit", "50");

        const res = await fetch(`/api/jobs?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load jobs");
        const data = await res.json();

        if (data.success && Array.isArray(data.jobs)) {
          setJobs(data.jobs);
        }
      } catch (err) {
        console.error("Error fetching jobs:", err);
      }
    },
    []
  );

  useEffect(() => {
    // If the server rendered batch has fewer jobs than initialTotal, fetch all in the background
    if (initialJobs.length < initialTotal) {
      fetchJobs(search, city, directEmailOnly);
    }
  }, [fetchJobs, initialJobs.length, initialTotal, search, city, directEmailOnly]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      startTransition(() => {
        fetchJobs(search, city, directEmailOnly);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, city, directEmailOnly, fetchJobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // 1. Category filtering using inferDisplayCategory
      if (category && category !== "all") {
        const effectiveCategory = inferDisplayCategory(job);
        if (effectiveCategory.toLowerCase() !== category.toLowerCase()) {
          return false;
        }
      }

      // 2. Language filtering using inferDisplayLanguageReq
      if (language && language !== "all") {
        const effectiveLang = inferDisplayLanguageReq(job);
        const isEnglishListing =
          effectiveLang.startsWith("EN") ||
          effectiveLang.toLowerCase().includes("english");

        if (language === "English" || language.toLowerCase() === "en") {
          if (!isEnglishListing) {
            return false;
          }
        } else {
          // German levels: "B1", "B2", "C1", etc.
          // Ensure English jobs are not falsely matched as German
          if (isEnglishListing) {
            return false;
          }
          if (!effectiveLang.toLowerCase().includes(language.toLowerCase())) {
            return false;
          }
        }
      }

      return true;
    });
  }, [jobs, category, language]);

  const PAGE_SIZE = 15;
  const total = filteredJobs.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activePage = Math.min(page, totalPages);
  const paginatedJobs = filteredJobs.slice(
    (activePage - 1) * PAGE_SIZE,
    activePage * PAGE_SIZE
  );

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 200, behavior: "smooth" });
  };

  const hasActiveFilters = Boolean(
    search.trim() !== "" ||
    category.toLowerCase() !== "all" ||
    city.toLowerCase() !== "all" ||
    language.toLowerCase() !== "all" ||
    directEmailOnly
  );

  const handleResetFilters = () => {
    setSearch("");
    setCategory("all");
    setCity("all");
    setLanguage("all");
    setDirectEmailOnly(false);
    setPage(1);
  };

  const clearFiltersLabel =
    isAr
      ? "✕ مسح الفلاتر"
      : isDe
      ? "✕ Filter zurücksetzen"
      : activeLocale === "fr"
      ? "✕ Effacer les filtres"
      : "✕ Clear filters";

  const formatDate = (dateVal: string | Date) =>
    formatRelativeJobDate(dateVal, activeLocale);

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
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={dict.jobs.searchPlaceholder}
              className="w-full ps-11 pe-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden transition-all shadow-xs"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
              />
            </svg>
          </div>

          <div className="sm:col-span-1 md:col-span-3">
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPage(1);
              }}
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
              onChange={(e) => {
                setLanguage(e.target.value);
                setPage(1);
              }}
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
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setDirectEmailOnly((prev) => !prev);
              setPage(1);
            }}
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
                : isFr
                ? "Candidature directe par e-mail"
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
                onClick={() => {
                  setCategory(cat.id);
                  setPage(1);
                }}
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

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 snap-start bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-400/30 shadow-xs"
            >
              <span>{clearFiltersLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 px-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          {isPending ? (
            <span className="text-blue-600 flex items-center gap-1.5">
              <svg className="animate-spin h-3.5 w-3.5 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>{dict.jobs.updating}</span>
            </span>
          ) : (
            <span className="font-semibold text-slate-700">{dict.jobs.foundJobs.replace("{count}", String(total))}</span>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <span>{clearFiltersLabel}</span>
            </button>
          )}
        </div>

        {totalPages > 1 && (
          <span>
            {dict.jobs.pageOf.replace("{page}", String(activePage)).replace("{totalPages}", String(totalPages))}
          </span>
        )}
      </div>

      {/* Jobs Listing */}
      {paginatedJobs.length === 0 ? (
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
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200"
          >
            {clearFiltersLabel}
          </button>
        </div>
      ) : (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedJobs.map((job) => {
            const cleanEmail = extractCleanHrEmail(job);
            const hasDirectEmail = Boolean(cleanEmail);
            const { primaryTitle, latinSubtitle } = localizeJobTitle(job, activeLocale);
            const spokenGermanTitle = latinSubtitle || extractGermanJobTitle(job.title) || primaryTitle;
            const effectiveCategory = inferDisplayCategory(job);
            const categoryBadgeLabel =
              categories.find((c) => c.id.toLowerCase() === effectiveCategory.toLowerCase())?.label ||
              effectiveCategory;
            const langBadge = inferDisplayLanguageReq(job);
            const isEnglishJob = langBadge.startsWith("EN") || langBadge.toLowerCase().includes("english");
            const langBadgeLabel = localizeLanguageBadge(langBadge, activeLocale);
            const localizedCity = isAr
              ? job.city || dict.jobs.details.germany
              : extractGermanCity(job.city || dict.jobs.details.germany);
            const localizedDescription = localizeJobDescription(job, activeLocale);

            return (
              <div
                key={job.id}
                className="bg-white border border-slate-200 hover:border-blue-400 rounded-3xl p-6 space-y-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                        {categoryBadgeLabel}
                      </span>
                      {hasDirectEmail ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1">
                          <span>✉️</span>
                          <span>
                            {isAr
                              ? "تقديم مباشر عبر البريد الإلكتروني"
                              : isDe
                              ? "Direkte E-Mail-Bewerbung"
                              : isFr
                              ? "Candidature directe par e-mail"
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
                              : isFr
                              ? "Portail officiel de l'entreprise"
                              : "Official Company Portal"}
                          </span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500" suppressHydrationWarning>{formatDate(job.publishedAt)}</span>
                  </div>

                  <div dir="auto" className="text-start [unicode-bidi:isolate]">
                    <div className="flex items-start justify-between gap-2">
                      <h3 dir="auto" className="font-extrabold text-[#061838] text-base leading-snug hover:text-blue-600 transition-colors text-start flex-1 min-w-0">
                        <Link href={`/${activeLocale}/jobs/${job.id}`} className="block text-start [unicode-bidi:isolate]" dir="auto">
                          <bdi dir="auto" className="block break-words">
                            {primaryTitle}
                          </bdi>
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
                    <p dir="auto" className="text-xs text-slate-600 mt-1.5 text-start">🏢 <bdi dir="auto">{job.company}</bdi></p>
                  </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                    📍 <bdi dir="auto">{localizedCity}</bdi>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                    {isEnglishJob ? `🇬🇧 ${langBadgeLabel}` : `🇩🇪 ${langBadgeLabel}`}
                  </span>
                  {job.salary && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-medium">
                      💰 <BidiSalary salary={job.salary} locale={activeLocale} />
                    </span>
                  )}
                </div>

                {localizedDescription && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed text-start [unicode-bidi:isolate] break-words" dir="auto">
                    {localizedDescription}
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
            onClick={() => handlePageChange(activePage - 1)}
            disabled={activePage <= 1}
            className="px-4 py-2 rounded-xl bg-white dark:bg-[#0A1936] border border-slate-300/90 dark:border-slate-500 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#132B59] hover:text-slate-950 dark:hover:text-white disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-600 dark:disabled:text-slate-400 disabled:border-slate-300/90 dark:disabled:border-slate-700 disabled:hover:bg-slate-100 dark:disabled:hover:bg-slate-900 disabled:cursor-not-allowed text-xs font-bold transition-all cursor-pointer shadow-sm"
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
                  aria-current={activePage === p ? "page" : undefined}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    activePage === p
                      ? "bg-[#061838] text-white border-[#061838] dark:bg-blue-600 dark:text-white dark:border-blue-400 shadow-sm"
                      : "bg-white dark:bg-[#0A1936] text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#132B59] hover:text-slate-950 dark:hover:text-white border-slate-300/90 dark:border-slate-500 shadow-xs"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => handlePageChange(activePage + 1)}
            disabled={activePage >= totalPages}
            className="px-4 py-2 rounded-xl bg-white dark:bg-[#0A1936] border border-slate-300/90 dark:border-slate-500 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#132B59] hover:text-slate-950 dark:hover:text-white disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-600 dark:disabled:text-slate-400 disabled:border-slate-300/90 dark:disabled:border-slate-700 disabled:hover:bg-slate-100 dark:disabled:hover:bg-slate-900 disabled:cursor-not-allowed text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            {dict.jobs.next}
          </button>
        </div>
      )}
    </div>
  );
}
