"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function NewsletterForm({ locale: propLocale }: { locale?: string } = {}) {
  const params = useParams();
  const locale = propLocale || (params?.locale as string) || "ar";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, message: "" });

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setStatus({
        type: "error",
        message: "يرجى كتابة بريدك الإلكتروني لتمام الاشتراك.",
      });
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setStatus({
        type: "error",
        message: "يرجى أدخال بريد إلكتروني صحيح (مثال: name@domain.com).",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "حدث خطأ غير متوقع. حاول مرة أخرى.");
      }

      setStatus({
        type: "success",
        message: data.message || "تم الاشتراك بنجاح في النشرة البريدية! 🎉",
      });
      setEmail("");
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "فشل إرسال الطلب، يرجى التحقق من اتصالك بالإنترنت.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="my-8 relative group max-w-xl mx-auto" dir="rtl">
      {/* Outer Glow & Gradient Border Wrapper */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-2xl blur-xs opacity-40 group-hover:opacity-60 transition duration-300 pointer-events-none" />

      <div className="relative p-[1px] rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 shadow-lg">
        <div className="bg-slate-900 text-white rounded-[15px] p-6 relative overflow-hidden">
          {/* Background Ambient Glow Patterns */}
          <div className="absolute -top-20 -left-20 w-44 h-44 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4 text-center">
            {/* Header Title */}
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-snug">
              لا تفوّت فرص العمل والتكوين المهني في ألمانيا 🚀
            </h2>

            {/* Subtitle */}
            <p className="text-slate-300 text-xs md:text-sm font-normal leading-relaxed max-w-md mx-auto">
              تنبيهات يومية بأحدث الوظائف المتاحة، عقود الـ Ausbildung، وإرشادات الفيزا مباشرة إلى بريدك الإلكتروني.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative w-full flex-1">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="أدخل بريدك الإلكتروني..."
                    disabled={loading}
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-xs md:text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs md:text-sm transition-all shadow-md hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>جاري الاشتراك...</span>
                    </>
                  ) : (
                    <span>اشترك الآن ✨</span>
                  )}
                </button>
              </div>

              {/* Status Banner */}
              {status.type && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium transition-all duration-300 flex items-center gap-2 text-right ${
                    status.type === "success"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  {status.type === "success" ? (
                    <svg
                      className="w-4 h-4 text-emerald-400 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4 text-rose-400 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                  <span className="flex-1">{status.message}</span>
                </div>
              )}

              {/* Footer Trust Badges */}
              <p className="text-[11px] text-slate-400 pt-1 text-center font-medium">
                ✨ مجاني 100% &nbsp;•&nbsp; 🔒 حماية لخصوصيتك &nbsp;•&nbsp; ⚡ يمكنك{" "}
                <Link
                  href={`/${locale}/unsubscribe`}
                  className="underline hover:text-slate-200 transition-colors"
                >
                  إلغاء الاشتراك فـ أي وقت
                </Link>{" "}
                بنقرة واحدة
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
