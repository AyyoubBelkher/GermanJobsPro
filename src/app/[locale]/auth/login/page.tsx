"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export default function LoginPage({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>;
}) {
  const router = useRouter();
  const params = use(paramsPromise);
  const locale = params.locale || "ar";
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const dir = isAr ? "rtl" : "ltr";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  // Authenticated redirect guard
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch("/api/user/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && isMounted) {
            router.replace(`/${locale}/dashboard`);
          }
        }
      } catch {
        // Ignore network errors
      }
    }
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [locale, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setUnverifiedEmail("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setErrorMessage(
        isAr
          ? "يرجى كتابة البريد الإلكتروني وكلمة المرور."
          : isDe
          ? "Bitte geben Sie Ihre E-Mail und Ihr Passwort ein."
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
        if (data.requiresVerification) {
          setUnverifiedEmail(trimmedEmail);
        }
        setErrorMessage(
          data.error ||
            (isAr
              ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
              : isDe
              ? "Ungültige E-Mail-Adresse oder falsches Passwort."
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
          : isDe
          ? "Ein unerwarteter Fehler ist aufgetreten. Bitte erneut versuchen."
          : "An unexpected error occurred. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      <Navbar locale={locale} />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-8 bg-slate-900/90 border border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl my-8">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {isAr ? "تسجيل الدخول إلى حسابك" : isDe ? "Bei Ihrem Konto anmelden" : "Sign In to Your Account"}
            </h1>
            <p className="text-sm text-slate-400">
              {isAr
                ? "مرحباً بك مجدداً في منصة GermanJobsPro"
                : isDe
                ? "Willkommen zurück bei GermanJobsPro"
                : "Welcome back to GermanJobsPro"}
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm font-medium text-center space-y-2">
              <p>{errorMessage}</p>
              {unverifiedEmail && (
                <div>
                  <Link
                    href={`/${locale}/auth/signup`}
                    className="inline-block mt-1 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold transition-all underline"
                  >
                    {isAr ? "تأكيد بريدك الإلكتروني الآن ←" : isDe ? "E-Mail jetzt bestätigen ←" : "Verify Email Now ←"}
                  </Link>
                </div>
              )}
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  {isAr ? "كلمة المرور" : isDe ? "Passwort" : "Password"}
                </label>
                <Link
                  href={`/${locale}/auth/forgot-password`}
                  className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                >
                  {isAr ? "نسيت كلمة المرور؟" : isDe ? "Passwort vergessen?" : "Forgot password?"}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 ltr:pr-11 rtl:pl-11 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm dir-ltr transition-all"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? isAr
                        ? "إخفاء كلمة المرور"
                        : isDe
                        ? "Passwort verbergen"
                        : "Hide password"
                      : isAr
                      ? "إظهار كلمة المرور"
                      : isDe
                      ? "Passwort anzeigen"
                      : "Show password"
                  }
                  className="absolute inset-y-0 ltr:right-0 rtl:left-0 flex items-center px-3.5 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>{isAr ? "جاري تسجيل الدخول..." : isDe ? "Wird angemeldet..." : "Signing In..."}</span>
              ) : (
                <span>{isAr ? "تسجيل الدخول ✨" : isDe ? "Anmelden ✨" : "Sign In ✨"}</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            <span>{isAr ? "ليس لديك حساب بعد؟ " : isDe ? "Noch kein Konto? " : "Don't have an account yet? "}</span>
            <Link
              href={`/${locale}/auth/signup`}
              className="font-semibold text-blue-400 hover:underline"
            >
              {isAr ? "أنشئ حساباً جديداً مجاناً" : isDe ? "Kostenlos registrieren" : "Create a new account for free"}
            </Link>
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
