import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/session";

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
  try {
    const body = await req.json().catch(() => ({}));
    const emailRaw = body.email;
    const token = body.token;

    if (!emailRaw || typeof emailRaw !== "string") {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال البريد الإلكتروني." },
        { status: 400 }
      );
    }

    const email = emailRaw.trim().toLowerCase();

    if (!token || typeof token !== "string" || token.trim() === "") {
      return NextResponse.json(
        { success: false, error: "رمز إلغاء الاشتراك غير صالِح" },
        { status: 403 }
      );
    }

    const isValid = await verifyUnsubscribeToken(email, token.trim());
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "رمز إلغاء الاشتراك غير صالِح" },
        { status: 403 }
      );
    }

    const existing = await prisma.subscriber.findUnique({
      where: { email },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "هذا البريد الإلكتروني غير مسجل في النشرة البريدية." },
        { status: 404 }
      );
    }

    await prisma.subscriber.delete({
      where: { email },
    });

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


