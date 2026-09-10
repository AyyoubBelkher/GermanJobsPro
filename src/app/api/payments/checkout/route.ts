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

    // Construct Gumroad PRO PASS Checkout URL
    const baseUrl = "https://germanjobspro.gumroad.com/l/pro-pass";
    const gumroadCheckoutUrl = `${baseUrl}?email=${encodeURIComponent(
      authResult.user.email
    )}&custom_fields[userId]=${encodeURIComponent(authResult.user.id)}`;

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
