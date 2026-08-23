import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { cookies } from "next/headers";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { verifyUserSession } from "@/lib/user-session";
import PublicPricingClient from "@/components/pricing/PublicPricingClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  const isDe = locale === "de";

  return {
    title: isAr
      ? "الأسعار وباقات الاشتراك 💎 | GermanJobsPro 🇩🇪"
      : isDe
      ? "Preise & Tarife (PRO Pass) 💎 | GermanJobsPro 🇩🇪"
      : "Pricing & Plans (PRO Pass) 💎 | GermanJobsPro 🇩🇪",
    description: isAr
      ? "استثمر في مستقبلك المهني في ألمانيا. خطط وأسعار شفافة تمنحك وصولاً غير محدود لأدوات الذكاء الاصطناعي والاستيراد السحري وتجميع ملف الترشيح الكامل (DIN 5008)."
      : "Transparente Preise für Ihren DIN 5008 Lebenslauf, KI-Anschreiben und vollständige Bewerbungsmappe.",
  };
}

export default async function PublicPricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const dir = isAr ? "rtl" : "ltr";

  const cookieStore = await cookies();
  const token = cookieStore.get("user_session")?.value;
  const authResult = await verifyUserSession(token);

  const clientUser = authResult
    ? {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        plan: authResult.user.plan,
        planExpiresAt: authResult.user.planExpiresAt ? authResult.user.planExpiresAt.toISOString() : null,
        aiCredits: authResult.user.aiCredits,
      }
    : null;

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      <Navbar locale={locale} initialUser={clientUser} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full flex-1 space-y-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Link href={`/${locale}`} className="hover:text-blue-400 transition-colors">
            {isAr ? "الرئيسية" : isDe ? "Startseite" : "Home"}
          </Link>
          <span>/</span>
          <span className="text-slate-200">
            {isAr ? "الأسعار وباقة المحترفين (PRO Pass)" : isDe ? "Preise & Tarife" : "Pricing & PRO Pass"}
          </span>
        </div>

        {/* Page Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <span>💎</span>
            <span>{isAr ? "استثمار مضمون في مستقبلك" : isDe ? "Transparente Preise" : "Transparent Pricing"}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {isAr
              ? "خطط وباقات GermanJobsPro 🇩🇪"
              : isDe
              ? "Pläne & Preise von GermanJobsPro 🇩🇪"
              : "GermanJobsPro Plans & Pricing 🇩🇪"}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            {isAr
              ? "اختر الخطة المناسبة لك واجتز فلاتر التوظيف الألمانية باحترافية مع أدوات الذكاء الاصطناعي والاستيراد السحري (DIN 5008)."
              : isDe
              ? "Wählen Sie den passenden Plan und überzeugen Sie deutsche Arbeitgeber mit DIN 5008 konformen Bewerbungsunterlagen."
              : "Choose the plan that fits your career goals and pass German ATS filters with our certified DIN 5008 AI toolkit."}
          </p>
        </div>

        {/* Client Interactive Pricing Sections */}
        <PublicPricingClient user={clientUser} locale={locale} />
      </main>

      <Footer locale={locale} />
    </div>
  );
}
