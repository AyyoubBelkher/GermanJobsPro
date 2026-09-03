import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSupportAlertEmail } from "@/lib/email";
import { checkRateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";

const VALID_CATEGORIES = ["billing", "cv_issue", "general_inquiry", "suggestion"] as const;

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, AUTH_RATE_LIMITS.SUPPORT);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "بيانات الطلب غير صالحة." },
        { status: 400 }
      );
    }

    const { name, email, category, subject, message } = body;

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const trimmedCategory = typeof category === "string" ? category.trim() : "";
    const trimmedSubject = typeof subject === "string" ? subject.trim() : "";
    const trimmedMessage = typeof message === "string" ? message.trim() : "";

    // Validation
    if (!trimmedName || trimmedName.length < 2) {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال اسمك الكريم بشكل صحيح." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال بريد إلكتروني صالح." },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.includes(trimmedCategory as typeof VALID_CATEGORIES[number])) {
      return NextResponse.json(
        { success: false, error: "يرجى اختيار قسم أو تصنيف الاستفسار." },
        { status: 400 }
      );
    }

    if (!trimmedSubject || trimmedSubject.length < 3) {
      return NextResponse.json(
        { success: false, error: "يرجى كتابة عنوان واضح للموضوع (3 أحرف على الأقل)." },
        { status: 400 }
      );
    }

    if (!trimmedMessage || trimmedMessage.length < 10) {
      return NextResponse.json(
        { success: false, error: "يرجى كتابة تفاصيل استفسارك أو اقتراحك (10 أحرف على الأقل)." },
        { status: 400 }
      );
    }

    // Save ticket in Database
    const ticket = await prisma.supportTicket.create({
      data: {
        name: trimmedName,
        email: trimmedEmail,
        category: trimmedCategory,
        subject: trimmedSubject,
        message: trimmedMessage,
        status: "PENDING",
      },
    });

    // Send Alert Email to Admin in background
    try {
      await sendSupportAlertEmail({
        id: ticket.id,
        name: ticket.name,
        email: ticket.email,
        category: ticket.category,
        subject: ticket.subject,
        message: ticket.message,
      });
    } catch (emailError) {
      console.error("[Support Alert Email Dispatch Error]:", emailError);
      // We don't fail the request if email sending fails, the ticket is already safely saved in DB
    }

    return NextResponse.json(
      {
        success: true,
        ticketId: ticket.id,
        message: "تم استلام رسالتك بنجاح. سنقوم بمراجعتها والرد عليك عبر البريد الإلكتروني.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/support/contact Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ غير متوقع أثناء إرسال الرسالة. يرجى المحاولة لاحقاً." },
      { status: 500 }
    );
  }
}
