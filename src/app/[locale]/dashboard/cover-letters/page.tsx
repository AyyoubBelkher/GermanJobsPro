import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { verifyUserSession } from "@/lib/user-session";
import { prisma } from "@/lib/prisma";
import CoverLetterListClient from "@/components/cover-letter/CoverLetterListClient";

export default async function CoverLettersPage({
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

  const coverLetters = await prisma.coverLetter.findMany({
    where: { userId: authResult.user.id },
    include: {
      cv: { select: { id: true, title: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      <Navbar locale={locale} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <Link href={`/${locale}/dashboard`} className="hover:text-blue-400 transition-colors">
                {isAr ? "لوحة التحكم" : isDe ? "Dashboard" : "Dashboard"}
              </Link>
              <span>/</span>
              <span className="text-slate-200">
                {isAr ? "خطابات التغطية (Anschreiben)" : isDe ? "Anschreiben" : "Cover Letters"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isAr ? "خطابات التغطية الألمانية (DIN 5008)" : isDe ? "Meine Anschreiben (DIN 5008)" : "German Cover Letters (DIN 5008)"}
            </h1>
          </div>

          <Link
            href={`/${locale}/dashboard/cover-letters/new`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
          >
            <span>✨</span>
            <span>{isAr ? "توليد خطاب جديد" : isDe ? "Neues Anschreiben generieren" : "Generate Cover Letter"}</span>
          </Link>
        </div>

        {/* Client Interactive List */}
        <CoverLetterListClient initialCoverLetters={coverLetters} locale={locale} />
      </main>

      <Footer locale={locale} />
    </div>
  );
}
