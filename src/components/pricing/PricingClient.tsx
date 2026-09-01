"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface PricingClientProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    plan: string;
    planExpiresAt: string | null;
    aiCredits: number;
  };
  locale: string;
}

export default function PricingClient({ user, locale }: PricingClientProps) {
  const router = useRouter();
  const isAr = locale === "ar";
  const isDe = locale === "de";

  const [promoCode, setPromoCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isPro = user.plan === "PRO";
  const isTrial = user.plan === "TRIAL";

  const handleRedeemPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    setIsRedeeming(true);
    setPromoSuccess(null);
    setPromoError(null);

    try {
      const res = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تفعيل الكود الترويجي");
      }

      setPromoSuccess(data.message);
      setPromoCode("");
      router.refresh();
    } catch (err: unknown) {
      setPromoError(err instanceof Error ? err.message : "Error redeeming promo code");
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: "PRO_PASS" }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تجهيز عملية الدفع");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : "Payment error");
      setIsCheckingOut(false);
    }
  };

  const formatExpiry = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString(isAr ? "ar-EG" : isDe ? "de-DE" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-10">
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
          <span>💎</span>
          <span>{isAr ? "الترقية والاشتراكات" : isDe ? "Pläne & Preise" : "Plans & Pricing"}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {isAr
            ? "سرّع قبولك في سوق العمل الألماني 🇩🇪"
            : isDe
            ? "Beschleunigen Sie Ihre Karriere in Deutschland 🇩🇪"
            : "Accelerate your hiring in Germany 🇩🇪"}
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          {isAr
            ? "احصل على وصول غير محدود لتوليد خطابات التغطية وفحص الـ ATS وتجميع ملف الترشيح الكامل (Bewerbungsmappe)."
            : isDe
            ? "Unbegrenzter Zugriff auf AI Anschreiben, ATS-Check und Bewerbungsmappe Studio."
            : "Get unlimited AI cover letters, ATS audits, and full Bewerbungsmappe dossier compilation."}
        </p>
      </div>

      {/* User Current Status & Promo Redemption Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Current Plan Status Card */}
        <div className="md:col-span-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isAr ? "حالة حسابك الحالية" : "Current Account Status"}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-white">
                {isPro ? "Job Seeker PRO 🌟" : isTrial ? "Trial Pass ⏳" : "Starter Free 🆓"}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  isPro
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : isTrial
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {user.plan}
              </span>
            </div>
            {user.planExpiresAt && (
              <p className="text-xs text-slate-400">
                {isAr ? "ينتهي في: " : "Valid until: "}
                <span className="text-slate-200 font-bold">{formatExpiry(user.planExpiresAt)}</span>
              </p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span className="text-xs font-bold text-slate-300">
                {isAr ? "رصيد الذكاء الاصطناعي (AI Credits):" : "Remaining AI Credits:"}
              </span>
            </div>
            <span className="text-base font-black text-emerald-400">
              {isPro
                ? (isAr
                    ? "20 طلب يومياً (متجددة تلقائياً)"
                    : isDe
                    ? "20 täglich (automatisch erneuert)"
                    : "20 Daily Requests (auto-renewed)")
                : `${user.aiCredits} ${isAr ? "رصيد" : "Credits"}`}
            </span>
          </div>
        </div>

        {/* Promo Code Redemption Card */}
        <div className="md:col-span-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <span>🎁</span>
              <span>{isAr ? "هل لديك كود ترويجي أو تجريبي؟" : "Have a Promo or Trial Code?"}</span>
            </span>
            <h3 className="text-base font-bold text-white">
              {isAr ? "تفعيل كود الهدية / التجربة" : "Redeem Gift / Trial Code"}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? "أدخل كود التخفيض أو المنحة الممنوحة من شركائنا لترقية حسابك فوراً."
                : "Enter your promotional code to instantly grant credits and trial access."}
            </p>
          </div>

          <form onSubmit={handleRedeemPromo} className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder={isAr ? "أدخل الكود هنا (مثال: GERMAN2026)" : "Enter code (e.g. PROMO2026)"}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm uppercase font-mono tracking-wider focus:border-blue-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={isRedeeming || !promoCode.trim()}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all disabled:opacity-50 shrink-0 cursor-pointer shadow-md shadow-blue-600/20"
              >
                {isRedeeming ? (isAr ? "جاري التفعيل..." : "Redeeming...") : isAr ? "تفعيل" : "Redeem"}
              </button>
            </div>

            {promoSuccess && (
              <p className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                ✓ {promoSuccess}
              </p>
            )}

            {promoError && (
              <p className="text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                ✕ {promoError}
              </p>
            )}
          </form>
        </div>
      </div>

      {checkoutError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium text-center">
          {checkoutError}
        </div>
      )}

      {/* Pricing Tiers Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch pt-4">
        {/* Tier 1: Free Starter */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? "المستوى المجاني" : "Free Plan"}
              </span>
              <h3 className="text-xl font-bold text-white">Starter</h3>
              <p className="text-xs text-slate-400">
                {isAr ? "لبناء سيرة ذاتية احترافية واستكشاف الوظائف" : "For building standard CVs and browsing jobs"}
              </p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">$0</span>
              <span className="text-xs text-slate-400">{isAr ? "/ دائماً" : "/ forever"}</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{isAr ? "3 أرصدة ذكاء اصطناعي مجانية للبدء" : "3 Free Starter AI Credits"}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{isAr ? "إنشاء سيرة ذاتية واحدة وفق معيار DIN 5008" : "1 DIN 5008 German Resume"}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{isAr ? "تصفح أحدث الوظائف وعقود التدريب" : "Browse all German job postings"}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <span>✕</span>
                <span>{isAr ? "تصدير ملف الترشيح الكامل (Bewerbungsmappe)" : "Full Bewerbungsmappe Compiler"}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <span>✕</span>
                <span>{isAr ? "توليد خطابات Anschreiben غير محدودة" : "Unlimited AI Cover Letters"}</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            disabled
            className="w-full py-3 rounded-2xl bg-slate-800 text-slate-400 font-bold text-xs text-center cursor-not-allowed"
          >
            {isAr ? "خطتك الحالية" : "Current Plan"}
          </button>
        </div>

        {/* Tier 2: Job Seeker PRO PASS (Featured) */}
        <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-blue-500 rounded-3xl p-8 space-y-6 shadow-2xl shadow-blue-500/10 flex flex-col justify-between">
          <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-[11px] shadow-lg shadow-blue-600/30">
            {isAr ? "الأكثر طلباً للتقديم 🇩🇪" : "Most Popular 🇩🇪"}
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                {isAr ? "جواز الباحث عن عمل" : "Full Access Pass"}
              </span>
              <h3 className="text-xl font-bold text-white">Job Seeker PRO</h3>
              <p className="text-xs text-slate-400">
                {isAr ? "كل الأدوات للترشيح المباشر والقبول في الشركات الألمانية" : "Everything needed for direct German hiring"}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">$9.99</span>
                <span className="text-xs text-slate-400">{isAr ? "لمدة 3 أشهر (90 يوماً)" : "for 3 months"}</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-semibold">
                {isAr ? "≈ 100 درهم مغربي • 37 ريال سعودي • دفع لمرة واحدة" : "One-time payment • No hidden fees"}
              </p>
            </div>

            <ul className="space-y-3 text-xs text-slate-200 pt-4 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <span className="text-blue-400 font-bold">✓</span>
                <span className="font-bold">
                  {isAr
                    ? "20 طلب ذكاء اصطناعي يومياً (متجددة تلقائياً)"
                    : isDe
                    ? "20 KI-Anfragen täglich (automatisch erneuert)"
                    : "20 Daily AI Requests (auto-renewed)"}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400 font-bold">✓</span>
                <span>{isAr ? "تجميع وتحميل ملف الترشيح الكامل (Bewerbungsmappe)" : "Full Dossier Studio (Deckblatt + CV + Zeugnisse)"}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400 font-bold">✓</span>
                <span>{isAr ? "فاحص الـ ATS وتحليل الفجوات والكلمات المفتاحية" : "Full ATS & DIN 5008 Audit Engine"}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400 font-bold">✓</span>
                <span>{isAr ? "تصدير غير محدود لسير ذاتية متعددة بتنسيق PDF رسمي" : "Unlimited high-res PDF exports"}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400 font-bold">✓</span>
                <span>{isAr ? "دعم دفع آمن بـ Visa / Mastercard / Apple Pay" : "Secure Visa / Mastercard / Apple Pay"}</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={isCheckingOut}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isCheckingOut ? (
              <span>{isAr ? "جاري تحويلك لبوابة الدفع..." : "Redirecting..."}</span>
            ) : isPro ? (
              <span>{isAr ? "تمديد اشتراك PRO 🚀" : "Extend PRO Pass 🚀"}</span>
            ) : (
              <span>{isAr ? "ترقية الحساب الآن إلى PRO 🚀" : "Upgrade to PRO Now 🚀"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
