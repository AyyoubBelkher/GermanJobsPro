"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface FullCvData {
  id: string;
  userId: string;
  title: string;
  language: string;
  isDraft: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  personalInfo?: {
    id?: string;
    fullName: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    photoUrl?: string | null;
    birthDate?: string | Date | null;
    birthPlace?: string | null;
    nationality?: string | null;
    targetJobTitle?: string | null;
    linkedinUrl?: string | null;
    xingUrl?: string | null;
    summary?: string | null;
  } | null;
  experiences: Array<{
    id?: string;
    company: string;
    position: string;
    city?: string | null;
    country?: string | null;
    startDate: string;
    endDate?: string | null;
    isCurrent: boolean;
    description?: string | null;
    order: number;
  }>;
  educations: Array<{
    id?: string;
    institution: string;
    degree: string;
    fieldOfStudy?: string | null;
    city?: string | null;
    country?: string | null;
    startDate: string;
    endDate?: string | null;
    isCurrent: boolean;
    grade?: string | null;
    description?: string | null;
    order: number;
  }>;
  skills: Array<{
    id?: string;
    name: string;
    category?: string | null;
    level?: string | null;
    order: number;
  }>;
  languages: Array<{
    id?: string;
    language: string;
    proficiency: string;
    order: number;
  }>;
  certifications: Array<{
    id?: string;
    name: string;
    issuer: string;
    issueDate?: string | null;
    expiryDate?: string | null;
    credentialUrl?: string | null;
    order: number;
  }>;
  projects: Array<{
    id?: string;
    title: string;
    role?: string | null;
    url?: string | null;
    description?: string | null;
    order: number;
  }>;
}

interface CvEditorClientProps {
  initialCv: FullCvData;
  locale: string;
}

export default function CvEditorClient({ initialCv, locale }: CvEditorClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"personal" | "experience" | "education" | "skills" | "projects" | "preview">("personal");
  const [cv, setCv] = useState<FullCvData>(initialCv);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving" | "error">("saved");
  const [optimizingIndex, setOptimizingIndex] = useState<number | null>(null);
  const [optimizingType, setOptimizingType] = useState<"experience" | "project" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAr = locale === "ar";
  const isDe = locale === "de";

  const markUnsaved = () => {
    if (saveStatus !== "unsaved") setSaveStatus("unsaved");
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    setErrorMsg(null);

    try {
      const payload = {
        title: cv.title,
        language: cv.language,
        isDraft: cv.isDraft,
        personalInfo: cv.personalInfo
          ? {
              fullName: cv.personalInfo.fullName || "Name",
              email: cv.personalInfo.email || "email@example.com",
              phone: cv.personalInfo.phone || null,
              address: cv.personalInfo.address || null,
              photoUrl: cv.personalInfo.photoUrl || null,
              birthDate: cv.personalInfo.birthDate ? new Date(cv.personalInfo.birthDate).toISOString() : null,
              birthPlace: cv.personalInfo.birthPlace || null,
              nationality: cv.personalInfo.nationality || null,
              targetJobTitle: cv.personalInfo.targetJobTitle || null,
              linkedinUrl: cv.personalInfo.linkedinUrl || null,
              xingUrl: cv.personalInfo.xingUrl || null,
              summary: cv.personalInfo.summary || null,
            }
          : undefined,
        experiences: cv.experiences.map((exp, idx) => ({
          company: exp.company,
          position: exp.position,
          city: exp.city || null,
          country: exp.country || "Germany",
          startDate: new Date(exp.startDate || new Date()).toISOString(),
          endDate: exp.isCurrent || !exp.endDate ? null : new Date(exp.endDate).toISOString(),
          isCurrent: exp.isCurrent,
          description: exp.description || null,
          order: idx,
        })),
        educations: cv.educations.map((edu, idx) => ({
          institution: edu.institution,
          degree: edu.degree,
          fieldOfStudy: edu.fieldOfStudy || null,
          city: edu.city || null,
          country: edu.country || null,
          startDate: new Date(edu.startDate || new Date()).toISOString(),
          endDate: edu.isCurrent || !edu.endDate ? null : new Date(edu.endDate).toISOString(),
          isCurrent: edu.isCurrent,
          grade: edu.grade || null,
          description: edu.description || null,
          order: idx,
        })),
        skills: cv.skills.map((skill, idx) => ({
          name: skill.name,
          category: skill.category || null,
          level: skill.level || null,
          order: idx,
        })),
        languages: cv.languages.map((lang, idx) => ({
          language: lang.language,
          proficiency: lang.proficiency,
          order: idx,
        })),
        certifications: cv.certifications.map((cert, idx) => ({
          name: cert.name,
          issuer: cert.issuer,
          issueDate: cert.issueDate ? new Date(cert.issueDate).toISOString() : null,
          expiryDate: cert.expiryDate ? new Date(cert.expiryDate).toISOString() : null,
          credentialUrl: cert.credentialUrl || null,
          order: idx,
        })),
        projects: cv.projects.map((proj, idx) => ({
          title: proj.title,
          role: proj.role || null,
          url: proj.url || null,
          description: proj.description || null,
          order: idx,
        })),
      };

      const res = await fetch(`/api/cv/${cv.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save CV");
      }

      setSaveStatus("saved");
      router.refresh();
    } catch (err: unknown) {
      setSaveStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Error saving CV");
    }
  };

  const handleOptimizeBullet = async (index: number, type: "experience" | "project") => {
    const rawText = type === "experience" ? cv.experiences[index]?.description : cv.projects[index]?.description;
    if (!rawText || rawText.trim().length < 5) {
      alert(isAr ? "يرجى كتابة نص من 5 أحرف على الأقل لتحسينه" : "Please enter at least 5 characters to optimize");
      return;
    }

    setOptimizingIndex(index);
    setOptimizingType(type);

    try {
      const role = type === "experience" ? cv.experiences[index]?.position : cv.projects[index]?.role;
      const res = await fetch("/api/ai/optimize-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText, role, language: cv.language }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "AI optimization failed");
      }

      if (type === "experience") {
        const next = [...cv.experiences];
        next[index].description = data.optimizedText;
        setCv({ ...cv, experiences: next });
      } else {
        const next = [...cv.projects];
        next[index].description = data.optimizedText;
        setCv({ ...cv, projects: next });
      }
      markUnsaved();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to optimize");
    } finally {
      setOptimizingIndex(null);
      setOptimizingType(null);
    }
  };

  // Helper date formatter for ISO input
  const formatDateInput = (dateVal?: string | Date | null) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/dashboard/cv`}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            ←
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={cv.title}
                onChange={(e) => {
                  setCv({ ...cv, title: e.target.value });
                  markUnsaved();
                }}
                className="bg-transparent text-white font-extrabold text-lg sm:text-xl border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-hidden px-1"
              />
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  cv.isDraft
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                {cv.isDraft ? (isAr ? "مسودة" : isDe ? "Entwurf" : "Draft") : isAr ? "مكتمل" : isDe ? "Fertig" : "Complete"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              DIN 5008 German Standard • {cv.language.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setCv({ ...cv, isDraft: !cv.isDraft });
              markUnsaved();
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            {cv.isDraft ? (isAr ? "تعيين كمكتمل" : "Mark as Complete") : isAr ? "تعيين كمسودة" : "Mark as Draft"}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
          >
            {saveStatus === "saving" ? (
              <span>{isAr ? "جاري الحفظ..." : "Saving..."}</span>
            ) : saveStatus === "unsaved" ? (
              <span>{isAr ? "💾 حفظ التغييرات *" : "💾 Save Changes *"}</span>
            ) : (
              <span>{isAr ? "✓ تم الحفظ" : "✓ Saved"}</span>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {[
          { id: "personal", label: isAr ? "👤 المعلومات الشخصية" : isDe ? "👤 Persönliche Daten" : "👤 Personal Info" },
          { id: "experience", label: isAr ? "💼 الخبرات المهنية" : isDe ? "💼 Berufserfahrung" : "💼 Experience" },
          { id: "education", label: isAr ? "🎓 التعليم والدراسة" : isDe ? "🎓 Ausbildung & Studium" : "🎓 Education" },
          { id: "skills", label: isAr ? "⚡ المهارات واللغات" : isDe ? "⚡ Kenntnisse & Sprachen" : "⚡ Skills & Languages" },
          { id: "projects", label: isAr ? "🏆 المشاريع والشهادات" : isDe ? "🏆 Projekte & Zertifikate" : "🏆 Projects & Certs" },
          { id: "preview", label: isAr ? "👁️ معاينة DIN 5008" : isDe ? "👁️ DIN 5008 Vorschau" : "👁️ DIN 5008 Preview" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Personal Info */}
      {activeTab === "personal" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <h3 className="text-lg font-bold text-white">
            {isAr ? "المعلومات الشخصية (Persönliche Daten)" : isDe ? "Persönliche Daten" : "Personal Information"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">{isAr ? "الاسم الكامل *" : "Full Name *"}</label>
              <input
                type="text"
                value={cv.personalInfo?.fullName || ""}
                onChange={(e) => {
                  setCv({
                    ...cv,
                    personalInfo: { ...cv.personalInfo, fullName: e.target.value, email: cv.personalInfo?.email || "" },
                  });
                  markUnsaved();
                }}
                placeholder="Max Mustermann"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">{isAr ? "البريد الإلكتروني *" : "Email *"}</label>
              <input
                type="email"
                value={cv.personalInfo?.email || ""}
                onChange={(e) => {
                  setCv({
                    ...cv,
                    personalInfo: { ...cv.personalInfo, fullName: cv.personalInfo?.fullName || "", email: e.target.value },
                  });
                  markUnsaved();
                }}
                placeholder="max.mustermann@example.de"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">{isAr ? "المسمى الوظيفي المستهدف" : "Target Job Title"}</label>
              <input
                type="text"
                value={cv.personalInfo?.targetJobTitle || ""}
                onChange={(e) => {
                  setCv({
                    ...cv,
                    personalInfo: { ...cv.personalInfo, fullName: cv.personalInfo?.fullName || "", email: cv.personalInfo?.email || "", targetJobTitle: e.target.value },
                  });
                  markUnsaved();
                }}
                placeholder="Senior Frontend Developer"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">{isAr ? "رقم الهاتف" : "Phone Number"}</label>
              <input
                type="text"
                value={cv.personalInfo?.phone || ""}
                onChange={(e) => {
                  setCv({
                    ...cv,
                    personalInfo: { ...cv.personalInfo, fullName: cv.personalInfo?.fullName || "", email: cv.personalInfo?.email || "", phone: e.target.value },
                  });
                  markUnsaved();
                }}
                placeholder="+49 170 1234567"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-300">{isAr ? "العنوان بألمانيا (الشارع، الرمز البريدي، المدينة)" : "Address (Street, ZIP, City)"}</label>
              <input
                type="text"
                value={cv.personalInfo?.address || ""}
                onChange={(e) => {
                  setCv({
                    ...cv,
                    personalInfo: { ...cv.personalInfo, fullName: cv.personalInfo?.fullName || "", email: cv.personalInfo?.email || "", address: e.target.value },
                  });
                  markUnsaved();
                }}
                placeholder="Musterstraße 12, 10115 Berlin, Deutschland"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">{isAr ? "تاريخ الميلاد (معيار ألماني)" : "Birth Date (DIN 5008 standard)"}</label>
              <input
                type="date"
                value={formatDateInput(cv.personalInfo?.birthDate)}
                onChange={(e) => {
                  setCv({
                    ...cv,
                    personalInfo: { ...cv.personalInfo, fullName: cv.personalInfo?.fullName || "", email: cv.personalInfo?.email || "", birthDate: e.target.value },
                  });
                  markUnsaved();
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">{isAr ? "مكان الميلاد والجنسية" : "Birth Place & Nationality"}</label>
              <input
                type="text"
                value={cv.personalInfo?.birthPlace || ""}
                onChange={(e) => {
                  setCv({
                    ...cv,
                    personalInfo: { ...cv.personalInfo, fullName: cv.personalInfo?.fullName || "", email: cv.personalInfo?.email || "", birthPlace: e.target.value },
                  });
                  markUnsaved();
                }}
                placeholder="z.B. Berlin / deutsch"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">LinkedIn URL</label>
              <input
                type="url"
                value={cv.personalInfo?.linkedinUrl || ""}
                onChange={(e) => {
                  setCv({
                    ...cv,
                    personalInfo: { ...cv.personalInfo, fullName: cv.personalInfo?.fullName || "", email: cv.personalInfo?.email || "", linkedinUrl: e.target.value },
                  });
                  markUnsaved();
                }}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Xing URL (سوق العمل الألماني)</label>
              <input
                type="url"
                value={cv.personalInfo?.xingUrl || ""}
                onChange={(e) => {
                  setCv({
                    ...cv,
                    personalInfo: { ...cv.personalInfo, fullName: cv.personalInfo?.fullName || "", email: cv.personalInfo?.email || "", xingUrl: e.target.value },
                  });
                  markUnsaved();
                }}
                placeholder="https://xing.com/profile/..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-300">{isAr ? "رابط الصورة الشخصية (Bewerbungsfoto URL)" : "Photo URL (Bewerbungsfoto)"}</label>
              <input
                type="url"
                value={cv.personalInfo?.photoUrl || ""}
                onChange={(e) => {
                  setCv({
                    ...cv,
                    personalInfo: { ...cv.personalInfo, fullName: cv.personalInfo?.fullName || "", email: cv.personalInfo?.email || "", photoUrl: e.target.value },
                  });
                  markUnsaved();
                }}
                placeholder="https://example.com/my-professional-photo.jpg"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-300">{isAr ? "نبذة مهنية موجزة (Profil / Kurzprofil)" : "Professional Summary (Kurzprofil)"}</label>
              <textarea
                rows={3}
                value={cv.personalInfo?.summary || ""}
                onChange={(e) => {
                  setCv({
                    ...cv,
                    personalInfo: { ...cv.personalInfo, fullName: cv.personalInfo?.fullName || "", email: cv.personalInfo?.email || "", summary: e.target.value },
                  });
                  markUnsaved();
                }}
                placeholder={isAr ? "مهندس برمجيات ذو خبرة 5 سنوات في بناء الأنظمة الموزعة..." : "Erfahrener Softwareentwickler mit 5 Jahren Erfahrung..."}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Work Experience */}
      {activeTab === "experience" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">
                {isAr ? "الخبرات المهنية (Berufserfahrung)" : isDe ? "Berufserfahrung" : "Work Experience"}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? "مرتبة زمنياً من الأحدث إلى الأقدم (Antichronologisch)" : "Reverse-chronological order"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCv({
                  ...cv,
                  experiences: [
                    {
                      company: "",
                      position: "",
                      city: "",
                      country: "Germany",
                      startDate: new Date().toISOString(),
                      endDate: null,
                      isCurrent: false,
                      description: "",
                      order: cv.experiences.length,
                    },
                    ...cv.experiences,
                  ],
                });
                markUnsaved();
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              + {isAr ? "إضافة خبرة" : isDe ? "Erfahrung hinzufügen" : "Add Experience"}
            </button>
          </div>

          {cv.experiences.length === 0 ? (
            <div className="text-center py-10 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-slate-400 text-xs">
              {isAr ? "لم تتم إضافة أي خبرات بعد." : "No experiences added yet."}
            </div>
          ) : (
            <div className="space-y-6">
              {cv.experiences.map((exp, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 font-mono">#{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = cv.experiences.filter((_, i) => i !== idx);
                        setCv({ ...cv, experiences: next });
                        markUnsaved();
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                    >
                      {isAr ? "حذف" : "Remove"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">{isAr ? "المسمى الوظيفي *" : "Position *"}</label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => {
                          const next = [...cv.experiences];
                          next[idx].position = e.target.value;
                          setCv({ ...cv, experiences: next });
                          markUnsaved();
                        }}
                        placeholder="Frontend Developer"
                        className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">{isAr ? "الشركة *" : "Company *"}</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const next = [...cv.experiences];
                          next[idx].company = e.target.value;
                          setCv({ ...cv, experiences: next });
                          markUnsaved();
                        }}
                        placeholder="Siemens AG"
                        className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">{isAr ? "تاريخ البدء *" : "Start Date *"}</label>
                      <input
                        type="date"
                        value={formatDateInput(exp.startDate)}
                        onChange={(e) => {
                          const next = [...cv.experiences];
                          next[idx].startDate = e.target.value;
                          setCv({ ...cv, experiences: next });
                          markUnsaved();
                        }}
                        className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300">{isAr ? "تاريخ الانتهاء" : "End Date"}</label>
                        <label className="text-[10px] text-slate-400 flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={exp.isCurrent}
                            onChange={(e) => {
                              const next = [...cv.experiences];
                              next[idx].isCurrent = e.target.checked;
                              setCv({ ...cv, experiences: next });
                              markUnsaved();
                            }}
                          />
                          <span>{isAr ? "أعمل هنا حالياً" : "Current Role"}</span>
                        </label>
                      </div>
                      <input
                        type="date"
                        disabled={exp.isCurrent}
                        value={formatDateInput(exp.endDate)}
                        onChange={(e) => {
                          const next = [...cv.experiences];
                          next[idx].endDate = e.target.value;
                          setCv({ ...cv, experiences: next });
                          markUnsaved();
                        }}
                        className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-hidden disabled:opacity-40"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300">{isAr ? "الوصف والمهام (Bullet Points)" : "Responsibilities & Impact"}</label>
                        <button
                          type="button"
                          onClick={() => handleOptimizeBullet(idx, "experience")}
                          disabled={optimizingIndex === idx && optimizingType === "experience"}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <span>✨</span>
                          <span>
                            {optimizingIndex === idx && optimizingType === "experience"
                              ? isAr ? "جاري التحسين..." : "Optimizing..."
                              : isAr ? "تحسين بالذكاء الاصطناعي (ATS)" : "AI Optimize (ATS)"}
                          </span>
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={exp.description || ""}
                        onChange={(e) => {
                          const next = [...cv.experiences];
                          next[idx].description = e.target.value;
                          setCv({ ...cv, experiences: next });
                          markUnsaved();
                        }}
                        placeholder="• Entwicklung von skalierbaren Microservices..."
                        className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Education */}
      {activeTab === "education" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">
                {isAr ? "التعليم والشهادات الجامعية (Ausbildung & Studium)" : isDe ? "Ausbildung & Studium" : "Education & Academic Degrees"}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? "درجات البكالوريوس، الماجستير، والتكوين المهني Ausbildung" : "University degrees & Vocational training"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCv({
                  ...cv,
                  educations: [
                    {
                      institution: "",
                      degree: "",
                      fieldOfStudy: "",
                      city: "",
                      country: "Germany",
                      startDate: new Date().toISOString(),
                      endDate: null,
                      isCurrent: false,
                      grade: "",
                      description: "",
                      order: cv.educations.length,
                    },
                    ...cv.educations,
                  ],
                });
                markUnsaved();
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              + {isAr ? "إضافة شهادة / دراسة" : "Add Education"}
            </button>
          </div>

          {cv.educations.length === 0 ? (
            <div className="text-center py-10 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-slate-400 text-xs">
              {isAr ? "لم تتم إضافة أي مؤهلات تعليمية بعد." : "No education added yet."}
            </div>
          ) : (
            <div className="space-y-6">
              {cv.educations.map((edu, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 font-mono">#{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = cv.educations.filter((_, i) => i !== idx);
                        setCv({ ...cv, educations: next });
                        markUnsaved();
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                    >
                      {isAr ? "حذف" : "Remove"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">{isAr ? "الدرجة العلمية *" : "Degree *"}</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const next = [...cv.educations];
                          next[idx].degree = e.target.value;
                          setCv({ ...cv, educations: next });
                          markUnsaved();
                        }}
                        placeholder="Bachelor of Science / Master of Science"
                        className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">{isAr ? "التخصص / مجال الدراسة" : "Field of Study"}</label>
                      <input
                        type="text"
                        value={edu.fieldOfStudy || ""}
                        onChange={(e) => {
                          const next = [...cv.educations];
                          next[idx].fieldOfStudy = e.target.value;
                          setCv({ ...cv, educations: next });
                          markUnsaved();
                        }}
                        placeholder="Informatik / Computer Science"
                        className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">{isAr ? "المؤسسة / الجامعة *" : "Institution *"}</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const next = [...cv.educations];
                          next[idx].institution = e.target.value;
                          setCv({ ...cv, educations: next });
                          markUnsaved();
                        }}
                        placeholder="TU München / Universität..."
                        className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">{isAr ? "المعدل / التقدير (German Note)" : "Grade (German Note)"}</label>
                      <input
                        type="text"
                        value={edu.grade || ""}
                        onChange={(e) => {
                          const next = [...cv.educations];
                          next[idx].grade = e.target.value;
                          setCv({ ...cv, educations: next });
                          markUnsaved();
                        }}
                        placeholder="z.B. 1,3 (sehr gut)"
                        className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">{isAr ? "تاريخ البدء *" : "Start Date *"}</label>
                      <input
                        type="date"
                        value={formatDateInput(edu.startDate)}
                        onChange={(e) => {
                          const next = [...cv.educations];
                          next[idx].startDate = e.target.value;
                          setCv({ ...cv, educations: next });
                          markUnsaved();
                        }}
                        className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">{isAr ? "تاريخ التخرج" : "End Date"}</label>
                      <input
                        type="date"
                        value={formatDateInput(edu.endDate)}
                        onChange={(e) => {
                          const next = [...cv.educations];
                          next[idx].endDate = e.target.value;
                          setCv({ ...cv, educations: next });
                          markUnsaved();
                        }}
                        className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Skills & Languages */}
      {activeTab === "skills" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Skills Section */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {isAr ? "المهارات التقنية والمهنية (Kenntnisse)" : "Skills"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCv({
                    ...cv,
                    skills: [...cv.skills, { name: "", category: "Tech", level: "Fortgeschritten", order: cv.skills.length }],
                  });
                  markUnsaved();
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                + {isAr ? "إضافة مهارة" : "Add Skill"}
              </button>
            </div>

            <div className="space-y-3">
              {cv.skills.map((skill, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    value={skill.name}
                    onChange={(e) => {
                      const next = [...cv.skills];
                      next[idx].name = e.target.value;
                      setCv({ ...cv, skills: next });
                      markUnsaved();
                    }}
                    placeholder="React, TypeScript, SQL..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                  <select
                    value={skill.level || "Fortgeschritten"}
                    onChange={(e) => {
                      const next = [...cv.skills];
                      next[idx].level = e.target.value;
                      setCv({ ...cv, skills: next });
                      markUnsaved();
                    }}
                    className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="Experte">Experte / Expert</option>
                    <option value="Fortgeschritten">Fortgeschritten / Advanced</option>
                    <option value="Grundkenntnisse">Grundkenntnisse / Basic</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const next = cv.skills.filter((_, i) => i !== idx);
                      setCv({ ...cv, skills: next });
                      markUnsaved();
                    }}
                    className="text-rose-400 hover:text-rose-300 text-sm px-2 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Languages Section (CEFR Standards) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isAr ? "اللغات (Sprachkenntnisse)" : "Languages"}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? "معايير الإطار الأوروبي CEFR (A1 - C2)" : "CEFR Levels (A1 - C2)"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCv({
                    ...cv,
                    languages: [...cv.languages, { language: "", proficiency: "B2 (Fließend)", order: cv.languages.length }],
                  });
                  markUnsaved();
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                + {isAr ? "إضافة لغة" : "Add Language"}
              </button>
            </div>

            <div className="space-y-3">
              {cv.languages.map((lang, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    value={lang.language}
                    onChange={(e) => {
                      const next = [...cv.languages];
                      next[idx].language = e.target.value;
                      setCv({ ...cv, languages: next });
                      markUnsaved();
                    }}
                    placeholder="Deutsch / English / Arabisch..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                  <select
                    value={lang.proficiency}
                    onChange={(e) => {
                      const next = [...cv.languages];
                      next[idx].proficiency = e.target.value;
                      setCv({ ...cv, languages: next });
                      markUnsaved();
                    }}
                    className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="Muttersprache">Muttersprache / Native</option>
                    <option value="C2 (Exzellente Kenntnisse)">C2 (Exzellent)</option>
                    <option value="C1 (Fachkundige Kenntnisse)">C1 (Fachkundig)</option>
                    <option value="B2 (Fließend in Wort und Schrift)">B2 (Fließend)</option>
                    <option value="B1 (Gute Kenntnisse)">B1 (Gut)</option>
                    <option value="A2 (Grundkenntnisse)">A2 (Grundkenntnisse)</option>
                    <option value="A1 (Anfänger)">A1 (Anfänger)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const next = cv.languages.filter((_, i) => i !== idx);
                      setCv({ ...cv, languages: next });
                      markUnsaved();
                    }}
                    className="text-rose-400 hover:text-rose-300 text-sm px-2 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Projects & Certifications */}
      {activeTab === "projects" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Certifications */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {isAr ? "الشهادات والاعتمادات (Zertifikate)" : "Certifications"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCv({
                    ...cv,
                    certifications: [
                      ...cv.certifications,
                      { name: "", issuer: "", issueDate: null, expiryDate: null, credentialUrl: "", order: cv.certifications.length },
                    ],
                  });
                  markUnsaved();
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                + {isAr ? "إضافة شهادة" : "Add Cert"}
              </button>
            </div>

            <div className="space-y-4">
              {cv.certifications.map((cert, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400">#{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = cv.certifications.filter((_, i) => i !== idx);
                        setCv({ ...cv, certifications: next });
                        markUnsaved();
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      {isAr ? "حذف" : "Remove"}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={cert.name}
                    onChange={(e) => {
                      const next = [...cv.certifications];
                      next[idx].name = e.target.value;
                      setCv({ ...cv, certifications: next });
                      markUnsaved();
                    }}
                    placeholder="AWS Solutions Architect / Goethe C1..."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                  <input
                    type="text"
                    value={cert.issuer}
                    onChange={(e) => {
                      const next = [...cv.certifications];
                      next[idx].issuer = e.target.value;
                      setCv({ ...cv, certifications: next });
                      markUnsaved();
                    }}
                    placeholder="Issuer (Amazon / Goethe Institut)"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {isAr ? "المشاريع المميزة (Projekte)" : "Projects"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCv({
                    ...cv,
                    projects: [
                      ...cv.projects,
                      { title: "", role: "", url: "", description: "", order: cv.projects.length },
                    ],
                  });
                  markUnsaved();
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                + {isAr ? "إضافة مشروع" : "Add Project"}
              </button>
            </div>

            <div className="space-y-4">
              {cv.projects.map((proj, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400">#{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = cv.projects.filter((_, i) => i !== idx);
                        setCv({ ...cv, projects: next });
                        markUnsaved();
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      {isAr ? "حذف" : "Remove"}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={proj.title}
                    onChange={(e) => {
                      const next = [...cv.projects];
                      next[idx].title = e.target.value;
                      setCv({ ...cv, projects: next });
                      markUnsaved();
                    }}
                    placeholder="Project Name"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                  <textarea
                    rows={2}
                    value={proj.description || ""}
                    onChange={(e) => {
                      const next = [...cv.projects];
                      next[idx].description = e.target.value;
                      setCv({ ...cv, projects: next });
                      markUnsaved();
                    }}
                    placeholder="Description / Technologies..."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: DIN 5008 Preview */}
      {activeTab === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-300 font-bold">
              {isAr ? "معاينة السيرة الذاتية (DIN 5008 Tabellarischer Lebenslauf)" : "German DIN 5008 Tabular CV Preview"}
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              🖨️ {isAr ? "طباعة / تصدير PDF" : isDe ? "Drucken / PDF" : "Print / PDF"}
            </button>
          </div>

          {/* Printable / Rendered DIN 5008 Sheet */}
          <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-3xl shadow-2xl max-w-4xl mx-auto space-y-8 font-sans">
            {/* Header: Name & Photo */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 gap-6">
              <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
                  {cv.personalInfo?.fullName || "Vorname Nachname"}
                </h1>
                <p className="text-base font-semibold text-blue-700">
                  {cv.personalInfo?.targetJobTitle || "Lebenslauf"}
                </p>
                <div className="pt-2 text-xs text-slate-600 space-y-0.5 font-medium">
                  {cv.personalInfo?.address && <p>📍 {cv.personalInfo.address}</p>}
                  {cv.personalInfo?.phone && <p>📞 {cv.personalInfo.phone}</p>}
                  {cv.personalInfo?.email && <p>✉️ {cv.personalInfo.email}</p>}
                  {cv.personalInfo?.linkedinUrl && <p>🔗 {cv.personalInfo.linkedinUrl}</p>}
                  {cv.personalInfo?.xingUrl && <p>💼 {cv.personalInfo.xingUrl}</p>}
                </div>
              </div>

              {cv.personalInfo?.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cv.personalInfo.photoUrl}
                  alt="Bewerbungsfoto"
                  className="w-28 h-36 object-cover rounded-md border border-slate-300 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-28 h-36 border-2 border-dashed border-slate-300 rounded-md flex items-center justify-center text-slate-400 text-xs text-center p-2 shrink-0">
                  Bewerbungsfoto (DIN 5008)
                </div>
              )}
            </div>

            {/* Section: Persönliche Daten */}
            {(cv.personalInfo?.birthDate || cv.personalInfo?.birthPlace || cv.personalInfo?.nationality) && (
              <div className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  Persönliche Daten
                </h2>
                <div className="grid grid-cols-3 gap-y-1 text-xs text-slate-800">
                  {cv.personalInfo?.birthDate && (
                    <>
                      <span className="font-semibold text-slate-500">Geburtsdatum:</span>
                      <span className="col-span-2">{new Date(cv.personalInfo.birthDate).toLocaleDateString("de-DE")}</span>
                    </>
                  )}
                  {cv.personalInfo?.birthPlace && (
                    <>
                      <span className="font-semibold text-slate-500">Geburtsort:</span>
                      <span className="col-span-2">{cv.personalInfo.birthPlace}</span>
                    </>
                  )}
                  {cv.personalInfo?.nationality && (
                    <>
                      <span className="font-semibold text-slate-500">Staatsangehörigkeit:</span>
                      <span className="col-span-2">{cv.personalInfo.nationality}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Section: Berufserfahrung */}
            {cv.experiences.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  Berufserfahrung
                </h2>
                <div className="space-y-4">
                  {cv.experiences.map((exp, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-4 text-xs">
                      <div className="text-slate-500 font-semibold">
                        {new Date(exp.startDate).toLocaleDateString("de-DE", { month: "2-digit", year: "numeric" })} –{" "}
                        {exp.isCurrent
                          ? "heute"
                          : exp.endDate
                          ? new Date(exp.endDate).toLocaleDateString("de-DE", { month: "2-digit", year: "numeric" })
                          : "heute"}
                      </div>
                      <div className="col-span-3 space-y-1">
                        <div className="font-bold text-slate-900 text-sm">
                          {exp.position} • <span className="text-slate-700 font-medium">{exp.company}</span>
                          {exp.city && <span className="text-slate-500 font-normal">, {exp.city}</span>}
                        </div>
                        {exp.description && (
                          <div className="text-slate-700 whitespace-pre-line leading-relaxed">
                            {exp.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section: Ausbildung & Studium */}
            {cv.educations.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  Ausbildung & Studium
                </h2>
                <div className="space-y-3">
                  {cv.educations.map((edu, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-4 text-xs">
                      <div className="text-slate-500 font-semibold">
                        {new Date(edu.startDate).toLocaleDateString("de-DE", { month: "2-digit", year: "numeric" })} –{" "}
                        {edu.isCurrent
                          ? "heute"
                          : edu.endDate
                          ? new Date(edu.endDate).toLocaleDateString("de-DE", { month: "2-digit", year: "numeric" })
                          : "heute"}
                      </div>
                      <div className="col-span-3 space-y-0.5">
                        <div className="font-bold text-slate-900 text-sm">
                          {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}
                        </div>
                        <div className="text-slate-700 font-medium">{edu.institution}</div>
                        {edu.grade && <div className="text-slate-600 font-semibold">Abschlussnote: {edu.grade}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section: Kenntnisse & Sprachen */}
            {(cv.skills.length > 0 || cv.languages.length > 0) && (
              <div className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  Kenntnisse & Qualifikationen
                </h2>
                <div className="grid grid-cols-4 gap-4 text-xs">
                  {cv.languages.length > 0 && (
                    <>
                      <div className="text-slate-500 font-semibold">Sprachen:</div>
                      <div className="col-span-3 space-y-1">
                        {cv.languages.map((l, i) => (
                          <div key={i} className="text-slate-800">
                            <strong>{l.language}:</strong> {l.proficiency}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {cv.skills.length > 0 && (
                    <>
                      <div className="text-slate-500 font-semibold">IT-Kenntnisse:</div>
                      <div className="col-span-3 text-slate-800 leading-relaxed">
                        {cv.skills.map((s) => s.name).join(" • ")}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* German CV Signature Line */}
            <div className="pt-8 text-xs text-slate-500 flex items-center justify-between border-t border-slate-200">
              <div>
                {cv.personalInfo?.address ? cv.personalInfo.address.split(",")[1]?.trim() || "Deutschland" : "Deutschland"},{" "}
                {new Date().toLocaleDateString("de-DE")}
              </div>
              <div className="font-serif italic text-slate-800 text-sm">
                {cv.personalInfo?.fullName || "Max Mustermann"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
