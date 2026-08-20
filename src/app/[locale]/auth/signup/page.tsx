"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export default function SignupPage({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>;
}) {
  const params = use(paramsPromise);
  const locale = params.locale || "ar";
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setErrorMessage(
        isAr
          ? "يرجى تعبئة جميع الحقول المطلوبة."
          : "Please fill in all required fields."
      );
      return;
    }

    if (trimmedPassword.length < 8) {
      setErrorMessage(
        isAr
          ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل."
          : "Password must be at least 8 characters long."
      );
      return;
    }

    if (trimmedPassword !== confirmPassword.trim()) {
      setErrorMessage(
        isAr
          ? "كلمتا المرور غير متطابقتين."
          : "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: trimmedEmail,
          password: trimmedPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(
          data.error ||
            (isAr
              ? "فشل إنشاء الحساب. حاول مرة أخرى."
              : "Registration failed. Please try again.")
        );
        setLoading(false);
        return;
      }

      window.location.href = `/${locale}/dashboard`;
    } catch {
      setErrorMessage(
        isAr
          ? "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى."
          : "An unexpected error occurred. Please try again."
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {isAr ? "إنشاء حساب جديد مجاناً" : "Create New Account for Free"}
            </h1>
            <p className="text-sm text-slate-400">
              {isAr
                ? "انضم إلى منصة GermanJobsPro وابدأ رحلتك للعمل في ألمانيا"
                : "Join GermanJobsPro platform and start your journey to Germany"}
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm font-medium text-center">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? "الاسم الكامل (اختياري)" : "Full Name (Optional)"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isAr ? "أيوب بلكخير" : "John Doe"}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? "البريد الإلكتروني" : "Email Address"}
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

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? "كلمة المرور (8 أحرف على الأقل)" : "Password (Min. 8 chars)"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm dir-ltr transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? "تأكيد كلمة المرور" : "Confirm Password"}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm dir-ltr transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>{isAr ? "جاري إنشاء الحساب..." : "Creating Account..."}</span>
              ) : (
                <span>{isAr ? "إنشاء الحساب ✨" : "Create Account ✨"}</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            <span>{isAr ? "لديك حساب بالفعل؟ " : "Already have an account? "}</span>
            <Link
              href={`/${locale}/auth/login`}
              className="font-semibold text-blue-400 hover:underline"
            >
              {isAr ? "سجل الدخول هنا" : "Sign in here"}
            </Link>
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
