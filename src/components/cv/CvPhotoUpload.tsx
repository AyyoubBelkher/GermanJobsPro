"use client";

import React, { useState, useRef, useCallback } from "react";
import FieldTooltip from "@/components/cv/FieldTooltip";

interface CvPhotoUploadProps {
  photoUrl?: string | null;
  onChange: (newPhotoUrl: string | null) => void;
  isAr?: boolean;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit
const MAX_DIMENSION = 800; // Optimal resolution for DIN 5008 resume photos

/**
 * Resizes and optimizes an image file using an offscreen HTML5 Canvas.
 * Outputs a crisp, high-resolution Base64 JPEG/PNG Data URL of small footprint (<150KB).
 */
async function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read image file"));

    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image format"));

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Scale proportionally to max dimension
          if (width > height) {
            if (width > MAX_DIMENSION) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            // Fallback directly to raw Data URL if canvas 2D context fails
            resolve(readerEvent.target?.result as string);
            return;
          }

          // Fill background with white to prevent black background on transparent PNGs when exported as JPEG
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          // Export as optimized JPEG
          const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
          resolve(optimizedDataUrl);
        } catch {
          // Fallback to raw Data URL
          resolve(readerEvent.target?.result as string);
        }
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

export default function CvPhotoUpload({ photoUrl, onChange, isAr = true }: CvPhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState(photoUrl || "");

  const handleFile = useCallback(
    async (file: File) => {
      setErrorMessage(null);

      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        setErrorMessage(
          isAr
            ? "يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP)."
            : "Please select a valid image file (JPG, PNG, or WEBP)."
        );
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(
          isAr
            ? "حجم الصورة كبير جداً (الحد الأقصى المسموح به هو 5 ميجابايت)."
            : "Image size is too large (max allowed is 5MB)."
        );
        return;
      }

      setIsProcessing(true);

      try {
        const optimizedBase64 = await processImageFile(file);
        onChange(optimizedBase64);
        setUrlInputValue(optimizedBase64);
      } catch (err: unknown) {
        console.error("Image processing error:", err);
        setErrorMessage(
          isAr
            ? "حدث خطأ أثناء معالجة الصورة. يرجى تجربة صورة أخرى."
            : "Error processing the image. Please try another file."
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [isAr, onChange]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleRemovePhoto = () => {
    onChange(null);
    setUrlInputValue("");
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInputValue.trim()) {
      onChange(null);
    } else {
      onChange(urlInputValue.trim());
    }
  };

  return (
    <div className="space-y-3 sm:col-span-2">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <span>📷 {isAr ? "الصورة الشخصية للتقديم (Bewerbungsfoto)" : "Professional Photo (Bewerbungsfoto)"}</span>
          <FieldTooltip fieldKey="photoUrl" locale={isAr ? "ar" : "de"} />
        </label>

        {/* Toggle between File Upload and URL Mode */}
        <button
          type="button"
          onClick={() => setIsUrlMode(!isUrlMode)}
          className="text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer transition font-medium"
        >
          {isUrlMode
            ? isAr
              ? "📁 رفع ملف من الجهاز"
              : "📁 Upload file instead"
            : isAr
            ? "🔗 إدخال رابط URL مباشر"
            : "🔗 Use Image URL"}
        </button>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between gap-2 animate-fadeIn">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {isUrlMode ? (
        /* Alternative URL Input Mode */
        <div className="space-y-2">
          <form onSubmit={handleUrlSubmit} className="flex gap-2">
            <input
              type="text"
              value={urlInputValue}
              onChange={(e) => {
                setUrlInputValue(e.target.value);
                onChange(e.target.value.trim() || null);
              }}
              placeholder="https://example.com/my-photo.jpg"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-hidden"
            />
            {urlInputValue && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                {isAr ? "مسح" : "Clear"}
              </button>
            )}
          </form>
          <p className="text-[11px] text-slate-500">
            {isAr
              ? "أدخل رابط صورة مباشر بصيغة JPG أو PNG. تأكد من أن الرابط متاح للعامة."
              : "Enter a direct public URL to your portrait photo."}
          </p>
        </div>
      ) : photoUrl ? (
        /* Preview with Edit/Remove Controls */
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-inner">
          {/* Photo Thumbnail in 3.5:4.5 DIN 5008 Portrait Ratio */}
          <div className="relative group shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt="Bewerbungsfoto"
              className="w-24 h-32 sm:w-28 sm:h-36 object-cover rounded-xl border border-slate-700 shadow-md transition group-hover:brightness-105"
            />
            <div className="absolute inset-0 rounded-xl bg-blue-500/10 opacity-0 group-hover:opacity-100 transition pointer-events-none" />
          </div>

          <div className="space-y-3 flex-1 text-center sm:text-right">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span>✓</span>
                <span>{isAr ? "تم تعيين الصورة بنجاح" : "Photo uploaded successfully"}</span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr
                  ? "تظهر صورتك الآن في المعاينة المباشرة ومستند الـ PDF وفق معيار DIN 5008."
                  : "Your photo will render in the live preview and DIN 5008 PDF exports."}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>🔄</span>
                <span>{isAr ? "تغيير الصورة" : "Change photo"}</span>
              </button>

              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={isProcessing}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>🗑️</span>
                <span>{isAr ? "حذف الصورة" : "Remove"}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Drag-and-Drop / Click-to-Upload Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-3 group ${
            isDragging
              ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10 scale-[1.01]"
              : "border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950/90"
          }`}
        >
          {isProcessing ? (
            <div className="py-4 space-y-2">
              <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-xs text-slate-300 font-semibold">
                {isAr ? "جاري تحسين وضغط الصورة..." : "Optimizing image..."}
              </p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto text-2xl group-hover:scale-110 transition-transform">
                📸
              </div>

              <div className="space-y-1">
                <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                  {isAr
                    ? "اسحب وأفلت صورة السيرة الذاتية هنا أو اضغط للاختيار"
                    : "Drag and drop your CV photo here or click to browse"}
                </p>
                <p className="text-xs text-slate-400">
                  {isAr
                    ? "صيغ مدعومة: JPG, PNG, WEBP (الحد الأقصى 5 ميجابايت)"
                    : "Supports JPG, PNG, WEBP (Max 5MB)"}
                </p>
              </div>

              <div className="pt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  💡 {isAr ? "يتم ضغط الصورة تلقائياً لتناسب معيار DIN 5008 بجودة فائقة" : "Auto-optimized for DIN 5008 standard"}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
