"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GUMROAD_VARIANTS } from "@/lib/gumroad";

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
  triggerFeature?: "ats" | "cover_letter" | "dossier" | "credits" | "magic_import";
  user?: {
    id?: string;
    email?: string;
    name?: string | null;
    plan?: string;
    aiCredits?: number;
  } | null;
  onSuccess?: () => void;
}

const MODAL_I18N = {
  ar: {
    badge: "🚀 ترقية مرنة بدون اشتراك شهري",
    title: "لقد استهلكت رصيدك المجاني! جاهز للحصول على مقابلات عمل في ألمانيا؟",
    subtitle: "استثمر في مستقبلك المهني مع تراخيص GermanJobsPro الشفافة ذات الدفع لمرة واحدة — بدون أي اشتراكات متكررة أو مفاجآت.",
    dossierFeatureTitle: "قم بالترقية إلى Quick Sprint أو PRO Job Pass لفتح استوديو ملف الترشيح الكامل (Bewerbungsmappe)",
    quickSprint: {
      category: "تصريح الـ 30 يوماً",
      title: "Quick Sprint",
      price: "$9.99",
      period: "/ 30 يوماً",
      subtext: "دفع لمرة واحدة • تفعيل فوري",
      features: [
        "صلاحية كاملة لمدة 30 يوماً للتقديم السريع",
        "20 عملية ذكاء اصطناعي يومياً (وفق سياسة الاستخدام العادل)",
        "تحويل فوري وتكييف ذكي للسيرة الذاتية (1-Click PDF to DIN 5008)",
        "تجميع ملف الترشيح الكامل (Bewerbungsmappe) متاح 30 يوماً",
        "فحص وتدقيق ATS متوافق مع الشركات الألمانية",
        "توليد خطابات دافع (Anschreiben) وتصدير غير محدود لـ PDF",
      ],
      cta: "اختيار Quick Sprint ⚡",
    },
    proJobPass: {
      badge: "⭐ الأكثر طلباً • تغطية دورة التوظيف",
      category: "جواز المحترفين الشامل",
      title: "PRO Job Pass",
      price: "$19.99",
      period: "/ 90 يوماً",
      subtext: "دفع لمرة واحدة • بدون تجديد تلقائي",
      features: [
        "صلاحية 90 يوماً كاملة تغطي دورة التوظيف بألمانيا",
        "20 عملية ذكاء اصطناعي يومياً مع أولوية المعالجة",
        "تحويل وتكييف السير الذاتية (1-Click PDF to DIN 5008)",
        "تجميع ملف الترشيح الكامل 3-في-1 (Bewerbungsmappe)",
        "مطابقة السيرة مع أنظمة الفرز الآلي ATS الألمانية",
        "تصدير غير محدود واستخدام كامل لكافة الأدوات",
      ],
      cta: "ترقية إلى PRO Job Pass 💎",
    },
    promo: {
      label: "هل لديك كود ترويجي أو قسيمة منحة؟",
      placeholder: "أدخل الكود الترويجي هنا...",
      redeemBtn: "تفعيل الكود",
      redeeming: "جاري التفعيل...",
      success: "تم تفعيل الكود بنجاح وتمت ترقية حسابك!",
      loginRequired: "يرجى تسجيل الدخول أولاً لتفعيل الكود الترويجي.",
    },
    bottomLink: "هل ترغب بمراجعة جدول المقارنة التفصيلي؟ عرض صفحة الأسعار الكاملة ←",
    close: "إغلاق النافذة",
  },
  de: {
    badge: "🚀 Flexible Einmalzahlung ohne Abo",
    title: "Sie haben Ihr kostenloses Testguthaben aufgebraucht! Bereit für Vorstellungsgespräche in Deutschland?",
    subtitle: "Investieren Sie in Ihre Zukunft mit unseren transparenten Einmalpässen — keine automatischen Abos, keine versteckten Kosten.",
    dossierFeatureTitle: "Upgraden Sie auf Quick Sprint oder PRO Job Pass, um das Bewerbungsmappe-Studio freizuschalten",
    quickSprint: {
      category: "30-Tage Sprint Pass",
      title: "Quick Sprint",
      price: "$9.99",
      period: "/ 30 Tage",
      subtext: "Einmalzahlung • Sofortiger Zugriff",
      features: [
        "Volle 30 Tage Gültigkeit für Bewerbungen",
        "Bis zu 20 tägliche KI-Operationen (Fair-Use-Richtlinie)",
        "1-Klick PDF zu DIN 5008 Auto-Adapt",
        "Vollständige Bewerbungsmappe (30 Tage inklusive)",
        "Deutscher ATS-Audit-Check",
        "KI-Anschreiben Generator & unbegrenzte PDF-Exporte",
      ],
      cta: "Quick Sprint wählen ⚡",
    },
    proJobPass: {
      badge: "⭐ Bestseller • Voller Bewerbungszyklus",
      category: "Kompletter Karriere-Pass",
      title: "PRO Job Pass",
      price: "$19.99",
      period: "/ 90 Tage",
      subtext: "Einmalzahlung • Kein Abonnement",
      features: [
        "Volle 90 Tage für den gesamten deutschen Bewerbungszyklus",
        "20 tägliche KI-Operationen mit Priorität",
        "1-Click PDF to DIN 5008 Auto-Adapt",
        "Vollständige 3-in-1 Bewerbungsmappe (Deckblatt + Anschreiben + CV)",
        "Umfassender ATS-Abgleich für maximale Erfolgschancen",
        "Unbegrenzte offizielle PDF-Exporte & voller Tool-Zugang",
      ],
      cta: "PRO Job Pass sichern 💎",
    },
    promo: {
      label: "Haben Sie einen Rabatt- oder Stipendiencode?",
      placeholder: "Code hier eingeben...",
      redeemBtn: "Einlösen",
      redeeming: "Wird aktiviert...",
      success: "Code erfolgreich eingelöst! Ihr Tarif wurde aktualisiert.",
      loginRequired: "Bitte melden Sie sich an, um den Code einzulösen.",
    },
    bottomLink: "Möchten Sie den vollständigen Funktionsvergleich sehen? Preisübersicht öffnen →",
    close: "Schließen",
  },
  fr: {
    badge: "🚀 Accès transparent sans abonnement récurrent",
    title: "Vous avez utilisé vos crédits d'essai gratuits ! Prêt à décrocher des entretiens en Allemagne ?",
    subtitle: "Investissez dans votre carrière avec nos pass uniques transparents — aucun abonnement récurrent, zéro mauvaise surprise.",
    dossierFeatureTitle: "Passez à Quick Sprint ou PRO Job Pass pour débloquer le studio Bewerbungsmappe 3-en-1",
    quickSprint: {
      category: "Pass Sprint 30 jours",
      title: "Quick Sprint",
      price: "$9.99",
      period: "/ 30 jours",
      subtext: "Paiement unique • Accès immédiat",
      features: [
        "Validité complète de 30 jours pour vos candidatures",
        "Jusqu'à 20 opérations IA par jour (Fair Use)",
        "Conversion instantanée 1-Click PDF vers DIN 5008",
        "Compilateur Bewerbungsmappe inclus pendant 30 jours",
        "Audit de conformité ATS allemand",
        "Générateur de lettre de motivation IA et exports PDF illimités",
      ],
      cta: "Choisir Quick Sprint ⚡",
    },
    proJobPass: {
      badge: "⭐ Le plus populaire • Cycle complet d'embauche",
      category: "Pass Carrière Complet",
      title: "PRO Job Pass",
      price: "$19.99",
      period: "/ 90 jours",
      subtext: "Paiement unique • Aucun abonnement",
      features: [
        "90 jours complets couvrant tout le cycle de recrutement",
        "20 opérations IA quotidiennes avec traitement prioritaire",
        "Conversion 1-Click PDF vers DIN 5008",
        "Compilateur Bewerbungsmappe 3-en-1 (Page de garde, lettre, CV)",
        "Audit ATS allemand approfondi pour maximiser les entretiens",
        "Exports illimités et accès complet à tous les outils",
      ],
      cta: "Obtenir PRO Job Pass 💎",
    },
    promo: {
      label: "Avez-vous un code promotionnel ?",
      placeholder: "Entrez votre code...",
      redeemBtn: "Activer",
      redeeming: "Activation...",
      success: "Code activé avec succès ! Votre compte a été mis à niveau.",
      loginRequired: "Veuillez vous connecter pour utiliser un code promo.",
    },
    bottomLink: "Vous souhaitez consulter le comparatif détaillé ? Voir tous les tarifs →",
    close: "Fermer",
  },
  en: {
    badge: "🚀 Frictionless One-Time Passes — Zero Subscriptions",
    title: "You've used your free trial credits! Ready to land interviews in Germany?",
    subtitle: "Invest in your career with transparent, one-time passes — no recurring subscriptions, no sneaky charges.",
    dossierFeatureTitle: "Upgrade to Quick Sprint or PRO Job Pass to unlock the complete Bewerbungsmappe Studio",
    quickSprint: {
      category: "30-Day Sprint Pass",
      title: "Quick Sprint",
      price: "$9.99",
      period: "/ 30 days",
      subtext: "One-time payment • Instant activation",
      features: [
        "Full 30 days active application validity",
        "Up to 20 daily AI operations (Fair Use)",
        "1-Click PDF to DIN 5008 Auto-Adapt",
        "Full Bewerbungsmappe Dossier Compiler (included for 30 days)",
        "German ATS compliance audit & scoring",
        "AI Anschreiben Cover Letter Generator & unlimited PDF exports",
      ],
      cta: "Choose Quick Sprint ⚡",
    },
    proJobPass: {
      badge: "⭐ Most Popular • Full German Hiring Cycle",
      category: "Complete Career Pass",
      title: "PRO Job Pass",
      price: "$19.99",
      period: "/ 90 days",
      subtext: "One-time payment • No auto-renewal",
      features: [
        "90 full days covering the entire German recruitment cycle",
        "Up to 20 daily AI operations with priority processing",
        "1-Click PDF to DIN 5008 Auto-Adapt",
        "3-in-1 Bewerbungsmappe Studio (Deckblatt + Letter + CV)",
        "Comprehensive ATS scanner with keyword optimization",
        "Unlimited official exports and full tool access",
      ],
      cta: "Upgrade to PRO Job Pass 💎",
    },
    promo: {
      label: "Have a promo voucher or partner code?",
      placeholder: "Enter voucher code...",
      redeemBtn: "Redeem Code",
      redeeming: "Redeeming...",
      success: "Promo code redeemed successfully! Your account is upgraded.",
      loginRequired: "Please sign in first to redeem a promo code.",
    },
    bottomLink: "Looking for the full comparison table? View full pricing page →",
    close: "Close",
  },
};

export default function UpgradeModal({
  isOpen,
  onClose,
  locale = "ar",
  triggerFeature,
  user: propUser,
  onSuccess,
}: UpgradeModalProps) {
  const router = useRouter();
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const t = MODAL_I18N[locale as keyof typeof MODAL_I18N] || MODAL_I18N.en;

  const [currentUser, setCurrentUser] = useState(propUser || null);
  const [promoCode, setPromoCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Sync user prop if passed, or fetch current user on open if not available
  useEffect(() => {
    if (propUser) {
      setCurrentUser(propUser);
      return;
    }
    if (isOpen && !currentUser?.email) {
      fetch("/api/user/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data?.user) {
            setCurrentUser(data.user);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, propUser]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCheckout = async (variantName: string) => {
    setIsCheckingOut(variantName);
    setCheckoutError(null);

    try {
      // 1. Try server checkout API for validated redirection
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant: variantName }),
      });

      const data = await res.json();
      if (data?.success && data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // 2. Direct Gumroad fallback if API returns unauthenticated or error
      const baseUrl =
        process.env.NEXT_PUBLIC_GUMROAD_PRODUCT_URL ||
        "https://germanjobspro.gumroad.com/l/pro-pass";
      const params = new URLSearchParams();

      if (variantName) {
        params.set("variant", variantName);
        params.set("Version", variantName);
        params.set("wanted", "true");
      }
      if (currentUser?.email) {
        params.set("email", currentUser.email);
      }
      if (currentUser?.id) {
        params.set("custom_fields[userId]", currentUser.id);
      }

      window.location.href = `${baseUrl}?${params.toString()}`;
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : "Payment error");
      setIsCheckingOut(null);
    }
  };

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
        body: JSON.stringify({ code: promoCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 401) {
          throw new Error(t.promo.loginRequired);
        }
        throw new Error(data.error || "Invalid promo code");
      }

      setPromoSuccess(data.message || t.promo.success);
      setPromoCode("");

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        router.refresh();
        onClose();
      }, 1400);
    } catch (err: unknown) {
      setPromoError(err instanceof Error ? err.message : "Error redeeming promo code");
    } finally {
      setIsRedeeming(false);
    }
  };

  const isDossierTrigger = triggerFeature === "dossier";

  return (
    <div
      role="dialog"
      aria-modal="true"
      dir={dir}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Dark Blur Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl shadow-blue-950/50 text-slate-100 z-10 space-y-7 my-auto max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label={t.close}
          className="absolute top-5 end-5 w-10 h-10 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all border border-slate-700/50"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <span>{t.badge}</span>
          </div>

          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug">
            {isDossierTrigger ? t.dossierFeatureTitle : t.title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
            {t.subtitle}
          </p>

          {checkoutError && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs font-semibold">
              ⚠️ {checkoutError}
            </div>
          )}
        </div>

        {/* 2-Tier Side-by-Side Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 items-stretch pt-1">
          {/* Tier 1: Quick Sprint ($9.99) */}
          <div className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 space-y-5 flex flex-col justify-between transition-all shadow-lg">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  {t.quickSprint.category}
                </span>
                <h4 className="text-2xl font-black text-white">{t.quickSprint.title}</h4>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black text-white">
                    {t.quickSprint.price}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {t.quickSprint.period}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-400 font-semibold">
                  {t.quickSprint.subtext}
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800/80">
                {t.quickSprint.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleCheckout(GUMROAD_VARIANTS.SPRINT_30D)}
              disabled={isCheckingOut !== null}
              type="button"
              className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isCheckingOut === GUMROAD_VARIANTS.SPRINT_30D ? "⏳ ..." : t.quickSprint.cta}
            </button>
          </div>

          {/* Tier 2: PRO Job Pass ($19.99) - Featured */}
          <div className="relative bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 border-2 border-blue-500 rounded-3xl p-6 space-y-5 flex flex-col justify-between shadow-2xl shadow-blue-500/15">
            {/* Featured Badge */}
            <div className="absolute -top-3.5 start-6 px-3.5 py-1 rounded-full bg-blue-600 text-white font-black text-[11px] shadow-lg shadow-blue-600/30 flex items-center gap-1 border border-blue-400/40">
              <span>{t.proJobPass.badge}</span>
            </div>

            <div className="space-y-4 pt-1">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  {t.proJobPass.category}
                </span>
                <h4 className="text-2xl font-black text-white flex items-center gap-2">
                  <span>{t.proJobPass.title}</span>
                  <span className="text-lg">💎</span>
                </h4>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-200">
                    {t.proJobPass.price}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {t.proJobPass.period}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-400 font-semibold">
                  {t.proJobPass.subtext}
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-200 pt-4 border-t border-slate-800/80">
                {t.proJobPass.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">✓</span>
                    <span className="font-semibold">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleCheckout(GUMROAD_VARIANTS.PRO_90D)}
              disabled={isCheckingOut !== null}
              type="button"
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm border border-blue-400/30 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01]"
            >
              {isCheckingOut === GUMROAD_VARIANTS.PRO_90D ? "⏳ ..." : t.proJobPass.cta}
            </button>
          </div>
        </div>

        {/* Integrated Promo Code Form */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <span>🎟️</span>
            <span>{t.promo.label}</span>
          </div>

          <form onSubmit={handleRedeemPromo} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              dir={locale === "ar" && !promoCode ? "rtl" : "ltr"}
              placeholder={t.promo.placeholder}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs font-sans uppercase placeholder:font-sans placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={isRedeeming || !promoCode.trim()}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all disabled:opacity-40 cursor-pointer shrink-0"
            >
              {isRedeeming ? t.promo.redeeming : t.promo.redeemBtn}
            </button>
          </form>

          {promoSuccess && (
            <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <span>✅</span>
              <span>{promoSuccess}</span>
            </p>
          )}

          {promoError && (
            <p className="text-xs text-red-400 font-semibold flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{promoError}</span>
            </p>
          )}
        </div>

        {/* Full Pricing Page Navigation Link */}
        <div className="text-center pt-1">
          <Link
            href={`/${locale}/pricing`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-400 hover:text-blue-400 transition-colors"
          >
            <span>{t.bottomLink}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
