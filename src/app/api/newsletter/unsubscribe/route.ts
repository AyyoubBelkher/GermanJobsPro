import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/session";
import { checkRateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const emailRaw = url.searchParams.get("email");
    const token = url.searchParams.get("token");

    if (!emailRaw || typeof emailRaw !== "string" || !token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "رمز إلغاء الاشتراك غير صالِح" },
        { status: 403 }
      );
    }

    const email = emailRaw.trim().toLowerCase();

    const isValid = await verifyUnsubscribeToken(email, token);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "رمز إلغاء الاشتراك غير صالِح" },
        { status: 403 }
      );
    }

    const existing = await prisma.subscriber.findUnique({
      where: { email },
    });

    return NextResponse.json(
      { success: true, subscribed: !!existing },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Unsubscribe GET API Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkRateLimit(req, AUTH_RATE_LIMITS.PASSWORD_RESET);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const emailRaw = body?.email;
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!emailRaw || typeof emailRaw !== "string") {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال البريد الإلكتروني." },
        { status: 400 }
      );
    }

    const normalizedEmail = emailRaw.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال بريد إلكتروني صالح." },
        { status: 400 }
      );
    }

    if (token) {
      const isValid = await verifyUnsubscribeToken(normalizedEmail, token);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "رمز إلغاء الاشتراك غير صالِح" },
          { status: 403 }
        );
      }
    }

    const existing = await prisma.subscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      await prisma.subscriber.delete({
        where: { email: normalizedEmail },
      });
    }

    return NextResponse.json(
      { success: true, message: "تم إلغاء اشتراكك بنجاح ✅" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Unsubscribe POST API Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


