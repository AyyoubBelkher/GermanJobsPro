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

  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isPro = user.plan === "PRO" || user.plan === "SPRINT";
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

  const handleCheckout = (variantName: string) => {
    setIsCheckingOut(variantName);
    setCheckoutError(null);

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_GUMROAD_PRODUCT_URL ||
        "https://germanjobspro.gumroad.com/l/pro-pass";
      const params = new URLSearchParams();

      if (variantName) {
        params.set("variant", variantName);
        params.set("Version", variantName);
        params.set("wanted", "true");
      }

      if (user?.email) {
        params.set("email", user.email);
      }
      if (user?.id) {
        params.set("custom_fields[userId]", user.id);
      }

      const redirectUrl = `${baseUrl}?${params.toString()}`;
      window.location.href = redirectUrl;
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : "Payment error");
      setIsCheckingOut(null);
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
            ? "احصل على ترخيص متكامل لتوليد خطابات الدافع، فحص الـ ATS، وتتبع تقديماتك للعمل في ألمانيا."
            : isDe
            ? "Komplettzugang zu DIN 5008 Anschreiben, ATS-Check und Bewerbungs-Tracker für Deutschland."
            : "Get full access to AI cover letters, ATS resume audits, and application tracking for the German job market."}
        </p>
      </div>

      {/* User Current Status & Promo Redemption Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Current Plan Status Card */}
        <div className="md:col-span-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isAr ? "حالة حسابك الحالية" : isDe ? "Aktueller Kontostatus" : "Current Account Status"}
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
                {isAr ? "ينتهي في: " : isDe ? "Gültig bis: " : "Valid until: "}
                <span className="text-slate-200 font-bold">{formatExpiry(user.planExpiresAt)}</span>
              </p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span className="text-xs font-bold text-slate-300">
                {isAr ? "رصيد الذكاء الاصطناعي (AI Credits):" : isDe ? "KI-Guthaben:" : "Remaining AI Credits:"}
              </span>
            </div>
            <span className="text-base font-black text-emerald-400">
              {isPro
                ? (isAr
                    ? "20 طلب يومياً (متجددة تلقائياً)"
                    : isDe
                    ? "20 täglich (automatisch erneuert)"
                    : "20 Daily Requests (auto-renewed)")
                : `${user.aiCredits} ${isAr ? "رصيد" : isDe ? "Guthaben" : "Credits"}`}
            </span>
          </div>
        </div>

        {/* Promo Code Redemption Card */}
        <div className="md:col-span-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <span>🎁</span>
              <span>{isAr ? "هل لديك كود ترويجي أو تجريبي؟" : isDe ? "Haben Sie einen Gutscheincode?" : "Have a Promo or Trial Code?"}</span>
            </span>
            <h3 className="text-base font-bold text-white">
              {isAr ? "تفعيل كود الهدية / التجربة" : isDe ? "Gutscheincode einlösen" : "Redeem Gift / Trial Code"}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? "أدخل كود التخفيض أو المنحة الممنوحة من شركائنا لترقية حسابك فوراً."
                : isDe
                ? "Geben Sie Ihren Rabattcode ein, um Ihr Guthaben sofort aufzuladen."
                : "Enter your promotional code to instantly grant credits and trial access."}
            </p>
          </div>

          <form onSubmit={handleRedeemPromo} className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder={isAr ? "أدخل الكود هنا (مثال: GERMAN2026)" : "Enter code (e.g. GERMAN2026)"}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm uppercase font-mono tracking-wider focus:border-blue-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={isRedeeming || !promoCode.trim()}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all disabled:opacity-50 shrink-0 cursor-pointer shadow-md shadow-blue-600/20"
              >
                {isRedeeming ? (isAr ? "جاري التفعيل..." : isDe ? "Wird aktiviert..." : "Redeeming...") : isAr ? "تفعيل" : isDe ? "Einlösen" : "Redeem"}
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

      {/* Pricing Tiers Comparison Grid (3 Tiers) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto items-stretch pt-4">
        {/* Tier 1: Free Starter */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-7 space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? "المستوى المجاني" : isDe ? "Kostenlos" : "Free Plan"}
              </span>
              <h3 className="text-2xl font-black text-white">Starter</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "لبناء سيرة ذاتية قياسية واستكشاف الوظائف في ألمانيا"
                  : isDe
                  ? "Für den Einstieg und die Jobsuche in Deutschland"
                  : "For building standard CVs and browsing German jobs"}
              </p>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl sm:text-5xl font-black text-white">$0</span>
              <span className="text-xs text-slate-400 font-medium">
                {isAr ? "/ دائماً" : isDe ? "/ dauerhaft" : "/ forever"}
              </span>
            </div>

            <ul className="space-y-3.5 text-xs text-slate-300 pt-5 border-t border-slate-800">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold text-sm">✓</span>
                <span>
                  {isAr
                    ? "إنشاء سيرة ذاتية أساسية (1 سيرة بمعايير DIN 5008)"
                    : isDe
                    ? "Basis-Lebenslauf (1 DIN 5008 Lebenslauf)"
                    : "Basic resume creation (1 CV DIN 5008)"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold text-sm">✓</span>
                <span>
                  {isAr
                    ? "البحث في الوظائف وحفظ الفرص المفضلة"
                    : isDe
                    ? "Jobsuche & Lesezeichen"
                    : "Job search & bookmarks"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold text-sm">✓</span>
                <span>
                  {isAr
                    ? "3 أرصدة ذكاء اصطناعي أولية للبدء"
                    : isDe
                    ? "3 anfängliche KI-Guthaben"
                    : "3 initial AI credits"}
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-500">
                <span className="text-slate-600 font-bold text-sm">✕</span>
                <span>
                  {isAr
                    ? "تصدير ملف الترشيح الكامل (Bewerbungsmappe)"
                    : isDe
                    ? "Vollständige Bewerbungsmappe"
                    : "Full Bewerbungsmappe Dossier Compiler"}
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-500">
                <span className="text-slate-600 font-bold text-sm">✕</span>
                <span>
                  {isAr
                    ? "خطابات Anschreiben متقدمة يومياً"
                    : isDe
                    ? "Tägliche erweiterte Anschreiben"
                    : "Daily advanced AI Cover Letters"}
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-500">
                <span className="text-slate-600 font-bold text-sm">✕</span>
                <span>
                  {isAr
                    ? "تتبع متقدم لمراحل التقديم والمقابلات"
                    : isDe
                    ? "Erweiterter Bewerbungs-Tracker & Interview-Notizen"
                    : "Advanced application pipeline & interview tracking"}
                </span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            disabled
            className="w-full py-3.5 rounded-2xl bg-slate-800 text-slate-400 font-bold text-xs text-center cursor-not-allowed border border-slate-700/50"
          >
            {user.plan === "FREE"
              ? (isAr ? "خطتك الحالية" : isDe ? "Aktueller Tarif" : "Current Plan")
              : (isAr ? "مشمول مجاناً" : isDe ? "Im Starter enthalten" : "Included in Free")}
          </button>
        </div>

        {/* Tier 2: Quick Sprint ($9.99 / 30 يوماً) */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-7 space-y-6 flex flex-col justify-between shadow-xl transition-all">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                {isAr ? "تصريح الـ 30 يوماً" : isDe ? "30-Tage-Pass" : "30-Day Sprint Pass"}
              </span>
              <h3 className="text-2xl font-black text-white">Quick Sprint</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "صلاحية 30 يوماً للتقديمات السريعة والمكثفة على الوظائف"
                  : isDe
                  ? "30 Tage Gültigkeit für schnelle und zielgerichtete Bewerbungen"
                  : "30 days validity for fast applications"}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl sm:text-5xl font-black text-white">$9.99</span>
                <span className="text-xs text-slate-400 font-medium">
                  {isAr ? "/ 30 يوماً" : isDe ? "/ 30 Tage" : "/ 30 days"}
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-semibold">
                {isAr
                  ? "دفع لمرة واحدة • تفعيل فوري"
                  : isDe
                  ? "Einmalzahlung • Sofortige Freischaltung"
                  : "One-time payment • Instant activation"}
              </p>
            </div>

            <ul className="space-y-3.5 text-xs text-slate-200 pt-5 border-t border-slate-800">
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold text-sm">✓</span>
                <span className="font-semibold text-white">
                  {isAr
                    ? "صلاحية 30 يوماً للتقديم السريع على الوظائف"
                    : isDe
                    ? "30 Tage Gültigkeit für schnelle Bewerbungen"
                    : "30 days validity for fast applications"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold text-sm">✓</span>
                <span className="font-semibold text-white">
                  {isAr
                    ? "20 طلب ذكاء اصطناعي يومياً (الاستخدام العادل)"
                    : isDe
                    ? "20 tägliche KI-Anfragen (Fair Use)"
                    : "20 daily AI requests (Fair Use)"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold text-sm">✓</span>
                <span>
                  {isAr
                    ? "منشئ السير الذاتية DIN 5008 وفحص الـ ATS"
                    : isDe
                    ? "DIN 5008 CV-Builder & ATS-Checks"
                    : "DIN 5008 CV builder & ATS checks"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold text-sm">✓</span>
                <span>
                  {isAr
                    ? "تصدير غير محدود لسير ذاتية بصيغة PDF رسمية"
                    : isDe
                    ? "Unbegrenzter offizieller PDF-Export"
                    : "Unlimited official DIN 5008 PDF exports"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold text-sm">✓</span>
                <span>
                  {isAr
                    ? "دفع آمن ورابط مباشر عبر Gumroad"
                    : isDe
                    ? "Direkter Checkout via Gumroad"
                    : "Direct checkout link to Gumroad"}
                </span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleCheckout("Quick Sprint (30 Days)")}
            disabled={isCheckingOut !== null}
            className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-slate-700"
          >
            {isCheckingOut === "Quick Sprint (30 Days)" ? (
              <span>{isAr ? "جاري تحويلك لبوابة الدفع..." : isDe ? "Weiterleitung..." : "Redirecting..."}</span>
            ) : isPro ? (
              <span>{isAr ? "تمديد 30 يوماً (Quick Sprint) ⚡" : isDe ? "30 Tage verlängern ⚡" : "Extend 30 Days (Quick Sprint) ⚡"}</span>
            ) : (
              <span>{isAr ? "اختيار Quick Sprint ⚡" : isDe ? "Quick Sprint wählen ⚡" : "Choose Quick Sprint ⚡"}</span>
            )}
          </button>
        </div>

        {/* Tier 3: PRO Job Pass ($19.99 / 90 يوماً - شارة "الأكثر طلباً / وفر 35%") */}
        <div className="relative bg-gradient-to-b from-slate-900 via-blue-950/40 to-slate-950 border-2 border-blue-500 rounded-3xl p-7 space-y-6 shadow-2xl shadow-blue-500/10 flex flex-col justify-between transition-all">
          {/* Badge */}
          <div className="absolute -top-3.5 start-6 px-3.5 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-[11px] shadow-lg shadow-blue-600/30 flex items-center gap-1.5">
            <span>⭐</span>
            <span>{isAr ? "الأكثر طلباً • وفر 35%" : isDe ? "Bestseller • 35% Sparen" : "Most Popular • Save 35%"}</span>
          </div>

          <div className="space-y-5 pt-1">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                {isAr ? "جواز الباحث عن عمل" : isDe ? "Komplett-Pass" : "Full Career Pass"}
              </span>
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <span>PRO Job Pass</span>
                <span className="text-xl">💎</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isAr
                  ? "تغطية كاملة لدورة التوظيف الألمانية مع جميع الأدوات الاحترافية"
                  : isDe
                  ? "Deckt den gesamten deutschen Bewerbungszyklus mit allen Premium-Tools ab"
                  : "Complete coverage for the entire German hiring cycle"}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">
                  $19.99
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {isAr ? "/ 90 يوماً" : isDe ? "/ 90 Tage" : "/ 90 days"}
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-semibold">
                {isAr
                  ? "دفع لمرة واحدة • بدون اشتراك متكرر أو رسوم خفية"
                  : isDe
                  ? "Einmalzahlung • Keine wiederkehrenden Gebühren"
                  : "One-time payment • No recurring fees"}
              </p>
            </div>

            <ul className="space-y-3.5 text-xs text-slate-200 pt-5 border-t border-slate-800">
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold text-sm">✓</span>
                <span className="font-semibold text-white">
                  {isAr
                    ? "90 يوماً كاملة تغطي دورة التوظيف الألمانية بالكامل"
                    : isDe
                    ? "Volle 90 Tage für den gesamten deutschen Bewerbungszyklus"
                    : "90 full days covering the entire German hiring cycle"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold text-sm">✓</span>
                <span className="font-semibold text-white">
                  {isAr
                    ? "متتبع التقديمات المتكامل وملاحظات المقابلات"
                    : isDe
                    ? "Vollständiger Bewerbungs-Tracker & Interview-Notizen"
                    : "Full Application Tracker & interview notes"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold text-sm">✓</span>
                <span className="font-semibold text-white">
                  {isAr
                    ? "تجميع ملف الترشيح الكامل (Bewerbungsmappe: غلاف + سيرة + خطاب)"
                    : isDe
                    ? "Bewerbungsmappe-Dossier-Studio (Deckblatt + CV + Anschreiben)"
                    : "Bewerbungsmappe full dossier compiler (Cover + CV + Anschreiben)"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold text-sm">✓</span>
                <span className="font-semibold text-white">
                  {isAr
                    ? "20 طلب ذكاء اصطناعي يومياً (الاستخدام العادل)"
                    : isDe
                    ? "20 tägliche KI-Anfragen (Fair Use)"
                    : "20 daily AI requests (Fair Use)"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold text-sm">✓</span>
                <span>
                  {isAr
                    ? "فحص عميق للـ ATS ومطابقة الكلمات المفتاحية"
                    : isDe
                    ? "Tiefer ATS-Check & Keyword-Lückenanalyse"
                    : "Deep ATS audit & keyword gap analysis"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold text-sm">✓</span>
                <span>
                  {isAr
                    ? "دفع آمن ورابط مباشر عبر Gumroad"
                    : isDe
                    ? "Direkter Checkout via Gumroad"
                    : "Direct checkout link to Gumroad"}
                </span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleCheckout("PRO Job Pass (90 Days)")}
            disabled={isCheckingOut !== null}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isCheckingOut === "PRO Job Pass (90 Days)" ? (
              <span>{isAr ? "جاري تحويلك لبوابة الدفع..." : isDe ? "Weiterleitung..." : "Redirecting..."}</span>
            ) : isPro ? (
              <span>{isAr ? "تمديد اشتراك PRO (90 يوماً) 🚀" : isDe ? "90 Tage verlängern 🚀" : "Extend PRO Pass (90 Days) 🚀"}</span>
            ) : (
              <span>{isAr ? "احصل على PRO Job Pass 🚀" : isDe ? "PRO Job Pass sichern 🚀" : "Get PRO Job Pass 🚀"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
