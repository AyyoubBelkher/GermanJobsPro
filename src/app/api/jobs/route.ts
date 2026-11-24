import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/prisma";
import { getCityVariants } from "@/lib/cityAliases";
import { handleJobIngestion } from "@/lib/jobIngestion";
import { sanitizeJobPayload } from "@/lib/jobSanitizer";
import {
  LEGACY_NEWS_OUTLETS,
  NON_GERMANY_LOCATIONS,
  filterDeduplicateAndPaginateJobs,
} from "@/lib/jobUtils";

const MAX_JOBS_FETCH = 500;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const language = searchParams.get("language")?.trim() || "";
    const city = searchParams.get("city")?.trim() || "";
    const directEmail = searchParams.get("directEmail") === "true";

    const parsedPage = parseInt(searchParams.get("page") || "1", 10);
    const page = Math.max(1, Number.isFinite(parsedPage) ? parsedPage : 1);
    const parsedLimit = parseInt(searchParams.get("limit") || "15", 10);
    const limit = Math.min(50, Math.max(1, Number.isFinite(parsedLimit) ? parsedLimit : 15));

    // Build filter conditions
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

    if (directEmail) {
      whereConditions.push({
        OR: [
          {
            AND: [
              { contactEmail: { not: null } },
              { contactEmail: { not: "" } },
            ],
          },
          {
            applyUrl: {
              startsWith: "mailto:",
              mode: "insensitive",
            },
          },
        ],
      });
    }

    const statusParam = searchParams.get("status")?.trim();
    if (statusParam && statusParam !== "all" && statusParam !== "All") {
      whereConditions.push({
        status: statusParam.toUpperCase(),
      });
    } else if (!statusParam) {
      // Default to ACTIVE jobs in listings
      whereConditions.push({
        status: "ACTIVE",
      });
    }

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

    const rawJobs = await withDbRetry(() =>
      prisma.job.findMany({
        where,
        select: {
          id: true,
          title: true,
          company: true,
          city: true,
          category: true,
          jobType: true,
          languageReq: true,
          salary: true,
          applyUrl: true,
          contactEmail: true,
          requirements: true,
          descriptionRaw: true,
          publishedAt: true,
          expiresAt: true,
          status: true,
          isVerified: true,
        },
        orderBy: { publishedAt: "desc" },
        take: MAX_JOBS_FETCH,
      })
    );

    const paginated = filterDeduplicateAndPaginateJobs(rawJobs, {
      page,
      limit,
      sanitize: sanitizeJobPayload,
    });

    return NextResponse.json(
      {
        success: true,
        jobs: paginated.jobs,
        total: paginated.total,
        page: paginated.page,
        totalPages: paginated.totalPages,
        limit: paginated.limit,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[GET /api/jobs Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handleJobIngestion(request);
}
