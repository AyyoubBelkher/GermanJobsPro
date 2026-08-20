import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { verifyUserSession } from "@/lib/user-session";
import { prisma } from "@/lib/prisma";
import CoverLetterEditorClient, { CoverLetterData } from "@/components/cover-letter/CoverLetterEditorClient";

interface PageParams {
  params: Promise<{ locale: string; id: string }>;
}

export default async function CoverLetterEditorPage({ params }: PageParams) {
  const { locale, id } = await params;
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const dir = isAr ? "rtl" : "ltr";

  const cookieStore = await cookies();
  const token = cookieStore.get("user_session")?.value;
  const authResult = await verifyUserSession(token);

  if (!authResult) {
    redirect(`/${locale}/auth/login`);
  }

  const coverLetter = await prisma.coverLetter.findFirst({
    where: {
      id,
      userId: authResult.user.id,
    },
    include: {
      cv: { select: { id: true, title: true } },
    },
  });

  if (!coverLetter) {
    notFound();
  }

  const formattedCoverLetter: CoverLetterData = {
    ...coverLetter,
    createdAt: coverLetter.createdAt.toISOString(),
    updatedAt: coverLetter.updatedAt.toISOString(),
  };

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      <Navbar locale={locale} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Link href={`/${locale}/dashboard`} className="hover:text-purple-400 transition-colors">
            {isAr ? "لوحة التحكم" : isDe ? "Dashboard" : "Dashboard"}
          </Link>
          <span>/</span>
          <Link href={`/${locale}/dashboard/cover-letters`} className="hover:text-purple-400 transition-colors">
            {isAr ? "خطابات التغطية" : isDe ? "Anschreiben" : "Cover Letters"}
          </Link>
          <span>/</span>
          <span className="text-slate-200 truncate max-w-xs">{coverLetter.title}</span>
        </div>

        {/* Editor Client Component */}
        <CoverLetterEditorClient initialCoverLetter={formattedCoverLetter} locale={locale} />
      </main>

      <Footer locale={locale} />
    </div>
  );
}
