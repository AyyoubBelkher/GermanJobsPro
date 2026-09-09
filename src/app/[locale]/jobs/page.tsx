import React from "react";
import { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { prisma } from "@/lib/prisma";
import JobBoardClient, { JobItem } from "@/components/jobs/JobBoardClient";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  const isDe = locale === "de";

  return {
    title: isAr
      ? "فرص العمل وعقود التدريب في ألمانيا 🇩🇪 | GermanJobsPro"
      : isDe
      ? "Jobs & Stellenangebote in Deutschland 🇩🇪 | GermanJobsPro"
      : "Jobs & Careers in Germany 🇩🇪 | GermanJobsPro",
    description: isAr
      ? "تصفح أحدث الوظائف وعقود الأوسبيلدونغ في ألمانيا مع أدوات التقديم المباشر وتوليد خطاب الدافع Anschreiben بالذكاء الاصطناعي."
      : "Finden Sie aktuelle Jobs in Deutschland mit 1-Klick Anschreiben-Generator und ATS-Lebenslauf-Check.",
  };
}

export default async function JobsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ search?: string; category?: string; language?: string; page?: string }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const search = resolvedSearchParams.search?.trim() || "";
  const category = resolvedSearchParams.category?.trim() || "";
  const language = resolvedSearchParams.language?.trim() || "";
  const parsedPage = parseInt(resolvedSearchParams.page || "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = 15;
  const skip = (page - 1) * limit;

  // Build PostgreSQL filter conditions with case-insensitive matching
  const whereConditions: Array<Record<string, unknown>> = [];

  if (search) {
    whereConditions.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (category && category !== "all") {
    whereConditions.push({
      category: { contains: category, mode: "insensitive" },
    });
  }

  if (language && language !== "all") {
    whereConditions.push({
      languageReq: { contains: language, mode: "insensitive" },
    });
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

  let total = 0;
  let rawJobs: Array<{
    id: string;
    title: string;
    company: string;
    city: string | null;
    category: string;
    jobType: string | null;
    languageReq: string | null;
    salary: string | null;
    applyUrl: string;
    contactEmail: string | null;
    requirements: string | null;
    descriptionRaw: string | null;
    publishedAt: Date;
  }> = [];

  try {
    const [fetchedTotal, fetchedJobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
    ]);
    total = fetchedTotal;
    rawJobs = fetchedJobs;
  } catch (error) {
    console.error(
      "[JobsPage] Database query warning (Neon connection timeout or offline):",
      error instanceof Error ? error.message : error
    );
  }

  const totalPages = Math.ceil(total / limit) || 1;

  const initialJobs: JobItem[] = rawJobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    city: j.city,
    category: j.category,
    jobType: j.jobType,
    languageReq: j.languageReq,
    salary: j.salary,
    applyUrl: j.applyUrl,
    contactEmail: j.contactEmail,
    requirements: j.requirements,
    descriptionRaw: j.descriptionRaw,
    publishedAt: j.publishedAt instanceof Date ? j.publishedAt.toISOString() : String(j.publishedAt),
  }));

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      <Navbar locale={locale} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <JobBoardClient
          initialJobs={initialJobs}
          total={total}
          page={page}
          totalPages={totalPages}
          locale={locale}
        />
      </main>

      <Footer locale={locale} />
    </div>
  );
}
