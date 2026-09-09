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
  const termsLink = `/${locale}/terms`;
  const privacyLink = `/${locale}/privacy`;
  const refundLink = `/${locale}/refund`;

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 mt-20 transition-colors" dir={dir}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
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
            <p className="text-sm text-slate-400 leading-relaxed">
              {isAr
                ? "المنصة الرائدة لتأهيل وتنسيق السير الذاتية بمعايير DIN 5008 الألمانية وتوليد ملفات الترشيح بالذكاء الاصطناعي."
                : isDe
                ? "Ihre führende Plattform für DIN 5008 Lebensläufe, KI-Anschreiben und vollständige Bewerbungsmappen in Deutschland."
                : "The leading platform for German DIN 5008 resume generation, AI cover letters, and application dossiers."}
            </p>
            <div className="pt-1">
              <a
                href="mailto:support@germanjobspro.com"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white transition-colors"
              >
                <span className="text-blue-400">✉</span>
                <span>support@germanjobspro.com</span>
              </a>
            </div>
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
              {isAr ? "الاشتراكات والدعم" : isDe ? "Tarife & Support" : "Pricing & Support"}
            </h4>
            <ul className="space-y-2 text-sm font-medium text-slate-400">
              <li>
                <Link href={pricingLink} className="hover:text-amber-400 transition-colors flex items-center gap-1.5 text-amber-400 font-semibold">
                  <span>💎</span>
                  <span>{isAr ? "الأسعار وباقة PRO Pass ($9.99)" : isDe ? "Preise & PRO Pass ($9.99)" : "Pricing & PRO Pass ($9.99)"}</span>
                </Link>
              </li>
              <li>
                <Link href={contactLink} className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span>✉️</span>
                  <span>{isAr ? "تواصل معنا ومركز المساعدة" : isDe ? "Kontakt & Hilfe" : "Contact & Support"}</span>
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@germanjobspro.com"
                  className="hover:text-blue-400 transition-colors flex items-center gap-1.5 text-xs font-mono text-slate-400"
                >
                  <span>🎧</span>
                  <span>support@germanjobspro.com</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              {isAr ? "الامتثال والشفافية" : isDe ? "Rechtliches & DSGVO" : "Legal & Compliance"}
            </h4>
            <ul className="space-y-2 text-sm font-medium text-slate-400">
              <li>
                <Link href={termsLink} className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span>⚖️</span>
                  <span>{isAr ? "شروط الاستخدام والخدمة" : isDe ? "Nutzungsbedingungen (AGB)" : "Terms of Service"}</span>
                </Link>
              </li>
              <li>
                <Link href={privacyLink} className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span>🛡️</span>
                  <span>{isAr ? "سياسة الخصوصية (GDPR)" : isDe ? "Datenschutz (DSGVO)" : "Privacy Policy (GDPR)"}</span>
                </Link>
              </li>
              <li>
                <Link href={refundLink} className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span>🔄</span>
                  <span>{isAr ? "سياسة الاسترجاع والضمان" : isDe ? "Rückerstattungsrichtlinie" : "Refund Policy"}</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} GermanJobsPro. {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}</p>
          
          <div className="flex items-center gap-4 text-xs">
            <Link href={termsLink} className="hover:text-slate-200 transition-colors">
              {isAr ? "شروط الاستخدام" : isDe ? "AGB" : "Terms"}
            </Link>
            <span>•</span>
            <Link href={privacyLink} className="hover:text-slate-200 transition-colors">
              {isAr ? "الخصوصية (GDPR)" : isDe ? "Datenschutz" : "Privacy"}
            </Link>
            <span>•</span>
            <Link href={refundLink} className="hover:text-slate-200 transition-colors">
              {isAr ? "سياسة الاسترجاع" : isDe ? "Widerruf" : "Refunds"}
            </Link>
          </div>

          <p>{isAr ? "دليلك الشامل للعمل والعيش في ألمانيا 🇩🇪" : "Your All-in-One Gateway to Germany 🇩🇪"}</p>
        </div>
      </div>
    </footer>
  );
}
