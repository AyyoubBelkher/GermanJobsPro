"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface CvPersonalInfo {
  fullName: string;
  targetJobTitle: string | null;
  photoUrl: string | null;
  phone: string | null;
  address: string | null;
}

interface CvItem {
  id: string;
  title: string;
  language: string;
  updatedAt: string;
  personalInfo?: CvPersonalInfo | null;
}

interface CoverLetterItem {
  id: string;
  title: string;
  jobTitle: string;
  companyName: string;
  updatedAt: string;
}

interface UserItem {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  googleId?: string | null;
  plan: string;
  planExpiresAt: string | null;
  emailVerified: boolean;
  aiCredits: number;
  customerId: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    cvs: number;
    coverLetters: number;
  };
  cvs?: CvItem[];
  coverLetters?: CoverLetterItem[];
}

interface PlatformStats {
  totalUsers: number;
  proUsers: number;
  totalAiCredits: number;
  totalJobs?: number;
  totalCvs?: number;
  totalCoverLetters?: number;
}

interface PromoCodeItem {
  id: string;
  code: string;
  planGranted: string;
  durationDays: number;
  creditsGranted: number;
  maxUses: number;
  timesUsed: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

function UserAvatar({
  user,
  onClick,
}: {
  user: UserItem;
  onClick?: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const resolvedAvatar =
    user.avatarUrl ||
    user.cvs?.find((c) => c.personalInfo?.photoUrl)?.personalInfo?.photoUrl ||
    null;

  const isProActive =
    user.plan === "PRO" && (!user.planExpiresAt || new Date(user.planExpiresAt) > new Date());
  const isSprintActive =
    user.plan === "SPRINT" && (!user.planExpiresAt || new Date(user.planExpiresAt) > new Date());

  const ringClass = isProActive
    ? "border-amber-400 shadow-md shadow-amber-500/20"
    : isSprintActive
    ? "border-cyan-400 shadow-md shadow-cyan-500/20"
    : "border-slate-700";

  return (
    <div
      className={`relative w-11 h-11 shrink-0 rounded-2xl ${onClick ? "cursor-pointer hover:opacity-90" : ""}`}
      onClick={onClick}
      title={user.name || user.email}
    >
      {resolvedAvatar && !imageError ? (
        <img
          src={resolvedAvatar}
          alt={user.name || user.email}
          className={`w-11 h-11 rounded-2xl object-cover border-2 ${ringClass}`}
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className={`w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md border-2 ${ringClass}`}
        >
          {(user.name?.[0] || user.email[0] || "U").toUpperCase()}
        </div>
      )}

      {/* Google Auth Indicator Badge on bottom-left */}
      {user.googleId && (
        <span
          className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-white text-blue-600 font-black text-[9px] flex items-center justify-center border border-slate-900 shadow-sm select-none"
          title="تم التسجيل عبر حساب Google"
        >
          G
        </span>
      )}
    </div>
  );
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
    totalJobs: 0,
    totalCvs: 0,
    totalCoverLetters: 0,
  });
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search, Filter & Sort State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [planFilter, setPlanFilter] = useState<"ALL" | "PRO" | "SPRINT" | "FREE" | "TRIAL" | "HOT_LEADS">("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "most_docs" | "lowest_credits">("newest");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Refresh trigger for data reloading
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Job Sync / Cleanup States
  const [syncingJobs, setSyncingJobs] = useState<boolean>(false);
  const [cleaningJobs, setCleaningJobs] = useState<boolean>(false);

  // Promo Codes Modal State
  const [showPromoModal, setShowPromoModal] = useState<boolean>(false);
  const [promoCodes, setPromoCodes] = useState<PromoCodeItem[]>([]);
  const [loadingPromos, setLoadingPromos] = useState<boolean>(false);
  const [promoForm, setPromoForm] = useState({
    code: "",
    planGranted: "SPRINT",
    creditsGranted: 50,
    maxUses: 10,
    durationDays: 30,
  });
  const [creatingPromo, setCreatingPromo] = useState<boolean>(false);

  // User Dossier Inspector Modal State
  const [selectedUserForDossier, setSelectedUserForDossier] = useState<UserItem | null>(null);

  // Direct Resend Email Modal State
  const [selectedUserForEmail, setSelectedUserForEmail] = useState<UserItem | null>(null);
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [emailMessage, setEmailMessage] = useState<string>("");
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);

  const fetchDashboardData = useCallback(async () => {
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
      setStats(
        data.stats || {
          totalUsers: 0,
          proUsers: 0,
          totalAiCredits: 0,
          totalJobs: 0,
          totalCvs: 0,
          totalCoverLetters: 0,
        }
      );
      setUsers(data.users || []);
    } catch (err: unknown) {
      console.error("Dashboard data fetch error:", err);
      setError(err instanceof Error ? err.message : "تعذر جلب بيانات لوحة التحكم.");
    } finally {
      setLoading(false);
    }
  }, [locale, router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshTrigger]);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  // Plan Management Actions (SPRINT, PRO, FREE)
  const handleUpdatePlan = async (userId: string, currentEmail: string, targetPlan: "sprint" | "pro" | "free") => {
    setActionLoadingId(`plan-${targetPlan}-${userId}`);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: targetPlan,
          userId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تعديل خطة المستخدم.");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u))
      );

      if (selectedUserForDossier?.id === userId) {
        setSelectedUserForDossier((prev) => (prev ? { ...prev, ...data.user } : null));
      }

      const wasPaid = users.find((u) => u.id === userId)?.plan !== "FREE";
      const isPaidNow = targetPlan !== "free";
      if (!wasPaid && isPaidNow) {
        setStats((prev) => ({ ...prev, proUsers: prev.proUsers + 1 }));
      } else if (wasPaid && !isPaidNow) {
        setStats((prev) => ({ ...prev, proUsers: Math.max(0, prev.proUsers - 1) }));
      }

      setFeedback({
        type: "success",
        message: data.message || `تم تحديث خطة ${currentEmail} بنجاح.`,
      });
    } catch (err: unknown) {
      console.error("Plan update error:", err);
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "حدث خطأ أثناء تغيير خطة المستخدم.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Action: Add Credits
  const handleAddCredits = async (userId: string, currentEmail: string, amount: number) => {
    setActionLoadingId(`credits-${amount}-${userId}`);
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

      if (selectedUserForDossier?.id === userId) {
        setSelectedUserForDossier((prev) => (prev ? { ...prev, ...data.user } : null));
      }

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

  // Quick Action: Verify Email Manually
  const handleVerifyEmail = async (userId: string, currentEmail: string) => {
    setActionLoadingId(`verify-${userId}`);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "verify_email",
          userId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تفعيل البريد الإلكتروني");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u))
      );

      if (selectedUserForDossier?.id === userId) {
        setSelectedUserForDossier((prev) => (prev ? { ...prev, ...data.user } : null));
      }

      setFeedback({
        type: "success",
        message: data.message || `تم تفعيل بريد ${currentEmail} يدوياً بنجاح.`,
      });
    } catch (err: unknown) {
      console.error("Verify email error:", err);
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "حدث خطأ أثناء تفعيل البريد الإلكتروني.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Action: Delete User
  const handleDeleteUser = async (userId: string, currentEmail: string) => {
    const confirmed = window.confirm(
      isAr
        ? `هل أنت متأكد تماماً من حذف المستخدم (${currentEmail})؟ سيتم مسح كافة ملفاته وسجلاته نهائياً ولا يمكن التراجع عن هذا الإجراء.`
        : `Are you sure you want to permanently delete user (${currentEmail})? This cannot be undone.`
    );
    if (!confirmed) return;

    setActionLoadingId(`delete-${userId}`);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل حذف المستخدم.");
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setStats((prev) => ({ ...prev, totalUsers: Math.max(0, prev.totalUsers - 1) }));

      if (selectedUserForDossier?.id === userId) {
        setSelectedUserForDossier(null);
      }

      setFeedback({
        type: "success",
        message: data.message || `تم حذف المستخدم ${currentEmail} بنجاح.`,
      });
    } catch (err: unknown) {
      console.error("Delete user error:", err);
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "حدث خطأ أثناء حذف المستخدم.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Job Sync Controls
  const handleSyncJobsBa = async () => {
    setSyncingJobs(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/jobs/fetch-ba?size=25", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "فشل جلب وظائف وكالة العمل الألمانية.");
      }
      setFeedback({
        type: "success",
        message: data.message || `تم جلب وتحديث ${data.savedCount ?? data.total ?? 0} وظيفة بنجاح.`,
      });
      handleRefresh();
    } catch (err: unknown) {
      console.error("Job sync error:", err);
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "حدث خطأ أثناء جلب الوظائف.",
      });
    } finally {
      setSyncingJobs(false);
    }
  };

  const handleCleanupJobs = async () => {
    const confirmed = window.confirm(
      isAr
        ? "هل ترغب في تنظيف الوظائف الآن؟ سيتم فحص وحذف المقالات الإخبارية المتبقية والوظائف المنتهية."
        : "Clean expired and news job listings now?"
    );
    if (!confirmed) return;

    setCleaningJobs(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/jobs/cleanup-expired?mode=delete", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تنظيف الوظائف.");
      }
      setFeedback({
        type: "success",
        message:
          data.message ||
          `تم تنظيف الوظائف: حُذفت ${data.purgedNonJobsCount ?? 0} مقالة إخبارية و${data.expiredJobsCount ?? 0} وظيفة منتهية.`,
      });
      handleRefresh();
    } catch (err: unknown) {
      console.error("Cleanup jobs error:", err);
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "حدث خطأ أثناء تنظيف الوظائف.",
      });
    } finally {
      setCleaningJobs(false);
    }
  };

  // Promo Codes Modal Fetch & Create
  const fetchPromoCodes = async () => {
    setLoadingPromos(true);
    try {
      const res = await fetch("/api/admin/promo", { credentials: "include" });
      const data = await res.json();
      if (res.ok && data.success) {
        setPromoCodes(data.promoCodes || []);
      }
    } catch (err) {
      console.error("Error fetching promo codes:", err);
    } finally {
      setLoadingPromos(false);
    }
  };

  const handleOpenPromoModal = () => {
    setShowPromoModal(true);
    fetchPromoCodes();
  };

  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.code.trim()) return;

    setCreatingPromo(true);
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(promoForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل إنشاء كود الخصم.");
      }
      setPromoForm({
        code: "",
        planGranted: "SPRINT",
        creditsGranted: 50,
        maxUses: 10,
        durationDays: 30,
      });
      fetchPromoCodes();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء كود الخصم");
    } finally {
      setCreatingPromo(false);
    }
  };

  const handleDeletePromoCode = async (id: string, code: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف كود الخصم "${code}"؟`)) return;
    try {
      const res = await fetch(`/api/admin/promo?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setPromoCodes((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Delete promo error:", err);
    }
  };

  const handleTogglePromoStatus = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/promo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      if (res.ok) {
        setPromoCodes((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive: !currentActive } : p))
        );
      }
    } catch (err) {
      console.error("Toggle promo status error:", err);
    }
  };

  // Direct Resend Email Templates
  const applyEmailTemplate = (templateType: "hot_lead" | "bonus_credits" | "cv_help") => {
    const userName = selectedUserForEmail?.name || selectedUserForEmail?.email.split("@")[0] || "عزيزي المستخدم";

    switch (templateType) {
      case "hot_lead":
        setEmailSubject("عرض ترقية استثنائي على باقة PRO في GermanJobsPro 🇩🇪");
        setEmailMessage(
          `مرحباً ${userName}،\n\nنلاحظ اهتمامك بتجهيز ملف ترشيحك والتقديم على الوظائف في ألمانيا.\nيسعدنا تقديم خصم حصري بنسبة 40% على باقة PRO أو SPRINT لتفعيل فحص ATS وتوليد خطابات الدافع Anschreiben بدون قيود.\n\nاستخدم كود الخصم: SPECIAL40 عند الترقية، أو تواصل معنا مباشرة لتفعيل حسابك.\n\nنتمنى لك كل التوفيق في مسيرتك المهنية!\nفريق GermanJobsPro`
        );
        break;
      case "bonus_credits":
        setEmailSubject("هدية رصيد إضافي مجاني لحسابك في GermanJobsPro 🎁");
        setEmailMessage(
          `مرحباً ${userName}،\n\nتقديراً لاستخدامك منصة GermanJobsPro، قمنا بإضافة رصيد إضافي مجاني لحسابك لتجربة أدوات الذكاء الاصطناعي وصياغة سيرتك الذاتية الألمانية DIN 5008.\n\nيمكنك تسجيل الدخول الآن ومتابعة بناء ملفك المهني.\n\nبالتوفيق!\nفريق GermanJobsPro`
        );
        break;
      case "cv_help":
        setEmailSubject("هل تحتاج مساعدة في إكمال سيرتك الذاتية الألمانية؟ 🇩🇪");
        setEmailMessage(
          `مرحباً ${userName}،\n\nلاحظنا أنك بدأت إعداد ملفك في GermanJobsPro ولم تكمله بعد.\nهل واجهت أي صعوبة في ترجمة المسميات أو تنسيق معايير DIN 5008 أو إرفاق شهادات اللغة؟\n\nنحن هنا لمساعدتك! يمكنك الرد مباشرة على هذا البريد لأي استفسار وسيسعدنا تقديم الدعم الكامل لك.\n\nمع خالص التحيات،\nفريق دعم GermanJobsPro`
        );
        break;
    }
  };

  const handleOpenEmailModal = (user: UserItem) => {
    setSelectedUserForEmail(user);
    const userName = user.name || user.email.split("@")[0] || "عزيزي المستخدم";
    setEmailSubject("عرض ترقية استثنائي على باقة PRO في GermanJobsPro 🇩🇪");
    setEmailMessage(
      `مرحباً ${userName}،\n\nنلاحظ اهتمامك بتجهيز ملف ترشيحك والتقديم على الوظائف في ألمانيا.\nيسعدنا تقديم خصم حصري بنسبة 40% على باقة PRO أو SPRINT لتفعيل فحص ATS وتوليد خطابات الدافع Anschreiben بدون قيود.\n\nاستخدم كود الخصم: SPECIAL40 عند الترقية، أو تواصل معنا مباشرة لتفعيل حسابك.\n\nنتمنى لك كل التوفيق في مسيرتك المهنية!\nفريق GermanJobsPro`
    );
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEmail) return;

    setSendingEmail(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "send_email",
          userId: selectedUserForEmail.id,
          subject: emailSubject,
          message: emailMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل إرسال البريد الإلكتروني.");
      }

      setFeedback({
        type: "success",
        message: data.message || `تم إرسال البريد بنجاح إلى ${selectedUserForEmail.email} عبر Resend.`,
      });
      setSelectedUserForEmail(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "حدث خطأ أثناء إرسال البريد.");
    } finally {
      setSendingEmail(false);
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

  // Filter Counts Calculation
  const filterCounts = useMemo(() => {
    let all = users.length;
    let pro = 0;
    let sprint = 0;
    let free = 0;
    let trial = 0;
    let hotLeads = 0;

    for (const u of users) {
      const isPaidActive =
        (u.plan === "PRO" || u.plan === "SPRINT") &&
        (!u.planExpiresAt || new Date(u.planExpiresAt) > new Date());

      if (u.plan === "PRO" && isPaidActive) pro++;
      if (u.plan === "SPRINT" && isPaidActive) sprint++;
      if (u.plan === "FREE") {
        free++;
        const hasSpentCredits = u.aiCredits === 0;
        const hasCreatedDocs = ((u._count?.cvs || 0) > 0) || ((u._count?.coverLetters || 0) > 0);
        if (hasSpentCredits || hasCreatedDocs) {
          hotLeads++;
        }
      }
      if (u.plan === "TRIAL") trial++;
    }

    return { all, pro, sprint, free, trial, hotLeads };
  }, [users]);

  // Filtered & Sorted Users List
  const filteredUsers = useMemo(() => {
    const list = users.filter((u) => {
      const matchesSearch =
        u.email.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase().trim());

      if (!matchesSearch) return false;

      if (planFilter === "ALL") return true;

      const isPaidActive =
        (u.plan === "PRO" || u.plan === "SPRINT") &&
        (!u.planExpiresAt || new Date(u.planExpiresAt) > new Date());

      if (planFilter === "PRO") {
        return u.plan === "PRO" && isPaidActive;
      }
      if (planFilter === "SPRINT") {
        return u.plan === "SPRINT" && isPaidActive;
      }
      if (planFilter === "FREE") {
        return u.plan === "FREE";
      }
      if (planFilter === "TRIAL") {
        return u.plan === "TRIAL";
      }
      if (planFilter === "HOT_LEADS") {
        const isFree = u.plan === "FREE";
        const hasSpentCredits = u.aiCredits === 0;
        const hasCreatedDocs = ((u._count?.cvs || 0) > 0) || ((u._count?.coverLetters || 0) > 0);
        return isFree && (hasSpentCredits || hasCreatedDocs);
      }

      return true;
    });

    list.sort((a, b) => {
      if (sortBy === "most_docs") {
        const docsA = (a._count?.cvs || 0) + (a._count?.coverLetters || 0);
        const docsB = (b._count?.cvs || 0) + (b._count?.coverLetters || 0);
        return docsB - docsA;
      }
      if (sortBy === "lowest_credits") {
        return a.aiCredits - b.aiCredits;
      }
      // default: newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list;
  }, [users, searchTerm, planFilter, sortBy]);

  const proPercentage = stats.totalUsers > 0 ? Math.round((stats.proUsers / stats.totalUsers) * 100) : 0;
  const avgCredits = stats.totalUsers > 0 ? Math.round(stats.totalAiCredits / stats.totalUsers) : 0;

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-amber-400 selection:text-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Navbar & Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={`/${locale}`}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 transition"
              >
                {isAr ? "← العودة إلى الموقع" : "← Back to Home"}
              </Link>
              <span className="text-slate-600">•</span>
              <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
                ROYAL NAVY ADMIN CONTROL
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>⚡ لوحة التحكم وإدارة المنصة</span>
            </h1>
            <p className="text-sm text-slate-400">
              {isAr
                ? "متابعة إحصائيات المستخدمين، اشتراكات PRO و SPRINT، أرصدة الذكاء الاصطناعي، وأكواد الخصم."
                : "Manage platform users, PRO/SPRINT passes, AI credits, and promo codes."}
            </p>
          </div>

          {/* Quick Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Promo Codes Manager Button */}
            <button
              onClick={handleOpenPromoModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 hover:text-purple-200 border border-purple-500/30 text-xs sm:text-sm font-bold transition cursor-pointer shadow-sm"
              title="إدارة وإنشاء أكواد الخصم والترقيات"
            >
              <span>🎁</span>
              <span>{isAr ? "أكواد الخصم (Promo Codes)" : "Promo Codes"}</span>
            </button>

            {/* 1-Click BA Job Sync */}
            <button
              onClick={handleSyncJobsBa}
              disabled={syncingJobs}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 text-xs sm:text-sm font-bold transition cursor-pointer disabled:opacity-50 shadow-sm"
              title="جلب وتحديث وظائف جديدة من وكالة العمل الألمانية"
            >
              <span className={syncingJobs ? "animate-spin" : ""}>🔄</span>
              <span>{syncingJobs ? (isAr ? "جاري الجلب..." : "Syncing...") : (isAr ? "جلب وظائف BA" : "Fetch BA Jobs")}</span>
            </button>

            {/* 1-Click Jobs Cleanup */}
            <button
              onClick={handleCleanupJobs}
              disabled={cleaningJobs}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs sm:text-sm font-bold transition cursor-pointer disabled:opacity-50 shadow-sm"
              title="تنظيف الوظائف المنتهية وحذف المقالات الإخبارية"
            >
              <span className={cleaningJobs ? "animate-pulse" : ""}>🧹</span>
              <span>{cleaningJobs ? (isAr ? "جاري التنظيف..." : "Cleaning...") : (isAr ? "تنظيف الوظائف" : "Clean Jobs")}</span>
            </button>

            <Link
              href={`/${locale}/admin/support`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs sm:text-sm font-medium transition"
            >
              <span>📩</span>
              <span>{isAr ? "تذاكر الدعم" : "Support"}</span>
            </Link>

            <Link
              href={`/${locale}/admin/subscribers`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs sm:text-sm font-medium transition"
            >
              <span>📧</span>
              <span>{isAr ? "المشتركون" : "Subscribers"}</span>
            </Link>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs sm:text-sm font-medium transition cursor-pointer disabled:opacity-50"
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
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs sm:text-sm font-medium transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{isAr ? "خروج" : "Logout"}</span>
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
              <span className="font-medium">{feedback.message}</span>
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

        {/* 4 STATS / KPI CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Users */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800/90 p-5 shadow-xl backdrop-blur-sm group hover:border-slate-700 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-600/20 transition" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {isAr ? "المستخدمون المسجلون" : "Total Users"}
              </span>
              <div className="p-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">
                {loading ? "..." : stats.totalUsers}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {isAr ? "عضو" : "users"}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isAr ? "قاعدة بيانات المستخدمين الحية" : "Live database"}</span>
            </div>
          </div>

          {/* Card 2: PRO / SPRINT Subscribers */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800/90 p-5 shadow-xl backdrop-blur-sm group hover:border-amber-500/30 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/90">
                {isAr ? "مشتركو PRO و SPRINT" : "PRO & SPRINT Members"}
              </span>
              <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-300 font-mono">
                {loading ? "..." : stats.proUsers}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {proPercentage}% {isAr ? "من الأعضاء" : "conversion"}
              </span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400">
              <span>{isAr ? "اشتراكات مدفوعة مع وصول غير محدود" : "Active paid passes"}</span>
            </div>
          </div>

          {/* Card 3: Total AI Credits */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800/90 p-5 shadow-xl backdrop-blur-sm group hover:border-blue-500/30 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-600/20 transition" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400/90">
                {isAr ? "رصيد الذكاء الاصطناعي" : "Total AI Credits"}
              </span>
              <div className="p-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-blue-300 font-mono">
                {loading ? "..." : stats.totalAiCredits.toLocaleString()}
              </span>
              <span className="text-xs text-blue-400/80 font-medium">
                ⚡ {isAr ? "رصيد" : "credits"}
              </span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400">
              <span>{isAr ? `متوسط ~${avgCredits} رصيد للمستخدم` : `Avg ~${avgCredits} credits/user`}</span>
            </div>
          </div>

          {/* Card 4: Platform Activity & Active Jobs */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800/90 p-5 shadow-xl backdrop-blur-sm group hover:border-emerald-500/30 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">
                {isAr ? "نشاط المنصة والوظائف" : "Platform Activity & Jobs"}
              </span>
              <div className="p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="text-base">💼</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-300 font-mono">
                {loading ? "..." : stats.totalJobs ?? 0}
              </span>
              <span className="text-xs text-emerald-400/80 font-medium">
                {isAr ? "وظيفة نشطة" : "active jobs"}
              </span>
            </div>
            <div className="mt-3 text-[11px] text-slate-300 font-medium truncate">
              {isAr
                ? `إجمالي الملفات المنشأة: ${stats.totalCvs ?? 0} سيرة ذاتية • ${stats.totalCoverLetters ?? 0} خطاب دافع`
                : `Created Docs: ${stats.totalCvs ?? 0} CVs • ${stats.totalCoverLetters ?? 0} Cover Letters`}
            </div>
          </div>
        </section>

        {/* CONTROLS, SEARCH BAR & SMART SORTING */}
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

            {/* Smart Sorting Dropdown & Plan Filter Pills with Dynamic Counts */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold">
                  {isAr ? "ترتيب:" : "Sort:"}
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "most_docs" | "lowest_credits")}
                  className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="newest" className="bg-slate-900 text-white">
                    {isAr ? "الأحدث تسجيلاً" : "Newest Joined"}
                  </option>
                  <option value="most_docs" className="bg-slate-900 text-white">
                    {isAr ? "الأكثر إنشاءً للملفات" : "Most Documents"}
                  </option>
                  <option value="lowest_credits" className="bg-slate-900 text-white">
                    {isAr ? "الأقل رصيداً" : "Lowest Credits"}
                  </option>
                </select>
              </div>

              {/* Filter Pills with Live Counts */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "ALL", label: isAr ? `الكل (${filterCounts.all})` : `All (${filterCounts.all})` },
                  { id: "PRO", label: `PRO ⭐ (${filterCounts.pro})` },
                  { id: "SPRINT", label: `⚡ SPRINT (${filterCounts.sprint})` },
                  { id: "FREE", label: isAr ? `مجاني (${filterCounts.free})` : `Free (${filterCounts.free})` },
                  { id: "TRIAL", label: isAr ? `تجريبي (${filterCounts.trial})` : `Trial (${filterCounts.trial})` },
                  { id: "HOT_LEADS", label: isAr ? `🔥 استنفدوا الرصيد (${filterCounts.hotLeads})` : `🔥 Hot Leads (${filterCounts.hotLeads})` },
                ].map((filterOption) => {
                  const isActive = planFilter === filterOption.id;

                  return (
                    <button
                      key={filterOption.id}
                      onClick={() => setPlanFilter(filterOption.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? filterOption.id === "HOT_LEADS"
                            ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 border border-amber-400"
                            : "bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-500"
                          : filterOption.id === "HOT_LEADS"
                          ? "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30"
                          : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <span>{filterOption.label}</span>
                    </button>
                  );
                })}
              </div>
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
                    const isProActive = user.plan === "PRO" && (!user.planExpiresAt || new Date(user.planExpiresAt) > new Date());
                    const isSprintActive = user.plan === "SPRINT" && (!user.planExpiresAt || new Date(user.planExpiresAt) > new Date());
                    const isPaid = isProActive || isSprintActive;

                    const isActionLoading = actionLoadingId?.includes(user.id);
                    const formattedDate = new Date(user.createdAt).toLocaleDateString(isAr ? "ar-MA" : "en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    });

                    // Countdown calculation
                    let remainingDays: number | null = null;
                    if (user.planExpiresAt) {
                      const diffMs = new Date(user.planExpiresAt).getTime() - Date.now();
                      remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                    }

                    // Target profession extracted from their latest CV
                    const targetProfession = user.cvs?.find((c) => c.personalInfo?.targetJobTitle)?.personalInfo?.targetJobTitle || null;

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-800/30 transition duration-150 group"
                      >
                        {/* User info with Real Avatar, Google Badge, and Target Profession */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              user={user}
                              onClick={() => setSelectedUserForDossier(user)}
                            />

                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setSelectedUserForDossier(user)}
                                  className="font-bold text-white text-sm truncate hover:text-blue-400 transition cursor-pointer text-right"
                                >
                                  {user.name || (isAr ? "بدون اسم" : "Unnamed")}
                                </button>

                                {isProActive && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                                    PRO
                                  </span>
                                )}
                                {isSprintActive && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                                    SPRINT
                                  </span>
                                )}

                                {targetProfession && (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 truncate max-w-[170px]"
                                    title={targetProfession}
                                  >
                                    <span>🎯</span>
                                    <span className="truncate">{targetProfession}</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-xs text-slate-400 font-mono truncate">
                                  {user.email}
                                </span>
                                
                                {/* In-App Direct Resend Email Trigger */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEmailModal(user)}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:underline transition cursor-pointer"
                                  title="إرسال رسالة رسمية أو عرض خاص للمستخدم عبر Resend"
                                >
                                  <span>✉️</span>
                                  <span>{isAr ? "عرض خاص" : "Send Email"}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Plan & Status with Expiration Countdown & Email Verification Status */}
                        <td className="py-4 px-6">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Plan Badge */}
                              {isProActive ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                  <span>⭐</span>
                                  <span>PRO PASS</span>
                                </span>
                              ) : isSprintActive ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                  <span>⚡</span>
                                  <span>SPRINT (30d)</span>
                                </span>
                              ) : user.plan === "TRIAL" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                  <span>🎁</span>
                                  <span>TRIAL</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                  <span>FREE</span>
                                </span>
                              )}

                              {/* Email Verification Status */}
                              {user.emailVerified ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                  <span>✓</span>
                                  <span>{isAr ? "مفعّل" : "Verified"}</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleVerifyEmail(user.id, user.email)}
                                  disabled={isActionLoading}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition cursor-pointer disabled:opacity-50"
                                  title="اضغط لتفعيل البريد يدوياً"
                                >
                                  {actionLoadingId === `verify-${user.id}` ? (
                                    <span>⏳...</span>
                                  ) : (
                                    <>
                                      <span>⏳</span>
                                      <span>{isAr ? "تفعيل يدوي" : "Verify"}</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            {/* Plan Expiration Countdown */}
                            {user.planExpiresAt && remainingDays !== null && (
                              <div className="text-[11px] font-mono">
                                {remainingDays > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    <span>⏳</span>
                                    <span>{isAr ? `باقي ${remainingDays} يوم` : `${remainingDays} days left`}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                    <span>⚠️</span>
                                    <span>{isAr ? "منتهي الصلاحية" : "Expired"}</span>
                                  </span>
                                )}
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

                        {/* Clickable Created Documents badges -> Opens Dossier Inspector */}
                        <td className="py-4 px-6">
                          <button
                            type="button"
                            onClick={() => setSelectedUserForDossier(user)}
                            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition cursor-pointer group"
                            title="اضغط لمعاينة السير الذاتية وخطابات الدافع لهذا المستخدم"
                          >
                            <span className="px-2 py-0.5 rounded bg-slate-950 group-hover:bg-blue-600/20 border border-slate-800 group-hover:border-blue-500/40 font-mono text-slate-300 transition">
                              📄 {user._count?.cvs ?? 0} CV
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-950 group-hover:bg-purple-600/20 border border-slate-800 group-hover:border-purple-500/40 font-mono text-slate-300 transition">
                              ✉️ {user._count?.coverLetters ?? 0} CL
                            </span>
                          </button>
                        </td>

                        {/* Joined Date */}
                        <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                          {formattedDate}
                        </td>

                        {/* High-Impact Actions */}
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* Upgrade to SPRINT (30d) */}
                            <button
                              onClick={() => handleUpdatePlan(user.id, user.email, "sprint")}
                              disabled={isActionLoading}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Upgrade to SPRINT (30 days + 50 AI credits)"
                            >
                              {actionLoadingId === `plan-sprint-${user.id}` ? (
                                <span className="animate-spin text-xs">⏳</span>
                              ) : (
                                <span>⚡ SPRINT (30d)</span>
                              )}
                            </button>

                            {/* Upgrade to PRO (90d) OR Revoke */}
                            {isPaid ? (
                              <button
                                onClick={() => handleUpdatePlan(user.id, user.email, "free")}
                                disabled={isActionLoading}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Downgrade to FREE"
                              >
                                {actionLoadingId === `plan-free-${user.id}` ? (
                                  <span className="animate-spin text-xs">⏳</span>
                                ) : (
                                  <span>{isAr ? "إلغاء PRO" : "Cancel PRO"}</span>
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdatePlan(user.id, user.email, "pro")}
                                disabled={isActionLoading}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 hover:border-amber-500/50 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Upgrade to PRO (90 days + 100 AI credits)"
                              >
                                {actionLoadingId === `plan-pro-${user.id}` ? (
                                  <span className="animate-spin text-xs">⏳</span>
                                ) : (
                                  <span>⭐ PRO (90d)</span>
                                )}
                              </button>
                            )}

                            {/* Add +10 Credits */}
                            <button
                              onClick={() => handleAddCredits(user.id, user.email, 10)}
                              disabled={isActionLoading}
                              className="px-2 py-1.5 rounded-xl text-xs font-bold bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 hover:border-blue-500/50 transition flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
                              title="Add +10 AI Credits"
                            >
                              {actionLoadingId === `credits-10-${user.id}` ? (
                                <span className="animate-spin text-xs">⏳</span>
                              ) : (
                                <span>⚡ +10</span>
                              )}
                            </button>

                            {/* Add +50 Credits */}
                            <button
                              onClick={() => handleAddCredits(user.id, user.email, 50)}
                              disabled={isActionLoading}
                              className="px-2 py-1.5 rounded-xl text-xs font-bold bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 hover:border-blue-500/50 transition flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
                              title="Add +50 AI Credits"
                            >
                              {actionLoadingId === `credits-50-${user.id}` ? (
                                <span className="animate-spin text-xs">⏳</span>
                              ) : (
                                <span>⚡ +50</span>
                              )}
                            </button>

                            {/* Subtle Delete User Button */}
                            <button
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              disabled={isActionLoading}
                              className="p-1.5 rounded-xl text-xs text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer disabled:opacity-50"
                              title="حذف المستخدم نهائياً"
                            >
                              {actionLoadingId === `delete-${user.id}` ? (
                                <span className="animate-spin text-xs">⏳</span>
                              ) : (
                                <span>🗑️</span>
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

      {/* MODAL 1: USER DOSSIER & DOCUMENTS INSPECTOR */}
      {selectedUserForDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100">
            {/* Modal Header with User Identity */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-5">
              <div className="flex items-center gap-4">
                <UserAvatar user={selectedUserForDossier} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-white">
                      {selectedUserForDossier.name || (isAr ? "بدون اسم" : "Unnamed")}
                    </h3>
                    {selectedUserForDossier.googleId && (
                      <span className="px-2 py-0.5 rounded-md bg-white text-blue-600 font-extrabold text-xs">
                        Google
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    {selectedUserForDossier.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserForDossier(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Quick Summary Pill Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">{isAr ? "الخطة:" : "Plan:"}</span>
                <span className="text-xs font-bold text-amber-300">{selectedUserForDossier.plan}</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">{isAr ? "رصيد الذكاء:" : "Credits:"}</span>
                <span className="text-xs font-bold text-blue-300 font-mono">⚡ {selectedUserForDossier.aiCredits}</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">{isAr ? "تأكيد البريد:" : "Email Verified:"}</span>
                <span className={`text-xs font-bold ${selectedUserForDossier.emailVerified ? "text-emerald-400" : "text-amber-400"}`}>
                  {selectedUserForDossier.emailVerified ? (isAr ? "✓ مفعّل" : "Verified") : (isAr ? "⏳ غير مفعّل" : "Unverified")}
                </span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">{isAr ? "تاريخ الانضمام:" : "Joined:"}</span>
                <span className="text-xs font-mono text-slate-300">
                  {new Date(selectedUserForDossier.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Personal Details Extracted from CV (if any) */}
            {(() => {
              const info = selectedUserForDossier.cvs?.find((c) => c.personalInfo)?.personalInfo;
              if (!info) return null;

              return (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <span>👤</span>
                    <span>{isAr ? "بيانات السيرة الذاتية الشخصية:" : "CV Personal Profile:"}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {info.fullName && (
                      <div className="text-slate-300">
                        <span className="text-slate-500 font-medium">{isAr ? "الاسم الكامل: " : "Full Name: "}</span>
                        <span className="font-semibold text-white">{info.fullName}</span>
                      </div>
                    )}
                    {info.targetJobTitle && (
                      <div className="text-slate-300">
                        <span className="text-slate-500 font-medium">{isAr ? "المسمى المهني المستهدف: " : "Target Role: "}</span>
                        <span className="font-semibold text-blue-300">🎯 {info.targetJobTitle}</span>
                      </div>
                    )}
                    {info.phone && (
                      <div className="text-slate-300">
                        <span className="text-slate-500 font-medium">{isAr ? "الهاتف: " : "Phone: "}</span>
                        <span className="font-mono text-slate-200">{info.phone}</span>
                      </div>
                    )}
                    {info.address && (
                      <div className="text-slate-300">
                        <span className="text-slate-500 font-medium">{isAr ? "العنوان/المدينة: " : "Location: "}</span>
                        <span>{info.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* User CVs List */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>📄</span>
                  <span>{isAr ? "السير الذاتية المنشأة (DIN 5008 CVs)" : "Generated Resumes (CVs)"}</span>
                </span>
                <span className="text-xs font-mono text-slate-400">({selectedUserForDossier.cvs?.length ?? 0})</span>
              </h4>

              {(!selectedUserForDossier.cvs || selectedUserForDossier.cvs.length === 0) ? (
                <p className="text-xs text-slate-500 p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-center">
                  {isAr ? "لم يقم هذا المستخدم بإنشاء أي سيرة ذاتية بعد." : "No resumes created yet."}
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedUserForDossier.cvs.map((cv) => (
                    <div
                      key={cv.id}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-200 flex items-center gap-2">
                          <span>{cv.title || "Lebenslauf"}</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                            {cv.language.toUpperCase()}
                          </span>
                        </div>
                        {cv.personalInfo?.targetJobTitle && (
                          <div className="text-blue-400 font-medium text-[11px]">
                            🎯 {cv.personalInfo.targetJobTitle}
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono shrink-0">
                        {new Date(cv.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Cover Letters List */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>✉️</span>
                  <span>{isAr ? "خطابات الدافع (Anschreiben)" : "Cover Letters"}</span>
                </span>
                <span className="text-xs font-mono text-slate-400">({selectedUserForDossier.coverLetters?.length ?? 0})</span>
              </h4>

              {(!selectedUserForDossier.coverLetters || selectedUserForDossier.coverLetters.length === 0) ? (
                <p className="text-xs text-slate-500 p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-center">
                  {isAr ? "لم يقم هذا المستخدم بتوليد أي خطاب دافع بعد." : "No cover letters generated yet."}
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedUserForDossier.coverLetters.map((cl) => (
                    <div
                      key={cl.id}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-200">
                          {cl.jobTitle}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          🏢 {cl.companyName}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono shrink-0">
                        {new Date(cl.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const target = selectedUserForDossier;
                  setSelectedUserForDossier(null);
                  handleOpenEmailModal(target);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/30"
              >
                <span>✉️</span>
                <span>{isAr ? "مراسلة هذا المستخدم عبر Resend" : "Send Resend Email"}</span>
              </button>

              <button
                onClick={() => setSelectedUserForDossier(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                {isAr ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DIRECT RESEND EMAIL MODAL WITH 3 TEMPLATES */}
      {selectedUserForEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <span>✉️</span>
                  <span>{isAr ? "إرسال رسالة رسمية عبر Resend" : "Send Official Email via Resend"}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? `المستلم: ${selectedUserForEmail.name || ""} (${selectedUserForEmail.email})` : `Recipient: ${selectedUserForEmail.email}`}
                </p>
              </div>

              <button
                onClick={() => setSelectedUserForEmail(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Quick 1-Click Templates */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                {isAr ? "⚡ قوالب جاهزة بضغطة واحدة:" : "⚡ 1-Click Quick Templates:"}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyEmailTemplate("hot_lead")}
                  className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold text-right transition cursor-pointer flex flex-col gap-1"
                >
                  <span>🔥 عرض ترقية خاص</span>
                  <span className="text-[10px] text-amber-400/70 font-normal">عرض 40% على PRO / SPRINT</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyEmailTemplate("bonus_credits")}
                  className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold text-right transition cursor-pointer flex flex-col gap-1"
                >
                  <span>🎁 هدية رصيد إضافي</span>
                  <span className="text-[10px] text-blue-400/70 font-normal">رصيد مجاني لتجربة الأدوات</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyEmailTemplate("cv_help")}
                  className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold text-right transition cursor-pointer flex flex-col gap-1"
                >
                  <span>👋 مساعدة في إكمال السيرة</span>
                  <span className="text-[10px] text-purple-400/70 font-normal">مساعدة في ترجمة وتنسيق DIN</span>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">
                  {isAr ? "موضوع الرسالة (Subject):" : "Subject:"}
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">
                  {isAr ? "نص الرسالة (Message Content):" : "Message Body:"}
                </label>
                <textarea
                  rows={7}
                  required
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-blue-500 font-sans resize-y"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">
                  {isAr ? "يتم الإرسال رسمياً من: GermanJobsPro <support@germanjobspro.com>" : "Sent via Resend from GermanJobsPro"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForEmail(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    {isAr ? "إلغاء" : "Cancel"}
                  </button>

                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-blue-600/30"
                  >
                    {sendingEmail ? (
                      <>
                        <span className="animate-spin text-xs">⏳</span>
                        <span>{isAr ? "جاري الإرسال عبر Resend..." : "Sending..."}</span>
                      </>
                    ) : (
                      <>
                        <span>✉️</span>
                        <span>{isAr ? "إرسال الآن عبر Resend" : "Send Now via Resend"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BUILT-IN PROMO CODES MODAL */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <span>🎁</span>
                  <span>{isAr ? "إدارة وإنشاء أكواد الخصم والترقيات" : "Promo Codes Manager"}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr
                    ? "أنشئ أكواداً لترقية الحسابات إلى SPRINT أو PRO أو منح رصيد إضافي للذكاء الاصطناعي."
                    : "Create promotional codes for plan upgrades and bonus AI credits."}
                </p>
              </div>

              <button
                onClick={() => setShowPromoModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Create Promo Code Form */}
            <form onSubmit={handleCreatePromoCode} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>➕</span>
                <span>{isAr ? "إنشاء كود خصم جديد" : "Create New Promo Code"}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">
                    {isAr ? "الكود (Code):" : "Code:"}
                  </label>
                  <input
                    type="text"
                    required
                    value={promoForm.code}
                    onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                    placeholder="GERMAN2026"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-purple-500 uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">
                    {isAr ? "نوع المكافأة:" : "Plan Upgrade:"}
                  </label>
                  <select
                    value={promoForm.planGranted}
                    onChange={(e) => setPromoForm({ ...promoForm, planGranted: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="SPRINT">SPRINT ⚡</option>
                    <option value="PRO">PRO ⭐</option>
                    <option value="NONE">{isAr ? "بدون خطة (رصيد فقط)" : "Credits Only"}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">
                    {isAr ? "رصيد الذكاء الاصطناعي:" : "Bonus Credits:"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={promoForm.creditsGranted}
                    onChange={(e) => setPromoForm({ ...promoForm, creditsGranted: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">
                    {isAr ? "أقصى استخدام:" : "Max Uses:"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={promoForm.maxUses}
                    onChange={(e) => setPromoForm({ ...promoForm, maxUses: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">
                    {isAr ? "صلاحية الباقة (أيام):" : "Days Valid:"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={promoForm.durationDays}
                    onChange={(e) => setPromoForm({ ...promoForm, durationDays: parseInt(e.target.value, 10) || 30 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={creatingPromo}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-purple-600/30"
                >
                  {creatingPromo ? <span>⏳ جاري الإنشاء...</span> : <span>➕ حفظ وتفعيل الكود</span>}
                </button>
              </div>
            </form>

            {/* Promo Codes List Table */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>{isAr ? "الأكواد النشطة والسابقة" : "Existing Promo Codes"}</span>
                <span className="text-xs text-slate-400 font-mono">({promoCodes.length})</span>
              </h4>

              {loadingPromos ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <span>⏳ جاري تحميل الأكواد...</span>
                </div>
              ) : promoCodes.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800">
                  <span>لا توجد أكواد خصم منشأة حالياً. أنشئ أول كود أعلاه.</span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/50">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold">
                        <th className="py-3 px-4">الكود</th>
                        <th className="py-3 px-4">المكافأة والمدة</th>
                        <th className="py-3 px-4">رصيد AI</th>
                        <th className="py-3 px-4">الاستخدام</th>
                        <th className="py-3 px-4">الحالة</th>
                        <th className="py-3 px-4 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {promoCodes.map((promo) => (
                        <tr key={promo.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-bold text-purple-300">
                            {promo.code}
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-semibold text-[11px]">
                              {promo.planGranted} ({promo.durationDays}d)
                            </span>
                          </td>
                          <td className="py-3 px-4 text-blue-300 font-bold">
                            +{promo.creditsGranted} ⚡
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            <span className={promo.timesUsed >= promo.maxUses ? "text-rose-400 font-bold" : ""}>
                              {promo.timesUsed} / {promo.maxUses}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleTogglePromoStatus(promo.id, promo.isActive)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                                promo.isActive
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-slate-800 text-slate-400 border border-slate-700"
                              }`}
                            >
                              {promo.isActive ? "نشط ✓" : "معطل ✕"}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeletePromoCode(promo.id, promo.code)}
                              className="text-slate-500 hover:text-rose-400 transition p-1 cursor-pointer"
                              title="حذف الكود"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowPromoModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                {isAr ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
