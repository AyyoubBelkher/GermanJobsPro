import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { verifyUserSession } from "@/lib/user-session";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage({
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

  const { user } = authResult;
  const isPro = user.plan === "PRO" && (!user.planExpiresAt || new Date(user.planExpiresAt) > new Date());
  const displayName = user.name || user.email.split("@")[0];

  // Fetch real user CVs and Cover Letters
  const [cvs, coverLetters] = await Promise.all([
    prisma.cv.findMany({
      where: { userId: user.id },
      include: {
        personalInfo: { select: { fullName: true, targetJobTitle: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.coverLetter.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      <Navbar locale={locale} initialUser={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-10">
        {/* User Profile Header Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg border border-blue-400/20 shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white truncate">
                  {isAr ? `مرحباً، ${displayName} 👋` : isDe ? `Willkommen, ${displayName} 👋` : `Welcome, ${displayName} 👋`}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                    isPro
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      : user.plan === "TRIAL"
                      ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
                >
                  {isPro ? "⭐ PRO PASS" : user.plan === "TRIAL" ? "⏳ TRIAL" : "⚡ STARTER FREE"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono flex-wrap">
                <span className="truncate max-w-[200px] sm:max-w-none">{user.email}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold font-sans flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                  <span>⚡</span>
                  <span>
                    {isPro
                      ? isAr
                        ? "20 طلب ذكاء اصطناعي يومياً (متجددة)"
                        : isDe
                        ? "20 KI-Anfragen täglich (erneuert)"
                        : "20 Daily AI Requests (renewed)"
                      : `${user.aiCredits} ${isAr ? "رصيد AI متبقي" : "AI Credits Left"}`}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isPro ? (
              <Link
                href={`/${locale}/dashboard/pricing`}
                className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <span>💎</span>
                <span>{isAr ? "إدارة خطة PRO" : isDe ? "PRO Tarif verwalten" : "Manage PRO Plan"}</span>
              </Link>
            ) : (
              <Link
                href={`/${locale}/dashboard/pricing`}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <span>💎</span>
                <span>{isAr ? "ترقية إلى PRO PASS" : isDe ? "Auf PRO upgraden" : "Upgrade to PRO"}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Quick Action Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href={`/${locale}/dashboard/cv/new`}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 p-5 hover:border-blue-400 transition-all hover:shadow-lg hover:shadow-blue-500/10 flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                {isAr ? "معايير DIN 5008" : isDe ? "DIN 5008 Standard" : "German DIN 5008"}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                {isAr ? "+ سيرة جديدة" : isDe ? "+ Neuer Lebenslauf" : "+ Create CV"}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? "سيرة متوافقة مع ATS" : isDe ? "ATS-optimierter Lebenslauf" : "ATS-friendly Resume"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform shrink-0">
              📄
            </div>
          </Link>

          <Link
            href={`/${locale}/dashboard/cover-letters/new`}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/30 to-slate-900/60 border border-blue-500/30 p-5 hover:border-blue-400 transition-all hover:shadow-lg hover:shadow-blue-500/10 flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                {isAr ? "مدعوم بالذكاء الاصطناعي ✨" : isDe ? "KI-Unterstützt ✨" : "AI-Powered ✨"}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                {isAr ? "✨ خطاب تغطية" : isDe ? "✨ Anschreiben" : "✨ AI Cover Letter"}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? "خطاب مخصص للوظيفة" : isDe ? "Maßgeschneidert" : "Tailored letter"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform shrink-0">
              ✍️
            </div>
          </Link>

          <Link
            href={`/${locale}/dashboard/ats-analyzer`}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 p-5 hover:border-emerald-400 transition-all hover:shadow-lg hover:shadow-emerald-500/10 flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                {isAr ? "فاحص التوافق" : isDe ? "ATS & DIN 5008" : "ATS & DIN 5008"}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                {isAr ? "🎯 فحص ATS الأسبوعي" : isDe ? "🎯 ATS-Audit" : "🎯 ATS Resume Audit"}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? "مطابقة الكلمات والمواصفات" : isDe ? "DIN 5008 Prüfung" : "DIN 5008 & Keyword check"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform shrink-0">
              🎯
            </div>
          </Link>

          <Link
            href={`/${locale}/dashboard/dossier`}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 p-5 hover:border-amber-400 transition-all hover:shadow-lg hover:shadow-amber-500/10 flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                {isAr ? "تجميع المستندات" : isDe ? "Dossier Compiler" : "Dossier Compiler"}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                {isAr ? "📁 ملف الترشيح الكامل" : isDe ? "📁 Bewerbungsmappe" : "📁 Complete Dossier"}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? "غلاف + خطاب + سيرة في PDF" : isDe ? "Deckblatt + CV + Anschreiben" : "Cover + CV + Letter"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform shrink-0">
              📑
            </div>
          </Link>
        </div>

        {/* Dynamic Dual-Column Content: CVs & Cover Letters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section 1: Saved CVs */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {isAr ? "السير الذاتية (Lebenslauf)" : isDe ? "Lebensläufe" : "German CVs"}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {isAr ? "سير ذاتية متوافقة مع معيار DIN 5008" : isDe ? "DIN 5008 konforme Lebensläufe" : "DIN 5008 German Standard Resumes"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-900/40 text-blue-400 border border-blue-700/50">
                    {cvs.length}
                  </span>
                  <Link
                    href={`/${locale}/dashboard/cv`}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline"
                  >
                    {isAr ? "عرض الكل" : isDe ? "Alle anzeigen" : "View all"}
                  </Link>
                </div>
              </div>

              {/* CVs List or Empty State */}
              {cvs.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 space-y-3">
                  <div className="inline-flex p-3 rounded-full bg-slate-900 text-slate-500">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-300">
                    {isAr ? "لم تقم بإنشاء أي سيرة ذاتية بعد" : isDe ? "Noch kein Lebenslauf erstellt" : "No CVs created yet"}
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    {isAr
                      ? "أنشئ سيرتك الذاتية الألمانية الأولى المتوافقة 100% مع أنظمة ATS ومعيار DIN 5008."
                      : isDe
                      ? "Erstellen Sie Ihren ersten DIN 5008 Lebenslauf mit Substantivstil-Optimierung."
                      : "Create your first German standard CV with ATS-friendly Substantivstil phrasing."}
                  </p>
                  <div className="pt-2">
                    <Link
                      href={`/${locale}/dashboard/cv/new`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20"
                    >
                      {isAr ? "إنشاء سيرة ذاتية الآن" : isDe ? "Lebenslauf erstellen" : "Create CV Now"}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {cvs.slice(0, 4).map((cv) => (
                    <div
                      key={cv.id}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm truncate">{cv.title}</h4>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              cv.isDraft
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            {cv.isDraft ? (isAr ? "مسودة" : "Draft") : isAr ? "مكتمل" : "Complete"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {cv.personalInfo?.fullName || "Unbekannt"} • {new Date(cv.updatedAt).toLocaleDateString(locale)}
                        </p>
                      </div>
                      <Link
                        href={`/${locale}/dashboard/cv/${cv.id}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white text-xs font-semibold transition-colors shrink-0"
                      >
                        {isAr ? "تعديل" : isDe ? "Bearbeiten" : "Edit"}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                DIN 5008 Standard • Substantivstil
              </span>
              <Link
                href={`/${locale}/dashboard/cv`}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                {isAr ? "إدارة السير الذاتية ←" : isDe ? "Lebensläufe verwalten →" : "Manage CVs →"}
              </Link>
            </div>
          </div>

          {/* Section 2: Saved Cover Letters (Anschreiben) */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {isAr ? "خطابات التغطية (Anschreiben)" : isDe ? "Anschreiben" : "Cover Letters"}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {isAr ? "خطابات التقديم المصممة بالذكاء الاصطناعي" : isDe ? "KI-generierte Anschreiben" : "AI-generated German Cover Letters"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-900/40 text-blue-400 border border-blue-700/50">
                    {coverLetters.length}
                  </span>
                  <Link
                    href={`/${locale}/dashboard/cover-letters`}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline"
                  >
                    {isAr ? "عرض الكل" : isDe ? "Alle anzeigen" : "View all"}
                  </Link>
                </div>
              </div>

              {/* Cover Letters List or Empty State */}
              {coverLetters.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 space-y-3">
                  <div className="inline-flex p-3 rounded-full bg-slate-900 text-slate-500">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-300">
                    {isAr ? "لم تقم بإنشاء أي خطاب تغطية بعد" : isDe ? "Noch kein Anschreiben erstellt" : "No Cover Letters created yet"}
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    {isAr
                      ? "قم بتوليد خطاب تغطية ألماني مخصص لأي وظيفة خلال ثوانٍ بالذكاء الاصطناعي."
                      : isDe
                      ? "Generieren Sie in Sekunden ein DIN 5008 Anschreiben für Ihre Wunschstelle."
                      : "Generate a customized German cover letter for any job in seconds."}
                  </p>
                  <div className="pt-2">
                    <Link
                      href={`/${locale}/dashboard/cover-letters/new`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20"
                    >
                      {isAr ? "توليد خطاب الآن" : isDe ? "Anschreiben generieren" : "Generate Cover Letter"}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {coverLetters.slice(0, 4).map((cl) => (
                    <div
                      key={cl.id}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-bold text-white text-sm truncate">{cl.jobTitle}</h4>
                        <p className="text-xs text-slate-400 truncate">
                          🏢 {cl.companyName} • {new Date(cl.updatedAt).toLocaleDateString(locale)}
                        </p>
                      </div>
                      <Link
                        href={`/${locale}/dashboard/cover-letters/${cl.id}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white text-xs font-semibold transition-colors shrink-0"
                      >
                        {isAr ? "عرض" : isDe ? "Ansehen" : "View"}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-blue-400 font-semibold bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl">
                {isAr ? "ذكاء اصطناعي احترافي ⚡" : isDe ? "KI-Optimiert ⚡" : "AI Powered Pro ⚡"}
              </span>
              <Link
                href={`/${locale}/dashboard/cover-letters`}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                {isAr ? "إدارة الخطابات ←" : isDe ? "Anschreiben verwalten →" : "Manage Cover Letters →"}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
