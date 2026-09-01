import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserSession } from "@/lib/user-session";

/**
 * POST /api/promo/redeem
 * Redeems a promotional or trial code for the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_session")?.value;
    const authResult = await verifyUserSession(token);

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول لتفعيل الكود الترويجي." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.code || typeof body.code !== "string") {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال الكود الترويجي بشكل صحيح." },
        { status: 400 }
      );
    }

    const cleanCode = body.code.trim().toUpperCase();

    const promo = await prisma.promoCode.findUnique({
      where: { code: cleanCode },
    });

    if (!promo) {
      return NextResponse.json(
        { success: false, error: "الكود الترويجي غير صالح أو غير موجود." },
        { status: 404 }
      );
    }

    if (!promo.isActive) {
      return NextResponse.json(
        { success: false, error: "هذا الكود الترويجي غير مفعّل حالياً." },
        { status: 400 }
      );
    }

    if (promo.timesUsed >= promo.maxUses) {
      return NextResponse.json(
        { success: false, error: "تم استنفاد الحد الأقصى لاستخدام هذا الكود الترويجي." },
        { status: 400 }
      );
    }

    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: "انتهت صلاحية هذا الكود الترويجي." },
        { status: 400 }
      );
    }

    // Check if the user already redeemed this promo code
    const existingRedemption = await prisma.userPromoRedemption.findUnique({
      where: {
        userId_promoCodeId: {
          userId: authResult.user.id,
          promoCodeId: promo.id,
        },
      },
    });

    if (existingRedemption) {
      return NextResponse.json(
        { success: false, error: "لقد قمت بالفعل باستخدام هذا الكود الترويجي من قبل على حسابك." },
        { status: 400 }
      );
    }

    // Fetch current user plan details
    const currentUser = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      select: { plan: true, planExpiresAt: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "المستخدم غير موجود." },
        { status: 404 }
      );
    }

    const now = Date.now();
    const isCurrentlyActivePro =
      currentUser.plan === "PRO" &&
      currentUser.planExpiresAt !== null &&
      currentUser.planExpiresAt.getTime() > now;

    // Calculate newExpiry extending from existing active expiration if in future
    const currentExpiryTime =
      currentUser.planExpiresAt && currentUser.planExpiresAt.getTime() > now
        ? currentUser.planExpiresAt.getTime()
        : now;

    const newExpiry = new Date(currentExpiryTime + promo.durationDays * 24 * 60 * 60 * 1000);

    // Prevent downgrading an active 'PRO' user plan to 'TRIAL' / 'FREE'
    const finalPlan = isCurrentlyActivePro && promo.planGranted !== "PRO"
      ? "PRO"
      : promo.planGranted;

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: authResult.user.id },
        data: {
          plan: finalPlan,
          planExpiresAt: newExpiry,
          aiCredits: { increment: promo.creditsGranted },
        },
        select: {
          id: true,
          plan: true,
          planExpiresAt: true,
          aiCredits: true,
        },
      }),
      prisma.promoCode.update({
        where: { id: promo.id },
        data: { timesUsed: { increment: 1 } },
      }),
      prisma.userPromoRedemption.create({
        data: {
          userId: authResult.user.id,
          promoCodeId: promo.id,
        },
      }),
    ]);

    const successMessage = isCurrentlyActivePro && promo.planGranted !== "PRO"
      ? `تم تفعيل الكود بنجاح! تم تمديد اشتراكك وإضافة ${promo.creditsGranted} رصيد AI.`
      : `تم تفعيل الكود بنجاح! تم ترقية حسابك إلى خطة ${finalPlan} وإضافة ${promo.creditsGranted} رصيد AI.`;

    return NextResponse.json(
      {
        success: true,
        message: successMessage,
        plan: updatedUser.plan,
        planExpiresAt: updatedUser.planExpiresAt,
        creditsGranted: promo.creditsGranted,
        totalCredits: updatedUser.aiCredits,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/promo/redeem Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء تفعيل الكود. يرجى المحاولة لاحقاً." },
      { status: 500 }
    );
  }
}
