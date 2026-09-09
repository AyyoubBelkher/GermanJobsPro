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
      ? "سياسة الخصوصية وحماية البيانات (GDPR) 🛡️ | GermanJobsPro 🇩🇪"
      : isDe
      ? "Datenschutzerklärung (DSGVO) 🛡️ | GermanJobsPro 🇩🇪"
      : "Privacy Policy & GDPR Compliance 🛡️ | GermanJobsPro 🇩🇪",
    description: isAr
      ? "سياسة الخصوصية وحماية بيانات السير الذاتية وفق معايير اللائحة العامة لحماية البيانات في الاتحاد الأوروبي (GDPR). حماية وتشفير وحذف البيانات عند الطلب."
      : "Datenschutzerklärung von GermanJobsPro gemäß DSGVO: Transparente Verarbeitung, sichere Speicherung und Löschung von Bewerbungsdaten auf Anfrage.",
  };
}

export default async function PrivacyPage({
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
            {isAr ? "سياسة الخصوصية وحماية البيانات" : isDe ? "Datenschutzerklärung" : "Privacy Policy (GDPR)"}
          </span>
        </div>

        {/* Header Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span>🛡️</span>
            <span>{isAr ? "متوافق 100% مع معايير GDPR الأوروبية" : isDe ? "100% DSGVO-konform" : "100% GDPR Compliant"}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {isAr
              ? "سياسة الخصوصية وحماية البيانات"
              : isDe
              ? "Datenschutzerklärung & Datenschutz"
              : "Privacy Policy & Data Protection"}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? "نلتزم في GermanJobsPro بأعلى المعايير الصارمة لحماية خصوصيتك بموجب اللائحة الأوروبية العامة لحماية البيانات (GDPR / DSGVO). نوضح هنا كيف نعالج ونحمي بياناتك المهنية والشخصية."
              : isDe
              ? "GermanJobsPro legt höchsten Wert auf den Schutz Ihrer Privatsphäre gemäß der europäischen Datenschutz-Grundverordnung (DSGVO). Hier erläutern wir die Speicherung und Löschung Ihrer Daten."
              : "GermanJobsPro is fully committed to safeguarding your personal and resume data in strict compliance with the European General Data Protection Regulation (GDPR)."}
          </p>

          <p className="text-xs text-slate-400 font-mono">
            {isAr ? "آخر تحديث: 9 سبتمبر 2026" : isDe ? "Stand: 9. September 2026" : "Last updated: September 9, 2026"}
          </p>
        </div>

        {/* GDPR Core Guarantee Box */}
        <div className="rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 p-6 sm:p-8 space-y-4 text-emerald-200 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <h2 className="text-lg sm:text-xl font-black text-emerald-300">
              {isAr
                ? "ضمان الخصوصية وحق حذف البيانات فوراً (Art. 17 GDPR)"
                : isDe
                ? "Garantie der Datensouveränität & Recht auf Löschung (Art. 17 DSGVO)"
                : "Privacy Guarantee & Right to Erasure / Deletion (Art. 17 GDPR)"}
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed">
            {isAr ? (
              <>
                <p>
                  <strong>بيانات سيرتك الذاتية ملكك وحدك:</strong> لا نقوم ببيع أو تأجير أو مشاركة سيرتك الذاتية أو بياناتك الشخصية مع أطراف خارجية أو شركات توظيف أو معلنين دون طلب وموافقة صريحة منك.
                </p>
                <p>
                  <strong>حذف البيانات الفوري عند الطلب (Right to Erasure):</strong> يحق لك في أي وقت حذف حسابك وكافة سيرتك الذاتية وخطابات الدافع والملفات المرفوعة بنقرة واحدة أو بمراسلتنا على{" "}
                  <a href="mailto:support@germanjobspro.com" className="text-emerald-400 underline font-mono">
                    support@germanjobspro.com
                  </a>
                  ، ويتم شطب كافة السجلات بصورة دائمة وغير قابلة للاسترجاع.
                </p>
                <p>
                  <strong>عدم تدريب نماذج الذكاء الاصطناعي العامة على بياناتك:</strong> عمليات الصياغة والتحليل بالذكاء الاصطناعي تتم عبر خوادم آمنة ومشفرة، ولا تُستخدم بياناتك لتدريب نماذج الذكاء الاصطناعي العامة.
                </p>
              </>
            ) : isDe ? (
              <>
                <p>
                  <strong>Ihre Lebenslaufdaten gehören ausschließlich Ihnen:</strong> Wir verkaufen, vermieten oder teilen Ihre persönlichen Angaben und Bewerbungsunterlagen niemals mit Dritten, Personalvermittlern oder Werbenetzwerken ohne Ihre ausdrückliche Einwilligung.
                </p>
                <p>
                  <strong>Sofortiges Recht auf Löschung (Art. 17 DSGVO):</strong> Sie können jederzeit die vollständige und unwiderrufliche Löschung Ihres Kontos sowie aller gespeicherten Lebensläufe und Anschreiben verlangen – per Klick oder per E-Mail an{" "}
                  <a href="mailto:support@germanjobspro.com" className="text-emerald-400 underline font-mono">
                    support@germanjobspro.com
                  </a>.
                </p>
                <p>
                  <strong>Kein KI-Training mit Ihren Daten:</strong> Die Verarbeitung durch KI-Modelle erfolgt über gesicherte Schnittstellen; Ihre Daten werden nicht zum Training öffentlicher Sprachmodelle verwendet.
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>Your Career Data Belongs to You:</strong> We never sell, rent, or trade your resume or personal information to third parties, recruiters, or ad networks without your explicit instruction and consent.
                </p>
                <p>
                  <strong>Instant Right to Erasure / Deletion (Art. 17 GDPR):</strong> You have the absolute right to request the total and permanent deletion of your account, resumes, cover letters, and uploaded PDFs at any time by emailing{" "}
                  <a href="mailto:support@germanjobspro.com" className="text-emerald-400 underline font-mono">
                    support@germanjobspro.com
                  </a>.
                </p>
                <p>
                  <strong>No Public AI Training:</strong> All AI-powered resume optimizations are performed via secure APIs and your private data is never used to train public foundation models.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Detailed GDPR Articles Breakdown */}
        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          
          {/* Section 1: Controller */}
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-blue-400">1.</span>
              <span>{isAr ? "الجهة المسؤولة عن معالجة البيانات (Verantwortlicher)" : isDe ? "1. Verantwortliche Stelle (Art. 4 Nr. 7 DSGVO)" : "1. Data Controller"}</span>
            </h3>
            <p>
              {isAr
                ? "المسؤول عن معالجة البيانات بموجب اللائحة العامة لحماية البيانات (GDPR) هو منصة GermanJobsPro. للتواصل مع مسؤول حماية البيانات:"
                : isDe
                ? "Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) und anderer nationaler Datenschutzgesetze ist die Plattform GermanJobsPro. Kontakt:"
                : "The data controller responsible for the processing of your personal data under the EU GDPR is the GermanJobsPro platform. Contact:"}
            </p>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1">
              <p className="text-white font-bold">GermanJobsPro Compliance & Privacy Team</p>
              <p className="text-slate-400">
                Official Support & DPO Email:{" "}
                <a href="mailto:support@germanjobspro.com" className="text-blue-400 hover:underline">
                  support@germanjobspro.com
                </a>
              </p>
            </div>
          </section>

          {/* Section 2: Data Collected */}
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-blue-400">2.</span>
              <span>{isAr ? "البيانات التي نقوم بجمعها" : isDe ? "2. Welche Daten wir erheben" : "2. Information We Collect"}</span>
            </h3>
            <ul className="space-y-2 list-disc list-inside text-slate-300 text-xs sm:text-sm">
              <li>
                <strong>{isAr ? "بيانات الحساب والهوية:" : isDe ? "Kontodaten:" : "Account Data:"}</strong>{" "}
                {isAr
                  ? "الاسم، عنوان البريد الإلكتروني، وكلمة المرور المشفرة بتشفير Scrypt العالي الحماية."
                  : isDe
                  ? "Name, E-Mail-Adresse und sicher mit Scrypt gehashte Passwörter."
                  : "Name, email address, and securely hashed passwords using Scrypt cryptography."}
              </li>
              <li>
                <strong>{isAr ? "بيانات السيرة الذاتية وملف التقديم:" : isDe ? "Bewerbungs- & Lebenslaufdaten:" : "Resume & Application Data:"}</strong>{" "}
                {isAr
                  ? "التعليم والمؤهلات، الخبرات المهنية، اللغات، المهارات التقنية، ومعلومات التواصل المدخلة في السيرة الذاتية وملفات الـ PDF المرفوعة."
                  : isDe
                  ? "Ausbildung, Berufserfahrung, Sprachkenntnisse, Zertifikate und Kontaktdaten im Lebenslauf sowie hochgeladene PDF-Dokumente."
                  : "Education, work history, language proficiencies, certifications, contact info, and uploaded PDF documents."}
              </li>
              <li>
                <strong>{isAr ? "البيانات التقنية وملفات تعريف الارتباط:" : isDe ? "Technische Daten & Cookies:" : "Technical Data & Cookies:"}</strong>{" "}
                {isAr
                  ? "عنوان الـ IP، نوع المتصفح، ومعرف الجلسة الآمن (Session Cookie) الضروري فقط لتسجيل الدخول وحماية الجلسة."
                  : isDe
                  ? "IP-Adresse, Browsertyp und ausschließlich technisch notwendige Sitzungs-Cookies zur Authentifizierung."
                  : "IP address, browser type, and strictly necessary session cookies for user authentication."}
              </li>
              <li>
                <strong>{isAr ? "بيانات المدفوعات:" : isDe ? "Zahlungsdaten:" : "Payment Data:"}</strong>{" "}
                {isAr
                  ? "تتم معالجة بطاقات الدفع وتأكيد العمليات عبر بوابة Lemon Squeezy العالمية المتوافقة مع أعلى معايير أمان البنوك (PCI-DSS). نحن لا نخزن أرقام البطاقات الائتمانية في خوادمنا نهائياً."
                  : isDe
                  ? "Zahlungen werden vollständig über den zertifizierten Zahlungsanbieter Lemon Squeezy (PCI-DSS) abgewickelt. Wir speichern keine Kreditkartennummern auf unseren Servern."
                  : "Transactions are processed entirely by Lemon Squeezy (PCI-DSS Level 1 certified). We never store payment card numbers on our servers."}
              </li>
            </ul>
          </section>

          {/* Section 3: Legal Basis */}
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-blue-400">3.</span>
              <span>{isAr ? "الأساس القانوني للمعالجة (المادة 6 من GDPR)" : isDe ? "3. Rechtsgrundlagen der Verarbeitung (Art. 6 DSGVO)" : "3. Legal Basis for Processing (Art. 6 GDPR)"}</span>
            </h3>
            <p>
              {isAr
                ? "تتم معالجة بياناتك استناداً إلى: تنفيذ العقد المبرم معك لتوفير خدمات المنصة وتنسيق السير الذاتية (Art. 6(1)(b) GDPR)، والمصلحة المشروعة في تأمين وحماية الخوادم ومكافحة الاحتيال (Art. 6(1)(f) GDPR)، وموافقتك الصريحة عند الاشتراك (Art. 6(1)(a) GDPR)."
                : isDe
                ? "Die Verarbeitung Ihrer Daten erfolgt zur Erfüllung unseres Vertrages zur Bereitstellung der Software-Dienste (Art. 6 Abs. 1 lit. b DSGVO), auf Grundlage berechtigter Interessen an der IT-Sicherheit (Art. 6 Abs. 1 lit. f DSGVO) sowie ggf. Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)."
                : "We process your personal data under the following legal bases: Contract performance for providing our resume software and AI tools (Art. 6(1)(b) GDPR), legitimate interest in system security and fraud prevention (Art. 6(1)(f) GDPR), and user consent where applicable (Art. 6(1)(a) GDPR)."}
            </p>
          </section>

          {/* Section 4: Resume Storage and AI Processing */}
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-blue-400">4.</span>
              <span>{isAr ? "تخزين ومعالجة السير الذاتية والذكاء الاصطناعي" : isDe ? "4. Speicherung & KI-Verarbeitung von Lebensläufen" : "4. Resume Storage & AI Processing"}</span>
            </h3>
            <p>
              {isAr
                ? "يتم تخزين بيانات السير الذاتية في قواعد بيانات سحابية مشفرة بضوابط وصول مشددة. عند طلب تحسين النص أو توليد خطاب دافع، تُرسل الأجزاء المحددة عبر قنوات مشفرة لمعالجة الطلب وإرجاع النتيجة الفورية دون الاحتفاظ بها لأغراض تدريب النماذج الخارجية. لا يتم تصدير أو مشاركة مستنداتك مع أي جهة عمل إلا بعد قيامك بتحميل ملف الـ PDF بنفسك وتقديمه باختيارك الحر."
                : isDe
                ? "Bewerbungsunterlagen werden in verschlüsselten Datenbanken mit strengsten Zugriffskontrollen gespeichert. Bei der KI-Optimierung werden Textabschnitte über abgesicherte TLS-Verbindungen übertragen und ausschließlich zur Generierung der angeforderten Ausgabe verarbeitet. Ein Weiterleiten an Arbeitgeber erfolgt niemals automatisch, sondern ausschließlich durch Sie selbst."
                : "Resume records are stored in encrypted databases with strict role-based access controls. When you trigger an AI optimization or cover letter generation, only the required text snippets are securely transmitted via encrypted APIs to generate the immediate result. Your documents are never forwarded to any employer or recruiter without your personal action."}
            </p>
          </section>

          {/* Section 5: GDPR Rights */}
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-blue-400">5.</span>
              <span>{isAr ? "حقوقك القانونية بموجب اللائحة العامة لحماية البيانات" : isDe ? "5. Ihre Betroffenenrechte (Art. 15-22 DSGVO)" : "5. Your Rights under GDPR"}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                <p className="font-bold text-white text-xs">{isAr ? "حق الوصول والاطلاع (Art. 15)" : isDe ? "Auskunftsrecht (Art. 15 DSGVO)" : "Right of Access (Art. 15)"}</p>
                <p className="text-[11px] text-slate-400 mt-1">{isAr ? "معرفة كافة البيانات المخزنة عنك واستلام نسخة منها." : isDe ? "Auskunft über die zu Ihrer Person verarbeiteten Daten." : "Request a full copy of all data stored about you."}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                <p className="font-bold text-white text-xs">{isAr ? "حق التصحيح والتعديل (Art. 16)" : isDe ? "Berichtigungsrecht (Art. 16 DSGVO)" : "Right to Rectification (Art. 16)"}</p>
                <p className="text-[11px] text-slate-400 mt-1">{isAr ? "تعديل وتصحيح أي بيانات غير دقيقة في حسابك فوراً." : isDe ? "Unverzügliche Korrektur unrichtiger Daten." : "Correct any inaccurate personal or resume data."}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                <p className="font-bold text-white text-xs">{isAr ? "حق الحذف والنسيان (Art. 17)" : isDe ? "Recht auf Löschung (Art. 17 DSGVO)" : "Right to Erasure (Art. 17)"}</p>
                <p className="text-[11px] text-slate-400 mt-1">{isAr ? "حذف حسابك وبياناتك ومستنداتك نهائياً من أنظمتنا." : isDe ? "Vollständige Löschung aller gespeicherten Profildaten." : "Demand permanent deletion of all data and CVs."}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                <p className="font-bold text-white text-xs">{isAr ? "حق نقل البيانات (Art. 20)" : isDe ? "Datenübertragbarkeit (Art. 20 DSGVO)" : "Right to Data Portability (Art. 20)"}</p>
                <p className="text-[11px] text-slate-400 mt-1">{isAr ? "تصدير بيانات سيرتك الذاتية بتنسيقات قياسية مقروءة آلياً." : isDe ? "Erhalt Ihrer Daten in einem gängigen, maschinenlesbaren Format." : "Export your resume data in structured formats."}</p>
              </div>
            </div>
          </section>

          {/* Section 6: Request Deletion CTA */}
          <section className="p-6 sm:p-8 rounded-3xl bg-blue-950/40 border border-blue-500/20 space-y-3 text-center">
            <h3 className="text-base sm:text-lg font-bold text-white">
              {isAr ? "هل ترغب في ممارسة حقوقك أو حذف بياناتك؟" : isDe ? "Löschungsanfrage oder Datenschutz-Kontakt" : "Data Erasure Requests & Inquiries"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              {isAr
                ? "يمكنك إرسال طلب حذف فوري لبياناتك أو أي استفسار متعلق بالخصوصية مباشرة إلى البريد المعتمد:"
                : isDe
                ? "Senden Sie Ihre Löschungsanfrage oder datenschutzrechtliche Anfrage bitte direkt an:"
                : "Submit data erasure requests or any privacy inquiries directly to our dedicated contact:"}
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
