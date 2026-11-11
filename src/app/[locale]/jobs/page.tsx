import React from "react";
import { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { prisma } from "@/lib/prisma";
import { getCityVariants } from "@/lib/cityAliases";
import { LEGACY_NEWS_OUTLETS, NON_GERMANY_LOCATIONS, isLegacyNewsJob, isExcludedJob, deduplicateJobs } from "@/lib/jobUtils";
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
    alternates: {
      canonical: `https://www.germanjobspro.com/${locale}/jobs`,
      languages: {
        ar: "https://www.germanjobspro.com/ar/jobs",
        de: "https://www.germanjobspro.com/de/jobs",
        en: "https://www.germanjobspro.com/en/jobs",
        fr: "https://www.germanjobspro.com/fr/jobs",
        "x-default": "https://www.germanjobspro.com/de/jobs",
      },
    },
  };
}

export default async function JobsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ search?: string; category?: string; language?: string; city?: string; page?: string }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const search = resolvedSearchParams.search?.trim() || "";
  const category = resolvedSearchParams.category?.trim() || "";
  const language = resolvedSearchParams.language?.trim() || "";
  const city = resolvedSearchParams.city?.trim() || "";
  const parsedPage = parseInt(resolvedSearchParams.page || "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = 15;
  const skip = (page - 1) * limit;

  // Build PostgreSQL filter conditions with case-insensitive matching
  const whereConditions: Array<Record<string, unknown>> = [];

  if (search) {
    const searchCityVariants = getCityVariants(search);
    whereConditions.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        ...searchCityVariants.map((variant) => ({
          city: { contains: variant, mode: "insensitive" },
        })),
      ],
    });
  }

  if (category && category !== "all" && category !== "All") {
    whereConditions.push({
      category: { contains: category, mode: "insensitive" },
    });
  }

  if (language && language !== "all" && language !== "All") {
    whereConditions.push({
      languageReq: { contains: language, mode: "insensitive" },
    });
  }

  if (city && city !== "all" && city !== "All") {
    const cityVariants = getCityVariants(city);
    if (cityVariants.length > 1) {
      whereConditions.push({
        OR: cityVariants.map((variant) => ({
          city: { contains: variant, mode: "insensitive" },
        })),
      });
    } else {
      whereConditions.push({
        city: { contains: city, mode: "insensitive" },
      });
    }
  }

  // Only display verified active jobs on the board
  whereConditions.push({
    status: "ACTIVE",
  });

  // Exclude legacy news-scraper entries and Swiss/non-German listings
  whereConditions.push({
    NOT: [
      { applyUrl: { contains: "news.google" } },
      ...LEGACY_NEWS_OUTLETS.map((outlet) => ({
        company: { contains: outlet, mode: "insensitive" as const },
      })),
      ...NON_GERMANY_LOCATIONS.map((loc) => ({
        city: { contains: loc, mode: "insensitive" as const },
      })),
      ...NON_GERMANY_LOCATIONS.map((loc) => ({
        title: { contains: loc, mode: "insensitive" as const },
      })),
    ],
  });

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

    // Automatically trigger a background cleanup for legacy news rows and non-German listings
    prisma.job
      .deleteMany({
        where: {
          OR: [
            { applyUrl: { contains: "news.google" } },
            ...LEGACY_NEWS_OUTLETS.map((outlet) => ({
              company: { contains: outlet, mode: "insensitive" as const },
            })),
            ...NON_GERMANY_LOCATIONS.map((loc) => ({
              city: { contains: loc, mode: "insensitive" as const },
            })),
            ...NON_GERMANY_LOCATIONS.map((loc) => ({
              title: { contains: loc, mode: "insensitive" as const },
            })),
          ],
        },
      })
      .catch((err) => {
        console.error("[JobsPage] Background cleanup error:", err instanceof Error ? err.message : err);
      });
  } catch (error) {
    console.error(
      "[JobsPage] Database query warning (Neon connection timeout or offline):",
      error instanceof Error ? error.message : error
    );
  }

  const initialJobs: JobItem[] = deduplicateJobs(
    rawJobs.filter((j) => !isExcludedJob(j))
  ).map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      city: j.city,
      category: j.category,
      jobType: j.jobType,
      languageReq: j.languageReq,
      languageLevel: j.languageReq,
      salary: j.salary,
      applyUrl: j.applyUrl,
      contactEmail: j.contactEmail,
      requirements: j.requirements,
      descriptionRaw: j.descriptionRaw,
      publishedAt: j.publishedAt instanceof Date ? j.publishedAt.toISOString() : String(j.publishedAt),
    }));

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div dir={dir} className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
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
