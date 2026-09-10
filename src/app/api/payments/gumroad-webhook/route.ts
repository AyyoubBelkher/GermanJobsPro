import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface GumroadPingPayload {
  email: string;
  userId?: string | null;
  refunded: boolean;
  disputed: boolean;
  price?: string | null;
  saleId?: string | null;
  orderNumber?: string | null;
}

/**
 * POST /api/payments/gumroad-webhook
 * 
 * Listens for POST requests sent by Gumroad's Ping service (content-type: application/x-www-form-urlencoded).
 * Integrates Gumroad as Merchant of Record for GermanJobsPro PRO PASS ($9.99).
 *
 * Database: Neon PostgreSQL via Prisma ORM (GermanJobsPro data layer).
 * Locates user via custom_fields[userId] first, falling back to email.
 * Updates subscriptionPlan, subscriptionStatus, subscriptionExpiresAt, dailyAiCredits, updatedAt,
 * as well as the application's native plan and planExpiresAt fields.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const contentType = request.headers.get("content-type") || "";

    let email = "";
    let userId: string | null = null;
    let refundedStr = "false";
    let disputedStr = "false";
    let priceStr = "";
    let saleId: string | null = null;
    let orderNumber: string | null = null;

    if (contentType.includes("application/json")) {
      try {
        const json = JSON.parse(rawBody || "{}");
        email = typeof json.email === "string" ? json.email.trim() : "";
        userId =
          json["custom_fields[userId]"] ||
          json.custom_fields?.userId ||
          json.custom_fields?.user_id ||
          json.userId ||
          null;
        refundedStr = String(json.refunded ?? "false");
        disputedStr = String(json.disputed ?? "false");
        priceStr = String(json.price ?? "");
        saleId = json.sale_id || json.id || null;
        orderNumber = json.order_number || null;
      } catch {
        // Fall back to url search params
      }
    }

    if (!email) {
      const params = new URLSearchParams(rawBody);
      email = params.get("email")?.trim() || "";
      userId =
        params.get("custom_fields[userId]") ||
        params.get("custom_fields[user_id]") ||
        params.get("userId") ||
        null;

      if (!userId && params.get("custom_fields")) {
        try {
          const parsed = JSON.parse(params.get("custom_fields") || "{}");
          userId = parsed.userId || parsed.user_id || null;
        } catch {
          // ignore parsing error
        }
      }

      refundedStr = params.get("refunded") || "false";
      disputedStr = params.get("disputed") || "false";
      priceStr = params.get("price") || "";
      saleId = params.get("sale_id") || null;
      orderNumber = params.get("order_number") || null;
    }

    const isRefunded = refundedStr.toLowerCase() === "true";
    const isDisputed = disputedStr.toLowerCase() === "true";

    console.log("[Gumroad Webhook Received]", {
      email,
      userId,
      refunded: isRefunded,
      disputed: isDisputed,
      price: priceStr,
      saleId,
      orderNumber,
    });

    // Locate the user: custom_fields[userId] first, falling back to email
    let user = null;

    if (userId && typeof userId === "string" && userId.trim()) {
      user = await prisma.user.findUnique({
        where: { id: userId.trim() },
      });
    }

    if (!user && email && typeof email === "string" && email.trim()) {
      user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
    }

    // Handle refund or dispute: downgrade or deactivate PRO status
    if (isRefunded || isDisputed) {
      if (user) {
        const now = new Date();
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionPlan: "free",
            subscriptionStatus: isRefunded ? "refunded" : "disputed",
            subscriptionExpiresAt: now,
            plan: "FREE",
            planExpiresAt: now,
            updatedAt: now,
          },
        });

        console.log(
          `[Gumroad Webhook]: Downgraded PRO status for user ${user.id} (${user.email}) due to ${
            isRefunded ? "refund" : "dispute"
          }`
        );
      } else {
        console.warn(
          `[Gumroad Webhook]: Refund/Dispute notification for non-existing user (email: ${email}, userId: ${userId})`
        );
      }

      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Handle successful purchase
    if (user) {
      const now = new Date();
      // Extend 90 days from the current date (or extend from active future date if already subscribed)
      const baseTime =
        user.subscriptionExpiresAt && user.subscriptionExpiresAt.getTime() > now.getTime()
          ? user.subscriptionExpiresAt.getTime()
          : user.planExpiresAt && user.planExpiresAt.getTime() > now.getTime()
          ? user.planExpiresAt.getTime()
          : now.getTime();

      const ninetyDaysFromDate = new Date(baseTime + 90 * 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionPlan: "pro",
          subscriptionStatus: "active",
          subscriptionExpiresAt: ninetyDaysFromDate,
          dailyAiCredits: 20,
          dailyAiCreditsUsed: 0,
          plan: "PRO",
          planExpiresAt: ninetyDaysFromDate,
          updatedAt: new Date(),
        },
      });

      console.log(
        `[Gumroad Webhook]: User ${user.email} (ID: ${user.id}) upgraded to PRO PASS until ${ninetyDaysFromDate.toISOString()}`
      );
    } else {
      console.warn(
        `[Gumroad Webhook]: Purchase received or test ping verified without matching user in DB (email: "${email}", userId: "${userId}")`
      );
    }

    // Always return 200 OK to satisfy Gumroad's Ping verification check
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("[Gumroad Webhook Error]:", error instanceof Error ? error.message : error);
    // Returning 200 ensures Gumroad does not disable the Ping webhook during verification or unexpected network hiccups
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json(
    { received: true, message: "Gumroad Ping Webhook endpoint is active." },
    { status: 200 }
  );
}
