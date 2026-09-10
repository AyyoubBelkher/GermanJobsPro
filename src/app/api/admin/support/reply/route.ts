import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resend } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session";
import { verifyUserSession } from "@/lib/user-session";

async function isAuthorizedAdmin(request: NextRequest): Promise<boolean> {
  const cookieHeader = request.headers.get("cookie") || "";
  const adminMatch = cookieHeader.match(/(?:^|;\s*)admin_session=([^;]*)/);
  const sessionToken = adminMatch ? decodeURIComponent(adminMatch[1]) : undefined;

  if (sessionToken && (await verifySessionToken(sessionToken))) {
    return true;
  }

  const userMatch = cookieHeader.match(/(?:^|;\s*)user_session=([^;]*)/);
  const userToken = userMatch ? decodeURIComponent(userMatch[1]) : undefined;
  if (userToken) {
    const authResult = await verifyUserSession(userToken);
    if (
      authResult?.user?.email &&
      process.env.ADMIN_EMAIL &&
      authResult.user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()
    ) {
      return true;
    }
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;
    if (token && (await verifySessionToken(token))) {
      return true;
    }
  } catch {
    // Ignore outside request context
  }

  return false;
}

function getReplyEmailHtml(params: {
  recipientName: string;
  originalSubject: string;
  replyMessage: string;
  ticketId: string;
}): string {
  const { recipientName, originalSubject, replyMessage, ticketId } = params;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GermanJobsPro Support Reply</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #020617; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0b1329; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 30px 30px 20px 30px; background: linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%); border-bottom: 1px solid #334155; text-align: center;">
              <div style="display: inline-block; padding: 4px 12px; background-color: rgba(59, 130, 246, 0.2); border: 1px solid rgba(96, 165, 250, 0.3); border-radius: 9999px; color: #93c5fd; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 10px;">
                GERMANJOBSPRO SUPPORT TEAM 🇩🇪
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.025em;">
                رد من فريق دعم GermanJobsPro
              </h1>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 30px 30px 25px 30px; line-height: 1.6;">
              <p style="font-size: 15px; color: #e2e8f0; margin-top: 0; margin-bottom: 16px;">
                مرحباً <strong>${recipientName || "عزيزي المستخدم"}</strong>،
              </p>
              <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 20px;">
                شكراً لتواصلك معنا بخصوص: <strong style="color: #60a5fa;">"${originalSubject}"</strong>. يسعدنا الرد على استفسارك ومساعدتك في مسيرتك المهنية بألمانيا.
              </p>

              <!-- Admin Answer Card -->
              <div style="background-color: #0f172a; border: 1px solid #3b82f6; border-radius: 14px; padding: 20px; margin-bottom: 24px; position: relative;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #60a5fa; letter-spacing: 0.05em; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                  <span>💬</span>
                  <span>إجابة فريق الدعم:</span>
                </div>
                <div style="font-size: 14px; color: #f1f5f9; white-space: pre-wrap; line-height: 1.7;">${replyMessage}</div>
              </div>

              <!-- Ticket Info Box -->
              <table role="presentation" width="100%" style="background-color: #020617; border: 1px solid #1e293b; border-radius: 10px; padding: 10px 14px; margin-bottom: 24px; font-size: 12px; color: #94a3b8;">
                <tr>
                  <td style="padding: 4px 0;">رقم التذكرة:</td>
                  <td align="left" style="font-family: monospace; color: #cbd5e1; direction: ltr;">${ticketId}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">حالة التذكرة:</td>
                  <td align="left" style="color: #34d399; font-weight: 700;">تم الرد / RESOLVED ✓</td>
                </tr>
              </table>

              <!-- Call to Action / Help -->
              <div style="text-align: center; margin-top: 25px; margin-bottom: 10px;">
                <a href="https://germanjobspro.com" target="_blank" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 12px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
                  زيارة GermanJobsPro 🚀
                </a>
              </div>
              <p style="font-size: 12px; text-align: center; color: #64748b; margin-top: 14px; margin-bottom: 0;">
                إذا كان لديك أي سؤال إضافي، يمكنك الرد مباشرة على هذه الرسالة.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px; background-color: #020617; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #64748b;">
              GermanJobsPro 🇩🇪 • منصة التوظيف والسير الذاتية بالمعايير الألمانية DIN 5008<br>
              © ${new Date().getFullYear()} GermanJobsPro. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * POST /api/admin/support/reply
 * Admin endpoint to reply directly to a support ticket via Resend email
 * and mark the ticket as RESOLVED.
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthorizedAdmin(request))) {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بالوصول (Unauthorized)." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "بيانات الطلب غير صالحة." },
        { status: 400 }
      );
    }

    const { ticketId, recipientEmail, subject, replyMessage } = body;

    const trimmedTicketId = typeof ticketId === "string" ? ticketId.trim() : "";
    const trimmedEmail = typeof recipientEmail === "string" ? recipientEmail.trim().toLowerCase() : "";
    const trimmedSubject = typeof subject === "string" ? subject.trim() : "";
    const trimmedReply = typeof replyMessage === "string" ? replyMessage.trim() : "";

    if (!trimmedTicketId) {
      return NextResponse.json(
        { success: false, error: "معرف التذكرة مطلوب (ticketId)." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, error: "البريد الإلكتروني للمستلم غير صالح." },
        { status: 400 }
      );
    }

    if (!trimmedReply || trimmedReply.length < 3) {
      return NextResponse.json(
        { success: false, error: "يرجى كتابة نص الرد (3 أحرف على الأقل)." },
        { status: 400 }
      );
    }

    // Verify ticket exists in DB
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: trimmedTicketId },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "التذكرة غير موجودة في قاعدة البيانات." },
        { status: 404 }
      );
    }

    // Prepare email subject
    const cleanSubject = trimmedSubject || ticket.subject || "Support Inquiry";
    const emailSubject = cleanSubject.toLowerCase().startsWith("re:")
      ? `${cleanSubject} - GermanJobsPro Support`
      : `Re: ${cleanSubject} - GermanJobsPro Support`;

    // 1. Send Branded Email via Resend SDK
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && apiKey.trim() !== "") {
      try {
        const { error: sendError } = await resend.emails.send({
          from: "GermanJobsPro Support <support@germanjobspro.com>",
          to: trimmedEmail,
          subject: emailSubject,
          html: getReplyEmailHtml({
            recipientName: ticket.name,
            originalSubject: cleanSubject,
            replyMessage: trimmedReply,
            ticketId: ticket.id,
          }),
          text: `Hello ${ticket.name || ""},\n\nThank you for reaching out to GermanJobsPro Support regarding "${cleanSubject}".\n\nSupport Team Response:\n${trimmedReply}\n\nTicket ID: ${ticket.id}\nStatus: RESOLVED\n\nIf you have further questions, you can reply directly to this email.\n\nGermanJobsPro Support Team\nhttps://germanjobspro.com`,
        });

        if (sendError) {
          console.error("[Resend Reply Error]:", sendError);
          return NextResponse.json(
            {
              success: false,
              error: `فشل إرسال البريد عبر Resend: ${sendError.message}`,
            },
            { status: 500 }
          );
        }
      } catch (err: unknown) {
        console.error("[Resend Reply Exception]:", err);
        return NextResponse.json(
          {
            success: false,
            error: err instanceof Error ? err.message : "فشل إرسال البريد الإلكتروني.",
          },
          { status: 500 }
        );
      }
    } else {
      console.log("=================================================");
      console.log("[ADMIN SUPPORT REPLY - DEV/LOG MODE (NO RESEND_API_KEY)]");
      console.log(`To: ${trimmedEmail}`);
      console.log("From: GermanJobsPro Support <support@germanjobspro.com>");
      console.log(`Subject: ${emailSubject}`);
      console.log(`Reply Message:\n${trimmedReply}`);
      console.log("=================================================");
    }

    // 2. Update Ticket Status to RESOLVED & record reply
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: "RESOLVED",
        adminReply: trimmedReply,
        repliedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم إرسال الرد بنجاح عبر البريد الإلكتروني وتم تعيين التذكرة كـ RESOLVED.",
        ticket: updatedTicket,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/admin/support/reply Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ غير متوقع أثناء معالجة الرد." },
      { status: 500 }
    );
  }
}
