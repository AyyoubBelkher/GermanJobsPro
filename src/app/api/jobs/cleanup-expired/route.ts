import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session";

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  const customHeader = request.headers.get("x-automation-key");
  const secretKey = process.env.MY_SECRET_AUTOMATION_KEY;

  if (secretKey && secretKey.trim() !== "") {
    if (authHeader === `Bearer ${secretKey}` || authHeader === secretKey || customHeader === secretKey) {
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

    // 30 days cutoff
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { count } = await prisma.job.deleteMany({
      where: {
        publishedAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Deleted ${count} expired jobs older than 30 days.`,
        deletedCount: count,
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
