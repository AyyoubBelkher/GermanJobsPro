import type { Metadata } from "next";
import { Geist, Geist_Mono, Cairo } from "next/font/google";
import "./globals.css";

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
  title: "بوابتك للعمل والاستقرار في ألمانيا | Germany Guide",
  description: "دليلك الشامل والمحدّث يومياً لأحدث الوظائف الشاغرة، فرص التدريب المهني (Ausbildung)، وإرشادات التأشيرة.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} h-full antialiased`}
    >
      <body className={`${cairo.className} min-h-full flex flex-col font-sans`}>
        {children}
      </body>
    </html>
  );
}
