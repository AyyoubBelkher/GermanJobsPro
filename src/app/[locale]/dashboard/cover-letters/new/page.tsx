import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { verifyUserSession } from "@/lib/user-session";
import { prisma } from "@/lib/prisma";
import CoverLetterGeneratorClient from "@/components/cover-letter/CoverLetterGeneratorClient";

export function extractGermanJobTitle(rawTitle: string): string {
  if (!rawTitle) return "";
  
  // إذا كان العنوان يحتوي على المسمى الأصلي بين قوسين، استخرجه
  const match = rawTitle.match(/\(([^)]+)\)/);
  if (match && /[a-zA-Z]/.test(match[1])) {
    return match[1].trim();
  }
  
  // أو قم بإزالة أي أحرف عربية والإبقاء على الحروف اللاتينية
  const latinOnly = rawTitle.replace(/[\u0600-\u06FF]/g, "").replace(/^[-–—:\s]+|[-–—:\s]+$/g, "").trim();
  return latinOnly || rawTitle;
}

export default async function NewCoverLetterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ jobTitle?: string; companyName?: string; jobDescription?: string }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const dir = isAr ? "rtl" : "ltr";

  const cookieStore = await cookies();
  const token = cookieStore.get("user_session")?.value;
  const authResult = await verifyUserSession(token);

  if (!authResult) {
    redirect(`/${locale}/auth/login`);
  }

  const userCvs = await prisma.cv.findMany({
    where: { userId: authResult.user.id },
    select: {
      id: true,
      title: true,
      language: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const rawJobTitle = resolvedSearchParams.jobTitle || "";
  const initialJobTitle = extractGermanJobTitle(rawJobTitle);

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
          <Link href={`/${locale}/dashboard/cover-letters`} className="hover:text-blue-400 transition-colors">
            {isAr ? "خطابات التغطية" : isDe ? "Anschreiben" : "Cover Letters"}
          </Link>
          <span>/</span>
          <span className="text-slate-200">
            {isAr ? "توليد جديد (بالذكاء الاصطناعي)" : isDe ? "Neu generieren (KI)" : "Generate New (AI)"}
          </span>
        </div>

        {/* Generator Studio Client */}
        <CoverLetterGeneratorClient
          userCvs={userCvs}
          locale={locale}
          initialJobTitle={initialJobTitle}
          initialCompanyName={resolvedSearchParams.companyName || ""}
          initialJobDescription={resolvedSearchParams.jobDescription || ""}
        />
      </main>

      <Footer locale={locale} />
    </div>
  );
}
