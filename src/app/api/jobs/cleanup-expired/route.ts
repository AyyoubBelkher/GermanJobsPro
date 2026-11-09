import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, verifyAutomationSecret } from "@/lib/admin-auth";
import { LEGACY_NEWS_OUTLETS, NON_GERMANY_LOCATIONS, isExcludedJob, deduplicateJobs } from "@/lib/jobUtils";

async function isAuthorized(request: NextRequest): Promise<boolean> {
  if (verifyAutomationSecret(request)) {
    return true;
  }
  const admin = await requireAdmin(request);
  return Boolean(admin);
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

    // 1. Purge non-job entries, Google News aggregator entries, and Swiss/non-German listings
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
    });

    // 2. Multi-city & Duplicate listings deduplication + non-German listings cleanup
    const activeJobs = await prisma.job.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, title: true, company: true, city: true, applyUrl: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
    });

    // Check for any remaining excluded jobs in activeJobs
    const excludedIds = activeJobs.filter((j) => isExcludedJob(j)).map((j) => j.id);

    // Keep only first occurrence of each normalized title|company pair
    const nonExcludedActive = activeJobs.filter((j) => !excludedIds.includes(j.id));
    const uniqueActive = deduplicateJobs(nonExcludedActive);
    const uniqueIds = new Set(uniqueActive.map((j) => j.id));
    const duplicateIds = nonExcludedActive.filter((j) => !uniqueIds.has(j.id)).map((j) => j.id);

    const idsToPurge = Array.from(new Set([...excludedIds, ...duplicateIds]));
    let deduplicatedCount = 0;
    if (idsToPurge.length > 0) {
      if (mode === "delete" || request.method === "DELETE") {
        const delRes = await prisma.job.deleteMany({
          where: { id: { in: idsToPurge } },
        });
        deduplicatedCount = delRes.count;
      } else {
        const updRes = await prisma.job.updateMany({
          where: { id: { in: idsToPurge } },
          data: { status: "EXPIRED" },
        });
        deduplicatedCount = updRes.count;
      }
    }

    // 3. 30 days cutoff or explicit expiresAt reached
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
        message: `Cleanup completed. Purged ${nonJobPurgeResult.count} non-job entries. Deduplicated/filtered ${deduplicatedCount} duplicate/Swiss listings. ${mode === "delete" ? "Deleted" : "Expired"} ${expiredCount} expired jobs.`,
        purgedNonJobsCount: nonJobPurgeResult.count,
        deduplicatedCount,
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
