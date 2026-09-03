"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface CvMagicImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export default function CvMagicImportModal({
  isOpen,
  onClose,
  locale,
}: CvMagicImportModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAr = locale === "ar";
  const isDe = locale === "de";

  const [inputMode, setInputMode] = useState<"file" | "text">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [targetJobTitle, setTargetJobTitle] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        setSelectedFile(file);
        setErrorMessage(null);
      } else {
        setErrorMessage(
          isAr
            ? "يرجى رفع ملف بصيغة PDF (.pdf) فقط."
            : isDe
            ? "Bitte laden Sie nur eine PDF-Datei (.pdf) hoch."
            : "Please upload a PDF file (.pdf) only."
        );
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const handleStartImport = async () => {
    setErrorMessage(null);

    if (inputMode === "file" && !selectedFile) {
      setErrorMessage(
        isAr
          ? "يرجى اختيار ملف PDF الخاص بسيرتك الذاتية."
          : isDe
          ? "Bitte wählen Sie Ihre PDF-Lebenslaufdatei aus."
          : "Please select your CV PDF file."
      );
      return;
    }

    if (inputMode === "text" && (!pastedText || pastedText.trim().length < 30)) {
      setErrorMessage(
        isAr
          ? "يرجى لصق نص السيرة الذاتية (30 حرفاً على الأقل)."
          : isDe
          ? "Bitte fügen Sie den Lebenslauftext ein (mind. 30 Zeichen)."
          : "Please paste your CV text (at least 30 characters)."
      );
      return;
    }

    setIsLoading(true);
    setLoadingStep(1);

    // Simulated progress steps for smooth UX
    const step2Timer = setTimeout(() => setLoadingStep(2), 2000);
    const step3Timer = setTimeout(() => setLoadingStep(3), 4500);

    try {
      let res: Response;

      if (inputMode === "file" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        if (targetJobTitle.trim()) {
          formData.append("targetJobTitle", targetJobTitle.trim());
        }
        formData.append("locale", locale);

        res = await fetch("/api/cv/magic-import", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/cv/magic-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cvText: pastedText.trim(),
            targetJobTitle: targetJobTitle.trim() || undefined,
            locale,
          }),
        });
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            (isAr
              ? "فشل استيراد وتحسين السيرة الذاتية. حاول مرة أخرى."
              : isDe
              ? "Import fehlgeschlagen. Bitte erneut versuchen."
              : "Magic import failed. Please try again.")
        );
      }

      // Success: Redirect to editor with newly generated DIN 5008 CV
      router.push(`/${locale}/dashboard/cv/${data.cvId}`);
      onClose();
    } catch (err: unknown) {
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      setIsLoading(false);
      setErrorMessage(err instanceof Error ? err.message : "Error during import");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl relative my-8 animate-fadeIn">
        {/* Close Button */}
        {!isLoading && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 ltr:right-5 rtl:left-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Modal Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 mb-1">
            <span className="text-2xl">✨</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            {isAr
              ? "تحويل فوري (1-Click PDF) وتكييف ذكي (DIN 5008)"
              : isDe
              ? "Sofort-Konvertierung (1-Klick) & DIN 5008 Anpassung"
              : "1-Click PDF Converter & DIN 5008 Smart Adapt"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            {isAr
              ? "ارفع سيرتك الذاتية الحالية (PDF) بأي لغة، ليقوم النظام فوراً بتكييفها وصياغة خبراتك بالأسلوب الاسمي الألماني (Substantivstil) واستخراج وثيقة رسمية متوافقة 100% مع معايير DIN 5008."
              : isDe
              ? "Laden Sie Ihren aktuellen Lebenslauf (PDF) in beliebiger Sprache hoch. Das System passt ihn sofort an, formuliert Ihre Erfahrungen im deutschen Substantivstil und erstellt ein 100% DIN 5008 konformes Dokument."
              : "Upload your current resume (PDF) in any language. The system instantly adapts it, crafts your experience in German Substantivstil, and generates an official document 100% compliant with DIN 5008 standards."}
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-medium text-center animate-shake">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          /* Loading Steps Animation */
          <div className="py-10 space-y-6 text-center">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-blue-600/20 animate-pulse" />
              <div className="w-20 h-20 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">
                ✨
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">
                {loadingStep === 1 &&
                  (isAr
                    ? "1/3 جاري قراءة ملف السيرة واستخراج البيانات..."
                    : isDe
                    ? "1/3 Text wird aus PDF extrahiert..."
                    : "1/3 Extracting and analyzing CV text...")}
                {loadingStep === 2 &&
                  (isAr
                    ? "2/3 جاري الترجمة والتحويل إلى معايير DIN 5008 الألمانية..."
                    : isDe
                    ? "2/3 Übersetzung und DIN 5008 Formatierung..."
                    : "2/3 Translating & standardizing to DIN 5008...")}
                {loadingStep === 3 &&
                  (isAr
                    ? "3/3 جاري تحسين الصياغة المهنية (Substantivstil) وسد ثغرات ATS..."
                    : isDe
                    ? "3/3 Optimierung im Substantivstil & ATS-Korrektur..."
                    : "3/3 Polishing bullet points in Substantivstil & ATS auto-fix...")}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? "قد تستغرق العملية بضع ثوانٍ للحصول على أفضل دقة..."
                  : isDe
                  ? "Dies dauert nur wenige Sekunden..."
                  : "This usually takes just a few seconds..."}
              </p>
            </div>
          </div>
        ) : (
          /* Input Form */
          <div className="space-y-4">
            {/* Mode Switcher (File vs Text) */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setInputMode("file")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  inputMode === "file"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {isAr ? "📄 رفع ملف PDF" : isDe ? "📄 PDF hochladen" : "📄 Upload PDF"}
              </button>
              <button
                type="button"
                onClick={() => setInputMode("text")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  inputMode === "text"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {isAr ? "✍️ لصق نص السيرة" : isDe ? "✍️ Text einfügen" : "✍️ Paste Text"}
              </button>
            </div>

            {/* Target Job Title (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr
                  ? "المسمى الوظيفي المستهدف في ألمانيا (اختياري)"
                  : isDe
                  ? "Angestrebte Position in Deutschland (Optional)"
                  : "Target Job Title in Germany (Optional)"}
              </label>
              <input
                type="text"
                value={targetJobTitle}
                onChange={(e) => setTargetJobTitle(e.target.value)}
                placeholder={
                  isAr
                    ? "مثال: Frontend-Entwickler أو Pflegefachkraft"
                    : isDe
                    ? "z.B. Softwareentwickler oder Pflegefachkraft"
                    : "e.g., Software Engineer or Nurse"
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs sm:text-sm transition-all"
              />
            </div>

            {inputMode === "file" ? (
              /* Drag & Drop PDF Area */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? "border-blue-500 bg-blue-600/10 scale-[0.99]"
                    : selectedFile
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-slate-800 hover:border-slate-700 bg-slate-950/60"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl">
                      ✓
                    </div>
                    <div className="font-bold text-white text-sm truncate max-w-xs mx-auto">
                      {selectedFile.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                      <span className="text-blue-400 underline">
                        {isAr ? "تغيير الملف" : isDe ? "Datei ändern" : "Change file"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto text-xl">
                      📂
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {isAr
                        ? "اسحب وأفلت ملف PDF هنا، أو انقر للاختيار"
                        : isDe
                        ? "PDF-Datei hierher ziehen oder klicken"
                        : "Drag & drop your PDF here, or click to browse"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {isAr
                        ? "يدعم صيغة PDF حتى 10 ميغابايت"
                        : isDe
                        ? "PDF bis zu 10MB unterstützt"
                        : "Supports PDF files up to 10MB"}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Paste Raw Text */
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isAr ? "الصق نص السيرة الذاتية هنا" : isDe ? "Lebenslauftext hier einfügen" : "Paste your CV text here"}
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  rows={6}
                  placeholder={
                    isAr
                      ? "الصق النص الكامل لسيرتك الذاتية الحالية بأي لغة..."
                      : isDe
                      ? "Fügen Sie den vollständigen Text Ihres Lebenslaufs ein..."
                      : "Paste the full text of your existing resume in any language..."
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs sm:text-sm font-sans transition-all resize-none"
                />
              </div>
            )}

            {/* Credit Note & Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>
                  {isAr
                    ? "⚡ تستهلك 1 رصيد AI (استرجاع تلقائي في حال حدوث خطأ)"
                    : isDe
                    ? "⚡ Kostet 1 KI-Guthaben (automatische Rückerstattung bei Fehlern)"
                    : "⚡ Uses 1 AI Credit (auto-refunded on error)"}
                </span>
                <span className="text-emerald-400 font-bold">DIN 5008 Auto-Fix</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  {isAr ? "إلغاء" : isDe ? "Abbrechen" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleStartImport}
                  className="flex-1 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-blue-600/30 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>✨</span>
                  <span>
                    {isAr
                      ? "تحويل فوري (1-Click PDF)"
                      : isDe
                      ? "Sofort-Konvertierung starten"
                      : "Start 1-Click Conversion"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
