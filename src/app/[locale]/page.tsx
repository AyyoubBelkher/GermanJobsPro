import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-session";
import LandingFaqAccordion from "@/components/landing/LandingFaqAccordion";
import { getLandingContent } from "@/lib/i18n/landing-content";
import { extractLessonNumber, extractCleanExcerpt, parseLessonTitle } from "@/lib/courseUtils";

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
    keywords: [
      "Lebenslauf DIN 5008",
      "سيرة ذاتية ألمانية",
      "فحص ATS ألمانيا",
      "وظائف في ألمانيا",
      "عقود أوسبيلدونغ",
      "Anschreiben الذكاء الاصطناعي",
      "Bewerbungsmappe",
      "Chancenkarte CV",
      "German CV Maker",
      "Tabellarischer Lebenslauf",
      "German ATS Resume Checker",
      "German Cover Letter Generator",
      "Ausbildung Deutschland",
      "Jobs in Germany",
      "Apprendre Allemand A1",
      "CV Allemand DIN 5008",
    ],
    openGraph: {
      title: t.meta.title,
      description: t.meta.description,
      url: `https://www.germanjobspro.com/${locale}`,
      siteName: "GermanJobsPro",
      locale: locale === "ar" ? "ar_AR" : locale === "de" ? "de_DE" : locale === "fr" ? "fr_FR" : "en_US",
      type: "website",
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
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  // Check user authentication on server
  const authResult = await getUserSession();
  const user = authResult ? authResult.user : null;

  // Fetch top 3 latest jobs, top 3 blog posts, and top 3 sequenced German A1 lessons in parallel
  let latestJobs: Array<{
    id: string;
    title: string;
    company: string;
    city: string | null;
    category: string;
    jobType: string | null;
    languageReq: string | null;
    salary: string | null;
    applyUrl: string;
    publishedAt: Date;
  }> = [];

  let latestPosts: Array<{
    id: string;
    slug: string;
    title: string;
    markdown_content: string;
    category: string;
    createdAt: Date;
  }> = [];

  let germanA1Posts: Array<{
    id: string;
    slug: string;
    title: string;
    markdown_content: string;
    category: string;
    createdAt: Date;
  }> = [];

  try {
    const [jobs, posts, a1Posts] = await Promise.all([
      prisma.job.findMany({
        where: { status: "ACTIVE" },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          company: true,
          city: true,
          category: true,
          jobType: true,
          languageReq: true,
          salary: true,
          applyUrl: true,
          publishedAt: true,
        },
        take: 3,
      }),
      prisma.post.findMany({
        where: {
          published: true,
          NOT: {
            OR: [
              { category: { equals: "German A1", mode: "insensitive" } },
              { category: { equals: "Deutsch A1", mode: "insensitive" } },
              { category: { contains: "A1", mode: "insensitive" } },
            ],
          },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          markdown_content: true,
          category: true,
          createdAt: true,
        },
        take: 3,
      }),
      prisma.post.findMany({
        where: {
          published: true,
          OR: [
            { category: { equals: "German A1", mode: "insensitive" } },
            { category: { equals: "Deutsch A1", mode: "insensitive" } },
            { category: { contains: "A1", mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          slug: true,
          title: true,
          markdown_content: true,
          category: true,
          createdAt: true,
        },
      }),
    ]);
    latestJobs = jobs;
    latestPosts = posts;

    // Sort German A1 lessons logically from the beginning (Lessons 1, 2, 3...)
    a1Posts.sort((a, b) => {
      const numA = extractLessonNumber(a.title, a.slug, a.markdown_content);
      const numB = extractLessonNumber(b.title, b.slug, b.markdown_content);
      if (numA !== numB) {
        return numA - numB;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    germanA1Posts = a1Posts.slice(0, 3);
  } catch (error) {
    console.warn("[LandingPage] Database query failed during prerendering:", error instanceof Error ? error.message : error);
  }

  const knowledgeGraphLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.germanjobspro.com/#organization",
        "name": "GermanJobsPro",
        "url": "https://www.germanjobspro.com",
        "logo": "https://www.germanjobspro.com/icon.svg",
        "sameAs": [
          "https://twitter.com/GermanJobsPro",
          "https://www.linkedin.com/company/germanjobspro"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "email": "support@germanjobspro.com",
          "availableLanguage": ["Arabic", "German", "English", "French"]
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://www.germanjobspro.com/#website",
        "url": "https://www.germanjobspro.com",
        "name": "GermanJobsPro",
        "description": t.meta.description,
        "publisher": { "@id": "https://www.germanjobspro.com/#organization" },
        "inLanguage": ["ar", "de", "en", "fr"],
        "potentialAction": {
          "@type": "SearchAction",
          "target": `https://www.germanjobspro.com/${locale}/jobs?search={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://www.germanjobspro.com/#software",
        "name": "GermanJobsPro DIN 5008 CV Builder & German ATS Suite",
        "url": `https://www.germanjobspro.com/${locale}`,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "featureList": [
          "DIN 5008 Tabellarischer Lebenslauf Builder",
          "1-Click PDF to DIN 5008 Converter",
          "German ATS Resume Checker",
          "AI Anschreiben Cover Letter Generator",
          "3-in-1 Bewerbungsmappe Dossier Studio",
          "Verified German Job Board",
          "Free German A1 Course with Audio"
        ],
        "offers": [
          {
            "@type": "Offer",
            "name": "Starter",
            "price": "0",
            "priceCurrency": "USD",
            "description": "Free Starter Plan for German CV and A1 Course"
          },
          {
            "@type": "Offer",
            "name": "Quick Sprint",
            "price": "9.99",
            "priceCurrency": "USD",
            "description": "30-day active application pass with German ATS audit and AI credits"
          },
          {
            "@type": "Offer",
            "name": "PRO Job Pass",
            "price": "19.99",
            "priceCurrency": "USD",
            "description": "90-day comprehensive German job hunting suite: 1-Click PDF to DIN 5008, Dossier Studio, ATS audit"
          }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `https://www.germanjobspro.com/${locale}/#faq`,
        "mainEntity": t.faq.items.map((item) => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer
          }
        }))
      },
      {
        "@type": "Course",
        "@id": `https://www.germanjobspro.com/${locale}/#course-a1`,
        "name": isAr ? "مسار تعلم اللغة الألمانية للمبتدئين A1" : "Free German A1 Career Academy",
        "description": isAr
          ? "مسار تفاعلي مجاني لتعلم اللغة الألمانية من الصفر للمستوى A1 مع النطق الصوتي الأصلي والكتابة الصوتية بالعربية."
          : "Free interactive German A1 course with native audio pronunciation for job seekers in Germany.",
        "provider": { "@id": "https://www.germanjobspro.com/#organization" },
        "url": `https://www.germanjobspro.com/${locale}/blog?category=German+A1`,
        "isAccessibleForFree": true,
        "inLanguage": ["de", "ar", "en"]
      }
    ]
  };

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(knowledgeGraphLd) }}
      />
      <Navbar locale={locale} initialUser={user} />

      <main className="flex-1 w-full space-y-24 sm:space-y-32 pb-24 overflow-hidden">
        
        {/* ========================================================= */}
        {/* 1. HERO SECTION */}
        {/* ========================================================= */}
        <section className="relative pt-12 sm:pt-20 lg:pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Subtle Glow Accents */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[650px] h-96 sm:h-[650px] bg-gradient-to-tr from-blue-600/20 via-blue-500/10 to-slate-800/10 rounded-full blur-3xl pointer-events-none -z-10" />
          
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* Prominent Hero Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-800 text-xs sm:text-sm font-semibold text-slate-300 shadow-xl backdrop-blur-md hover:border-blue-500/40 transition-colors">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>{t.hero.badge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.2]">
              {t.hero.headline.prefix}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-blue-200">
                {t.hero.headline.highlight}
              </span>
              {t.hero.headline.suffix}
            </h1>

            {/* Subheadline highlighting core modules */}
            <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
              {t.hero.subheadline}
            </p>

            {/* Dual CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href={`/${locale}/dashboard/cv/new`}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2.5 border border-blue-400/30"
              >
                <span>🚀</span>
                <span>{t.hero.primaryCta}</span>
              </Link>

              <Link
                href={`/${locale}/blog?category=German+A1`}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-base border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <span>📚</span>
                <span>{t.hero.secondaryCta}</span>
              </Link>
            </div>

            {/* Trust Bar with 3 Compact Badges */}
            <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto border-t border-slate-900/90">
              {t.hero.trustBadges.map((badgeText, idx) => (
                <div key={idx} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs sm:text-sm font-semibold text-slate-300">
                  <span className="text-emerald-400 text-base">✓</span>
                  <span>{badgeText}</span>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ========================================================= */}
        {/* 2. THE 4 PRODUCT PILLARS (RESPONSIVE GRID 1/2/4) */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <span>⚡</span>
              <span>{t.pillars.badge}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
              {t.pillars.title}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              {t.pillars.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1: DIN 5008 CV Builder */}
            <Link
              href={`/${locale}/dashboard/cv/new`}
              className="relative group rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 p-7 transition-all shadow-xl hover:shadow-blue-500/10 flex flex-col justify-between space-y-6 cursor-pointer"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📄
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    {t.pillars.pillar1.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {t.pillars.pillar1.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-mono text-emerald-400 font-bold">{t.pillars.pillar1.tag}</span>
                <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                  {t.pillars.pillar1.cta}
                </span>
              </div>
            </Link>

            {/* Pillar 2: Bewerbungsmappe Studio */}
            <Link
              href={`/${locale}/dashboard/dossier`}
              className="relative group rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 p-7 transition-all shadow-xl hover:shadow-blue-500/10 flex flex-col justify-between space-y-6 cursor-pointer"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📑
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    {t.pillars.pillar2.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {t.pillars.pillar2.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-mono text-blue-400 font-bold">{t.pillars.pillar2.tag}</span>
                <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                  {t.pillars.pillar2.cta}
                </span>
              </div>
            </Link>

            {/* Pillar 3: AI Cover Letter & Smart ATS Checker */}
            <Link
              href={`/${locale}/dashboard/cover-letters/new`}
              className="relative group rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 p-7 transition-all shadow-xl hover:shadow-blue-500/10 flex flex-col justify-between space-y-6 cursor-pointer"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🎯
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    {t.pillars.pillar3.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {t.pillars.pillar3.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-mono text-emerald-400 font-bold">{t.pillars.pillar3.tag}</span>
                <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                  {t.pillars.pillar3.cta}
                </span>
              </div>
            </Link>

            {/* Pillar 4: German A1 Career Academy */}
            <Link
              href={`/${locale}/blog?category=German+A1`}
              className="relative group rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 p-7 transition-all shadow-xl hover:shadow-blue-500/10 flex flex-col justify-between space-y-6 cursor-pointer"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🇩🇪
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    {t.pillars.pillar4.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {t.pillars.pillar4.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-mono text-blue-400 font-bold">{t.pillars.pillar4.tag}</span>
                <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                  {t.pillars.pillar4.cta}
                </span>
              </div>
            </Link>
          </div>
        </section>


        {/* ========================================================= */}
        {/* 3. VISUAL COMPARISON CARD (BEFORE VS AFTER) */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-12 space-y-10 shadow-2xl">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-4xl font-black text-white">
                {t.comparison.title}
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                {t.comparison.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Before / Rejected */}
              <div className="rounded-2xl bg-rose-950/20 border border-rose-500/30 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs">
                    ❌ {t.comparison.negativeBadge}
                  </span>
                  <span className="text-rose-400 font-mono text-xs font-bold">{t.comparison.negativeRate}</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                  {t.comparison.negativePoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-rose-400 font-bold mt-0.5">✕</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* After / Accepted */}
              <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/30 p-6 space-y-5 shadow-lg shadow-emerald-500/5">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs">
                    ✅ {t.comparison.positiveBadge}
                  </span>
                  <span className="text-emerald-400 font-mono text-xs font-bold">{t.comparison.positiveRate}</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                  {t.comparison.positivePoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        {/* ========================================================= */}
        {/* 4. FRICTIONLESS FREE VALUE & FEATURE SHOWCASE */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <span>✨</span>
              <span>{t.freeValue.badge}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
              {t.freeValue.title}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
              {t.freeValue.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch pt-2">
            {/* Value Card 1: Free Starter Access (DIN 5008 CV) */}
            <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-7 space-y-6 flex flex-col justify-between transition-all group shadow-xl">
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      📄
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                      {t.freeValue.card1.badge}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors pt-2">
                    {t.freeValue.card1.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {t.freeValue.card1.desc}
                  </p>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-300 pt-5 border-t border-slate-800">
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-400 font-bold text-sm">✓</span>
                    <span>{t.freeValue.card1.f1}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-400 font-bold text-sm">✓</span>
                    <span>{t.freeValue.card1.f2}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-400 font-bold text-sm">✓</span>
                    <span>{t.freeValue.card1.f3}</span>
                  </li>
                </ul>
              </div>

              <Link
                href={`/${locale}/dashboard/cv/new`}
                className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm text-center border border-slate-700/80 hover:border-blue-500/50 transition-all block shadow-md hover:shadow-blue-500/10"
              >
                {t.freeValue.card1.cta}
              </Link>
            </div>

            {/* Value Card 2: Free German A1 Academy (Featured Value) */}
            <div className="relative bg-gradient-to-b from-slate-900 via-blue-950/30 to-slate-950 border-2 border-blue-500/60 hover:border-blue-500 rounded-3xl p-7 space-y-6 flex flex-col justify-between transition-all group shadow-2xl shadow-blue-500/10">
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-400/30 text-blue-300 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      🎧
                    </span>
                    <span className="px-3.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-black shadow-lg shadow-blue-600/30 border border-blue-400/40">
                      {t.freeValue.card2.badge}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white group-hover:text-blue-300 transition-colors pt-2">
                    {t.freeValue.card2.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {t.freeValue.card2.desc}
                  </p>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-200 pt-5 border-t border-slate-800">
                  <li className="flex items-start gap-2.5">
                    <span className="text-blue-400 font-bold text-sm">✓</span>
                    <span className="font-semibold text-white">{t.freeValue.card2.f1}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-blue-400 font-bold text-sm">✓</span>
                    <span className="font-semibold text-white">{t.freeValue.card2.f2}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-blue-400 font-bold text-sm">✓</span>
                    <span>{t.freeValue.card2.f3}</span>
                  </li>
                </ul>
              </div>

              <Link
                href={`/${locale}/blog?category=German+A1`}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm text-center border border-blue-400/30 transition-all block shadow-xl shadow-blue-600/25 hover:scale-[1.01]"
              >
                {t.freeValue.card2.cta}
              </Link>
            </div>

            {/* Value Card 3: Free AI Welcome Trial */}
            <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-7 space-y-6 flex flex-col justify-between transition-all group shadow-xl">
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      🎯
                    </span>
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-bold">
                      {t.freeValue.card3.badge}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors pt-2">
                    {t.freeValue.card3.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {t.freeValue.card3.desc}
                  </p>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-300 pt-5 border-t border-slate-800">
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-400 font-bold text-sm">✓</span>
                    <span>{t.freeValue.card3.f1}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-400 font-bold text-sm">✓</span>
                    <span>{t.freeValue.card3.f2}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-400 font-bold text-sm">✓</span>
                    <span>{t.freeValue.card3.f3}</span>
                  </li>
                </ul>
              </div>

              <Link
                href={`/${locale}/dashboard/ats-analyzer`}
                className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm text-center border border-slate-700/80 hover:border-amber-500/50 transition-all block shadow-md hover:shadow-amber-500/10"
              >
                {t.freeValue.card3.cta}
              </Link>
            </div>
          </div>

          {/* Subtle Trust-Building Pricing Link at Bottom */}
          <div className="text-center pt-2">
            <Link
              href={`/${locale}/pricing`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-400 hover:text-blue-400 transition-colors"
            >
              <span>{t.freeValue.pricingLinkText}</span>
            </Link>
          </div>
        </section>


        {/* ========================================================= */}
        {/* 5. 3-STEP "HOW IT WORKS" WALKTHROUGH */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              {t.howItWorks.badge}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              {t.howItWorks.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-black text-lg flex items-center justify-center">
                {t.howItWorks.step1.number}
              </div>
              <h3 className="text-xl font-bold text-white">
                {t.howItWorks.step1.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t.howItWorks.step1.desc}
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-black text-lg flex items-center justify-center">
                {t.howItWorks.step2.number}
              </div>
              <h3 className="text-xl font-bold text-white">
                {t.howItWorks.step2.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t.howItWorks.step2.desc}
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-black text-lg flex items-center justify-center">
                {t.howItWorks.step3.number}
              </div>
              <h3 className="text-xl font-bold text-white">
                {t.howItWorks.step3.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t.howItWorks.step3.desc}
              </p>
            </div>
          </div>
        </section>


        {/* ========================================================= */}
        {/* 6. GERMAN A1 LEARNING SHOWCASE SECTION */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Main Showcase Hero Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/70 to-slate-900 border border-blue-500/30 p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
            <div className="absolute top-0 end-0 -me-16 -mt-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-black uppercase tracking-wider">
                  <span>🇩🇪</span>
                  <span>{t.a1Track.badge}</span>
                </div>
                
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  {t.a1Track.title}
                </h2>
                
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {t.a1Track.subtitle}
                </p>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <Link
                  href={`/${locale}/blog?category=German+A1`}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm sm:text-base shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 border border-blue-400/30"
                >
                  <span>🚀</span>
                  <span>{t.a1Track.primaryBtn}</span>
                </Link>
                <Link
                  href={`/${locale}/blog?category=German+A1`}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <span>📚</span>
                  <span>{t.a1Track.secondaryBtn}</span>
                </Link>
              </div>
            </div>

            {/* 3 Key Value Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 mt-10 border-t border-slate-800/80">
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-lg">
                  📖
                </div>
                <h3 className="text-base font-bold text-white">
                  {t.a1Track.card1.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.a1Track.card1.desc}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-lg">
                  💼
                </div>
                <h3 className="text-base font-bold text-white">
                  {t.a1Track.card2.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.a1Track.card2.desc}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-lg">
                  ⚡
                </div>
                <h3 className="text-base font-bold text-white">
                  {t.a1Track.card3.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.a1Track.card3.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Featured German A1 Posts Grid */}
          {germanA1Posts.length > 0 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    {t.a1Lessons.badge}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                    {t.a1Lessons.title}
                  </h3>
                </div>
                <Link
                  href={`/${locale}/blog?category=German+A1`}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <span>{t.a1Lessons.viewAll}</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {germanA1Posts.map((post, idx) => {
                  const parsedNum = extractLessonNumber(post.title, post.slug, post.markdown_content);
                  const displayNum = parsedNum !== 9999 ? parsedNum : idx + 1;
                  const fullTitle = parseLessonTitle(post.title, post.markdown_content).fullTitle;
                  return (
                    <Link
                      key={post.id}
                      href={`/${locale}/blog/${post.slug}`}
                      className="rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 p-6 flex flex-col justify-between space-y-4 transition-all shadow-xl hover:shadow-blue-500/5 group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs font-bold inline-flex items-center gap-1">
                            <span>🇩🇪</span>
                            <span>{post.category}</span>
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {t.a1Lessons.lessonPrefix} #{displayNum}
                          </span>
                        </div>

                        <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                          {fullTitle}
                        </h4>

                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {extractCleanExcerpt(post.markdown_content, fullTitle, 150)}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-400">
                          <span>⏱️</span>
                          <span>{t.a1Lessons.readTime}</span>
                        </span>
                        <span className="text-blue-400 font-bold group-hover:underline flex items-center gap-1">
                          <span>{t.a1Lessons.startLesson}</span>
                          <span className={isAr ? "rotate-180" : ""}>→</span>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>


        {/* ========================================================= */}
        {/* 7. LATEST JOBS & CAREER GUIDES */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Latest Jobs */}
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase">
                  <span>💼</span>
                  <span>{t.jobs.badge}</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white">
                  {t.jobs.title}
                </h2>
              </div>
              <Link
                href={`/${locale}/jobs`}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>{t.jobs.viewAll}</span>
                <span className={isAr ? "rotate-180" : ""}>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-6 flex flex-col justify-between space-y-6 transition-all shadow-xl group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold">
                        {job.category}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {job.jobType || "Full-time"}
                      </span>
                    </div>
                    <div>
                      <Link href={`/${locale}/jobs/${job.id}`}>
                        <h3 dir="auto" className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate text-start">
                          {job.title}
                        </h3>
                      </Link>
                      <p dir="auto" className="text-xs text-slate-400 font-medium text-start">
                        {job.company} • {job.city || "Deutschland"}
                      </p>
                    </div>
                    {job.salary && (
                      <p className="text-xs text-emerald-400 font-semibold font-mono">
                        💶 {job.salary}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {t.jobs.languageLabel} {job.languageReq || "B1/B2"}
                    </span>
                    <Link
                      href={`/${locale}/jobs/${job.id}`}
                      className="px-4 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 text-xs font-bold transition-all"
                    >
                      {t.jobs.apply}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Latest Articles */}
          {latestPosts.length > 0 && (
            <div className="space-y-8 pt-6 border-t border-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase">
                    <span>📚</span>
                    <span>{t.articles.badge}</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black text-white">
                    {t.articles.title}
                  </h2>
                </div>
                <Link
                  href={`/${locale}/blog`}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <span>{t.articles.viewAll}</span>
                  <span className={isAr ? "rotate-180" : ""}>→</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {latestPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/${locale}/blog/${post.slug}`}
                    className="rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-6 flex flex-col justify-between space-y-4 transition-all shadow-xl group"
                  >
                    <div className="space-y-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold inline-block">
                        {post.category}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {extractCleanExcerpt(post.markdown_content, post.title, 150)}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
                      <span>{new Date(post.createdAt).toLocaleDateString(locale)}</span>
                      <span className="text-blue-400 font-bold group-hover:underline flex items-center gap-1">
                        <span>{t.articles.readMore}</span>
                        <span className={isAr ? "rotate-180" : ""}>→</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>


        {/* ========================================================= */}
        {/* 8. LEGAL CLARITY & TRANSPARENCY DISCLAIMER BOX */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 sm:p-8 space-y-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5 text-blue-400 font-bold text-sm sm:text-base">
              <span>⚖️</span>
              <span>{t.legal.title}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {t.legal.text}
            </p>
          </div>
        </section>


        {/* ========================================================= */}
        {/* 9. FAQ ACCORDION SECTION */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              {t.faq.badge}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              {t.faq.title}
            </h2>
          </div>

          <LandingFaqAccordion items={t.faq.items} />
        </section>


        {/* ========================================================= */}
        {/* 10. FINAL HIGH-CONVERSION CTA BANNER */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-500/40 p-8 sm:p-16 text-center space-y-8 shadow-2xl shadow-blue-950/50">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-emerald-600/10 pointer-events-none" />
            
            <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {t.finalCta.title}
              </h2>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                {t.finalCta.subtitle}
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/${locale}/dashboard/cv/new`}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-base shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border border-blue-400/30"
              >
                <span>🚀</span>
                <span>{t.finalCta.primaryBtn}</span>
              </Link>

              <Link
                href={`/${locale}/jobs`}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-base border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <span>💼</span>
                <span>{t.finalCta.secondaryBtn}</span>
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer locale={locale} />
    </div>
  );
}
