"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Subscriber {
  id: string;
  email: string;
  active: boolean;
  createdAt: string;
}



export default function AdminSubscribersPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchSubscribers = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/subscribers", {
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `خطأ في الخادم (${res.status})`);
      }

      const data = await res.json();
      setSubscribers(data.subscribers || []);
    } catch (err: any) {
      console.error("Error fetching subscribers:", err);
      setError(err.message || "تعذر جلب قائمة المشتركين.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleDelete = async (id: string, email: string) => {
    if (!window.confirm(`هل أنت تأكد من رغبتك في حذف المشترك (${email})؟`)) {
      return;
    }

    setDeletingId(id);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/admin/subscribers?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "فشل حذف المشترك.");
      }

      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      setActionMessage({
        type: "success",
        text: `تم حذف البريد الإلكتروني (${email}) بنجاح.`,
      });
    } catch (err: any) {
      console.error("Error deleting subscriber:", err);
      setActionMessage({
        type: "error",
        text: err.message || "حدث خطأ أثناء محاولة الحذف.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSubscribers = subscribers.filter((sub) =>
    sub.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = subscribers.filter((s) => s.active).length;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link
                href={`/${locale}`}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
              >
                ← العودة إلى الرئيسية
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>📧 لوحة إدارة المشتركين في النشرة البريدية</span>
            </h1>
            <p className="text-sm text-slate-400">
              عرض وإدارة قائمة مشتركي النشرة البريدية الخاصة بالموقع.
            </p>
          </div>

          <button
            onClick={fetchSubscribers}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-sm font-semibold transition border border-slate-700 shadow-sm"
          >
            <svg
              className={`w-4 h-4 text-blue-400 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            تحديث القائمة
          </button>
        </div>

        {/* Action / Alert Notification */}
        {actionMessage && (
          <div
            className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${
              actionMessage.type === "success"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs underline hover:opacity-80"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              إجمالي المشتركين
            </div>
            <div className="text-3xl font-extrabold text-white">
              {loading ? "..." : subscribers.length}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              المشتركون النشطون
            </div>
            <div className="text-3xl font-extrabold text-emerald-400">
              {loading ? "..." : activeCount}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              حالة الجلسة
            </div>
            <div className="text-xs font-mono text-slate-300 truncate mt-2 bg-slate-950 p-2 rounded border border-slate-800">
              admin_session (Cookie)
            </div>
          </div>
        </div>

        {/* Search Bar & Table Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="البحث بالبريد الإلكتروني..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="text-xs text-slate-400">
            عرض {filteredSubscribers.length} من أصل {subscribers.length} مشترك
          </div>
        </div>

        {/* Error View */}
        {error && (
          <div className="p-6 bg-rose-950/40 border border-rose-800/80 rounded-2xl text-center space-y-3">
            <p className="text-rose-300 text-sm font-medium">{error}</p>
            <button
              onClick={fetchSubscribers}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Main Subscribers Table */}
        {!error && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <svg
                  className="animate-spin h-8 w-8 text-blue-500 mx-auto"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="text-sm">جاري تحميل المشتركين...</p>
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-base font-semibold text-slate-200">لا يوجد مشتركين للعرض</p>
                <p className="text-xs text-slate-500">
                  {searchTerm
                    ? "لم يتم العثور على أي بريد إلكتروني يطابق البحث."
                    : "قم بنشر نماذج الاشتراك في المقالات لجذب المشتركين."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-xs font-semibold uppercase">
                      <th className="py-4 px-6 text-center w-16">#</th>
                      <th className="py-4 px-6">البريد الإلكتروني</th>
                      <th className="py-4 px-6 text-center">الحالة</th>
                      <th className="py-4 px-6">تاريخ الانضمام</th>
                      <th className="py-4 px-6 text-center w-28">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-200">
                    {filteredSubscribers.map((sub, index) => (
                      <tr
                        key={sub.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-4 px-6 text-center text-slate-500 text-xs font-mono">
                          {index + 1}
                        </td>
                        <td className="py-4 px-6 font-medium text-white font-mono">
                          {sub.email}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              sub.active
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {sub.active ? "نشط" : "غير نشط"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-400 text-xs dir-ltr text-right">
                          {new Date(sub.createdAt).toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleDelete(sub.id, sub.email)}
                            disabled={deletingId === sub.id}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition border border-rose-900/40 disabled:opacity-50"
                            title="حذف المشترك"
                          >
                            {deletingId === sub.id ? (
                              <svg
                                className="animate-spin h-4 w-4 text-rose-400"
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
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
