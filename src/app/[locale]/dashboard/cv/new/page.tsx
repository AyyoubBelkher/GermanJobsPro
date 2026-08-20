import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { verifyUserSession } from "@/lib/user-session";
import CvNewClient from "@/components/cv/CvNewClient";

export default async function NewCvPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const dir = isAr ? "rtl" : "ltr";

  const cookieStore = await cookies();
  const token = cookieStore.get("user_session")?.value;
  const authResult = await verifyUserSession(token);

  if (!authResult) {
    redirect(`/${locale}/auth/login`);
  }

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      <Navbar locale={locale} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        {/* Header Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Link href={`/${locale}/dashboard`} className="hover:text-blue-400 transition-colors">
            {isAr ? "لوحة التحكم" : isDe ? "Dashboard" : "Dashboard"}
          </Link>
          <span>/</span>
          <Link href={`/${locale}/dashboard/cv`} className="hover:text-blue-400 transition-colors">
            {isAr ? "السير الذاتية" : isDe ? "Lebensläufe" : "German CVs"}
          </Link>
          <span>/</span>
          <span className="text-slate-200">
            {isAr ? "سيرة جديدة" : isDe ? "Neu" : "New"}
          </span>
        </div>

        <CvNewClient locale={locale} />
      </main>

      <Footer locale={locale} />
    </div>
  );
}
