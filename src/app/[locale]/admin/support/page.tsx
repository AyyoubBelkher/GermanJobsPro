"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface SupportTicketItem {
  id: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  status: string; // "PENDING" | "RESOLVED"
  adminReply?: string | null;
  repliedAt?: string | null;
  createdAt: string;
}

interface TicketStats {
  total: number;
  pending: number;
  resolved: number;
}

const CATEGORY_MAP: Record<string, { labelAr: string; labelEn: string; color: string; icon: string }> = {
  billing: {
    labelAr: "الاشتراكات والمدفوعات",
    labelEn: "Billing & Subscriptions",
    color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: "💎",
  },
  cv_issue: {
    labelAr: "السيرة والـ ATS",
    labelEn: "CV & ATS Audit",
    color: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    icon: "📄",
  },
  general_inquiry: {
    labelAr: "استفسار توظيف وتأشيرة",
    labelEn: "Jobs & Visa Inquiry",
    color: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    icon: "💼",
  },
  suggestion: {
    labelAr: "اقتراح أو ملاحظة",
    labelEn: "Feedback & Suggestion",
    color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icon: "💡",
  },
};

export default function AdminSupportPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "ar";
  const isAr = locale === "ar";

  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [stats, setStats] = useState<TicketStats>({ total: 0, pending: 0, resolved: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "RESOLVED">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Expanded ticket preview
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  // Quick Reply Modal State
  const [replyModalTicket, setReplyModalTicket] = useState<SupportTicketItem | null>(null);
  const [replySubject, setReplySubject] = useState<string>("");
  const [replyMessage, setReplyMessage] = useState<string>("");
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);
  const [replyFeedback, setReplyFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Status toggle action loading
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const fetchTickets = () => {
    setLoading(true);
    setError(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    let isCancelled = false;

    const loadTickets = async () => {
      try {
        const res = await fetch("/api/admin/support", {
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
          setTickets(data.tickets || []);
          setStats(data.stats || { total: 0, pending: 0, resolved: 0 });
        }
      } catch (err: unknown) {
        console.error("Fetch support tickets error:", err);
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "تعذر جلب قائمة التذاكر.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadTickets();

    return () => {
      isCancelled = true;
    };
  }, [refreshTrigger, locale, router]);

  // Open Quick Reply Modal
  const openReplyModal = (ticket: SupportTicketItem) => {
    setReplyModalTicket(ticket);
    const initialSubject = ticket.subject.toLowerCase().startsWith("re:")
      ? ticket.subject
      : `Re: ${ticket.subject}`;
    setReplySubject(initialSubject);
    setReplyMessage(
      ticket.adminReply ||
        (isAr
          ? `مرحباً ${ticket.name}،\n\nشكراً لتواصلك معنا بخصوص استفسارك.\n\nيسعدنا إعلامك بأن...`
          : `Hello ${ticket.name},\n\nThank you for reaching out to us.\n\nRegarding your inquiry, we would like to inform you that...`)
    );
    setReplyFeedback(null);
  };

  const closeReplyModal = () => {
    setReplyModalTicket(null);
    setReplySubject("");
    setReplyMessage("");
    setReplyFeedback(null);
    setIsSendingReply(false);
  };

  // Submit Quick Reply via /api/admin/support/reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyModalTicket || !replyMessage.trim()) return;

    setIsSendingReply(true);
    setReplyFeedback(null);

    try {
      const res = await fetch("/api/admin/support/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ticketId: replyModalTicket.id,
          recipientEmail: replyModalTicket.email,
          subject: replySubject.trim(),
          replyMessage: replyMessage.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل إرسال الرد عبر البريد الإلكتروني.");
      }

      // Update state locally
      setTickets((prev) =>
        prev.map((t) =>
          t.id === replyModalTicket.id
            ? {
                ...t,
                status: "RESOLVED",
                adminReply: replyMessage.trim(),
                repliedAt: new Date().toISOString(),
              }
            : t
        )
      );

      // Update stats counters
      setStats((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        resolved: prev.resolved + 1,
      }));

      setReplyFeedback({
        type: "success",
        message: isAr
          ? "✓ تم إرسال الرد بنجاح عبر Resend وتحديث التذكرة إلى RESOLVED!"
          : "✓ Reply successfully sent via Resend and ticket marked as RESOLVED!",
      });

      // Auto close after brief display
      setTimeout(() => {
        closeReplyModal();
      }, 1500);
    } catch (err: unknown) {
      console.error("Send reply error:", err);
      setReplyFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "حدث خطأ أثناء إرسال الرد.",
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  // Quick Toggle Status (PENDING <-> RESOLVED)
  const handleToggleStatus = async (ticketId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "RESOLVED" ? "PENDING" : "RESOLVED";
    setActionLoadingId(`status-${ticketId}`);

    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ticketId,
          status: nextStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تغيير حالة التذكرة");
      }

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: nextStatus } : t))
      );

      setStats((prev) => ({
        ...prev,
        pending: nextStatus === "PENDING" ? prev.pending + 1 : Math.max(0, prev.pending - 1),
        resolved: nextStatus === "RESOLVED" ? prev.resolved + 1 : Math.max(0, prev.resolved - 1),
      }));
    } catch (err: unknown) {
      console.error("Toggle status error:", err);
      alert(err instanceof Error ? err.message : "حدث خطأ أثناء تغيير الحالة.");
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

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.message.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter !== "ALL" && t.status !== statusFilter) {
        return false;
      }

      if (categoryFilter !== "ALL" && t.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [tickets, searchTerm, statusFilter, categoryFilter]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Navbar & Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <Link
                href={`/${locale}/admin`}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 transition"
              >
                {isAr ? "← لوحة الإدارة الرئيسية" : "← Main Dashboard"}
              </Link>
              <span className="text-slate-600">•</span>
              <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
                SUPPORT TICKETS HUB
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>📩 إدارة تذاكر الدعم والرد السريع</span>
            </h1>
            <p className="text-sm text-slate-400">
              {isAr
                ? "متابعة رسائل واستفسارات المستخدمين والرد المباشر عليها عبر البريد الإلكتروني (Resend)."
                : "Manage customer support inquiries and send quick replies via Resend."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/${locale}/admin`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs sm:text-sm font-medium transition"
            >
              <span>👥 {isAr ? "المستخدمين" : "Users"}</span>
            </Link>

            <Link
              href={`/${locale}/admin/subscribers`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs sm:text-sm font-medium transition"
            >
              <span>📬 {isAr ? "المشتركون" : "Subscribers"}</span>
            </Link>

            <button
              onClick={fetchTickets}
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
              <span>{isAr ? "تسجيل خروج" : "Logout"}</span>
            </button>
          </div>
        </header>

        {/* Top KPI Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>{isAr ? "إجمالي التذاكر المستلمة" : "Total Tickets"}</span>
              <span className="text-base">🎫</span>
            </div>
            <div className="text-3xl font-extrabold text-white">{stats.total}</div>
            <div className="text-[11px] text-slate-400">
              {isAr ? "كافة الاستفسارات في قاعدة البيانات" : "All customer inquiries in database"}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-amber-500/30 rounded-2xl p-5 space-y-2 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-amber-500/60"></div>
            <div className="flex items-center justify-between text-amber-300 text-xs font-semibold">
              <span>{isAr ? "قيد المراجعة والانتظار (PENDING)" : "Pending / Open Tickets"}</span>
              <span className="text-base">⏳</span>
            </div>
            <div className="text-3xl font-extrabold text-amber-400">{stats.pending}</div>
            <div className="text-[11px] text-slate-400">
              {isAr ? "تذاكر تتطلب رد المطور أو فريق الدعم" : "Tickets awaiting staff reply"}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-5 space-y-2 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500/60"></div>
            <div className="flex items-center justify-between text-emerald-300 text-xs font-semibold">
              <span>{isAr ? "تم الرد والحل (RESOLVED)" : "Resolved Tickets"}</span>
              <span className="text-base">✓</span>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400">{stats.resolved}</div>
            <div className="text-[11px] text-slate-400">
              {isAr ? "تذاكر تم إرسال إجابة رسمية لها" : "Tickets resolved and replied to"}
            </div>
          </div>
        </section>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={fetchTickets} className="underline font-bold text-xs hover:text-white">
              {isAr ? "إعادة المحاولة" : "Retry"}
            </button>
          </div>
        )}

        {/* Filters & Search Toolbar */}
        <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-80 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isAr ? "بحث بالاسم، البريد، الموضوع، أو رقم التذكرة..." : "Search tickets..."}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 ltr:right-3 rtl:left-3 flex items-center text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  statusFilter === "ALL" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                {isAr ? "الكل" : "All"} ({tickets.length})
              </button>
              <button
                onClick={() => setStatusFilter("PENDING")}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  statusFilter === "PENDING"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {isAr ? "قيد الانتظار" : "Pending"} ({stats.pending})
              </button>
              <button
                onClick={() => setStatusFilter("RESOLVED")}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  statusFilter === "RESOLVED"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {isAr ? "تم الرد" : "Resolved"} ({stats.resolved})
              </button>
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">{isAr ? "جميع الأقسام" : "All Categories"}</option>
              <option value="billing">{isAr ? "💎 الاشتراكات والمدفوعات" : "Billing"}</option>
              <option value="cv_issue">{isAr ? "📄 السيرة والـ ATS" : "CV & ATS"}</option>
              <option value="general_inquiry">{isAr ? "💼 استفسار عام وتأشيرة" : "General / Visa"}</option>
              <option value="suggestion">{isAr ? "💡 اقتراح وملاحظة" : "Suggestion"}</option>
            </select>
          </div>
        </section>

        {/* Tickets List Table */}
        <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-400">{isAr ? "جاري تحميل التذاكر..." : "Loading support tickets..."}</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <span className="text-3xl">📭</span>
              <h3 className="text-base font-bold text-white">
                {isAr ? "لا توجد تذاكر دعم مطابقة" : "No support tickets found"}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? "لم يتم العثور على تذاكر مطابقة لمعايير البحث أو الفلترة الحالية."
                  : "No tickets matching your search or filter criteria."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 text-start">{isAr ? "التذكرة / المستخدم" : "Ticket / User"}</th>
                    <th className="py-3.5 px-4 text-start">{isAr ? "القسم" : "Category"}</th>
                    <th className="py-3.5 px-4 text-start">{isAr ? "الموضوع والرسالة" : "Subject & Message"}</th>
                    <th className="py-3.5 px-4 text-center">{isAr ? "التاريخ" : "Date"}</th>
                    <th className="py-3.5 px-4 text-center">{isAr ? "الحالة" : "Status"}</th>
                    <th className="py-3.5 px-4 text-center">{isAr ? "الإجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredTickets.map((ticket) => {
                    const catInfo = CATEGORY_MAP[ticket.category] || {
                      labelAr: ticket.category,
                      labelEn: ticket.category,
                      color: "bg-slate-800 text-slate-300 border-slate-700",
                      icon: "📌",
                    };
                    const isExpanded = expandedTicketId === ticket.id;
                    const isPending = ticket.status === "PENDING";

                    return (
                      <React.Fragment key={ticket.id}>
                        <tr className="hover:bg-slate-800/30 transition">
                          {/* Ticket ID & User Info */}
                          <td className="py-4 px-4 align-top">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-white text-xs sm:text-sm">
                                <span>{ticket.name}</span>
                              </div>
                              <a
                                href={`mailto:${ticket.email}?subject=Re: ${encodeURIComponent(ticket.subject)}`}
                                className="block text-blue-400 hover:underline text-xs font-mono"
                              >
                                {ticket.email}
                              </a>
                              <div className="text-[10px] text-slate-500 font-mono">ID: {ticket.id}</div>
                            </div>
                          </td>

                          {/* Category Tag */}
                          <td className="py-4 px-4 align-top">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${catInfo.color}`}
                            >
                              <span>{catInfo.icon}</span>
                              <span>{isAr ? catInfo.labelAr : catInfo.labelEn}</span>
                            </span>
                          </td>

                          {/* Subject & Snippet */}
                          <td className="py-4 px-4 align-top max-w-md">
                            <div className="space-y-1.5">
                              <h4 className="font-bold text-white text-xs sm:text-sm leading-snug">
                                {ticket.subject}
                              </h4>
                              <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed whitespace-pre-wrap">
                                {ticket.message}
                              </p>
                              
                              {/* View Details Toggle */}
                              <button
                                onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                                className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline font-semibold cursor-pointer"
                              >
                                {isExpanded
                                  ? isAr
                                    ? "▲ إخفاء التفاصيل"
                                    : "▲ Collapse"
                                  : isAr
                                  ? "▼ عرض الرسالة الكاملة"
                                  : "▼ View full message"}
                              </button>
                            </div>
                          </td>

                          {/* Date */}
                          <td className="py-4 px-4 align-top text-center text-slate-400 text-[11px] whitespace-nowrap">
                            {formatDate(ticket.createdAt)}
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-4 align-top text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                isPending
                                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                  : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              }`}
                            >
                              <span>{isPending ? "⏳" : "✓"}</span>
                              <span>{ticket.status}</span>
                            </span>
                            {ticket.repliedAt && (
                              <div className="text-[10px] text-slate-500 mt-1">
                                {formatDate(ticket.repliedAt)}
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 align-top text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              {/* Quick Reply Button */}
                              <button
                                onClick={() => openReplyModal(ticket)}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                                title="Quick Reply via Email"
                              >
                                <span>✉️</span>
                                <span>{isAr ? "رد سريع" : "Quick Reply"}</span>
                              </button>

                              {/* Toggle Status Button */}
                              <button
                                onClick={() => handleToggleStatus(ticket.id, ticket.status)}
                                disabled={actionLoadingId === `status-${ticket.id}`}
                                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${
                                  isPending
                                    ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                                    : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20"
                                }`}
                                title={isPending ? "Mark as RESOLVED" : "Re-open as PENDING"}
                              >
                                {actionLoadingId === `status-${ticket.id}`
                                  ? "..."
                                  : isPending
                                  ? isAr
                                    ? "تعيين كمكتمل"
                                    : "Resolve"
                                  : isAr
                                  ? "إعادة فتح"
                                  : "Reopen"}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Details Row */}
                        {isExpanded && (
                          <tr className="bg-slate-950/80">
                            <td colSpan={6} className="py-4 px-6 border-y border-slate-800/80">
                              <div className="space-y-4 max-w-4xl mx-auto">
                                {/* Original User Message Card */}
                                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                                    <span className="font-semibold text-slate-300">
                                      {isAr ? "نص رسالة المستخدم:" : "User Inquiry:"}
                                    </span>
                                    <span>{formatDate(ticket.createdAt)}</span>
                                  </div>
                                  <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                                    {ticket.message}
                                  </div>
                                </div>

                                {/* Previous Admin Reply (if exists) */}
                                {ticket.adminReply && (
                                  <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-2">
                                    <div className="flex items-center justify-between text-xs text-blue-300 border-b border-blue-500/20 pb-2">
                                      <span className="font-bold flex items-center gap-1.5">
                                        <span>💬</span>
                                        <span>{isAr ? "رد الإدارة المرسل:" : "Admin Response Sent:"}</span>
                                      </span>
                                      {ticket.repliedAt && (
                                        <span className="text-[11px] text-slate-400">
                                          {formatDate(ticket.repliedAt)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs sm:text-sm text-blue-100 whitespace-pre-wrap leading-relaxed font-sans">
                                      {ticket.adminReply}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>

      {/* ========================================================= */}
      {/* QUICK REPLY MODAL */}
      {/* ========================================================= */}
      {replyModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold">
                  <span>✉️</span>
                  <span>{isAr ? "الرد السريع عبر Resend" : "Quick Reply via Resend"}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {isAr ? "إرسال رد رسمي للمستخدم" : "Send Official Support Reply"}
                </h3>
              </div>
              <button
                onClick={closeReplyModal}
                disabled={isSendingReply}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Recipient & Inquiry Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-slate-400">{isAr ? "المستلم: " : "Recipient: "}</span>
                  <strong className="text-white">{replyModalTicket.name}</strong>{" "}
                  <span className="text-blue-400 font-mono">({replyModalTicket.email})</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">ID: {replyModalTicket.id}</div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 text-slate-300">
                <span className="text-slate-400">{isAr ? "استفسار المستخدم: " : "User Inquiry: "}</span>
                <span className="line-clamp-2 italic text-slate-300">&ldquo;{replyModalTicket.message}&rdquo;</span>
              </div>
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendReply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isAr ? "عنوان البريد (Subject):" : "Email Subject:"}
                </label>
                <input
                  type="text"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    {isAr ? "نص الإجابة والرد (Reply Message):" : "Response Message:"}
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {replyMessage.length} {isAr ? "حرف" : "chars"}
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder={
                    isAr
                      ? "اكتب تفاصيل إجابتك هنا بدقة واحترافية..."
                      : "Type your professional answer here..."
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition leading-relaxed font-sans"
                  required
                />
              </div>

              {/* Quick Template Fillers */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-400 font-medium">
                  {isAr ? "قوالب رد جاهزة:" : "Quick templates:"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setReplyMessage(
                      isAr
                        ? `مرحباً ${replyModalTicket.name}،\n\nشكراً لتواصلك معنا. نود إعلامك بأنه تم تفعيل اشتراكك وتحديث رصيد الذكاء الاصطناعي بنجاح على حسابك.\n\nنتمنى لك كل التوفيق في تقديماتك للعمل في ألمانيا!`
                        : `Hello ${replyModalTicket.name},\n\nThank you for reaching out. We are glad to inform you that your subscription and AI credits have been successfully activated on your account.\n\nBest of luck with your German career applications!`
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition cursor-pointer"
                >
                  {isAr ? "✓ تأكيد الاشتراك والدفع" : "Subscription Confirmed"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setReplyMessage(
                      isAr
                        ? `مرحباً ${replyModalTicket.name}،\n\nنشكرك على إبلاغنا بالملاحظة. تم حل المشكلة التقنية بنجاح، ويمكنك الآن إعادة استخدام الأداة بدون أي معوقات.\n\nإذا واجهتك أي صعوبة أخرى، نحن دائماً في خدمتك.`
                        : `Hello ${replyModalTicket.name},\n\nThank you for reporting this issue. It has been successfully resolved, and you can now continue using the feature smoothly.\n\nFeel free to reply if you need any further assistance.`
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition cursor-pointer"
                >
                  {isAr ? "🔧 تم حل المشكلة التقنية" : "Issue Resolved"}
                </button>
              </div>

              {/* Feedback Alert */}
              {replyFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    replyFeedback.type === "success"
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                      : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
                  }`}
                >
                  {replyFeedback.message}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeReplyModal}
                  disabled={isSendingReply}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm transition cursor-pointer"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSendingReply || !replyMessage.trim()}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 active:scale-95 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSendingReply ? (
                    <span>{isAr ? "جاري الإرسال عبر Resend..." : "Sending via Resend..."}</span>
                  ) : (
                    <span>{isAr ? "إرسال الرد وتعيين كمكتمل 🚀" : "Send Reply & Resolve 🚀"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
