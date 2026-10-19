import React, { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-session";
import JobDetailClient from "@/components/jobs/JobDetailClient";
import { JobDetailData, extractCleanHrEmail } from "@/lib/jobUtils";
import { stripHtml } from "@/lib/cover-letter";

export const revalidate = 60;

/**
 * Request-scoped cached job fetcher shared between generateMetadata and JobDetailPage.
 * Prevents duplicate concurrent Prisma queries / Neon connection pool exhaustion on the same request.
 * Note: Database connection/query errors are intentionally allowed to throw so they can be
 * caught by error boundaries rather than silently converting a DB outage into a 404 "not found".
 */
const getJobById = cache(async (id: string) => {
  if (!id || typeof id !== "string") return null;
  return await prisma.job.findUnique({
    where: { id },
  });
});

/**
 * Safely converts any Date, string, or number to an ISO-8601 string,
 * returning null if the input is missing, invalid, or produces NaN.
 */
function toSafeIsoString(val: unknown): string | null {
  if (!val) return null;
  try {
    if (val instanceof Date) {
      return isNaN(val.getTime()) ? null : val.toISOString();
    }
    if (typeof val === "string" || typeof val === "number") {
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d.toISOString();
    }
  } catch {
    return null;
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  try {
    const { locale, id } = await params;
    const isAr = locale === "ar";
    const isDe = locale === "de";

    if (!id) {
      return {
        title: isAr ? "الوظيفة غير موجودة | GermanJobsPro 🇩🇪" : "Job not found | GermanJobsPro 🇩🇪",
      };
    }

    let job = null;
    try {
      job = await getJobById(id);
    } catch (dbErr: any) {
      if (dbErr?.digest?.startsWith?.("NEXT_")) throw dbErr;
      console.error(`[generateMetadata] Database query error for job "${id}":`, dbErr?.message || dbErr);
      return {
        title: isAr
          ? "فرص العمل في ألمانيا | GermanJobsPro 🇩🇪"
          : isDe
          ? "Stellenangebote in Deutschland | GermanJobsPro 🇩🇪"
          : "Jobs in Germany | GermanJobsPro 🇩🇪",
      };
    }

    if (!job) {
      return {
        title: isAr
          ? "الوظيفة غير موجودة | GermanJobsPro 🇩🇪"
          : "Job not found | GermanJobsPro 🇩🇪",
      };
    }

    const shortDesc = stripHtml(job.requirements || job.descriptionRaw || job.title || "").slice(0, 160);

    return {
      title: isAr
        ? `${job.title || "فرصة عمل"} في شركة ${job.company || "ألمانيا"} (${job.city || "ألمانيا"}) | GermanJobsPro 🇩🇪`
        : isDe
        ? `${job.title || "Stellenangebot"} bei ${job.company || "Deutschland"} in ${job.city || "Deutschland"} | GermanJobsPro 🇩🇪`
        : `${job.title || "Job Offer"} at ${job.company || "Germany"} (${job.city || "Germany"}) | GermanJobsPro 🇩🇪`,
      description:
        shortDesc ||
        (isAr
          ? `تفاصيل وظيفة ${job.title || "شاغر وظيفي"} في شركة ${job.company || "ألمانيا"}. قدم الآن مع إمكانية توليد خطاب الدافع Anschreiben وفحص التوافق ATS.`
          : `Stellenangebot für ${job.title || "Stelle"} bei ${job.company || "Deutschland"}. Jetzt mit KI-Anschreiben bewerben.`),
    };
  } catch (err: any) {
    if (err?.digest?.startsWith?.("NEXT_")) {
      throw err;
    }
    console.error("[JobDetailPage] Error in generateMetadata:", err);
    return {
      title: "Job Details | GermanJobsPro 🇩🇪",
    };
  }
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const dir = isAr ? "rtl" : "ltr";

  // Request correlation ID for safe, non-sensitive diagnostic logging
  const correlationId = `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  // Fetch job details (cached per request across generateMetadata and page)
  let job = null;
  try {
    if (id) {
      job = await getJobById(id);
    }
  } catch (error: any) {
    if (error?.digest?.startsWith?.("NEXT_")) {
      throw error;
    }
    // CRITICAL: Do NOT silently convert database outage into "not found"!
    // Re-throw so error.tsx displays the retryable recovery UI rather than an inaccurate 404.
    console.error(`[JobDetailPage][${correlationId}] Database query error for job "${id}":`, error?.message || error);
    throw error;
  }

  // Intentional 404: The query succeeded, but no job with this ID exists in the database
  if (!job) {
    notFound();
  }

  // Safe user session extraction with plain-object serialization
  let safeUser: {
    id: string;
    email: string;
    name: string | null;
    plan: string;
    aiCredits: number;
    planExpiresAt?: string | null;
  } | null = null;

  try {
    const authResult = await getUserSession();
    if (authResult?.user) {
      safeUser = {
        id: String(authResult.user.id),
        email: String(authResult.user.email),
        name: authResult.user.name ? String(authResult.user.name) : null,
        plan: String(authResult.user.plan || "FREE"),
        aiCredits: typeof authResult.user.aiCredits === "number" ? authResult.user.aiCredits : 0,
        planExpiresAt: toSafeIsoString(authResult.user.planExpiresAt),
      };
    }
  } catch (err: any) {
    if (err?.digest?.startsWith?.("NEXT_")) {
      throw err;
    }
    console.error("[JobDetailPage] Error resolving user session:", err);
    safeUser = null;
  }

  // Query up to 3 similar active jobs in the same category, falling back to latest active jobs
  let similarJobs: Array<{
    id: string;
    title: string;
    company: string;
    city: string | null;
    category: string;
    languageReq: string | null;
    salary: string | null;
  }> = [];

  try {
    if (job?.id) {
      similarJobs = await prisma.job.findMany({
        where: {
          status: "ACTIVE",
          id: { not: job.id },
          category: job.category || undefined,
        },
        select: {
          id: true,
          title: true,
          company: true,
          city: true,
          category: true,
          languageReq: true,
          salary: true,
        },
        orderBy: { publishedAt: "desc" },
        take: 3,
      });

      if (similarJobs.length < 3) {
        const excludedIds = [job.id, ...similarJobs.map((j) => j.id)];
        const fallbackJobs = await prisma.job.findMany({
          where: {
            status: "ACTIVE",
            id: { notIn: excludedIds },
          },
          select: {
            id: true,
            title: true,
            company: true,
            city: true,
            category: true,
            languageReq: true,
            salary: true,
          },
          orderBy: { publishedAt: "desc" },
          take: 3 - similarJobs.length,
        });
        similarJobs = [...similarJobs, ...fallbackJobs];
      }
    }
  } catch (err: any) {
    if (err?.digest?.startsWith?.("NEXT_")) {
      throw err;
    }
    console.error("[JobDetailPage] Error fetching similar jobs:", err);
    similarJobs = [];
  }

  // Strictly serialize similar jobs
  const safeSimilarJobs = (similarJobs || []).map((j) => ({
    id: String(j.id),
    title: String(j.title || "Job Offer"),
    company: String(j.company || "Employer"),
    city: j.city ? String(j.city) : null,
    category: String(j.category || "General"),
    languageReq: j.languageReq ? String(j.languageReq) : null,
    salary: j.salary ? String(j.salary) : null,
  }));

  let cleanEmail: string | null = null;
  try {
    cleanEmail = extractCleanHrEmail(job);
  } catch (emailErr: any) {
    console.error(`[JobDetailPage][${correlationId}] Error extracting HR email for job "${job?.id}":`, emailErr);
    cleanEmail = null;
  }

  // Strict Plain-Object Serialization: Convert all Dates to ISO strings or null
  const safePublishedAt = toSafeIsoString(job.publishedAt) || new Date().toISOString();
  const safeExpiresAt = toSafeIsoString(job.expiresAt);
  const safeCreatedAt = toSafeIsoString(job.createdAt);
  const safeUpdatedAt = toSafeIsoString(job.updatedAt);

  const jobData: JobDetailData = {
    id: String(job.id),
    title: String(job.title || "Job Offer"),
    company: String(job.company || "Employer"),
    city: job.city ? String(job.city) : null,
    category: String(job.category || "General"),
    jobType: job.jobType ? String(job.jobType) : null,
    languageReq: job.languageReq ? String(job.languageReq) : null,
    salary: job.salary ? String(job.salary) : null,
    applyUrl: String(job.applyUrl || ""),
    contactEmail: cleanEmail ? String(cleanEmail) : null,
    requirements: job.requirements ? String(job.requirements) : null,
    descriptionRaw: job.descriptionRaw ? String(job.descriptionRaw) : null,
    publishedAt: safePublishedAt,
    expiresAt: safeExpiresAt,
    createdAt: safeCreatedAt,
    updatedAt: safeUpdatedAt,
    isVerified: Boolean(job.isVerified ?? true),
  };

  const datePosted = safePublishedAt;
  const validThrough =
    safeExpiresAt ||
    (() => {
      try {
        const pTime = new Date(safePublishedAt).getTime();
        if (!isNaN(pTime)) {
          const expDate = new Date(pTime + 30 * 24 * 60 * 60 * 1000);
          if (!isNaN(expDate.getTime())) {
            return expDate.toISOString();
          }
        }
      } catch {}
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    })();

  const jobPostingLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: jobData.title,
    description: stripHtml(jobData.descriptionRaw || jobData.requirements || jobData.title || "Job Offer in Germany"),
    datePosted,
    validThrough,
    employmentType: /ausbildung|تدريب/i.test(jobData.category || "") ? "INTERN" : "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: jobData.company,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: jobData.city || "Deutschland",
        addressCountry: "DE",
      },
    },
    directApply: Boolean(cleanEmail || jobData.applyUrl),
  };

  return (
    <div
      dir={dir}
      className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jobPostingLd).replace(/</g, "\\u003c"),
        }}
      />

      <Navbar locale={locale} initialUser={safeUser} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full flex-1 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium flex-wrap">
          <Link href={`/${locale}`} className="hover:text-blue-400 transition-colors">
            {isAr ? "الرئيسية" : isDe ? "Startseite" : "Home"}
          </Link>
          <span>/</span>
          <Link href={`/${locale}/jobs`} className="hover:text-blue-400 transition-colors">
            {isAr ? "فرص العمل في ألمانيا" : isDe ? "Jobs" : "Jobs"}
          </Link>
          <span>/</span>
          <span className="text-slate-200 truncate max-w-xs font-semibold" dir="auto">
            {jobData.title}
          </span>
        </div>

        {/* Interactive Job Detail Client */}
        <JobDetailClient
          job={jobData}
          locale={locale}
          initialUser={safeUser}
        />

        {/* Similar Jobs in the Same Field */}
        {safeSimilarJobs.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>💼</span>
                <span>
                  {isAr
                    ? "وظائف مشابهة في نفس المجال"
                    : isDe
                    ? "Ähnliche Stellenangebote"
                    : "Similar Jobs"}
                </span>
              </h2>
              <Link
                href={`/${locale}/jobs`}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
              >
                <span>{isAr ? "عرض جميع الوظائف" : isDe ? "Alle Jobs ansehen" : "View all jobs"}</span>
                <span className={dir === "rtl" ? "rotate-180" : ""}>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {safeSimilarJobs.map((relJob) => (
                <Link
                  key={relJob.id}
                  href={`/${locale}/jobs/${relJob.id}`}
                  className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 space-y-4 shadow-xl transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
                        {relJob.category}
                      </span>
                      {relJob.salary && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-medium">
                          💰 {relJob.salary}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3
                        className="font-extrabold text-white text-base leading-snug group-hover:text-blue-400 transition-colors line-clamp-2"
                        dir="auto"
                      >
                        {relJob.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1" dir="auto">
                        🏢 {relJob.company}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                      <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-medium">
                        📍 {relJob.city || (isAr ? "ألمانيا" : isDe ? "Deutschland" : "Germany")}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                        🇩🇪 {relJob.languageReq || "B1/B2"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-blue-400 group-hover:text-blue-300">
                    <span>{isAr ? "عرض التفاصيل والتقديم" : isDe ? "Details ansehen" : "View Details"}</span>
                    <span className={dir === "rtl" ? "rotate-180" : ""}>→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer locale={locale} />
    </div>
  );
}
