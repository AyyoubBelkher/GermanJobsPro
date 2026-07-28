"use client";

import React, { useState } from "react";

interface HeroSectionProps {
  headline?: string;
  subheading?: string;
  emailPlaceholder?: string;
  buttonText?: string;
  successMessage?: string;
  errorMessage?: string;
}

export default function HeroSection({
  headline = "دليلك الشامل للعمل في ألمانيا",
  subheading = "اكتشف الفرص الوظيفية المتاحة، وتعرف على شروط التأشيرة، والمعيشة، والخطوات اللازمة للنجاح والاستقرار المهني في ألمانيا.",
  emailPlaceholder = "أدخل بريدك الإلكتروني هنا...",
  buttonText = "اشترك الآن",
  successMessage = "شكرًا للاشتراك! تم إرسال رابط تأكيد إلى بريدك الإلكتروني.",
  errorMessage = "الرجاء إدخال بريد إلكتروني صحيح.",
}: HeroSectionProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-20 px-6 sm:py-28 sm:px-12 lg:px-24 text-white rounded-3xl shadow-xl">
      {/* Decorative background grid */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Radial soft glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center space-y-8 flex flex-col items-center">
        {/* Category Badge */}
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20 backdrop-blur-md animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          البوابة المهنية الأولى لألمانيا
        </span>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-none max-w-3xl drop-shadow-sm">
          {headline}
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl leading-relaxed font-light font-sans">
          {subheading}
        </p>

        {/* Subscription Form */}
        <div className="w-full max-w-md mx-auto pt-4">
          <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row gap-3 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md focus-within:border-blue-500/50 transition-all duration-300">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-slate-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                disabled={status === "loading" || status === "success"}
                placeholder={emailPlaceholder}
                className="w-full bg-transparent py-3 ps-12 pe-4 text-sm text-white placeholder-slate-400 focus:outline-none disabled:opacity-50 text-start"
                required
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="relative overflow-hidden font-medium text-sm px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all duration-300 shadow-md shadow-blue-900/30 active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
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
                <span>{buttonText}</span>
              )}
            </button>
          </form>

          {/* Form Feedback Messages */}
          <div className="h-6 mt-3 text-sm transition-all duration-300">
            {status === "success" && (
              <p className="text-emerald-400 flex items-center justify-center gap-1.5 animate-fade-in">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {successMessage}
              </p>
            )}
            {status === "error" && (
              <p className="text-rose-400 flex items-center justify-center gap-1.5 animate-fade-in">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
                {errorMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
