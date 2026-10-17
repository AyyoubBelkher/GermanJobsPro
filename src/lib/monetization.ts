import { prisma } from "@/lib/prisma";

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export const DAILY_LIMIT = 20;
export const DAILY_PRO_LIMIT = 20;

export interface CanUseAiResult {
  allowed: boolean;
  isPaid?: boolean;
  usedToday?: number;
  dailyLimit?: number;
  remainingToday?: number;
  remainingCredits?: number;
  error?: string;
  // Aliases for compatibility
  requestsToday?: number;
  limit?: number;
  dailyRemaining?: number;
  resetsAt?: Date;
  reason?: string;
}

export interface AiCreditResult {
  success: boolean;
  allowed: boolean;
  isPro: boolean;
  isPaid: boolean;
  usedToday?: number;
  dailyLimit?: number;
  remainingToday?: number;
  remainingCredits?: number;
  error?: string;
  // Aliases for compatibility
  requestsToday?: number;
  limit?: number;
  dailyRemaining?: number;
  resetsAt?: Date;
  reason?: string;
}

/**
 * Checks whether a user is an active paid subscriber (PRO or SPRINT).
 */
export function isPaidUser(user: {
  plan: string;
  planExpiresAt?: Date | string | null;
}): boolean {
  return Boolean(
    (user.plan === "PRO" || user.plan === "SPRINT") &&
    user.planExpiresAt &&
    new Date(user.planExpiresAt) > new Date()
  );
}

/**
 * Calculates start of the current calendar day (00:00:00) and the reset timestamp (next 00:00:00).
 */
export function getDailyQuotaWindow(): { startOfToday: Date; resetsAt: Date } {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const resetsAt = new Date();
  resetsAt.setHours(24, 0, 0, 0);

  return { startOfToday, resetsAt };
}

/**
 * Checks if a user is allowed to perform an AI request without decrementing credits.
 */
export async function canUseAi(userId: string): Promise<CanUseAiResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, plan: true, planExpiresAt: true, aiCredits: true }
  });
  if (!user) return { allowed: false, error: "User not found" };

  const isPaidActive = (user.plan === "PRO" || user.plan === "SPRINT") &&
                       user.planExpiresAt && user.planExpiresAt > new Date();

  if (isPaidActive) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const usedToday = await prisma.aiUsage.count({
      where: {
        userId: user.id,
        success: true,
        createdAt: { gte: startOfToday }
      }
    });

    const DAILY_LIMIT = 20;
    if (usedToday >= DAILY_LIMIT) {
      const resetsAt = new Date();
      resetsAt.setHours(24, 0, 0, 0);

      return {
        allowed: false,
        isPaid: true,
        usedToday,
        dailyLimit: DAILY_LIMIT,
        remainingToday: 0,
        requestsToday: usedToday,
        limit: DAILY_LIMIT,
        dailyRemaining: 0,
        resetsAt,
        reason: "DAILY_LIMIT_REACHED",
        error: "DAILY_LIMIT_REACHED"
      };
    }

    const remainingToday = DAILY_LIMIT - usedToday;
    return {
      allowed: true,
      isPaid: true,
      usedToday,
      dailyLimit: DAILY_LIMIT,
      remainingToday,
      requestsToday: usedToday,
      limit: DAILY_LIMIT,
      dailyRemaining: remainingToday,
    };
  }

  // If FREE or Expired:
  if (user.aiCredits <= 0) {
    return {
      allowed: false,
      isPaid: false,
      remainingCredits: 0,
      reason: "NO_CREDITS",
      error: "NO_CREDITS",
    };
  }

  return {
    allowed: true,
    isPaid: false,
    remainingCredits: user.aiCredits,
  };
}

/**
 * Consumes/authorizes an AI request:
 * - For PAID users (PRO or SPRINT with active planExpiresAt):
 *   Checks that successful requests today < 20 via prisma.aiUsage.
 *   Does NOT decrement user.aiCredits to zero (keeps it untouched).
 * - For FREE or Expired users:
 *   Requires user.aiCredits > 0 and atomically decrements user.aiCredits by 1.
 */
export async function consumeAiCredit(
  userId: string
): Promise<AiCreditResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, plan: true, planExpiresAt: true, aiCredits: true }
  });
  if (!user) {
    return {
      success: false,
      allowed: false,
      isPro: false,
      isPaid: false,
      error: "User not found"
    };
  }

  const isPaidActive = (user.plan === "PRO" || user.plan === "SPRINT") &&
                       user.planExpiresAt && user.planExpiresAt > new Date();

  if (isPaidActive) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const usedToday = await prisma.aiUsage.count({
      where: {
        userId: user.id,
        success: true,
        createdAt: { gte: startOfToday }
      }
    });

    const DAILY_LIMIT = 20;
    if (usedToday >= DAILY_LIMIT) {
      const resetsAt = new Date();
      resetsAt.setHours(24, 0, 0, 0);

      return {
        success: false,
        allowed: false,
        isPro: true,
        isPaid: true,
        usedToday,
        dailyLimit: DAILY_LIMIT,
        remainingToday: 0,
        requestsToday: usedToday,
        limit: DAILY_LIMIT,
        dailyRemaining: 0,
        resetsAt,
        reason: "DAILY_LIMIT_REACHED",
        error: "DAILY_LIMIT_REACHED"
      };
    }

    // For paid active users: do NOT decrement aiCredits to zero (keep it untouched)
    const remainingToday = Math.max(0, DAILY_LIMIT - (usedToday + 1));
    return {
      success: true,
      allowed: true,
      isPro: true,
      isPaid: true,
      usedToday: usedToday + 1,
      dailyLimit: DAILY_LIMIT,
      remainingToday,
      requestsToday: usedToday + 1,
      limit: DAILY_LIMIT,
      dailyRemaining: remainingToday,
    };
  }

  // If FREE or Expired:
  // Require user.aiCredits > 0 and atomically decrement user.aiCredits by 1
  const updated = await prisma.user.updateMany({
    where: {
      id: userId,
      aiCredits: { gt: 0 }
    },
    data: {
      aiCredits: { decrement: 1 }
    }
  });

  if (updated.count === 0) {
    return {
      success: false,
      allowed: false,
      isPro: false,
      isPaid: false,
      reason: "NO_CREDITS",
      remainingCredits: 0,
      error: "NO_CREDITS"
    };
  }

  const refreshed = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiCredits: true }
  });

  const remaining = refreshed?.aiCredits ?? 0;
  return {
    success: true,
    allowed: true,
    isPro: false,
    isPaid: false,
    remainingCredits: remaining
  };
}

/**
 * Refunds 1 AI credit if downstream AI generation fails unexpectedly.
 * - For PAID users: Requests are tracked via successful AiUsage entries.
 *   Failed operations log success: false and are not counted towards the 20 daily limit.
 *   Hence, no counter is corrupted and no balance needs refunding.
 * - For FREE users: Restores the single decremented static credit.
 */
export async function refundAiCredit(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true }
    });

    if (!user) return;

    const isPaidActive = Boolean(
      (user.plan === "PRO" || user.plan === "SPRINT") &&
      user.planExpiresAt &&
      user.planExpiresAt > new Date()
    );

    // Paid active users: if an AI call fails, mark success: false on the most recent
    // AiUsage record created for that userId within the last 2 minutes, ensuring failed AI calls
    // never count against a paid user's 20/day quota.
    if (isPaidActive) {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const recentUsage = await prisma.aiUsage.findFirst({
        where: {
          userId,
          createdAt: { gte: twoMinutesAgo },
          success: true,
        },
        orderBy: { createdAt: "desc" },
      });

      if (recentUsage) {
        await prisma.aiUsage.update({
          where: { id: recentUsage.id },
          data: { success: false },
        });
      }
      return;
    }

    // For FREE or expired users, restore the single decremented credit
    await prisma.user.update({
      where: { id: userId },
      data: {
        aiCredits: { increment: 1 }
      }
    });
  } catch (err) {
    console.error("[refundAiCredit Error]:", err);
  }
}

export interface DeductCreditOptions {
  userId: string;
  operation: string;
  model?: string;
  requiredCredits?: number;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
}

export interface DeductCreditResult {
  success: boolean;
  allowed: boolean;
  isPaid: boolean;
  isPro?: boolean;
  remainingCredits?: number;
  error?: string;
  code?: string;
}

/**
 * Atomically verifies user credits/quotas, deducts credit (or tracks daily quota),
 * and creates an AiUsage record within an existing Prisma transaction.
 * Returns failure with code "INSUFFICIENT_CREDITS" if credits are depleted.
 */
export async function deductCreditInTx(
  tx: TransactionClient,
  opts: DeductCreditOptions
): Promise<DeductCreditResult> {
  const user = await tx.user.findUnique({
    where: { id: opts.userId },
    select: { id: true, plan: true, planExpiresAt: true, aiCredits: true },
  });

  if (!user) {
    return {
      success: false,
      allowed: false,
      isPaid: false,
      error: "User not found",
      code: "USER_NOT_FOUND",
    };
  }

  const isPaidActive = isPaidUser(user);

  if (isPaidActive) {
    const { startOfToday } = getDailyQuotaWindow();
    const usedToday = await tx.aiUsage.count({
      where: {
        userId: user.id,
        success: true,
        createdAt: { gte: startOfToday },
      },
    });

    if (usedToday >= DAILY_PRO_LIMIT) {
      return {
        success: false,
        allowed: false,
        isPaid: true,
        isPro: true,
        remainingCredits: 0,
        error: "DAILY_LIMIT_REACHED",
        code: "INSUFFICIENT_CREDITS",
      };
    }

    await tx.aiUsage.create({
      data: {
        userId: user.id,
        operation: opts.operation,
        model: opts.model || process.env.GEMINI_MODEL || "gemini-1.5-flash",
        inputTokens: opts.inputTokens ?? null,
        outputTokens: opts.outputTokens ?? null,
        latencyMs: opts.latencyMs ? Math.round(opts.latencyMs) : null,
        success: true,
      },
    });

    return {
      success: true,
      allowed: true,
      isPaid: true,
      isPro: true,
      remainingCredits: Math.max(0, DAILY_PRO_LIMIT - (usedToday + 1)),
    };
  }

  // Free or expired plan:
  const required = opts.requiredCredits ?? 1;
  if (user.aiCredits < required) {
    return {
      success: false,
      allowed: false,
      isPaid: false,
      isPro: false,
      remainingCredits: user.aiCredits,
      error: "INSUFFICIENT_CREDITS",
      code: "INSUFFICIENT_CREDITS",
    };
  }

  const updatedUser = await tx.user.update({
    where: { id: user.id },
    data: {
      aiCredits: { decrement: required },
    },
    select: { aiCredits: true },
  });

  await tx.aiUsage.create({
    data: {
      userId: user.id,
      operation: opts.operation,
      model: opts.model || process.env.GEMINI_MODEL || "gemini-1.5-flash",
      inputTokens: opts.inputTokens ?? null,
      outputTokens: opts.outputTokens ?? null,
      latencyMs: opts.latencyMs ? Math.round(opts.latencyMs) : null,
      success: true,
    },
  });

  return {
    success: true,
    allowed: true,
    isPaid: false,
    isPro: false,
    remainingCredits: updatedUser.aiCredits,
  };
}

/**
 * Helper to execute atomic credit deduction inside a self-managed transaction.
 */
export async function deductAiCreditAtomic(
  opts: DeductCreditOptions
): Promise<DeductCreditResult> {
  return await prisma.$transaction(async (tx) => {
    return await deductCreditInTx(tx, opts);
  });
}

