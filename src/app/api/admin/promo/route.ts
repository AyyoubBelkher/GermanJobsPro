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

/**
 * GET /api/admin/promo
 * Lists all promo codes and their usage stats.
 */
export async function GET(request: NextRequest) {
  try {
    const isAuth = await isAuthorized(request);
    if (!isAuth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const promoCodes = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, promoCodes }, { status: 200 });
  } catch (error: unknown) {
    console.error("[GET /api/admin/promo Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/promo
 * Creates a new promo/trial code.
 */
export async function POST(request: NextRequest) {
  try {
    const isAuth = await isAuthorized(request);
    if (!isAuth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.code || typeof body.code !== "string" || body.code.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Code is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    const cleanCode = body.code.trim().toUpperCase();

    const existing = await prisma.promoCode.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Promo code "${cleanCode}" already exists.` },
        { status: 400 }
      );
    }

    const newPromo = await prisma.promoCode.create({
      data: {
        code: cleanCode,
        planGranted: body.planGranted === "PRO" ? "PRO" : "TRIAL",
        durationDays: typeof body.durationDays === "number" ? Math.max(1, body.durationDays) : 7,
        creditsGranted: typeof body.creditsGranted === "number" ? Math.max(1, body.creditsGranted) : 15,
        maxUses: typeof body.maxUses === "number" ? Math.max(1, body.maxUses) : 10,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        isActive: body.isActive !== false,
      },
    });

    return NextResponse.json(
      { success: true, message: "Promo code created successfully.", promoCode: newPromo },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/admin/promo Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
