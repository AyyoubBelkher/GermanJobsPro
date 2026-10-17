import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, verifyAutomationSecret } from "@/lib/admin-auth";
import { sanitizeJobPayload } from "@/lib/jobSanitizer";

/**
 * Validates request authorization:
 * Allows either automated n8n webhook secret or an authenticated admin session.
 */
export async function isAuthorizedJobRequest(request: NextRequest): Promise<boolean> {
  if (verifyAutomationSecret(request)) {
    return true;
  }
  const admin = await requireAdmin(request);
  return Boolean(admin);
}

const GOOGLE_NEWS_DOMAINS = [
  "news.google.",
  "google.com/url",
  "google.com/rss",
  "news.ycombinator.com",
];

/**
 * Handles unified job ingestion/creation logic:
 * - Authorizes request via webhook secret or admin session
 * - Validates input fields (title, company, URL / email)
 * - Deduplicates on applyUrl
 * - Sanitizes title/category/salary with sanitizeJobPayload
 * - Persists to Prisma and returns 201 Created or 200 on duplicate skip
 */
export async function handleJobIngestion(request: NextRequest): Promise<NextResponse> {
  try {
    if (!(await isAuthorizedJobRequest(request))) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
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

    // Use mailto:email as fallback applyUrl if only contactEmail is provided
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

    const sanitized = sanitizeJobPayload({
      title: title.trim(),
      category: category !== undefined && category !== null && String(category).trim() ? String(category).trim() : "General",
      salary: salary !== undefined && salary !== null && String(salary).trim() ? String(salary).trim() : null,
      requirements: requirements !== undefined && requirements !== null && String(requirements).trim() ? String(requirements).trim() : null,
      descriptionRaw: descriptionRaw !== undefined && descriptionRaw !== null && String(descriptionRaw).trim() ? String(descriptionRaw).trim() : null,
    });

    const newJob = await prisma.job.create({
      data: {
        title: sanitized.title.trim(),
        company: company.trim(),
        applyUrl: finalApplyUrl,
        contactEmail: finalContactEmail,
        city: city !== undefined && city !== null && String(city).trim() ? String(city).trim() : "Germany",
        category: sanitized.category ? String(sanitized.category).trim() : "General",
        jobType: jobType !== undefined && jobType !== null && String(jobType).trim() ? String(jobType).trim() : "Full-time",
        languageReq: languageReq !== undefined && languageReq !== null && String(languageReq).trim() ? String(languageReq).trim() : "B1/B2",
        salary: sanitized.salary ? String(sanitized.salary).trim() : null,
        requirements: sanitized.requirements ? String(sanitized.requirements).trim() : null,
        descriptionRaw: sanitized.descriptionRaw ? String(sanitized.descriptionRaw).trim() : null,
        publishedAt: publishedAt ? new Date(publishedAt as string | number | Date) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt as string | number | Date) : null,
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

    console.error("[Job Ingestion Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
