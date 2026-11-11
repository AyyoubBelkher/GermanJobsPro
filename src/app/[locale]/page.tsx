import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import LandingFaqAccordion from "@/components/landing/LandingFaqAccordion";
import { getUserSession } from "@/lib/user-session";
import { getLandingContent } from "@/lib/i18n/landing-content";
import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getLandingContent(locale);

  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: {
      canonical: `https://www.germanjobspro.com/${locale}`,
      languages: {
        ar: "https://www.germanjobspro.com/ar",
        de: "https://www.germanjobspro.com/de",
        en: "https://www.germanjobspro.com/en",
        fr: "https://www.germanjobspro.com/fr",
        "x-default": "https://www.germanjobspro.com/de",
      },
    },
    openGraph: {
      title: t.meta.title,
      description: t.meta.description,
      url: `https://www.germanjobspro.com/${locale}`,
      siteName: "GermanJobsPro",
      locale: locale === "ar" ? "ar_AR" : locale === "de" ? "de_DE" : "en_US",
      type: "website",
      images: [
        {
          url: "/images/hero-berlin-monument.jpeg",
          width: 1200,
          height: 630,
          alt: "GermanJobsPro Berlin Monument",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.title,
      description: t.meta.description,
      images: ["/images/hero-berlin-monument.jpeg"],
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getLandingContent(locale);
  const activeLocale: Locale = isValidLocale(locale) ? (locale as Locale) : DEFAULT_LOCALE;
  const dict = getDictionary(activeLocale) as Record<string, any>;
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const heroCtaSecondary = (
    dict.home?.heroCtaSecondary ||
    (isAr ? "اكتشف الأدوات" : t.hero.secondaryCta)
  ).replace(/^[▶️▶🛡️\s]+/u, "");

  const heroSubBadge = (
    dict.home?.heroSubBadge ||
    (isAr ? "ابدأ مجانا – جرب الأدوات قبل الاشتراك" : (t.hero.trustMicro || "Start Free – Test Tools Before Subscribing"))
  ).replace(/^[▶️▶🛡️\s]+/u, "");

  const authResult = await getUserSession();
  const user = authResult ? authResult.user : null;

  return (
    <div dir={dir} className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden">
      <Navbar locale={locale} initialUser={user} />

      <main className="flex-1 w-full overflow-x-hidden">
        
        {/* ========================================================= */}
        {/* 1. HERO SECTION: FULL-BLEED BRANDENBURG GATE MONUMENT     */}
        {/* ========================================================= */}
        <section className="relative bg-[#061838] text-white overflow-hidden min-h-[440px] sm:min-h-[500px] lg:min-h-[560px] flex items-center pt-7 pb-20 sm:pt-10 sm:pb-28 px-4 sm:px-6 lg:px-8">
          {/* Ambient Glows */}
          <div className="absolute top-0 start-1/4 w-96 sm:w-[650px] h-96 sm:h-[650px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-10 end-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Full-Bleed Brandenburg Gate Monument Artwork */}
          <div className="absolute inset-0 pointer-events-none select-none z-0">
            <Image
              src="/images/hero-berlin-monument.jpeg"
              alt="Brandenburg Gate Berlin"
              fill
              unoptimized={true}
              priority={true}
              className="object-cover object-right-top w-full h-full"
            />
            {/* Mobile-only dark navy overlay so RTL Arabic text is 100% readable on phones */}
            <div className="absolute inset-0 bg-[#061838]/80 backdrop-blur-[1px] lg:hidden pointer-events-none" />
            {/* Desktop-only ultra-smooth left blend so there is zero vertical seam line */}
            <div
              className="hidden lg:block absolute inset-y-0 left-0 w-[60%] pointer-events-none z-[1]"
              style={{
                background:
                  "linear-gradient(to right, #061838 0%, #061838 34%, rgba(6, 24, 56, 0.92) 52%, rgba(6, 24, 56, 0.45) 75%, transparent 100%)",
              }}
            />
          </div>

          {/* Hero Content Container (Text sits on visual LEFT over #061838) */}
          <div className="max-w-7xl mx-auto w-full relative z-10" dir="ltr">
            <div className={`w-full lg:w-[52%] space-y-6 sm:space-y-8 ${isAr ? "text-right" : "text-left"} pb-4`} dir={locale === "ar" ? "rtl" : "ltr"}>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.25]">
                {isAr ? (
                  <>
                    <span>حضر مستقبلك المهني</span>
                    <br />
                    <span className="text-[#FACC15] font-black">في ألمانيا</span>{" "}
                    <span className="relative inline-block">
                      من مكان
                      <svg
                        className="absolute -bottom-2 inset-x-0 w-full h-3 sm:h-3.5 text-[#FACC15] pointer-events-none"
                        viewBox="0 0 160 14"
                        fill="none"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <path d="M2 10.5C40 3.5 120 3.5 158 10.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                      </svg>
                    </span>{" "}
                    <span>واحد!</span>
                  </>
                ) : (
                  <>
                    {t.hero.headline.prefix}
                    <span className="relative inline-block text-[#FACC15] font-black px-1">
                      {t.hero.headline.highlight}
                      <svg className="absolute -bottom-2.5 inset-x-0 w-full h-3.5 text-amber-400 pointer-events-none" viewBox="0 0 200 14" fill="none" preserveAspectRatio="none" aria-hidden="true">
                        <path d="M2 10.5C50 3.5 150 3.5 198 10.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                      </svg>
                    </span>
                    {t.hero.headline.suffix}
                  </>
                )}
              </h1>

              <p className="text-base sm:text-lg text-slate-200 max-w-xl leading-relaxed font-normal drop-shadow-[0_2px_8px_rgba(6,24,56,0.9)]">
                {isAr
                  ? "أنشئ سيرتك الذاتية الألمانية، حسن ملف ترشحك باستخدام الذكاء الاصطناعي، تعلم الألمانية باللغة العربية، واكتشف فرص العمل والتدريب المهني."
                  : t.hero.subheadline}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <Link
                  href={user ? `/${locale}/dashboard` : `/${locale}/auth/signup`}
                  className="bg-[#FACC15] hover:bg-amber-300 text-[#0A2552] font-black px-8 py-4 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 text-base transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
                >
                  <span>
                    {user
                      ? (isAr ? "لوحة التحكم ←" : "Go to Dashboard →")
                      : (isAr ? "ابدأ مجانا ←" : t.hero.primaryCta.replace(/🚀\s*/g, ""))}
                  </span>
                </Link>

                <a
                  href="#tools-hub"
                  className="border-2 border-white/60 hover:bg-white/10 text-white font-bold rounded-full px-7 py-4 text-base backdrop-blur-md transition-all inline-flex items-center justify-center gap-2.5 text-center active:scale-[0.98]"
                >
                  <span className="w-6 h-6 rounded-full bg-white text-[#0A2552] flex items-center justify-center text-xs font-black shrink-0">
                    ▶
                  </span>
                  <span>{heroCtaSecondary}</span>
                </a>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-amber-300/95 pt-1 drop-shadow-[0_2px_8px_rgba(6,24,56,0.9)]">
                <span className="text-base">🛡️</span>
                <span>{heroSubBadge}</span>
              </div>
            </div>
          </div>

          {/* German Flag Wave Ribbon */}
          <div className="absolute bottom-0 inset-x-0 w-full overflow-hidden leading-none pointer-events-none z-10" aria-hidden="true">
            <svg className="relative block w-full h-8 sm:h-12 text-slate-50" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,50 L1200,120 L0,120 Z" fill="#000000" opacity="0.95" />
              <path d="M0,20 C180,95 380,-20 520,50 C660,120 920,30 1200,65 L1200,120 L0,120 Z" fill="#DD0000" opacity="0.95" />
              <path d="M0,45 C200,105 400,-5 540,65 C680,125 940,45 1200,80 L1200,120 L0,120 Z" fill="#FFCC00" />
              <path d="M0,75 C220,115 420,15 560,78 C700,135 960,65 1200,95 L1200,120 L0,120 Z" fill="#f8fafc" />
            </svg>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. THE 6-CARD ACTION HUB (#tools-hub)                     */}
        {/* ========================================================= */}
        <section id="tools-hub" className="-mt-12 sm:-mt-16 relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4" dir="ltr">
            
            {/* Card 1 (Leftmost): German Jobs */}
            <Link
              href={`/${locale}/jobs`}
              className="bg-gradient-to-b from-white to-blue-50/25 rounded-2xl shadow-md hover:shadow-xl border border-blue-100/60 hover:-translate-y-1 transition-all p-3.5 sm:p-4 active:scale-[0.98] flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-12 h-12 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-11 h-11 text-[#0D47A1]" viewBox="0 0 48 48" fill="none">
                  <path d="M18 16V11C18 9.89543 18.8954 9 20 9H28C29.1046 9 30 9.89543 30 11V16" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
                  <rect x="7" y="15" width="34" height="23" rx="3.5" fill="#0D47A1" />
                  <line x1="7" y1="25" x2="41" y2="25" stroke="#1E3A8A" strokeWidth="1.5" />
                  <rect x="22" y="22" width="4" height="6" rx="1" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
                </svg>
              </div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base group-hover:text-blue-900 transition-colors">
                {t.toolsHub.card6.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1 mb-3" dir={dir}>{t.toolsHub.card6.subtitle}</p>
              <span className="bg-amber-400 hover:bg-amber-300 text-slate-950 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs mt-auto transition-colors">
                <svg
                  className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>

            {/* Card 2: German A1 Academy */}
            <Link
              href={`/${locale}/blog?category=German+A1`}
              className="bg-gradient-to-b from-white to-blue-50/25 rounded-2xl shadow-md hover:shadow-xl border border-blue-100/60 hover:-translate-y-1 transition-all p-3.5 sm:p-4 active:scale-[0.98] flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-12 h-12 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-11 h-11 text-[#0D47A1]" viewBox="0 0 48 48" fill="none">
                  <line x1="8" y1="38" x2="40" y2="38" stroke="#0D47A1" strokeWidth="2.5" strokeLinecap="round" />
                  <rect x="12" y="27" width="6" height="11" rx="1.5" fill="#0D47A1" />
                  <rect x="21" y="20" width="6" height="18" rx="1.5" fill="#0D47A1" />
                  <rect x="30" y="13" width="6" height="25" rx="1.5" fill="#0D47A1" />
                  <path d="M10 28L21 17L28 22L37 10" stroke="#FACC15" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M31 10H38V17" stroke="#FACC15" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base group-hover:text-blue-900 transition-colors">
                {t.toolsHub.card5.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1 mb-3" dir={dir}>{t.toolsHub.card5.subtitle}</p>
              <span className="bg-amber-400 hover:bg-amber-300 text-slate-950 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs mt-auto transition-colors">
                <svg
                  className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>

            {/* Card 3: AI Cover Letter */}
            <Link
              href={`/${locale}/dashboard/cover-letters/new`}
              className="bg-gradient-to-b from-white to-blue-50/25 rounded-2xl shadow-md hover:shadow-xl border border-blue-100/60 hover:-translate-y-1 transition-all p-3.5 sm:p-4 active:scale-[0.98] flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-12 h-12 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-11 h-11 text-[#0D47A1]" viewBox="0 0 48 48" fill="none">
                  <rect x="7" y="12" width="34" height="24" rx="3.5" fill="#0D47A1" />
                  <path d="M7 14L24 26L41 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 34L17 23M41 34L31 23" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                </svg>
              </div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base group-hover:text-blue-900 transition-colors">
                {t.toolsHub.card4.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1 mb-3" dir={dir}>{t.toolsHub.card4.subtitle}</p>
              <span className="bg-amber-400 hover:bg-amber-300 text-slate-950 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs mt-auto transition-colors">
                <svg
                  className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>

            {/* Card 4: Dossier Studio */}
            <Link
              href={`/${locale}/dashboard/dossier`}
              className="bg-gradient-to-b from-white to-blue-50/25 rounded-2xl shadow-md hover:shadow-xl border border-blue-100/60 hover:-translate-y-1 transition-all p-3.5 sm:p-4 active:scale-[0.98] flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-12 h-12 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-11 h-11 text-[#0D47A1]" viewBox="0 0 48 48" fill="none">
                  <path d="M8 12C8 10.3431 9.34315 9 11 9H20L24 14H37C38.6569 14 40 15.3431 40 17V36C40 37.6569 38.6569 39 37 39H11C9.34315 39 8 37.6569 8 36V12Z" fill="#0D47A1" />
                  <path d="M8 19C8 17.3431 9.34315 16 11 16H37C38.6569 16 40 17.3431 40 19V36C40 37.6569 38.6569 39 37 39H11C9.34315 39 8 37.6569 8 36V19Z" fill="#1565C0" />
                </svg>
              </div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base group-hover:text-blue-900 transition-colors">
                {t.toolsHub.card3.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1 mb-3" dir={dir}>{t.toolsHub.card3.subtitle}</p>
              <span className="bg-amber-400 hover:bg-amber-300 text-slate-950 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs mt-auto transition-colors">
                <svg
                  className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>

            {/* Card 5: ATS CV Analyzer */}
            <Link
              href={`/${locale}/dashboard/ats-analyzer`}
              className="bg-gradient-to-b from-white to-blue-50/25 rounded-2xl shadow-md hover:shadow-xl border border-blue-100/60 hover:-translate-y-1 transition-all p-3.5 sm:p-4 active:scale-[0.98] flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-12 h-12 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-11 h-11 text-[#0D47A1]" viewBox="0 0 48 48" fill="none">
                  <line x1="8" y1="38" x2="40" y2="38" stroke="#0D47A1" strokeWidth="2.5" strokeLinecap="round" />
                  <rect x="11" y="24" width="6" height="14" rx="1.5" fill="#0D47A1" />
                  <rect x="21" y="15" width="6" height="23" rx="1.5" fill="#0D47A1" />
                  <rect x="31" y="20" width="6" height="18" rx="1.5" fill="#0D47A1" />
                  <circle cx="23" cy="19" r="10" stroke="#0D47A1" strokeWidth="3" fill="none" />
                  <line x1="30.5" y1="26.5" x2="39" y2="35" stroke="#0D47A1" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base group-hover:text-blue-900 transition-colors">
                {t.toolsHub.card2.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1 mb-3" dir={dir}>{t.toolsHub.card2.subtitle}</p>
              <span className="bg-amber-400 hover:bg-amber-300 text-slate-950 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs mt-auto transition-colors">
                <svg
                  className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>

            {/* Card 6 (Rightmost): AI CV Builder */}
            <Link
              href={`/${locale}/dashboard/cv/new`}
              className="bg-gradient-to-b from-white to-blue-50/25 rounded-2xl shadow-md hover:shadow-xl border border-blue-100/60 hover:-translate-y-1 transition-all p-3.5 sm:p-4 active:scale-[0.98] flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-12 h-12 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-11 h-11 text-[#0D47A1]" viewBox="0 0 48 48" fill="none">
                  <path d="M12 6C10.8954 6 10 6.89543 10 8V40C10 41.1046 10.8954 42 12 42H36C37.1046 42 38 41.1046 38 40V16L28 6H12Z" stroke="#0D47A1" strokeWidth="2.5" fill="white" />
                  <path d="M28 6V16H38" stroke="#0D47A1" strokeWidth="2.5" fill="#EBF2FA" />
                  <text x="14" y="24" fill="#0D47A1" fontSize="10.5" fontWeight="900" fontFamily="sans-serif">CV</text>
                  <line x1="14" y1="29" x2="26" y2="29" stroke="#0D47A1" strokeWidth="2" strokeLinecap="round" />
                  <line x1="14" y1="34" x2="22" y2="34" stroke="#0D47A1" strokeWidth="2" strokeLinecap="round" />
                  <g transform="translate(25, 27)">
                    <circle cx="8" cy="8" r="7.5" fill="white" stroke="#0D47A1" strokeWidth="1.5" />
                    <clipPath id="de-flag-clip-card-cv"><circle cx="8" cy="8" r="6.75" /></clipPath>
                    <g clipPath="url(#de-flag-clip-card-cv)">
                      <rect x="0" y="0" width="16" height="5.33" fill="#000000" />
                      <rect x="0" y="5.33" width="16" height="5.34" fill="#DD0000" />
                      <rect x="0" y="10.67" width="16" height="5.33" fill="#FFCC00" />
                    </g>
                  </g>
                </svg>
              </div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base group-hover:text-blue-900 transition-colors">
                {t.toolsHub.card1.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1 mb-3" dir={dir}>{t.toolsHub.card1.subtitle}</p>
              <span className="bg-amber-400 hover:bg-amber-300 text-slate-950 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs mt-auto transition-colors">
                <svg
                  className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. "HOW IT WORKS" & BOTTOM BERLIN SKYLINE SILHOUETTE      */}
        {/* ========================================================= */}
        <section className="mt-16 sm:mt-24 pt-12 pb-0 bg-slate-50 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Centered section title with golden curved SVG underline under "اعثر على وظيفتك" */}
            <div className="inline-block relative">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#061838] dark:text-white tracking-tight">
                {isAr ? (
                  <>
                    <span>تعلّم الألمانية، </span>
                    <span className="relative inline-block">
                      اعثر على وظيفتك
                      <svg
                        className="absolute -bottom-2.5 inset-x-0 w-full h-3 sm:h-4 text-[#FACC15] pointer-events-none"
                        viewBox="0 0 160 14"
                        fill="none"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <path d="M2 10.5C40 3.5 120 3.5 158 10.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span>، وحقّق أهدافك</span>
                  </>
                ) : (
                  t.howItWorks?.title || "Learn German, Find a Job, Achieve Your Goals"
                )}
              </h2>
            </div>

            {/* Subtitle below heading */}
            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg mt-3 font-medium max-w-2xl mx-auto">
              {isAr
                ? "3 خطوات بسيطة تفصلك عن سوق العمل الألماني بمعايير احترافية"
                : (t.howItWorks?.mockupSubtitle || "3 simple steps separating you from the German job market with professional standards")}
            </p>

            {/* 3-Column Card Grid with Desktop Connecting Line */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 max-w-5xl mx-auto mt-14 pt-4 relative" dir={dir}>
              {/* Desktop connecting line behind the cards */}
              <div
                className="hidden md:block absolute top-1/2 left-12 right-12 h-0.5 bg-gradient-to-r from-amber-400/40 via-blue-200 to-amber-400/40 -translate-y-1/2 z-0"
                aria-hidden="true"
              />

              {/* Step 1 (Right card in RTL) */}
              <div className="bg-white rounded-2xl p-7 shadow-[0_12px_35px_rgba(8,32,70,0.07)] border border-slate-200/80 hover:border-amber-400 hover:-translate-y-1.5 transition-all duration-300 relative z-10 flex flex-col items-center text-center">
                {/* Top floating Gold Number Badge */}
                <div className="w-10 h-10 rounded-full bg-[#FACC15] text-[#061838] font-extrabold text-base flex items-center justify-center shadow-md -mt-12 mb-4 border-4 border-white dark:border-[#0A1936]">
                  1
                </div>
                {/* Icon Halo */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#EBF3FF] to-[#DBEAFE] dark:from-blue-950/60 dark:to-slate-800/60 flex items-center justify-center mb-5 shadow-inner">
                  <svg className="w-10 h-10 text-[#061838] dark:text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <h3 className="text-lg font-extrabold text-[#061838] dark:text-white mb-2">
                  {isAr ? "أنشئ حسابك مجانا" : (t.howItWorks?.step1?.title || "Create Account Free")}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isAr
                    ? "سجل في ثوان واستفد من لوحة تحكم ذكية لتتبع مسارك المهني واللغوي."
                    : (t.howItWorks?.step1?.desc || "Sign up in seconds and leverage an intelligent dashboard to track your career and language journey.")}
                </p>
              </div>

              {/* Step 2 (Center card) */}
              <div className="bg-white rounded-2xl p-7 shadow-[0_12px_35px_rgba(8,32,70,0.07)] border border-slate-200/80 hover:border-amber-400 hover:-translate-y-1.5 transition-all duration-300 relative z-10 flex flex-col items-center text-center">
                {/* Top floating Gold Number Badge */}
                <div className="w-10 h-10 rounded-full bg-[#FACC15] text-[#061838] font-extrabold text-base flex items-center justify-center shadow-md -mt-12 mb-4 border-4 border-white dark:border-[#0A1936]">
                  2
                </div>
                {/* Icon Halo */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#EBF3FF] to-[#DBEAFE] dark:from-blue-950/60 dark:to-slate-800/60 flex items-center justify-center mb-5 shadow-inner">
                  <svg className="w-10 h-10 text-[#061838] dark:text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="12" x="3" y="4" rx="2" />
                    <line x1="2" x2="22" y1="20" y2="20" />
                  </svg>
                </div>
                <h3 className="text-lg font-extrabold text-[#061838] dark:text-white mb-2">
                  {isAr ? "حضر سيرتك الذاتية وتعلم الألمانية" : (t.howItWorks?.step2?.title || "Build CV & Learn German")}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isAr
                    ? "صمم سيرة ذاتية مطابقة لمعيار DIN 5008 الألماني وتدرب على أساسيات اللغة A1."
                    : (t.howItWorks?.step2?.desc || "Create a CV matching the German DIN 5008 standard and practice A1 language fundamentals.")}
                </p>
              </div>

              {/* Step 3 (Left card in RTL) */}
              <div className="bg-white rounded-2xl p-7 shadow-[0_12px_35px_rgba(8,32,70,0.07)] border border-slate-200/80 hover:border-amber-400 hover:-translate-y-1.5 transition-all duration-300 relative z-10 flex flex-col items-center text-center">
                {/* Top floating Gold Number Badge */}
                <div className="w-10 h-10 rounded-full bg-[#FACC15] text-[#061838] font-extrabold text-base flex items-center justify-center shadow-md -mt-12 mb-4 border-4 border-white dark:border-[#0A1936]">
                  3
                </div>
                {/* Icon Halo */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#EBF3FF] to-[#DBEAFE] dark:from-blue-950/60 dark:to-slate-800/60 flex items-center justify-center mb-5 shadow-inner">
                  <svg className="w-10 h-10 text-[#061838] dark:text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                  </svg>
                </div>
                <h3 className="text-lg font-extrabold text-[#061838] dark:text-white mb-2">
                  {isAr ? "حسن ملف ترشحك واكتشف الفرص" : (t.howItWorks?.step3?.title || "Optimize Dossier & Get Jobs")}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isAr
                    ? "افحص توافق ملفك مع أنظمة ATS، ولد خطاب الدافع، وتقدم لأحدث الوظائف."
                    : (t.howItWorks?.step3?.desc || "Check your profile against ATS systems, generate cover letters, and apply to the latest jobs.")}
                </p>
              </div>
            </div>

            {/* High-Converting 2-Column "Before vs After DIN 5008" Comparison Section */}
            <div className="mt-20 max-w-5xl mx-auto text-start">
              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden">
                <div className="text-center space-y-3 max-w-2xl mx-auto">
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {t.comparison.title}
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm">
                    {t.comparison.subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Before / Non-compliant */}
                  <div className="rounded-2xl bg-rose-950/20 border border-rose-500/30 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs">
                        ❌ {t.comparison.negativeBadge}
                      </span>
                      <span className="text-rose-400 font-sans text-xs font-bold">{t.comparison.negativeRate}</span>
                    </div>
                    <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                      {t.comparison.negativePoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="text-rose-400 font-bold mt-0.5 shrink-0">✕</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* After / DIN 5008 Compliant */}
                  <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/30 p-6 space-y-4 shadow-lg shadow-emerald-500/5">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs">
                        ✅ {t.comparison.positiveBadge}
                      </span>
                      <span className="text-emerald-400 font-sans text-xs font-bold">{t.comparison.positiveRate}</span>
                    </div>
                    <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                      {t.comparison.positivePoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="text-emerald-400 font-bold mt-0.5 shrink-0">✓</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-20 max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-3 max-w-2xl mx-auto">
                <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#061838] dark:text-blue-400 text-xs font-bold ${isAr ? "" : "uppercase tracking-wider"}`}>
                  {t.faq.badge}
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-[#061838] dark:text-white">
                  {t.faq.title}
                </h2>
              </div>

              <LandingFaqAccordion items={t.faq.items} />

              {/* FAQPage JSON-LD for rich Google Search snippets */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    mainEntity: t.faq.items.map((item) => ({
                      "@type": "Question",
                      name: item.question,
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: item.answer,
                      },
                    })),
                  }),
                }}
              />
            </div>

            {/* Clean Breathing Room for the Golden Pill CTA Button */}
            <div className="mt-16 mb-12 flex justify-center relative z-20">
              <Link
                href={user ? `/${locale}/dashboard` : `/${locale}/auth/signup`}
                className="px-10 py-4 rounded-full bg-[#FACC15] hover:bg-[#FDE047] text-[#061838] font-extrabold text-lg shadow-[0_12px_30px_rgba(250,204,21,0.4)] hover:scale-[1.02] transition-all flex items-center gap-3.5 group cursor-pointer"
              >
                <span>{isAr ? "ابدأ رحلتك نحو ألمانيا الآن" : (t.howItWorks?.ctaButton || "Start Your Journey to Germany Now")}</span>
                <span className="w-8 h-8 rounded-full bg-[#061838] text-white flex items-center justify-center font-black text-sm shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                  {isAr ? "←" : "→"}
                </span>
              </Link>
            </div>
          </div>

          {/* Architectural Berlin Silhouette & Bottom German Flag Ribbon */}
          <div className="w-full pointer-events-none select-none relative z-10 leading-none overflow-hidden -mb-0.5">
            {/* Sleek, Multi-Layered Architectural Berlin Silhouette */}
            <svg
              className="w-full h-24 sm:h-36 md:h-44 block"
              viewBox="0 0 1440 200"
              preserveAspectRatio="xMidYMax slice"
              aria-hidden="true"
            >
              {/* Layer 1: Background Architectural Silhouette (#1E3A6D) */}
              <g fill="#1E3A6D" opacity="0.88">
                {/* Modern Towers Left */}
                <polygon points="60,200 60,85 110,50 145,50 145,200" />
                <polygon points="155,200 155,90 180,90 180,68 215,68 215,90 235,90 235,200" />

                {/* Fernsehturm TV Tower (Berlin Tower) */}
                <path d="M 319 8 L 321 8 L 321 52 L 319 52 Z" />
                <line x1="315" y1="26" x2="325" y2="26" stroke="#1E3A6D" strokeWidth="2" />
                <line x1="314" y1="38" x2="326" y2="38" stroke="#1E3A6D" strokeWidth="2" />
                <polygon points="318,52 322,52 326,62 314,62" />
                <circle cx="320" cy="76" r="16" />
                <ellipse cx="320" cy="76" rx="22" ry="2.5" />
                <polygon points="314,90 326,90 324,108 316,108" />
                <polygon points="316,108 324,108 328,200 312,200" />

                {/* Mid-skyline Buildings */}
                <polygon points="350,200 350,110 395,110 395,95 435,95 435,200" />
                <polygon points="650,200 650,115 690,115 690,100 735,100 735,200" />

                {/* Reichstag Building & Glass Dome */}
                <rect x="750" y="105" width="160" height="95" />
                <polygon points="800,105 860,105 830,88" />
                <path d="M 802 88 C 802 52, 858 52, 858 88 Z" />
                <rect x="826" y="44" width="8" height="10" />
                <line x1="830" y1="44" x2="830" y2="34" stroke="#1E3A6D" strokeWidth="2" />

                {/* Cathedral & Church Spires */}
                <path d="M 970 200 L 970 100 Q 1010 60 1050 100 L 1050 200 Z" />
                <line x1="1010" y1="62" x2="1010" y2="48" stroke="#1E3A6D" strokeWidth="2.5" />
                <polygon points="1065,200 1065,85 1095,55 1115,85 1115,200" />

                {/* Modern Alexanderplatz Towers Right */}
                <polygon points="1135,200 1135,70 1180,70 1180,90 1205,90 1205,200" />
                <polygon points="1230,200 1230,55 1275,38 1305,55 1305,200" />
                <polygon points="1330,200 1330,80 1380,80 1380,105 1440,105 1440,200" />
              </g>

              {/* Layer 2: Foreground Architectural Details & Brandenburg Gate (#0F2952) */}
              <g fill="#0F2952">
                {/* Left Rooftops & Facades */}
                <rect x="0" y="130" width="55" height="70" />
                <polygon points="50,200 50,140 80,115 110,140 110,200" />
                <rect x="105" y="125" width="48" height="75" />
                <polygon points="150,200 150,135 175,135 175,120 205,120 205,140 225,140 225,200" />
                <polygon points="230,200 230,130 265,130 265,115 295,115 295,200" />

                {/* Townhouses left of Brandenburg Gate */}
                <polygon points="330,200 330,135 365,135 365,120 405,120 405,200" />
                <polygon points="410,200 410,140 445,140 445,125 470,125 470,200" />

                {/* Brandenburg Gate (Brandenburger Tor) */}
                {/* Quadriga Chariot & Horses atop Gate */}
                <rect x="548" y="93" width="24" height="12" rx="2" />
                {/* Victory Goddess */}
                <path d="M 553 93 L 553 74" stroke="#0F2952" strokeWidth="3" strokeLinecap="round" />
                <path d="M 553 82 Q 543 72 546 86 Z" />
                <line x1="553" y1="74" x2="548" y2="65" stroke="#0F2952" strokeWidth="1.5" />
                {/* 4 Horses silhouette */}
                <path d="M 560 105 L 565 92 L 570 88 L 575 90 L 573 95 L 580 93 L 585 105 Z" />

                {/* Attic Frieze & Entablature */}
                <rect x="475" y="105" width="170" height="9" rx="1" />
                <rect x="480" y="114" width="160" height="15" rx="1" />
                {/* 6 Monumental Columns */}
                <rect x="485" y="129" width="12" height="71" />
                <rect x="512" y="129" width="12" height="71" />
                <rect x="539" y="129" width="12" height="71" />
                <rect x="566" y="129" width="12" height="71" />
                <rect x="593" y="129" width="12" height="71" />
                <rect x="620" y="129" width="12" height="71" />

                {/* Right of Brandenburg Gate: Colonnade & Museums */}
                <polygon points="645,200 645,135 680,135 680,122 715,122 715,138 745,138 745,200" />
                {/* Museum Colonnade */}
                <rect x="860" y="138" width="100" height="7" />
                <rect x="865" y="145" width="6" height="55" />
                <rect x="883" y="145" width="6" height="55" />
                <rect x="901" y="145" width="6" height="55" />
                <rect x="919" y="145" width="6" height="55" />
                <rect x="937" y="145" width="6" height="55" />
                <rect x="954" y="145" width="6" height="55" />

                {/* Modern Berlin Townhouses & Facades */}
                <polygon points="970,200 970,145 1000,125 1030,145 1030,200" />
                <rect x="1035" y="130" width="50" height="70" />
                <polygon points="1090,200 1090,120 1120,100 1150,120 1150,200" />
                <rect x="1158" y="120" width="55" height="80" />
                <polygon points="1220,200 1220,110 1250,90 1280,110 1280,200" />
                <rect x="1290" y="128" width="68" height="72" />
                <rect x="1365" y="140" width="75" height="60" />
              </g>
            </svg>

            {/* German Flag Wave Ribbon Anchored Directly to the Bottom of Section 3 */}
            <svg
              className="relative block w-full h-8 sm:h-12 md:h-14 -mt-1"
              viewBox="0 0 1200 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M0,0 C150,70 350,-30 500,30 C650,90 900,10 1200,40 L1200,100 L0,100 Z" fill="#000000" />
              <path d="M0,18 C180,75 380,-15 520,38 C660,92 920,25 1200,52 L1200,100 L0,100 Z" fill="#DD0000" />
              <path d="M0,38 C200,85 400,-2 540,50 C680,98 940,38 1200,66 L1200,100 L0,100 Z" fill="#FFCC00" />
            </svg>
          </div>
        </section>

      </main>

      <Footer locale={locale} className="mt-0 border-t-0" />
    </div>
  );
}
