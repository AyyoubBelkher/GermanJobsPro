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

/**
 * POST /api/jobs/create
 * Ingests a new job from automation workflows (n8n/webhooks) or admin session.
 * Deduplicates automatically based on `applyUrl`.
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthorized(request))) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const {
      title,
      company,
      applyUrl,
      city,
      category,
      jobType,
      languageReq,
      salary,
      descriptionRaw,
      publishedAt,
    } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Job title is required." },
        { status: 400 }
      );
    }

    if (!company || typeof company !== "string" || company.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Company name is required." },
        { status: 400 }
      );
    }

    if (!applyUrl || typeof applyUrl !== "string" || applyUrl.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Application URL (applyUrl) is required." },
        { status: 400 }
      );
    }

    const cleanApplyUrl = applyUrl.trim();

    // Deduplication check
    const existingJob = await prisma.job.findUnique({
      where: { applyUrl: cleanApplyUrl },
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

    const newJob = await prisma.job.create({
      data: {
        title: title.trim(),
        company: company.trim(),
        applyUrl: cleanApplyUrl,
        city: city ? String(city).trim() : "Germany",
        category: category ? String(category).trim() : "General",
        jobType: jobType ? String(jobType).trim() : "Full-time",
        languageReq: languageReq ? String(languageReq).trim() : "B1/B2",
        salary: salary ? String(salary).trim() : null,
        descriptionRaw: descriptionRaw ? String(descriptionRaw).trim() : null,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Job ingested successfully.",
        skipped: false,
        job: newJob,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/jobs/create Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
