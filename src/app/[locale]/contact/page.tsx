import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { getUserSession } from "@/lib/user-session";
import ContactClient from "@/components/support/ContactClient";

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
      ? "تواصل معنا والدعم الفني ✉️ | GermanJobsPro 🇩🇪"
      : isDe
      ? "Kontakt & Support ✉️ | GermanJobsPro 🇩🇪"
      : "Contact Us & Support ✉️ | GermanJobsPro 🇩🇪",
    description: isAr
      ? "يسعدنا دائماً استقبال استفساراتك، ومساعدتك في إعداد ملف الترشيح الألماني DIN 5008 وحل أي مشكلة تقنية."
      : "Kontaktieren Sie das GermanJobsPro-Supportteam bei Fragen zu Lebenslauf, Bewerbungsmappe und Tarifen.",
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const dir = isAr ? "rtl" : "ltr";

  // Fetch user session if logged in to prefill form
  const authResult = await getUserSession();
  const user = authResult ? authResult.user : null;

  const clientUser = user
    ? {
        name: user.name,
        email: user.email,
      }
    : null;

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      <Navbar locale={locale} initialUser={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full flex-1 space-y-10">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Link href={`/${locale}`} className="hover:text-blue-400 transition-colors">
            {isAr ? "الرئيسية" : isDe ? "Startseite" : "Home"}
          </Link>
          <span>/</span>
          <span className="text-slate-200">
            {isAr ? "تواصل معنا والدعم الفني" : isDe ? "Kontakt" : "Contact & Support"}
          </span>
        </div>

        {/* Page Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <span>🇩🇪</span>
            <span>{isAr ? "مركز المساعدة والتواصل" : isDe ? "Support-Zentrale" : "Support Center"}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {isAr
              ? "تواصل معنا • يسعدنا استقبال استفساراتك واقتراحاتك"
              : isDe
              ? "Kontaktieren Sie uns • Wir helfen Ihnen gerne"
              : "Contact Us • We're Here to Help Your German Career"}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            {isAr
              ? "فريق GermanJobsPro متواجد للإجابة عن أسئلتك حول الاشتراكات، إنشاء ملفات الترشيح (DIN 5008)، واستقبال اقتراحاتك لتطوير المنصة."
              : isDe
              ? "Wir unterstützen Sie bei Fragen rund um Ihren DIN 5008 Lebenslauf, Tarife und den Bewerbungsprozess in Deutschland."
              : "Our team is here to assist with your DIN 5008 dossier, subscriptions, and feedback on GermanJobsPro."}
          </p>
        </div>

        {/* Client Interactive Contact Center */}
        <ContactClient initialUser={clientUser} locale={locale} />
      </main>

      <Footer locale={locale} />
    </div>
  );
}
