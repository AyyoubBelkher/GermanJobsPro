import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";

/**
 * POST /api/contact
 * Handles contact form submissions and sends an alert email to admin via Resend.
 */
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
    const trimmedCategory = typeof category === "string" && category.trim() ? category.trim() : "general_inquiry";
    const trimmedSubject = typeof subject === "string" ? subject.trim() : "";
    const trimmedMessage = typeof message === "string" ? message.trim() : "";

    // Basic Validation
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

    if (!trimmedSubject || trimmedSubject.length < 3) {
      return NextResponse.json(
        { success: false, error: "يرجى كتابة عنوان واضح للموضوع (3 أحرف على الأقل)." },
        { status: 400 }
      );
    }

    if (!trimmedMessage || trimmedMessage.length < 10) {
      return NextResponse.json(
        { success: false, error: "يرجى كتابة تفاصيل استفسارك (10 أحرف على الأقل)." },
        { status: 400 }
      );
    }

    // Save ticket in database
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

    // Send Alert Email to Admin via Resend
    const adminEmail = process.env.ADMIN_EMAIL || "ayyoubbelkher1@gmail.com";
    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey && apiKey.trim() !== "") {
      try {
        const { error: sendError } = await resend.emails.send({
          from: "GermanJobsPro Support <support@germanjobspro.com>",
          to: adminEmail,
          replyTo: trimmedEmail,
          subject: `[Contact Form] ${trimmedSubject} - GermanJobsPro`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b0f19; color: #ffffff; border: 1px solid #1e293b; border-radius: 16px; padding: 24px;">
              <h2 style="color: #60a5fa; margin-top: 0;">New Contact Form Message</h2>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr><td style="padding: 6px 0; color: #94a3b8; width: 100px;">Name:</td><td style="color: #ffffff; font-weight: bold;">${trimmedName}</td></tr>
                <tr><td style="padding: 6px 0; color: #94a3b8;">Email:</td><td><a href="mailto:${trimmedEmail}" style="color: #38bdf8;">${trimmedEmail}</a></td></tr>
                <tr><td style="padding: 6px 0; color: #94a3b8;">Category:</td><td style="color: #ffffff;">${trimmedCategory}</td></tr>
                <tr><td style="padding: 6px 0; color: #94a3b8;">Subject:</td><td style="color: #ffffff;">${trimmedSubject}</td></tr>
                <tr><td style="padding: 6px 0; color: #94a3b8;">Ticket ID:</td><td style="color: #cbd5e1; font-family: monospace;">${ticket.id}</td></tr>
              </table>
              <div style="background-color: #020617; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #94a3b8;">Message:</h4>
                <p style="margin: 0; color: #e2e8f0; white-space: pre-wrap; line-height: 1.6;">${trimmedMessage}</p>
              </div>
              <div style="text-align: center;">
                <a href="mailto:${trimmedEmail}?subject=Re: ${encodeURIComponent(trimmedSubject)}" style="display: inline-block; padding: 10px 24px; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 8px;">
                  Reply Directly to User ✉️
                </a>
              </div>
            </div>
          `,
          text: `New Contact Form Message\n\nName: ${trimmedName}\nEmail: ${trimmedEmail}\nCategory: ${trimmedCategory}\nSubject: ${trimmedSubject}\nTicket ID: ${ticket.id}\n\nMessage:\n${trimmedMessage}`,
        });

        if (sendError) {
          console.error("[Resend Error in /api/contact]:", sendError);
        }
      } catch (emailErr) {
        console.error("[Resend Exception in /api/contact]:", emailErr);
      }
    } else {
      console.log("=================================================");
      console.log("[CONTACT FORM - DEV/LOG MODE (NO RESEND_API_KEY)]");
      console.log(`To: ${adminEmail}`);
      console.log("From: GermanJobsPro Support <support@germanjobspro.com>");
      console.log(`Reply-To: ${trimmedEmail}`);
      console.log(`Subject: [Contact Form] ${trimmedSubject}`);
      console.log("Message:", trimmedMessage);
      console.log("=================================================");
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
    console.error("[POST /api/contact Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ غير متوقع أثناء إرسال الرسالة. يرجى المحاولة لاحقاً." },
      { status: 500 }
    );
  }
}
