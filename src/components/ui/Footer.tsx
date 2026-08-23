import React from "react";
import Link from "next/link";

interface FooterProps {
  locale?: string;
}

export default function Footer({ locale = "ar" }: FooterProps) {
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const dir = isAr ? "rtl" : "ltr";

  const homeLink = `/${locale}`;
  const jobsLink = `/${locale}/jobs`;
  const blogLink = `/${locale}/blog`;
  const pricingLink = `/${locale}/pricing`;
  const contactLink = `/${locale}/contact`;
  const cvLink = `/${locale}/dashboard/cv`;

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 mt-20 transition-colors" dir={dir}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center p-1.5 rounded-xl bg-blue-500/20 border border-blue-500/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://flagcdn.com/w40/de.png"
                  alt="Germany Flag"
                  className="w-6 h-4 rounded-xs object-cover shadow-xs"
                />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-100">
                GermanJobs<span className="text-blue-500">Pro</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              {isAr
                ? "المنصة الأولى المتخصصة في تأهيل وتنسيق السير الذاتية بمعايير DIN 5008 الألمانية، وتوليد خطابات الدافع بالذكاء الاصطناعي، وتوفير أحدث فرص العمل في ألمانيا."
                : isDe
                ? "Ihre führende Plattform für DIN 5008 Lebensläufe, KI-Anschreiben und aktuelle Stellenangebote in Deutschland."
                : "The #1 platform for German DIN 5008 resume generation, AI cover letters, and verified jobs across Germany."}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              {isAr ? "روابط سريعة" : isDe ? "Schnellzugriff" : "Quick Links"}
            </h4>
            <ul className="space-y-2 text-sm font-medium text-slate-400">
              <li>
                <Link href={homeLink} className="hover:text-blue-400 transition-colors">
                  {isAr ? "الرئيسية" : isDe ? "Startseite" : "Home"}
                </Link>
              </li>
              <li>
                <Link href={jobsLink} className="hover:text-blue-400 transition-colors">
                  {isAr ? "فرص العمل في ألمانيا" : isDe ? "Jobs in Deutschland" : "Jobs in Germany"}
                </Link>
              </li>
              <li>
                <Link href={blogLink} className="hover:text-blue-400 transition-colors">
                  {isAr ? "دليل ومقالات التوظيف" : isDe ? "Karriere-Ratgeber" : "Career Blog & Visa"}
                </Link>
              </li>
              <li>
                <Link href={cvLink} className="hover:text-blue-400 transition-colors">
                  {isAr ? "منشئ السيرة الذاتية (DIN 5008)" : isDe ? "DIN 5008 Generator" : "DIN 5008 Builder"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Pricing Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              {isAr ? "الدعم والاشتراكات" : isDe ? "Support & Tarife" : "Support & Pricing"}
            </h4>
            <ul className="space-y-2 text-sm font-medium text-slate-400">
              <li>
                <Link href={pricingLink} className="hover:text-amber-400 transition-colors flex items-center gap-1.5 text-amber-400 font-semibold">
                  <span>💎</span>
                  <span>{isAr ? "الأسعار وباقة PRO" : isDe ? "Preise & PRO Pass" : "Pricing & PRO Pass"}</span>
                </Link>
              </li>
              <li>
                <Link href={contactLink} className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span>✉️</span>
                  <span>{isAr ? "تواصل معنا والدعم الفني" : isDe ? "Kontakt & Support" : "Contact & Support"}</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} GermanJobsPro. {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}</p>
          <p>{isAr ? "دليلك الشامل للعمل والعيش في ألمانيا 🇩🇪" : "Your All-in-One Gateway to Germany 🇩🇪"}</p>
        </div>
      </div>
    </footer>
  );
}
