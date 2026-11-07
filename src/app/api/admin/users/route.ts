import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { sendEmail, escapeHtml } from "@/lib/email";

async function isAuthorizedAdmin(request: NextRequest): Promise<boolean> {
  const admin = await requireAdmin(request);
  return Boolean(admin);
}

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  googleId: true,
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
  cvs: {
    select: {
      id: true,
      title: true,
      language: true,
      updatedAt: true,
      personalInfo: {
        select: {
          fullName: true,
          targetJobTitle: true,
          photoUrl: true,
          phone: true,
          address: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" as const },
    take: 5,
  },
  coverLetters: {
    select: {
      id: true,
      title: true,
      jobTitle: true,
      companyName: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" as const },
    take: 5,
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

      case "send_email": {
        const { subject, message: emailContent } = body;
        if (!subject || typeof subject !== "string" || !subject.trim()) {
          return NextResponse.json({ success: false, error: "موضوع الرسالة مطلوب." }, { status: 400 });
        }
        if (!emailContent || typeof emailContent !== "string" || !emailContent.trim()) {
          return NextResponse.json({ success: false, error: "نص الرسالة مطلوب." }, { status: 400 });
        }

        const safeSubject = subject.trim();
        const safeMessage = emailContent.trim();
        const userName = existingUser.name || existingUser.email.split("@")[0] || "عضو GermanJobsPro";

        const emailHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(safeSubject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #f8fafc; direction: rtl; text-align: right;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #020617; padding: 35px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <!-- German Flag Top Accent -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #111827 0%, #DC2626 50%, #FBBF24 100%);"></td>
          </tr>
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 15px 30px; text-align: right;">
              <div style="display: inline-block; padding: 8px 16px; background: rgba(37, 99, 235, 0.12); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 12px; margin-bottom: 12px;">
                <span style="font-size: 18px; font-weight: 800; color: #60A5FA; letter-spacing: 0.5px;">GermanJobs<span style="color: #FBBF24;">Pro</span></span>
              </div>
              <h2 style="margin: 10px 0 0 0; font-size: 20px; font-weight: 800; color: #ffffff;">${escapeHtml(safeSubject)}</h2>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: #94a3b8;">رسالة رسمية من إدارة المنصة</p>
            </td>
          </tr>
          <!-- Content Box -->
          <tr>
            <td style="padding: 15px 30px 30px 30px;">
              <div style="background-color: #090e1a; border: 1px solid #1e293b; border-radius: 14px; padding: 22px; color: #e2e8f0; font-size: 14px; line-height: 1.8; white-space: pre-wrap;">
مرحباً ${escapeHtml(userName)}،

${escapeHtml(safeMessage)}
              </div>
              <div style="margin-top: 25px; text-align: center;">
                <a href="https://www.germanjobspro.com" target="_blank" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; border-radius: 12px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                  زيارة منصة GermanJobsPro ←
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 18px 30px; background-color: #080d1a; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.6;">
                فريق GermanJobsPro • بوابة العمل والمهنة في ألمانيا 🇩🇪<br>
                <a href="https://www.germanjobspro.com" style="color: #3b82f6; text-decoration: none;">www.germanjobspro.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        const emailResult = await sendEmail({
          from: "GermanJobsPro <support@germanjobspro.com>",
          to: existingUser.email,
          subject: safeSubject,
          html: emailHtml,
          text: `مرحباً ${userName}،\n\n${safeMessage}\n\nفريق GermanJobsPro\nhttps://www.germanjobspro.com`,
        });

        if (!emailResult.success) {
          return NextResponse.json(
            { success: false, error: emailResult.error || "فشل إرسال البريد الإلكتروني عبر مزود الخدمة." },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "تم إرسال البريد الإلكتروني للمستخدم بنجاح عبر Resend.",
        });
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
