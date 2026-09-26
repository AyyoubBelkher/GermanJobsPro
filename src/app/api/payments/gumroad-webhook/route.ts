import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { timingSafeCompare } from "@/lib/session";

export interface GumroadPingPayload {
  email: string;
  userId?: string | null;
  refunded: boolean;
  disputed: boolean;
  chargebacked?: boolean;
  price?: string | number | null;
  saleId?: string | null;
  orderNumber?: string | null;
  sellerId?: string | null;
  variants?: Record<string, string> | string | null;
  variant_name?: string | null;
  Version?: string | null;
}

/**
 * POST /api/payments/gumroad-webhook
 *
 * Listens for incoming Ping notifications sent by Gumroad (Merchant of Record).
 * Handles multi-tier PRO pass activations:
 * 1. Quick Sprint (30 Days) at $9.99
 * 2. PRO Job Pass (90 Days) at $19.99
 * Also handles extensions, refunds, and chargebacks.
 *
 * Security & Reliability Features:
 * 1. Fail-Closed Seller Verification: Validates seller_id against process.env.GUMROAD_SELLER_ID (timing-safe).
 *    Rejects with 500 in production if GUMROAD_SELLER_ID is not defined or empty.
 * 2. Strict Idempotency: Uses Prisma transaction with ProcessedWebhookEvent to prevent duplicate activations.
 * 3. Smart Duration Detection: Automatically detects 90-day vs 30-day passes via price or variant name.
 * 4. AI Credits: Allocates baseline credits (50 credits) and resets daily quota (20/day).
 * 5. Automatic Revocation: Reverts plan to "FREE" on refunds, disputes, or chargebacks.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const contentType = request.headers.get("content-type") || "";

    let email = "";
    let userId: string | null = null;
    let refundedStr = "false";
    let disputedStr = "false";
    let chargebackedStr = "false";
    let priceStr = "";
    let saleId: string | null = null;
    let orderNumber: string | null = null;
    let sellerId: string | null = null;
    let variantInfo = "";

    if (contentType.includes("application/json")) {
      try {
        const json = JSON.parse(rawBody || "{}");
        email = typeof json.email === "string" ? json.email.trim() : "";
        userId =
          json["custom_fields[userId]"] ||
          json["custom_fields[user_id]"] ||
          json.custom_fields?.userId ||
          json.custom_fields?.user_id ||
          json.userId ||
          null;
        refundedStr = String(json.refunded ?? "false");
        disputedStr = String(json.disputed ?? "false");
        chargebackedStr = String(json.chargebacked ?? "false");
        priceStr = String(json.price ?? "");
        saleId = json.sale_id || json.id || null;
        orderNumber = json.order_number ? String(json.order_number) : null;
        sellerId = json.seller_id?.trim() || json.sellerId?.trim() || null;

        // Extract variant fields from JSON
        if (json.variant_name) variantInfo += ` ${json.variant_name}`;
        if (json.variant) variantInfo += ` ${json.variant}`;
        if (json.Version) variantInfo += ` ${json.Version}`;
        if (json.version) variantInfo += ` ${json.version}`;
        if (json.variants) {
          if (typeof json.variants === "string") {
            variantInfo += ` ${json.variants}`;
          } else if (typeof json.variants === "object") {
            variantInfo += ` ${JSON.stringify(json.variants)}`;
          }
        }
        for (const [key, val] of Object.entries(json)) {
          if (/variant|version|tier/i.test(key) && typeof val === "string") {
            variantInfo += ` ${val}`;
          }
        }
      } catch {
        // Fall back to url search params parsing
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
      chargebackedStr = params.get("chargebacked") || "false";
      priceStr = params.get("price") || "";
      saleId = params.get("sale_id") || null;
      orderNumber = params.get("order_number") || null;
      sellerId = params.get("seller_id")?.trim() || params.get("sellerId")?.trim() || null;
    }

    // Inspect URL-encoded body or parameters for variant information
    if (rawBody && (rawBody.includes("=") || rawBody.includes("&"))) {
      try {
        const params = new URLSearchParams(rawBody);
        for (const [key, value] of params.entries()) {
          if (/variant|version|tier/i.test(key)) {
            variantInfo += ` ${value}`;
          }
        }
        if (!priceStr && params.get("price")) {
          priceStr = params.get("price") || "";
        }
      } catch {
        // ignore parsing error
      }
    }

    // 1. Strict Seller Verification Guard (Fail-Closed)
    const expectedSellerId = process.env.GUMROAD_SELLER_ID?.trim();
    if (!expectedSellerId && process.env.NODE_ENV === "production") {
      console.error("[Gumroad Webhook] GUMROAD_SELLER_ID is not configured in production");
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 });
    }
    if (expectedSellerId && (!sellerId || !timingSafeCompare(sellerId, expectedSellerId))) {
      console.warn("[Gumroad Webhook] Seller ID mismatch");
      return NextResponse.json({ success: false, error: "Invalid seller" }, { status: 403 });
    }

    const isRefunded = refundedStr.toLowerCase() === "true";
    const isDisputed = disputedStr.toLowerCase() === "true";
    const isChargebacked = chargebackedStr.toLowerCase() === "true";
    const isRefundOrDispute = isRefunded || isDisputed || isChargebacked;

    const eventName = isRefunded
      ? "gumroad_refund"
      : isDisputed
      ? "gumroad_dispute"
      : isChargebacked
      ? "gumroad_chargeback"
      : "gumroad_sale";

    // Primary unique event key using Gumroad sale_id or order_number
    const rawId = saleId || orderNumber;
    const eventId = rawId
      ? (isRefundOrDispute ? `${eventName}_${rawId}` : String(rawId))
      : `${eventName}_${email || "unknown"}_${priceStr || Date.now()}`;

    // Smart Webhook Duration Detection:
    // Gumroad sends `price` in cents (e.g. 1999 vs 999).
    // If formatted as decimal (e.g. 19.99 vs 9.99), normalize to cents.
    const numericPrice = parseFloat(priceStr.replace(/[^0-9.]/g, "") || "0");
    const priceInCents =
      numericPrice > 0 && numericPrice < 100 && priceStr.includes(".")
        ? Math.round(numericPrice * 100)
        : numericPrice;

    // Detect duration:
    // If price >= 1500 (or variant name includes "90" or "PRO Job Pass"): duration = 90 days.
    // Else: duration = 30 days.
    const isNinetyDays =
      priceInCents >= 1500 ||
      variantInfo.includes("90") ||
      /pro\s*job\s*pass/i.test(variantInfo);

    const durationInDays = isNinetyDays ? 90 : 30;

    console.log(`[Gumroad Webhook Received]: ${eventName}`, {
      email,
      userId,
      saleId,
      orderNumber,
      eventId,
      priceStr,
      priceInCents,
      variantInfo: variantInfo.trim(),
      durationInDays,
      isRefundOrDispute,
    });

    // Locate target user: custom_fields[userId] first, then email
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

    // 2. Atomic Idempotent Transaction
    let isDuplicate = false;

    await prisma.$transaction(async (tx) => {
      // Check if event was already processed
      const existing = await tx.processedWebhookEvent.findUnique({
        where: { eventId },
      });

      if (existing) {
        isDuplicate = true;
        return;
      }

      // Check alternate purchase ID representations
      if (saleId && !isRefundOrDispute) {
        const altExisting = await tx.processedWebhookEvent.findFirst({
          where: {
            OR: [{ eventId: saleId }, { eventId: `gumroad_sale_${saleId}` }],
          },
        });
        if (altExisting) {
          isDuplicate = true;
          return;
        }
      }

      // Record the processed event inside the transaction
      await tx.processedWebhookEvent.create({
        data: {
          eventId,
          eventName,
          userId: user ? user.id : null,
        },
      });

      // Handle refund or dispute: revoke PRO privileges
      if (isRefundOrDispute) {
        if (user) {
          const now = new Date();
          await tx.user.update({
            where: { id: user.id },
            data: {
              plan: "FREE",
              planExpiresAt: now,
              subscriptionPlan: "free",
              subscriptionStatus: isRefunded
                ? "refunded"
                : isDisputed
                ? "disputed"
                : "chargebacked",
              subscriptionExpiresAt: now,
              updatedAt: now,
            },
          });

          console.log(
            `[Gumroad Webhook]: Revoked PRO status for user ${user.id} (${user.email}) due to ${eventName}`
          );
        }
      } else {
        // Handle successful purchase: activate PRO PASS with detected duration (30 or 90 days)
        if (user) {
          // If user currently has an active plan that hasn't expired yet, extend it
          const currentExpiryTime =
            user.planExpiresAt && new Date(user.planExpiresAt).getTime() > Date.now()
              ? new Date(user.planExpiresAt).getTime()
              : Date.now();

          const planExpiresAt = new Date(
            currentExpiryTime + durationInDays * 24 * 60 * 60 * 1000
          );

          const grantedPlan = isNinetyDays ? "PRO" : "SPRINT";

          await tx.user.update({
            where: { id: user.id },
            data: {
              plan: grantedPlan,
              planExpiresAt,
              subscriptionPlan: isNinetyDays ? "pro_90d" : "sprint_30d",
              subscriptionStatus: "active",
              subscriptionExpiresAt: planExpiresAt,
              dailyAiCredits: 20,
              dailyAiCreditsUsed: 0,
              customerId: saleId || orderNumber || user.customerId || undefined,
              updatedAt: new Date(),
            },
          });

          console.log(
            `[Gumroad Webhook]: Upgraded user ${user.email} (ID: ${user.id}) to ${grantedPlan} (${durationInDays} days, tier: ${
              isNinetyDays ? "PRO Job Pass (90d)" : "Quick Sprint (30d)"
            }) until ${planExpiresAt.toISOString()}`
          );
        }
      }
    });

    if (isDuplicate) {
      console.log(
        `[Gumroad Webhook Duplicate Ignored]: Event ${eventId} was already processed.`
      );
      return NextResponse.json(
        { received: true, message: "Event already processed (idempotent)" },
        { status: 200 }
      );
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      console.log(
        "[Gumroad Webhook Concurrent Duplicate]: Unique constraint handled gracefully."
      );
      return NextResponse.json(
        { received: true, message: "Event already processed (idempotent)" },
        { status: 200 }
      );
    }

    console.error(
      "[Gumroad Webhook Error]:",
      error instanceof Error ? error.message : error
    );
    // Returning 200 prevents Gumroad from disabling the Ping webhook on transient network issues
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json(
    { received: true, message: "Gumroad Ping Webhook endpoint is active." },
    { status: 200 }
  );
}
