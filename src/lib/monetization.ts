import { prisma } from "@/lib/prisma";

export const DAILY_PRO_LIMIT = 20;

export interface AiCreditResult {
  success: boolean;
  isPro: boolean;
  remainingCredits?: number;
  dailyRemaining?: number;
  error?: string;
}

/**
 * Checks whether a date belongs to a previous day or is > 24 hours old compared to now.
 */
function shouldResetDailyQuota(lastReset: Date, now: Date = new Date()): boolean {
  const isDifferentDay =
    now.getFullYear() !== lastReset.getFullYear() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getDate() !== lastReset.getDate();
  const isOlderThan24Hours = now.getTime() - lastReset.getTime() >= 24 * 60 * 60 * 1000;
  return isDifferentDay || isOlderThan24Hours;
}

/**
 * Atomically reserves/decrements 1 AI credit for a user if they have credits available,
 * or enforces the daily fair-use quota (DAILY_PRO_LIMIT) if user has an active PRO subscription.
 * Prevents race conditions with concurrent requests.
 */
export async function consumeAiCredit(
  userId: string
): Promise<AiCreditResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      planExpiresAt: true,
      aiCredits: true,
      dailyAiCreditsUsed: true,
      lastCreditResetAt: true,
    },
  });

  if (!user) {
    return { success: false, isPro: false, error: "User not found" };
  }

  const isPro = user.plan === "PRO" && (!user.planExpiresAt || user.planExpiresAt > new Date());

  if (isPro) {
    const now = new Date();
    let currentDailyUsed = user.dailyAiCreditsUsed ?? 0;

    // Reset quota if last reset was on a previous day or > 24h ago
    if (shouldResetDailyQuota(user.lastCreditResetAt ?? new Date(0), now)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          dailyAiCreditsUsed: 0,
          lastCreditResetAt: now,
        },
      });
      currentDailyUsed = 0;
    }

    if (currentDailyUsed >= DAILY_PRO_LIMIT) {
      return {
        success: false,
        isPro: true,
        dailyRemaining: 0,
        error: "لقد استنفدت حد الاستخدام اليومي العادل (20 طلباً في اليوم). سيتجدد رصيدك تلقائياً غداً ⏳",
      };
    }

    // Atomic increment of dailyAiCreditsUsed
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        dailyAiCreditsUsed: { increment: 1 },
      },
      select: { dailyAiCreditsUsed: true },
    });

    const dailyRemaining = Math.max(0, DAILY_PRO_LIMIT - updated.dailyAiCreditsUsed);
    return { success: true, isPro: true, dailyRemaining };
  }

  // Atomic decrement for FREE / TRIAL: Only decrements if aiCredits > 0
  const updated = await prisma.user.updateMany({
    where: {
      id: userId,
      aiCredits: { gt: 0 },
    },
    data: {
      aiCredits: { decrement: 1 },
    },
  });

  if (updated.count === 0) {
    return {
      success: false,
      isPro: false,
      error: "نفد رصيد الذكاء الاصطناعي الخاص بك. يرجى الترقية إلى Pro أو إدخال كود ترويجي.",
    };
  }

  const refreshed = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiCredits: true },
  });

  return { success: true, isPro: false, remainingCredits: refreshed?.aiCredits };
}

/**
 * Refunds 1 AI credit (or restores 1 daily fair-use credit for PRO users) if downstream AI generation fails unexpectedly.
 */
export async function refundAiCredit(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true, dailyAiCreditsUsed: true },
    });

    if (!user) return;

    const isPro = user.plan === "PRO" && (!user.planExpiresAt || user.planExpiresAt > new Date());

    if (isPro) {
      if (user.dailyAiCreditsUsed > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            dailyAiCreditsUsed: { decrement: 1 },
          },
        });
      }
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        aiCredits: { increment: 1 },
      },
    });
  } catch (err) {
    console.error("[refundAiCredit Error]:", err);
  }
}
