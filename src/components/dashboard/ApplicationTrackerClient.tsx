"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type ApplicationStatusType =
  | "SAVED"
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "WITHDRAWN";

export interface ApplicationItem {
  id: string;
  userId: string;
  jobId: string | null;
  cvId: string | null;
  coverLetterId: string | null;
  companyName: string;
  jobTitle: string;
  location: string | null;
  status: ApplicationStatusType;
  appliedAt: string | Date | null;
  notes: string | null;
  followUpAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  job?: {
    id: string;
    title: string;
    company: string;
    city: string | null;
    applyUrl: string | null;
    status: string;
  } | null;
  cv?: {
    id: string;
    title: string;
    language: string;
  } | null;
  coverLetter?: {
    id: string;
    title: string;
    language: string;
  } | null;
}

interface ApplicationTrackerClientProps {
  initialApplications: ApplicationItem[];
  locale: string;
}

const STATUS_CONFIG: Record<
  ApplicationStatusType,
  {
    labels: Record<string, string>;
    badgeClass: string;
    icon: string;
  }
> = {
  SAVED: {
    labels: {
      ar: "محفوظة",
      de: "Gespeichert",
      en: "Saved",
      fr: "Enregistrée",
    },
    badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
    icon: "🔖",
  },
  APPLIED: {
    labels: {
      ar: "تم التقديم",
      de: "Beworben",
      en: "Applied",
      fr: "Postulée",
    },
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: "📤",
  },
  SCREENING: {
    labels: {
      ar: "قيد المراجعة",
      de: "In Prüfung",
      en: "Screening",
      fr: "En cours",
    },
    badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    icon: "🔍",
  },
  INTERVIEW: {
    labels: {
      ar: "مقابلة عمل",
      de: "Vorstellungsgespräch",
      en: "Interview",
      fr: "Entretien",
    },
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: "💼",
  },
  OFFER: {
    labels: {
      ar: "عرض عمل 🎉",
      de: "Vertragsangebot 🎉",
      en: "Job Offer 🎉",
      fr: "Offre reçue 🎉",
    },
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icon: "🎉",
  },
  REJECTED: {
    labels: {
      ar: "مرفوضة",
      de: "Abgelehnt",
      en: "Rejected",
      fr: "Refusée",
    },
    badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    icon: "❌",
  },
  WITHDRAWN: {
    labels: {
      ar: "مسحوبة",
      de: "Zurückgezogen",
      en: "Withdrawn",
      fr: "Retirée",
    },
    badgeClass: "bg-slate-800 text-slate-400 border-slate-700",
    icon: "↩️",
  },
};

const TAB_FILTERS: Array<"ALL" | ApplicationStatusType> = [
  "ALL",
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];

export default function ApplicationTrackerClient({
  initialApplications,
  locale,
}: ApplicationTrackerClientProps) {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationItem[]>(initialApplications);
  const [activeTab, setActiveTab] = useState<"ALL" | ApplicationStatusType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Notes Modal state
  const [editingNotesApp, setEditingNotesApp] = useState<ApplicationItem | null>(null);
  const [notesContent, setNotesContent] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Delete Confirmation state
  const [deletingApp, setDeletingApp] = useState<ApplicationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Manual Application Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [newFormData, setNewFormData] = useState({
    companyName: "",
    jobTitle: "",
    location: "",
    status: "APPLIED" as ApplicationStatusType,
    notes: "",
  });

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isAr = locale === "ar";
  const isDe = locale === "de";
  const isFr = locale === "fr";

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Translations helper
  const t = {
    searchPlaceholder: isAr
      ? "بحث حسب اسم الشركة أو المسمى الوظيفي..."
      : isDe
      ? "Nach Firma oder Berufsbezeichnung suchen..."
      : isFr
      ? "Rechercher par entreprise ou poste..."
      : "Search by company or job title...",
    addApplication: isAr
      ? "+ إضافة تقديم جديد"
      : isDe
      ? "+ Bewerbung hinzufügen"
      : isFr
      ? "+ Ajouter une candidature"
      : "+ Add Application",
    allTab: isAr ? "الكل" : isDe ? "Alle" : isFr ? "Toutes" : "All",
    statusFilter: isAr ? "الحالة:" : isDe ? "Status:" : isFr ? "Statut :" : "Status:",
    changeStatus: isAr ? "تغيير الحالة" : isDe ? "Status ändern" : isFr ? "Changer statut" : "Change Status",
    notesBtn: isAr ? "ملاحظات التقديم" : isDe ? "Notizen" : isFr ? "Notes" : "Notes",
    addNotesPlaceholder: isAr
      ? "أضف ملاحظاتك هنا (بيانات التواصل، تفاصيل المقابلة، الأسئلة المتوقعة...)"
      : isDe
      ? "Notizen hinzufügen (Ansprechpartner, Vorbereitung, Fragen...)"
      : isFr
      ? "Ajouter des notes (contact, préparation d'entretien, questions...)"
      : "Add notes (interviewer contact, preparation notes, questions...)",
    saveNotes: isAr ? "حفظ الملاحظات" : isDe ? "Notizen speichern" : isFr ? "Enregistrer" : "Save Notes",
    cancel: isAr ? "إلغاء" : isDe ? "Abbrechen" : isFr ? "Annuler" : "Cancel",
    deleteBtn: isAr ? "حذف التقديم" : isDe ? "Löschen" : isFr ? "Supprimer" : "Delete",
    confirmDeleteTitle: isAr ? "تأكيد حذف التقديم" : isDe ? "Bewerbung löschen" : isFr ? "Confirmer la suppression" : "Confirm Delete",
    confirmDeleteDesc: isAr
      ? "هل أنت متأكد من حذف هذا التقديم من سجل متابعتك؟"
      : isDe
      ? "Möchten Sie diese Bewerbung wirklich aus der Liste entfernen?"
      : isFr
      ? "Êtes-vous sûr de vouloir supprimer cette candidature de votre suivi ?"
      : "Are you sure you want to remove this application from your tracker?",
    deleting: isAr ? "جاري الحذف..." : isDe ? "Wird gelöscht..." : isFr ? "Suppression..." : "Deleting...",
    saving: isAr ? "جاري الحفظ..." : isDe ? "Wird gespeichert..." : isFr ? "Enregistrement..." : "Saving...",
    linkedCv: isAr ? "السيرة الذاتية (DIN 5008)" : isDe ? "Lebenslauf" : isFr ? "CV associé" : "Linked CV",
    linkedCoverLetter: isAr ? "خطاب التغطية" : isDe ? "Anschreiben" : isFr ? "Lettre" : "Cover Letter",
    viewJob: isAr ? "إعلان الوظيفة" : isDe ? "Stellenanzeige" : isFr ? "Offre d'emploi" : "Job Post",
    appliedOn: isAr ? "تاريخ التقديم:" : isDe ? "Beworben am:" : isFr ? "Postulé le :" : "Applied:",
    updatedOn: isAr ? "آخر تحديث:" : isDe ? "Aktualisiert:" : isFr ? "Mis à jour :" : "Updated:",
    emptyTitle: isAr ? "لا توجد تقديمات مسجلة بعد" : isDe ? "Noch keine Bewerbungen erfasst" : isFr ? "Aucune candidature enregistrée" : "No applications tracked yet",
    emptyDesc: isAr
      ? "تصفح مئات الوظائف في ألمانيا وقدم عليها بضغطة زر لمتابعة مسارك المهني بدقة واحترافية."
      : isDe
      ? "Entdecken Sie geprüfte Stellenangebote in Deutschland und behalten Sie Ihre Bewerbungen im Blick."
      : isFr
      ? "Explorez les offres d'emploi en Allemagne et suivez facilement l'avancement de vos candidatures."
      : "Explore German job opportunities and effortlessly track your application pipeline from saved to offer.",
    browseJobsCta: isAr ? "تصفح وظائف ألمانيا الآن ←" : isDe ? "Jetzt Jobs durchsuchen →" : isFr ? "Explorer les emplois →" : "Browse German Jobs →",
    noMatchTitle: isAr ? "لا توجد نتائج مطابقة" : isDe ? "Keine Ergebnisse gefunden" : isFr ? "Aucun résultat trouvé" : "No matching applications",
    noMatchDesc: isAr ? "جرب تغيير نص البحث أو اختيار تصنيف حالة آخر." : isDe ? "Versuchen Sie, den Suchbegriff oder den Filter anzupassen." : isFr ? "Essayez d'ajuster votre recherche ou filtre." : "Try adjusting your search terms or status filter.",
    clearFilter: isAr ? "عرض كل التقديمات" : isDe ? "Filter zurücksetzen" : isFr ? "Réinitialiser" : "Clear Filter",
    newModalTitle: isAr ? "تسجيل طلب تقديم جديد" : isDe ? "Neue Bewerbung erfassen" : isFr ? "Ajouter une candidature" : "Track New Job Application",
    companyLabel: isAr ? "اسم الشركة *" : isDe ? "Unternehmen *" : isFr ? "Entreprise *" : "Company Name *",
    jobTitleLabel: isAr ? "المسمى الوظيفي *" : isDe ? "Positionsbezeichnung *" : isFr ? "Poste *" : "Job Title *",
    locationLabel: isAr ? "المدينة / الموقع" : isDe ? "Standort / Stadt" : isFr ? "Ville / Lieu" : "Location / City",
    statusLabel: isAr ? "المرحلة الحالية" : isDe ? "Aktueller Status" : isFr ? "Statut initial" : "Current Status",
    notesLabel: isAr ? "ملاحظات إضافية" : isDe ? "Notizen" : isFr ? "Notes" : "Notes",
    submitNewBtn: isAr ? "حفظ التقديم" : isDe ? "Bewerbung speichern" : isFr ? "Enregistrer" : "Track Application",
  };

  // Tab counts calculation
  const counts = useMemo(() => {
    const acc: Record<string, number> = { ALL: applications.length };
    for (const app of applications) {
      acc[app.status] = (acc[app.status] || 0) + 1;
    }
    return acc;
  }, [applications]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Tab filter
      if (activeTab !== "ALL" && app.status !== activeTab) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCompany = app.companyName.toLowerCase().includes(query);
        const matchesTitle = app.jobTitle.toLowerCase().includes(query);
        const matchesLocation = app.location?.toLowerCase().includes(query) || false;
        if (!matchesCompany && !matchesTitle && !matchesLocation) {
          return false;
        }
      }
      return true;
    });
  }, [applications, activeTab, searchQuery]);

  // Handle status update
  const handleStatusChange = async (appId: string, newStatus: ApplicationStatusType) => {
    setUpdatingId(appId);
    const previous = applications;

    // Optimistic update
    setApplications((prev) =>
      prev.map((app) =>
        app.id === appId
          ? {
              ...app,
              status: newStatus,
              updatedAt: new Date().toISOString(),
              appliedAt:
                newStatus === "APPLIED" && !app.appliedAt
                  ? new Date().toISOString()
                  : app.appliedAt,
            }
          : app
      )
    );

    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update status");
      }

      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, ...data.application } : app))
      );
      showToast(
        isAr
          ? "تم تحديث حالة التقديم بنجاح"
          : isDe
          ? "Status erfolgreich aktualisiert"
          : "Application status updated successfully"
      );
    } catch {
      // Revert optimistic update
      setApplications(previous);
      showToast(
        isAr
          ? "حدث خطأ أثناء تحديث الحالة"
          : isDe
          ? "Fehler beim Aktualisieren des Status"
          : "Failed to update status"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Open Notes Modal
  const openNotesModal = (app: ApplicationItem) => {
    setEditingNotesApp(app);
    setNotesContent(app.notes || "");
  };

  // Save Notes
  const handleSaveNotes = async () => {
    if (!editingNotesApp) return;
    setIsSavingNotes(true);

    try {
      const res = await fetch(`/api/applications/${editingNotesApp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesContent }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save notes");
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === editingNotesApp.id
            ? { ...app, notes: notesContent, updatedAt: new Date().toISOString() }
            : app
        )
      );

      setEditingNotesApp(null);
      showToast(
        isAr
          ? "تم حفظ الملاحظات بنجاح"
          : isDe
          ? "Notizen erfolgreich gespeichert"
          : "Notes saved successfully"
      );
    } catch {
      showToast(
        isAr
          ? "حدث خطأ أثناء حفظ الملاحظات"
          : isDe
          ? "Fehler beim Speichern der Notizen"
          : "Failed to save notes"
      );
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Delete Application
  const handleDeleteApplication = async () => {
    if (!deletingApp) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/applications/${deletingApp.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete application");
      }

      setApplications((prev) => prev.filter((app) => app.id !== deletingApp.id));
      setDeletingApp(null);
      showToast(
        isAr
          ? "تم حذف التقديم بنجاح"
          : isDe
          ? "Bewerbung erfolgreich gelöscht"
          : "Application deleted successfully"
      );
    } catch {
      showToast(
        isAr
          ? "حدث خطأ أثناء حذف التقديم"
          : isDe
          ? "Fehler beim Löschen der Bewerbung"
          : "Failed to delete application"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Create Manual Application
  const handleCreateNewApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormData.companyName.trim() || !newFormData.jobTitle.trim()) {
      return;
    }

    setIsSubmittingNew(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: newFormData.companyName.trim(),
          jobTitle: newFormData.jobTitle.trim(),
          location: newFormData.location.trim() || null,
          status: newFormData.status,
          notes: newFormData.notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create application");
      }

      setApplications((prev) => [data.application, ...prev]);
      setIsAddModalOpen(false);
      setNewFormData({
        companyName: "",
        jobTitle: "",
        location: "",
        status: "APPLIED",
        notes: "",
      });
      showToast(
        isAr
          ? "تمت إضافة التقديم إلى سجلك بنجاح!"
          : isDe
          ? "Bewerbung erfolgreich hinzugefügt!"
          : "Application tracked successfully!"
      );
    } catch {
      showToast(
        isAr
          ? "حدث خطأ أثناء إضافة التقديم"
          : isDe
          ? "Fehler beim Erstellen der Bewerbung"
          : "Failed to add application"
      );
    } finally {
      setIsSubmittingNew(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-blue-500/40 text-blue-300 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-fadeIn text-sm font-semibold">
          <span className="text-emerald-400">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Bar: Search & Action */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-4 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Instant Search Bar */}
        <div className="relative flex-1 max-w-xl">
          <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full ps-11 pe-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500 text-sm transition-all outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Button: Add New Application */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-extrabold text-sm shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <span>✨</span>
            <span>{t.addApplication}</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {TAB_FILTERS.map((tab) => {
          const isActive = activeTab === tab;
          const count = counts[tab] || 0;
          const label =
            tab === "ALL"
              ? t.allTab
              : STATUS_CONFIG[tab]?.labels[locale] || STATUS_CONFIG[tab]?.labels.en || tab;
          const icon = tab === "ALL" ? "📊" : STATUS_CONFIG[tab]?.icon;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 border border-blue-500"
                  : "bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80"
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                  isActive ? "bg-blue-500/40 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        /* Entirely Empty State */
        <div className="text-center py-16 px-6 rounded-3xl bg-slate-900/50 border border-dashed border-slate-800 space-y-4 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-3xl">
            💼
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold text-white">{t.emptyTitle}</h3>
            <p className="text-sm text-slate-400">{t.emptyDesc}</p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href={`/${locale}/jobs`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
            >
              {t.browseJobsCta}
            </Link>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-colors border border-slate-700 cursor-pointer"
            >
              {t.addApplication}
            </button>
          </div>
        </div>
      ) : filteredApplications.length === 0 ? (
        /* No Search Matches */
        <div className="text-center py-12 px-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="text-3xl">🔍</div>
          <h3 className="text-base font-bold text-white">{t.noMatchTitle}</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">{t.noMatchDesc}</p>
          <button
            type="button"
            onClick={() => {
              setActiveTab("ALL");
              setSearchQuery("");
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold transition-colors cursor-pointer"
          >
            {t.clearFilter}
          </button>
        </div>
      ) : (
        /* Grid of Application Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApplications.map((app) => {
            const statusMeta = STATUS_CONFIG[app.status] || STATUS_CONFIG.SAVED;
            const statusLabel = statusMeta.labels[locale] || statusMeta.labels.en || app.status;
            const isUpdating = updatingId === app.id;

            return (
              <div
                key={app.id}
                className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-3xl p-6 transition-all shadow-xl flex flex-col justify-between space-y-5 group relative"
              >
                {/* Header: Company, Title & Status */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-blue-400 font-mono uppercase tracking-wider truncate max-w-[200px]">
                          🏢 {app.companyName}
                        </span>
                        {app.location && (
                          <span className="text-[11px] text-slate-500 font-medium truncate">
                            • 📍 {app.location}
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-white text-lg group-hover:text-blue-300 transition-colors line-clamp-2">
                        {app.jobTitle}
                      </h3>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 border flex items-center gap-1.5 ${statusMeta.badgeClass}`}
                    >
                      <span>{statusMeta.icon}</span>
                      <span>{statusLabel}</span>
                    </span>
                  </div>

                  {/* Status Dropdown Selector */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                    <label className="text-xs text-slate-400 font-semibold shrink-0">
                      {t.statusFilter}
                    </label>
                    <select
                      value={app.status}
                      disabled={isUpdating}
                      onChange={(e) =>
                        handleStatusChange(app.id, e.target.value as ApplicationStatusType)
                      }
                      className="text-xs font-bold py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer transition-all disabled:opacity-50"
                    >
                      {Object.keys(STATUS_CONFIG).map((st) => (
                        <option key={st} value={st} className="bg-slate-900 text-white">
                          {STATUS_CONFIG[st as ApplicationStatusType].labels[locale] || st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Related DIN 5008 Links (CV & Cover Letter) */}
                  {(app.cv || app.coverLetter || app.job) && (
                    <div className="pt-2 border-t border-slate-800/60 space-y-1.5 text-xs">
                      {app.cv && (
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="flex items-center gap-1.5 truncate">
                            <span>📄</span>
                            <span className="text-slate-400">{t.linkedCv}:</span>
                          </span>
                          <Link
                            href={`/${locale}/dashboard/cv/${app.cv.id}`}
                            className="font-semibold text-blue-400 hover:text-blue-300 underline truncate max-w-[150px]"
                          >
                            {app.cv.title}
                          </Link>
                        </div>
                      )}

                      {app.coverLetter && (
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="flex items-center gap-1.5 truncate">
                            <span>✍️</span>
                            <span className="text-slate-400">{t.linkedCoverLetter}:</span>
                          </span>
                          <Link
                            href={`/${locale}/dashboard/cover-letters/${app.coverLetter.id}`}
                            className="font-semibold text-blue-400 hover:text-blue-300 underline truncate max-w-[150px]"
                          >
                            {app.coverLetter.title}
                          </Link>
                        </div>
                      )}

                      {app.job && (
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="flex items-center gap-1.5 truncate">
                            <span>🔗</span>
                            <span className="text-slate-400">{t.viewJob}:</span>
                          </span>
                          <Link
                            href={`/${locale}/jobs/${app.job.id}`}
                            className="font-semibold text-blue-400 hover:text-blue-300 underline truncate max-w-[150px]"
                          >
                            {app.job.title}
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes Preview (if any) */}
                  {app.notes && (
                    <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/60 text-xs text-slate-300 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                        <span>📝 {t.notesBtn}</span>
                        <button
                          type="button"
                          onClick={() => openNotesModal(app)}
                          className="text-blue-400 hover:underline cursor-pointer"
                        >
                          {isAr ? "تعديل" : isDe ? "Bearbeiten" : "Edit"}
                        </button>
                      </div>
                      <p className="line-clamp-2 text-slate-300 leading-relaxed font-sans">
                        {app.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Controls: Dates & Actions */}
                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>
                      {app.appliedAt
                        ? `${t.appliedOn} ${new Date(app.appliedAt).toLocaleDateString(locale)}`
                        : `${t.updatedOn} ${new Date(app.updatedAt).toLocaleDateString(locale)}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {/* Notes Modal Trigger */}
                    <button
                      type="button"
                      onClick={() => openNotesModal(app)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>📝</span>
                      <span>{app.notes ? (isAr ? "الملاحظات" : "Notes") : (isAr ? "+ ملاحظة" : "+ Notes")}</span>
                    </button>

                    {/* Delete Action */}
                    <button
                      type="button"
                      onClick={() => setDeletingApp(app)}
                      title={t.deleteBtn}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notes Modal */}
      {editingNotesApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-blue-400 uppercase">
                {editingNotesApp.companyName}
              </span>
              <h3 className="text-xl font-bold text-white">
                {editingNotesApp.jobTitle} - {t.notesBtn}
              </h3>
            </div>

            <div className="space-y-2">
              <textarea
                rows={5}
                value={notesContent}
                onChange={(e) => setNotesContent(e.target.value)}
                placeholder={t.addNotesPlaceholder}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500 text-sm outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingNotesApp(null)}
                disabled={isSavingNotes}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/25 cursor-pointer disabled:opacity-50"
              >
                {isSavingNotes ? t.saving : t.saveNotes}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">{t.confirmDeleteTitle}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t.confirmDeleteDesc}
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300">
                🏢 {deletingApp.companyName} • {deletingApp.jobTitle}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingApp(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteApplication}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all shadow-lg shadow-rose-600/25 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? t.deleting : t.deleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Application Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">{t.newModalTitle}</h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? "سجل وظيفة تقدمت إليها لمتابعة مقابلاتك والتواصل مع أصحاب العمل."
                  : isDe
                  ? "Erfassen Sie eine Bewerbung, um den Status jederzeit zu verfolgen."
                  : "Track any application you submitted to keep your pipeline organized."}
              </p>
            </div>

            <form onSubmit={handleCreateNewApplication} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">{t.companyLabel}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Siemens AG, SAP, BMW Group..."
                  value={newFormData.companyName}
                  onChange={(e) =>
                    setNewFormData((prev) => ({ ...prev, companyName: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500 text-sm outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">{t.jobTitleLabel}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend Developer, Pflegefachkraft..."
                  value={newFormData.jobTitle}
                  onChange={(e) =>
                    setNewFormData((prev) => ({ ...prev, jobTitle: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">{t.locationLabel}</label>
                  <input
                    type="text"
                    placeholder="e.g. Berlin, München, Remote..."
                    value={newFormData.location}
                    onChange={(e) =>
                      setNewFormData((prev) => ({ ...prev, location: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500 text-sm outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">{t.statusLabel}</label>
                  <select
                    value={newFormData.status}
                    onChange={(e) =>
                      setNewFormData((prev) => ({
                        ...prev,
                        status: e.target.value as ApplicationStatusType,
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-sm outline-none cursor-pointer"
                  >
                    {Object.keys(STATUS_CONFIG).map((st) => (
                      <option key={st} value={st} className="bg-slate-900 text-white">
                        {STATUS_CONFIG[st as ApplicationStatusType].labels[locale] || st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">{t.notesLabel}</label>
                <textarea
                  rows={3}
                  placeholder={t.addNotesPlaceholder}
                  value={newFormData.notes}
                  onChange={(e) =>
                    setNewFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500 text-sm outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmittingNew}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/25 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingNew ? t.saving : t.submitNewBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
