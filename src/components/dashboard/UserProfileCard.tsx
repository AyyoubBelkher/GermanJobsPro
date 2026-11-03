"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface UserProfileCardProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
    plan: string;
    planExpiresAt?: string | Date | null;
    aiCredits: number;
    customerId?: string | null;
  };
  locale?: string;
}

export default function UserProfileCard({ user, locale = "ar" }: UserProfileCardProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAr = locale === "ar";
  const isDe = locale === "de";

  const [currentAvatar, setCurrentAvatar] = useState<string | null>(user.avatarUrl || null);
  const [currentName, setCurrentName] = useState<string>(user.name || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.name || "");
  const [uploading, setUploading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isPro =
    (user.plan === "PRO" || user.plan === "SPRINT") &&
    (!user.planExpiresAt || new Date(user.planExpiresAt) > new Date());

  const displayName = currentName.trim() || user.email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotification(
        "error",
        isAr ? "يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP)" : "Please select a valid image file"
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const targetSize = 400;
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            showNotification("error", isAr ? "فشل تجهيز الصورة" : "Failed to process image");
            return;
          }

          // Center-crop to square
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;

          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);

          const base64Jpeg = canvas.toDataURL("image/jpeg", 0.85);
          uploadAvatar(base64Jpeg);
        } catch {
          showNotification("error", isAr ? "حدث خطأ أثناء معالجة الصورة" : "Error processing image");
        }
      };
      img.onerror = () => {
        showNotification("error", isAr ? "تعذر قراءة ملف الصورة" : "Could not read image file");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input so re-selecting same file triggers onChange
    e.target.value = "";
  };

  const uploadAvatar = async (base64Data: string) => {
    setUploading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: base64Data }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update avatar");
      }

      setCurrentAvatar(base64Data);
      showNotification(
        "success",
        isAr ? "تم تحديث الصورة الشخصية بنجاح" : "Profile avatar updated successfully"
      );

      // Dispatch global event so Navbar can immediately update without page reload
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("user-profile-updated", {
            detail: { avatarUrl: base64Data, name: currentName },
          })
        );
      }

      router.refresh();
    } catch (err: unknown) {
      showNotification(
        "error",
        err instanceof Error ? err.message : isAr ? "فشل حفظ الصورة" : "Failed to save avatar"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === currentName) {
      setIsEditingName(false);
      return;
    }

    setSavingName(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update name");
      }

      setCurrentName(trimmed);
      setIsEditingName(false);
      showNotification(
        "success",
        isAr ? "تم تحديث الاسم بنجاح" : "Name updated successfully"
      );

      // Dispatch global event so Navbar can immediately update without page reload
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("user-profile-updated", {
            detail: { avatarUrl: currentAvatar, name: trimmed },
          })
        );
      }

      router.refresh();
    } catch (err: unknown) {
      showNotification(
        "error",
        err instanceof Error ? err.message : isAr ? "فشل حفظ الاسم" : "Failed to save name"
      );
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="bg-[#131722] border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center transition-all">
      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarSelect}
        className="hidden"
        aria-label="Upload profile avatar"
      />

      {/* Notification banner */}
      {notification && (
        <div
          className={`mb-5 px-4 py-2.5 rounded-2xl text-xs font-semibold inline-flex items-center gap-2 animate-fadeIn transition-all ${
            notification.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
          }`}
        >
          <span>{notification.type === "success" ? "✓" : "⚠️"}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Avatar Container with Google Pro Gradient Ring */}
      <div className="relative inline-block mx-auto">
        <div
          className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[3.5px] mx-auto transition-transform ${
            isPro
              ? "bg-gradient-to-tr from-[#3b82f6] via-[#60a5fa] to-[#c084fc] shadow-[0_0_25px_rgba(59,130,246,0.35)]"
              : "bg-slate-700 shadow-lg"
          }`}
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center border-2 border-[#131722] relative group">
            {currentAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentAvatar}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl sm:text-4xl font-extrabold text-white select-none">
                {initial}
              </span>
            )}

            {/* Uploading overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-400 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Circular Pencil Edit Button (positioned at bottom-left) */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-[#202124] hover:bg-slate-700 border border-slate-600 text-slate-200 flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
          title={isAr ? "تغيير الصورة الشخصية" : "Change profile avatar"}
          aria-label="Change profile avatar"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
        </button>
      </div>

      {/* Pro / Starter Pill Badge directly below Avatar */}
      <div className="mt-3 flex justify-center">
        {isPro ? (
          <div className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-[#1e2638] border border-blue-400/30 text-white font-semibold text-xs tracking-wide shadow-[0_4px_14px_rgba(59,130,246,0.25)]">
            Pro
          </div>
        ) : (
          <Link
            href={`/${locale}/dashboard/pricing`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 font-medium text-xs tracking-wide transition-all group"
          >
            <span>⚡ Starter</span>
            <span className="text-amber-400 font-bold group-hover:underline">
              ({isAr ? "ترقية إلى Pro" : isDe ? "Auf Pro upgraden" : "Upgrade to Pro"})
            </span>
          </Link>
        )}
      </div>

      {/* User Name (with inline edit) & Email */}
      <div className="mt-3 space-y-1">
        {isEditingName ? (
          <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") {
                  setNameInput(currentName);
                  setIsEditingName(false);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-blue-500/60 text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-center w-full"
              placeholder={isAr ? "اكتب اسمك هنا" : "Enter your name"}
              autoFocus
              disabled={savingName}
            />
            <button
              type="button"
              onClick={handleSaveName}
              disabled={savingName}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {savingName ? "..." : isAr ? "حفظ" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setNameInput(currentName);
                setIsEditingName(false);
              }}
              disabled={savingName}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center justify-center gap-2 group">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {displayName}
            </h1>
            <button
              type="button"
              onClick={() => {
                setNameInput(currentName);
                setIsEditingName(true);
              }}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity cursor-pointer rounded-lg hover:bg-slate-800"
              title={isAr ? "تعديل الاسم" : "Edit Name"}
              aria-label="Edit Name"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
            </button>
          </div>
        )}

        <p className="text-sm text-slate-400 font-sans">{user.email}</p>
      </div>

      {/* Feature & Credits Status Bar */}
      <div className="mt-5 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-center sm:justify-between gap-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-emerald-400">⚡</span>
            <span>
              {isPro
                ? isAr
                  ? "20 طلب ذكاء اصطناعي يومياً (متجددة)"
                  : isDe
                  ? "20 KI-Anfragen täglich (erneuert)"
                  : "20 Daily AI Requests (renewed)"
                : `${user.aiCredits} ${
                    isAr ? "رصيد AI متبقي" : isDe ? "KI-Credits übrig" : "AI Credits Left"
                  }`}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isPro ? (
            <Link
              href={`/${locale}/dashboard/pricing`}
              className="px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-400/30 text-blue-300 font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs"
            >
              <svg className="w-4 h-4 shrink-0 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-6 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
              </svg>
              <span>
                {isAr ? "إدارة خطة Pro" : isDe ? "Pro-Tarif verwalten" : "Manage Pro Plan"}
              </span>
            </Link>
          ) : (
            <Link
              href={`/${locale}/dashboard/pricing`}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <svg className="w-4 h-4 shrink-0 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-6 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
              </svg>
              <span>
                {isAr ? "الترقية إلى Pro" : isDe ? "Auf Pro upgraden" : "Upgrade to Pro"}
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
