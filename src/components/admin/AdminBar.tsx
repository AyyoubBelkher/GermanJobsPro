"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface AdminBarProps {
  post: {
    id: string;
    title: string;
    slug: string;
    markdown_content: string;
    category?: string | null;
    image_url?: string | null;
    source_link?: string | null;
  };
  locale?: string;
}

export default function AdminBar({ post, locale = "ar" }: AdminBarProps) {
  const router = useRouter();

  // Modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState(post.title);
  const [markdownContent, setMarkdownContent] = useState(post.markdown_content);
  const [category, setCategory] = useState(post.category || "");
  const [imageUrl, setImageUrl] = useState(post.image_url || "");
  const [sourceLink, setSourceLink] = useState(post.source_link || "");

  // UI feedback states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  // Handle Update Post (PUT)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/posts/${post.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          markdown_content: markdownContent,
          category,
          image_url: imageUrl || null,
          source_link: sourceLink || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || (isAr ? "فشل تحديث المقال" : "Failed to update post"));
        setLoading(false);
        return;
      }

      setSuccessMessage(isAr ? "تم تحديث المقال بنجاح!" : "Post updated successfully!");
      setLoading(false);

      setTimeout(() => {
        setIsEditOpen(false);
        setSuccessMessage("");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      console.error("Update post error:", err);
      setErrorMessage(isAr ? "حدث خطأ أثناء التحديث" : "An error occurred while updating");
      setLoading(false);
    }
  };

  // Handle Delete Post (DELETE)
  const handleDelete = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/posts/${post.slug}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || (isAr ? "فشل حذف المقال" : "Failed to delete post"));
        setLoading(false);
        return;
      }

      // Redirect to blog home after successful deletion
      window.location.href = `/${locale}/blog`;
    } catch (err: any) {
      console.error("Delete post error:", err);
      setErrorMessage(isAr ? "حدث خطأ أثناء الحذف" : "An error occurred while deleting");
      setLoading(false);
    }
  };

  // Handle Admin Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      window.location.href = window.location.pathname;
    } catch (err) {
      console.error("Logout error:", err);
      window.location.reload();
    }
  };

  return (
    <>
      {/* Top Floating Sticky Admin Bar */}
      <div dir={dir} className="sticky top-4 z-50 max-w-4xl mx-auto mb-8 px-4">
        <div className="bg-slate-900/95 border border-amber-500/40 shadow-2xl rounded-2xl p-4 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 text-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
            <span className="text-xs sm:text-sm font-bold tracking-wide uppercase text-amber-400">
              {isAr ? "وضع المسؤول ⚡ Admin Mode" : "⚡ Admin Control Bar"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            {/* Edit Button */}
            <button
              onClick={() => setIsEditOpen(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold border border-blue-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <span>✏️</span>
              <span>{isAr ? "تعديل المقال" : "Edit Post"}</span>
            </button>

            {/* Delete Button */}
            <button
              onClick={() => setIsDeleteOpen(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold border border-rose-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <span>🗑️</span>
              <span>{isAr ? "حذف المقال" : "Delete Post"}</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <span>🚪</span>
              <span>{isAr ? "تسجيل الخروج" : "Logout"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div dir={dir} className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>✏️</span>
                <span>{isAr ? "تعديل المقال" : "Edit Blog Post"}</span>
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                type="button"
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm font-medium">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-medium">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isAr ? "عنوان المقال (Title)" : "Post Title"}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isAr ? "التصنيف (Category)" : "Category"}
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isAr ? "رابط الصورة (Image URL)" : "Image URL"}
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isAr ? "رابط المصدر / التقديم (Source Link)" : "Source / Application Link"}
                </label>
                <input
                  type="text"
                  value={sourceLink}
                  onChange={(e) => setSourceLink(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isAr ? "محتوى الماركداون (Markdown Content)" : "Markdown Content"}
                </label>
                <textarea
                  rows={10}
                  value={markdownContent}
                  onChange={(e) => setMarkdownContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-sm font-mono leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm cursor-pointer"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (isAr ? "جاري الحفظ..." : "Saving...") : isAr ? "حفظ التغييرات 💾" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteOpen && (
        <div dir={dir} className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-white">
                {isAr ? "تأكيد حذف المقال" : "Confirm Post Deletion"}
              </h3>

              <p className="text-sm text-slate-400 leading-relaxed">
                {isAr
                  ? "هل أنت متاكد من إرادتك لحذف هذا المقال نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء."
                  : "Are you sure you want to permanently delete this post from the database? This action cannot be undone."}
              </p>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 line-clamp-1">
                {post.title}
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm cursor-pointer"
              >
                {isAr ? "تراجع" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {loading ? (isAr ? "جاري الحذف..." : "Deleting...") : isAr ? "نعم، احذف المقال 🗑️" : "Delete Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
