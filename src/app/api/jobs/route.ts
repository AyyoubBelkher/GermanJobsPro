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
      descriptionRaw,
      publishedAt,
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Job title is required." },
        { status: 400 }
      );
    }

    if (!company || typeof company !== "string" || !company.trim()) {
      return NextResponse.json(
        { success: false, error: "Company is required." },
        { status: 400 }
      );
    }

    if (!applyUrl || typeof applyUrl !== "string" || !applyUrl.trim()) {
      return NextResponse.json(
        { success: false, error: "Application URL (applyUrl) is required." },
        { status: 400 }
      );
    }

    const newJob = await prisma.job.create({
      data: {
        title: title.trim(),
        company: company.trim(),
        applyUrl: applyUrl.trim(),
        city: city !== undefined && city !== null && String(city).trim() ? String(city).trim() : "Germany",
        category: category !== undefined && category !== null && String(category).trim() ? String(category).trim() : "General",
        jobType: jobType !== undefined && jobType !== null && String(jobType).trim() ? String(jobType).trim() : "Full-time",
        languageReq: languageReq !== undefined && languageReq !== null && String(languageReq).trim() ? String(languageReq).trim() : "B1/B2",
        salary: salary !== undefined && salary !== null && String(salary).trim() ? String(salary).trim() : null,
        descriptionRaw: descriptionRaw !== undefined && descriptionRaw !== null && String(descriptionRaw).trim() ? String(descriptionRaw).trim() : null,
        publishedAt: publishedAt ? new Date(publishedAt as string | number | Date) : new Date(),
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
