import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserSession } from "@/lib/user-session";

/**
 * POST /api/payments/checkout
 * Initiates a checkout session for GermanJobsPro PRO PASS ($9.99 USD / 90-day application cycle).
 * Points directly to the verified Gumroad product checkout URL with user email prefilled.
 */
export async function POST(req?: NextRequest) {
  try {
    let token = req?.cookies.get("user_session")?.value;
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get("user_session")?.value;
      } catch {
        // Fallback for execution outside request scope
      }
    }
    const authResult = await verifyUserSession(token);

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول لمتابعة عملية الدفع." },
        { status: 401 }
      );
    }

    // Check if variant/version parameter was passed
    let variantName = "";
    if (req) {
      try {
        const url = new URL(req.url);
        variantName = url.searchParams.get("variant") || url.searchParams.get("Version") || "";
        if (!variantName && req.headers.get("content-type")?.includes("application/json")) {
          const body = await req.json().catch(() => ({}));
          variantName = body.variant || body.Version || "";
        }
      } catch {
        // ignore
      }
    }

    // Construct Gumroad Checkout URL with prefilled user email and optional variant
    const baseUrl =
      process.env.NEXT_PUBLIC_GUMROAD_PRODUCT_URL ||
      "https://germanjobspro.gumroad.com/l/pro-pass";

    const params = new URLSearchParams();
    if (variantName) {
      params.set("variant", variantName);
      params.set("Version", variantName);
      params.set("wanted", "true");
    }
    params.set("email", authResult.user.email);
    params.set("custom_fields[userId]", authResult.user.id);

    const gumroadCheckoutUrl = `${baseUrl}?${params.toString()}`;

    return NextResponse.json({
      success: true,
      checkoutUrl: gumroadCheckoutUrl,
      provider: "gumroad",
    });
  } catch (error: unknown) {
    console.error("[POST /api/payments/checkout Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء تجهيز صفحة الدفع. يرجى المحاولة لاحقاً." },
      { status: 500 }
    );
  }
}

export async function GET(req?: NextRequest) {
  return POST(req);
}
