"use client";

import React, { useState } from "react";
import Link from "next/link";

interface ContactClientProps {
  initialUser?: {
    name?: string | null;
    email: string;
  } | null;
  locale: string;
}

export default function ContactClient({ initialUser, locale }: ContactClientProps) {
  const isAr = locale === "ar";
  const isDe = locale === "de";

  const [name, setName] = useState(initialUser?.name || "");
  const [email, setEmail] = useState(initialUser?.email || "");
  const [category, setCategory] = useState<"billing" | "cv_issue" | "general_inquiry" | "suggestion">("general_inquiry");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [ticketResult, setTicketResult] = useState<{ id: string; message: string } | null>(null);
  const [copiedTicketId, setCopiedTicketId] = useState(false);

  const categories = [
    {
      id: "billing" as const,
      icon: "💎",
      label: isAr
        ? "استفسار عن الاشتراكات والمدفوعات"
        : isDe
        ? "Tarife & Zahlungen"
        : "Billing & Subscriptions",
      desc: isAr ? "ترقية الحساب، الفواتير، طرق الدفع" : "Upgrades, invoices, payments",
    },
    {
      id: "cv_issue" as const,
      icon: "📄",
      label: isAr
        ? "مشكلة في إنشاء أو فحص السيرة الذاتية"
        : isDe
        ? "Lebenslauf & ATS-Check"
        : "CV Builder & ATS Check",
      desc: isAr ? "استيراد PDF، تنسيق DIN 5008، أخطاء التوليد" : "PDF import, DIN 5008 layout, AI parsing",
    },
    {
      id: "general_inquiry" as const,
      icon: "💼",
      label: isAr
        ? "استفسار عام حول التوظيف والتأشيرة"
        : isDe
        ? "Allgemeine Anfrage"
        : "General Inquiry & Careers",
      desc: isAr ? "شروط العمل في ألمانيا، بطاقة الفرصة، الوظائف" : "Jobs, Chancenkarte, general questions",
    },
    {
      id: "suggestion" as const,
      icon: "💡",
      label: isAr
        ? "اقتراح أو ملاحظة لتطوير المنصة"
        : isDe
        ? "Feedback & Vorschläge"
        : "Feedback & Feature Request",
      desc: isAr ? "أفكار جديدة لتحسين تجربة المستخدم" : "Ideas to improve our platform",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMessage(
        isAr
          ? "يرجى تعبئة جميع الحقول المطلوبة."
          : isDe
          ? "Bitte füllen Sie alle Pflichtfelder aus."
          : "Please fill in all required fields."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            (isAr
              ? "حدث خطأ أثناء إرسال التذكرة. يرجى المحاولة مرة أخرى."
              : "Failed to send support ticket. Please try again.")
        );
      }

      setTicketResult({
        id: data.ticketId,
        message: data.message,
      });
      setSubject("");
      setMessage("");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error submitting support ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTicket = () => {
    if (ticketResult?.id) {
      navigator.clipboard.writeText(ticketResult.id);
      setCopiedTicketId(true);
      setTimeout(() => setCopiedTicketId(false), 2500);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Left 2 Columns: Main Contact Form / Success State */}
      <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8 text-slate-900">
        
        {ticketResult ? (
          /* SUCCESS STATE */
          <div className="text-center py-10 space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-800 mx-auto flex items-center justify-center text-3xl shadow-sm">
              ✓
            </div>
            
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-2xl font-black text-[#061838]">
                {isAr ? "تم استلام رسالتك وتوثيق التذكرة بنجاح 🎉" : isDe ? "Nachricht erfolgreich übermittelt 🎉" : "Ticket Submitted Successfully 🎉"}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {ticketResult.message}
              </p>
            </div>

            {/* Ticket ID Badge */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto flex items-center justify-between gap-3">
              <div className="text-start min-w-0">
                <p className="text-[11px] text-slate-500 font-medium">{isAr ? "رقم التذكرة المرجعي:" : "Ticket Reference ID:"}</p>
                <p className="text-xs sm:text-sm font-mono font-bold text-[#061838] truncate">{ticketResult.id}</p>
              </div>
              <button
                type="button"
                onClick={handleCopyTicket}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors shrink-0 cursor-pointer border border-slate-200"
              >
                {copiedTicketId ? (isAr ? "تم النسخ ✓" : "Copied ✓") : (isAr ? "نسخ الرقم 📋" : "Copy ID 📋")}
              </button>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setTicketResult(null)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer border border-slate-200"
              >
                {isAr ? "إرسال استفسار أو تذكرة جديدة" : isDe ? "Neue Nachricht verfassen" : "Send Another Message"}
              </button>
              <Link
                href={`/${locale}/dashboard`}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#061838] hover:bg-[#0A2552] text-white font-bold text-xs shadow-md transition-all text-center"
              >
                {isAr ? "العودة إلى لوحة التحكم ←" : isDe ? "Zurück zum Dashboard ←" : "Back to Dashboard ←"}
              </Link>
            </div>
          </div>
        ) : (
          /* CONTACT FORM */
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium animate-fadeIn">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Category Selection Pills */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {isAr ? "1. حدد قسم أو موضوع الاستفسار *" : isDe ? "1. Kategorie auswählen *" : "1. Select Category *"}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex items-start gap-3 ${
                      category === cat.id
                        ? "bg-blue-50 border-blue-500 text-[#061838] shadow-sm ring-1 ring-blue-500"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-xl p-1.5 rounded-xl bg-white border border-slate-200 shrink-0">
                      {cat.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate text-[#061838]">{cat.label}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{cat.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name and Email Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {isAr ? "الاسم الكامل *" : isDe ? "Vollständiger Name *" : "Full Name *"}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isAr ? "مثال: أيوب بلقاسم" : "e.g. Max Mustermann"}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#061838] text-sm transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {isAr ? "البريد الإلكتروني للرد *" : isDe ? "E-Mail-Adresse für die Antwort *" : "Email Address for Reply *"}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#061838] text-sm dir-ltr transition-all"
                  required
                />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                {isAr ? "عنوان الموضوع *" : isDe ? "Betreff *" : "Subject *"}
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={isAr ? "اكتب عنواناً مختصراً لطلبك..." : "Short summary of your request..."}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#061838] text-sm transition-all"
                required
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                {isAr ? "تفاصيل الرسالة أو الاستفسار *" : isDe ? "Ihre Nachricht / Details *" : "Message Details *"}
              </label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  isAr
                    ? "اشرح استفسارك أو المشكلة التي تواجهك بالتفصيل لمساعدتك بأفضل شكل ممكن..."
                    : "Please describe your question or issue in detail..."
                }
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#061838] text-sm leading-relaxed transition-all resize-y"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#061838] hover:bg-[#0A2552] text-white font-extrabold text-sm sm:text-base shadow-md hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>{isAr ? "جاري إرسال التذكرة..." : isDe ? "Wird gesendet..." : "Submitting Ticket..."}</span>
                ) : (
                  <span>{isAr ? "إرسال التذكرة والاستفسار" : isDe ? "Nachricht absenden" : "Send Support Ticket"}</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Right Column: Support Channels & Quick Help */}
      <div className="space-y-6">
        
        {/* Support Channel Card */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 space-y-4 shadow-sm text-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center text-lg">
              ✉️
            </div>
            <div>
              <h4 className="font-bold text-[#061838] text-sm">
                {isAr ? "البريد الإلكتروني المباشر" : "Direct Support Email"}
              </h4>
              <p className="text-xs text-slate-500">GermanJobsPro Team</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {isAr
              ? "يمكنك مراسلة فريقنا مباشرة عبر البريد الإلكتروني أو من خلال نموذج التذاكر للحصول على متابعة سريعة."
              : "You can also reach our team directly via email for dedicated assistance."}
          </p>

          <a
            href="mailto:support@germanjobspro.com"
            className="block w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-blue-700 hover:text-blue-900 font-mono text-xs text-center font-bold transition-colors"
          >
            support@germanjobspro.com
          </a>
        </div>

        {/* Quick Help Highlights */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 space-y-4 shadow-sm text-slate-900">
          <h4 className="font-bold text-[#061838] text-sm flex items-center gap-2">
            <span>🛡️</span>
            <span>{isAr ? "إرشادات الدعم الفني" : "Help & Best Practices"}</span>
          </h4>

          <ul className="space-y-3 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-700 font-bold">•</span>
              <span>{isAr ? "تأكد من كتابة بريدك الإلكتروني الصحيح لضمان وصول رد فريق الدعم." : "Ensure your email address is correct so you receive our reply."}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-700 font-bold">•</span>
              <span>{isAr ? "إذا كان استفسارك يتعلق بالدفع أو الترقية، يُرجى تزويدنا برقم العملية أو الكود." : "For billing inquiries, include your order or promo code."}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-700 font-bold">•</span>
              <span>{isAr ? "المستندات المنشأة عبر المنصة متوافقة 100% مع معيار DIN 5008 الرسمي." : "All generated dossiers strictly comply with official DIN 5008 standards."}</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
