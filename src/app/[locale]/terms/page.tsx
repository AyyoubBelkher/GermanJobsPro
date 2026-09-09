import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { getUserSession } from "@/lib/user-session";

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
      ? "شروط الاستخدام والامتثال القانوني ⚖️ | GermanJobsPro 🇩🇪"
      : isDe
      ? "Nutzungsbedingungen (AGB) ⚖️ | GermanJobsPro 🇩🇪"
      : "Terms of Service & Legal Terms ⚖️ | GermanJobsPro 🇩🇪",
    description: isAr
      ? "شروط الاستخدام والامتثال القانوني لمنصة GermanJobsPro. منصة برمجية وأدوات ذكاء اصطناعي لتنسيق السير الذاتية DIN 5008 وإعداد ملفات الترشيح للعمل في ألمانيا."
      : "Nutzungsbedingungen der GermanJobsPro Plattform für DIN 5008 Bewerbungsunterlagen und KI-gestützte Dokumentenerstellung.",
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const dir = isAr ? "rtl" : "ltr";

  const authResult = await getUserSession();
  const user = authResult ? authResult.user : null;

  return (
    <div
      dir={dir}
      className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white"
    >
      <Navbar locale={locale} initialUser={user} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full flex-1 space-y-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Link href={`/${locale}`} className="hover:text-blue-400 transition-colors">
            {isAr ? "الرئيسية" : isDe ? "Startseite" : "Home"}
          </Link>
          <span>/</span>
          <span className="text-slate-200">
            {isAr ? "شروط الاستخدام والامتثال" : isDe ? "Nutzungsbedingungen" : "Terms of Service"}
          </span>
        </div>

        {/* Header Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <span>⚖️</span>
            <span>{isAr ? "الوثيقة القانونية الرسمية" : isDe ? "Rechtliche Hinweise" : "Official Legal Notice"}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {isAr
              ? "شروط الاستخدام وسياسة الخدمة"
              : isDe
              ? "Allgemeine Nutzungsbedingungen (AGB)"
              : "Terms of Service & Usage Policy"}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? "تحكم هذه الشروط استخدامك لمنصة GermanJobsPro، ومولدات السير الذاتية DIN 5008، وأدوات الذكاء الاصطناعي لتحضير ملفات الترشيح للعمل في ألمانيا."
              : isDe
              ? "Diese Bedingungen regeln die Nutzung der Plattform GermanJobsPro, der DIN 5008 Generatoren und der KI-Werkzeuge zur Erstellung von Bewerbungsunterlagen."
              : "These terms govern your access to GermanJobsPro, our DIN 5008 resume generators, and AI career dossier tools for the German job market."}
          </p>

          <p className="text-xs text-slate-400 font-mono">
            {isAr ? "آخر تحديث: 9 سبتمبر 2026" : isDe ? "Stand: 9. September 2026" : "Last updated: September 9, 2026"}
          </p>
        </div>

        {/* CRITICAL LEGAL DISCLAIMER CALLOUT BOX */}
        <div className="rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 p-6 sm:p-8 space-y-4 text-amber-200 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-lg sm:text-xl font-black text-amber-300">
              {isAr
                ? "إشعار قانوني صريح وإخلاء مسؤولية توظيف وهجرة"
                : isDe
                ? "Wichtiger rechtlicher Hinweis: Keine Arbeitsvermittlung & keine Einwanderungsberatung"
                : "Crucial Legal Disclaimer: Software Tool Only (No Immigration/Recruitment Agency)"}
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed">
            {isAr ? (
              <>
                <p>
                  <strong>منصة GermanJobsPro هي أداة برمجية وتقنية مساعدة فقط:</strong> تقدم المنصة برمجيات ذكية لتنسيق وصياغة المستندات المهنية طبقاً للمعيار الألماني الرسمي (DIN 5008)، وتوليد مسودات خطابات الدافع (Anschreiben) بالذكاء الاصطناعي، وفحص التوافق مع أنظمة فرز السير الذاتية (ATS)، وتجميع ملف الترشيح (Bewerbungsmappe)، وتجميع إعلانات الوظائف المتاحة علناً في ألمانيا.
                </p>
                <p>
                  <strong>ما لا تقدمه المنصة إطلاقاً:</strong> منصة GermanJobsPro <u>ليست وكالة توظيف أو مكتب وساطة عمالية مرخص</u> (Keine Arbeitsvermittlung)، و<u>لا تقدم استشارات قانونية أو استشارات هجرة وتأشيرات</u>.
                </p>
                <p>
                  <strong>عدم ضمان النتائج قانونياً:</strong> لا تضمن المنصة بأي شكل من الأشكال، صراحة أو ضمناً، الحصول على وظيفة، أو توقيع عقد عمل، أو تلقي دعوة لمقابلة، أو الحصول على تأشيرة عمل أو بطاقة الفرصة (Chancenkarte). تقع كافة قرارات التوظيف ومنح التأشيرات حصرياً على عاتق أصحاب العمل والجهات الحكومية الألمانية الرسمية (السفارات والقنصليات، مكاتب الأجانب Ausländerbehörde، ووكالة العمل الفيدرالية Bundesagentur für Arbeit).
                </p>
              </>
            ) : isDe ? (
              <>
                <p>
                  <strong>GermanJobsPro ist ein reines Software- und Assistenz-Tool:</strong> Die Plattform stellt Softwarefunktionen zur Formatierung von Bewerbungsunterlagen gemäß DIN 5008, zur KI-gestützten Entwurfserstellung von Anschreiben, zum ATS-Lebenslauf-Check sowie zur Aggregation öffentlich zugänglicher Stellenangebote bereit.
                </p>
                <p>
                  <strong>Keine Arbeitsvermittlung & keine Rechtsberatung:</strong> GermanJobsPro ist <u>weder eine Arbeitsvermittlungsagentur noch eine Kanzlei für Einwanderungs- oder Rechtsberatung</u>. Wir vermitteln weder Arbeitnehmer noch erteilen wir rechtsverbindliche Ratschläge zu Visa- oder Aufenthaltsfragen.
                </p>
                <p>
                  <strong>Keine Erfolgs- oder Visumsgarantie:</strong> GermanJobsPro übernimmt keine Garantie oder Haftung für das Zustandekommen von Vorstellungsgesprächen, Arbeitsverträgen oder die Erteilung von Visa bzw. der Chancenkarte. Diese Entscheidungen obliegen ausschließlich den jeweiligen Arbeitgebern und deutschen Behörden (Ausländerbehörden, Bundesagentur für Arbeit, diplomatische Vertretungen).
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>GermanJobsPro is strictly a software and document formatting tool:</strong> The platform provides software tools to format career documents according to the German DIN 5008 standard, draft AI-assisted cover letters, run ATS compatibility audits, compile job application dossiers (Bewerbungsmappe), and aggregate publicly available jobs in Germany.
                </p>
                <p>
                  <strong>No Employment Agency & No Legal/Immigration Services:</strong> GermanJobsPro is <u>not a licensed employment agency, recruiter, immigration consultancy, or law firm</u>. We do not act as an intermediary between applicants and employers.
                </p>
                <p>
                  <strong>No Guarantees of Employment or Visas:</strong> GermanJobsPro does not guarantee or warrant that any user will receive job interviews, employment contracts, work permits, or visa approvals (such as the Opportunity Card / Chancenkarte). All hiring and visa decisions remain strictly within the discretion of prospective employers and German governmental authorities (Federal Employment Agency, Foreigners’ Registration Offices, and Embassies).
                </p>
              </>
            )}
          </div>
        </div>

        {/* Detailed Terms Sections */}
        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          
          {/* Section 1 */}
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-blue-400">1.</span>
              <span>{isAr ? "قبول الشروط وهوية المشغل" : isDe ? "Geltungsbereich & Anbieterkennzeichnung" : "Acceptance of Terms & Operator Identity"}</span>
            </h3>
            <p>
              {isAr
                ? "باستخدامك لمنصة GermanJobsPro أو إنشائك لحساب، فإنك توافق على الالتزام الكامل بهذه الشروط وكافة السياسات الملحقة بها. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام المنصة. يتم تشغيل المنصة بواسطة فريق GermanJobsPro، وللتواصل الرسمي: support@germanjobspro.com."
                : isDe
                ? "Mit der Nutzung von GermanJobsPro oder der Registrierung eines Kontos erklären Sie sich mit diesen Nutzungsbedingungen einverstanden. Die Plattform wird durch GermanJobsPro betrieben. Offizieller Kontakt: support@germanjobspro.com."
                : "By accessing or using GermanJobsPro, you agree to be bound by these Terms of Service. If you do not agree to all terms, do not access or use the platform. The platform is operated by GermanJobsPro. Official contact: support@germanjobspro.com."}
            </p>
          </section>

          {/* Section 2 */}
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-blue-400">2.</span>
              <span>{isAr ? "حسابات المستخدمين وصحة البيانات المدخلة" : isDe ? "Nutzerkonto & Richtigkeit der Angaben" : "User Accounts & Accuracy of Information"}</span>
            </h3>
            <p>
              {isAr
                ? "يتحمل المستخدم وحده المسؤولية الكاملة عن صحة ودقة ومصداقية كافة البيانات والشهادات والخبرات التي يدخلها في مولدات السير الذاتية أو يرفقها في ملف الترشيح. يحظر تماماً تزوير المؤهلات أو انتحال الشخصيات. يلتزم المستخدم بالحفاظ على سرية بيانات تسجيل الدخول الخاصة به."
                : isDe
                ? "Der Nutzer ist allein verantwortlich für die Richtigkeit, Wahrhaftigkeit und Vollständigkeit der in Lebensläufen und Bewerbungsunterlagen gemachten Angaben. Die Angabe falscher Qualifikationen oder gefälschter Zeugnisse ist strengstens untersagt. Der Nutzer hat seine Zugangsdaten vertraulich zu behandeln."
                : "Users bear sole responsibility for the truthfulness, accuracy, and completeness of all professional information, qualifications, and employment history entered into the resume builder. Forging credentials or misrepresenting qualifications is strictly prohibited. Users must safeguard their login credentials."}
            </p>
          </section>

          {/* Section 3 */}
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-blue-400">3.</span>
              <span>{isAr ? "باقات الاشتراك، التسعير، والمدفوعات" : isDe ? "Tarife, Preise & Zahlungsabwicklung" : "Pricing, Plans & Payments"}</span>
            </h3>
            <div className="space-y-2">
              <p>
                {isAr
                  ? "توفر المنصة باقة مجانية للبدء وباقة للمحترفين PRO Pass بسعر 9.99 دولار أمريكي ($9.99 USD) تمنح صلاحية استخدام لمدة 90 يوماً متواصلة (دورة التقديم الكاملة) بدون أي اشتراكات دورية تلقائية غير مرغوب فيها أو رسوم مخفية."
                  : isDe
                  ? "GermanJobsPro bietet einen kostenlosen Starter-Tarif sowie den PRO Pass für einmalig 9,99 USD an, gültig für 90 Tage (voller Bewerbungszyklus) ohne automatische Verlängerung oder versteckte Zusatzkosten."
                  : "GermanJobsPro offers a free starter tier and a PRO Pass priced at $9.99 USD, providing full premium access for 90 consecutive days (a standard job application cycle) with no recurring hidden fees or unwanted auto-billing."}
              </p>
              <p>
                {isAr
                  ? "تتم جميع المعاملات المالية بالدولار الأمريكي ($) عبر بوابات الدفع العالمية المعتمدة والمتوافقة مع معايير PCI-DSS وأمان المعاملات المصرفية. لتفاصيل الاسترجاع، راجع سياسة الاسترجاع المخصصة."
                  : isDe
                  ? "Alle Zahlungen erfolgen in US-Dollar ($) über zertifizierte, PCI-DSS-konforme Zahlungsdienstleister. Einzelheiten entnehmen Sie unserer Rückerstattungsrichtlinie."
                  : "All transactions are billed in USD ($) via certified, PCI-DSS-compliant global payment processors. For return terms, consult our dedicated Refund Policy."}
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-blue-400">4.</span>
              <span>{isAr ? "سياسة الاستخدام العادل وأدوات الذكاء الاصطناعي" : isDe ? "Fair-Use-Richtlinie & KI-Generierung" : "Fair Use Policy & AI Capabilities"}</span>
            </h3>
            <p>
              {isAr
                ? "تخضع ميزات الذكاء الاصطناعي (مثل توليد خطابات الدافع وتحسين النقاط وفحص ATS) لسياسة الاستخدام العادل (Fair Use Quotas، وتصل إلى 20 طلباً يومياً لباقة PRO) لضمان استقرار الخوادم وجودة الاستجابة لجميع المستخدمين ومنع الاستخدام الآلي العشوائي (Bots & Scraping)."
                : isDe
                ? "Die Nutzung unserer KI-Dienste (wie Anschreiben-Generierung und ATS-Audits) unterliegt einer Fair-Use-Obergrenze (bis zu 20 Anfragen täglich im PRO Pass), um Serverstabilität, faire Ressourcenverteilung und Schutz vor Missbrauch zu gewährleisten."
                : "AI generation features (including job-tailored cover letters and ATS checks) are subject to fair-use quotas (up to 20 daily requests for PRO Pass holders) to ensure platform stability, prevent automated scraping, and maintain fast response times for all users."}
            </p>
          </section>

          {/* Section 5 */}
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-blue-400">5.</span>
              <span>{isAr ? "الملكية الفكرية" : isDe ? "Urheberrecht & Geistiges Eigentum" : "Intellectual Property"}</span>
            </h3>
            <p>
              {isAr
                ? "تظل المنصة وتصاميم النماذج البرمجية وخوارزميات التنسيق DIN 5008 ملكية حصرية لـ GermanJobsPro. في المقابل، يحتفظ المستخدم بملكية كافة البيانات الشخصية والنصوص والخبرات التي يقوم بإدخالها وتوليدها لنفسه."
                : isDe
                ? "Alle Software-Komponenten, Benutzeroberflächen und Design-Vorlagen verbleiben im geistigen Eigentum von GermanJobsPro. Der Nutzer behält die uneingeschränkten Rechte an seinen eigenen persönlichen Daten und erstellten Dokumenteninhalten."
                : "All platform software, user interface designs, and DIN 5008 rendering templates remain the intellectual property of GermanJobsPro. Users retain full ownership of their personal data and generated resume content."}
            </p>
          </section>

          {/* Section 6 */}
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-blue-400">6.</span>
              <span>{isAr ? "حدود المسؤولية والتعديلات" : isDe ? "Haftungsbeschränkung & Änderungen" : "Limitation of Liability & Modifications"}</span>
            </h3>
            <p>
              {isAr
                ? "يتم تقديم الخدمات البرمجية 'كما هي' وبحسب توفرها دون ضمانات خلوها التام من الانقطاعات التقنية العارضة. نحتفظ بالحق في تحديث هذه الشروط عند الحاجة التنظيمية أو التقنية، ويُعتبر استمرار استخدام المنصة بعد نشر التعديلات موافقة صريحة عليها."
                : isDe
                ? "Die Dienste werden ohne Mängelgewähr und nach Verfügbarkeit bereitgestellt. GermanJobsPro behält sich vor, diese Bedingungen bei sachlichem Anlass zu ändern. Die fortgesetzte Nutzung gilt als Annahme der geänderten Bedingungen."
                : "Services are provided on an 'as is' and 'as available' basis. GermanJobsPro reserves the right to modify these terms at any time. Continued use of the platform after updates constitutes acceptance of the modified terms."}
            </p>
          </section>

          {/* Section 7 */}
          <section className="p-6 sm:p-8 rounded-3xl bg-blue-950/40 border border-blue-500/20 space-y-3 text-center">
            <h3 className="text-base sm:text-lg font-bold text-white">
              {isAr ? "للتواصل والدعم القانوني" : isDe ? "Kontakt für rechtliche Fragen" : "Legal Contact & Inquiries"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              {isAr
                ? "إذا كان لديك أي سؤال يتعلق بشروط الاستخدام أو الالتزامات القانونية، يمكنك التواصل مباشرة مع فريقنا عبر البريد الإلكتروني الرسمي:"
                : isDe
                ? "Für Fragen zu unseren Nutzungsbedingungen kontaktieren Sie uns bitte unter:"
                : "For any legal inquiries regarding our terms, please contact our team directly at:"}
            </p>
            <a
              href="mailto:support@germanjobspro.com"
              className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition-all shadow-md"
            >
              support@germanjobspro.com
            </a>
          </section>

        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
