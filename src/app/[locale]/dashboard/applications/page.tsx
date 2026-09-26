import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { verifyUserSession } from "@/lib/user-session";
import { prisma } from "@/lib/prisma";
import ApplicationTrackerClient, {
  ApplicationItem,
} from "@/components/dashboard/ApplicationTrackerClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const isFr = locale === "fr";

  const title = isAr
    ? "تتبع التقديمات والوظائف | GermanJobsPro"
    : isDe
    ? "Bewerbungs-Tracker & Pipeline | GermanJobsPro"
    : isFr
    ? "Suivi des candidatures | GermanJobsPro"
    : "Application Tracker & Pipeline | GermanJobsPro";

  const description = isAr
    ? "لوحة تتبع طلبات التوظيف في ألمانيا، وإدارة المقابلات، ومعدل الاستجابة."
    : isDe
    ? "Verwalten Sie Ihre Bewerbungen auf dem deutschen Arbeitsmarkt mit Status-Tracking und Notizen."
    : isFr
    ? "Gérez vos candidatures en Allemagne, vos entretiens et vos taux de réponse."
    : "Track your German job applications, interview stages, and response rates in one unified dashboard.";

  return {
    title,
    description,
  };
}

export default async function ApplicationsPage({
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
    redirect(`/${locale}/auth/login`);
  }

  // Pre-fetch user applications with Prisma
  const rawApplications = await prisma.application.findMany({
    where: { userId: authResult.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          company: true,
          city: true,
          applyUrl: true,
          status: true,
        },
      },
      cv: {
        select: {
          id: true,
          title: true,
          language: true,
        },
      },
      coverLetter: {
        select: {
          id: true,
          title: true,
          language: true,
        },
      },
    },
  });

  // Map to serializable format for client component
  const applications: ApplicationItem[] = rawApplications.map((app) => ({
    id: app.id,
    userId: app.userId,
    jobId: app.jobId,
    cvId: app.cvId,
    coverLetterId: app.coverLetterId,
    companyName: app.companyName,
    jobTitle: app.jobTitle,
    location: app.location,
    status: app.status as ApplicationItem["status"],
    appliedAt: app.appliedAt ? app.appliedAt.toISOString() : null,
    notes: app.notes,
    followUpAt: app.followUpAt ? app.followUpAt.toISOString() : null,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    job: app.job,
    cv: app.cv,
    coverLetter: app.coverLetter,
  }));

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      <Navbar locale={locale} initialUser={authResult.user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <Link href={`/${locale}/dashboard`} className="hover:text-blue-400 transition-colors">
                {isAr ? "لوحة التحكم" : isDe ? "Dashboard" : "Dashboard"}
              </Link>
              <span>/</span>
              <span className="text-slate-200">
                {isAr
                  ? "تتبع التقديمات (Bewerbungs-Tracker)"
                  : isDe
                  ? "Bewerbungs-Tracker"
                  : isFr
                  ? "Suivi des candidatures"
                  : "Application Tracker"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isAr
                ? "💼 سجل متابعة التقديمات للوظائف الألمانية"
                : isDe
                ? "💼 Bewerbungs-Tracker & Pipeline"
                : isFr
                ? "💼 Suivi de vos candidatures en Allemagne"
                : "💼 German Job Application Tracker"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              {isAr
                ? "تابع مسار تقديماتك ومراحل المقابلات مع أصحاب العمل، وقم بربط السير الذاتية وخطابات الدافع لكل وظيفة."
                : isDe
                ? "Behalten Sie den Überblick über all Ihre Bewerbungen in Deutschland: vom Entwurf bis zum Vertragsangebot."
                : isFr
                ? "Gérez toutes les étapes de vos candidatures : sauvegardées, envoyées, entretiens et offres d'embauche."
                : "Manage your German job pipeline from saved jobs and submitted applications to interviews and offers."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/${locale}/jobs`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-xs transition-colors"
            >
              <span>🔍</span>
              <span>{isAr ? "استكشاف الوظائف" : isDe ? "Jobs finden" : isFr ? "Trouver des emplois" : "Find Jobs"}</span>
            </Link>
          </div>
        </div>

        {/* Application Tracker Client Component */}
        <ApplicationTrackerClient
          initialApplications={applications}
          locale={locale}
        />
      </main>

      <Footer locale={locale} />
    </div>
  );
}
