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
  const isFr = locale === "fr";

  const title = isAr
    ? "بيانات المنصة القانونية (Impressum) § 5 DDG | GermanJobsPro 🇩🇪"
    : isDe
    ? "Impressum (§ 5 DDG & § 18 MStV) | GermanJobsPro 🇩🇪"
    : isFr
    ? "Mentions Légales & Impressum (§ 5 DDG) | GermanJobsPro 🇩🇪"
    : "Legal Notice & Impressum (§ 5 DDG) | GermanJobsPro 🇩🇪";

  const description = isAr
    ? "البيانات القانونية الرسمية لمنصة GermanJobsPro طبقاً للمادة 5 من قانون الخدمات الرقمية الألماني (DDG) وقانون الإعلام الألماني (MStV)."
    : isDe
    ? "Gesetzliche Anbieterkennzeichnung von GermanJobsPro gemäß § 5 DDG (Digitale-Dienste-Gesetz) und § 18 Abs. 2 MStV."
    : isFr
    ? "Mentions légales et informations de l'éditeur de GermanJobsPro conformément au § 5 du DDG allemand et au MStV."
    : "Official provider identification and legal disclosure for GermanJobsPro pursuant to Section 5 of the German Digital Services Act (DDG) and MStV.";

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.germanjobspro.com/${locale}/impressum`,
      languages: {
        ar: "https://www.germanjobspro.com/ar/impressum",
        de: "https://www.germanjobspro.com/de/impressum",
        en: "https://www.germanjobspro.com/en/impressum",
        fr: "https://www.germanjobspro.com/fr/impressum",
        "x-default": "https://www.germanjobspro.com/de/impressum",
      },
    },
  };
}

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const isFr = locale === "fr";
  const dir = isAr ? "rtl" : "ltr";

  const authResult = await getUserSession();
  const user = authResult ? authResult.user : null;

  const companyName = process.env.NEXT_PUBLIC_IMPRESSUM_NAME || "GermanJobsPro";
  const operatorName = process.env.NEXT_PUBLIC_IMPRESSUM_OPERATOR || "GermanJobsPro Platform Operations";
  const address = process.env.NEXT_PUBLIC_IMPRESSUM_ADDRESS || "";
  const email = process.env.NEXT_PUBLIC_IMPRESSUM_EMAIL || "support@germanjobspro.com";

  return (
    <div
      dir={dir}
      className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white"
    >
      <Navbar locale={locale} initialUser={user} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full flex-1 space-y-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href={`/${locale}`} className="hover:text-blue-600 transition-colors">
            {isAr ? "الرئيسية" : isDe ? "Startseite" : isFr ? "Accueil" : "Home"}
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">
            {isAr
              ? "بيانات المنصة القانونية (Impressum)"
              : isDe
              ? "Impressum"
              : isFr
              ? "Mentions Légales"
              : "Legal Notice"}
          </span>
        </div>

        {/* Header Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <span>🏛️</span>
            <span>{isAr ? "الامتثال القانوني الألماني (§ 5 DDG)" : isDe ? "Rechtliche Pflichtangaben (§ 5 DDG)" : isFr ? "Conformité Légale Allemande (§ 5 DDG)" : "German Legal Compliance (§ 5 DDG)"}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#061838] tracking-tight">
            {isAr
              ? "بيانات المنصة القانونية (Impressum)"
              : isDe
              ? "Impressum"
              : isFr
              ? "Mentions Légales (Impressum)"
              : "Legal Notice (Impressum)"}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? "البيانات والمعلومات القانونية الإلزامية لمشغل منصة GermanJobsPro طبقاً لقانون الخدمات الرقمية الألماني (DDG) وقانون الإعلام (MStV)."
              : isDe
              ? "Gesetzliche Anbieterkennzeichnung und Informationspflichten für GermanJobsPro gemäß § 5 DDG (ehemals TMG) und § 18 Abs. 2 MStV."
              : isFr
              ? "Informations légales obligatoires sur l'éditeur de la plateforme GermanJobsPro conformément au DDG et au MStV."
              : "Mandatory provider identification and statutory disclosure for GermanJobsPro under Section 5 DDG and Section 18 MStV."}
          </p>

          <p className="text-xs text-slate-500">
            {isAr
              ? "آخر تحديث: نوفمبر 2026"
              : isDe
              ? "Stand: November 2026"
              : isFr
              ? "Dernière mise à jour : Novembre 2026"
              : "Last updated: November 2026"}
          </p>
        </div>

        {/* Legal Cards Container */}
        <div className="space-y-8">
          {/* Section 1: Provider Information / Angaben gemäß § 5 DDG */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="text-2xl">🏢</span>
              <h2 className="text-xl sm:text-2xl font-black text-[#061838]">
                {isAr
                  ? "1. بيانات مشغل المنصة ومقدم الخدمة (وفقاً للمادة 5 DDG)"
                  : isDe
                  ? "1. Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)"
                  : isFr
                  ? "1. Informations sur l'éditeur (§ 5 DDG)"
                  : "1. Information Pursuant to Section 5 DDG"}
              </h2>
            </div>

            <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {isAr ? "اسم المنصة / الخدمة" : isDe ? "Diensteanbieter / Plattform" : isFr ? "Plateforme / Service" : "Platform / Service"}
                  </span>
                  <p className="font-bold text-slate-900 text-base">{companyName}</p>
                  <p className="text-xs text-slate-600">
                    {isAr
                      ? "منصة برمجية متخصصة في تنسيق ملفات الترشيح للعمل في ألمانيا وفق معايير DIN 5008"
                      : isDe
                      ? "Softwareplattform für DIN 5008 Bewerbungsunterlagen & Karriereunterstützung"
                      : "Software platform for German DIN 5008 application documents & career tools"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {isAr ? "إدارة وتشغيل المنصة" : isDe ? "Betrieb & Verwaltung" : isFr ? "Exploitation" : "Operations"}
                  </span>
                  <p className="font-bold text-slate-900 text-base">{operatorName}</p>
                  <p className="text-xs text-slate-600">
                    {isAr ? "فريق التطوير والعمليات الرقمية" : isDe ? "Digital Platform Operations Team" : "Digital Platform Operations"}
                  </p>
                </div>
              </div>

              {address && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {isAr ? "العنوان البريدي" : isDe ? "Postanschrift" : isFr ? "Adresse postale" : "Postal Address"}
                  </span>
                  <p className="font-medium text-slate-900">{address}</p>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isAr ? "قنوات التواصل الإلكتروني السريع" : isDe ? "Elektronische Kontaktaufnahme (§ 5 Abs. 1 Nr. 2 DDG)" : isFr ? "Contact électronique" : "Electronic Contact"}
                </span>
                <p className="text-slate-800">
                  <strong className="text-slate-900">{isAr ? "البريد الإلكتروني المباشر:" : isDe ? "E-Mail:" : "Email:"}</strong>{" "}
                  <a href={`mailto:${email}`} className="text-blue-600 hover:underline font-mono text-xs sm:text-sm">
                    {email}
                  </a>
                </p>
                <p className="text-slate-800">
                  <strong className="text-slate-900">{isAr ? "نموذج التواصل السريع:" : isDe ? "Kontaktformular:" : "Contact Form:"}</strong>{" "}
                  <Link href={`/${locale}/contact`} className="text-blue-600 hover:underline font-medium">
                    {isAr ? "صفحة الدعم والتواصل الفني" : isDe ? "Support- und Kontaktformular" : isFr ? "Formulaire de contact" : "Online Support & Contact Page"}
                  </Link>
                </p>
                <p className="text-xs text-slate-500 pt-1">
                  {isAr
                    ? "نلتزم بالرد على كافة الاستفسارات القانونية والتقنية في غضون 24 إلى 48 ساعة كحد أقصى خلال أيام العمل الرسمية."
                    : isDe
                    ? "Wir beantworten gesetzliche, technische und nutzerbezogene Anfragen in der Regel innerhalb von 24–48 Stunden an Werktagen."
                    : isFr
                    ? "Nous répondons généralement aux demandes dans un délai de 24 à 48 heures ouvrées."
                    : "We generally reply to legal, technical, and user inquiries within 24–48 business hours."}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Editorial Responsibility / § 18 Abs. 2 MStV */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="text-2xl">✍️</span>
              <h2 className="text-xl sm:text-2xl font-black text-[#061838]">
                {isAr
                  ? "2. المسؤولية عن المحتوى التحريري (§ 18 Abs. 2 MStV)"
                  : isDe
                  ? "2. Verantwortlich für den redaktionellen Inhalt (§ 18 Abs. 2 MStV)"
                  : isFr
                  ? "2. Responsabilité éditoriale (§ 18 MStV)"
                  : "2. Editorial & Content Responsibility (§ 18 MStV)"}
              </h2>
            </div>
            <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
              <p>
                {isAr
                  ? "مسؤول التحرير والمحتوى الإرشادي للمقالات، ودروس الأكاديمية اللغوية A1، والإرشادات المهنية المنشورة على المنصة:"
                  : isDe
                  ? "Verantwortlich für redaktionelle Inhalte, Karriere-Ratgeber und Sprachlektionen im Sinne des § 18 Abs. 2 Medienstaatsvertrag (MStV):"
                  : isFr
                  ? "Responsable de la rédaction et des guides de carrière conformément au § 18 al. 2 du traité d'État sur les médias (MStV) :"
                  : "Responsible for journalistic and editorial content, career guides, and language tutorials under Section 18 (2) MStV:"}
              </p>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <p className="font-bold text-slate-900">{operatorName}</p>
                <p className="text-xs text-slate-600">
                  {isAr ? "إدارة التحرير والمحتوى الأكاديمي" : isDe ? "Redaktion & Content-Management GermanJobsPro" : "Editorial & Content Management"}
                </p>
                <p className="text-xs text-slate-500">
                  {isAr ? "للتواصل: " : isDe ? "Kontakt: " : isFr ? "Contact : " : "Contact: "}
                  <a href={`mailto:${email}`} className="text-blue-600 hover:underline">{email}</a>
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: EU Dispute Resolution & Consumer Arbitration */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="text-2xl">⚖️</span>
              <h2 className="text-xl sm:text-2xl font-black text-[#061838]">
                {isAr
                  ? "3. تسوية النزاعات عبر الإنترنت في الاتحاد الأوروبي (VSBG)"
                  : isDe
                  ? "3. EU-Streitschlichtung & Verbraucherstreitbeilegung"
                  : isFr
                  ? "3. Règlement des litiges en ligne (UE)"
                  : "3. EU Dispute Resolution & Consumer Arbitration"}
              </h2>
            </div>
            <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
              <p>
                {isAr
                  ? "توفر المفوضية الأوروبية منصة رسمية لتسوية النزاعات عبر الإنترنت (ODR) للمستهلكين، والتي يمكن الوصول إليها عبر الرابط التالي:"
                  : isDe
                  ? "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit, die Sie unter folgendem Link finden:"
                  : isFr
                  ? "La Commission européenne met à disposition une plateforme de règlement en ligne des litiges (RLL) accessible ici :"
                  : "The European Commission provides a platform for online dispute resolution (ODR), accessible via:"}
              </p>
              <p>
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1.5"
                >
                  <span>https://ec.europa.eu/consumers/odr</span>
                  <span>↗</span>
                </a>
              </p>
              <p className="text-xs text-slate-500">
                {isAr
                  ? "نحن لسنا ملزمين ولا نرغب بالمشاركة في إجراءات تسوية المنازعات أمام هيئات تحكيم المستهلكين المنصوص عليها في قانون (VSBG) الألماني، ونفضل دائماً معالجة أي استفسار أو تسوية ودياً وبشكل مباشر عبر بريد الدعم الفني."
                  : isDe
                  ? "Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG). Bei Beschwerden oder Anliegen bitten wir Sie, sich direkt an unseren Support zu wenden."
                  : isFr
                  ? "Nous ne sommes ni disposés ni obligés de participer à des procédures de règlement des litiges devant un conseil d'arbitrage de la consommation."
                  : "We are neither obligated nor willing to participate in dispute resolution proceedings before a consumer arbitration board under the German VSBG."}
              </p>
            </div>
          </div>

          {/* Section 4: Liability Disclaimer for Content & AI Documents */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="text-2xl">🛡️</span>
              <h2 className="text-xl sm:text-2xl font-black text-[#061838]">
                {isAr
                  ? "4. إخلاء المسؤولية عن المحتوى والوثائق المولدة بالذكاء الاصطناعي"
                  : isDe
                  ? "4. Haftungsausschluss: Inhalte, KI-Werkzeuge & Stellenangebote"
                  : isFr
                  ? "4. Exclusion de responsabilité : Contenus & Documents IA"
                  : "4. Liability Disclaimer: Content, AI Tools & Job Listings"}
              </h2>
            </div>
            <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
              <div>
                <h3 className="font-bold text-slate-900 mb-1">
                  {isAr ? "أ) المسؤولية عن المحتوى الخاص:" : isDe ? "a) Haftung für eigene Inhalte:" : "a) Liability for own content:"}
                </h3>
                <p>
                  {isAr
                    ? "بصفتنا مقدم خدمة بموجب المادة 7 الفقرة 1 من قانون الخدمات الرقمية الألماني، فإننا مسؤولون عن محتوانا الخاص المنشور على صفحات هذه المنصة وفقاً للقوانين العامة. ومع ذلك، ووفقاً للمواد 8 إلى 10 DDG، لسنا ملزمين بمراقبة المعلومات المنقولة أو المخزنة من أطراف ثالثة أو البحث عن وقائع تدل على نشاط غير قانوني."
                    : isDe
                    ? "Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen dauerhaft zu überwachen."
                    : "As a service provider, we are responsible for our own content on these pages under general law pursuant to Section 7 (1) DDG. Under Sections 8 to 10 DDG, we are not obligated to permanently monitor external transmitted or stored information."}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-1">
                  {isAr ? "ب) الوثائق المولدة بمساعدة الذكاء الاصطناعي (DIN 5008):" : isDe ? "b) KI-generierte Dokumente (DIN 5008 Lebenslauf & Anschreiben):" : "b) AI-generated application documents (DIN 5008):"}
                </h3>
                <p>
                  {isAr
                    ? "توفر المنصة أدوات برمجية متقدمة ونماذج ذكاء اصطناعي لمساعدة المرشحين في تنسيق السير الذاتية وصياغة خطابات الدافع (Anschreiben). يقر المستخدم ويتحمل المسؤولية الكاملة والمنفردة عن التحقق من دقة ومطابقة وصحة كافة البيانات والمعلومات الواردة في المستندات المولدة قبل إرسالها إلى الشركات أو القنصليات أو الجهات الحكومية."
                    : isDe
                    ? "Die Plattform stellt Softwarewerkzeuge und KI-Modelle bereit, die Bewerber bei der Formatierung von tabellarischen Lebensläufen und Anschreiben nach DIN 5008 unterstützen. Der Nutzer trägt die alleinige Verantwortung für die Prüfung, sachliche Richtigkeit und Vollständigkeit der erzeugten Unterlagen vor einer Einreichung bei Arbeitgebern oder Behörden."
                    : "The platform provides AI-assisted formatting tools for DIN 5008 CVs and motivation letters. The user bears sole responsibility for verifying the accuracy, truthfulness, and completeness of all generated documents prior to submission."}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-1">
                  {isAr ? "ج) عروض الوظائف والإعلانات الخارجية:" : isDe ? "c) Stellenangebote & externe Schnittstellen:" : "c) External Job Listings & Feeds:"}
                </h3>
                <p>
                  {isAr
                    ? "يتم جمع وفهرسة إعلانات الوظائف من شبكات التوظيف الألمانية الرسمية (بما في ذلك وكالة العمل الفيدرالية Bundesagentur für Arbeit وشبكة ArbeitNow). لا تضمن المنصة استمرار توفر الوظائف المعلنة ولا تتحمل مسؤولية شروط التوظيف الخاصة بالشركات المعلنة."
                    : isDe
                    ? "Stellenanzeigen werden aus öffentlich zugänglichen und verifizierten Arbeitgebernetzwerken (u. a. Bundesagentur für Arbeit und ArbeitNow) bezogen. GermanJobsPro übernimmt keine Gewähr für das Zustandekommen eines Arbeitsverhältnisses oder die Richtigkeit externer Stellenangebote."
                    : "Job listings are compiled from verified employer portals and public labor networks. GermanJobsPro cannot guarantee job placement or the continued availability of listed positions."}
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Copyright & Intellectual Property */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="text-2xl">©️</span>
              <h2 className="text-xl sm:text-2xl font-black text-[#061838]">
                {isAr
                  ? "5. حقوق الطبع والنشر والملكية الفكرية (Urheberrecht)"
                  : isDe
                  ? "5. Urheberrecht & Geistiges Eigentum"
                  : isFr
                  ? "5. Droits d'auteur & Propriété intellectuelle"
                  : "5. Copyright & Intellectual Property"}
              </h2>
            </div>
            <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
              <p>
                {isAr
                  ? "كافة المحتويات، البرمجيات، والتصميمات المنشورة على هذه المنصة تخضع لحماية قانون حقوق الطبع والنشر الألماني. أي استنساخ، تعديل، توزيع، أو استغلال تجاري خارج حدود قانون حق المؤلف يتطلب موافقة خطية صريحة من إدارة المنصة."
                  : isDe
                  ? "Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers."
                  : isFr
                  ? "Les contenus et œuvres créés par les éditeurs de ce site sont soumis au droit d'auteur allemand. Toute reproduction ou distribution nécessite un accord écrit préalable."
                  : "The contents and works created by the site operators on these pages are subject to German copyright law. Duplication, editing, or distribution outside copyright limits requires written consent."}
              </p>
              <p className="text-xs text-slate-500">
                {isAr
                  ? "تبقى البيانات والسير الذاتية التي يقوم المستخدم بإدخالها ملكاً حصرياً له، ولا تدعي المنصة أي حقوق ملكية على المحتوى الشخصي للمرشحين."
                  : isDe
                  ? "Die von Nutzern eingegebenen persönlichen Bewerbungsdaten verbleiben im ausschließlichen Eigentum des jeweiligen Nutzers."
                  : "Personal resume data entered by candidates remains their exclusive property."}
              </p>
            </div>
          </div>
        </div>

        {/* Back Link to Home */}
        <div className="text-center pt-4">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 font-bold text-sm shadow-xs transition-all hover:shadow-md"
          >
            <span className={dir === "rtl" ? "rotate-180" : ""}>←</span>
            <span>{isAr ? "العودة إلى الصفحة الرئيسية" : isDe ? "Zurück zur Startseite" : isFr ? "Retour à l'accueil" : "Return to Homepage"}</span>
          </Link>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
