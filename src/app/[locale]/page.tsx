import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-session";
import LandingFaqAccordion from "@/components/landing/LandingFaqAccordion";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  const isDe = locale === "de";

  return {
    title: isAr
      ? "GermanJobsPro 🇩🇪 | بوابتك المتكاملة للعمل والاستقرار في ألمانيا"
      : isDe
      ? "GermanJobsPro 🇩🇪 | Ihre All-in-One Plattform für Karriere in Deutschland"
      : "GermanJobsPro 🇩🇪 | Your Gateway to Career & Jobs in Germany",
    description: isAr
      ? "حوّل سيرتك الذاتية إلى صيغة DIN 5008 الألمانية بضغطة زر واحدة، أنشئ خطابات دافع Anschreiben مخصصة بالذكاء الاصطناعي، وتصفح آلاف الوظائف المحدثة يومياً في ألمانيا."
      : isDe
      ? "1-Klick DIN 5008 Lebenslauf-Generator, KI-Anschreiben und aktuelle Stellenangebote in Deutschland."
      : "1-Click German DIN 5008 CV builder, AI cover letter generator (Anschreiben), and verified German jobs board.",
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const dir = isAr ? "rtl" : "ltr";

  // Check user authentication on server
  const authResult = await getUserSession();
  const user = authResult ? authResult.user : null;

  // Fetch top 3 latest jobs and top 3 blog posts in parallel
  let latestJobs: Array<{
    id: string;
    title: string;
    company: string;
    city: string | null;
    category: string;
    jobType: string | null;
    languageReq: string | null;
    salary: string | null;
    applyUrl: string;
    descriptionRaw: string | null;
    publishedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  let latestPosts: Array<{
    id: string;
    slug: string;
    title: string;
    markdown_content: string;
    category: string;
    image_url: string | null;
    source_link: string | null;
    generated_by_ai: boolean;
    published: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  let germanA1Posts: Array<{
    id: string;
    slug: string;
    title: string;
    markdown_content: string;
    category: string;
    image_url: string | null;
    source_link: string | null;
    generated_by_ai: boolean;
    published: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  try {
    const [jobs, posts, a1Posts] = await Promise.all([
      prisma.job.findMany({
        where: { status: "ACTIVE" },
        orderBy: { publishedAt: "desc" },
        take: 3,
      }),
      prisma.post.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.post.findMany({
        where: {
          published: true,
          OR: [
            { category: { equals: "German A1", mode: "insensitive" } },
            { category: { equals: "Deutsch A1", mode: "insensitive" } },
            { category: { contains: "A1", mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);
    latestJobs = jobs;
    latestPosts = posts;
    germanA1Posts = a1Posts;
  } catch (error) {
    console.warn("[LandingPage] Database query failed during prerendering:", error instanceof Error ? error.message : error);
  }

  const faqItems = [
    {
      question: isAr
        ? "ما هو معيار DIN 5008 ولماذا تطلبه الشركات ومسؤولو التوظيف في ألمانيا؟"
        : isDe
        ? "Was ist die DIN 5008 Norm und warum verlangen deutsche Arbeitgeber sie?"
        : "What is the DIN 5008 standard and why do German recruiters require it?",
      answer: isAr
        ? "معيار DIN 5008 هو المعيار الرسمي القياسي في ألمانيا لكتابة وتنسيق المستندات المهنية والمراسلات التجارية. يتبع هيكلاً جدولياً دقيقاً (Tabellarischer Lebenslauf) بترتيب زمني عكسي وهوامش ومسافات محددة تتيح لمسؤولي التوظيف وفلاتر ATS الألمانية فحص ملفك في أقل من 30 ثانية بدون أي تشويه في البيانات."
        : isDe
        ? "Die DIN 5008 ist der offizielle deutsche Standard für Schreib- und Gestaltungsregeln in der Geschäftskorrespondenz. Sie garantiert eine übersichtliche, tabellarische Struktur (Tabellarischer Lebenslauf), die von deutschen Personalern und ATS-Systemen lückenlos verarbeitet werden kann."
        : "DIN 5008 is the official German industry standard for business correspondence and resumes. It enforces a strict tabular layout (Tabellarischer Lebenslauf) in reverse chronological order, allowing German recruiters and ATS filters to evaluate your qualifications in seconds.",
    },
    {
      question: isAr
        ? "كيف تعمل ميزة التحويل الفوري والتكييف الذكي (1-Click PDF to DIN 5008)؟"
        : isDe
        ? "Wie funktioniert die 1-Klick Konvertierung & DIN 5008 Optimierung?"
        : "How does the 1-Click PDF to DIN 5008 Auto-Adapt work?",
      answer: isAr
        ? "بكل بساطة، يمكنك رفع سيرتك الذاتية الحالية (PDF) بأي لغة، ليقوم النظام فوراً بتكييفها وصياغة خبراتك بالأسلوب الاسمي الألماني (Substantivstil) واستخراج وثيقة رسمية متوافقة 100% مع معايير DIN 5008 جاهزة للتعديل والتحميل."
        : isDe
        ? "Laden Sie einfach Ihren bestehenden Lebenslauf als PDF in beliebiger Sprache hoch. Das System passt ihn sofort an, formuliert Ihre Erfahrungen im deutschen Substantivstil und erstellt ein 100% DIN 5008 konformes Dokument."
        : "Simply upload your existing CV in PDF format (in any language). The system instantly adapts it, crafts your experience in German Substantivstil, and generates an official document 100% compliant with DIN 5008 standards.",
    },
    {
      question: isAr
        ? "هل المستندات الناتجة متوافقة مع متطلبات تأشيرة العمل وبطاقة الفرصة (Chancenkarte)؟"
        : isDe
        ? "Sind die Dokumente für das Visum und die Chancenkarte geeignet?"
        : "Are the generated documents compliant with German Work Visa & Opportunity Card (Chancenkarte)?",
      answer: isAr
        ? "نعم 100%. ملفات الترشيح (Bewerbungsunterlagen) المنشأة عبر المنصة مطابقة تماماً للمتطلبات الرسمية للسفارات الألمانية ووكالة العمل الفيدرالية (Bundesagentur für Arbeit)، بما في ذلك صفحة الغلاف (Deckblatt) والبيانات الشخصية الكاملة وتوثيق المؤهلات."
        : isDe
        ? "Ja, zu 100%. Die erstellten Bewerbungsunterlagen erfüllen sämtliche Anforderungen der Bundesagentur für Arbeit und der deutschen Auslandsvertretungen für Visumanträge und die Chancenkarte."
        : "Yes, 100%. The application dossiers created with GermanJobsPro fully meet the strict requirements of the German Federal Employment Agency (Bundesagentur für Arbeit) and embassies for work visas and Opportunity Cards.",
    },
    {
      question: isAr
        ? "ما الفرق بين السيرة الذاتية العادية والملف المتكامل (Bewerbungsmappe)؟"
        : isDe
        ? "Was ist der Unterschied zwischen einem einfachen Lebenslauf und einer Bewerbungsmappe?"
        : "What is the difference between a simple CV and a Complete Dossier (Bewerbungsmappe)?",
      answer: isAr
        ? "في سوق العمل الألماني، تزيد نسبة القبول بشكل هائل عند تقديم ملف ترشيح متكامل (Bewerbungsmappe) يضم: 1) صفحة الغلاف الفاخرة مع الصورة (Deckblatt)، 2) خطاب الدافع الموجه للوظيفة (Anschreiben)، 3) السيرة الذاتية القياسية (Lebenslauf)، و 4) الشهادات والخبرات. منصتنا تتيح لك إنشاء وتحميل هذه الحزمة بملف PDF واحد متناسق."
        : isDe
        ? "In Deutschland bevorzugen Arbeitgeber eine vollständige Bewerbungsmappe bestehend aus Deckblatt mit Bewerbungsfoto, individuellem Anschreiben und tabellarischem Lebenslauf. GermanJobsPro generiert diese gesamte Mappe aus einem Guss."
        : "In Germany, hiring managers expect a complete application package (Bewerbungsmappe) containing a Cover Page with photo (Deckblatt), tailored Cover Letter (Anschreiben), and Tabular CV (Lebenslauf). Our platform compiles this into a single elegant PDF.",
    },
    {
      question: isAr
        ? "هل يمكنني البدء واستخدام المنصة مجاناً؟"
        : isDe
        ? "Kann ich die Plattform kostenlos nutzen?"
        : "Can I start and use the platform for free?",
      answer: isAr
        ? "نعم! يمكنك التسجيل مجاناً وإنشاء وتعديل وتنزيل سيرتك الذاتية بتنسيق DIN 5008 الرسمي وتصفح جميع الوظائف. كما يحصل كل مستخدم جديد على رصيد ذكاء اصطناعي تجريبي لتجربة ميزات التوليد والتكييف الذكي (DIN 5008)."
        : isDe
        ? "Ja! Die Registrierung ist kostenlos. Sie können Ihren DIN 5008 Lebenslauf erstellen, bearbeiten, herunterladen und die Jobbörse nutzen. Zudem erhalten Sie kostenloses KI-Guthaben zum Testen."
        : "Yes! Registration is completely free. You can build, edit, and download your official DIN 5008 CV and browse all jobs. Every new account receives free AI credits to test the smart adaptation and cover letter generators.",
    },
  ];

  const heroCtaHref = user ? `/${locale}/dashboard/cv` : `/${locale}/auth/signup`;
  const heroCtaText = user
    ? isAr
      ? "انتقل إلى لوحة التحكم / سيرتي الذاتية 🇩🇪"
      : isDe
      ? "Zum Dashboard / Lebensläufe 🇩🇪"
      : "Go to Dashboard / My Resumes 🇩🇪"
    : isAr
    ? "تحويل فوري (1-Click PDF)"
    : isDe
    ? "Sofort-Konvertierung (1-Klick PDF)"
    : "Instant Convert (1-Click PDF)";

  const bottomCtaHref = user ? `/${locale}/dashboard/dossier` : `/${locale}/auth/signup`;
  const bottomCtaText = user
    ? isAr
      ? "🚀 توجه إلى لوحة التحكم واستكمل ملفك"
      : isDe
      ? "🚀 Zum Dashboard & Bewerbungsmappe"
      : "🚀 Go to Dashboard & Complete Dossier"
    : isAr
    ? "🚀 أنشئ ملف ترشيحك الألماني الآن مجاناً"
    : isDe
    ? "🚀 Jetzt kostenlos registrieren"
    : "🚀 Create Your German Dossier Free";

  const bottomSecHref = user ? `/${locale}/dashboard/pricing` : `/${locale}/pricing`;

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      <Navbar locale={locale} initialUser={user} />

      <main className="flex-1 w-full space-y-24 sm:space-y-32 pb-24 overflow-hidden">
        
        {/* ========================================================= */}
        {/* 1. HERO SECTION */}
        {/* ========================================================= */}
        <section className="relative pt-12 sm:pt-20 lg:pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Glowing Background Orbs & German Flag Accents */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-gradient-to-tr from-blue-600/20 via-blue-500/15 to-slate-800/10 rounded-full blur-3xl pointer-events-none -z-10" />
          
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-800 text-xs sm:text-sm font-semibold text-slate-300 shadow-xl backdrop-blur-md hover:border-blue-500/40 transition-colors">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>
                {isAr
                  ? "🇩🇪 المنصة الأولى للتأهيل والتقديم على وظائف ألمانيا بمعايير DIN 5008"
                  : isDe
                  ? "🇩🇪 #1 Plattform für Bewerbung & Karriere in Deutschland (DIN 5008)"
                  : "🇩🇪 #1 All-in-One Career & Application Platform for Germany (DIN 5008)"}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.15]">
              {isAr ? (
                <>
                  بوابتك المتكاملة للعمل <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-blue-200">
                    والاستقرار في ألمانيا
                  </span>{" "}
                  <span className="inline-block not-italic select-none [text-fill-color:initial] bg-none">
                    🇩🇪
                  </span>
                </>
              ) : isDe ? (
                <>
                  Ihre All-in-One Plattform für <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-blue-200">
                    Karriere & Leben in Deutschland
                  </span>{" "}
                  <span className="inline-block not-italic select-none [text-fill-color:initial] bg-none">
                    🇩🇪
                  </span>
                </>
              ) : (
                <>
                  Your All-in-One Gateway to <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-blue-200">
                    Work & Build a Career in Germany
                  </span>{" "}
                  <span className="inline-block not-italic select-none [text-fill-color:initial] bg-none">
                    🇩🇪
                  </span>
                </>
              )}
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
              {isAr
                ? "حوّل سيرتك الذاتية الحالية بضغطة زر واحدة إلى صيغة DIN 5008 الألمانية المعتمدة، أنشئ خطابات دافع (Anschreiben) مخصصة بالذكاء الاصطناعي، وتصفح آلاف الوظائف المحدثة يومياً."
                : isDe
                ? "Verwandeln Sie Ihren Lebenslauf mit 1-Klick in das offizielle DIN 5008 Format, generieren Sie passgenaue KI-Anschreiben und entdecken Sie täglich neue Jobs in ganz Deutschland."
                : "Transform your existing resume into a certified German DIN 5008 standard in 1-click, craft tailored AI cover letters (Anschreiben), and apply to thousands of verified German jobs."}
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href={heroCtaHref}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base shadow-2xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2.5 border border-blue-400/30"
              >
                <span>✨</span>
                <span>{heroCtaText}</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">DIN 5008</span>
              </Link>

              <Link
                href={`/${locale}/jobs`}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-base border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <span>🔍</span>
                <span>{isAr ? "تصفح أحدث الوظائف" : isDe ? "Jobs durchsuchen" : "Browse German Jobs"}</span>
              </Link>
            </div>

            {/* Trust Badges Strip */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-slate-900/80">
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-400">
                <span className="text-emerald-400">✓</span>
                <span>DIN 5008 Standard</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-400">
                <span className="text-emerald-400">✓</span>
                <span>100% German ATS Pass</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-400">
                <span className="text-emerald-400">✓</span>
                <span>Substantivstil AI Engine</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-400">
                <span className="text-emerald-400">✓</span>
                <span>Bewerbungsmappe Studio</span>
              </div>
            </div>
          </div>
        </section>


        {/* ========================================================= */}
        {/* 2. CORE PILLARS & FEATURE SHOWCASE */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              {isAr ? "الأدوات المتطورة للتوظيف" : isDe ? "Leistungsstarke Tools" : "Cutting-Edge Career Tools"}
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              {isAr
                ? "4 ركائز متكاملة تضمن تفوق ملفك الوظيفي"
                : isDe
                ? "4 Kernmodule für Ihren Bewerbungserfolg"
                : "4 Core Pillars for Your Job Application Success"}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              {isAr
                ? "صُممت خصيصاً لتجاوز أصعب فلاتر التوظيف الألمانية وجذب اهتمام مدراء الموارد البشرية."
                : isDe
                ? "Entwickelt, um deutsche ATS-Filter zu passieren und Personaler vom ersten Moment an zu überzeugen."
                : "Designed specifically to beat strict German ATS algorithms and impress HR managers."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pillar 1: German CV Converter & DIN 5008 Builder */}
            <div className="relative group overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 p-8 transition-all shadow-xl hover:shadow-blue-500/10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📄
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    {isAr
                      ? "1. محوّل ومنشئ السيرة الذاتية الألمانية (DIN 5008)"
                      : isDe
                      ? "1. Konverter & DIN 5008 Lebenslauf-Generator"
                      : "1. German CV Converter & DIN 5008 Builder"}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {isAr
                      ? "ارفع سيرتك الذاتية الحالية (PDF) بأي لغة، ليقوم النظام فوراً بتكييفها وصياغة خبراتك بالأسلوب الاسمي الألماني (Substantivstil) واستخراج وثيقة رسمية متوافقة 100% مع معايير DIN 5008."
                      : isDe
                      ? "Laden Sie Ihren aktuellen Lebenslauf (PDF) in beliebiger Sprache hoch. Das System passt ihn sofort an, formuliert Ihre Erfahrungen im deutschen Substantivstil und erstellt ein 100% DIN 5008 konformes offizielles Dokument."
                      : "Upload your current resume (PDF) in any language. The system instantly adapts it, crafts your experience in German Substantivstil, and generates an official document 100% compliant with DIN 5008 standards."}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5">
                <div className="flex items-center justify-between text-blue-400 font-bold text-[11px]">
                  <span>Substantivstil Output:</span>
                  <span>✓ 100% DIN 5008</span>
                </div>
                <div className="text-slate-400">
                  • Konzeption und Implementierung robuster RESTful Microservices
                </div>
                <div className="text-slate-400">
                  • Optimierung der Datenbankabfragen (Reduzierung der Latenz um 35%)
                </div>
              </div>
            </div>

            {/* Pillar 2: AI Anschreiben Generator */}
            <div className="relative group overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 p-8 transition-all shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  ✍️
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {isAr
                      ? "2. مولد خطاب الدافع المخصص (Anschreiben)"
                      : isDe
                      ? "2. KI-Anschreiben Generator"
                      : "2. AI Cover Letter Generator (Anschreiben)"}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {isAr
                      ? "أدخل رابط أو نص أي إعلان وظيفي في ألمانيا، ليقوم النظام بتوليد خطاب دافع ألماني فصيح يربط مهاراتك وخبراتك بمتطلبات صاحب العمل مع ترويسة رسمية مطابقة للمواصفات."
                      : isDe
                      ? "Fügen Sie eine Stellenanzeige ein. Die KI verfasst ein maßgeschneidertes, überzeugendes deutsches Anschreiben mit vollständigem DIN 5008 Briefkopf."
                      : "Paste any German job description. The AI crafts a tailored, persuasive formal German cover letter matching employer requirements with complete DIN 5008 letterhead."}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5">
                <div className="flex items-center justify-between text-indigo-400 font-bold text-[11px]">
                  <span>DIN 5008 Anschreiben:</span>
                  <span>✓ Formal German</span>
                </div>
                <div className="text-slate-400">
                  Sehr geehrte Damen und Herren, mit großem Interesse habe ich Ihre Ausschreibung...
                </div>
              </div>
            </div>

            {/* Pillar 3: ATS Audit & CEFR Mapping */}
            <div className="relative group overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 p-8 transition-all shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🎯
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {isAr
                      ? "3. فاحص التوافق مع أنظمة التوظيف (German ATS Check)"
                      : isDe
                      ? "3. Deutscher ATS-Check & GeR-Sprachlevel"
                      : "3. German ATS Audit Engine & CEFR Alignment"}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {isAr
                      ? "فحص دقيق لكثافة الكلمات المفتاحية، ومطابقة مستويات اللغات وفق الإطار الأوروبي CEFR (A1-C2)، واكتشاف أي ثغرات زمنية أو تنسيقات قد تؤدي لرفض سيرتك تلقائياً."
                      : isDe
                      ? "Präzise Überprüfung der Keyword-Dichte, Einstufung der Sprachkompetenzen nach GeR (A1-C2) und Erkennung von Lücken vor der Bewerbung."
                      : "Instant audit of keyword density, CEFR language levels (A1 to C2), and structural gap detection to prevent automated ATS rejections."}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <span className="text-lg">98%</span>
                  <span>ATS Match Score</span>
                </div>
                <span className="text-slate-500 text-[11px]">CEFR: C1 Verhandlungssicher</span>
              </div>
            </div>

            {/* Pillar 4: Complete Dossier Studio (Bewerbungsmappe) */}
            <div className="relative group overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 p-8 transition-all shadow-xl hover:shadow-blue-500/10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📑
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    {isAr
                      ? "4. استوديو الملف المتكامل (Bewerbungsmappe)"
                      : isDe
                      ? "4. Vollständige Bewerbungsmappe"
                      : "4. Complete Dossier Studio (Bewerbungsmappe)"}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {isAr
                      ? "اجمع صفحة الغلاف الفاخرة (Deckblatt) مع خطاب الدافع (Anschreiben) والسيرة الذاتية (Lebenslauf) في ملف PDF احترافي واحد موحد بتنسيق جذاب."
                      : isDe
                      ? "Kombinieren Sie Deckblatt mit Bewerbungsfoto, Anschreiben und Lebenslauf zu einer druckreifen, eleganten PDF-Bewerbungsmappe."
                      : "Compile a polished Cover Page with photo (Deckblatt), Cover Letter, and Tabular Resume into a unified multi-page German application dossier."}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <span className="font-bold text-blue-400">PDF Compiler:</span>
                <span className="text-slate-400">Deckblatt + Anschreiben + Lebenslauf</span>
              </div>
            </div>
          </div>
        </section>


        {/* ========================================================= */}
        {/* 3. VISUAL COMPARISON CARD (BEFORE VS AFTER) */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-12 space-y-10 shadow-2xl">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-4xl font-black text-white">
                {isAr
                  ? "لماذا تُرفض 80% من طلبات التوظيف الأجنبية؟"
                  : isDe
                  ? "Warum 80% ausländischer Bewerbungen scheitern"
                  : "Why 80% of Foreign Applications Get Rejected"}
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                {isAr
                  ? "مقارنة حقيقية توضح الفارق بين السيرة الذاتية التقليدية وملف الترشيح المعتمد بمعيار DIN 5008."
                  : isDe
                  ? "Der entscheidende Unterschied zwischen einem Standard-Lebenslauf und einer DIN 5008 Bewerbung."
                  : "A side-by-side breakdown between a generic resume and a compliant DIN 5008 German dossier."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Before / Rejected */}
              <div className="rounded-2xl bg-rose-950/20 border border-rose-500/30 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs">
                    ❌ {isAr ? "سيرة عادية / مرفوضة" : isDe ? "Standard-CV / Abgelehnt" : "Generic CV / Rejected"}
                  </span>
                  <span className="text-rose-400 font-mono text-xs font-bold">~80% Rejection Rate</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-400 font-bold mt-0.5">✕</span>
                    <span>{isAr ? "ترجمة حرفية ركيكة وصياغة سلبية للمهام الوظيفية." : "Literal translations lacking German active action nouns."}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-400 font-bold mt-0.5">✕</span>
                    <span>{isAr ? "تنسيق عشوائي غير متطابق مع معيار DIN 5008 يفشل في فلاتر ATS." : "Unstructured timeline causing ATS parsing errors."}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-400 font-bold mt-0.5">✕</span>
                    <span>{isAr ? "غياب المستويات الأوروبية المحددة للغات (A1-C2)." : "Missing CEFR language proficiency standards."}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-400 font-bold mt-0.5">✕</span>
                    <span>{isAr ? "تقديم سيرة منفصلة بدون خطاب دافع (Anschreiben) أو غلاف (Deckblatt)." : "No cover letter (Anschreiben) or cover page (Deckblatt)."}</span>
                  </li>
                </ul>
              </div>

              {/* After / Accepted */}
              <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/30 p-6 space-y-5 shadow-lg shadow-emerald-500/5">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs">
                    ✅ {isAr ? "ملف GermanJobsPro المعتمد" : isDe ? "GermanJobsPro DIN 5008" : "GermanJobsPro DIN 5008"}
                  </span>
                  <span className="text-emerald-400 font-mono text-xs font-bold">Top 5% Interview Callback</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span>{isAr ? "صياغة احترافية بأسلوب الأسماء الفعلية الألمانية (Substantivstil)." : "Flawless German Substantivstil action-oriented formulations."}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span>{isAr ? "تنسيق جدولي قياسي 100% متوافق مع DIN 5008 وأنظمة ATS." : "100% DIN 5008 standard tabular structure passing all ATS."}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span>{isAr ? "تحديد دقيق لمستويات اللغات الأوروبية (Muttersprache, C1, B2)." : "Official CEFR language framework mapping (A1 to C2)."}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span>{isAr ? "حزمة ترشيح متكاملة (Deckblatt + Anschreiben + Lebenslauf)." : "Complete Bewerbungsmappe (Cover page, letter, and resume)."}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>


        {/* ========================================================= */}
        {/* 4. 3-STEP "HOW IT WORKS" WALKTHROUGH */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              {isAr ? "كيف تعمل المنصة" : isDe ? "So funktioniert's" : "How It Works"}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              {isAr
                ? "3 خطوات بسيطة للحصول على ملف ترشيح ألماني متكامل"
                : isDe
                ? "In 3 einfachen Schritten zum perfekten Bewerbungspaket"
                : "3 Simple Steps to Your Complete German Application"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-black text-lg flex items-center justify-center">
                01
              </div>
              <h3 className="text-xl font-bold text-white">
                {isAr ? "1. تحويل فوري (1-Click PDF)" : isDe ? "1. Sofort-Konvertierung (1-Klick PDF)" : "1. Instant Conversion (1-Click PDF)"}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {isAr
                  ? "ارفع سيرتك الذاتية الحالية (PDF) بأي لغة، ليقوم النظام فوراً بتكييفها وصياغة خبراتك وفق معايير DIN 5008."
                  : isDe
                  ? "Laden Sie Ihr bestehendes PDF hoch oder starten Sie neu. Die Daten werden sofort analysiert und angepasst."
                  : "Upload your current PDF resume or start fresh. The system instantly extracts and adapts your background to DIN 5008."}
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-black text-lg flex items-center justify-center">
                02
              </div>
              <h3 className="text-xl font-bold text-white">
                {isAr ? "2. التخصيص والصياغة الذكية" : isDe ? "2. KI-Optimierung" : "2. AI Polish & Substantivstil"}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {isAr
                  ? "حدد الوظيفة المستهدفة ليتم تحسين الصياغة إلى Substantivstil وتوليد خطاب الدافع (Anschreiben) المطابق."
                  : isDe
                  ? "Wählen Sie Ihre Zielposition. Die KI optimiert Ihre Formulierungen und erstellt das Anschreiben."
                  : "Choose your target role. AI polishes all experience bullets in Substantivstil and drafts the cover letter."}
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-black text-lg flex items-center justify-center">
                03
              </div>
              <h3 className="text-xl font-bold text-white">
                {isAr ? "3. التنزيل والتقديم المباشر" : isDe ? "3. Herunterladen & Bewerben" : "3. Download & Apply"}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {isAr
                  ? "حمّل ملف PDF الرسمي المتوافق مع DIN 5008 وتصفح آلاف الوظائف الشاغرة في ألمانيا للتقديم الفوري."
                  : isDe
                  ? "Laden Sie Ihr DIN 5008 PDF herunter und bewerben Sie sich direkt auf aktuelle Jobs."
                  : "Download your certified DIN 5008 PDF dossier and apply directly to verified German job vacancies."}
              </p>
            </div>
          </div>
        </section>


        {/* ========================================================= */}
        {/* 5. LATEST JOBS & BLOG INSIGHTS PREVIEW */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Latest Jobs */}
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase">
                  <span>💼</span>
                  <span>{isAr ? "فرص عمل حصرية في ألمانيا" : isDe ? "Aktuelle Stellenangebote" : "Verified Jobs in Germany"}</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white">
                  {isAr ? "أحدث الوظائف المنشورة اليوم" : isDe ? "Neueste Stellenanzeigen" : "Latest Job Vacancies"}
                </h2>
              </div>
              <Link
                href={`/${locale}/jobs`}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>{isAr ? "عرض جميع الوظائف" : isDe ? "Alle Jobs ansehen" : "View all jobs"}</span>
                <span>←</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-6 flex flex-col justify-between space-y-6 transition-all shadow-xl group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold">
                        {job.category}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {job.jobType || "Full-time"}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                        {job.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        {job.company} • {job.city || "Deutschland"}
                      </p>
                    </div>
                    {job.salary && (
                      <p className="text-xs text-emerald-400 font-semibold font-mono">
                        💶 {job.salary}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {isAr ? "اللغة:" : "Language:"} {job.languageReq || "B1/B2"}
                    </span>
                    <Link
                      href={`/${locale}/jobs`}
                      className="px-4 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 text-xs font-bold transition-all"
                    >
                      {isAr ? "تقديم مباشر" : isDe ? "Bewerben" : "Apply"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Latest Blog Articles */}
          {latestPosts.length > 0 && (
            <div className="space-y-8 pt-6 border-t border-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase">
                    <span>📚</span>
                    <span>{isAr ? "دليل العمل والهجرة لألمانيا" : isDe ? "Ratgeber & Karriere-Guides" : "Career Guides & Visa Insights"}</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black text-white">
                    {isAr ? "أحدث المقالات والإرشادات المهنية" : isDe ? "Neueste Ratgeber-Artikel" : "Latest Articles & Guides"}
                  </h2>
                </div>
                <Link
                  href={`/${locale}/blog`}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <span>{isAr ? "تصفح جميع المقالات" : isDe ? "Alle Artikel lesen" : "View all articles"}</span>
                  <span>←</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {latestPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/${locale}/blog/${post.slug}`}
                    className="rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-6 flex flex-col justify-between space-y-4 transition-all shadow-xl group"
                  >
                    <div className="space-y-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold inline-block">
                        {post.category}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {post.markdown_content?.replace(/[#*`>_\-]/g, "").substring(0, 140)}...
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
                      <span>{new Date(post.createdAt).toLocaleDateString(locale)}</span>
                      <span className="text-blue-400 font-bold group-hover:underline">
                        {isAr ? "اقرأ المزيد ←" : isDe ? "Weiterlesen ←" : "Read more ←"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>


        {/* ========================================================= */}
        {/* 6. GERMAN A1 LEARNING SHOWCASE SECTION */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Main Showcase Hero Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/70 to-slate-900 border border-blue-500/30 p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
            <div className="absolute top-0 end-0 -me-16 -mt-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-black uppercase tracking-wider">
                  <span>🇩🇪</span>
                  <span>{isAr ? "مسار تعلم الألمانية للمبتدئين A1" : isDe ? "Deutsch A1 Lernpfad für Einsteiger" : "German A1 Beginner Learning Track"}</span>
                </div>
                
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  {isAr
                    ? "تعلّم الألمانية من الصفر حتى اجتياز امتحان Goethe A1 بنجاح"
                    : isDe
                    ? "Deutsch lernen von Null bis zum Goethe-Zertifikat A1"
                    : "Master German from Scratch to Your Official Goethe A1 Certificate"}
                </h2>
                
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {isAr
                    ? "منهاج تدريبي مبسط للناطقين بالعربية والفرنسية، يركز على المحادثات اليومية ومفردات سوق العمل الألمانية لتمكينك من اجتياز المقابلات والاندماج المهني."
                    : isDe
                    ? "Strukturierter Sprachkurs mit Fokus auf berufsbezogenen Wortschatz und sichere Alltagskommunikation."
                    : "Comprehensive beginner curriculum tailored for fast-track communication, workplace vocabulary, and visa exam success."}
                </p>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <Link
                  href={`/${locale}/blog?category=German+A1`}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm sm:text-base shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 border border-blue-400/30"
                >
                  <span>🚀</span>
                  <span>{isAr ? "ابدأ التعلم الآن" : isDe ? "Jetzt Deutsch lernen" : "Start Learning Now"}</span>
                </Link>
                <Link
                  href={`/${locale}/blog?category=German+A1`}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <span>📚</span>
                  <span>{isAr ? "تصفح الفهرس الشامل" : isDe ? "Alle Lektionen" : "Browse All Lessons"}</span>
                </Link>
              </div>
            </div>

            {/* 3 Key Value Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 mt-10 border-t border-slate-800/80">
              {/* Value Point 1 */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3 hover:border-slate-700 transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-lg">
                  📖
                </div>
                <h3 className="text-base font-bold text-white">
                  {isAr ? "200 درس ومفردة مبسطة" : isDe ? "200 strukturierte Lektionen" : "200 Micro-Lessons"}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isAr
                    ? "شرح مبسط لقواعد الأبجدية، تصريف الأفعال الأساسية (Sein & Haben)، وتركيب الجمل للمبتدئين خطوة بخطوة."
                    : isDe
                    ? "Schritt-für-Schritt Grammatik, Verbtabellen und einfache Satzstrukturen."
                    : "Bite-sized grammar breakdowns, essential verb conjugations, and sentence patterns."}
                </p>
              </div>

              {/* Value Point 2 */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3 hover:border-slate-700 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-lg">
                  💼
                </div>
                <h3 className="text-base font-bold text-white">
                  {isAr ? "مصطلحات سوق العمل ومحادثات المقابلات" : isDe ? "Berufs- & Interviewwortschatz" : "Workplace & Interview Vocab"}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isAr
                    ? "مفردات موجهة خصيصاً للتواصل مع المشرفين، الزملاء، وفهم إعلانات عقود العمل والـ Ausbildung."
                    : isDe
                    ? "Praxisnahe Fachbegriffe für Vorstellungsgespräche und den deutschen Arbeitsalltag."
                    : "Targeted vocabulary for job applications, contracts, and everyday office communication."}
                </p>
              </div>

              {/* Value Point 3 */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3 hover:border-slate-700 transition-all">
                <div className="w-10 h-10 rounded-xl bg-amber-600/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-lg">
                  ⚡
                </div>
                <h3 className="text-base font-bold text-white">
                  {isAr ? "متاح مجاناً 100% للجميع" : isDe ? "100% Kostenlos & Ohne Abo" : "100% Free & Open Access"}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isAr
                    ? "وصول مجاني كامل لكافة الدروس والأمثلة الصوتية بدون اشتراك لمساعدتك في بناء مستقبلك في ألمانيا."
                    : isDe
                    ? "Freier Zugang zu allen Materialien, Übungen und Goethe-A1 Vorbereitungen."
                    : "No paywalls or subscriptions. Free access to all lessons and exam preparation resources."}
                </p>
              </div>
            </div>
          </div>

          {/* Latest 3 German A1 Posts Grid */}
          {germanA1Posts.length > 0 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    {isAr ? "دروس مختارة من مسار A1" : isDe ? "Ausgewählte A1 Lektionen" : "Featured A1 Lessons"}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                    {isAr ? "أحدث الدروس التدريبية المتاحة الآن" : isDe ? "Neueste Deutsch A1 Lektionen" : "Latest German A1 Lessons"}
                  </h3>
                </div>
                <Link
                  href={`/${locale}/blog?category=German+A1`}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <span>{isAr ? "عرض كل دروس A1" : isDe ? "Alle A1 Lektionen ansehen" : "View all A1 lessons"}</span>
                  <span>←</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {germanA1Posts.slice(0, 3).map((post, idx) => (
                  <Link
                    key={post.id}
                    href={`/${locale}/blog/${post.slug}`}
                    className="rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 p-6 flex flex-col justify-between space-y-4 transition-all shadow-xl hover:shadow-blue-500/5 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs font-bold inline-flex items-center gap-1">
                          <span>🇩🇪</span>
                          <span>{post.category}</span>
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {isAr ? `درس #${idx + 1}` : `Lesson #${idx + 1}`}
                        </span>
                      </div>

                      <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                        {post.title}
                      </h4>

                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {post.markdown_content?.replace(/[#*`>_\-]/g, "").substring(0, 140)}...
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400">
                        <span>⏱️</span>
                        <span>{isAr ? "5 دقائق قراءة" : isDe ? "5 Min. Lesezeit" : "5 min read"}</span>
                      </span>
                      <span className="text-blue-400 font-bold group-hover:underline flex items-center gap-1">
                        <span>{isAr ? "ابدأ الدرس" : isDe ? "Lektion starten" : "Start Lesson"}</span>
                        <span>←</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>


        {/* ========================================================= */}
        {/* 6. FAQ ACCORDION SECTION */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              {isAr ? "الأسئلة الشائعة" : isDe ? "Häufige Fragen" : "Frequently Asked Questions"}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              {isAr
                ? "كل ما تود معرفته عن التقديم والمعايير الألمانية"
                : isDe
                ? "Alles, was Sie über deutsche Bewerbungsstandards wissen müssen"
                : "Everything You Need to Know About German Application Standards"}
            </h2>
          </div>

          <LandingFaqAccordion items={faqItems} />
        </section>


        {/* ========================================================= */}
        {/* 7. FINAL HIGH-CONVERSION CTA BANNER */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-500/40 p-8 sm:p-16 text-center space-y-8 shadow-2xl shadow-blue-950/50">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-emerald-600/10 pointer-events-none" />
            
            <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {isAr
                  ? "ابدأ خطوتك الأولى نحو مستقبلك المهني في ألمانيا اليوم 🇩🇪"
                  : isDe
                  ? "Starten Sie Ihre Karriere in Deutschland noch heute 🇩🇪"
                  : "Take Your First Step Toward a Career in Germany Today 🇩🇪"}
              </h2>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                {isAr
                  ? "انضم إلى آلاف المهنيين الذين أنشأوا ملفات ترشيح ألمانية متكاملة واجتازوا فلاتر ATS بنجاح."
                  : isDe
                  ? "Erstellen Sie Ihr professionelles DIN 5008 Bewerbungspaket und überzeugen Sie deutsche Arbeitgeber."
                  : "Join thousands of candidates who generated certified DIN 5008 dossiers and landed German interviews."}
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={bottomCtaHref}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-base shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>{bottomCtaText}</span>
              </Link>

              <Link
                href={bottomSecHref}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-base border border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <span>💳</span>
                <span>{user ? (isAr ? "ترقية الحساب (PRO Pass)" : "Upgrade to PRO Pass") : (isAr ? "عرض باقات الاشتراك وPro" : isDe ? "Preise & Tarife" : "View Pricing & Pro")}</span>
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer locale={locale} />
    </div>
  );
}
