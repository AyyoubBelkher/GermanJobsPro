interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Sends an email using the Resend API (or logs to console if API key is not configured).
 */
export async function sendEmail({ to, subject, html, text, replyTo }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "GermanJobsPro <support@germanjobspro.com>";

  if (!apiKey || apiKey.trim() === "") {
    console.log("=================================================");
    console.log("[EMAIL SERVICE - DEV/LOG MODE (NO RESEND_API_KEY)]");
    console.log(`To: ${to}`);
    console.log(`From: ${fromEmail}`);
    if (replyTo) console.log(`Reply-To: ${replyTo}`);
    console.log(`Subject: ${subject}`);
    console.log("-------------------------------------------------");
    console.log(text || html);
    console.log("=================================================");
    return { success: true };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
        text,
        reply_to: replyTo || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Resend API Error]:", errorData);
      return { success: false, error: errorData?.message || "Failed to send email" };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("[Send Email Exception]:", error instanceof Error ? error.message : error);
    return { success: false, error: error instanceof Error ? error.message : "Internal error sending email" };
  }
}

/**
 * Generates the Dark/Navy branded Verification Code Email HTML template.
 */
export function getVerificationEmailHtml(code: string, locale = "ar"): { subject: string; html: string; text: string } {
  const isAr = locale === "ar";
  const isDe = locale === "de";

  const subject = isAr
    ? `رمز التحقق الخاص بك: ${code} - GermanJobsPro`
    : isDe
    ? `Dein Bestätigungscode: ${code} - GermanJobsPro`
    : `Your verification code: ${code} - GermanJobsPro`;

  const heading = isAr
    ? "تأكيد بريدك الإلكتروني"
    : isDe
    ? "E-Mail-Adresse bestätigen"
    : "Verify Your Email Address";

  const subHeading = isAr
    ? "شكراً لانضمامك إلى منصة GermanJobsPro. استخدم الرمز التالي لإكمال تسجيل حسابك:"
    : isDe
    ? "Vielen Dank für Ihre Registrierung bei GermanJobsPro. Nutzen Sie folgenden Bestätigungscode:"
    : "Thank you for registering with GermanJobsPro. Use the following code to complete your signup:";

  const expiresText = isAr
    ? "صالح لمدة 15 دقيقة فقط"
    : isDe
    ? "Gültig für 15 Minuten"
    : "Valid for 15 minutes only";

  const warningText = isAr
    ? "لا تشارك هذا الرمز مع أي شخص. إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذه الرسالة بأمان."
    : isDe
    ? "Geben Sie diesen Code niemals an Dritte weiter. Falls Sie dieses Konto nicht erstellt haben, können Sie diese E-Mail ignorieren."
    : "Never share this code with anyone. If you didn't create an account, you can safely ignore this email.";

  const text = `${heading}\n\n${subHeading}\n\n${code}\n\n(${expiresText})\n\n${warningText}\n\nGermanJobsPro - https://germanjobspro.com`;

  const html = `
<!DOCTYPE html>
<html lang="${locale}" dir="${isAr ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #090D16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #090D16; width: 100%; min-height: 100vh; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #0F172A; border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);" cellspacing="0" cellpadding="0" border="0">
          <!-- German Flag Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #111827 0%, #DC2626 50%, #FBBF24 100%);"></td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td style="padding: 35px 35px 20px 35px; text-align: center;">
              <div style="display: inline-block; padding: 10px 18px; background: rgba(37, 99, 235, 0.12); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 12px; margin-bottom: 15px;">
                <span style="font-size: 20px; font-weight: 800; color: #60A5FA; letter-spacing: 0.5px;">GermanJobs<span style="color: #FBBF24;">Pro</span></span>
              </div>
              <h1 style="margin: 15px 0 8px 0; font-size: 22px; font-weight: 700; color: #FFFFFF; text-align: center;">${heading}</h1>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #94A3B8; text-align: center;">${subHeading}</p>
            </td>
          </tr>

          <!-- OTP Code Box -->
          <tr>
            <td style="padding: 10px 35px 25px 35px; text-align: center;">
              <div style="background-color: #0B1120; border: 2px dashed #2563EB; border-radius: 16px; padding: 24px; text-align: center; margin: 10px 0;">
                <span style="font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #60A5FA; display: inline-block;">${code}</span>
                <div style="margin-top: 10px; font-size: 12px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                  ⏱️ ${expiresText}
                </div>
              </div>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 35px 35px 35px;">
              <div style="background: rgba(30, 41, 59, 0.5); border-radius: 12px; padding: 15px; border-left: 3px solid #64748B;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94A3B8;">${warningText}</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 35px; background-color: #080D1A; border-top: 1px solid #1E293B; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748B;">
                © ${new Date().getFullYear()} GermanJobsPro. All rights reserved.<br>
                <a href="https://germanjobspro.com" style="color: #3B82F6; text-decoration: none;">germanjobspro.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html, text };
}

/**
 * Generates the Dark/Navy branded Password Reset Link Email HTML template.
 */
export function getPasswordResetEmailHtml(resetUrl: string, locale = "ar"): { subject: string; html: string; text: string } {
  const isAr = locale === "ar";
  const isDe = locale === "de";

  const subject = isAr
    ? "إعادة تعيين كلمة المرور - GermanJobsPro"
    : isDe
    ? "Passwort zurücksetzen - GermanJobsPro"
    : "Reset Your Password - GermanJobsPro";

  const heading = isAr
    ? "إعادة تعيين كلمة المرور"
    : isDe
    ? "Passwort zurücksetzen"
    : "Reset Your Password";

  const subHeading = isAr
    ? "تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في GermanJobsPro. انقر على الزر أدناه لاختيار كلمة مرور جديدة:"
    : isDe
    ? "Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts für Ihr GermanJobsPro-Konto erhalten. Klicken Sie auf die Schaltfläche unten:"
    : "We received a request to reset the password for your GermanJobsPro account. Click the button below to set a new password:";

  const buttonText = isAr
    ? "إعادة تعيين كلمة المرور 🔒"
    : isDe
    ? "Passwort zurücksetzen 🔒"
    : "Reset Password 🔒";

  const expiresText = isAr
    ? "هذا الرابط صالح لمدة 60 دقيقة فقط."
    : isDe
    ? "Dieser Link ist nur 60 Minuten lang gültig."
    : "This link is valid for 60 minutes only.";

  const fallbackText = isAr
    ? "إذا لم تتمكن من النقر على الزر أعلاه، انسخ الرابط التالي والصقه في متصفحك:"
    : isDe
    ? "Wenn der Button nicht funktioniert, kopieren Sie bitte diesen Link in Ihren Browser:"
    : "If the button doesn't work, copy and paste this link into your browser:";

  const warningText = isAr
    ? "إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني بأمان وسيبقى حسابك آمناً."
    : isDe
    ? "Falls Sie dieses Zurücksetzen nicht angefordert haben, können Sie diese E-Mail ignorieren. Ihr Konto bleibt sicher."
    : "If you didn't request a password reset, you can safely ignore this email. Your account remains secure.";

  const text = `${heading}\n\n${subHeading}\n\n${resetUrl}\n\n(${expiresText})\n\n${warningText}\n\nGermanJobsPro - https://germanjobspro.com`;

  const html = `
<!DOCTYPE html>
<html lang="${locale}" dir="${isAr ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #090D16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #090D16; width: 100%; min-height: 100vh; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #0F172A; border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);" cellspacing="0" cellpadding="0" border="0">
          <!-- German Flag Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #111827 0%, #DC2626 50%, #FBBF24 100%);"></td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td style="padding: 35px 35px 20px 35px; text-align: center;">
              <div style="display: inline-block; padding: 10px 18px; background: rgba(37, 99, 235, 0.12); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 12px; margin-bottom: 15px;">
                <span style="font-size: 20px; font-weight: 800; color: #60A5FA; letter-spacing: 0.5px;">GermanJobs<span style="color: #FBBF24;">Pro</span></span>
              </div>
              <h1 style="margin: 15px 0 8px 0; font-size: 22px; font-weight: 700; color: #FFFFFF; text-align: center;">${heading}</h1>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #94A3B8; text-align: center;">${subHeading}</p>
            </td>
          </tr>

          <!-- Action Button -->
          <tr>
            <td style="padding: 15px 35px 25px 35px; text-align: center;">
              <a href="${resetUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; padding: 16px 36px; border-radius: 14px; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4); text-align: center;">
                ${buttonText}
              </a>
              <div style="margin-top: 14px; font-size: 12px; color: #64748B;">
                ⏱️ ${expiresText}
              </div>
            </td>
          </tr>

          <!-- Direct URL Link Fallback -->
          <tr>
            <td style="padding: 0 35px 20px 35px;">
              <div style="background-color: #0B1120; border: 1px solid #1E293B; border-radius: 12px; padding: 14px; font-size: 11px; line-height: 1.6; color: #64748B; word-break: break-all;">
                <p style="margin: 0 0 6px 0; color: #94A3B8; font-weight: 600;">${fallbackText}</p>
                <a href="${resetUrl}" style="color: #38BDF8; text-decoration: underline;">${resetUrl}</a>
              </div>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 35px 35px 35px;">
              <div style="background: rgba(30, 41, 59, 0.5); border-radius: 12px; padding: 15px; border-left: 3px solid #64748B;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94A3B8;">${warningText}</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 35px; background-color: #080D1A; border-top: 1px solid #1E293B; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748B;">
                © ${new Date().getFullYear()} GermanJobsPro. All rights reserved.<br>
                <a href="https://germanjobspro.com" style="color: #3B82F6; text-decoration: none;">germanjobspro.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html, text };
}

/**
 * Convenience helper to send email verification OTP.
 */
export async function sendVerificationEmail({
  email,
  code,
  locale = "ar",
}: {
  email: string;
  code: string;
  locale?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, html, text } = getVerificationEmailHtml(code, locale);
  return sendEmail({ to: email, subject, html, text });
}

/**
 * Convenience helper to send password reset link email.
 */
export async function sendPasswordResetEmail({
  email,
  resetUrl,
  locale = "ar",
}: {
  email: string;
  resetUrl: string;
  locale?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, html, text } = getPasswordResetEmailHtml(resetUrl, locale);
  return sendEmail({ to: email, subject, html, text });
}

/**
 * Generates the Support Ticket Alert Email template dispatched to admin.
 */
export function getSupportTicketEmailHtml(ticket: {
  id: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
}): { subject: string; html: string; text: string } {
  const categoryLabels: Record<string, string> = {
    billing: "💎 اشتراكات ومدفوعات (Billing)",
    cv_issue: "📄 استيراد/فحص سيرة ذاتية (CV Issue)",
    general_inquiry: "💼 استفسار عام (General Inquiry)",
    suggestion: "💡 اقتراح أو ملاحظة (Suggestion)",
  };

  const catLabel = categoryLabels[ticket.category] || ticket.category;
  const emailSubject = `[Support Ticket #${ticket.id.slice(-6)}] ${ticket.subject}`;

  const text = `New Support Ticket from ${ticket.name} (${ticket.email})
Category: ${catLabel}
Subject: ${ticket.subject}
Ticket ID: ${ticket.id}

Message:
${ticket.message}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #020617; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Top Accent Bar (German Flag) -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #000000 33.3%, #dd0000 33.3%, #dd0000 66.6%, #ffce00 66.6%);"></td>
          </tr>
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: left;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #38bdf8;">GermanJobsPro Support Hub</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">New Customer Inquiry Received</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 13px; color: #94a3b8; padding-bottom: 8px;">From:</td>
                  <td style="font-size: 14px; font-weight: 700; color: #ffffff; padding-bottom: 8px;">${ticket.name} (<a href="mailto:${ticket.email}" style="color: #38bdf8; text-decoration: none;">${ticket.email}</a>)</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #94a3b8; padding-bottom: 8px;">Category:</td>
                  <td style="font-size: 13px; font-weight: 600; color: #fbbf24; padding-bottom: 8px;">${catLabel}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #94a3b8; padding-bottom: 8px;">Subject:</td>
                  <td style="font-size: 14px; font-weight: 700; color: #f8fafc; padding-bottom: 8px;">${ticket.subject}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #94a3b8;">Ticket ID:</td>
                  <td style="font-size: 12px; font-family: monospace; color: #cbd5e1;">${ticket.id}</td>
                </tr>
              </table>
              <div style="background-color: #020617; border: 1px solid #334155; border-radius: 12px; padding: 20px;">
                <h4 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em;">Message:</h4>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap;">${ticket.message}</p>
              </div>
              <div style="margin-top: 24px; text-align: center;">
                <a href="mailto:${ticket.email}?subject=Re: ${encodeURIComponent(ticket.subject)}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 10px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                  Reply Directly to User ✉️
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: emailSubject, html, text };
}

/**
 * Convenience helper to dispatch support ticket alert email.
 */
export async function sendSupportAlertEmail(ticket: {
  id: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_SUPPORT_EMAIL || "ayyoubbelkher1@gmail.com";
  const { subject, html, text } = getSupportTicketEmailHtml(ticket);
  return sendEmail({
    to: adminEmail,
    subject,
    html,
    text,
    replyTo: ticket.email,
  });
}

