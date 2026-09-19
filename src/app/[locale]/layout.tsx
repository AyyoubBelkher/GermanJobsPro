import type { Metadata } from "next";
import { Geist, Geist_Mono, Cairo } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { LOCALES, LOCALE_METADATA, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://germanjobspro.com"),
  title: "بوابتك للعمل والاستقرار في ألمانيا | GermanJobsPro",
  description: "دليلك الشامل والمحدّث يومياً لأحدث الوظائف الشاغرة، فرص التدريب المهني (Ausbildung)، وإرشادات التأشيرة.",
};

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const rawLocale = resolvedParams?.locale;
  const locale: Locale = rawLocale && isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const currentMeta = LOCALE_METADATA[locale] || LOCALE_METADATA[DEFAULT_LOCALE];

  const isAr = locale === "ar";
  const fontClass = isAr ? cairo.className : `${geistSans.className} font-sans`;

  return (
    <html
      lang={currentMeta.lang || "ar"}
      dir={currentMeta.dir || "rtl"}
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} h-full antialiased`}
    >
      <body className={`${fontClass} min-h-full flex flex-col font-sans`}>
        {children}
        <GoogleAnalytics gaId="G-K8HLLFTTDF" />
      </body>
    </html>
  );
}
