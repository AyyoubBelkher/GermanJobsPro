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
      ? "سياسة الاسترجاع وضمان الرضا 💎 | GermanJobsPro 🇩🇪"
      : isDe
      ? "Rückerstattungsrichtlinie (Widerruf) 💎 | GermanJobsPro 🇩🇪"
      : "Refund Policy & Satisfaction Guarantee 💎 | GermanJobsPro 🇩🇪",
    description: isAr
      ? "سياسة وضوابط استرداد الأموال الرقمية لباقة PRO Pass في GermanJobsPro. ضمان الرضا والشفافية التامة وحماية حقوق المستهلك."
      : "Transparente Rückerstattungsrichtlinie und Widerrufsbelehrung für den GermanJobsPro PRO Pass.",
  };
}

export default async function RefundPage({
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
            {isAr ? "سياسة الاسترجاع والضمان" : isDe ? "Rückerstattungsrichtlinie" : "Refund Policy"}
          </span>
        </div>

        {/* Header Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <span>💎</span>
            <span>{isAr ? "ضمان الرضا والشفافية" : isDe ? "Transparenz-Garantie" : "Satisfaction Guarantee"}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {isAr
              ? "سياسة الاسترجاع واسترداد الأموال"
              : isDe
              ? "Rückerstattungsrichtlinie & Widerrufsrecht"
              : "Refund Policy & Satisfaction Guarantee"}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? "في GermanJobsPro، نلتزم بأعلى معايير الشفافية وتقديم قيمة حقيقية لرحلتك المهنية في ألمانيا. توضح هذه الوثيقة بوضوح شروط وسياسة استرداد المبالغ المدفوعة لباقة PRO Pass."
              : isDe
              ? "Bei GermanJobsPro setzen wir auf höchste Transparenz und echten Mehrwert für Ihre Karriere in Deutschland. Hier finden Sie klare Bedingungen zur Rückerstattung des PRO Pass."
              : "At GermanJobsPro, we stand behind our tools and prioritize fairness. Here is our clear and transparent refund policy for the PRO Pass digital software license."}
          </p>

          <p className="text-xs text-slate-400 font-mono">
            {isAr ? "آخر تحديث: 9 سبتمبر 2026" : isDe ? "Stand: 9. September 2026" : "Last updated: September 9, 2026"}
          </p>
        </div>

        {/* Highlight Summary Box */}
        <div className="rounded-3xl bg-slate-900/80 border-2 border-blue-500/30 p-6 sm:p-8 space-y-4 text-slate-200 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                {isAr
                  ? "ضمان استرجاع لمدة 14 يوماً للأعطال والمشاكل التقنية غير المحلولة"
                  : isDe
                  ? "14-Tage-Zufriedenheitsgarantie bei ungelösten technischen Störungen"
                  : "14-Day Satisfaction Guarantee for Unresolved Technical Defects"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? "باقة PRO Pass ($9.99 USD) • صلاحية 90 يوماً كاملة • بدون اشتراكات متكررة خفية"
                  : isDe
                  ? "PRO Pass (9,99 USD) • 90 Tage volle Laufzeit • Keine Abofalle"
                  : "PRO Pass ($9.99 USD) • 90 Full Days of Access • No Hidden Recurring Subscriptions"}
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
            {isAr
              ? "إذا واجهت أي خلل فني في توليد السيرة الذاتية وفق DIN 5008 أو إنشاء ملف الترشيح الكامل أو استيراد ملف الـ PDF، ولم يتمكن فريق الدعم الفني لدينا من حل المشكلة في غضون 48 ساعة من إبلاغنا، سنعيد إليك أموالك بنسبة 100% وبكل رحابة صدر."
              : isDe
              ? "Sollte ein technischer Fehler beim Erstellen Ihres DIN 5008 Lebenslaufs, des Anschreibens oder beim PDF-Export auftreten, den unser technischer Support nicht innerhalb von 48 Stunden beheben kann, erstatten wir Ihnen den vollen Betrag anstandslos zurück."
              : "If you encounter any technical malfunction generating DIN 5008 documents or exporting your complete dossier that our engineering team cannot resolve within 48 hours of notice, we will issue a prompt 100% refund."}
          </p>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          
          {/* Section 1: Nature of Digital Goods */}
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-blue-400">1.</span>
              <span>{isAr ? "طبيعة الخدمة الرقمية وباقة PRO Pass" : isDe ? "1. Art der digitalen Dienstleistung (PRO Pass)" : "1. Nature of the Digital PRO Pass Service"}</span>
            </h3>
            <p>
              {isAr
                ? "باقة GermanJobsPro PRO Pass هي ترخيص برمجيات رقمي فوري يمنح المستخدم وصولاً شاملاً لمدة 90 يوماً متواصلة (دورة التقديم والبحث عن عمل في ألمانيا) إلى محركات الذكاء الاصطناعي، واستوديو تجميع ملف الترشيح الكامل (Bewerbungsmappe)، ومطابقة معايير DIN 5008 وفاحص الـ ATS. نظراً لأن تسليم الرصيد والميزات يتم فورياً وبشكل رقمي لحظة إتمام الدفع، فإن سياسة الاسترداد تخضع للشروط العادلة الموضحة أدناه."
                : isDe
                ? "Der GermanJobsPro PRO Pass ist eine digitale Softwarelizenz, die nach erfolgreicher Zahlung sofort freigeschaltet wird und 90 Tage lang uneingeschränkten Zugang zu KI-Bewerbungstools, dem Bewerbungsmappe-Studio und DIN 5008 Vorlagen gewährt. Aufgrund der sofortigen digitalen Bereitstellung gelten die nachfolgenden Bedingungen."
                : "The GermanJobsPro PRO Pass is an instant digital software license granting 90 consecutive days of access (a full job application cycle) to our AI cover letter generators, Bewerbungsmappe Dossier Studio, DIN 5008 builders, and ATS audit tools. Because digital features are delivered immediately upon checkout, refund requests are evaluated under the criteria below."}
            </p>
          </section>

          {/* Section 2: Eligible Cases */}
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400">2.</span>
              <span>{isAr ? "الحالات المؤهلة لاسترداد الأموال بنسبة 100%" : isDe ? "2. Berechtigte Gründe für eine vollständige Erstattung" : "2. Cases Eligible for a 100% Full Refund"}</span>
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm list-disc list-inside text-slate-300">
              <li>
                <strong>{isAr ? "أعطال تقنية مؤكدة:" : isDe ? "Technische Defekte:" : "Confirmed Technical Malfunctions:"}</strong>{" "}
                {isAr
                  ? "وجود عطل في تصدير ملف الـ PDF أو فشل دائم في محرك الذكاء الاصطناعي منعك من الاستفادة من الخدمة، ولم يتم إصلاحه خلال 48 ساعة من إبلاغ الدعم."
                  : isDe
                  ? "Fehler beim Rendern oder Herunterladen von PDF-Unterlagen bzw. anhaltende Systemausfälle, die innerhalb von 48 Stunden nach Supportkontakt nicht behoben wurden."
                  : "Inability to export PDF documents or unresolvable AI rendering failures reported to support and not rectified within 48 hours."}
              </li>
              <li>
                <strong>{isAr ? "تكرار الدفع (Duplicate Charge):" : isDe ? "Doppelbuchungen:" : "Duplicate Billing / Overcharge:"}</strong>{" "}
                {isAr
                  ? "إذا تسبب خطأ مصرفي أو تقني في خصم المبلغ أكثر من مرة لنفس الحساب ونفس الباقة، يتم إرجاع المبالغ المكررة فورياً وبشكل تلقائي."
                  : isDe
                  ? "Versehentliche Doppelabrechnungen desselben Kontos werden umgehend und vollständig erstattet."
                  : "Accidental multiple charges for the same user account or pass are refunded immediately."}
              </li>
              <li>
                <strong>{isAr ? "فشل التفعيل التلقائي:" : isDe ? "Fehlgeschlagene Freischaltung:" : "Non-Activation of Account:"}</strong>{" "}
                {isAr
                  ? "إذا سددت المبلغ ولم تُفعّل باقة PRO Pass على حسابك بسبب خطأ في بوابة الدفع، وفشل التدخل التقني اليدوي خلال 24 ساعة."
                  : isDe
                  ? "Wenn der PRO Pass nach erfolgreicher Transaktion technisch nicht aktiviert werden konnte und keine manuelle Freischaltung innerhalb von 24 Stunden erfolgte."
                  : "If payment completed successfully but PRO Pass privileges failed to activate and could not be resolved within 24 hours."}
              </li>
            </ul>
          </section>

          {/* Section 3: Non-eligible Cases */}
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-rose-400">3.</span>
              <span>{isAr ? "الحالات غير المؤهلة للاسترداد" : isDe ? "3. Fälle ohne Anspruch auf Rückerstattung" : "3. Non-Refundable Situations"}</span>
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm list-disc list-inside text-slate-300">
              <li>
                <strong>{isAr ? "عدم الحصول على وظيفة أو تأشيرة:" : isDe ? "Keine Jobzusage oder Visumsablehnung:" : "No Job Offer or Visa Rejection:"}</strong>{" "}
                {isAr
                  ? "GermanJobsPro أداة برمجية ومساعدة تنسيقية وليست مكتب توظيف أو جهة هجرة. قرارات القبول والرفض تعود حصرياً لأصحاب العمل والسفارات، ولا تشكل أساساً قانونياً للمطالبة باسترداد الرسوم."
                  : isDe
                  ? "GermanJobsPro ist ein Software-Werkzeug und keine Arbeitsvermittlung. Absagen von Arbeitgebern oder behördliche Ablehnungen begründen keinen Rückerstattungsanspruch."
                  : "GermanJobsPro provides software formatting tools, not recruitment or immigration services. Hiring outcomes or visa decisions by third parties do not qualify for refunds."}
              </li>
              <li>
                <strong>{isAr ? "الاستهلاك الكامل للخدمة وتغيير الرأي الشخصي:" : isDe ? "Vollständige Nutzung & Meinungsänderung:" : "Exhausted AI Quotas & Change of Mind:"}</strong>{" "}
                {isAr
                  ? "المطالبات المقدمة بعد إنشاء المستندات وتنزيل السير الذاتية وخطابات الدافع واستنزاف حصص الذكاء الاصطناعي بنجاح، بناءً على تغيير الرأي فقط."
                  : isDe
                  ? "Rückerstattungsanträge nach erfolgreichem Erstellen, Herunterladen von Dokumenten und Ausschöpfen von KI-Quotas ohne Vorliegen technischer Mängel."
                  : "Requests submitted after full utilization of AI quotas and successful download of finished application documents solely due to personal change of mind."}
              </li>
              <li>
                <strong>{isAr ? "مخالفة شروط الاستخدام:" : isDe ? "Verstoß gegen Nutzungsbedingungen:" : "Violation of Terms of Service:"}</strong>{" "}
                {isAr
                  ? "الحسابات التي تم تجميدها بسبب أنشطة غير قانونية، أو سحب آلي (Scraping)، أو محاولات قرصنة واختراق للنظام."
                  : isDe
                  ? "Konten, die aufgrund von Missbrauch, Bots, Scraping oder Sicherheitsverstößen gesperrt werden mussten."
                  : "Accounts suspended due to abusive automated scraping, fraudulent activity, or violations of platform rules."}
              </li>
            </ul>
          </section>

          {/* Section 4: How to Request */}
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-blue-400">4.</span>
              <span>{isAr ? "إجراءات وخطوات تقديم طلب الاسترداد" : isDe ? "4. Ablauf der Rückerstattung" : "4. How to Request a Refund"}</span>
            </h3>
            <p>
              {isAr
                ? "لتقديم طلب استرداد خلال مهلة الـ 14 يوماً المحددة، يُرجى مراسلتنا عبر البريد الإلكتروني الرسمي مع ذكر التفاصيل التالية:"
                : isDe
                ? "Um eine Rückerstattung innerhalb der 14-tägigen Frist zu beantragen, senden Sie bitte eine E-Mail mit folgenden Angaben:"
                : "To initiate a refund request within the 14-day guarantee window, email our support team with the following details:"}
            </p>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm space-y-1.5 font-mono">
              <p>1. {isAr ? "البريد الإلكتروني المسجل في حساب GermanJobsPro" : "Registered GermanJobsPro Account Email"}</p>
              <p>2. {isAr ? "رقم الطلب أو معرف العملية المستلم في إيصال الدفع" : "Order ID or Transaction Number from your receipt"}</p>
              <p>3. {isAr ? "وصف مختصر للمشكلة التقنية مع لقطة شاشة إن وجدت" : "Brief description of the technical issue encountered (with screenshot if applicable)"}</p>
            </div>
          </section>

          {/* Section 5: Timeline & Method */}
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-blue-400">5.</span>
              <span>{isAr ? "المدة الزمنية وطريقة إرجاع الأموال" : isDe ? "5. Bearbeitungszeit & Rückzahlungsmethode" : "5. Processing Timeline & Refund Method"}</span>
            </h3>
            <p>
              {isAr
                ? "تتم مراجعة كافة الطلبات من قِبل الفريق المالي والتقني خلال 1 إلى 3 أيام عمل. في حال الموافقة، يتم إرسال المبلغ المسترد فورياً عبر بوابة الدفع المعتمدة (Lemon Squeezy) إلى نفس وسيلة الدفع الأصلية التي استخدمتها (بطاقة الائتمان، Apple Pay، أو PayPal). يستغرق ظهور المبلغ في كشف حسابك البنكي عادةً بين 5 إلى 10 أيام عمل وفقاً للإجراءات المصرفية الخاصة بالبنك المصدر لبطاقتك."
                : isDe
                ? "Erstattungsanträge werden innerhalb von 1–3 Werktagen geprüft. Nach Genehmigung erfolgt die Gutschrift automatisch über das ursprüngliche Zahlungsmittel (Kreditkarte, Apple Pay, PayPal) via Lemon Squeezy. Die Banklaufzeit beträgt in der Regel 5–10 Werktage."
                : "Refund requests are reviewed within 1 to 3 business days. Approved refunds are credited directly back to your original payment method (Credit Card, Apple Pay, Google Pay, or PayPal via Lemon Squeezy). Bank crediting typically takes 5 to 10 business days depending on your financial institution."}
            </p>
          </section>

          {/* Section 6: Contact */}
          <section className="p-6 sm:p-8 rounded-3xl bg-blue-950/40 border border-blue-500/20 space-y-3 text-center">
            <h3 className="text-base sm:text-lg font-bold text-white">
              {isAr ? "مركز الدعم والاستفسارات المالية" : isDe ? "Kontakt für Erstattungen & Abrechnung" : "Billing & Refund Contact"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              {isAr
                ? "يسعدنا دائماً تقديم المساعدة والإجابة عن أي استفسار يتعلق بالمدفوعات والاشتراكات عبر بريدنا المباشر:"
                : isDe
                ? "Unser Abrechnungsteam steht Ihnen für alle Fragen jederzeit gerne zur Verfügung:"
                : "Our billing support team is available to assist you with any questions regarding payments and refunds:"}
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
