"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GUMROAD_VARIANTS } from "@/lib/gumroad";
import { formatBidiInlineText } from "@/lib/courseUtils";

function PricingCheckIcon({ className }: { className: string }) {
  return (
    <svg
      className={`w-4 h-4 shrink-0 mt-0.5 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function PricingXIcon({ className }: { className: string }) {
  return (
    <svg
      className={`w-4 h-4 shrink-0 mt-0.5 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

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
  const isFr = locale === "fr";

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
        throw new Error(
          data.error ||
            (isAr
              ? "فشل تفعيل الكود الترويجي"
              : isDe
              ? "Gutscheincode konnte nicht eingelöst werden"
              : isFr
              ? "Échec de l'activation du code promo"
              : "Failed to redeem promo code")
        );
      }

      setPromoSuccess(data.message);
      setPromoCode("");
      router.refresh();
    } catch (err: unknown) {
      setPromoError(
        err instanceof Error
          ? err.message
          : isAr
          ? "حدث خطأ أثناء تفعيل الكود الترويجي"
          : isDe
          ? "Fehler beim Einlösen des Gutscheincodes"
          : isFr
          ? "Erreur lors de l'activation du code promo"
          : "Error redeeming promo code"
      );
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
      setCheckoutError(
        err instanceof Error
          ? err.message
          : isAr
          ? "حدث خطأ أثناء الدفع"
          : isDe
          ? "Zahlungsfehler"
          : isFr
          ? "Erreur de paiement"
          : "Payment error"
      );
      setIsCheckingOut(null);
    }
  };

  const formatExpiry = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString(isAr ? "ar-MA" : isDe ? "de-DE" : isFr ? "fr-FR" : "en-US", {
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
          <span>
            {isAr ? "الترقية والاشتراكات" : isDe ? "Pläne & Preise" : isFr ? "Formules & Tarifs" : "Plans & Pricing"}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {isAr
            ? "سرّع قبولك في سوق العمل الألماني 🇩🇪"
            : isDe
            ? "Beschleunigen Sie Ihre Karriere in Deutschland 🇩🇪"
            : isFr
            ? "Accélérez votre recrutement en Allemagne 🇩🇪"
            : "Accelerate your hiring in Germany 🇩🇪"}
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          {isAr
            ? "احصل على ترخيص متكامل لتوليد خطابات الدافع، فحص الـ ATS، وتكييف سيرتك الذاتية للعمل في ألمانيا."
            : isDe
            ? "Komplettzugang zu DIN 5008 Anschreiben, ATS-Check und KI-Lebenslauf für Deutschland."
            : isFr
            ? "Accès complet aux lettres de motivation IA, audits ATS et adaptation DIN 5008 pour l'Allemagne."
            : "Get full access to AI cover letters, ATS resume audits, and DIN 5008 adaptation for the German job market."}
        </p>
      </div>

      {/* User Current Status & Promo Redemption Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Current Plan Status Card */}
        <div className="md:col-span-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isAr
                ? "حالة حسابك الحالية"
                : isDe
                ? "Aktueller Kontostatus"
                : isFr
                ? "Statut actuel du compte"
                : "Current Account Status"}
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
                {isAr ? "ينتهي في: " : isDe ? "Gültig bis: " : isFr ? "Valable jusqu'au : " : "Valid until: "}
                <span className="text-slate-200 font-bold">{formatExpiry(user.planExpiresAt)}</span>
              </p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span className="text-xs font-bold text-slate-300">
                {isAr
                  ? "رصيد الذكاء الاصطناعي (AI Credits):"
                  : isDe
                  ? "KI-Guthaben:"
                  : isFr
                  ? "Crédits IA restants :"
                  : "Remaining AI Credits:"}
              </span>
            </div>
            <span className="text-base font-black text-emerald-400">
              {isPro
                ? (isAr
                    ? "20 طلب يومياً (متجددة تلقائياً)"
                    : isDe
                    ? "20 täglich (automatisch erneuert)"
                    : isFr
                    ? "20 requêtes/jour (renouvelées)"
                    : "20 Daily Requests (auto-renewed)")
                : `${user.aiCredits} ${isAr ? "رصيد" : isDe ? "Guthaben" : isFr ? "Crédits" : "Credits"}`}
            </span>
          </div>
        </div>

        {/* Promo Code Redemption Card */}
        <div className="md:col-span-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <span>🎁</span>
              <span>
                {isAr
                  ? "هل لديك كود ترويجي أو تجريبي؟"
                  : isDe
                  ? "Haben Sie einen Gutscheincode?"
                  : isFr
                  ? "Vous avez un code promo ou d'essai ?"
                  : "Have a Promo or Trial Code?"}
              </span>
            </span>
            <h3 className="text-base font-bold text-white">
              {isAr
                ? "تفعيل كود الهدية / التجربة"
                : isDe
                ? "Gutscheincode einlösen"
                : isFr
                ? "Activer un code cadeau / essai"
                : "Redeem Gift / Trial Code"}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? "أدخل كود التخفيض أو المنحة الممنوحة من شركائنا لترقية حسابك فوراً."
                : isDe
                ? "Geben Sie Ihren Rabattcode ein, um Ihr Guthaben sofort aufzuladen."
                : isFr
                ? "Saisissez votre code promo pour activer instantanément vos crédits et votre accès."
                : "Enter your promotional code to instantly grant credits and trial access."}
            </p>
          </div>

          <form onSubmit={handleRedeemPromo} className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                dir={isAr && !promoCode ? "rtl" : "ltr"}
                placeholder={
                  isAr
                    ? "أدخل الكود هنا (مثال: GERMAN2026)"
                    : isDe
                    ? "Code eingeben (z. B. GERMAN2026)"
                    : isFr
                    ? "Entrez le code (ex. GERMAN2026)"
                    : "Enter code (e.g. GERMAN2026)"
                }
                className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-400 text-xs sm:text-sm font-sans uppercase placeholder:font-sans placeholder:normal-case placeholder:tracking-normal focus:border-blue-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={isRedeeming || !promoCode.trim()}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all disabled:opacity-50 shrink-0 cursor-pointer shadow-md shadow-blue-600/20"
              >
                {isRedeeming
                  ? isAr
                    ? "جاري التفعيل..."
                    : isDe
                    ? "Wird aktiviert..."
                    : isFr
                    ? "Activation..."
                    : "Redeeming..."
                  : isAr
                  ? "تفعيل"
                  : isDe
                  ? "Einlösen"
                  : isFr
                  ? "Activer"
                  : "Redeem"}
              </button>
            </div>

            {promoSuccess && (
              <p className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl flex items-center gap-1.5">
                <PricingCheckIcon className="text-emerald-400 mt-0!" />
                <span>{promoSuccess}</span>
              </p>
            )}

            {promoError && (
              <p className="text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl flex items-center gap-1.5">
                <PricingXIcon className="text-rose-400 mt-0!" />
                <span>{promoError}</span>
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
                {isAr ? "المستوى المجاني" : isDe ? "Kostenlos" : isFr ? "Forfait gratuit" : "Free Plan"}
              </span>
              <h3 className="text-2xl font-black text-white">Starter</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "لبناء سيرة ذاتية قياسية واستكشاف الوظائف في ألمانيا"
                  : isDe
                  ? "Für den Einstieg und die Jobsuche in Deutschland"
                  : isFr
                  ? "Pour créer votre CV DIN 5008 et explorer les emplois en Allemagne"
                  : "For building standard CVs and browsing German jobs"}
              </p>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl sm:text-5xl font-black text-white">$0</span>
              <span className="text-xs text-slate-400 font-medium">
                {isAr ? "/ دائماً" : isDe ? "/ dauerhaft" : isFr ? "/ pour toujours" : "/ forever"}
              </span>
            </div>

            <ul className="space-y-3.5 text-xs text-slate-300 pt-5 border-t border-slate-800">
              <li className="flex items-start gap-2.5">
                <PricingCheckIcon className="text-emerald-400" />
                <span>
                  {formatBidiInlineText(
                    isAr
                      ? "إنشاء سيرة ذاتية أساسية (1 سيرة بمعايير DIN 5008)"
                      : isDe
                      ? "Basis-Lebenslauf (1 DIN 5008 Lebenslauf)"
                      : isFr
                      ? "Création de CV standard (1 CV conforme DIN 5008)"
                      : "Basic resume creation (1 CV DIN 5008)",
                    isAr
                  )}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <PricingCheckIcon className="text-emerald-400" />
                <span>
                  {isAr
                    ? "البحث في الوظائف وحفظ الفرص المفضلة"
                    : isDe
                    ? "Jobsuche & Lesezeichen"
                    : isFr
                    ? "Recherche d'emploi et favoris"
                    : "Job search & bookmarks"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <PricingCheckIcon className="text-emerald-400" />
                <span>
                  {isAr
                    ? "3 أرصدة ذكاء اصطناعي أولية للبدء (3 محاولات تجريبية)"
                    : isDe
                    ? "3 anfängliche KI-Guthaben (3 Testguthaben)"
                    : isFr
                    ? "3 crédits IA initiaux pour démarrer (3 essais gratuits)"
                    : "3 starter AI trial credits to get started"}
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-300">
                <PricingCheckIcon className="text-blue-400" />
                <span>
                  {formatBidiInlineText(
                    isAr
                      ? "تجميع ملف الترشيح الكامل (Bewerbungsmappe) — تجريبي (1 رصيد)"
                      : isDe
                      ? "Vollständige Bewerbungsmappe — Test (1 Credit)"
                      : isFr
                      ? "Compilateur Bewerbungsmappe — Essai (1 crédit)"
                      : "Full Bewerbungsmappe Dossier Compiler — Trial (1 Credit)",
                    isAr
                  )}
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-400">
                <PricingXIcon className="text-slate-500" />
                <span>
                  {formatBidiInlineText(
                    isAr
                      ? "خطابات Anschreiben متقدمة يومياً"
                      : isDe
                      ? "Tägliche erweiterte Anschreiben"
                      : isFr
                      ? "Lettres de motivation Anschreiben avancées quotidiennes"
                      : "Daily advanced AI Cover Letters",
                    isAr
                  )}
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-400">
                <PricingXIcon className="text-slate-500" />
                <span>
                  {formatBidiInlineText(
                    isAr
                      ? "تحويل فوري وتكييف ذكي للسيرة الذاتية (1-Click PDF to DIN 5008)"
                      : isDe
                      ? "1-Klick PDF zu DIN 5008 Auto-Adapt"
                      : isFr
                      ? "Conversion instantanée 1-Click PDF vers DIN 5008"
                      : "1-Click PDF to DIN 5008 Auto-Adapt",
                    isAr
                  )}
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
              ? (isAr ? "خطتك الحالية" : isDe ? "Aktueller Tarif" : isFr ? "Forfait actuel" : "Current Plan")
              : (isAr ? "مشمول مجاناً" : isDe ? "Im Starter enthalten" : isFr ? "Inclus gratuitement" : "Included in Free")}
          </button>
        </div>

        {/* Tier 2: Quick Sprint ($9.99 / 30 يوماً) */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-7 space-y-6 flex flex-col justify-between shadow-xl transition-all">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                {isAr ? "تصريح الـ 30 يوماً" : isDe ? "30-Tage-Pass" : isFr ? "Pass Sprint 30 jours" : "30-Day Sprint Pass"}
              </span>
              <h3 className="text-2xl font-black text-white">Quick Sprint</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? "صلاحية 30 يوماً للتقديمات السريعة والمكثفة على الوظائف"
                  : isDe
                  ? "30 Tage Gültigkeit für schnelle und zielgerichtete Bewerbungen"
                  : isFr
                  ? "Validité de 30 jours pour vos candidatures intensives en Allemagne"
                  : "30 days validity for fast applications"}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl sm:text-5xl font-black text-white">$9.99</span>
                <span className="text-xs text-slate-400 font-medium">
                  {isAr ? "/ 30 يوماً" : isDe ? "/ 30 Tage" : isFr ? "/ 30 jours" : "/ 30 days"}
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-semibold">
                {isAr
                  ? "دفع لمرة واحدة • تفعيل فوري"
                  : isDe
                  ? "Einmalzahlung • Sofortige Freischaltung"
                  : isFr
                  ? "Paiement unique • Activation immédiate"
                  : "One-time payment • Instant activation"}
              </p>
            </div>

            <ul className="space-y-3.5 text-xs text-slate-200 pt-5 border-t border-slate-800">
              <li className="flex items-start gap-2.5">
                <PricingCheckIcon className="text-blue-400" />
                <span className="font-semibold text-white">
                  {isAr
                    ? "صلاحية 30 يوماً للتقديم السريع على الوظائف"
                    : isDe
                    ? "30 Tage Gültigkeit für schnelle Bewerbungen"
                    : isFr
                    ? "Validité de 30 jours pour candidatures intensives"
                    : "30 days validity for fast applications"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <PricingCheckIcon className="text-blue-400" />
                <span className="font-semibold text-white">
                  {formatBidiInlineText(
                    isAr
                      ? "20 عملية ذكاء اصطناعي يومياً (وفق سياسة الاستخدام العادل)"
                      : isDe
                      ? "Bis zu 20 tägliche KI-Operationen (Fair-Use-Richtlinie)"
                      : isFr
                      ? "Jusqu'à 20 opérations IA par jour (utilisation équitable)"
                      : "Up to 20 daily AI operations (Fair Use)",
                    isAr
                  )}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <PricingCheckIcon className="text-blue-400" />
                <span className="font-semibold text-white">
                  {formatBidiInlineText(
                    isAr
                      ? "تحويل فوري وتكييف ذكي للسيرة الذاتية (1-Click PDF to DIN 5008)"
                      : isDe
                      ? "1-Klick PDF zu DIN 5008 Auto-Adapt"
                      : isFr
                      ? "Conversion instantanée 1-Click PDF vers DIN 5008"
                      : "1-Click PDF to DIN 5008 Auto-Adapt",
                    isAr
                  )}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <PricingCheckIcon className="text-blue-400" />
                <span className="font-semibold text-white">
                  {formatBidiInlineText(
                    isAr
                      ? "تجميع ملف الترشيح الكامل (Bewerbungsmappe) — متاح (30 يوماً)"
                      : isDe
                      ? "Vollständige Bewerbungsmappe — Inklusive (30 Tage)"
                      : isFr
                      ? "Compilateur Bewerbungsmappe — Inclus (30 jours)"
                      : "Full Bewerbungsmappe Dossier Compiler — Included (30 days)",
                    isAr
                  )}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <PricingCheckIcon className="text-blue-400" />
                <span>
                  {formatBidiInlineText(
                    isAr
                      ? "منشئ السير الذاتية DIN 5008 وفحص الـ ATS"
                      : isDe
                      ? "DIN 5008 CV-Builder & ATS-Checks"
                      : isFr
                      ? "Créateur de CV DIN 5008 et audits ATS"
                      : "DIN 5008 CV builder & ATS checks",
                    isAr
                  )}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <PricingCheckIcon className="text-blue-400" />
                <span>
                  {formatBidiInlineText(
                    isAr
                      ? "مولد خطابات دافع (Anschreiben) مخصص لكل وظيفة"
                      : isDe
                      ? "Maßgeschneiderte KI-Anschreiben für jede Stelle"
                      : isFr
                      ? "Lettres de motivation personnalisées par IA"
                      : "Job-Tailored AI Cover Letters",
                    isAr
                  )}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <PricingCheckIcon className="text-blue-400" />
                <span>
                  {isAr
                    ? "تصدير غير محدود لسير ذاتية بصيغة PDF رسمية"
                    : isDe
                    ? "Unbegrenzter offizieller PDF-Export"
                    : isFr
                    ? "Exports PDF officiels illimités"
                    : "Unlimited official DIN 5008 PDF exports"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <PricingCheckIcon className="text-blue-400" />
                <span>
                  {isAr
                    ? "دفع آمن ورابط مباشر عبر Gumroad"
                    : isDe
                    ? "Direkter Checkout via Gumroad"
                    : isFr
                    ? "Paiement sécurisé direct via Gumroad"
                    : "Direct checkout link to Gumroad"}
                </span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleCheckout(GUMROAD_VARIANTS.SPRINT_30D)}
            disabled={isCheckingOut !== null}
            className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-slate-700"
          >
            {isCheckingOut === GUMROAD_VARIANTS.SPRINT_30D ? (
              <span>{isAr ? "جاري تحويلك لبوابة الدفع..." : isDe ? "Weiterleitung..." : isFr ? "Redirection..." : "Redirecting..."}</span>
            ) : isPro ? (
              <span>{isAr ? "تمديد 30 يوماً (Quick Sprint) ⚡" : isDe ? "30 Tage verlängern ⚡" : isFr ? "Prolonger 30 jours (Quick Sprint) ⚡" : "Extend 30 Days (Quick Sprint) ⚡"}</span>
            ) : (
              <span>{isAr ? "اختيار Quick Sprint ⚡" : isDe ? "Quick Sprint wählen ⚡" : isFr ? "Choisir Quick Sprint ⚡" : "Choose Quick Sprint ⚡"}</span>
            )}
          </button>
        </div>

        {/* Tier 3: PRO Job Pass ($19.99 / 90 يوماً - شارة "الأكثر طلباً / وفر 35%") */}
        <div className="relative bg-gradient-to-b from-slate-900 via-blue-950/40 to-slate-950 border-2 border-blue-500 rounded-3xl p-7 space-y-6 shadow-2xl shadow-blue-500/10 flex flex-col justify-between transition-all">
          {/* Badge */}
          <div className="absolute -top-3.5 start-6 px-3.5 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-[11px] shadow-lg shadow-blue-600/30 flex items-center gap-1.5">
            <span>⭐</span>
            <span>{isAr ? "الأكثر طلباً • وفر 35%" : isDe ? "Bestseller • 35% Sparen" : isFr ? "Le plus populaire • -35 %" : "Most Popular • Save 35%"}</span>
          </div>

          <div className="space-y-5 pt-1">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                {isAr ? "جواز الباحث عن عمل" : isDe ? "Komplett-Pass" : isFr ? "Pass Carrière Complet" : "Full Career Pass"}
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
                  : isFr
                  ? "Couverture complète du cycle de recrutement allemand avec tous les outils PRO"
                  : "Complete coverage for the entire German hiring cycle"}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">
                  $19.99
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {isAr ? "/ 90 يوماً" : isDe ? "/ 90 Tage" : isFr ? "/ 90 jours" : "/ 90 days"}
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-semibold">
                {isAr
                  ? "دفع لمرة واحدة • بدون اشتراك متكرر أو رسوم خفية"
                  : isDe
                  ? "Einmalzahlung • Keine wiederkehrenden Gebühren"
                  : isFr
                  ? "Paiement unique • Sans abonnement ni frais cachés"
                  : "One-time payment • No recurring fees"}
              </p>
            </div>

            <ul className="space-y-3.5 text-xs text-slate-200 pt-5 border-t border-slate-800">
              <li className="flex items-start gap-2.5">
                <PricingCheckIcon className="text-blue-400" />
                <span className="font-semibold text-white">
                  {isAr
                    ? "90 يوماً كاملة تغطي دورة التوظيف الألمانية بالكامل"
                    : isDe
                    ? "90 volle Tage für den gesamten deutschen Bewerbungszyklus"
                    : isFr
                    ? "90 jours complets couvrant tout le cycle de recrutement"
                    : "90 full days covering the entire German hiring cycle"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <PricingCheckIcon className="text-blue-400" />
                <span className="font-semibold text-white">
                  {formatBidiInlineText(
                    isAr
                      ? "تحويل فوري وتكييف ذكي للسيرة الذاتية (1-Click PDF to DIN 5008)"
                      : isDe
                      ? "1-Klick PDF zu DIN 5008 Auto-Adapt"
                      : isFr
                      ? "Conversion instantanée 1-Click PDF vers DIN 5008"
                      : "1-Click PDF to DIN 5008 Auto-Adapt",
                    isAr
                  )}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <PricingCheckIcon className="text-blue-400" />
                <span className="font-semibold text-white">
                  {formatBidiInlineText(
                    isAr
                      ? "تجميع ملف الترشيح الكامل (Bewerbungsmappe: غلاف + سيرة + خطاب)"
                      : isDe
                      ? "Bewerbungsmappe-Dossier-Studio (Deckblatt + CV + Anschreiben)"
                      : isFr
                      ? "Studio Bewerbungsmappe complet (Page de garde + CV + Lettre)"
                      : "Bewerbungsmappe full dossier compiler (Cover + CV + Anschreiben)",
                    isAr
                  )}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <PricingCheckIcon className="text-blue-400" />
                <span className="font-semibold text-white">
                  {formatBidiInlineText(
                    isAr
                      ? "20 عملية ذكاء اصطناعي يومياً (وفق سياسة الاستخدام العادل)"
                      : isDe
                      ? "20 tägliche KI-Operationen (Fair Use)"
                      : isFr
                      ? "20 opérations IA quotidiennes (utilisation équitable)"
                      : "Up to 20 daily AI operations (Fair Use)",
                    isAr
                  )}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <PricingCheckIcon className="text-blue-400" />
                <span>
                  {isAr
                    ? "فحص عميق للـ ATS ومطابقة الكلمات المفتاحية"
                    : isDe
                    ? "Tiefer ATS-Check & Keyword-Lückenanalyse"
                    : isFr
                    ? "Audit ATS approfondi et analyse des mots-clés"
                    : "Deep ATS audit & keyword gap analysis"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <PricingCheckIcon className="text-blue-400" />
                <span>
                  {isAr
                    ? "دفع آمن ورابط مباشر عبر Gumroad"
                    : isDe
                    ? "Direkter Checkout via Gumroad"
                    : isFr
                    ? "Paiement sécurisé direct via Gumroad"
                    : "Direct checkout link to Gumroad"}
                </span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleCheckout(GUMROAD_VARIANTS.PRO_90D)}
            disabled={isCheckingOut !== null}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isCheckingOut === GUMROAD_VARIANTS.PRO_90D ? (
              <span>{isAr ? "جاري تحويلك لبوابة الدفع..." : isDe ? "Weiterleitung..." : isFr ? "Redirection..." : "Redirecting..."}</span>
            ) : isPro ? (
              <span>{isAr ? "تمديد اشتراك PRO (90 يوماً) 🚀" : isDe ? "90 Tage verlängern 🚀" : isFr ? "Prolonger le Pass PRO (90 jours) 🚀" : "Extend PRO Pass (90 Days) 🚀"}</span>
            ) : (
              <span>{isAr ? "احصل على PRO Job Pass 🚀" : isDe ? "PRO Job Pass sichern 🚀" : isFr ? "Obtenir PRO Job Pass 🚀" : "Get PRO Job Pass 🚀"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
