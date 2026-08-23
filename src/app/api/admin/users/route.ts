import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session";

async function isAuthorizedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;
  return Boolean(sessionToken && (await verifySessionToken(sessionToken)));
}

/**
 * GET /api/admin/users
 * Returns platform statistics and the complete list of users ordered by creation date descending.
 */
export async function GET() {
  try {
    if (!(await isAuthorizedAdmin())) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [totalUsers, proUsers, totalAiCreditsAgg, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          plan: "PRO",
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
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          planExpiresAt: true,
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
        },
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
    if (!(await isAuthorizedAdmin())) {
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

    switch (action) {
      case "toggle_pro":
      case "TOGGLE_PRO": {
        const isCurrentlyPro =
          existingUser.plan === "PRO" &&
          (!existingUser.planExpiresAt || existingUser.planExpiresAt > new Date());

        if (isCurrentlyPro) {
          // Switch to FREE
          updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
              plan: "FREE",
              planExpiresAt: null,
            },
            select: {
              id: true,
              email: true,
              name: true,
              plan: true,
              planExpiresAt: true,
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
            },
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
            },
            select: {
              id: true,
              email: true,
              name: true,
              plan: true,
              planExpiresAt: true,
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
            },
          });
          message = `تمت ترقية حساب ${existingUser.email} إلى خطة PRO بنجاح (90 يوماً)`;
        }
        break;
      }

      case "add_credits":
      case "ADD_CREDITS":
      case "increment_credits": {
        const amount = typeof body.amount === "number" && body.amount > 0 ? body.amount : 50;
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            aiCredits: {
              increment: amount,
            },
          },
          select: {
            id: true,
            email: true,
            name: true,
            plan: true,
            planExpiresAt: true,
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
          },
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
    if (!(await isAuthorizedAdmin())) {
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
