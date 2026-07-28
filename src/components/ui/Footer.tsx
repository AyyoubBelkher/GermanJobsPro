import React from "react";
import Link from "next/link";

interface FooterProps {
  locale?: string;
}

export default function Footer({ locale = "ar" }: FooterProps) {
  const isAr = locale === "ar";
  const blogLink = `/${locale}/blog`;

  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 mt-20 transition-colors" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center p-1.5 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 border border-blue-500/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://flagcdn.com/w40/de.png"
                  alt="Germany Flag"
                  className="w-6 h-4 rounded-xs object-cover shadow-xs"
                />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                GermanJobs<span className="text-blue-600 dark:text-blue-400">Pro</span>
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
              دليلك الشامل والمحدّث يومياً لأحدث الوظائف الشاغرة، فرص التدريب المهني (Ausbildung)، وإرشادات التأشيرة والاستقرار في ألمانيا.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              روابط سريعة
            </h4>
            <ul className="space-y-2 text-sm font-medium text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link href={blogLink} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  تصفح جميع الوظائف
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} GermanJobsPro. جميع الحقوق محفوظة.</p>
          <p>دليلك الشامل للعمل والعيش في ألمانيا 🇩🇪</p>
        </div>
      </div>
    </footer>
  );
}
