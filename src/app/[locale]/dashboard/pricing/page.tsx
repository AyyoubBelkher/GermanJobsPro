import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { verifyUserSession } from "@/lib/user-session";
import { prisma } from "@/lib/prisma";
import PricingClient from "@/components/pricing/PricingClient";

export default async function PricingPage({
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

  const user = await prisma.user.findUnique({
    where: { id: authResult.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      planExpiresAt: true,
      aiCredits: true,
    },
  });

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const clientUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    planExpiresAt: user.planExpiresAt ? user.planExpiresAt.toISOString() : null,
    aiCredits: user.aiCredits,
  };

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      <Navbar locale={locale} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        {/* Header Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Link href={`/${locale}/dashboard`} className="hover:text-blue-400 transition-colors">
            {isAr ? "لوحة التحكم" : isDe ? "Dashboard" : "Dashboard"}
          </Link>
          <span>/</span>
          <span className="text-slate-200">
            {isAr ? "الترقية والاشتراك (PRO Pass)" : isDe ? "Preise & Upgrades" : "Pricing & Upgrades"}
          </span>
        </div>

        <PricingClient user={clientUser} locale={locale} />
      </main>

      <Footer locale={locale} />
    </div>
  );
}
