import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { timingSafeCompare } from "@/lib/session";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  const customHeader = request.headers.get("x-automation-key");
  if (!authHeader && !customHeader) return false;

  const validKeys = [
    process.env.AUTOMATION_SECRET_KEY,
    process.env.MY_SECRET_AUTOMATION_KEY,
  ].filter((k): k is string => Boolean(k && k.trim()));

  for (const key of validKeys) {
    if (
      timingSafeCompare(authHeader, `Bearer ${key}`) ||
      timingSafeCompare(authHeader, key) ||
      timingSafeCompare(customHeader, key)
    ) {
      return true;
    }
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const language = searchParams.get("language")?.trim() || "";
    const city = searchParams.get("city")?.trim() || "";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    // Build filter conditions
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
      whereConditions.push({
        city: { contains: city, mode: "insensitive" },
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

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json(
      {
        success: true,
        jobs,
        total,
        page,
        totalPages,
        limit,
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
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const {
      title,
      company,
      city,
      category,
      jobType,
      languageReq,
      salary,
      applyUrl,
      contactEmail,
      requirements,
      descriptionRaw,
      publishedAt,
      expiresAt,
      status,
      isVerified,
    } = body;

    // 1. Validate Title
    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Valid job title is required (minimum 3 characters)." },
        { status: 400 }
      );
    }

    // 2. Validate Company
    if (!company || typeof company !== "string" || company.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Valid company name is required (minimum 2 characters)." },
        { status: 400 }
      );
    }

    const companyLower = company.trim().toLowerCase();
    if (companyLower === "google news" || companyLower === "unknown") {
      return NextResponse.json(
        { success: false, error: "Invalid company name. Generic news or unknown sources are rejected." },
        { status: 400 }
      );
    }

    // 3. Validate Application Method (applyUrl or contactEmail)
    const rawApplyUrl = typeof applyUrl === "string" ? applyUrl.trim() : "";
    const rawContactEmail = typeof contactEmail === "string" ? contactEmail.trim() : "";

    // Reject Google News and aggregator redirect links
    const GOOGLE_NEWS_DOMAINS = [
      "news.google.",
      "google.com/url",
      "google.com/rss",
      "news.ycombinator.com",
    ];

    for (const domain of GOOGLE_NEWS_DOMAINS) {
      if (rawApplyUrl.toLowerCase().includes(domain)) {
        return NextResponse.json(
          { success: false, error: "Google News aggregator URLs are not allowed as job application links." },
          { status: 400 }
        );
      }
    }

    const hasValidUrl =
      rawApplyUrl.startsWith("http://") ||
      rawApplyUrl.startsWith("https://") ||
      rawApplyUrl.startsWith("mailto:");

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const hasValidEmail = emailRegex.test(rawContactEmail);

    if (!hasValidUrl && !hasValidEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid application method is required: provide either a valid applyUrl (http/https) or contactEmail.",
        },
        { status: 400 }
      );
    }

    const finalApplyUrl = hasValidUrl ? rawApplyUrl : `mailto:${rawContactEmail}`;
    const finalContactEmail = hasValidEmail ? rawContactEmail : null;

    // Deduplication check
    const existingJob = await prisma.job.findUnique({
      where: { applyUrl: finalApplyUrl },
    });

    if (existingJob) {
      return NextResponse.json(
        {
          success: true,
          message: "Job already exists in database (skipped duplicate).",
          skipped: true,
          job: existingJob,
        },
        { status: 200 }
      );
    }

    const validStatus =
      status && ["ACTIVE", "EXPIRED", "ARCHIVED"].includes(String(status).toUpperCase())
        ? String(status).toUpperCase()
        : "ACTIVE";

    const newJob = await prisma.job.create({
      data: {
        title: title.trim(),
        company: company.trim(),
        applyUrl: finalApplyUrl,
        contactEmail: finalContactEmail,
        city: city !== undefined && city !== null && String(city).trim() ? String(city).trim() : "Germany",
        category: category !== undefined && category !== null && String(category).trim() ? String(category).trim() : "General",
        jobType: jobType !== undefined && jobType !== null && String(jobType).trim() ? String(jobType).trim() : "Full-time",
        languageReq: languageReq !== undefined && languageReq !== null && String(languageReq).trim() ? String(languageReq).trim() : "B1/B2",
        salary: salary !== undefined && salary !== null && String(salary).trim() ? String(salary).trim() : null,
        requirements: requirements !== undefined && requirements !== null && String(requirements).trim() ? String(requirements).trim() : null,
        descriptionRaw: descriptionRaw !== undefined && descriptionRaw !== null && String(descriptionRaw).trim() ? String(descriptionRaw).trim() : null,
        publishedAt: publishedAt ? new Date(publishedAt as string | number | Date) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt as string | number | Date) : null,
        status: validStatus,
        isVerified: typeof isVerified === "boolean" ? isVerified : true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        job: newJob,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { success: false, error: "A job with this applyUrl already exists." },
        { status: 409 }
      );
    }

    console.error("[POST /api/jobs Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Failed to create job" },
      { status: 500 }
    );
  }
}
