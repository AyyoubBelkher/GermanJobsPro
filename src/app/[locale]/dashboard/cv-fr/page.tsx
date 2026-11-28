import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { verifyUserSession } from "@/lib/user-session";
import FrenchCvBuilderClient from "@/components/cv-fr/FrenchCvBuilderClient";

export default async function FrenchCvBuilderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const isFr = locale === "fr";
  const dir = isAr ? "rtl" : "ltr";

  const cookieStore = await cookies();
  const token = cookieStore.get("user_session")?.value;
  const authResult = await verifyUserSession(token);

  if (!authResult) {
    redirect(
      `/${locale}/auth/login?next=${encodeURIComponent(`/${locale}/dashboard/cv-fr`)}`
    );
  }

  const pageLabel = isAr
    ? "سيرة ذاتية بالفرنسية (المغرب)"
    : isFr
    ? "CV en Français (Maroc)"
    : isDe
    ? "Französischer Lebenslauf (Marokko)"
    : "French CV (Morocco)";

  return (
    <div
      dir={dir}
      className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between"
    >
      <Navbar locale={locale} initialUser={authResult.user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Link
            href={`/${locale}/dashboard`}
            className="hover:text-teal-400 transition-colors"
          >
            {isAr ? "لوحة التحكم" : isFr ? "Tableau de bord" : "Dashboard"}
          </Link>
          <span>/</span>
          <span className="text-slate-200">{pageLabel}</span>
        </div>

        <FrenchCvBuilderClient
          locale={locale}
          userEmail={authResult.user.email}
          userName={authResult.user.name}
        />
      </main>

      <Footer locale={locale} />
    </div>
  );
}
