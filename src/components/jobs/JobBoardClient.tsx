"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import Link from "next/link";

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

const CATEGORIES = [
  { id: "all", labelAr: "جميع المجالات", labelDe: "Alle Kategorien", labelEn: "All Categories", icon: "🌐" },
  { id: "IT", labelAr: "تقنية المعلومات والبرمجة", labelDe: "IT & Software", labelEn: "IT & Tech", icon: "💻" },
  { id: "Healthcare", labelAr: "التمريض والرعاية الصحية", labelDe: "Pflege & Medizin", labelEn: "Healthcare", icon: "🏥" },
  { id: "Ausbildung", labelAr: "عقود الأوسبيلدونغ (Ausbildung)", labelDe: "Ausbildung", labelEn: "Apprenticeship", icon: "🎓" },
  { id: "Engineering", labelAr: "الهندسة والصناعة", labelDe: "Ingenieurwesen", labelEn: "Engineering", icon: "⚙️" },
  { id: "General", labelAr: "وظائف أخرى", labelDe: "Sonstige", labelEn: "General", icon: "💼" },
];

const LANGUAGES = [
  { id: "all", label: "All Languages / كل اللغات" },
  { id: "English", label: "🇬🇧 English" },
  { id: "B1", label: "🇩🇪 Deutsch B1" },
  { id: "B2", label: "🇩🇪 Deutsch B2" },
  { id: "C1", label: "🇩🇪 Deutsch C1" },
];

export default function JobBoardClient({
  initialJobs,
  total: initialTotal,
  page: initialPage,
  totalPages: initialTotalPages,
  locale,
}: JobBoardClientProps) {
  const isAr = locale === "ar";
  const isDe = locale === "de";

  const [jobs, setJobs] = useState<JobItem[]>(initialJobs);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [language, setLanguage] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

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
      return isAr ? "اليوم" : isDe ? "Heute" : "Today";
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return isAr ? "منذ يوم" : isDe ? "Gestern" : "1 day ago";
    }
    if (diffDays < 7) {
      return isAr ? `منذ ${diffDays} أيام` : isDe ? `Vor ${diffDays} Tagen` : `${diffDays} days ago`;
    }
    return d.toLocaleDateString(isAr ? "ar-EG" : isDe ? "de-DE" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Search & Header Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
            <span>🇩🇪</span>
            <span>{isAr ? "سوق العمل الألماني المباشر" : isDe ? "Aktuelle Stellenangebote" : "German Job Market"}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {isAr
              ? "💼 فرص العمل وعقود التدريب في ألمانيا"
              : isDe
              ? "💼 Jobs & Ausbildungsplätze in Deutschland"
              : "💼 Jobs & Apprenticeships in Germany"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            {isAr
              ? "تصفح أحدث الوظائف المحدثة يومياً مع إمكانية توليد خطاب الدافع (Anschreiben) وفحص سيرتك الذاتية بضغطة واحدة لكل وظيفة."
              : isDe
              ? "Finden Sie aktuelle Jobs in Deutschland mit 1-Klick Anschreiben-Generator und ATS-Lebenslauf-Check."
              : "Browse verified jobs in Germany with 1-click AI cover letter generator and ATS resume audit."}
          </p>
        </div>

        {/* Search Bar & Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isAr
                  ? "🔍 ابحث بالمسمى الوظيفي، اسم الشركة، أو المدينة (مثل: Software, Berlin, Pflege)..."
                  : isDe
                  ? "🔍 Jobtitel, Unternehmen oder Stadt suchen..."
                  : "🔍 Search by title, company, or city..."
              }
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm placeholder:text-slate-500 focus:border-blue-500 focus:outline-hidden transition-all shadow-inner"
            />
            <span className="absolute left-4 top-4 text-slate-500 text-base">🔍</span>
          </div>

          <div className="md:col-span-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-hidden transition-all cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  viewMode === "table"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>📊</span>
                <span className="hidden sm:inline">{isAr ? "جدول" : "Table"}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>🗂️</span>
                <span className="hidden sm:inline">{isAr ? "بطاقات" : "Cards"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
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
                <span>{isAr ? cat.labelAr : isDe ? cat.labelDe : cat.labelEn}</span>
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
              <span>{isAr ? "جاري التحديث..." : "Updating..."}</span>
            </span>
          ) : (
            <span>
              {isAr
                ? `تم العثور على ${total} فرصة عمل متاحة`
                : isDe
                ? `${total} Stellenangebote gefunden`
                : `Found ${total} job openings`}
            </span>
          )}
        </div>

        {totalPages > 1 && (
          <span>
            {isAr ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
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
              {isAr ? "لم يتم العثور على نتائج" : "No jobs found"}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {isAr
                ? "جرب تغيير مصطلحات البحث أو إزالة الفلاتر لعرض مزيد من الفرص."
                : "Try adjusting your search query or removing filters."}
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
            {isAr ? "إعادة ضبط الفلاتر" : "Reset Filters"}
          </button>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-950/80 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">{isAr ? "المسمى الوظيفي والشركة" : "Job & Company"}</th>
                  <th className="py-4 px-4">{isAr ? "المدينة" : "Location"}</th>
                  <th className="py-4 px-4">{isAr ? "المجال" : "Category"}</th>
                  <th className="py-4 px-4">{isAr ? "مستوى اللغة" : "Language"}</th>
                  <th className="py-4 px-4">{isAr ? "تاريخ النشر" : "Date"}</th>
                  <th className="py-4 px-6 text-center">{isAr ? "إجراءات التقديم والذكاء الاصطناعي" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Job Title & Company */}
                    <td className="py-4 px-6">
                      <div className="space-y-0.5" dir="ltr">
                        <Link
                          href={`/${locale}/jobs/${job.id}`}
                          className="font-bold text-white hover:text-blue-400 transition-colors text-sm sm:text-base flex items-center gap-1.5 text-start"
                        >
                          <span className="truncate">{job.title}</span>
                          <span className="text-slate-500 text-xs group-hover:text-blue-400 shrink-0">→</span>
                        </Link>
                        <p className="text-xs text-slate-400 flex items-center gap-2 text-start">
                          <span className="font-semibold text-slate-300 truncate">🏢 {job.company}</span>
                          {job.salary && (
                            <span className="text-emerald-400 font-medium shrink-0">💰 {job.salary}</span>
                          )}
                        </p>
                      </div>
                    </td>

                    {/* City */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300">
                        <span>📍</span>
                        <span>{job.city || "Germany"}</span>
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                        {job.category}
                      </span>
                    </td>

                    {/* Language Requirement */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                        <span>🇩🇪</span>
                        <span>{job.languageReq || "B1/B2"}</span>
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-400">
                      {formatDate(job.publishedAt)}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {/* View Details & Apply internally */}
                        <Link
                          href={`/${locale}/jobs/${job.id}`}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isAr ? "التفاصيل والتقديم" : isDe ? "Details" : "View & Apply"}</span>
                          <span>→</span>
                        </Link>

                        {/* Generate Anschreiben */}
                        <Link
                          href={`/${locale}/dashboard/cover-letters/new?jobTitle=${encodeURIComponent(
                            job.title
                          )}&companyName=${encodeURIComponent(
                            job.company
                          )}&jobDescription=${encodeURIComponent(job.requirements || job.descriptionRaw || "")}`}
                          title={isAr ? "توليد خطاب تغطية بالذكاء الاصطناعي لهذه الوظيفة" : "Generate Cover Letter with AI"}
                          className="p-2 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 transition-all cursor-pointer"
                        >
                          <span className="text-xs">✨ Anschreiben</span>
                        </Link>

                        {/* ATS Analyzer */}
                        <Link
                          href={`/${locale}/dashboard/ats-analyzer?jobDescription=${encodeURIComponent(
                            job.requirements || job.descriptionRaw || ""
                          )}`}
                          title={isAr ? "فحص ملاءمة السيرة الذاتية (ATS)" : "Check ATS Resume"}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                        >
                          <span className="text-xs">🔍 ATS</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

                <div dir="ltr" className="text-start">
                  <h3 className="font-extrabold text-white text-base leading-snug hover:text-blue-400 transition-colors">
                    <Link href={`/${locale}/jobs/${job.id}`} className="block text-start">
                      {job.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 text-start">🏢 {job.company}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-medium">
                    📍 {job.city || "Germany"}
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
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed text-start" dir="ltr">
                    {stripHtml(job.descriptionRaw)}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <Link
                  href={`/${locale}/jobs/${job.id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs text-center transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>{isAr ? "تفاصيل الوظيفة والتقديم" : isDe ? "Details & Bewerben" : "View Details & Apply"}</span>
                  <span>→</span>
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/${locale}/dashboard/cover-letters/new?jobTitle=${encodeURIComponent(
                      job.title
                    )}&companyName=${encodeURIComponent(
                      job.company
                    )}&jobDescription=${encodeURIComponent(job.requirements || job.descriptionRaw || "")}`}
                    className="py-2 px-3 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 font-bold text-xs text-center transition-all flex items-center justify-center gap-1"
                  >
                    <span>✨</span>
                    <span>Anschreiben</span>
                  </Link>

                  <Link
                    href={`/${locale}/dashboard/ats-analyzer?jobDescription=${encodeURIComponent(
                      job.requirements || job.descriptionRaw || ""
                    )}`}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs text-center transition-all flex items-center justify-center gap-1"
                  >
                    <span>🔍</span>
                    <span>{isAr ? "فحص الـ CV" : "ATS Audit"}</span>
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
            {isAr ? "السابق" : "Previous"}
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
            {isAr ? "التالي" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}
