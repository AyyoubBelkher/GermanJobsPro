"use client";

import React, { useState, useEffect } from "react";

export interface Experience {
  id: string;
  position: string;
  company: string;
  city?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  city?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

export interface LanguageItem {
  language: string;
  level: string;
}

export interface CVData {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    birthDate?: string;
    birthPlace?: string;
    nationality?: string;
    maritalStatus?: string;
    targetJobTitle?: string;
    photoUrl?: string;
    summary: string;
  };
  experience: Experience[];
  education: Education[];
  skills: string[];
  languages: LanguageItem[];
}

export interface ATSImportedFix {
  cvData: CVData;
  originalScore: number;
  projectedScore: number;
  appliedFixes: string[];
  unverifiedSkills: string[];
}

export interface LebenslaufToolProps {
  importedFix?: ATSImportedFix | null;
  onClearImportedFix?: () => void;
}

const initialData: CVData = {
  personal: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    birthDate: "",
    birthPlace: "",
    nationality: "",
    maritalStatus: "",
    targetJobTitle: "",
    photoUrl: "",
    summary: "",
  },
  experience: [
    {
      id: "exp-1",
      position: "",
      company: "",
      city: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "",
      institution: "",
      city: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
    },
  ],
  skills: [],
  languages: [
    { language: "Deutsch", level: "B2" },
    { language: "Englisch", level: "B2" },
  ],
};

export default function LebenslaufTool({
  importedFix,
  onClearImportedFix,
}: LebenslaufToolProps) {
  const [data, setData] = useState<CVData>(initialData);
  const [step, setStep] = useState<number>(1);
  const [template, setTemplate] = useState<"modern" | "classic">("modern");
  const [newSkill, setNewSkill] = useState("");
  const [addedSkillsSet, setAddedSkillsSet] = useState<Set<string>>(new Set());

  // Merge importedFix when provided
  useEffect(() => {
    if (!importedFix) return;

    setData((prev) => {
      const incoming = importedFix.cvData;
      return {
        personal: {
          ...incoming.personal,
          photoUrl: incoming.personal?.photoUrl || prev.personal.photoUrl || "",
          summary: incoming.personal?.summary || "",
        },
        experience: Array.isArray(incoming.experience)
          ? incoming.experience.map((exp, idx) => ({
              ...exp,
              id: exp.id || `exp-${idx + 1}-${Date.now()}`,
            }))
          : [],
        education: Array.isArray(incoming.education)
          ? incoming.education.map((edu, idx) => ({
              ...edu,
              id: edu.id || `edu-${idx + 1}-${Date.now()}`,
            }))
          : [],
        skills: Array.isArray(incoming.skills) ? [...incoming.skills] : [],
        languages: Array.isArray(incoming.languages) && incoming.languages.length > 0
          ? [...incoming.languages]
          : [{ language: "Deutsch", level: "B1" }],
      };
    });

    // Jump straight to preview so candidate immediately views the fixed German CV
    setStep(4);
  }, [importedFix]);

  const handlePrint = () => {
    window.print();
  };

  const handleAddSkillFromChip = (skill: string) => {
    if (!data.skills.includes(skill)) {
      setData((prev) => ({
        ...prev,
        skills: [...prev.skills, skill],
      }));
      setAddedSkillsSet((prev) => new Set([...prev, skill]));
    }
  };

  const addSkillManually = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !data.skills.includes(trimmed)) {
      setData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const addExperience = () => {
    setData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: `exp-${Date.now()}`,
          position: "",
          company: "",
          city: "",
          startDate: "",
          endDate: "",
          isCurrent: false,
          description: "",
        },
      ],
    }));
  };

  const removeExperience = (id: string) => {
    setData((prev) => ({
      ...prev,
      experience: prev.experience.filter((e) => e.id !== id),
    }));
  };

  const addEducation = () => {
    setData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: `edu-${Date.now()}`,
          degree: "",
          institution: "",
          city: "",
          startDate: "",
          endDate: "",
          isCurrent: false,
          description: "",
        },
      ],
    }));
  };

  const removeEducation = (id: string) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id),
    }));
  };

  const addLanguage = () => {
    setData((prev) => ({
      ...prev,
      languages: [...prev.languages, { language: "", level: "B1" }],
    }));
  };

  const removeLanguage = (index: number) => {
    setData((prev) => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 font-sans" dir="rtl">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .cv-print-area,
          .cv-print-area * {
            visibility: visible;
          }
          .cv-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 20mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* CREDIBILITY & TRANSPARENCY BANNER */}
      {importedFix && (
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border border-emerald-500/40 p-6 md:p-8 shadow-2xl space-y-6 no-print text-right">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-3.5 w-3.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white">
                تم تصحيح السيرة الذاتية بنجاح وفق المعايير الألمانية (DIN 5008)
              </h2>
            </div>
            {onClearImportedFix && (
              <button
                onClick={onClearImportedFix}
                className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-all cursor-pointer"
              >
                ✕ إغلاق التنبيه
              </button>
            )}
          </div>

          {/* Score Improvement Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-sm text-slate-400 font-medium">النتيجة السابقة:</span>
              <span className="text-xl font-bold text-slate-300">{importedFix.originalScore}%</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <span className="text-sm text-emerald-300 font-medium">النتيجة المتوقعة بعد التحسين:</span>
              <span className="text-2xl font-black text-emerald-400">+{importedFix.projectedScore}%</span>
            </div>
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
              <span className="text-sm text-blue-300 font-medium">المعيار المطبق:</span>
              <span className="text-sm font-bold text-blue-200">DIN 5008 / Substantivstil</span>
            </div>
          </div>

          {/* Applied Fixes List */}
          {importedFix.appliedFixes?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                التحسينات المهنية والهيكلية التي تم تطبيقها فعلياً على بياناتك:
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-200">
                {importedFix.appliedFixes.map((fix, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{fix}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Unverified Skills / Honesty Box */}
          {importedFix.unverifiedSkills?.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-amber-300">
                <span className="text-lg">🛡️</span>
                <h4 className="text-sm md:text-base font-bold">
                  مهارات لم نضفها تلقائياً حفاظاً على مصداقيتك في المقابلة (أضفها فقط إذا كنت تتقنها فعلاً):
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                أنظمة ATS تبحث عن هذه الكلمات المفتاحية للوظيفة المستهدفة، لكن بما أنها لم تكن موجودة في ملفك الأصلي، لم نقم باختلاقها تلقائياً. انقر على أي مهارة تتقنها لإضافتها بصدق إلى سيرتك:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {importedFix.unverifiedSkills.map((skill, idx) => {
                  const isAdded = data.skills.includes(skill) || addedSkillsSet.has(skill);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddSkillFromChip(skill)}
                      disabled={isAdded}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isAdded
                          ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default"
                          : "bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40 active:scale-95"
                      }`}
                    >
                      <span>{isAdded ? "✓ تم الإضافة:" : "+ أضف:"}</span>
                      <span dir="ltr">{skill}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold border border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              مراجعة وتعديل البيانات (الخطوات 1–3) ✏️
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-black shadow-lg shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>تحميل PDF المصحح الآن</span>
              <span>📥</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP NAVIGATION TABS */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800 no-print">
        {[
          { num: 1, label: "1. المعلومات الشخصية" },
          { num: 2, label: "2. الخبرات والتعليم" },
          { num: 3, label: "3. المهارات واللغات" },
          { num: 4, label: "4. المعاينة والتحميل" },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setStep(s.num)}
            className={`flex-1 py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-center ${
              step === s.num
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* STEP 1: PERSONAL INFORMATION */}
      {step === 1 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 no-print">
          <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-4">
            المعلومات الشخصية (Persönliche Daten)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">الاسم الأول (Vorname)</label>
              <input
                type="text"
                value={data.personal.firstName}
                onChange={(e) => setData({ ...data, personal: { ...data.personal, firstName: e.target.value } })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Max"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم العائلة (Nachname)</label>
              <input
                type="text"
                value={data.personal.lastName}
                onChange={(e) => setData({ ...data, personal: { ...data.personal, lastName: e.target.value } })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Mustermann"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">المسمى الوظيفي المستهدف (Angestrebte Position)</label>
              <input
                type="text"
                value={data.personal.targetJobTitle || ""}
                onChange={(e) => setData({ ...data, personal: { ...data.personal, targetJobTitle: e.target.value } })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Softwareentwickler / Pflegefachkraft"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">البريد الإلكتروني (E-Mail)</label>
              <input
                type="email"
                value={data.personal.email}
                onChange={(e) => setData({ ...data, personal: { ...data.personal, email: e.target.value } })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                placeholder="max.mustermann@example.de"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">رقم الهاتف (Telefon)</label>
              <input
                type="text"
                value={data.personal.phone || ""}
                onChange={(e) => setData({ ...data, personal: { ...data.personal, phone: e.target.value } })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                placeholder="+49 170 1234567"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">المدينة والرمز البريدي (Wohnort & PLZ)</label>
              <input
                type="text"
                value={data.personal.city || ""}
                onChange={(e) => setData({ ...data, personal: { ...data.personal, city: e.target.value } })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                placeholder="10115 Berlin"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">تاريخ الميلاد (Geburtsdatum)</label>
              <input
                type="text"
                value={data.personal.birthDate || ""}
                onChange={(e) => setData({ ...data, personal: { ...data.personal, birthDate: e.target.value } })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                placeholder="01.01.1995"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">الجنسية (Staatsangehörigkeit)</label>
              <input
                type="text"
                value={data.personal.nationality || ""}
                onChange={(e) => setData({ ...data, personal: { ...data.personal, nationality: e.target.value } })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                placeholder="deutsch / syrisch / marokkanisch"
                dir="ltr"
              />
            </div>
          </div>

          {/* Full-Width Textarea for Kurzprofil / Summary */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                نبذة مهنية قصيرة (Kurzprofil - اختياري ومهم لأنظمة ATS)
              </label>
              <span className="text-[11px] text-blue-400 font-medium">Bewerbungsdeutsch</span>
            </div>
            <textarea
              rows={3}
              value={data.personal.summary}
              onChange={(e) => setData({ ...data, personal: { ...data.personal, summary: e.target.value } })}
              placeholder="Motivierter Softwareentwickler mit 3 Jahren Erfahrung in der Konzeption und Implementierung robuster Webanwendungen..."
              dir="ltr"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none leading-relaxed font-sans"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              يُدرج هذا الملخص في صدارة السيرة الذاتية (DIN 5008) لجذب خوارزميات الفرز ومسؤولي التوظيف.
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all cursor-pointer"
            >
              التالي: الخبرات والتعليم ←
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: EXPERIENCE & EDUCATION */}
      {step === 2 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-8 no-print">
          {/* Work Experience */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-bold text-white">الخبرات المهنية (Berufserfahrung)</h3>
              <button
                type="button"
                onClick={addExperience}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-bold border border-blue-500/30 transition-all cursor-pointer"
              >
                + إضافة خبرة عمل
              </button>
            </div>

            {data.experience.map((exp, idx) => (
              <div key={exp.id} className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">خبرة #{idx + 1}</span>
                  {data.experience.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExperience(exp.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      حذف
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" dir="ltr">
                  <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => {
                      const updated = [...data.experience];
                      updated[idx].position = e.target.value;
                      setData({ ...data, experience: updated });
                    }}
                    placeholder="Position (z.B. Frontend Entwickler)"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm"
                  />
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => {
                      const updated = [...data.experience];
                      updated[idx].company = e.target.value;
                      setData({ ...data, experience: updated });
                    }}
                    placeholder="Unternehmen (z.B. Siemens AG)"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm"
                  />
                  <input
                    type="text"
                    value={exp.startDate}
                    onChange={(e) => {
                      const updated = [...data.experience];
                      updated[idx].startDate = e.target.value;
                      setData({ ...data, experience: updated });
                    }}
                    placeholder="Von (z.B. 03/2021)"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm"
                  />
                  <input
                    type="text"
                    value={exp.endDate || ""}
                    onChange={(e) => {
                      const updated = [...data.experience];
                      updated[idx].endDate = e.target.value;
                      setData({ ...data, experience: updated });
                    }}
                    placeholder="Bis (z.B. heute oder 12/2023)"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm"
                  />
                </div>
                <textarea
                  rows={2}
                  value={exp.description || ""}
                  onChange={(e) => {
                    const updated = [...data.experience];
                    updated[idx].description = e.target.value;
                    setData({ ...data, experience: updated });
                  }}
                  placeholder="Aufgaben & Erfolge (z.B. • Entwicklung skalierbarer Web-Features)"
                  dir="ltr"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm"
                />
              </div>
            ))}
          </div>

          {/* Education */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-bold text-white">التعليم والتدريب (Ausbildung & Studium)</h3>
              <button
                type="button"
                onClick={addEducation}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-bold border border-blue-500/30 transition-all cursor-pointer"
              >
                + إضافة مؤهل تعليمي
              </button>
            </div>

            {data.education.map((edu, idx) => (
              <div key={edu.id} className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">مؤهل #{idx + 1}</span>
                  {data.education.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEducation(edu.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      حذف
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" dir="ltr">
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => {
                      const updated = [...data.education];
                      updated[idx].degree = e.target.value;
                      setData({ ...data, education: updated });
                    }}
                    placeholder="Abschluss (z.B. Bachelor of Science Informatik)"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm"
                  />
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => {
                      const updated = [...data.education];
                      updated[idx].institution = e.target.value;
                      setData({ ...data, education: updated });
                    }}
                    placeholder="Institution (z.B. TU München)"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm"
                  />
                  <input
                    type="text"
                    value={edu.startDate}
                    onChange={(e) => {
                      const updated = [...data.education];
                      updated[idx].startDate = e.target.value;
                      setData({ ...data, education: updated });
                    }}
                    placeholder="Von (z.B. 10/2017)"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm"
                  />
                  <input
                    type="text"
                    value={edu.endDate || ""}
                    onChange={(e) => {
                      const updated = [...data.education];
                      updated[idx].endDate = e.target.value;
                      setData({ ...data, education: updated });
                    }}
                    placeholder="Bis (z.B. 09/2020)"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm cursor-pointer"
            >
              → السابق: المعلومات الشخصية
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm cursor-pointer"
            >
              التالي: المهارات واللغات ←
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SKILLS & LANGUAGES */}
      {step === 3 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 no-print">
          <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-4">
            المهارات واللغات (Kenntnisse & Sprachen)
          </h3>

          {/* Skills Tag Management */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              المهارات والتقنيات (Fachliche Kompetenzen)
            </label>
            <div className="flex gap-2" dir="ltr">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkillManually();
                  }
                }}
                placeholder="z.B. React, TypeScript, Pflegedokumentation"
                className="flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
              />
              <button
                type="button"
                onClick={addSkillManually}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
              >
                + إضافة
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {data.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium"
                >
                  <span dir="ltr">{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-slate-400 hover:text-rose-400 text-sm leading-none cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                اللغات ومستوياتها (Sprachkenntnisse nach GeR)
              </label>
              <button
                type="button"
                onClick={addLanguage}
                className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer font-bold"
              >
                + إضافة لغة
              </button>
            </div>

            {data.languages.map((lang, idx) => (
              <div key={idx} className="flex gap-2 items-center" dir="ltr">
                <input
                  type="text"
                  value={lang.language}
                  onChange={(e) => {
                    const updated = [...data.languages];
                    updated[idx].language = e.target.value;
                    setData({ ...data, languages: updated });
                  }}
                  placeholder="Sprache (z.B. Deutsch)"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                />
                <select
                  value={lang.level}
                  onChange={(e) => {
                    const updated = [...data.languages];
                    updated[idx].level = e.target.value;
                    setData({ ...data, languages: updated });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                >
                  <option value="Muttersprache">Muttersprache</option>
                  <option value="C2">C2 (Exzellent)</option>
                  <option value="C1">C1 (Fachkundig)</option>
                  <option value="B2">B2 (Fließend)</option>
                  <option value="B1">B1 (Mittelstufe)</option>
                  <option value="A2">A2 (Grundkenntnisse)</option>
                  <option value="A1">A1 (Anfänger)</option>
                </select>
                {data.languages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLanguage(idx)}
                    className="p-2 text-rose-400 hover:text-rose-300 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm cursor-pointer"
            >
              → السابق: الخبرات والتعليم
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm cursor-pointer"
            >
              التالي: معاينة السيرة الذاتية ←
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PREVIEW & DOWNLOAD */}
      {step === 4 && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300">نمط التنسيق:</span>
              <button
                type="button"
                onClick={() => setTemplate("modern")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  template === "modern" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"
                }`}
              >
                عصري (Modern DIN)
              </button>
              <button
                type="button"
                onClick={() => setTemplate("classic")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  template === "classic" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"
                }`}
              >
                كلاسيكي (Klassisch)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                ✏️ تعديل البيانات
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                <span>طباعة / حفظ PDF</span>
                <span>🖨️</span>
              </button>
            </div>
          </div>

          {/* THE PRINTABLE CV CANVAS (DIN 5008 GERMAN TEMPLATE) */}
          <div
            className={`cv-print-area max-w-4xl mx-auto bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-2xl border border-slate-200 min-h-[1050px] font-sans ${
              template === "modern" ? "modern-cv" : "classic-cv"
            }`}
            dir="ltr"
          >
            {/* Header */}
            <header className="border-b-2 border-slate-800 pb-6 mb-6 flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
                  {data.personal.firstName} {data.personal.lastName}
                </h1>
                {data.personal.targetJobTitle && (
                  <p className="text-lg font-bold text-blue-700 mt-1 uppercase tracking-wide">
                    {data.personal.targetJobTitle}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 mt-3 font-medium">
                  {data.personal.email && <span>✉ {data.personal.email}</span>}
                  {data.personal.phone && <span>☎ {data.personal.phone}</span>}
                  {data.personal.city && <span>📍 {data.personal.city}</span>}
                  {data.personal.birthDate && <span>Geb.: {data.personal.birthDate}</span>}
                  {data.personal.nationality && <span>StA.: {data.personal.nationality}</span>}
                </div>
              </div>

              {data.personal.photoUrl && (
                <img
                  src={data.personal.photoUrl}
                  alt="Bewerbungsfoto"
                  className="w-24 h-32 object-cover rounded border border-slate-300 shadow-sm"
                />
              )}
            </header>

            {/* Main Layout: 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Main Column (2/3) */}
              <div className="md:col-span-2 space-y-6">
                {/* 1. KURZPROFIL / SUMMARY (RENDERED PROMINENTLY AT TOP OF MAIN COLUMN) */}
                {data.personal.summary && data.personal.summary.trim().length > 0 && (
                  <section className="space-y-2">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                      Kurzprofil
                    </h2>
                    <p className="text-xs text-slate-700 leading-relaxed text-justify">
                      {data.personal.summary}
                    </p>
                  </section>
                )}

                {/* 2. BERUFSERFAHRUNG */}
                {data.experience.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                      Berufserfahrung
                    </h2>
                    <div className="space-y-3">
                      {data.experience.map((exp) => (
                        <div key={exp.id} className="text-xs">
                          <div className="flex justify-between items-baseline font-bold text-slate-900">
                            <span>{exp.position}</span>
                            <span className="text-[11px] font-normal text-slate-600">
                              {exp.startDate} – {exp.isCurrent ? "heute" : exp.endDate || "heute"}
                            </span>
                          </div>
                          <div className="text-[11px] text-blue-700 font-semibold">
                            {exp.company} {exp.city ? `(${exp.city})` : ""}
                          </div>
                          {exp.description && (
                            <p className="text-[11px] text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 3. AUSBILDUNG */}
                {data.education.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                      Ausbildung & Studium
                    </h2>
                    <div className="space-y-3">
                      {data.education.map((edu) => (
                        <div key={edu.id} className="text-xs">
                          <div className="flex justify-between items-baseline font-bold text-slate-900">
                            <span>{edu.degree}</span>
                            <span className="text-[11px] font-normal text-slate-600">
                              {edu.startDate} – {edu.isCurrent ? "heute" : edu.endDate || "heute"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-700 font-medium">
                            {edu.institution} {edu.city ? `(${edu.city})` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Sidebar Column (1/3) */}
              <div className="space-y-6 md:border-l md:border-slate-200 md:pl-6">
                {/* SKILLS */}
                {data.skills.length > 0 && (
                  <section className="space-y-2">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                      Kenntnisse & Fähigkeiten
                    </h2>
                    <div className="flex flex-wrap gap-1.5">
                      {data.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* LANGUAGES */}
                {data.languages.length > 0 && (
                  <section className="space-y-2">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                      Sprachkenntnisse
                    </h2>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {data.languages.map((lang, idx) => (
                        <li key={idx} className="flex justify-between items-center text-[11px]">
                          <span className="font-semibold text-slate-900">{lang.language}</span>
                          <span className="text-slate-500 font-medium">{lang.level}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </div>

            {/* Footer with DIN 5008 Location, Date & Signature line */}
            <footer className="mt-12 pt-6 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-end">
              <div>
                <span>{data.personal.city || "Deutschland"}, {new Date().toLocaleDateString("de-DE")}</span>
              </div>
              <div className="text-right">
                <span className="italic text-slate-400 font-serif text-sm">
                  {data.personal.firstName} {data.personal.lastName}
                </span>
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
