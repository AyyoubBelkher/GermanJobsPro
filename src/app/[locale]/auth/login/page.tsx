"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export default function LoginPage({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>;
}) {
  const params = use(paramsPromise);
  const locale = params.locale || "ar";
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage(
        isAr
          ? "يرجى كتابة البريد الإلكتروني وكلمة المرور."
          : "Please enter your email and password."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(
          data.error ||
            (isAr
              ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
              : "Invalid email or password.")
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
        <div className="w-full max-w-md space-y-8 bg-slate-900/90 border border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {isAr ? "تسجيل الدخول إلى حسابك" : "Sign In to Your Account"}
            </h1>
            <p className="text-sm text-slate-400">
              {isAr
                ? "مرحباً بك مجدداً في منصة GermanJobsPro"
                : "Welcome back to GermanJobsPro platform"}
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm font-medium text-center">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
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
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {isAr ? "كلمة المرور" : "Password"}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>{isAr ? "جاري تسجيل الدخول..." : "Signing In..."}</span>
              ) : (
                <span>{isAr ? "تسجيل الدخول ✨" : "Sign In ✨"}</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            <span>{isAr ? "ليس لديك حساب بعد؟ " : "Don't have an account yet? "}</span>
            <Link
              href={`/${locale}/auth/signup`}
              className="font-semibold text-blue-400 hover:underline"
            >
              {isAr ? "أنشئ حساباً جديداً مجاناً" : "Create a new account for free"}
            </Link>
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
