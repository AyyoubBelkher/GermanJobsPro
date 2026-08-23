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

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isAr = locale === "ar";
  const isDe = locale === "de";

  const isPro = user?.plan === "PRO" && (!user.planExpiresAt || new Date(user.planExpiresAt) > new Date());
  const isTrial = user?.plan === "TRIAL";

  const handleCheckout = async () => {
    if (!user) {
      router.push(`/${locale}/auth/login?redirect=/${locale}/pricing`);
      return;
    }

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
        throw new Error(data.error || (isAr ? "فشل تجهيز عملية الدفع" : "Failed to initiate checkout"));
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : "Payment error");
      setIsCheckingOut(false);
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
        ? "نوفر الدفع الآمن والمشفر بنسبة 100% عبر بوابة Lemon Squeezy العالمية. يمكنك الدفع باستخدام البطاقات الائتمانية والبنكية (Visa, Mastercard, American Express)، بالإضافة إلى Apple Pay و Google Pay و PayPal."
        : isDe
        ? "Wir unterstützen alle gängigen Kreditkarten (Visa, Mastercard, Amex), Apple Pay, Google Pay sowie PayPal über unsere sichere Lemon Squeezy Zahlungsabwicklung."
        : "We support all major credit/debit cards (Visa, MasterCard, Amex), Apple Pay, Google Pay, and PayPal with 100% bank-grade encryption via Lemon Squeezy.",
    },
    {
      question: isAr
        ? "هل الدفع اشتراك متجدد أم دفعة لمرة واحدة؟"
        : isDe
        ? "Handelt es sich um ein Abonnement oder eine Einmalzahlung?"
        : "Is this a recurring subscription or a one-time pass?",
      answer: isAr
        ? "باقة PRO Pass هي تصريح شامل يمنحك وصولاً فورياً وكاملاً لكافة ميزات الذكاء الاصطناعي والاستيراد السحري وتجميع ملف الترشيح بدون أي رسوم خفية. يمكنك الإلغاء أو التجديد بكل حرية من لوحة التحكم."
        : isDe
        ? "Der PRO Pass bietet vollen Zugriff auf alle KI-Funktionen, den DIN 5008 Generator und die Bewerbungsmappe ohne versteckte Kosten. Sie behalten die volle Kontrolle."
        : "The PRO Pass gives you full, unrestricted access to all AI engines, Magic Import, and the complete Dossier Studio with no hidden fees.",
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
        : "Your account is upgraded to PRO instantly upon successful checkout. All premium AI generators, Magic Import, and PDF export tools become active immediately.",
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
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
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
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

      {/* Pricing Cards Comparison (Free Starter vs PRO Pass) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
        
        {/* TIER 1: Free Starter */}
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-8 sm:p-10 flex flex-col justify-between space-y-8 backdrop-blur-xl relative">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider inline-block">
                {isAr ? "البداية المجانية" : isDe ? "Kostenloser Einstieg" : "Free Starter"}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {isAr ? "الباقة المجانية" : isDe ? "Starter Plan" : "Starter Free"}
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
              <span className="text-4xl sm:text-5xl font-black text-white">0 €</span>
              <span className="text-xs text-slate-400 font-medium">
                {isAr ? "/ مجاناً للأبد" : isDe ? "/ dauerhaft kostenlos" : "/ forever free"}
              </span>
            </div>

            {/* Features List */}
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-300 pt-4 border-t border-slate-800/80">
              <li className="flex items-center gap-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{isAr ? "إنشاء وتعديل السيرة الذاتية (DIN 5008)" : "DIN 5008 Resume Builder"}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{isAr ? "تصدير وتحميل PDF رسمي غير محدود" : "Unlimited Official PDF Export"}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{isAr ? "تجربة الاستيراد السحري (1-Click PDF Import)" : "1-Click PDF Magic Import Trial"}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{isAr ? "فحص التوافق الأساسي مع أنظمة الـ ATS" : "Standard German ATS CV Check"}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{isAr ? "تصفح والتقديم على جميع وظائف ألمانيا" : "Full German Job Board Access"}</span>
              </li>
              <li className="flex items-center gap-3 text-slate-500 line-through">
                <span className="text-slate-600 font-bold">✕</span>
                <span>{isAr ? "مولد خطابات الدافع (Anschreiben) غير المحدود" : "Unlimited AI Cover Letter Generator"}</span>
              </li>
              <li className="flex items-center gap-3 text-slate-500 line-through">
                <span className="text-slate-600 font-bold">✕</span>
                <span>{isAr ? "تجميع ملف الترشيح الكامل (Bewerbungsmappe)" : "Complete Bewerbungsmappe Studio"}</span>
              </li>
            </ul>
          </div>

          <div>
            {user ? (
              <Link
                href={`/${locale}/dashboard/cv`}
                className="w-full block py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm text-center transition-all"
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


        {/* TIER 2: PRO Pass */}
        <div className="rounded-3xl bg-gradient-to-b from-blue-950/60 via-slate-900/90 to-purple-950/50 border-2 border-blue-500/50 p-8 sm:p-10 flex flex-col justify-between space-y-8 backdrop-blur-xl relative shadow-2xl shadow-blue-500/10 scale-100 lg:scale-105">
          {/* Popular Badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-xs shadow-lg shadow-blue-600/30 uppercase tracking-wider flex items-center gap-1.5">
            <span>⭐</span>
            <span>{isAr ? "الأكثر طلباً • الخيار الموصى به" : isDe ? "Bestseller • Empfohlen" : "Most Popular • Best Value"}</span>
          </div>

          <div className="space-y-6 pt-2">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs uppercase tracking-wider inline-block">
                {isAr ? "تصريح المحترفين الشامل" : isDe ? "Komplettpaket" : "All-Inclusive Pass"}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                <span>GermanJobsPro PRO Pass</span>
                <span className="text-xl">💎</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isAr
                  ? "الحزمة المتكاملة للمهنيين الباحثين عن عقود عمل وتأشيرة في ألمانيا بأعلى نسبة قبول."
                  : isDe
                  ? "Das Rundum-sorglos-Paket für maximale Erfolgschancen bei deutschen Arbeitgebern."
                  : "The all-inclusive toolkit to pass German ATS filters and land high-paying job interviews."}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                  9.99 €
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {isAr ? "/ تصريح كامل (أو ما يعادل 100 درهم)" : isDe ? "/ Einmaliger PRO Pass" : "/ Full Access Pass"}
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium">
                {isAr ? "✓ تفعيل فوري بدون قيود" : isDe ? "✓ Sofortige Freischaltung" : "✓ Instant Activation"}
              </p>
            </div>

            {/* Features List */}
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-200 pt-4 border-t border-slate-800/80">
              <li className="flex items-center gap-3">
                <span className="text-blue-400 font-bold">✓</span>
                <span className="font-semibold text-white">
                  {isAr ? "استيراد وتحسين سحري غير محدود (1-Click PDF to DIN 5008)" : "Unlimited 1-Click PDF Magic Import"}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-blue-400 font-bold">✓</span>
                <span className="font-semibold text-white">
                  {isAr ? "صياغة احترافية بأسلوب الأسماء الفعلية الألمانية (Substantivstil)" : "German Substantivstil Action Noun Engine"}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-blue-400 font-bold">✓</span>
                <span className="font-semibold text-white">
                  {isAr ? "مولد خطابات دافع (Anschreiben) غير محدود مخصص لكل وظيفة" : "Unlimited Job-Tailored AI Cover Letters"}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-blue-400 font-bold">✓</span>
                <span className="font-semibold text-white">
                  {isAr ? "استوديو الملف الكامل (Deckblatt + Anschreiben + Lebenslauf PDF)" : "Full Dossier Studio (Bewerbungsmappe PDF)"}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-blue-400 font-bold">✓</span>
                <span>{isAr ? "فاحص الـ ATS المتقدم وخطة سد الثغرات والكلمات المفتاحية" : "Advanced ATS Audit & Missing Keywords Engine"}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-blue-400 font-bold">✓</span>
                <span>{isAr ? "مطابقة مستويات اللغات المعتمدة للإطار الأوروبي (CEFR A1-C2)" : "CEFR Language Framework Alignment (A1-C2)"}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-blue-400 font-bold">✓</span>
                <span>{isAr ? "دعم فني وتوجيه مهني مخصص 24/7" : "Priority 24/7 Career Support"}</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            {checkoutError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium text-center">
                {checkoutError}
              </div>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={isCheckingOut || isPro}
              className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 border border-blue-400/30"
            >
              {isCheckingOut ? (
                <span>{isAr ? "جاري تحويلك إلى الدفع الآمن..." : "Redirecting to Checkout..."}</span>
              ) : isPro ? (
                <span>{isAr ? "✓ باقة PRO مفعلة على حسابك" : "✓ PRO Active on Your Account"}</span>
              ) : (
                <span>{isAr ? "احصل على باقة PRO Pass الآن 🚀" : isDe ? "PRO Pass jetzt sichern 🚀" : "Get PRO Pass Now 🚀"}</span>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400">
              🔒 {isAr ? "دفع آمن ومشفر 100% • تفعيل فوري" : "100% Secure Checkout • Instant Access"}
            </p>
          </div>
        </div>

      </div>


      {/* ========================================================= */}
      {/* PROMO CODE REDEMPTION SECTION */}
      {/* ========================================================= */}
      <div className="max-w-2xl mx-auto rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-5 text-center shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase">
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
                <th className="py-4 px-6 text-start font-bold">{isAr ? "الميزة / الأداة" : "Feature"}</th>
                <th className="py-4 px-6 text-center font-bold text-slate-400">{isAr ? "المجانية" : "Free Starter"}</th>
                <th className="py-4 px-6 text-center font-bold text-blue-400 bg-blue-600/10 border-x border-blue-500/20">
                  {isAr ? "PRO Pass 💎" : "PRO Pass 💎"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-3.5 px-6 font-medium">{isAr ? "بناء سيرة DIN 5008 وتصدير PDF" : "DIN 5008 Builder & PDF Export"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400">✓ {isAr ? "غير محدود" : "Unlimited"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 font-bold bg-blue-600/5 border-x border-blue-500/10">✓ {isAr ? "غير محدود" : "Unlimited"}</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">{isAr ? "الاستيراد السحري (1-Click PDF Magic Import)" : "1-Click PDF Magic Import"}</td>
                <td className="py-3.5 px-6 text-center text-slate-400">{isAr ? "تجريبي" : "1 Trial"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 font-bold bg-blue-600/5 border-x border-blue-500/10">✓ {isAr ? "غير محدود" : "Unlimited"}</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">{isAr ? "صياغة المهام بالأسماء الفعلية (Substantivstil)" : "German Substantivstil Engine"}</td>
                <td className="py-3.5 px-6 text-center text-slate-400">{isAr ? "أساسي" : "Basic"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 font-bold bg-blue-600/5 border-x border-blue-500/10">✓ {isAr ? "متقدم وغير محدود" : "Advanced & Unlimited"}</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">{isAr ? "مولد خطابات الدافع المخصص (Anschreiben)" : "AI Cover Letter Generator"}</td>
                <td className="py-3.5 px-6 text-center text-slate-400">{isAr ? "تجريبي" : "1 Trial"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 font-bold bg-blue-600/5 border-x border-blue-500/10">✓ {isAr ? "غير محدود لأي وظيفة" : "Unlimited"}</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">{isAr ? "استوديو ملف الترشيح الكامل (Bewerbungsmappe)" : "Complete Dossier Studio"}</td>
                <td className="py-3.5 px-6 text-center text-rose-400">✕</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 font-bold bg-blue-600/5 border-x border-blue-500/10">✓ {isAr ? "مضمّن بالكامل" : "Included"}</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">{isAr ? "فاحص الـ ATS وخطة سد الثغرات" : "ATS Audit & Missing Keywords"}</td>
                <td className="py-3.5 px-6 text-center text-slate-400">{isAr ? "نتيجة عامة" : "Basic Score"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 font-bold bg-blue-600/5 border-x border-blue-500/10">✓ {isAr ? "فحص عميق وكلمات مفتاحية" : "Deep Audit & Keyword Plan"}</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">{isAr ? "تصفح والتقديم على فرص العمل في ألمانيا" : "German Job Board & Apply"}</td>
                <td className="py-3.5 px-6 text-center text-emerald-400">✓</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 font-bold bg-blue-600/5 border-x border-blue-500/10">✓</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">{isAr ? "سرعة المعالجة والدعم الفني" : "Processing Speed & Support"}</td>
                <td className="py-3.5 px-6 text-center text-slate-400">{isAr ? "قياسية" : "Standard"}</td>
                <td className="py-3.5 px-6 text-center text-amber-300 font-bold bg-blue-600/5 border-x border-blue-500/10">⚡ {isAr ? "أولوية قصوى 24/7" : "Priority 24/7"}</td>
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
          <p className="text-[11px] text-slate-400">{isAr ? "تشفير بنكي عبر Lemon Squeezy" : "Bank-grade 256-bit encryption"}</p>
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
