import React from "react";
import { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { prisma } from "@/lib/prisma";
import JobBoardClient, { JobItem } from "@/components/jobs/JobBoardClient";

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
  const page = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10));
  const limit = 15;
  const skip = (page - 1) * limit;

  // Build filter conditions
  const whereConditions: Array<Record<string, unknown>> = [];

  if (search) {
    whereConditions.push({
      OR: [
        { title: { contains: search } },
        { company: { contains: search } },
        { city: { contains: search } },
      ],
    });
  }

  if (category && category !== "all") {
    whereConditions.push({
      category: { contains: category },
    });
  }

  if (language && language !== "all") {
    whereConditions.push({
      languageReq: { contains: language },
    });
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

  const [total, rawJobs] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

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
    descriptionRaw: j.descriptionRaw,
    publishedAt: j.publishedAt.toISOString(),
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
