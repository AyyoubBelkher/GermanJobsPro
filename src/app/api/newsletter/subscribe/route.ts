import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkRateLimit(req, AUTH_RATE_LIMITS.NEWSLETTER);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "الرجاء إدخال البريد الإلكتروني بشكل صحيح." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "الرجاء إدخال عنوان بريد إلكتروني صالح." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingSubscriber) {
      if (!existingSubscriber.active) {
        const updated = await prisma.subscriber.update({
          where: { id: existingSubscriber.id },
          data: { active: true },
        });
        return NextResponse.json(
          {
            message: "تم إعادة تفعيل اشتراكك في النشرة البريدية بنجاح! 🎉",
            alreadySubscribed: true,
            subscriber: updated,
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          message: "أنت مشترك بالفعل في النشرة البريدية! 📬",
          alreadySubscribed: true,
          subscriber: existingSubscriber,
        },
        { status: 200 }
      );
    }

    // Create new subscriber
    const newSubscriber = await prisma.subscriber.create({
      data: {
        email: trimmedEmail,
        active: true,
      },
    });

    return NextResponse.json(
      {
        message: "تم الاشتراك بنجاح في النشرة البريدية! 🎉",
        subscriber: newSubscriber,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[Newsletter Subscribe API Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
