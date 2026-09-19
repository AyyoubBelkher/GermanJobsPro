import React from "react";
import Link from "next/link";
import { getDictionary, isValidLocale, DEFAULT_LOCALE, LOCALE_METADATA, type Locale } from "@/lib/i18n";

interface FooterProps {
  locale?: string;
}

export default function Footer({ locale = "ar" }: FooterProps) {
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
              {dict.footer.brandDescription}
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
              {dict.footer.quickLinks}
            </h4>
            <ul className="space-y-2 text-sm font-medium text-slate-400">
              <li>
                <Link href={homeLink} className="hover:text-blue-400 transition-colors">
                  {dict.footer.home}
                </Link>
              </li>
              <li>
                <Link href={jobsLink} className="hover:text-blue-400 transition-colors">
                  {dict.footer.jobsInGermany}
                </Link>
              </li>
              <li>
                <Link href={blogLink} className="hover:text-blue-400 transition-colors">
                  {dict.footer.careerBlog}
                </Link>
              </li>
              <li>
                <Link href={cvLink} className="hover:text-blue-400 transition-colors">
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
                <Link href={pricingLink} className="hover:text-amber-400 transition-colors flex items-center gap-1.5 text-amber-400 font-semibold">
                  <span>💎</span>
                  <span>{dict.footer.pricingAndPro}</span>
                </Link>
              </li>
              <li>
                <Link href={contactLink} className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span>✉️</span>
                  <span>{dict.footer.contactAndHelp}</span>
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
              {dict.footer.complianceAndLegal}
            </h4>
            <ul className="space-y-2 text-sm font-medium text-slate-400">
              <li>
                <Link href={termsLink} className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span>⚖️</span>
                  <span>{dict.footer.termsOfService}</span>
                </Link>
              </li>
              <li>
                <Link href={privacyLink} className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span>🛡️</span>
                  <span>{dict.footer.privacyPolicy}</span>
                </Link>
              </li>
              <li>
                <Link href={refundLink} className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span>🔄</span>
                  <span>{dict.footer.refundPolicy}</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} GermanJobsPro. {dict.footer.allRightsReserved}</p>
          
          <div className="flex items-center gap-4 text-xs">
            <Link href={termsLink} className="hover:text-slate-200 transition-colors">
              {dict.footer.terms}
            </Link>
            <span>•</span>
            <Link href={privacyLink} className="hover:text-slate-200 transition-colors">
              {dict.footer.privacy}
            </Link>
            <span>•</span>
            <Link href={refundLink} className="hover:text-slate-200 transition-colors">
              {dict.footer.refunds}
            </Link>
          </div>

          <p>{dict.footer.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
