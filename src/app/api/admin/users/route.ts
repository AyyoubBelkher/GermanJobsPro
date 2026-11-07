import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

async function isAuthorizedAdmin(request: NextRequest): Promise<boolean> {
  const admin = await requireAdmin(request);
  return Boolean(admin);
}

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  plan: true,
  planExpiresAt: true,
  emailVerified: true,
  aiCredits: true,
  customerId: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      cvs: true,
      coverLetters: true,
    },
  },
} as const;

/**
 * GET /api/admin/users
 * Returns platform statistics and the complete list of users ordered by creation date descending.
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await isAuthorizedAdmin(request))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [totalUsers, proUsers, totalAiCreditsAgg, totalJobs, totalCvs, totalCoverLetters, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          plan: { in: ["PRO", "SPRINT"] },
          OR: [
            { planExpiresAt: null },
            { planExpiresAt: { gt: new Date() } },
          ],
        },
      }),
      prisma.user.aggregate({
        _sum: {
          aiCredits: true,
        },
      }),
      prisma.job.count({
        where: { status: "ACTIVE" },
      }),
      prisma.cv.count(),
      prisma.coverLetter.count(),
      prisma.user.findMany({
        select: USER_SELECT,
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const totalAiCredits = totalAiCreditsAgg._sum.aiCredits ?? 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        proUsers,
        totalAiCredits,
        totalJobs,
        totalCvs,
        totalCoverLetters,
      },
      users,
    });
  } catch (error: unknown) {
    console.error("[Admin Users GET Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Handles instant admin actions on users (toggling PRO plan, adding +50 credits).
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthorizedAdmin(request))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const { action, userId } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    let updatedUser;
    let message = "";

    const normalizedAction = String(action || "").toLowerCase().trim();

    switch (normalizedAction) {
      case "upgrade_sprint":
      case "sprint": {
        const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "SPRINT",
            planExpiresAt: thirtyDaysLater,
            aiCredits: {
              increment: 50,
            },
          },
          select: USER_SELECT,
        });
        message = `تمت ترقية حساب ${existingUser.email} إلى باقة SPRINT (30 يوماً) وإضافة +50 رصيد AI بنجاح.`;
        break;
      }

      case "upgrade_pro":
      case "pro": {
        const ninetyDaysLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "PRO",
            planExpiresAt: ninetyDaysLater,
            aiCredits: {
              increment: 100,
            },
          },
          select: USER_SELECT,
        });
        message = `تمت ترقية حساب ${existingUser.email} إلى باقة PRO (90 يوماً) وإضافة +100 رصيد AI بنجاح.`;
        break;
      }

      case "downgrade_free":
      case "free": {
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "FREE",
            planExpiresAt: null,
          },
          select: USER_SELECT,
        });
        message = `تم تحويل حساب ${existingUser.email} إلى الخطة المجانية (FREE).`;
        break;
      }

      case "verify_email": {
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            emailVerified: true,
          },
          select: USER_SELECT,
        });
        message = `تم تفعيل البريد الإلكتروني للمستخدم ${existingUser.email} يدوياً بنجاح.`;
        break;
      }

      case "toggle_pro": {
        const isCurrentlyPro =
          (existingUser.plan === "PRO" || existingUser.plan === "SPRINT") &&
          (!existingUser.planExpiresAt || existingUser.planExpiresAt > new Date());

        if (isCurrentlyPro) {
          // Switch to FREE
          updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
              plan: "FREE",
              planExpiresAt: null,
            },
            select: USER_SELECT,
          });
          message = `تم تحويل حساب ${existingUser.email} إلى الخطة المجانية (FREE)`;
        } else {
          // Switch to PRO for 90 days
          const ninetyDaysLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
          updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
              plan: "PRO",
              planExpiresAt: ninetyDaysLater,
              aiCredits: {
                increment: 100,
              },
            },
            select: USER_SELECT,
          });
          message = `تمت ترقية حساب ${existingUser.email} إلى خطة PRO بنجاح (90 يوماً)`;
        }
        break;
      }

      case "add_credits":
      case "increment_credits": {
        const amount = typeof body.amount === "number" && body.amount > 0 ? body.amount : 50;
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            aiCredits: {
              increment: amount,
            },
          },
          select: USER_SELECT,
        });
        message = `تمت إضافة +${amount} رصيد AI للمستخدم ${existingUser.email}. الرصيد الإجمالي: ${updatedUser.aiCredits}`;
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `الإجراء غير مدعوم: "${action}"` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message,
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("[Admin Users POST Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  return POST(request);
}

export async function PUT(request: NextRequest) {
  return POST(request);
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAuthorizedAdmin(request))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let userId = searchParams.get("userId") || searchParams.get("id");

    if (!userId) {
      const body = await request.json().catch(() => ({}));
      userId = body.userId || body.id;
    }

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: `User ${existingUser.email} deleted successfully.`,
    });
  } catch (error: unknown) {
    console.error("[Admin Users DELETE Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
