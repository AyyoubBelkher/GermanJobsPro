import { NextRequest, NextResponse } from "next/server";
import { handleJobIngestion } from "@/lib/jobIngestion";

/**
 * POST /api/jobs/create
 * Ingests a new job from automation workflows (n8n/webhooks) or admin session.
 * Uses unified ingestion logic with automatic deduplication, sanitization, and dual auth.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleJobIngestion(request);
}
