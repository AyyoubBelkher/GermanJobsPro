import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { verifyUserSession } from "@/lib/user-session";
import { prisma } from "@/lib/prisma";
import CvEditorClient, { FullCvData } from "@/components/cv/CvEditorClient";

interface PageParams {
  params: Promise<{ locale: string; id: string }>;
}

export default async function CvEditorPage({ params }: PageParams) {
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

  const cv = await prisma.cv.findFirst({
    where: {
      id,
      userId: authResult.user.id,
    },
    include: {
      personalInfo: true,
      experiences: { orderBy: { order: "asc" } },
      educations: { orderBy: { order: "asc" } },
      skills: { orderBy: { order: "asc" } },
      languages: { orderBy: { order: "asc" } },
      certifications: { orderBy: { order: "asc" } },
      projects: { orderBy: { order: "asc" } },
    },
  });

  if (!cv) {
    notFound();
  }

  // Format dates to ISO string for safe client serialization
  const formattedCv: FullCvData = {
    ...cv,
    createdAt: cv.createdAt.toISOString(),
    updatedAt: cv.updatedAt.toISOString(),
    personalInfo: cv.personalInfo
      ? {
          ...cv.personalInfo,
          birthDate: cv.personalInfo.birthDate ? cv.personalInfo.birthDate.toISOString() : null,
        }
      : null,
    experiences: cv.experiences.map((exp) => ({
      ...exp,
      startDate: exp.startDate.toISOString(),
      endDate: exp.endDate ? exp.endDate.toISOString() : null,
    })),
    educations: cv.educations.map((edu) => ({
      ...edu,
      startDate: edu.startDate.toISOString(),
      endDate: edu.endDate ? edu.endDate.toISOString() : null,
    })),
    certifications: cv.certifications.map((c) => ({
      ...c,
      issueDate: c.issueDate ? c.issueDate.toISOString() : null,
      expiryDate: c.expiryDate ? c.expiryDate.toISOString() : null,
    })),
  };

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      <Navbar locale={locale} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Link href={`/${locale}/dashboard`} className="hover:text-blue-400 transition-colors">
            {isAr ? "لوحة التحكم" : isDe ? "Dashboard" : "Dashboard"}
          </Link>
          <span>/</span>
          <Link href={`/${locale}/dashboard/cv`} className="hover:text-blue-400 transition-colors">
            {isAr ? "السير الذاتية" : isDe ? "Lebensläufe" : "German CVs"}
          </Link>
          <span>/</span>
          <span className="text-slate-200 truncate max-w-xs">{cv.title}</span>
        </div>

        {/* Editor Client Component */}
        <CvEditorClient initialCv={formattedCv} locale={locale} />
      </main>

      <Footer locale={locale} />
    </div>
  );
}
