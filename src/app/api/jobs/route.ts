import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
          { title: { contains: search } },
          { company: { contains: search } },
          { city: { contains: search } },
        ],
      });
    }

    if (category && category !== "all" && category !== "All") {
      whereConditions.push({
        category: { contains: category },
      });
    }

    if (language && language !== "all" && language !== "All") {
      whereConditions.push({
        languageReq: { contains: language },
      });
    }

    if (city && city !== "all" && city !== "All") {
      whereConditions.push({
        city: { contains: city },
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
