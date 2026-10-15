import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-session";
import JobDetailClient, { JobDetailData } from "@/components/jobs/JobDetailClient";
import { stripHtml } from "@/components/jobs/JobBoardClient";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const isAr = locale === "ar";
  const isDe = locale === "de";

  try {
    const job = await prisma.job.findUnique({
      where: { id },
      select: {
        title: true,
        company: true,
        city: true,
        category: true,
        descriptionRaw: true,
        requirements: true,
      },
    });

    if (!job) {
      return {
        title: isAr
          ? "الوظيفة غير موجودة | GermanJobsPro 🇩🇪"
          : "Job not found | GermanJobsPro 🇩🇪",
      };
    }

    const shortDesc = stripHtml(job.requirements || job.descriptionRaw || "").slice(0, 160);

    return {
      title: isAr
        ? `${job.title} في شركة ${job.company} (${job.city || "ألمانيا"}) | GermanJobsPro 🇩🇪`
        : isDe
        ? `${job.title} bei ${job.company} in ${job.city || "Deutschland"} | GermanJobsPro 🇩🇪`
        : `${job.title} at ${job.company} (${job.city || "Germany"}) | GermanJobsPro 🇩🇪`,
      description:
        shortDesc ||
        (isAr
          ? `تفاصيل وظيفة ${job.title} في شركة ${job.company}. قدم الآن مع إمكانية توليد خطاب الدافع Anschreiben وفحص التوافق ATS.`
          : `Stellenangebot für ${job.title} bei ${job.company}. Jetzt mit KI-Anschreiben bewerben.`),
    };
  } catch {
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

  // Fetch job details
  let job = null;
  try {
    job = await prisma.job.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("[JobDetailPage] Error fetching job:", error);
  }

  if (!job) {
    notFound();
  }

  const authResult = await getUserSession();
  const user = authResult ? authResult.user : null;

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
    similarJobs = await prisma.job.findMany({
      where: {
        status: "ACTIVE",
        id: { not: job.id },
        category: job.category,
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
  } catch (err) {
    console.error("[JobDetailPage] Error fetching similar jobs:", err);
  }

  const jobData: JobDetailData = {
    id: job.id,
    title: job.title,
    company: job.company,
    city: job.city,
    category: job.category,
    jobType: job.jobType,
    languageReq: job.languageReq,
    salary: job.salary,
    applyUrl: job.applyUrl,
    contactEmail: job.contactEmail,
    requirements: job.requirements,
    descriptionRaw: job.descriptionRaw,
    publishedAt: job.publishedAt instanceof Date ? job.publishedAt.toISOString() : String(job.publishedAt),
    isVerified: job.isVerified ?? true,
  };

  const jobPostingLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: stripHtml(job.descriptionRaw || job.requirements || job.title),
    datePosted: new Date(job.publishedAt).toISOString(),
    validThrough: (job.expiresAt
      ? new Date(job.expiresAt)
      : new Date(new Date(job.publishedAt).getTime() + 30 * 24 * 60 * 60 * 1000)
    ).toISOString(),
    employmentType: /ausbildung|تدريب/i.test(job.category) ? "INTERN" : "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.city || "Deutschland",
        addressCountry: "DE",
      },
    },
    directApply: Boolean(job.contactEmail || job.applyUrl),
  };

  return (
    <div
      dir={dir}
      className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingLd) }}
      />

      <Navbar locale={locale} initialUser={user} />

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
            {job.title}
          </span>
        </div>

        {/* Interactive Job Detail Client */}
        <JobDetailClient
          job={jobData}
          locale={locale}
          initialUser={user}
        />

        {/* Similar Jobs in the Same Field */}
        {similarJobs.length > 0 && (
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
              {similarJobs.map((relJob) => (
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
