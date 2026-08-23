"use client";

import React, { useState, Suspense, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

function ResetPasswordForm({ locale }: { locale: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const isAr = locale === "ar";
  const isDe = locale === "de";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token) {
      setErrorMessage(
        isAr
          ? "رابط الاستعادة غير صالح أو مفقود. يرجى طلب رابط جديد."
          : isDe
          ? "Ungültiger oder fehlender Link. Bitte fordern Sie einen neuen an."
          : "Invalid or missing reset link. Please request a new one."
      );
      return;
    }

    const trimmedPassword = password.trim();
    if (trimmedPassword.length < 8) {
      setErrorMessage(
        isAr
          ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل."
          : isDe
          ? "Das Passwort muss mindestens 8 Zeichen lang sein."
          : "Password must be at least 8 characters long."
      );
      return;
    }

    if (trimmedPassword !== confirmPassword.trim()) {
      setErrorMessage(
        isAr
          ? "كلمتا المرور غير متطابقتين."
          : isDe
          ? "Passwörter stimmen nicht überein."
          : "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: trimmedPassword,
          email: email || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(
          data.error ||
            (isAr
              ? "فشل إعادة تعيين كلمة المرور. قد يكون الرابط منتهياً."
              : isDe
              ? "Fehler beim Zurücksetzen des Passworts. Der Link ist möglicherweise abgelaufen."
              : "Failed to reset password. The link might be expired.")
        );
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/auth/login`);
      }, 2000);
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

  if (!token && !success) {
    return (
      <div className="space-y-5 text-center">
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm">
          {isAr
            ? "رابط إعادة تعيين كلمة المرور غير صالح أو مفقود."
            : isDe
            ? "Der Link zum Zurücksetzen des Passworts ist ungültig oder fehlt."
            : "Password reset link is invalid or missing."}
        </div>
        <Link
          href={`/${locale}/auth/forgot-password`}
          className="inline-block px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all"
        >
          {isAr ? "طلب رابط جديد ✉️" : isDe ? "Neuen Link anfordern ✉️" : "Request a new link ✉️"}
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-5 text-center animate-fadeIn">
        <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-sm space-y-2">
          <div className="flex items-center justify-center gap-2 font-bold text-emerald-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>{isAr ? "تم تغيير كلمة المرور بنجاح!" : isDe ? "Passwort erfolgreich geändert!" : "Password reset successfully!"}</span>
          </div>
          <p className="text-xs text-emerald-300/90">
            {isAr
              ? "سيتم تحويلك إلى صفحة تسجيل الدخول خلال لحظات..."
              : isDe
              ? "Sie werden in Kürze zur Anmeldeseite weitergeleitet..."
              : "Redirecting to login page in a moment..."}
          </p>
        </div>
        <Link
          href={`/${locale}/auth/login`}
          className="w-full inline-block py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all"
        >
          {isAr ? "تسجيل الدخول الآن 🚀" : isDe ? "Jetzt anmelden 🚀" : "Sign In Now 🚀"}
        </Link>
      </div>
    );
  }

  return (
    <>
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm font-medium text-center">
          {errorMessage}
        </div>
      )}

      {email && (
        <div className="text-center text-xs text-slate-400 bg-slate-800/50 py-1.5 px-3 rounded-lg font-mono">
          {email}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            {isAr ? "كلمة المرور الجديدة (8 أحرف على الأقل)" : isDe ? "Neues Passwort (Mind. 8 Zeichen)" : "New Password (Min. 8 chars)"}
          </label>
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

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            {isAr ? "تأكيد كلمة المرور الجديدة" : isDe ? "Neues Passwort bestätigen" : "Confirm New Password"}
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 ltr:pr-11 rtl:pl-11 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm dir-ltr transition-all"
              required
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={
                showConfirmPassword
                  ? isAr
                    ? "إخفاء تأكيد كلمة المرور"
                    : isDe
                    ? "Passwortbestätigung verbergen"
                    : "Hide confirm password"
                  : isAr
                  ? "إظهار تأكيد كلمة المرور"
                  : isDe
                  ? "Passwortbestätigung anzeigen"
                  : "Show confirm password"
              }
              className="absolute inset-y-0 ltr:right-0 rtl:left-0 flex items-center px-3.5 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
            >
              {showConfirmPassword ? (
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
            <span>{isAr ? "جاري الحفظ..." : isDe ? "Wird gespeichert..." : "Saving..."}</span>
          ) : (
            <span>{isAr ? "حفظ كلمة المرور الجديدة 🔒" : isDe ? "Neues Passwort speichern 🔒" : "Save New Password 🔒"}</span>
          )}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>;
}) {
  const params = use(paramsPromise);
  const locale = params.locale || "ar";
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const dir = isAr ? "rtl" : "ltr";

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      <Navbar locale={locale} />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6 bg-slate-900/90 border border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl my-8">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {isAr ? "تعيين كلمة مرور جديدة" : isDe ? "Neues Passwort festlegen" : "Set New Password"}
            </h1>
            <p className="text-sm text-slate-400">
              {isAr
                ? "أدخل كلمة المرور الجديدة لحسابك لتأكيد التغيير"
                : isDe
                ? "Geben Sie ein neues Passwort für Ihr Konto ein."
                : "Enter a new secure password for your account."}
            </p>
          </div>

          <Suspense fallback={<div className="text-center text-sm text-slate-400 py-8">Loading...</div>}>
            <ResetPasswordForm locale={locale} />
          </Suspense>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
