import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session";

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("admin_session")?.value;
  return Boolean(adminCookie && (await verifySessionToken(adminCookie)));
}

/**
 * GET /api/admin/promo
 * Lists all promo codes and their usage stats.
 */
export async function GET() {
  try {
    const isAuth = await isAuthorized();
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
    const isAuth = await isAuthorized();
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

export async function DELETE(request: NextRequest) {
  try {
    const isAuth = await isAuthorized();
    if (!isAuth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    let code = searchParams.get("code");

    if (!id && !code) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
      code = body.code;
    }

    if (!id && !code) {
      return NextResponse.json(
        { success: false, error: "Promo ID or Code is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.promoCode.findFirst({
      where: id ? { id } : { code: code!.trim().toUpperCase() },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Promo code not found." },
        { status: 404 }
      );
    }

    await prisma.promoCode.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({
      success: true,
      message: `Promo code "${existing.code}" deleted successfully.`,
    });
  } catch (error: unknown) {
    console.error("[DELETE /api/admin/promo Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const isAuth = await isAuthorized();
    if (!isAuth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || (!body.id && !body.code)) {
      return NextResponse.json(
        { success: false, error: "Promo ID or Code is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.promoCode.findFirst({
      where: body.id ? { id: body.id } : { code: String(body.code).trim().toUpperCase() },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Promo code not found." },
        { status: 404 }
      );
    }

    const updated = await prisma.promoCode.update({
      where: { id: existing.id },
      data: {
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
        maxUses: typeof body.maxUses === "number" ? Math.max(1, body.maxUses) : existing.maxUses,
        durationDays: typeof body.durationDays === "number" ? Math.max(1, body.durationDays) : existing.durationDays,
        creditsGranted: typeof body.creditsGranted === "number" ? Math.max(1, body.creditsGranted) : existing.creditsGranted,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Promo code "${updated.code}" updated successfully.`,
      promoCode: updated,
    });
  } catch (error: unknown) {
    console.error("[PATCH /api/admin/promo Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return PATCH(request);
}
