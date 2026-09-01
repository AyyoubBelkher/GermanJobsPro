import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/payments/webhook
 * Handles incoming payment webhook events from Lemon Squeezy to activate PRO subscriptions.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("[Webhook Error]: LEMON_SQUEEZY_WEBHOOK_SECRET is not configured.");
      return NextResponse.json({ success: false, error: "Webhook secret not configured" }, { status: 500 });
    }

    const signature = request.headers.get("x-signature");
    if (!signature) {
      return NextResponse.json({ success: false, error: "Missing signature" }, { status: 401 });
    }

    const hmac = crypto.createHmac("sha256", secret);
    const digest = hmac.update(rawBody).digest("hex");

    const digestBuffer = Buffer.from(digest);
    const signatureBuffer = Buffer.from(signature);

    if (
      digestBuffer.length !== signatureBuffer.length ||
      !crypto.timingSafeEqual(digestBuffer, signatureBuffer)
    ) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload?.meta?.event_name;
    const customData = payload?.meta?.custom_data || payload?.data?.attributes?.custom_data;
    const attributes = payload?.data?.attributes;
    const rawEventId = payload?.data?.id || payload?.meta?.webhook_id || attributes?.first_order_item?.order_id;
    const eventId = String(rawEventId || `${eventName}_${attributes?.user_email}_${attributes?.created_at || ""}`);

    console.log(`[Payment Webhook Received]: ${eventName} (ID: ${eventId})`, {
      userId: customData?.user_id,
      email: attributes?.user_email,
    });

    // Idempotency Check: Prevent duplicate credit increments / extensions if webhook is redelivered
    const existingEvent = await prisma.processedWebhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      console.log(`[Payment Webhook Duplicate Ignored]: Event ${eventId} was already processed.`);
      return NextResponse.json(
        { success: true, message: "Event already processed (idempotent)" },
        { status: 200 }
      );
    }

    const isSuccessEvent =
      eventName === "order_created" ||
      eventName === "subscription_created" ||
      eventName === "subscription_payment_success";

    if (isSuccessEvent) {
      const userId = customData?.user_id;
      const userEmail = attributes?.user_email;
      const customerId = String(payload?.data?.id || attributes?.customer_id || "");

      let targetUser = null;

      if (userId) {
        targetUser = await prisma.user.findUnique({ where: { id: userId } });
      }

      if (!targetUser && userEmail) {
        targetUser = await prisma.user.findUnique({ where: { email: userEmail } });
      }

      if (targetUser) {
        const now = Date.now();
        const baseTime =
          targetUser.planExpiresAt && targetUser.planExpiresAt.getTime() > now
            ? targetUser.planExpiresAt.getTime()
            : now;

        const ninetyDays = new Date(baseTime + 90 * 24 * 60 * 60 * 1000);

        await prisma.$transaction([
          prisma.user.update({
            where: { id: targetUser.id },
            data: {
              plan: "PRO",
              planExpiresAt: ninetyDays,
              aiCredits: { increment: 50 },
              customerId: customerId || undefined,
            },
          }),
          prisma.processedWebhookEvent.create({
            data: {
              eventId,
              eventName,
              userId: targetUser.id,
            },
          }),
        ]);

        console.log(`[Payment Webhook]: User ${targetUser.email} upgraded to PRO until ${ninetyDays.toISOString()} (+50 AI credits)`);
      } else {
        // Record event even if target user not found to prevent replay attacks
        await prisma.processedWebhookEvent.create({
          data: {
            eventId,
            eventName,
            userId: null,
          },
        });
      }
    } else {
      // Record non-success events
      await prisma.processedWebhookEvent.create({
        data: {
          eventId,
          eventName,
          userId: null,
        },
      });
    }

    return NextResponse.json({ success: true, received: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("[Payment Webhook Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
