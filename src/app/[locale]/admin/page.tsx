"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface UserItem {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  planExpiresAt: string | null;
  aiCredits: number;
  customerId: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    cvs: number;
    coverLetters: number;
  };
}

interface PlatformStats {
  totalUsers: number;
  proUsers: number;
  totalAiCredits: number;
}

export default function AdminDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "ar";
  const isAr = locale === "ar";

  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    proUsers: 0,
    totalAiCredits: 0,
  });
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [planFilter, setPlanFilter] = useState<"ALL" | "PRO" | "FREE" | "TRIAL">("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Refresh trigger for data reloading
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    let isCancelled = false;

    const fetchDashboardData = async () => {
      try {
        const res = await fetch("/api/admin/users", {
          credentials: "include",
        });

        if (res.status === 401) {
          router.push(`/${locale}/admin/login`);
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `خطأ في الخادم (${res.status})`);
        }

        const data = await res.json();
        if (!isCancelled) {
          setStats(data.stats || { totalUsers: 0, proUsers: 0, totalAiCredits: 0 });
          setUsers(data.users || []);
        }
      } catch (err: unknown) {
        console.error("Dashboard data fetch error:", err);
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "تعذر جلب بيانات لوحة التحكم.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isCancelled = true;
    };
  }, [refreshTrigger, locale, router]);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  // Quick Action: Toggle PRO Plan
  const handleTogglePro = async (userId: string, currentEmail: string) => {
    setActionLoadingId(`pro-${userId}`);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "toggle_pro",
          userId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تعديل حالة الاشتراك PRO");
      }

      // Update local state smoothly
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u))
      );

      // Recalculate stats smoothly
      setStats((prev) => ({
        ...prev,
        proUsers: data.user.plan === "PRO" ? prev.proUsers + 1 : Math.max(0, prev.proUsers - 1),
      }));

      setFeedback({
        type: "success",
        message: data.message || `تم تحديث خطة ${currentEmail} بنجاح.`,
      });
    } catch (err: unknown) {
      console.error("Toggle PRO error:", err);
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "حدث خطأ أثناء تغيير خطة المستخدم.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Action: Add 50 AI Credits
  const handleAddCredits = async (userId: string, currentEmail: string, amount: number = 50) => {
    setActionLoadingId(`credits-${userId}`);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "add_credits",
          userId,
          amount,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل إضافة رصيد الذكاء الاصطناعي");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u))
      );

      setStats((prev) => ({
        ...prev,
        totalAiCredits: prev.totalAiCredits + amount,
      }));

      setFeedback({
        type: "success",
        message: data.message || `تمت إضافة +${amount} رصيد AI لـ ${currentEmail}.`,
      });
    } catch (err: unknown) {
      console.error("Add credits error:", err);
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "حدث خطأ أثناء إضافة الرصيد.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push(`/${locale}/admin/login`);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.email.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase().trim());

      if (!matchesSearch) return false;

      if (planFilter === "ALL") return true;
      if (planFilter === "PRO") {
        const isPro = u.plan === "PRO" && (!u.planExpiresAt || new Date(u.planExpiresAt) > new Date());
        return isPro;
      }
      if (planFilter === "FREE") {
        return u.plan === "FREE";
      }
      if (planFilter === "TRIAL") {
        return u.plan === "TRIAL";
      }

      return true;
    });
  }, [users, searchTerm, planFilter]);

  const proPercentage = stats.totalUsers > 0 ? Math.round((stats.proUsers / stats.totalUsers) * 100) : 0;
  const avgCredits = stats.totalUsers > 0 ? Math.round(stats.totalAiCredits / stats.totalUsers) : 0;

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Navbar & Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <Link
                href={`/${locale}`}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 transition"
              >
                {isAr ? "← العودة إلى الموقع" : "← Back to Home"}
              </Link>
              <span className="text-slate-600">•</span>
              <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
                PRO CONTROL PANEL
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>⚡ لوحة التحكم وإدارة المنصة</span>
            </h1>
            <p className="text-sm text-slate-400">
              {isAr
                ? "متابعة إحصائيات المستخدمين، اشتراكات PRO، وأرصدة الذكاء الاصطناعي في GermanJobsPro."
                : "Manage platform users, PRO passes, and AI credits."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/${locale}/admin/support`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs sm:text-sm font-medium transition"
            >
              <span>📩</span>
              <span>{isAr ? "تذاكر الدعم" : "Support Tickets"}</span>
            </Link>

            <Link
              href={`/${locale}/admin/subscribers`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs sm:text-sm font-medium transition"
            >
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>{isAr ? "المشتركون (Email List)" : "Subscribers"}</span>
            </Link>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs sm:text-sm font-medium transition cursor-pointer disabled:opacity-50"
              title="Refresh Data"
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
              <span>{isAr ? "تحديث" : "Refresh"}</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs sm:text-sm font-medium transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{isAr ? "تسجيل الخروج" : "Logout"}</span>
            </button>
          </div>
        </header>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-sm flex items-center justify-between gap-3 animate-fadeIn ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/20 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === "success" ? (
                <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={handleRefresh}
              className="underline text-xs font-semibold hover:text-white"
            >
              {isAr ? "إعادة المحاولة" : "Retry"}
            </button>
          </div>
        )}

        {/* 3 STATS CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Total Users */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800/90 p-6 shadow-xl backdrop-blur-sm group hover:border-slate-700 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-600/20 transition" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {isAr ? "إجمالي المستخدمين المسجلين" : "Total Registered Users"}
              </span>
              <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                {loading ? "..." : stats.totalUsers}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {isAr ? "مستخدم" : "users"}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isAr ? "قاعدة بيانات مستخدمي المنصة الحية" : "Live platform database"}</span>
            </div>
          </div>

          {/* Card 2: PRO Subscribers */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800/90 p-6 shadow-xl backdrop-blur-sm group hover:border-amber-500/30 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/90">
                {isAr ? "مشتركو PRO النشطون" : "Active PRO Subscribers"}
              </span>
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-amber-300 font-mono">
                {loading ? "..." : stats.proUsers}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {proPercentage}% {isAr ? "من الأعضاء" : "of total"}
              </span>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              <span>{isAr ? "اشتراكات مدفوعة + وصول غير محدود للذكاء الاصطناعي" : "Paid passes + unlimited AI tools"}</span>
            </div>
          </div>

          {/* Card 3: Total AI Credits */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800/90 p-6 shadow-xl backdrop-blur-sm group hover:border-blue-500/30 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-600/20 transition" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400/90">
                {isAr ? "إجمالي رصيد الذكاء الاصطناعي" : "Total AI Credits In Circulation"}
              </span>
              <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-blue-300 font-mono">
                {loading ? "..." : stats.totalAiCredits.toLocaleString()}
              </span>
              <span className="text-xs text-blue-400/80 font-medium">
                ⚡ {isAr ? "رصيد متاح" : "credits available"}
              </span>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              <span>{isAr ? `متوسط ${avgCredits} رصيد لكل مستخدم` : `Avg ~${avgCredits} credits per user`}</span>
            </div>
          </div>
        </section>

        {/* CONTROLS & SEARCH BAR */}
        <section className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 shadow-lg backdrop-blur-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Live Search Input */}
            <div className="relative flex-1 max-w-lg">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isAr ? "ابحث بالبريد الإلكتروني أو الاسم أو المعرّف..." : "Search by email, name, or ID..."}
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm font-sans"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Plan Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium ml-1">
                {isAr ? "تصفية الخطة:" : "Filter:"}
              </span>

              {(["ALL", "PRO", "FREE", "TRIAL"] as const).map((filterOption) => {
                const isActive = planFilter === filterOption;
                const labelMap = {
                  ALL: isAr ? "الكل" : "All",
                  PRO: "PRO ⭐",
                  FREE: isAr ? "مجاني" : "Free",
                  TRIAL: isAr ? "تجريبي" : "Trial",
                };

                return (
                  <button
                    key={filterOption}
                    onClick={() => setPlanFilter(filterOption)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-500"
                        : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {labelMap[filterOption]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/50">
            <div>
              {isAr ? (
                <>عرض <span className="text-white font-bold">{filteredUsers.length}</span> من أصل <span className="text-white font-bold">{users.length}</span> مستخدم</>
              ) : (
                <>Showing <span className="text-white font-bold">{filteredUsers.length}</span> of <span className="text-white font-bold">{users.length}</span> users</>
              )}
            </div>

            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-blue-400 hover:underline cursor-pointer"
              >
                {isAr ? "إلغاء البحث" : "Clear search"}
              </button>
            )}
          </div>
        </section>

        {/* USERS DATA TABLE */}
        <section className="bg-slate-900/80 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
          {loading ? (
            <div className="p-16 text-center space-y-4">
              <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-slate-400 font-medium">
                {isAr ? "جاري تحميل بيانات المستخدمين..." : "Loading users data..."}
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto text-xl">
                🔍
              </div>
              <h3 className="text-base font-bold text-white">
                {isAr ? "لم يتم العثور على مستخدمين" : "No users found"}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {isAr
                  ? "جرّب تغيير كلمات البحث أو تغيير محددات التصفية."
                  : "Try modifying your search keywords or active filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">{isAr ? "المستخدم" : "User"}</th>
                    <th className="py-4 px-6">{isAr ? "الخطة والحالة" : "Plan & Status"}</th>
                    <th className="py-4 px-6">{isAr ? "رصيد AI" : "AI Credits"}</th>
                    <th className="py-4 px-6">{isAr ? "الملفات المنشأة" : "Generated Docs"}</th>
                    <th className="py-4 px-6">{isAr ? "تاريخ التسجيل" : "Joined"}</th>
                    <th className="py-4 px-6 text-center">{isAr ? "إجراءات سريعة" : "Quick Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((user) => {
                    const isPro = user.plan === "PRO" && (!user.planExpiresAt || new Date(user.planExpiresAt) > new Date());
                    const isActionLoading = actionLoadingId?.includes(user.id);
                    const formattedDate = new Date(user.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    });

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-800/30 transition duration-150 group"
                      >
                        {/* User info */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0">
                              {(user.name?.[0] || user.email[0] || "U").toUpperCase()}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <div className="font-bold text-white text-sm truncate flex items-center gap-2">
                                <span>{user.name || (isAr ? "بدون اسم" : "Unnamed")}</span>
                                {isPro && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                                    PRO
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 font-mono truncate">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Plan & Status */}
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            {isPro ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                PRO PASS ⭐
                              </span>
                            ) : user.plan === "TRIAL" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                TRIAL (تجريبي)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                FREE (مجاني)
                              </span>
                            )}

                            {user.planExpiresAt && (
                              <div className="text-[11px] text-slate-500 font-mono">
                                {isAr ? "ينتهي:" : "Exp:"} {new Date(user.planExpiresAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* AI Credits */}
                        <td className="py-4 px-6">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono font-bold text-xs">
                            <span>⚡</span>
                            <span>{user.aiCredits}</span>
                            <span className="text-[10px] text-blue-400/70 font-sans">{isAr ? "رصيد" : "credits"}</span>
                          </div>
                        </td>

                        {/* Created Documents */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-slate-300">
                              📄 {user._count?.cvs ?? 0} CV
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-slate-300">
                              ✉️ {user._count?.coverLetters ?? 0} CL
                            </span>
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                          {formattedDate}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            {/* Toggle PRO Button */}
                            <button
                              onClick={() => handleTogglePro(user.id, user.email)}
                              disabled={isActionLoading}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                isPro
                                  ? "bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30"
                                  : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 hover:border-amber-500/50"
                              }`}
                              title={isPro ? "Downgrade to FREE" : "Upgrade to PRO (90 days)"}
                            >
                              {actionLoadingId === `pro-${user.id}` ? (
                                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                <span>{isPro ? (isAr ? "إلغاء PRO" : "Revoke PRO") : (isAr ? "ترقية PRO ⭐" : "Grant PRO ⭐")}</span>
                              )}
                            </button>

                            {/* Add +50 Credits Button */}
                            <button
                              onClick={() => handleAddCredits(user.id, user.email, 50)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 hover:border-blue-500/50 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Add 50 AI Credits"
                            >
                              {actionLoadingId === `credits-${user.id}` ? (
                                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                <>
                                  <span>+50</span>
                                  <span>⚡</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
