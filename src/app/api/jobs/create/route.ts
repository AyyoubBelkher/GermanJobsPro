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
      contactEmail,
      city,
      category,
      jobType,
      languageReq,
      salary,
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

    // Since applyUrl is unique in the schema, use mailto:email as fallback applyUrl if only contactEmail is provided
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
        city: city ? String(city).trim() : "Germany",
        category: category ? String(category).trim() : "General",
        jobType: jobType ? String(jobType).trim() : "Full-time",
        languageReq: languageReq ? String(languageReq).trim() : "B1/B2",
        salary: salary ? String(salary).trim() : null,
        requirements: requirements ? String(requirements).trim() : null,
        descriptionRaw: descriptionRaw ? String(descriptionRaw).trim() : null,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: validStatus,
        isVerified: typeof isVerified === "boolean" ? isVerified : true,
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
