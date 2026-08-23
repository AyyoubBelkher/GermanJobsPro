"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export default function ForgotPasswordPage({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>;
}) {
  const params = use(paramsPromise);
  const locale = params.locale || "ar";
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const dir = isAr ? "rtl" : "ltr";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage(
        isAr
          ? "يرجى إدخال بريد إلكتروني صحيح."
          : isDe
          ? "Bitte geben Sie eine gültige E-Mail-Adresse ein."
          : "Please enter a valid email address."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, locale }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(
          data.error ||
            (isAr
              ? "حدث خطأ أثناء معالجة الطلب."
              : isDe
              ? "Fehler bei der Anfrage."
              : "An error occurred.")
        );
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setLoading(false);
    } catch {
      setErrorMessage(
        isAr
          ? "حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى."
          : isDe
          ? "Verbindungsfehler. Bitte erneut versuchen."
          : "Connection error. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      <Navbar locale={locale} />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6 bg-slate-900/90 border border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl my-8">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {isAr ? "استعادة كلمة المرور" : isDe ? "Passwort vergessen?" : "Forgot Password?"}
            </h1>
            <p className="text-sm text-slate-400">
              {isAr
                ? "أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور الخاصة بك"
                : isDe
                ? "Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen."
                : "Enter your email address and we will send you a password reset link."}
            </p>
          </div>

          {submitted ? (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-sm space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span>{isAr ? "تم إرسال الرابط بنجاح!" : isDe ? "Link erfolgreich gesendet!" : "Reset link sent!"}</span>
                </div>
                <p className="text-xs text-emerald-300/90 leading-relaxed">
                  {isAr
                    ? `إذا كان البريد ${email} مسجلاً لدينا، فستتلقى رابطاً لإعادة التعيين خلال دقائق. يرجى التحقق من مجلد الرسائل غير المرغوب فيها (Spam).`
                    : isDe
                    ? `Falls ${email} registriert ist, erhalten Sie in Kürze einen Link. Bitte prüfen Sie auch Ihren Spam-Ordner.`
                    : `If ${email} is registered with us, you will receive a reset link shortly. Please also check your spam folder.`}
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5 text-center">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  {isAr ? "إعادة إرسال بريد آخر" : isDe ? "Andere E-Mail eingeben" : "Try another email"}
                </button>

                <Link
                  href={`/${locale}/auth/login`}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all text-center"
                >
                  {isAr ? "العودة لتسجيل الدخول" : isDe ? "Zurück zur Anmeldung" : "Back to Sign In"}
                </Link>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm font-medium text-center">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {isAr ? "البريد الإلكتروني" : isDe ? "E-Mail-Adresse" : "Email Address"}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm dir-ltr transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>{isAr ? "جاري الإرسال..." : isDe ? "Wird gesendet..." : "Sending..."}</span>
                  ) : (
                    <span>{isAr ? "إرسال رابط الاستعادة ✉️" : isDe ? "Reset-Link senden ✉️" : "Send Reset Link ✉️"}</span>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
                <span>{isAr ? "تذكرت كلمة المرور؟ " : isDe ? "Passwort wieder eingefallen? " : "Remember your password? "}</span>
                <Link
                  href={`/${locale}/auth/login`}
                  className="font-semibold text-blue-400 hover:underline"
                >
                  {isAr ? "سجل الدخول هنا" : isDe ? "Hier anmelden" : "Sign in here"}
                </Link>
              </div>
            </>
          )}

        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
