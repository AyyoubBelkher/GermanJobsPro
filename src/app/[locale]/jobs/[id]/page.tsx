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
  };

  return (
    <div
      dir={dir}
      className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white"
    >
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
          <span className="text-slate-200 truncate max-w-xs font-semibold" dir="ltr">
            {job.title}
          </span>
        </div>

        {/* Interactive Job Detail Client */}
        <JobDetailClient job={jobData} locale={locale} />
      </main>

      <Footer locale={locale} />
    </div>
  );
}
