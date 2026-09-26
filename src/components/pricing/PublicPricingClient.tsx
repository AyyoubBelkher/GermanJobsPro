"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LandingFaqAccordion from "@/components/landing/LandingFaqAccordion";

export interface PricingUser {
  id: string;
  email: string;
  name?: string | null;
  plan: string;
  planExpiresAt?: string | Date | null;
  aiCredits: number;
}

interface PublicPricingClientProps {
  user: PricingUser | null;
  locale: string;
}

export default function PublicPricingClient({
  user: initialUser,
  locale,
}: PublicPricingClientProps) {
  const router = useRouter();
  const [user, setUser] = useState<PricingUser | null>(initialUser);
  const [promoCode, setPromoCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isAr = locale === "ar";
  const isDe = locale === "de";

  const isPro =
    (user?.plan === "PRO" || user?.plan === "SPRINT") &&
    (!user.planExpiresAt || new Date(user.planExpiresAt) > new Date());
  const isTrial = user?.plan === "TRIAL";

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

  const handleRedeemPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    if (!user) {
      setPromoError(
        isAr
          ? "يجب تسجيل الدخول أولاً لتفعيل الكود الترويجي."
          : isDe
          ? "Bitte melden Sie sich zuerst an, um den Rabattcode einzulösen."
          : "Please sign in first to redeem a promo code."
      );
      return;
    }

    setIsRedeeming(true);
    setPromoSuccess(null);
    setPromoError(null);

    try {
      const res = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            (isAr ? "الكود الترويجي غير صالح أو منتهي الصلاحية." : "Invalid or expired promo code.")
        );
      }

      setPromoSuccess(data.message);
      setPromoCode("");
      if (user) {
        setUser({
          ...user,
          plan: data.plan || "PRO",
          planExpiresAt: data.planExpiresAt,
          aiCredits: data.totalCredits !== undefined ? data.totalCredits : user.aiCredits + (data.creditsGranted || 0),
        });
      }
      router.refresh();
    } catch (err: unknown) {
      setPromoError(err instanceof Error ? err.message : "Error redeeming promo code");
    } finally {
      setIsRedeeming(false);
    }
  };

  const faqItems = [
    {
      question: isAr
        ? "ما هي طرق الدفع المتاحة والمدعومة؟"
        : isDe
        ? "Welche Zahlungsmethoden werden unterstützt?"
        : "What payment methods are supported?",
      answer: isAr
        ? "نوفر الدفع الآمن والمشفر بنسبة 100% عبر بوابة Gumroad العالمية. يمكنك الدفع باستخدام البطاقات الائتمانية والبنكية (Visa, Mastercard, American Express)، بالإضافة إلى Apple Pay و Google Pay و PayPal."
        : isDe
        ? "Wir unterstützen alle gängigen Kreditkarten (Visa, Mastercard, Amex), Apple Pay, Google Pay sowie PayPal über unsere sichere Gumroad Zahlungsabwicklung."
        : "We support all major credit/debit cards (Visa, MasterCard, Amex), Apple Pay, Google Pay, and PayPal with 100% bank-grade encryption via Gumroad.",
    },
    {
      question: isAr
        ? "هل الدفع اشتراك متجدد أم دفعة لمرة واحدة؟"
        : isDe
        ? "Handelt es sich um ein Abonnement oder eine Einmalzahlung?"
        : "Is this a recurring subscription or a one-time pass?",
      answer: isAr
        ? "كلا الخيارين (Quick Sprint بـ $9.99 لـ 30 يوماً، أو PRO Job Pass بـ $19.99 لـ 90 يوماً) يعتمدان نظام الدفع لمرة واحدة فقط (One-Time Payment). لا توجد أي اشتراكات دورية تلقائية أو رسوم خفية إطلاقاً."
        : isDe
        ? "Sowohl der Quick Sprint (9,99 USD für 30 Tage) als auch der PRO Job Pass (19,99 USD für 90 Tage) sind reine Einmalzahlungen ohne automatische Verlängerung oder versteckte Gebühren."
        : "Both options (Quick Sprint at $9.99 for 30 days, or PRO Job Pass at $19.99 for 90 days) are strictly one-time payments. There are no recurring auto-renewals or hidden charges.",
    },
    {
      question: isAr
        ? "ماذا يحدث بعد ترقية حسابي إلى باقة PRO؟"
        : isDe
        ? "Was passiert sofort nach dem Kauf von PRO?"
        : "What happens immediately after upgrading to PRO?",
      answer: isAr
        ? "يتم تفعيل كافة ميزات باقة المحترفين فورياً وتلقائياً على حسابك بمجرد إتمام الدفع، بما في ذلك زيادة رصيد الذكاء الاصطناعي اليومي، وتفعيل استيراد وتوليد ملفات الترشيح (Bewerbungsmappe) الكاملة."
        : isDe
        ? "Ihr Konto wird sofort nach der erfolgreichen Zahlung automatisch auf PRO hochgestuft. Alle Premium-Funktionen stehen Ihnen ohne Wartezeit zur Verfügung."
        : "Your account is upgraded to PRO instantly upon successful checkout. All premium AI generators, 1-Click PDF to DIN 5008 adaptation, and PDF export tools become active immediately.",
    },
    {
      question: isAr
        ? "هل يوجد ضمان استرجاع الأموال؟"
        : isDe
        ? "Gibt es eine Geld-zurück-Garantie?"
        : "Is there a money-back guarantee?",
      answer: isAr
        ? "نعم! نحن واثقون تماماً من جودة ملفاتنا وتوافقها الصارم مع المعايير الألمانية. نوفر ضمان استرجاع الأموال لمدة 14 يوماً إذا واجهت أي مشكلة فنية لم نتمكن من حلها لك."
        : isDe
        ? "Ja, wir bieten eine 14-tägige Zufriedenheitsgarantie. Bei technischen Problemen steht Ihnen unser Support jederzeit zur Seite."
        : "Yes! We offer a 14-day satisfaction guarantee. If you encounter any technical issues our team cannot resolve, we provide a prompt refund.",
    },
  ];

  return (
    <div className="space-y-20">
      
      {/* Current Active Plan Status Banner (if logged in) */}
      {user && (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  {user.name || user.email.split("@")[0]}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                    isPro
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : isTrial
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
                >
                  {isPro ? "💎 PRO PASS" : isTrial ? "🎁 TRIAL PRO" : "⚡ FREE STARTER"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isPro
                  ? isAr
                    ? "اشتراكك نشط مع حد استخدام يومي متجدد (20 طلب/يوم)"
                    : "Active PRO membership with daily fair-use quota (20 requests/day)"
                  : isAr
                  ? `رصيد الذكاء الاصطناعي المتبقي لديك: ${user.aiCredits} طلب`
                  : `Remaining AI credits: ${user.aiCredits} requests`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href={`/${locale}/dashboard/cv`}
              className="w-full sm:w-auto text-center px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition-colors"
            >
              {isAr ? "الانتقال إلى لوحة التحكم ←" : isDe ? "Zum Dashboard ←" : "Go to Dashboard ←"}
            </Link>
          </div>
        </div>
      )}

      {/* Pricing Cards Comparison (3 Tiers Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto items-stretch">
        
        {/* TIER 1: Free Starter */}
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-7 sm:p-8 flex flex-col justify-between space-y-6 backdrop-blur-xl relative">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider inline-block">
                {isAr ? "البداية المجانية" : isDe ? "Kostenloser Einstieg" : "Free Starter"}
              </span>
              <h3 className="text-2xl font-black text-white">
                {isAr ? "Starter" : isDe ? "Starter" : "Starter"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {isAr
                  ? "مثالية للتعرف على المنصة وإنشاء سيرتك الذاتية وتجربة أدوات الفحص مجاناً."
                  : isDe
                  ? "Ideal zum Kennenlernen der Plattform und Erstellen Ihres ersten Lebenslaufs."
                  : "Perfect for exploring the platform and creating your initial DIN 5008 CV."}
              </p>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-white">$0</span>
              <span className="text-xs text-slate-400 font-medium">
                {isAr ? "/ دائماً" : isDe ? "/ dauerhaft" : "/ forever"}
              </span>
            </div>

            {/* Features List */}
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-300 pt-5 border-t border-slate-800/80">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold text-sm">✓</span>
                <span>{isAr ? "إنشاء سيرة ذاتية أساسية (1 سيرة بمعايير DIN 5008)" : isDe ? "Basis-Lebenslauf (1 DIN 5008 Lebenslauf)" : "Basic resume creation (1 CV DIN 5008)"}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold text-sm">✓</span>
                <span>{isAr ? "البحث في الوظائف وحفظ الفرص المفضلة" : isDe ? "Jobsuche & Lesezeichen" : "Job search & bookmarks"}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold text-sm">✓</span>
                <span>{isAr ? "3 أرصدة ذكاء اصطناعي أولية للبدء" : isDe ? "3 anfängliche KI-Guthaben" : "3 initial AI credits"}</span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-500 line-through">
                <span className="text-slate-600 font-bold text-sm">✕</span>
                <span>{isAr ? "تجميع ملف الترشيح الكامل (Bewerbungsmappe)" : isDe ? "Vollständige Bewerbungsmappe" : "Full Bewerbungsmappe Dossier Compiler"}</span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-500 line-through">
                <span className="text-slate-600 font-bold text-sm">✕</span>
                <span>
                  {isAr
                    ? "خطابات Anschreiben متقدمة يومياً"
                    : isDe
                    ? "Tägliche erweiterte Anschreiben"
                    : "Daily advanced AI Cover Letters"}
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-500 line-through">
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

          <div>
            {user ? (
              <Link
                href={`/${locale}/dashboard/cv`}
                className="w-full block py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm text-center transition-all border border-slate-700"
              >
                {isAr ? "متابعة استخدام الباقة الحالية" : isDe ? "Aktuellen Plan nutzen" : "Continue with Free Plan"}
              </Link>
            ) : (
              <Link
                href={`/${locale}/auth/signup`}
                className="w-full block py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm text-center transition-all border border-slate-700"
              >
                {isAr ? "إنشاء حساب مجاني الآن 🚀" : isDe ? "Kostenlos starten 🚀" : "Start Free Account 🚀"}
              </Link>
            )}
          </div>
        </div>


        {/* TIER 2: Quick Sprint */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-7 sm:p-8 flex flex-col justify-between space-y-6 backdrop-blur-xl relative shadow-xl transition-all">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs uppercase tracking-wider inline-block">
                {isAr ? "تصريح الـ 30 يوماً" : isDe ? "30-Tage-Pass" : "30-Day Sprint Pass"}
              </span>
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <span>Quick Sprint</span>
                <span className="text-xl">⚡</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isAr
                  ? "صلاحية 30 يوماً للتقديمات السريعة والمكثفة على فرص العمل المتاحة."
                  : isDe
                  ? "30 Tage Gültigkeit für schnelle und zielgerichtete Bewerbungen."
                  : "30 days validity for fast applications to active German job openings."}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-white">
                  $9.99
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {isAr ? "/ 30 يوماً" : isDe ? "/ 30 Tage" : "/ 30 days"}
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium">
                {isAr ? "✓ دفع لمرة واحدة • بدون اشتراك متكرر • تفعيل فوري" : isDe ? "✓ Einmalzahlung • Keine Abofalle • Sofortfreischaltung" : "✓ One-time payment • No recurring fees • Instant activation"}
              </p>
            </div>

            {/* Features List */}
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-200 pt-5 border-t border-slate-800/80">
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
                    ? "20 طلب ذكاء اصطناعي يومياً (وفق سياسة الاستخدام العادل)"
                    : isDe
                    ? "Bis zu 20 tägliche KI-Anfragen (Fair-Use-Richtlinie)"
                    : "20 daily AI requests (Fair Use)"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold text-sm">✓</span>
                <span className="font-semibold text-white">
                  {isAr ? "منشئ السير الذاتية DIN 5008 وفحص الـ ATS" : isDe ? "DIN 5008 Lebenslauf-Builder & ATS-Checks" : "DIN 5008 CV builder & ATS checks"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold text-sm">✓</span>
                <span>
                  {isAr ? "مولد خطابات دافع (Anschreiben) مخصص لكل وظيفة" : isDe ? "Maßgeschneiderte KI-Anschreiben für jede Stelle" : "Job-Tailored AI Cover Letters"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold text-sm">✓</span>
                <span>
                  {isAr ? "تصدير غير محدود لسير ذاتية بصيغة PDF رسمية" : isDe ? "Unbegrenzter offizieller PDF-Export" : "Unlimited official DIN 5008 PDF exports"}
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

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleCheckout("Quick Sprint (30 Days)")}
              disabled={isCheckingOut !== null}
              className="w-full py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs sm:text-sm shadow-lg hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
            >
              {isCheckingOut === "Quick Sprint (30 Days)" ? (
                <span>{isAr ? "جاري تحويلك إلى الدفع الآمن..." : isDe ? "Weiterleitung..." : "Redirecting to Checkout..."}</span>
              ) : isPro ? (
                <span>{isAr ? "تمديد 30 يوماً (Quick Sprint) ⚡" : isDe ? "30 Tage verlängern ⚡" : "Extend 30 Days (Quick Sprint) ⚡"}</span>
              ) : (
                <span>{isAr ? "اختيار Quick Sprint (30 يوماً) ⚡" : isDe ? "Quick Sprint wählen (30 Tage) ⚡" : "Choose Quick Sprint (30 Days) ⚡"}</span>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400">
              🔒 {isAr ? "رابط مباشر عبر Gumroad • تفعيل فوري" : isDe ? "Direkter Gumroad-Link • Sofortaktivierung" : "Direct Gumroad link • Instant Access"}
            </p>
          </div>
        </div>


        {/* TIER 3: PRO Job Pass (Featured) */}
        <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-blue-950/70 to-slate-900 border-2 border-blue-500 p-7 sm:p-8 flex flex-col justify-between space-y-6 backdrop-blur-xl relative shadow-2xl shadow-blue-500/10 scale-100 lg:scale-105">
          {/* Popular Badge */}
          <div className="absolute -top-4 start-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs shadow-lg shadow-blue-600/30 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
            <span>⭐</span>
            <span>{isAr ? "الأكثر طلباً • وفر 35%" : isDe ? "Bestseller • 35% Sparen" : "Most Popular • Save 35%"}</span>
          </div>

          <div className="space-y-5 pt-2">
            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs uppercase tracking-wider inline-block">
                {isAr ? "تصريح المحترفين الشامل" : isDe ? "Komplettpaket" : "All-Inclusive Pass"}
              </span>
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <span>PRO Job Pass</span>
                <span className="text-xl">💎</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isAr
                  ? "90 يوماً كاملة تغطي دورة التوظيف بالكامل مع إمكانية تصدير الدوسيه الكامل وتتبع المقابلات."
                  : isDe
                  ? "Volle 90 Tage für den gesamten Bewerbungszyklus mit vollständiger Bewerbungsmappe und Tracker."
                  : "90 full days covering the entire German hiring cycle with full Bewerbungsmappe compiler."}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">
                  $19.99
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {isAr ? "/ 90 يوماً" : isDe ? "/ 90 Tage" : "/ 90 days"}
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium">
                {isAr ? "✓ دفع لمرة واحدة لدورة التقديم • بدون اشتراك متكرر" : isDe ? "✓ Einmalzahlung für Ihren Bewerbungszyklus • Keine Abofalle" : "✓ One-time payment for your application cycle • No recurring fees"}
              </p>
            </div>

            {/* Features List */}
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-200 pt-5 border-t border-slate-800/80">
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold text-sm">✓</span>
                <span className="font-semibold text-white">
                  {isAr
                    ? "90 يوماً كاملة تغطي دورة التوظيف الألمانية بالكامل"
                    : isDe
                    ? "90 volle Tage für den gesamten deutschen Bewerbungszyklus"
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
                    ? "Tiefer ATS-Audit & Keyword-Lückenanalyse"
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

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleCheckout("PRO Job Pass (90 Days)")}
              disabled={isCheckingOut !== null}
              className="w-full py-4 px-8 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 border border-blue-400/30"
            >
              {isCheckingOut === "PRO Job Pass (90 Days)" ? (
                <span>{isAr ? "جاري تحويلك إلى الدفع الآمن..." : isDe ? "Weiterleitung..." : "Redirecting to Checkout..."}</span>
              ) : isPro ? (
                <span>{isAr ? "تمديد اشتراك PRO (90 يوماً) 🚀" : isDe ? "90 Tage verlängern 🚀" : "Extend PRO Pass (90 Days) 🚀"}</span>
              ) : (
                <span>{isAr ? "احصل على PRO Job Pass الآن 🚀" : isDe ? "PRO Job Pass jetzt sichern 🚀" : "Get PRO Job Pass Now 🚀"}</span>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400">
              🔒 {isAr ? "رابط مباشر عبر Gumroad • تفعيل فوري" : isDe ? "Direkter Gumroad-Link • Sofortaktivierung" : "Direct Gumroad link • Instant Access"}
            </p>
          </div>
        </div>

      </div>


      {/* ========================================================= */}
      {/* PROMO CODE REDEMPTION SECTION */}
      {/* ========================================================= */}
      <div className="max-w-2xl mx-auto rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-5 text-center shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase">
            <span>🎁</span>
            <span>{isAr ? "كوبون أو كود خصم ترويجي" : isDe ? "Gutscheincode" : "Voucher or Promo Code"}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            {isAr ? "هل تملك كوداً ترويجياً أو كوبون خصم؟" : isDe ? "Haben Sie einen Gutscheincode?" : "Have a Promo Code or Voucher?"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            {isAr
              ? "أدخل كود التخفيض أو المنحة لتفعيل باقة PRO أو شحن رصيد إضافي فوراً على حسابك."
              : isDe
              ? "Geben Sie Ihren Aktionscode ein, um Ihr Guthaben sofort aufzuladen."
              : "Enter your promotional code to upgrade or top up your AI credits immediately."}
          </p>
        </div>

        {promoSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-medium animate-fadeIn">
            🎉 {promoSuccess}
          </div>
        )}

        {promoError && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-medium animate-fadeIn">
            ⚠️ {promoError}
          </div>
        )}

        <form onSubmit={handleRedeemPromo} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder={isAr ? "أدخل الكود هنا (مثال: GERMAN2026)" : "e.g. GERMAN2026"}
            className="flex-1 w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 font-mono text-center sm:text-start text-sm uppercase focus:outline-none focus:border-blue-500 transition-all"
            required
          />
          <button
            type="submit"
            disabled={isRedeeming || !promoCode.trim()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isRedeeming ? (isAr ? "جاري التحقق..." : "Verifying...") : isAr ? "تفعيل الكود ✨" : "Apply Code ✨"}
          </button>
        </form>
      </div>


      {/* ========================================================= */}
      {/* DETAILED FEATURES COMPARISON TABLE */}
      {/* ========================================================= */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl sm:text-3xl font-black text-white">
            {isAr ? "مقارنة تفصيلية بين الباقات" : isDe ? "Detaillierter Funktionsvergleich" : "Detailed Feature Comparison"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            {isAr
              ? "تعرف على كافة الأدوات والخدمات المتاحة في كل خطة"
              : isDe
              ? "Alle Werkzeuge und Leistungen im direkten Vergleich"
              : "Compare all included features across plans"}
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl">
          <table className="w-full text-start text-xs sm:text-sm text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-white">
                <th className="py-4 px-6 text-start font-bold">{isAr ? "الميزة / الأداة" : isDe ? "Funktion / Werkzeug" : "Feature / Tool"}</th>
                <th className="py-4 px-6 text-center font-bold text-slate-400">{isAr ? "المجانية ($0)" : isDe ? "Starter ($0)" : "Starter ($0)"}</th>
                <th className="py-4 px-6 text-center font-bold text-slate-300 bg-slate-800/40">
                  {isAr ? "Quick Sprint ($9.99)" : isDe ? "Quick Sprint ($9.99)" : "Quick Sprint ($9.99)"}
                </th>
                <th className="py-4 px-6 text-center font-bold text-blue-400 bg-blue-600/10 border-x border-blue-500/20">
                  {isAr ? "PRO Job Pass ($19.99) ⭐" : isDe ? "PRO Job Pass ($19.99) ⭐" : "PRO Job Pass ($19.99) ⭐"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-3.5 px-6 font-medium">{isAr ? "صلاحية الاستخدام" : isDe ? "Gültigkeitsdauer" : "Validity Duration"}</td>
                <td className="py-3.5 px-6 text-center text-slate-400">{isAr ? "دائماً" : isDe ? "Dauerhaft" : "Forever"}</td>
                <td className="py-3.5 px-6 text-center text-slate-300 bg-slate-800/20">{isAr ? "30 يوماً" : isDe ? "30 Tage" : "30 Days"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 font-bold bg-blue-600/5 border-x border-blue-500/10">{isAr ? "90 يوماً (دورة توظيف كاملة)" : isDe ? "90 Tage (voller Zyklus)" : "90 Days (Full Cycle)"}</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">{isAr ? "بناء سيرة DIN 5008 وتصدير PDF" : isDe ? "DIN 5008 Builder & PDF-Export" : "DIN 5008 Builder & PDF Export"}</td>
                <td className="py-3.5 px-6 text-center text-slate-400">{isAr ? "1 سيرة ذاتية" : isDe ? "1 Lebenslauf" : "1 Resume"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 bg-slate-800/20">✓ {isAr ? "غير محدود" : isDe ? "Unbegrenzt" : "Unlimited"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 font-bold bg-blue-600/5 border-x border-blue-500/10">✓ {isAr ? "غير محدود" : isDe ? "Unbegrenzt" : "Unlimited"}</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">{isAr ? "البحث في الوظائف وحفظ الفرص المفضلة" : isDe ? "Jobsuche & Lesezeichen" : "Job Search & Bookmarks"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400">✓</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 bg-slate-800/20">✓</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 font-bold bg-blue-600/5 border-x border-blue-500/10">✓</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">{isAr ? "طلبات الذكاء الاصطناعي اليومية" : isDe ? "Tägliche KI-Anfragen" : "Daily AI Requests"}</td>
                <td className="py-3.5 px-6 text-center text-slate-400">{isAr ? "3 أرصدة أولية" : isDe ? "3 anfängliche Guthaben" : "3 Initial Credits"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 bg-slate-800/20">{isAr ? "20 طلباً يومياً" : isDe ? "20 täglich" : "20 Daily Requests"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 font-bold bg-blue-600/5 border-x border-blue-500/10">{isAr ? "20 طلباً يومياً" : isDe ? "20 täglich" : "20 Daily Requests"}</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">{isAr ? "فاحص الـ ATS وتحليل الكلمات المفتاحية" : isDe ? "ATS-Check & Keyword-Analyse" : "ATS Audit & Keyword Analysis"}</td>
                <td className="py-3.5 px-6 text-center text-slate-400">{isAr ? "فحص أساسي" : isDe ? "Basis-Check" : "Basic Audit"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 bg-slate-800/20">✓ {isAr ? "فحص ATS كامل" : isDe ? "Vollständiger ATS-Check" : "Full ATS Audit"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 font-bold bg-blue-600/5 border-x border-blue-500/10">✓ {isAr ? "فحص عميق وخطة كلمات مفتاحية" : isDe ? "Tiefer Audit & Keyword-Plan" : "Deep Audit & Keyword Plan"}</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">{isAr ? "مولد خطابات الدافع المخصص (Anschreiben)" : isDe ? "KI-Anschreiben Generator" : "AI Cover Letter Generator"}</td>
                <td className="py-3.5 px-6 text-center text-slate-400">{isAr ? "تجريبي" : isDe ? "1 Test" : "1 Trial"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 bg-slate-800/20">✓ {isAr ? "20 طلباً يومياً" : isDe ? "20 täglich" : "20 Daily Requests"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 font-bold bg-blue-600/5 border-x border-blue-500/10">✓ {isAr ? "20 طلباً يومياً" : isDe ? "20 täglich" : "20 Daily Requests"}</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">
                  {isAr
                    ? "متتبع التقديمات المتكامل وملاحظات المقابلات"
                    : isDe
                    ? "Bewerbungs-Tracker & Pipeline"
                    : "Application Tracker & Notes"}
                </td>
                <td className="py-3.5 px-6 text-center text-rose-400">✕</td>
                <td className="py-3.5 px-6 text-center text-slate-400 bg-slate-800/20">{isAr ? "أساسي" : isDe ? "Basis" : "Basic"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 font-bold bg-blue-600/5 border-x border-blue-500/10">
                  ✓ {isAr ? "متكامل ومتقدم مع ملاحظات المقابلات" : isDe ? "Vollständig & Interview-Notizen" : "Full Pipeline & Interview Notes"}
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">{isAr ? "استوديو ملف الترشيح الكامل (Bewerbungsmappe)" : isDe ? "Vollständige Bewerbungsmappe" : "Complete Bewerbungsmappe Studio"}</td>
                <td className="py-3.5 px-6 text-center text-rose-400">✕</td>
                <td className="py-3.5 px-6 text-center text-rose-400 bg-slate-800/20">✕</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 font-bold bg-blue-600/5 border-x border-blue-500/10">✓ {isAr ? "مضمّن بالكامل (غلاف + سيرة + خطاب)" : isDe ? "Inklusive (Deckblatt + CV + Anschreiben)" : "Included (Cover + CV + Anschreiben)"}</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">{isAr ? "تحويل فوري (1-Click PDF to DIN 5008)" : isDe ? "1-Click PDF zu DIN 5008" : "1-Click PDF to DIN 5008"}</td>
                <td className="py-3.5 px-6 text-center text-slate-400">{isAr ? "تجريبي" : isDe ? "1 Test" : "1 Trial"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 bg-slate-800/20">✓ {isAr ? "غير محدود" : isDe ? "Unbegrenzt" : "Unlimited"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 font-bold bg-blue-600/5 border-x border-blue-500/10">✓ {isAr ? "غير محدود" : isDe ? "Unbegrenzt" : "Unlimited"}</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">{isAr ? "طريقة الدفع والتفعيل" : isDe ? "Zahlungsmodell & Support" : "Payment & Support"}</td>
                <td className="py-3.5 px-6 text-center text-slate-400">{isAr ? "مجاناً $0" : isDe ? "Kostenlos $0" : "Free $0"}</td>
                <td className="py-3.5 px-6 text-center text-slate-300 bg-slate-800/20">{isAr ? "دفع لمرة واحدة ($9.99)" : isDe ? "Einmalzahlung ($9.99)" : "One-Time ($9.99)"}</td>
                <td className="py-3.5 px-6 text-center text-amber-300 font-bold bg-blue-600/5 border-x border-blue-500/10">⚡ {isAr ? "دفع لمرة واحدة ($19.99) • أولوية 24/7" : isDe ? "Einmalzahlung ($19.99) • Priorität 24/7" : "One-Time ($19.99) • Priority 24/7"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>


      {/* ========================================================= */}
      {/* TRUST & SECURITY BADGES */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="text-2xl">🔒</div>
          <h4 className="font-bold text-white text-xs sm:text-sm">{isAr ? "دفع آمن 100%" : "100% Secure Checkout"}</h4>
          <p className="text-[11px] text-slate-400">{isAr ? "تشفير بنكي عبر Gumroad" : "Bank-grade 256-bit encryption via Gumroad"}</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="text-2xl">⚡</div>
          <h4 className="font-bold text-white text-xs sm:text-sm">{isAr ? "تفعيل فوري" : "Instant Activation"}</h4>
          <p className="text-[11px] text-slate-400">{isAr ? "وصول فوري لجميع الأدوات" : "Zero waiting time"}</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="text-2xl">🛡️</div>
          <h4 className="font-bold text-white text-xs sm:text-sm">{isAr ? "ضمان الرضا" : "Satisfaction Guarantee"}</h4>
          <p className="text-[11px] text-slate-400">{isAr ? "ضمان استرجاع لمدة 14 يوماً" : "14-day money back guarantee"}</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="text-2xl">🇩🇪</div>
          <h4 className="font-bold text-white text-xs sm:text-sm">{isAr ? "معايير رسمية" : "German Standard"}</h4>
          <p className="text-[11px] text-slate-400">{isAr ? "مطابق لتأشيرة وبطاقة الفرصة" : "DIN 5008 & Visa compliant"}</p>
        </div>
      </div>


      {/* ========================================================= */}
      {/* PRICING FAQ SECTION */}
      {/* ========================================================= */}
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h3 className="text-2xl sm:text-3xl font-black text-white">
            {isAr ? "الأسئلة الشائعة حول الخطط والاشتراك" : isDe ? "Häufige Fragen zu Preisen" : "Frequently Asked Questions About Pricing"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            {isAr ? "إجابات واضحة وشفافة حول عمليات الدفع والتفعيل" : "Clear answers about payment and activation"}
          </p>
        </div>

        <LandingFaqAccordion items={faqItems} />
      </div>

    </div>
  );
}
