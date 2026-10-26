"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import UpgradeModal from "@/components/pricing/UpgradeModal";
import { getInitials, extractCityFromAddress } from "@/lib/location";

interface CvOption {
  id: string;
  title: string;
  language: string;
  fullName?: string;
  targetJobTitle?: string | null;
  email?: string;
  phone?: string | null;
  address?: string | null;
  linkedinUrl?: string | null;
  linkedin?: string | null;
  photoUrl?: string | null;
}

interface CoverLetterOption {
  id: string;
  title: string;
  jobTitle: string;
  companyName: string;
}

interface DossierCompilerClientProps {
  userCvs: CvOption[];
  userCoverLetters: CoverLetterOption[];
  locale: string;
}

interface UploadedFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
}

export default function DossierCompilerClient({
  userCvs,
  userCoverLetters,
  locale,
}: DossierCompilerClientProps) {
  const isAr = locale === "ar";
  const isDe = locale === "de";

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cvSourceMode, setCvSourceMode] = useState<"saved" | "upload">(
    userCvs.length > 0 ? "saved" : "upload"
  );
  const [selectedCvId, setSelectedCvId] = useState<string>(userCvs[0]?.id || "");
  const [cvPdfFile, setCvPdfFile] = useState<File | null>(null);
  const [isCvDragging, setIsCvDragging] = useState<boolean>(false);

  const [selectedCoverLetterId, setSelectedCoverLetterId] = useState<string>(
    userCoverLetters[0]?.id || "none"
  );
  const [includeDeckblatt, setIncludeDeckblatt] = useState<boolean>(true);
  const [includePhoto, setIncludePhoto] = useState<boolean>(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  // Deckblatt Customization Inputs
  const initialCoverLetter = userCoverLetters.find((c) => c.id === (userCoverLetters[0]?.id || "none"));
  const initialCv = userCvs.find((c) => c.id === (userCvs[0]?.id || ""));

  const [customJobTitle, setCustomJobTitle] = useState<string>(
    initialCoverLetter?.jobTitle || initialCv?.targetJobTitle || ""
  );
  const [customCompanyName, setCustomCompanyName] = useState<string>(
    initialCoverLetter?.companyName || ""
  );

  const [attachments, setAttachments] = useState<UploadedFileItem[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Auto-populate when selecting a CV
  const handleCvChange = (newCvId: string) => {
    setSelectedCvId(newCvId);
    const cv = userCvs.find((c) => c.id === newCvId);
    if (cv) {
      const currentCl = userCoverLetters.find((cl) => cl.id === selectedCoverLetterId);
      if (!currentCl || !currentCl.jobTitle) {
        if (cv.targetJobTitle) {
          setCustomJobTitle(cv.targetJobTitle);
        }
      }
    }
  };

  // Auto-populate when selecting a Cover Letter
  const handleCoverLetterChange = (newClId: string) => {
    setSelectedCoverLetterId(newClId);
    const cl = userCoverLetters.find((c) => c.id === newClId);
    if (cl) {
      if (cl.companyName) setCustomCompanyName(cl.companyName);
      if (cl.jobTitle) setCustomJobTitle(cl.jobTitle);
    } else {
      setCustomCompanyName("");
      const cv = userCvs.find((c) => c.id === selectedCvId);
      if (cv?.targetJobTitle) {
        setCustomJobTitle(cv.targetJobTitle);
      }
    }
  };

  const handlePhotoSelect = (file: File | null) => {
    if (!file) {
      setPhotoFile(null);
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
        setPhotoPreviewUrl(null);
      }
      return;
    }
    const isImg =
      file.type.startsWith("image/") || /\.(jpe?g|png|webp|jpg)$/i.test(file.name);
    if (!isImg) {
      setError(
        isAr
          ? "يرجى اختيار صورة صالحة (JPG, PNG)."
          : "Please select a valid image (JPG, PNG)."
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(isAr ? "حجم الصورة يتجاوز 5 ميغابايت." : "Photo size exceeds 5MB limit.");
      return;
    }
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreviewUrl(url);
    setError(null);
  };

  const handleAddFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const newItems: UploadedFileItem[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        setError(isAr ? `الملف "${f.name}" ليس ملف PDF صالح.` : `File "${f.name}" is not a valid PDF.`);
        continue;
      }

      newItems.push({
        id: `${f.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file: f,
        name: f.name,
        size: f.size,
      });
    }

    setAttachments((prev) => [...prev, ...newItems]);
  };

  const handleMoveAttachment = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= attachments.length) return;

    const updated = [...attachments];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setAttachments(updated);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Derived candidate information for Live A4 Deckblatt Preview
  const activeCv = userCvs.find((c) => c.id === selectedCvId);
  const candidateFullName =
    cvSourceMode === "saved" && activeCv?.fullName
      ? activeCv.fullName
      : userCvs[0]?.fullName || "Bewerber";

  const candidateEmail =
    cvSourceMode === "saved" && activeCv?.email ? activeCv.email : "";
  const candidatePhone =
    cvSourceMode === "saved" && activeCv?.phone ? activeCv.phone : "";
  const candidateAddress =
    cvSourceMode === "saved" && activeCv?.address ? activeCv.address : "";
  const candidateLinkedin =
    cvSourceMode === "saved"
      ? activeCv?.linkedinUrl || activeCv?.linkedin || ""
      : "";

  // Effective photo URL for preview: uploaded preview wins, fallback to saved CV photo
  const effectivePhotoUrl =
    photoPreviewUrl || (cvSourceMode === "saved" ? activeCv?.photoUrl || null : null);

  const candidateCity = candidateAddress ? extractCityFromAddress(candidateAddress, "") : "";

  const todayFormatted = (() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  })();

  const previewAttachments: string[] = [];
  if (selectedCoverLetterId && selectedCoverLetterId !== "none") {
    previewAttachments.push("Anschreiben");
  }
  previewAttachments.push("Lebenslauf");
  if (attachments.length > 0) {
    attachments.forEach((att) => {
      previewAttachments.push(att.name.replace(/\.pdf$/i, ""));
    });
  } else {
    previewAttachments.push("Arbeitszeugnisse & Nachweise");
  }

  const handleCompile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cvSourceMode === "upload" && !cvPdfFile) {
      setError(
        isAr
          ? "يرجى رفع ملف السيرة الذاتية (PDF) لتجميع الملف."
          : "Please upload your CV PDF file."
      );
      return;
    }

    if (cvSourceMode === "saved" && !selectedCvId) {
      setError(isAr ? "يرجى اختيار سيرة ذاتية لتجميع الملف." : "Please select a CV.");
      return;
    }

    setIsCompiling(true);

    try {
      const formData = new FormData();

      if (cvSourceMode === "upload" && cvPdfFile) {
        formData.append("cvFile", cvPdfFile);
      } else if (selectedCvId) {
        formData.append("cvId", selectedCvId);
      }

      if (selectedCoverLetterId && selectedCoverLetterId !== "none") {
        formData.append("coverLetterId", selectedCoverLetterId);
      }
      formData.append("includeDeckblatt", includeDeckblatt ? "true" : "false");

      if (includeDeckblatt) {
        if (customJobTitle.trim()) {
          formData.append("customJobTitle", customJobTitle.trim());
        }
        if (customCompanyName.trim()) {
          formData.append("customCompanyName", customCompanyName.trim());
        }
        formData.append("includePhoto", includePhoto ? "true" : "false");
        if (includePhoto && photoFile) {
          formData.append("photoFile", photoFile);
        }
      }

      attachments.forEach((item) => {
        formData.append("files", item.file);
      });

      const res = await fetch("/api/dossier/compile", {
        method: "POST",
        body: formData,
      });

      if (res.status === 402) {
        setShowUpgradeModal(true);
        setIsCompiling(false);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        if (
          errorData?.error === "INSUFFICIENT_CREDITS" ||
          errorData?.outOfCredits ||
          errorData?.requiresPro
        ) {
          setShowUpgradeModal(true);
          setIsCompiling(false);
          return;
        }
        throw new Error(errorData?.error || "Failed to compile dossier PDF");
      }

      // Download compiled PDF blob
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bewerbungsmappe_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error compiling dossier");
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          {isAr
            ? "📑 تجميع ملف الترشيح الألماني (Bewerbungsmappe Studio)"
            : isDe
            ? "📑 Bewerbungsmappe Studio"
            : "📑 German Application Dossier Studio"}
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl">
          {isAr
            ? "اجمع وثائق تقديمك في ملف PDF موحد واحترافي يضم الغلاف التنفيذي (Deckblatt)، خطاب التغطية (Anschreiben)، السيرة الذاتية (Lebenslauf)، والشهادات المرفقة (Zeugnisse)."
            : isDe
            ? "Erstellen Sie eine vollständige Bewerbungsmappe als einheitliche PDF (Deckblatt, Anschreiben, Lebenslauf & Anlagen)."
            : "Compile your complete German application dossier into a unified PDF (Cover page, Cover letter, CV & Certificates)."}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Configuration Steps Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleCompile} className="space-y-6">
            {/* Step 1: CV Selection or Direct PDF Upload */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold text-sm flex items-center justify-center">
                    1
                  </div>
                  <h3 className="font-bold text-white text-base">
                    {isAr ? "اختيار السيرة الذاتية (Lebenslauf) *" : "Select CV (Lebenslauf) *"}
                  </h3>
                </div>
              </div>

              {/* Toggle Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCvSourceMode("saved")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    cvSourceMode === "saved"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>📋</span>
                  <span>{isAr ? "سيرتي الذاتية المحفوظة" : isDe ? "Gespeicherte CVs" : "Saved CV"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCvSourceMode("upload")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    cvSourceMode === "upload"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>📄</span>
                  <span>{isAr ? "رفع سيرة ذاتية (PDF)" : isDe ? "PDF hochladen" : "Upload PDF CV"}</span>
                </button>
              </div>

              {/* Tab 1: Saved CV dropdown */}
              {cvSourceMode === "saved" && (
                <div>
                  {userCvs.length > 0 ? (
                    <select
                      value={selectedCvId}
                      onChange={(e) => handleCvChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-hidden"
                    >
                      {userCvs.map((cv) => (
                        <option key={cv.id} value={cv.id}>
                          {cv.title} ({cv.language.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-3">
                      <p className="text-xs text-slate-400">
                        {isAr
                          ? "لا توجد سير ذاتية محفوظة في حسابك حالياً. يمكنك رفع ملف سيرة ذاتية PDF مباشرة."
                          : "No saved CV found. You can upload your PDF CV directly."}
                      </p>
                      <Link
                        href={`/${locale}/dashboard/cv/new`}
                        className="inline-block px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 text-xs font-bold transition-all"
                      >
                        {isAr ? "+ إنشاء سيرة ذاتية جديدة" : "+ Create New CV"}
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Direct PDF CV Drag & Drop */}
              {cvSourceMode === "upload" && (
                <div>
                  {cvPdfFile ? (
                    <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/40 flex items-center justify-between gap-3 shadow-inner">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 text-sm font-bold">
                          PDF
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{cvPdfFile.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {(cvPdfFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCvPdfFile(null)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
                        title={isAr ? "إزالة الملف" : "Remove file"}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsCvDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsCvDragging(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsCvDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          if (
                            !file.name.toLowerCase().endsWith(".pdf") &&
                            file.type !== "application/pdf"
                          ) {
                            setError(
                              isAr ? "يرجى رفع ملف بصيغة PDF فقط" : "Please upload a PDF file only"
                            );
                            return;
                          }
                          if (file.size > 15 * 1024 * 1024) {
                            setError(isAr ? "حجم الملف يتجاوز 15 ميغابايت" : "File exceeds 15MB limit");
                            return;
                          }
                          setCvPdfFile(file);
                          setError(null);
                        }
                      }}
                      className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                        isCvDragging
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-slate-800 hover:border-blue-500/50 bg-slate-950/60"
                      }`}
                    >
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (
                              !file.name.toLowerCase().endsWith(".pdf") &&
                              file.type !== "application/pdf"
                            ) {
                              setError(
                                isAr ? "يرجى رفع ملف بصيغة PDF فقط" : "Please upload a PDF file only"
                              );
                              return;
                            }
                            if (file.size > 15 * 1024 * 1024) {
                              setError(
                                isAr ? "حجم الملف يتجاوز 15 ميغابايت" : "File exceeds 15MB limit"
                              );
                              return;
                            }
                            setCvPdfFile(file);
                            setError(null);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="space-y-1">
                        <span className="text-2xl">📄</span>
                        <p className="text-xs font-bold text-slate-200">
                          {isAr
                            ? "اسحب وأفلت ملف السيرة الذاتية (PDF) هنا"
                            : isDe
                            ? "Lebenslauf (PDF) hierher ziehen"
                            : "Drag & drop your CV (PDF) here"}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {isAr ? "أو انقر لاختيار ملف (الحد الأقصى 15MB)" : "or click to browse (Max 15MB)"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Cover Letter Selection */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold text-sm flex items-center justify-center">
                  2
                </div>
                <h3 className="font-bold text-white text-base">
                  {isAr ? "خطاب التغطية (Anschreiben) - اختياري" : "Cover Letter (Anschreiben) - Optional"}
                </h3>
              </div>

              <select
                value={selectedCoverLetterId}
                onChange={(e) => handleCoverLetterChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-hidden"
              >
                <option value="none">
                  {isAr ? "-- بدون خطاب تغطية (CV فقط) --" : "-- No Cover Letter (CV only) --"}
                </option>
                {userCoverLetters.map((cl) => (
                  <option key={cl.id} value={cl.id}>
                    🏢 {cl.companyName} - {cl.jobTitle} ({cl.title})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3: Deckblatt Configuration & Photo Controls */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">
                      {isAr
                        ? "📑 صفحة الغلاف الألمانية (Deckblatt)"
                        : isDe
                        ? "📑 Bewerbungsdeckblatt (A4)"
                        : "📑 Application Cover Page (Deckblatt)"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Executive
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {isAr
                      ? "صفحة غلاف رسمية تتصدر ملف الترشيح وتضم المسمى الوظيفي، اسم الشركة، الصورة، وبيانات الاتصال وفهرس المرفقات."
                      : isDe
                      ? "Prestigeträchtiges Deckblatt mit Zielposition, Unternehmen, Foto, Kontaktdaten und Anlagenverzeichnis."
                      : "Prepend an executive cover page with target position, company, photo, contacts and attachments index."}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={includeDeckblatt}
                    onChange={(e) => setIncludeDeckblatt(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {includeDeckblatt && (
                <div className="space-y-4 pt-3 border-t border-slate-800/80">
                  {/* Target Job Title & Company Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">
                        {isAr
                          ? "المسمى الوظيفي على الغلاف (Target Job Title)"
                          : isDe
                          ? "Zielposition auf dem Deckblatt"
                          : "Target Job Title"}
                      </label>
                      <input
                        type="text"
                        value={customJobTitle}
                        onChange={(e) => setCustomJobTitle(e.target.value)}
                        placeholder={isAr ? "مثال: Frontend Entwickler" : "z. B. Frontend Entwickler"}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">
                        {isAr
                          ? "اسم الشركة المستهدفة (Company Name)"
                          : isDe
                          ? "Zielunternehmen"
                          : "Target Company Name"}
                      </label>
                      <input
                        type="text"
                        value={customCompanyName}
                        onChange={(e) => setCustomCompanyName(e.target.value)}
                        placeholder={isAr ? "مثال: Siemens AG" : "z. B. Siemens AG"}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Photo Controls Card */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📷</span>
                        <div>
                          <p className="text-xs font-bold text-slate-200">
                            {isAr ? "الصورة الشخصية (Bewerbungsfoto)" : isDe ? "Bewerbungsfoto" : "Candidate Photo"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {isAr
                              ? "معيار ألماني اختياري: صورة بورتريه رسمية أو شارة الأحرف الأولى (Monogram)"
                              : isDe
                              ? "Optional: Porträtfoto mittig oder Initialen-Monogramm"
                              : "Optional: Centered portrait photo or initials monogram crest"}
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={includePhoto}
                          onChange={(e) => setIncludePhoto(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {includePhoto ? (
                      <div className="space-y-2">
                        {photoFile && photoPreviewUrl ? (
                          /* Custom uploaded photo */
                          <div className="p-3 rounded-xl bg-slate-900 border border-blue-500/40 flex items-center justify-between gap-3 shadow-inner">
                            <div className="flex items-center gap-3 min-w-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photoPreviewUrl}
                                alt="Bewerbungsfoto Preview"
                                className="w-11 h-13 rounded-lg object-cover border border-slate-700 shadow-md shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">{photoFile.name}</p>
                                <p className="text-[10px] text-emerald-400 font-semibold">
                                  {isAr ? "✓ صورة مخصصة مرفوعة" : "✓ Uploaded custom photo"} (
                                  {(photoFile.size / 1024).toFixed(1)} KB)
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handlePhotoSelect(null)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
                              title={isAr ? "إزالة الصورة" : "Remove photo"}
                            >
                              ✕
                            </button>
                          </div>
                        ) : cvSourceMode === "saved" && activeCv?.photoUrl ? (
                          /* Saved CV photo automatically imported */
                          <div className="p-3 rounded-xl bg-slate-900 border border-blue-500/30 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={activeCv.photoUrl}
                                alt="Saved CV Photo"
                                className="w-11 h-13 rounded-lg object-cover border border-slate-700 shadow-md shrink-0"
                              />
                              <div className="min-w-0">
                                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30">
                                  {isAr
                                    ? "تم استيراد الصورة من السيرة الذاتية تلقائياً"
                                    : isDe
                                    ? "Aus Lebenslauf importiert"
                                    : "Imported from CV profile"}
                                </span>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {isAr
                                    ? "يمكنك الإبقاء عليها أو رفع صورة بديلة للغلاف"
                                    : "Keep this photo or upload a replacement"}
                                </p>
                              </div>
                            </div>

                            <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer shrink-0 border border-slate-700">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/jpg"
                                onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)}
                                className="hidden"
                              />
                              {isAr ? "تغيير الصورة" : isDe ? "Foto ändern" : "Change photo"}
                            </label>
                          </div>
                        ) : (
                          /* Upload Photo dropzone when no photo exists */
                          <label className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 flex items-center justify-center gap-3 cursor-pointer bg-slate-950/60 transition-all text-slate-400 hover:text-slate-200">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/jpg"
                              onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)}
                              className="hidden"
                            />
                            <span className="text-xl">📷</span>
                            <div className="text-left rtl:text-right">
                              <p className="text-xs font-bold text-slate-300">
                                {isAr
                                  ? "اضغط لاختيار صورة شخصية للغلاف (JPG, PNG)"
                                  : "Click to upload application photo (JPG, PNG)"}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {isAr
                                  ? "اختياري - في حال عدم توفر صورة، سيتم تصميم الغلاف بشعار الأحرف الأولى الأنيق (Monogram)."
                                  : "Optional - without photo, a prestigious initials crest will be rendered."}
                              </p>
                            </div>
                          </label>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
                        <span>🛡️</span>
                        <span>
                          {isAr
                            ? "تم تعطيل الصورة. سيظهر الغلاف بشعار الأحرف الأولى الفاخر للخصوصية والمطابقة العامة."
                            : isDe
                            ? "Foto deaktiviert: Es wird ein elegantes Initialen-Monogramm erzeugt."
                            : "Photo disabled: An executive initials monogram crest will be used."}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Attachments (Zeugnisse & Nachweise) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-bold text-sm flex items-center justify-center">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      {isAr ? "المرفقات والشهادات (Anlagen & Zeugnisse)" : "Certificates & Attachments (Anlagen)"}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isAr
                        ? "شهادات اللغة (B2/C1)، الدبلومات، قرارات المعادلة (Anerkennung)، وشهادات الخبرة."
                        : "Language certificates, degree diplomas, recognition notices, and reference letters."}
                    </p>
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => handleAddFiles(e.target.files)}
              />

              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleAddFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-slate-800 hover:border-slate-700 bg-slate-950/60"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center text-xl">
                  📎
                </div>
                <p className="text-xs font-bold text-slate-200">
                  {isAr ? "اضغط لإضافة ملفات PDF أو اسحبها هنا" : "Click or drag & drop PDF attachments"}
                </p>
                <p className="text-[11px] text-slate-500">
                  {isAr ? "يدعم ملفات PDF حتى 15 ميغابايت إجمالياً" : "Supports PDF files up to 15MB total"}
                </p>
              </div>

              {/* Attachments List with Reordering */}
              {attachments.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold text-slate-300">
                    {isAr ? "ترتيب المرفقات المدمجة:" : "Attached Documents Order:"}
                  </p>
                  <div className="space-y-2">
                    {attachments.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <p className="text-xs font-bold text-white truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-500">{formatFileSize(item.size)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveAttachment(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveAttachment(idx, "down")}
                            disabled={idx === attachments.length - 1}
                            className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(item.id)}
                            className="p-1 rounded-lg bg-slate-900 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isCompiling}
              className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm sm:text-base transition-all shadow-xl shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isCompiling ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{isAr ? "جاري دمج وتجميع الملف الكامل..." : "Compiling Dossier PDF..."}</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>
                    {isAr
                      ? "تجميع وتحميل ملف الترشيح الكامل (Bewerbungsmappe.pdf)"
                      : "Compile & Download Complete Dossier (PDF)"}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Live A4 Deckblatt Preview & Structure Preview Card */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* Live A4 Interactive Visual Preview */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">
                  {isAr ? "معاينة الغلاف الحيّة" : isDe ? "Live Deckblatt-Vorschau" : "Live Deckblatt Preview"}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  DIN A4
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                {includeDeckblatt ? (isAr ? "مضمّن في الملف" : "Aktiv") : (isAr ? "غير مفعّل" : "Inaktiv")}
              </span>
            </div>

            {/* Authentic A4 Paper Preview */}
            <div
              dir="ltr"
              className={`relative w-full aspect-[1/1.414] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col justify-between p-4 sm:p-5 select-none transition-all duration-300 ${
                !includeDeckblatt ? "opacity-30 grayscale" : ""
              }`}
            >
              {/* Top Accent Bar: Two-tone navy & royal blue */}
              <div className="absolute top-0 left-0 right-0 h-1.5 flex">
                <div className="w-[70%] bg-[#0f172a]" />
                <div className="w-[30%] bg-[#2563eb]" />
              </div>

              {/* Header Section */}
              <div className="flex flex-col items-center text-center pt-1.5">
                <p className="text-[8.5px] sm:text-[9.5px] font-bold text-[#2563eb] tracking-[0.25em] uppercase">
                  {customJobTitle.trim() ? "BEWERBUNG" : "BEWERBUNGSUNTERLAGEN"}
                </p>
                <div className="w-8 h-0.5 bg-[#2563eb] my-1" />
                <h4 className="text-xs sm:text-sm font-bold text-[#0f172a] leading-tight max-w-[90%] truncate">
                  {customJobTitle.trim() ? `als ${customJobTitle.trim()}` : "Bewerbungsmappe"}
                </h4>
                {customCompanyName.trim() && (
                  <p className="text-[9.5px] sm:text-[10.5px] text-[#475569] mt-0.5 truncate max-w-[90%]">
                    bei {customCompanyName.trim()}
                  </p>
                )}
              </div>

              {/* Middle Candidate Block: Photo/Monogram + Name + Contact Card */}
              <div className="flex flex-col items-center justify-center my-auto w-full">
                {/* Photo or Monogram Crest */}
                {includePhoto && effectivePhotoUrl ? (
                  <div className="p-1 bg-white border-[1.5px] border-slate-300 rounded-lg shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={effectivePhotoUrl}
                      alt="Bewerbungsfoto"
                      className="w-14 h-[72px] sm:w-16 sm:h-[84px] object-cover rounded"
                    />
                  </div>
                ) : (
                  <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-[#eff6ff] border-[1.5px] border-[#bfdbfe] flex items-center justify-center shadow-inner">
                    <span className="text-sm sm:text-base font-bold text-[#1e40af]">
                      {getInitials(candidateFullName)}
                    </span>
                  </div>
                )}

                {/* Candidate Full Name */}
                <h3 className="text-xs sm:text-sm font-bold text-[#0f172a] tracking-wide mt-1.5 text-center">
                  {candidateFullName}
                </h3>

                {/* Centered Structured Contact Card */}
                <div className="w-[88%] bg-[#f8fafc] border border-[#e2e8f0] rounded-lg py-1 px-2.5 mt-1.5 text-center flex flex-col items-center gap-0.5 text-[7.5px] sm:text-[8.5px] text-[#475569]">
                  {candidateAddress && (
                    <p className="truncate max-w-full">
                      <span className="font-bold text-[#334155]">Adresse: </span>
                      {candidateAddress}
                    </p>
                  )}
                  {candidatePhone && (
                    <p className="truncate max-w-full">
                      <span className="font-bold text-[#334155]">Telefon: </span>
                      {candidatePhone}
                    </p>
                  )}
                  {candidateEmail && (
                    <p className="truncate max-w-full">
                      <span className="font-bold text-[#334155]">E-Mail: </span>
                      {candidateEmail}
                    </p>
                  )}
                  {candidateLinkedin && (
                    <p className="truncate max-w-full">
                      <span className="font-bold text-[#334155]">LinkedIn: </span>
                      {candidateLinkedin}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Attachments Directory */}
              <div className="w-full">
                {/* Horizontal Rules Header */}
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[7px] sm:text-[8px] font-bold text-[#1e40af] tracking-wider uppercase">
                    INHALT DER BEWERBUNGSMAPPE
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* 2-column grid */}
                <div className="grid grid-cols-2 gap-1 text-left">
                  {previewAttachments.slice(0, 6).map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-[#f8fafc] border-l-2 border-[#2563eb] py-0.5 px-1.5 rounded-sm flex items-center gap-1 min-w-0"
                    >
                      <span className="text-[6.5px] sm:text-[7.5px] font-bold text-[#2563eb] shrink-0">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[7px] sm:text-[8px] font-bold text-[#1e293b] truncate">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-1.5 pt-1 border-t border-slate-200 flex items-center justify-between text-[6.5px] sm:text-[7.5px] text-slate-400">
                  <span className="truncate">Bewerbungsdossier • {candidateFullName}</span>
                  <span className="shrink-0">{candidateCity ? `${candidateCity}, ` : ""}{todayFormatted}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Document Structure Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">
                {isAr ? "هيكل الملف النهائي" : "Dossier Document Structure"}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? "ترتيب الوثائق في ملف الـ PDF الموحد:" : "Final order of documents in your PDF:"}
              </p>
            </div>

            <div className="space-y-3">
              {/* Deckblatt Item */}
              {includeDeckblatt && (
                <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/40 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Deckblatt</p>
                    <p className="text-[10px] text-blue-300">صفحة الغلاف الألمانية الرسمية</p>
                  </div>
                </div>
              )}

              {/* Cover Letter Item */}
              {selectedCoverLetterId && selectedCoverLetterId !== "none" && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    {includeDeckblatt ? 2 : 1}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Anschreiben (DIN 5008)</p>
                    <p className="text-[10px] text-blue-300">خطاب التغطية الرسمي</p>
                  </div>
                </div>
              )}

              {/* CV Item */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                  {(includeDeckblatt ? 1 : 0) +
                    (selectedCoverLetterId && selectedCoverLetterId !== "none" ? 1 : 0) +
                    1}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">
                    {cvSourceMode === "upload" && cvPdfFile
                      ? `Lebenslauf (${cvPdfFile.name})`
                      : "Lebenslauf (Tabellarisch)"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {cvSourceMode === "upload" && cvPdfFile
                      ? `PDF (${formatFileSize(cvPdfFile.size)})`
                      : isAr
                      ? "السيرة الذاتية وفق معايير ألمانيا"
                      : "Standard DIN 5008 CV"}
                  </p>
                </div>
              </div>

              {/* Attachments */}
              {attachments.map((att, idx) => (
                <div
                  key={att.id}
                  className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/30 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    {(includeDeckblatt ? 1 : 0) +
                      (selectedCoverLetterId && selectedCoverLetterId !== "none" ? 1 : 0) +
                      2 +
                      idx}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-emerald-300 truncate">{att.name}</p>
                    <p className="text-[10px] text-slate-400">شهادة / ملحق ({formatFileSize(att.size)})</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
              <p className="font-bold text-slate-300">💡 نصيحة ألمانية للتقديم:</p>
              <p className="leading-relaxed">
                {isAr
                  ? "يفضل أصحاب العمل في ألمانيا استلام ملف ترشيح واحد شامل وممنهج لتسهيل الاطلاع على مؤهلاتك وتمريرها في لجان التوظيف."
                  : "Deutsche Arbeitgeber bevorzugen eine einzige, strukturierte Bewerbungsmappe mit allen Zeugnissen."}
              </p>
            </div>
          </div>
        </div>

        {/* Contextual Paywall Upgrade Modal */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          locale={locale}
          triggerFeature="dossier"
        />
      </div>
    </div>
  );
}
