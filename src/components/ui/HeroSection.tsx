"use client";

import React, { useState } from "react";

interface HeroSectionProps {
  headline?: string;
  subheading?: string;
  emailPlaceholder?: string;
  buttonText?: string;
  successMessage?: string;
  errorMessage?: string;
  locale?: string;
}

export default function HeroSection({
  headline = "بوابتك للعمل والاستقرار في ألمانيا",
  subheading = "دليلك الشامل والمحدّث يومياً لأحدث الوظائف الشاغرة، فرص التدريب المهني (Ausbildung)، وإرشادات التأشيرة بمعايير DIN 5008.",
  emailPlaceholder = "أدخل بريدك الإلكتروني هنا...",
  buttonText = "اشترك الآن",
  successMessage = "شكرًا للاشتراك! تم إرسال رابط تأكيد إلى بريدك الإلكتروني.",
  errorMessage = "الرجاء إدخال بريد إلكتروني صحيح.",
  locale = "ar",
}: HeroSectionProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [activeMockTab, setActiveMockTab] = useState<"cv" | "ats">("cv");

  const isAr = locale === "ar";
  const isDe = locale === "de";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16 sm:py-24 px-4 sm:px-8 lg:px-12 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl">
      {/* Subtle enterprise grid background */}
      <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:32px_32px]" />
      
      {/* Soft blue radiant ambient glow */}
      <div className="absolute top-1/4 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        
        {/* Left/Start Column: Text & Subscription */}
        <div className="lg:col-span-6 space-y-8 text-start flex flex-col items-start">
          
          {/* Trust Pill / DIN Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-900/90 text-blue-300 border border-blue-500/30 shadow-md backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-slate-300">DIN 5008</span>
            <span className="text-slate-500">•</span>
            <span>{isAr ? "المنظومة المهنية الأولى لألمانيا" : isDe ? "Offizieller deutscher Standard" : "Official German Standard"}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15] drop-shadow-xs">
            <span>{headline ? headline.replace(" 🇩🇪", "").replace("🇩🇪", "") : "بوابتك للعمل والاستقرار في ألمانيا"}</span>{" "}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://flagcdn.com/w40/de.png"
              alt="Germany Flag"
              className="inline-block w-8 h-5 sm:w-9 sm:h-6 rounded shadow-xs align-middle border border-slate-700 ms-1.5"
            />
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-xl">
            {subheading}
          </p>

          {/* Subscription / Quick Access Form */}
          <div className="w-full max-w-lg pt-2">
            <form
              onSubmit={handleSubmit}
              className="relative flex flex-col sm:flex-row gap-2.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 focus-within:border-blue-500/60 shadow-lg backdrop-blur-md transition-all"
            >
              <div className="relative flex-1">
                <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  disabled={status === "loading" || status === "success"}
                  placeholder={emailPlaceholder}
                  className="w-full bg-transparent py-3 ps-12 pe-4 text-sm text-white placeholder-slate-400 focus:outline-hidden disabled:opacity-50 text-start"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className="font-bold text-sm px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30 active:scale-98 disabled:opacity-75 cursor-pointer flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{isAr ? "جاري الإرسال..." : "Wird gesendet..."}</span>
                  </>
                ) : (
                  <span>{buttonText}</span>
                )}
              </button>
            </form>

            {/* Form Messages */}
            <div className="h-6 mt-2.5 text-xs text-start">
              {status === "success" && (
                <p className="text-emerald-400 flex items-center gap-1.5">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  {successMessage}
                </p>
              )}
              {status === "error" && (
                <p className="text-rose-400 flex items-center gap-1.5">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  {errorMessage}
                </p>
              )}
            </div>
          </div>

          {/* Social Proof Metrics Strip */}
          <div className="w-full pt-4 grid grid-cols-3 gap-3 sm:gap-4 border-t border-slate-800/80">
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight flex items-center gap-1">
                <span className="text-blue-500">+</span>1,500
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-tight">
                {isAr ? "سيرة ذاتية ألمانية أنشئت" : isDe ? "Bewerbungen erstellt" : "German CVs generated"}
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight flex items-center gap-1">
                94<span className="text-sm text-emerald-500">%</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-tight">
                {isAr ? "نسبة اجتياز فلاتر ATS" : isDe ? "ATS-Erfolgsquote" : "ATS Match Pass Rate"}
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-tight flex items-center gap-1">
                4.9<span className="text-sm text-amber-500">★</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-tight">
                {isAr ? "تقييم الكفاءات والمهندسين" : isDe ? "Fachkräfte-Bewertung" : "Candidate Rating"}
              </p>
            </div>
          </div>

        </div>

        {/* Right/End Column: Interactive DIN 5008 Realistic CV & ATS Mockup */}
        <div className="lg:col-span-6 relative">
          
          {/* Subtle Ambient Glow underneath Mockup */}
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-emerald-500/20 rounded-3xl blur-xl -z-10 opacity-70" />

          {/* Interactive Mockup Container */}
          <div className="relative rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl">
            
            {/* Top Mockup Header Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-slate-400 font-mono text-[11px] ms-2 hidden sm:inline">
                  DIN-5008_Lebenslauf.pdf
                </span>
              </div>

              {/* Mockup Tabs */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveMockTab("cv")}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    activeMockTab === "cv"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {isAr ? "معاينة DIN 5008" : isDe ? "DIN 5008 Vorschau" : "DIN 5008 Preview"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMockTab("ats")}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeMockTab === "ats"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>94% ATS</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </button>
              </div>
            </div>

            {/* Document Content / ATS View */}
            {activeMockTab === "cv" ? (
              <div className="p-5 sm:p-6 space-y-4 text-start font-sans text-xs bg-slate-950/60">
                
                {/* CV Header with Photo Mockup & DIN Meta */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold uppercase">
                      Tabellarischer Lebenslauf
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                      Mohamed Fri
                    </h3>
                    <p className="text-blue-400 font-semibold text-[11px]">
                      IT-Projektmanager & Cloud Systems
                    </p>
                    <p className="text-slate-400 text-[10px] flex items-center gap-2 pt-0.5">
                      <span>📍 Frankfurt am Main / Oujda</span>
                      <span>•</span>
                      <span>✉️ kontakt@mohamed-fri.de</span>
                    </p>
                  </div>

                  {/* Professional Avatar Mockup with DIN Compliance Badge */}
                  <div className="relative shrink-0">
                    <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-lg bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs shadow-inner">
                      <span className="text-lg">👔</span>
                      <span className="text-[9px] text-slate-400 font-mono">Bewerbungsfoto</span>
                    </div>
                    <span className="absolute -bottom-1 -end-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-bold text-[9px] shadow-xs flex items-center gap-0.5">
                      ✓ DIN
                    </span>
                  </div>
                </div>

                {/* CV Section 1: Beruflicher Werdegang */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-200 border-b border-slate-800/80 pb-1">
                    <span className="uppercase tracking-wider text-blue-400">Beruflicher Werdegang</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-normal">Substantivstil ✓</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-[11px]">
                      <div className="col-span-4 sm:col-span-3 text-slate-400 font-mono text-[10px]">
                        08/2022 – Heute
                      </div>
                      <div className="col-span-8 sm:col-span-9 space-y-1">
                        <div className="font-bold text-white">
                          Senior IT-Projektleiter • <span className="text-slate-300 font-normal">TechSolutions GmbH</span>
                        </div>
                        <ul className="text-slate-400 space-y-0.5 text-[10px] list-disc list-inside">
                          <li>Leitung agiler Softwareprojekte (Scrum) für DAX-Kunden</li>
                          <li>Optimierung von Cloud-Infrastrukturen mit 35% Effizienzsteigerung</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CV Section 2: Ausbildung */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-200 border-b border-slate-800/80 pb-1">
                    <span className="uppercase tracking-wider text-blue-400">Ausbildung & Qualifikation</span>
                    <span className="text-[10px] text-slate-400 font-mono">GeR C1/C2</span>
                  </div>
                  
                  <div className="grid grid-cols-12 gap-2 text-[11px]">
                    <div className="col-span-4 sm:col-span-3 text-slate-400 font-mono text-[10px]">
                      2018 – 2021
                    </div>
                    <div className="col-span-8 sm:col-span-9">
                      <div className="font-bold text-white">
                        B.Sc. Informatik & Wirtschaftsinformatik
                      </div>
                      <p className="text-slate-400 text-[10px]">
                        Schwerpunkt: Enterprise IT-Architektur & Informationssicherheit
                      </p>
                    </div>
                  </div>
                </div>

                {/* CV Badges Strip */}
                <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-800">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px]">
                    🇩🇪 Deutsch: C1 (Verhandlungssicher)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px]">
                    AWS Cloud Architect
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono text-[10px]">
                    + CIH Bank Stipendiat
                  </span>
                </div>

              </div>
            ) : (
              /* ATS Score Tab */
              <div className="p-5 sm:p-6 space-y-4 text-start font-sans text-xs bg-slate-950/60">
                <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                      German ATS Matching Engine
                    </span>
                    <div className="text-2xl font-black text-white font-mono flex items-center gap-2">
                      <span className="text-emerald-400">94 / 100</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-sans font-bold">
                        Hervorragend
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center text-emerald-400 font-bold font-mono text-sm shadow-md shadow-emerald-500/20">
                    94%
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">DIN 5008 Formatierungs-Konformität</span>
                      <span className="text-emerald-400 font-mono font-bold">100%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-full" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">Substantivstil & Deutsche Fachtermini</span>
                      <span className="text-emerald-400 font-mono font-bold">96%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[96%]" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">GeR-Sprachlevel Mapping (CEFR)</span>
                      <span className="text-blue-400 font-mono font-bold">92%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-[92%]" />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>✓</span>
                    <span>Bereit für deutsche Bewerbungsportale (Workday, Personio, SAP SuccessFactors)</span>
                  </div>
                  <p className="text-slate-400 text-[10px]">
                    Keine Parsing-Fehler. Tabellen und Datumsformate werden zu 100% fehlerfrei von Algorithmen ausgelesen.
                  </p>
                </div>
              </div>
            )}

            {/* Bottom floating Verified Banner */}
            <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-emerald-400">🛡️</span>
                <span className="font-medium">{isAr ? "متوافق 100% مع معايير الشركات الألمانية" : "100% Konform mit deutschen Arbeitgebern"}</span>
              </div>
              <span className="text-slate-400 font-mono text-[10px]">
                v3.4 Enterprise
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
