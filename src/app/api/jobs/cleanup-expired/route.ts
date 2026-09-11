import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, timingSafeCompare } from "@/lib/session";

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  const customHeader = request.headers.get("x-automation-key");

  const validKeys = [
    process.env.AUTOMATION_SECRET_KEY,
    process.env.MY_SECRET_AUTOMATION_KEY,
  ].filter((k): k is string => Boolean(k && k.trim() !== ""));

  for (const key of validKeys) {
    if (
      timingSafeCompare(authHeader, `Bearer ${key}`) ||
      timingSafeCompare(authHeader, key) ||
      timingSafeCompare(customHeader, key)
    ) {
      return true;
    }
  }

  // Validate real signed admin session token
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("admin_session")?.value;
  if (adminCookie && (await verifySessionToken(adminCookie))) {
    return true;
  }

  return false;
}

async function handleCleanup(request: NextRequest) {
  try {
    if (!(await isAuthorized(request))) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "archive"; // "archive" (mark EXPIRED) or "delete"

    // 1. Purge non-job entries or Google News aggregator entries
    const nonJobPurgeResult = await prisma.job.deleteMany({
      where: {
        OR: [
          { applyUrl: { contains: "news.google" } },
          { applyUrl: { contains: "google.com/url" } },
          { applyUrl: { contains: "google.com/rss" } },
          { applyUrl: { contains: "news.ycombinator.com" } },
          { company: { equals: "Google News", mode: "insensitive" } },
          { company: { equals: "Unknown", mode: "insensitive" } },
          { title: { equals: "" } },
        ],
      },
    });

    // 2. 30 days cutoff or explicit expiresAt reached
    const now = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const expiredWhere = {
      OR: [
        { expiresAt: { lt: now } },
        { publishedAt: { lt: thirtyDaysAgo } },
      ],
      status: "ACTIVE",
    };

    let expiredCount = 0;
    if (mode === "delete" || request.method === "DELETE") {
      const deleteResult = await prisma.job.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { publishedAt: { lt: thirtyDaysAgo } },
          ],
        },
      });
      expiredCount = deleteResult.count;
    } else {
      // Mark as EXPIRED rather than hard deleting
      const updateResult = await prisma.job.updateMany({
        where: expiredWhere,
        data: {
          status: "EXPIRED",
        },
      });
      expiredCount = updateResult.count;
    }

    return NextResponse.json(
      {
        success: true,
        message: `Cleanup completed. Purged ${nonJobPurgeResult.count} non-job entries. ${mode === "delete" ? "Deleted" : "Expired"} ${expiredCount} expired jobs.`,
        purgedNonJobsCount: nonJobPurgeResult.count,
        expiredJobsCount: expiredCount,
        mode,
        cutoffDate: thirtyDaysAgo.toISOString(),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Cleanup Expired Jobs Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  return handleCleanup(request);
}

export async function POST(request: NextRequest) {
  return handleCleanup(request);
}
