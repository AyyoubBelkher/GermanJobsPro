import React from "react";
import Link from "next/link";
import { getDictionary, isValidLocale, DEFAULT_LOCALE, LOCALE_METADATA, type Locale } from "@/lib/i18n";

interface FooterProps {
  locale?: string;
  className?: string;
}

export default function Footer({ locale = "ar", className }: FooterProps) {
  const activeLocale: Locale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(activeLocale);
  const currentMeta = LOCALE_METADATA[activeLocale];
  const dir = currentMeta.dir;

  const homeLink = `/${activeLocale}`;
  const jobsLink = `/${activeLocale}/jobs`;
  const blogLink = `/${activeLocale}/blog`;
  const pricingLink = `/${activeLocale}/pricing`;
  const contactLink = `/${activeLocale}/contact`;
  const cvLink = `/${activeLocale}/dashboard/cv`;
  const termsLink = `/${activeLocale}/terms`;
  const privacyLink = `/${activeLocale}/privacy`;
  const refundLink = `/${activeLocale}/refund`;

  return (
    <footer className={`bg-[#061838] ${className !== undefined ? className : "mt-20 border-t border-white/10"} transition-colors`} dir={dir}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <Link href={homeLink} className="inline-flex items-center gap-2.5 sm:gap-3 group">
              <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0A2552] border border-amber-400/40 group-hover:border-amber-400 shadow-xs group-hover:scale-105 transition-all overflow-hidden shrink-0">
                {/* German flag ribbon on top edge */}
                <div className="absolute top-0 inset-x-0 h-1 flex">
                  <span className="w-1/3 bg-[#000000]" />
                  <span className="w-1/3 bg-[#DD0000]" />
                  <span className="w-1/3 bg-[#FFCC00]" />
                </div>
                <span className="text-lg sm:text-xl transform group-hover:rotate-6 transition-transform">🎓</span>
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                GermanJobs<span className="text-[#FACC15]">Pro</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              {dict.footer.brandDescription}
            </p>
            <div className="pt-1">
              <a
                href="mailto:support@germanjobspro.com"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0A2552] hover:bg-[#0E3572] border border-white/15 text-xs font-mono text-slate-200 hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-[#FACC15] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span>support@germanjobspro.com</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              {dict.footer.quickLinks}
            </h4>
            <ul className="space-y-2 text-sm font-medium text-slate-400">
              <li>
                <Link href={homeLink} className="hover:text-[#FACC15] transition-colors">
                  {dict.footer.home}
                </Link>
              </li>
              <li>
                <Link href={jobsLink} className="hover:text-[#FACC15] transition-colors">
                  {dict.footer.jobsInGermany}
                </Link>
              </li>
              <li>
                <Link href={blogLink} className="hover:text-[#FACC15] transition-colors">
                  {dict.footer.careerBlog}
                </Link>
              </li>
              <li>
                <Link href={cvLink} className="hover:text-[#FACC15] transition-colors">
                  {dict.footer.din5008Builder}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Pricing Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              {dict.footer.subscriptionsAndSupport}
            </h4>
            <ul className="space-y-2 text-sm font-medium text-slate-400">
              <li>
                <Link href={pricingLink} className="hover:text-[#FACC15] transition-colors flex items-center gap-1.5 text-[#FACC15] font-semibold">
                  <span>💎</span>
                  <span>{dict.footer.pricingAndPro}</span>
                </Link>
              </li>
              <li>
                <Link href={contactLink} className="hover:text-[#FACC15] transition-colors flex items-center gap-1.5">
                  <span>✉️</span>
                  <span>{dict.footer.contactAndHelp}</span>
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@germanjobspro.com"
                  className="hover:text-[#FACC15] transition-colors flex items-center gap-1.5 text-xs font-mono text-slate-400"
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
              {dict.footer.complianceAndLegal}
            </h4>
            <ul className="space-y-2 text-sm font-medium text-slate-400">
              <li>
                <Link href={termsLink} className="hover:text-[#FACC15] transition-colors flex items-center gap-1.5">
                  <span>⚖️</span>
                  <span>{dict.footer.termsOfService}</span>
                </Link>
              </li>
              <li>
                <Link href={privacyLink} className="hover:text-[#FACC15] transition-colors flex items-center gap-1.5">
                  <span>🛡️</span>
                  <span>{dict.footer.privacyPolicy}</span>
                </Link>
              </li>
              <li>
                <Link href={refundLink} className="hover:text-[#FACC15] transition-colors flex items-center gap-1.5">
                  <span>🔄</span>
                  <span>{dict.footer.refundPolicy}</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} GermanJobsPro. {dict.footer.allRightsReserved}</p>
          
          <div className="flex items-center gap-4 text-xs">
            <Link href={termsLink} className="hover:text-white transition-colors">
              {dict.footer.terms}
            </Link>
            <span>•</span>
            <Link href={privacyLink} className="hover:text-white transition-colors">
              {dict.footer.privacy}
            </Link>
            <span>•</span>
            <Link href={refundLink} className="hover:text-white transition-colors">
              {dict.footer.refunds}
            </Link>
          </div>

          <p>{dict.footer.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
