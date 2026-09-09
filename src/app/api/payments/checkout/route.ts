import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserSession } from "@/lib/user-session";

/**
 * POST /api/payments/checkout
 * Initiates a checkout session for GermanJobsPro PRO PASS ($9.99 USD / 90-day application cycle).
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_session")?.value;
    const authResult = await verifyUserSession(token);

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول لمتابعة عملية الدفع." },
        { status: 401 }
      );
    }

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID;

    // If Lemon Squeezy live keys are provided
    if (apiKey && storeId && variantId) {
      const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/vnd.api+json",
          Accept: "application/vnd.api+json",
        },
        body: JSON.stringify({
          data: {
            type: "checkouts",
            attributes: {
              checkout_data: {
                email: authResult.user.email,
                name: authResult.user.name || undefined,
                custom: {
                  user_id: authResult.user.id,
                },
              },
            },
            relationships: {
              store: {
                data: {
                  type: "stores",
                  id: storeId,
                },
              },
              variant: {
                data: {
                  type: "variants",
                  id: variantId,
                },
              },
            },
          },
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        console.error("[Lemon Squeezy API Error]:", errJson);
        throw new Error("Failed to create Lemon Squeezy checkout session");
      }

      const checkoutData = await response.json();
      const checkoutUrl = checkoutData?.data?.attributes?.url;

      return NextResponse.json({
        success: true,
        checkoutUrl,
        mode: "live",
      });
    }

    // Default Fallback / Direct checkout URL or Test simulation
    const directCheckoutUrl =
      process.env.LEMON_SQUEEZY_CHECKOUT_URL ||
      `https://germanjobspro.lemonsqueezy.com/buy/pro-pass?checkout[email]=${encodeURIComponent(
        authResult.user.email
      )}&checkout[custom][user_id]=${encodeURIComponent(authResult.user.id)}`;

    return NextResponse.json({
      success: true,
      checkoutUrl: directCheckoutUrl,
      mode: "fallback",
    });
  } catch (error: unknown) {
    console.error("[POST /api/payments/checkout Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء تجهيز صفحة الدفع. يرجى المحاولة لاحقاً." },
      { status: 500 }
    );
  }
}
