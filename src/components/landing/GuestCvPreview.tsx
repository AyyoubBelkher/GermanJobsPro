"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { serializeGuestCvDraft, GUEST_CV_DRAFT_KEY } from "@/lib/guest-cv-draft";

interface GuestCvPreviewProps {
  locale: string;
}

const getGermanLevels = (locale: string) => {
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const isFr = locale === "fr";
  return [
    {
      value: "A1",
      label: isAr
        ? "A1 (مبتدئ)"
        : isDe
        ? "A1 (Anfänger)"
        : isFr
        ? "A1 (Débutant)"
        : "A1 (Beginner)",
    },
    {
      value: "A2",
      label: isAr
        ? "A2 (أساسي)"
        : isDe
        ? "A2 (Grundkenntnisse)"
        : isFr
        ? "A2 (Élémentaire)"
        : "A2 (Elementary)",
    },
    {
      value: "B1",
      label: isAr
        ? "B1 (متوسط)"
        : isDe
        ? "B1 (Mittelstufe)"
        : isFr
        ? "B1 (Intermédiaire)"
        : "B1 (Intermediate)",
    },
    {
      value: "B2",
      label: isAr
        ? "B2 (فوق المتوسط - المعيار القياسي)"
        : isDe
        ? "B2 (Fließend - Standard)"
        : isFr
        ? "B2 (Courant - Standard)"
        : "B2 (Upper-Intermediate - Standard)",
    },
    {
      value: "C1",
      label: isAr
        ? "C1 (متقدم)"
        : isDe
        ? "C1 (Verhandlungssicher)"
        : isFr
        ? "C1 (Avancé)"
        : "C1 (Advanced)",
    },
    {
      value: "C2",
      label: isAr
        ? "C2 / اللغة الأم"
        : isDe
        ? "C2 / Muttersprache"
        : isFr
        ? "C2 / Langue maternelle"
        : "C2 / Native",
    },
  ];
};

export default function GuestCvPreview({ locale }: GuestCvPreviewProps) {
  const router = useRouter();
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const isFr = locale === "fr";
  const dir = isAr ? "rtl" : "ltr";
  const germanLevels = getGermanLevels(locale);

  // Form state initialized with German demo defaults
  const [fullName, setFullName] = useState(isDe ? "Max Mustermann" : "Tariq Mansour");
  const [targetJobTitle, setTargetJobTitle] = useState(
    isDe
      ? "Softwareentwickler (Frontend)"
      : isFr
      ? "Développeur Frontend (React)"
      : "Software Engineer (Frontend)"
  );
  const [location, setLocation] = useState("Berlin, Deutschland");
  const [currentRole, setCurrentRole] = useState(
    isDe
      ? "Frontend Entwickler"
      : isFr
      ? "Développeur Web Frontend"
      : "Frontend Web Developer"
  );
  const [keyBullet, setKeyBullet] = useState(
    isDe
      ? "Entwicklung modularer Komponenten mit React & Optimierung der Ladezeiten um 35 %"
      : isFr
      ? "Développement de composants React/Next.js évolutifs et optimisation des performances web"
      : "Engineered scalable React/Next.js components and boosted core web vitals"
  );
  const [languageLevel, setLanguageLevel] = useState("B2");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAndExport = () => {
    setIsSaving(true);
    try {
      const draftJson = serializeGuestCvDraft({
        fullName,
        targetJobTitle,
        location,
        currentRole,
        keyBullet,
        languageLevel,
        language: "de",
      });

      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.setItem(GUEST_CV_DRAFT_KEY, draftJson);
      }

      const nextUrl = `/${locale}/dashboard/cv/new`;
      router.push(`/${locale}/auth/signup?next=${encodeURIComponent(nextUrl)}`);
    } catch (e) {
      console.error("[GuestCvPreview]: Error saving draft to sessionStorage", e);
      setIsSaving(false);
      router.push(`/${locale}/auth/signup?next=${encodeURIComponent(`/${locale}/dashboard/cv/new`)}`);
    }
  };

  const ctaText = isAr
    ? "حفظ وتصدير PDF (مجاناً) ←"
    : isDe
    ? "Speichern & PDF exportieren (Kostenlos) →"
    : isFr
    ? "Enregistrer & Exporter PDF (Gratuit) →"
    : "Save & Export PDF (Free) →";

  return (
    <div className="w-full rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-8 lg:p-10 text-white space-y-8">
      {/* Section Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <span>⚡</span>
          <span>
            {isAr
              ? "معاينة فورية مجانية بدون تسجيل"
              : isDe
              ? "Interaktive Live-Vorschau (DIN 5008)"
              : isFr
              ? "Aperçu interactif direct (DIN 5008)"
              : "Instant Interactive Live Preview (DIN 5008)"}
          </span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          {isAr ? (
            <>
              جرب بنفسك: سيرة ذاتية ألمانية طبقاً لمعيار{" "}
              <span className="text-amber-400">DIN 5008</span> في ثوانٍ
            </>
          ) : isDe ? (
            <>
              In wenigen Sekunden: Ihr tabellarischer Lebenslauf nach{" "}
              <span className="text-amber-400">DIN 5008</span>
            </>
          ) : isFr ? (
            <>
              Votre CV allemand selon la norme{" "}
              <span className="text-amber-400">DIN 5008</span> en direct
            </>
          ) : (
            <>
              Live DIN 5008 German CV Mini-Preview:{" "}
              <span className="text-amber-400">Try It Live</span>
            </>
          )}
        </h2>

        <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          {isAr
            ? "املأ الحقول السريعة أدناه وشاهد بطاقة السيرة الذاتية تتحدث مباشرة بتنسيق التوظيف الألماني المعتمد. احفظ مسودتك بضغطة زر واحدة."
            : isDe
            ? "Geben Sie Ihre Eckdaten ein und sehen Sie in Echtzeit, wie Ihr Lebenslauf nach deutschem Standard formatiert wird. Kostenlos speichern und mitnehmen."
            : isFr
            ? "Remplissez les champs ci-dessous et visualisez en temps réel la mise en page allemande standard DIN 5008."
            : "Fill in 5 quick fields to instantly see how German recruiters see your profile under DIN 5008 standards. Save and export for free."}
        </p>
      </div>

      {/* Main 2-Column Interactive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Quick Fields Form (dir depends on site locale) */}
        <div
          dir={dir}
          className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isAr
                ? "1. البيانات السريعة"
                : isDe
                ? "1. Schnelleingabe"
                : isFr
                ? "1. Champs rapides"
                : "1. Quick Fields"}
            </span>
            <span className="text-[11px] text-amber-400 font-semibold">
              {isAr
                ? "تحديث حي ومباشر ⚡"
                : isDe
                ? "Echtzeit-Vorschau ⚡"
                : isFr
                ? "Mise à jour en direct ⚡"
                : "Live Real-Time Update ⚡"}
            </span>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">
              {isAr
                ? "الاسم الكامل (Full Name)"
                : isDe
                ? "Vollständiger Name"
                : isFr
                ? "Nom complet"
                : "Full Name"}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Max Mustermann"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-blue-500 focus:outline-hidden transition-colors"
            />
          </div>

          {/* Target Job Title in Germany */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">
              {isAr
                ? "المسمى الوظيفي المستهدف في ألمانيا"
                : isDe
                ? "Angestrebte Position in Deutschland"
                : isFr
                ? "Poste visé en Allemagne"
                : "Target Job Title in Germany"}
            </label>
            <input
              type="text"
              value={targetJobTitle}
              onChange={(e) => setTargetJobTitle(e.target.value)}
              placeholder={
                isDe
                  ? "z. B. Softwareentwickler / Pflegefachkraft"
                  : isFr
                  ? "ex. Développeur / Infirmier"
                  : "e.g. Software Engineer / Nurse"
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-blue-500 focus:outline-hidden transition-colors"
            />
          </div>

          {/* City / Country */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">
              {isAr
                ? "المدينة والدولة الحالية"
                : isDe
                ? "Wohnort / Land"
                : isFr
                ? "Ville / Pays"
                : "City / Country"}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Berlin, Deutschland"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-blue-500 focus:outline-hidden transition-colors"
            />
          </div>

          {/* Current / Last Role */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">
              {isAr
                ? "الوظيفة الحالية أو الأخيرة (Role)"
                : isDe
                ? "Aktuelle / Letzte Position"
                : isFr
                ? "Poste actuel ou dernier poste"
                : "Current / Last Role"}
            </label>
            <input
              type="text"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              placeholder={
                isDe
                  ? "Frontend Entwickler"
                  : isFr
                  ? "Développeur Frontend"
                  : "Frontend Developer"
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-blue-500 focus:outline-hidden transition-colors"
            />
          </div>

          {/* Key Bullet / Achievement */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">
              {isAr
                ? "أهم مهمة أو إنجاز مهني (Key Bullet)"
                : isDe
                ? "Wichtigste Aufgabe / Erfolg (Bullet Point)"
                : isFr
                ? "Réalisation clé / Mission principale"
                : "Key Bullet Point / Achievement"}
            </label>
            <textarea
              rows={2}
              value={keyBullet}
              onChange={(e) => setKeyBullet(e.target.value)}
              placeholder={
                isDe
                  ? "Entwicklung von React-Komponenten & Optimierung der Performance"
                  : isFr
                  ? "Développement de composants React & optimisation des performances"
                  : "Engineered React components & improved application performance"
              }
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-blue-500 focus:outline-hidden transition-colors resize-none"
            />
          </div>

          {/* German Language Level */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">
              {isAr
                ? "مستوى اللغة الألمانية (CEFR)"
                : isDe
                ? "Deutschkenntnisse (GER)"
                : isFr
                ? "Niveau d'allemand (CECRL)"
                : "German Level (CEFR)"}
            </label>
            <select
              value={languageLevel}
              onChange={(e) => setLanguageLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-blue-500 focus:outline-hidden transition-colors cursor-pointer"
            >
              {germanLevels.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 leading-relaxed">
            {isAr
              ? "🔒 خصوصية 100%: تتم المعالجة بالكامل داخل متصفحك دون إرسال أي بيانات أو طلبات إلى السيرفر."
              : isDe
              ? "🔒 100% clientseitig: Verarbeitung erfolgt direkt im Browser – ohne Server-Übertragung bis zum Speichern."
              : isFr
              ? "🔒 100 % côté client : traitement entièrement dans votre navigateur sans aucun appel serveur avant sauvegarde."
              : "🔒 100% Client-Side: Processed entirely in your browser with zero server calls until you choose to save."}
          </div>
        </div>

        {/* Right Side: LIVE DIN 5008 GERMAN CV PREVIEW CARD (STRICT dir="ltr") */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {isAr
                  ? "معاينة بطاقة DIN 5008 الألمانية المعتمدة"
                  : isDe
                  ? "DIN 5008 Tabellarische Vorschau"
                  : isFr
                  ? "Aperçu du CV tabulaire DIN 5008"
                  : "DIN 5008 Tabular CV Preview"}
              </span>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono">
              {isAr
                ? "DIN 5008 • متوافق مع ATS"
                : isDe
                ? "DIN 5008 • ATS-konform"
                : isFr
                ? "DIN 5008 • Compatible ATS"
                : "DIN 5008 • ATS-Compliant"}
            </span>
          </div>

          {/* Authentic German CV Preview Sheet: Forced LTR for German Recruiter Standard */}
          <div
            dir="ltr"
            className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 p-6 sm:p-8 space-y-6 font-sans text-start selection:bg-blue-100"
          >
            {/* CV Sheet Top Bar: Document Type & Candidate Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
                  {fullName || "Vorname Nachname"}
                </h1>
                <p className="text-xs sm:text-sm font-bold text-blue-700 mt-0.5">
                  {targetJobTitle || "Angestrebte Position in Deutschland"}
                </p>
              </div>

              <div className="text-right text-[11px] text-slate-600 space-y-0.5">
                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 font-mono text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lebenslauf
                </span>
                <p className="font-medium text-slate-800">{location || "Wohnort, Land"}</p>
                <p className="text-slate-500">bewerber@email.de • +49 (0) 151 0000000</p>
              </div>
            </div>

            {/* Section: BERUFLICHER WERDEGANG (Experience) */}
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>Beruflicher Werdegang</span>
                <span className="text-[10px] font-normal text-slate-500 lowercase">antichronologisch</span>
              </h2>

              <div className="grid grid-cols-12 gap-3 text-xs leading-relaxed">
                <div className="col-span-4 sm:col-span-3 font-semibold text-slate-500 text-[11px]">
                  01/2023 – Heute
                </div>
                <div className="col-span-8 sm:col-span-9 space-y-1">
                  <div className="flex flex-wrap items-baseline gap-1.5">
                    <strong className="text-slate-950 text-xs font-bold">
                      {currentRole || "Aktuelle Position"}
                    </strong>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-700 font-medium">Technologieunternehmen</span>
                    <span className="text-slate-500 text-[11px]">({location || "Berlin"})</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-700 space-y-1 text-[11.5px] marker:text-blue-600">
                    <li>
                      {keyBullet ||
                        "Verantwortlich für die fachgerechte Umsetzung und Qualitätssicherung nach deutschen Standards"}
                    </li>
                    <li className="text-slate-500">
                      Erfolgreiche Zusammenarbeit im agilen Team und kontinuierliche Prozessoptimierung
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section: AUSBILDUNG & STUDIUM (Education) */}
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                Ausbildung & Studium
              </h2>

              <div className="grid grid-cols-12 gap-3 text-xs leading-relaxed">
                <div className="col-span-4 sm:col-span-3 font-semibold text-slate-500 text-[11px]">
                  10/2018 – 09/2022
                </div>
                <div className="col-span-8 sm:col-span-9 space-y-0.5">
                  <div className="flex flex-wrap items-baseline gap-1.5">
                    <strong className="text-slate-950 text-xs font-bold">
                      Staatlich anerkannter Hochschulabschluss (Bachelor)
                    </strong>
                  </div>
                  <p className="text-slate-600 text-[11.5px]">
                    Staatliche Universität • Fachbereich {targetJobTitle ? targetJobTitle.split(" ")[0] : "Informatik"}
                  </p>
                  <p className="text-[11px] text-slate-500">Abschlussnote: Gut (1,8) • Anabin H+ Status</p>
                </div>
              </div>
            </div>

            {/* Section: SPRACHKENNTNISSE (Languages) */}
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                Sprachkenntnisse (GER)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="font-bold text-slate-800">Deutsch:</span>
                  <span className="font-semibold text-blue-700">
                    {languageLevel} – {languageLevel === "B2" ? "Fließend in Wort und Schrift" : languageLevel === "C1" || languageLevel === "C2" ? "Verhandlungssicher" : "Gute Grundkenntnisse"}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="font-bold text-slate-800">Englisch:</span>
                  <span className="font-semibold text-slate-700">B2 – Fließend</span>
                </div>
              </div>
            </div>

            {/* Section: Ort, Datum & Unterschrift (DIN 5008 German Formality Requirement) */}
            <div className="pt-2 border-t border-slate-100 flex items-end justify-between text-[11px] text-slate-500">
              <div>
                <p className="text-slate-700 font-medium" suppressHydrationWarning>
                  {location || "Berlin"}, den {new Date().toLocaleDateString("de-DE", { timeZone: "UTC" })}
                </p>
                <p className="text-[10px] text-slate-400 italic mt-1 font-serif tracking-wide">
                  {fullName || "Unterschrift"}
                </p>
              </div>
              <div className="text-right text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                ✓ DIN 5008 Konform
              </div>
            </div>
          </div>

          {/* Primary Call to Action Button */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 border border-blue-500/40 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-extrabold text-white">
                {isAr
                  ? "أعجبك التنسيق؟ احفظ مسودتك الآن وصدّرها مجاناً"
                  : isDe
                  ? "Gefällt Ihnen die Formatierung? Jetzt kostenlos speichern"
                  : isFr
                  ? "Vous aimez la mise en page ? Enregistrez-la gratuitement"
                  : "Ready to export your DIN 5008 CV? Save it for free"}
              </h4>
              <p className="text-[11px] text-slate-300">
                {isAr
                  ? "سيتم نقل بياناتك فوراً إلى محرر السيرة الذاتية بعد التسجيل."
                  : isDe
                  ? "Ihr Entwurf wartet nach der Registrierung sofort in Ihrem Dashboard."
                  : isFr
                  ? "Votre brouillon sera prêt à être personnalisé dans votre tableau de bord après inscription."
                  : "Your draft will be waiting in your dashboard ready to customize."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveAndExport}
              disabled={isSaving}
              className="py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-400/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  <span>
                    {isAr
                      ? "جاري الحفظ..."
                      : isDe
                      ? "Wird gespeichert..."
                      : isFr
                      ? "Enregistrement..."
                      : "Saving draft..."}
                  </span>
                </>
              ) : (
                <>
                  <span>{ctaText}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
