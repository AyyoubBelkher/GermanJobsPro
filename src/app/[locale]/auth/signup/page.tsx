"use client";

import React, { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export default function SignupPage({
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

  // Step state: "signup" | "verify"
  const [step, setStep] = useState<"signup" | "verify">("signup");

  // Signup form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // OTP Verification state
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "verify" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Handle Signup Submission
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setErrorMessage(
        isAr
          ? "يرجى تعبئة جميع الحقول المطلوبة."
          : isDe
          ? "Bitte füllen Sie alle erforderlichen Felder aus."
          : "Please fill in all required fields."
      );
      return;
    }

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
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: trimmedEmail,
          password: trimmedPassword,
          locale,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(
          data.error ||
            (isAr
              ? "فشل إنشاء الحساب. حاول مرة أخرى."
              : isDe
              ? "Registrierung fehlgeschlagen. Bitte erneut versuchen."
              : "Registration failed. Please try again.")
        );
        setLoading(false);
        return;
      }

      // Move to verification step
      setStep("verify");
      setCountdown(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setLoading(false);
      setSuccessMessage(
        isAr
          ? `تم إرسال رمز التحقق (6 أرقام) إلى ${trimmedEmail}`
          : isDe
          ? `Ein 6-stelliger Code wurde an ${trimmedEmail} gesendet.`
          : `A 6-digit verification code was sent to ${trimmedEmail}`
      );

      // Focus first OTP input after render
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
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

  // Handle OTP Digit Input
  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, ""); // digits only
    if (!cleanVal) {
      const newDigits = [...otpDigits];
      newDigits[index] = "";
      setOtpDigits(newDigits);
      return;
    }

    const newDigits = [...otpDigits];
    // If pasted multiple digits
    if (cleanVal.length > 1) {
      const pastedChars = cleanVal.slice(0, 6).split("");
      pastedChars.forEach((char, i) => {
        if (index + i < 6) {
          newDigits[index + i] = char;
        }
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(index + pastedChars.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    newDigits[index] = cleanVal[0];
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (index < 5 && cleanVal) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Keydown (Backspace navigation)
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Paste
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    const chars = pastedData.slice(0, 6).split("");
    chars.forEach((c, i) => {
      newDigits[i] = c;
    });
    setOtpDigits(newDigits);
    const nextIdx = Math.min(chars.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  // Submit OTP Verification
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const code = otpDigits.join("");
    if (code.length !== 6) {
      setErrorMessage(
        isAr
          ? "يرجى إدخال رمز التحقق المكون من 6 أرقام بالكامل."
          : isDe
          ? "Bitte geben Sie den vollständigen 6-stelligen Code ein."
          : "Please enter the full 6-digit verification code."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(
          data.error ||
            (isAr
              ? "رمز التحقق غير صحيح أو منتهي الصلاحية."
              : isDe
              ? "Ungültiger oder abgelaufener Bestätigungscode."
              : "Invalid or expired verification code.")
        );
        setLoading(false);
        return;
      }

      // Success redirect to dashboard
      window.location.href = `/${locale}/dashboard`;
    } catch {
      setErrorMessage(
        isAr
          ? "حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى."
          : isDe
          ? "Fehler bei der Überprüfung. Bitte erneut versuchen."
          : "Error verifying email. Please try again."
      );
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendCode = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          locale,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(
          data.error ||
            (isAr
              ? "فشل إعادة إرسال الرمز. حاول لاحقاً."
              : isDe
              ? "Fehler beim erneuten Senden des Codes."
              : "Failed to resend code.")
        );
        setResending(false);
        return;
      }

      setCountdown(60);
      setSuccessMessage(
        isAr
          ? "تم إرسال رمز تحقق جديد بنجاح ✉️"
          : isDe
          ? "Ein neuer Bestätigungscode wurde gesendet ✉️"
          : "A new verification code has been sent ✉️"
      );
      setResending(false);
    } catch {
      setErrorMessage(
        isAr
          ? "حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى."
          : isDe
          ? "Verbindungsfehler. Bitte erneut versuchen."
          : "Connection error. Please try again."
      );
      setResending(false);
    }
  };

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      <Navbar locale={locale} />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6 bg-slate-900/90 border border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl my-8">
          
          {/* STEP 1: INITIAL SIGNUP FORM */}
          {step === "signup" && (
            <>
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-2">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {isAr ? "إنشاء حساب جديد مجاناً" : isDe ? "Kostenloses Konto erstellen" : "Create New Account for Free"}
                </h1>
                <p className="text-sm text-slate-400">
                  {isAr
                    ? "انضم إلى منصة GermanJobsPro وابدأ رحلتك للعمل في ألمانيا"
                    : isDe
                    ? "Treten Sie GermanJobsPro bei und starten Sie Ihre Karriere in Deutschland"
                    : "Join GermanJobsPro platform and start your career in Germany"}
                </p>
              </div>

              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm font-medium text-center">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {isAr ? "الاسم الكامل (اختياري)" : isDe ? "Vollständiger Name (Optional)" : "Full Name (Optional)"}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isAr ? "أيوب بلكخير" : "Max Mustermann"}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition-all"
                  />
                </div>

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
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {isAr ? "كلمة المرور (8 أحرف على الأقل)" : isDe ? "Passwort (Mind. 8 Zeichen)" : "Password (Min. 8 chars)"}
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
                    {isAr ? "تأكيد كلمة المرور" : isDe ? "Passwort bestätigen" : "Confirm Password"}
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
                    <span>{isAr ? "جاري المعالجة..." : isDe ? "Wird verarbeitet..." : "Processing..."}</span>
                  ) : (
                    <span>{isAr ? "إنشاء الحساب ومتابعة التحقق ✨" : isDe ? "Konto erstellen & fortfahren ✨" : "Create Account & Verify ✨"}</span>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
                <span>{isAr ? "لديك حساب بالفعل؟ " : isDe ? "Bereits ein Konto? " : "Already have an account? "}</span>
                <Link
                  href={`/${locale}/auth/login`}
                  className="font-semibold text-blue-400 hover:underline"
                >
                  {isAr ? "سجل الدخول هنا" : isDe ? "Hier anmelden" : "Sign in here"}
                </Link>
              </div>
            </>
          )}

          {/* STEP 2: 6-DIGIT OTP VERIFICATION */}
          {step === "verify" && (
            <>
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-2">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {isAr ? "تأكيد بريدك الإلكتروني" : isDe ? "E-Mail-Adresse bestätigen" : "Verify Your Email"}
                </h1>
                <p className="text-sm text-slate-400">
                  {isAr
                    ? "أدخل رمز التحقق (OTP) المكون من 6 أرقام الذي أرسلناه إلى:"
                    : isDe
                    ? "Geben Sie den 6-stelligen Bestätigungscode ein, der an folgende Adresse gesendet wurde:"
                    : "Enter the 6-digit code sent to:"}
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 text-xs text-blue-400 font-mono">
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => setStep("signup")}
                    className="text-slate-400 hover:text-white underline text-[11px]"
                  >
                    {isAr ? "تغيير" : isDe ? "Ändern" : "Edit"}
                  </button>
                </div>
              </div>

              {successMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium text-center">
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium text-center">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleVerifySubmit} className="space-y-6">
                {/* 6 OTP Boxes */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 dir-ltr" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                      required
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || otpDigits.some((d) => !d)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>{isAr ? "جاري التحقق..." : isDe ? "Überprüfung..." : "Verifying..."}</span>
                  ) : (
                    <span>{isAr ? "تأكيد الدخول إلى لوحة التحكم 🚀" : isDe ? "Bestätigen & zum Dashboard 🚀" : "Verify & Continue 🚀"}</span>
                  )}
                </button>
              </form>

              {/* Resend Code Section */}
              <div className="pt-2 text-center text-xs space-y-2">
                <p className="text-slate-400">
                  {isAr ? "لم يصلك الرمز؟ " : isDe ? "Code nicht erhalten? " : "Didn't receive the code? "}
                  {countdown > 0 ? (
                    <span className="text-slate-500 font-mono">
                      {isAr
                        ? `يمكنك إعادة الإرسال بعد ${countdown} ثانية`
                        : isDe
                        ? `Erneut senden in ${countdown}s`
                        : `Resend in ${countdown}s`}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={resending}
                      onClick={handleResendCode}
                      className="font-semibold text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {resending
                        ? isAr
                          ? "جاري الإرسال..."
                          : isDe
                          ? "Wird gesendet..."
                          : "Sending..."
                        : isAr
                        ? "إعادة إرسال الرمز الآن ✉️"
                        : isDe
                        ? "Code erneut senden ✉️"
                        : "Resend Code Now ✉️"}
                    </button>
                  )}
                </p>

                <div>
                  <button
                    type="button"
                    onClick={() => setStep("signup")}
                    className="text-slate-400 hover:text-white text-xs underline"
                  >
                    {isAr ? "← العودة إلى صفحة التسجيل" : isDe ? "← Zurück zur Registrierung" : "← Back to signup"}
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
