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

interface UserActivity {
  cvCount: number;
  coverLetterCount: number;
  atsRuns: number;
  dossierRuns: number;
  aiAssistRuns: number;
  lastActiveAt: string;
  hasUsedAnyTool: boolean;
  isHotLead: boolean;
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
  activity?: UserActivity;
}

interface ActivitySummary {
  totalAtsRuns: number;
  totalDossierRuns: number;
  activatedUsersCount: number;
  hotLeadsCount: number;
}

interface PlatformStats {
  totalUsers: number;
  proUsers: number;
  totalAiCredits: number;
  totalJobs?: number;
  totalCvs?: number;
  totalCoverLetters?: number;
  activitySummary?: ActivitySummary;
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

type FilterType =
  | "ALL"
  | "PRO"
  | "SPRINT"
  | "FREE"
  | "TRIAL"
  | "HOT_LEADS"
  | "HAS_ATS"
  | "HAS_CV"
  | "HAS_DOSSIER"
  | "INACTIVE";

type SortType = "newest" | "newest_active" | "most_used" | "most_docs" | "lowest_credits";
type OutreachTemplateKey = "hot_lead" | "cv_no_ats" | "new_signup" | "power_user";
type OutreachLanguage = "ar" | "fr" | "en";

function formatTimeAgo(isoString: string, isAr: boolean): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return isAr ? "الآن" : "Just now";
    if (diffMins < 60) return isAr ? `منذ ${diffMins} د` : `${diffMins}m ago`;
    if (diffHours < 24) return isAr ? `منذ ${diffHours} س` : `${diffHours}h ago`;
    if (diffDays === 1) return isAr ? "أمس" : "Yesterday";
    if (diffDays < 30) return isAr ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
    return new Date(isoString).toLocaleDateString(isAr ? "ar-MA" : "en-US", { month: "short", day: "numeric" });
  } catch {
    return isAr ? "غير معروف" : "Unknown";
  }
}

function buildOutreachContent(
  template: OutreachTemplateKey,
  lang: OutreachLanguage,
  user: UserItem
): { subject: string; body: string } {
  const userName =
    user.name?.trim() ||
    user.email.split("@")[0] ||
    (lang === "ar" ? "عزيزي العضو" : lang === "fr" ? "Cher membre" : "Valued Member");

  const cvs = user.activity?.cvCount ?? user._count?.cvs ?? 0;
  const ats = user.activity?.atsRuns ?? 0;
  const cls = user.activity?.coverLetterCount ?? user._count?.coverLetters ?? 0;
  const dossier = user.activity?.dossierRuns ?? 0;

  let activityDesc = "";
  if (lang === "ar") {
    const parts: string[] = [];
    if (cvs > 0) parts.push(`أنشأت ${cvs} سيرة ذاتية`);
    if (ats > 0) parts.push(`فحصت ATS ${ats} مرات`);
    if (cls > 0) parts.push(`أنشأت ${cls} خطاب دافع`);
    if (dossier > 0) parts.push(`جمعت ${dossier} ملف ترشح`);
    activityDesc = parts.length > 0 ? parts.join(" • ") : "سجلت مؤخراً";
  } else if (lang === "fr") {
    const parts: string[] = [];
    if (cvs > 0) parts.push(`${cvs} CV créé(s)`);
    if (ats > 0) parts.push(`${ats} analyse(s) ATS`);
    if (cls > 0) parts.push(`${cls} lettre(s) de motivation`);
    if (dossier > 0) parts.push(`${dossier} dossier(s) compilé(s)`);
    activityDesc = parts.length > 0 ? parts.join(" • ") : "inscription récente";
  } else {
    const parts: string[] = [];
    if (cvs > 0) parts.push(`${cvs} CV(s) created`);
    if (ats > 0) parts.push(`${ats} ATS run(s)`);
    if (cls > 0) parts.push(`${cls} Cover Letter(s)`);
    if (dossier > 0) parts.push(`${dossier} Dossier(s) compiled`);
    activityDesc = parts.length > 0 ? parts.join(" • ") : "recent signup";
  }

  switch (template) {
    case "hot_lead":
      if (lang === "fr") {
        return {
          subject: "Offre spéciale pour finaliser votre dossier en Allemagne 🇩🇪",
          body: `Bonjour ${userName},\n\nJ'ai remarqué votre progression active sur GermanJobsPro (${activityDesc}).\nPostuler auprès des employeurs allemands exige un dossier complet conforme aux normes DIN 5008.\n\nComme vous avez utilisé vos crédits d'essai, nous vous offrons une remise exclusive de 40% sur le pass PRO ou SPRINT avec le code : SPECIAL40\n\nN'hésitez pas à répondre directement à cet email si vous avez la moindre question concernant vos démarches en Allemagne.\n\nCordialement,\nL'équipe GermanJobsPro\nhttps://www.germanjobspro.com`,
        };
      }
      if (lang === "en") {
        return {
          subject: "Exclusive offer to complete your German job application 🇩🇪",
          body: `Hello ${userName},\n\nI noticed your great progress on GermanJobsPro (${activityDesc}).\nApplying for jobs or Ausbildung in Germany requires an ATS-optimized DIN 5008 CV and full application dossier.\n\nTo help you reach German employers faster, here is a 40% discount on our PRO pass:\nPromo Code: SPECIAL40\n\nFeel free to reply directly to this email if you need any guidance.\n\nBest regards,\nGermanJobsPro Team\nhttps://www.germanjobspro.com`,
        };
      }
      return {
        subject: "فرصة خاصة لإكمال ملف ترشيحك في ألمانيا 🇩🇪 [GermanJobsPro]",
        body: `مرحباً ${userName}،\n\nلاحظت اهتمامك الكبير وبدايتك الموفقة في إعداد ملفك المهني عبر المنصة (${activityDesc}).\nنعلم أن التقديم على الوظائف أو التدريب المهني (Ausbildung) في ألمانيا يتطلب دقة واكتمالاً في السيرة الذاتية وخطاب الدافع وملف الترشح.\n\nلتسهيل وصولك لأصحاب العمل الألمان وإكمال ملفك بدون قيود، يسعدنا تقديم كود خصم خاص بنسبة 40% على باقة PRO أو SPRINT:\nكود الخصم: SPECIAL40\n\nأو إذا واجهتك أي صعوبة أو كان لديك استفسار حول معايير DIN 5008 أو ترجمة المسميات، يمكنك الرد مباشرة على هذا البريد وسأساعدك شخصياً.\n\nمع تحياتي وتمنياتي لك بالتوفيق،\nفريق GermanJobsPro\nhttps://www.germanjobspro.com`,
      };

    case "cv_no_ats":
      if (lang === "fr") {
        return {
          subject: "Analysez votre CV avec notre ATS et créez votre Bewerbungsmappe 🇩🇪",
          body: `Bonjour ${userName},\n\nFélicitations pour la création de votre CV sur GermanJobsPro (${activityDesc}) !\n\nPour maximiser vos chances d'entretien en Allemagne, deux étapes cruciales vous attendent :\n1. Analyser votre CV avec notre scanner ATS DIN 5008 pour éliminer les erreurs de format.\n2. Compiler votre Bewerbungsmappe (CV + lettre de motivation + diplômes) en un seul PDF professionnel.\n\nTestez l'analyseur ATS dès maintenant sur votre tableau de bord :\nhttps://www.germanjobspro.com/fr/dashboard/ats-analyzer\n\nBesoin d'aide ? Répondez simplement à ce message.\n\nL'équipe GermanJobsPro`,
        };
      }
      if (lang === "en") {
        return {
          subject: "Run an ATS check and compile your German Bewerbungsmappe 🇩🇪",
          body: `Hello ${userName},\n\nCongrats on creating your CV on GermanJobsPro (${activityDesc})!\n\nTo stand out to German recruiters, make sure to take the next key steps:\n1. Test your CV with our DIN 5008 ATS Analyzer to ensure it passes automated screening.\n2. Compile a complete Bewerbungsmappe (CV, Cover Letter, and Certificates in a single unified PDF).\n\nAccess the ATS Analyzer here:\nhttps://www.germanjobspro.com/en/dashboard/ats-analyzer\n\nLet us know if you need any assistance!\n\nGermanJobsPro Team`,
        };
      }
      return {
        subject: "هل ترغب في فحص سيرتك الذاتية وتجهيز ملف الترشح الكامل؟ 🇩🇪",
        body: `مرحباً ${userName}،\n\nتهانينا على إنشاء سيرتك الذاتية على GermanJobsPro (${activityDesc})! 📄\n\nالخطوة الحاسمة التالية لقبول ملفك لدى الشركات الألمانية هي:\n1. فحص السيرة والتأكد من توافقها مع أنظمة الفرز الآلي (ATS DIN 5008).\n2. تجميع ملف ترشح كامل (Bewerbungsmappe) يضم السيرة وخطاب الدافع والشهادات في ملف PDF واحد منسق.\n\nيمكنك تجربة فاحص ATS واستوديو تجميع الملف مجاناً من لوحة تحكمك:\nhttps://www.germanjobspro.com/ar/dashboard/ats-analyzer\n\nإذا احتجت أي مساعدة أو مراجعة، تواصل معنا في أي وقت!\n\nفريق GermanJobsPro`,
      };

    case "new_signup":
      if (lang === "fr") {
        return {
          subject: "Bienvenue sur GermanJobsPro ! Comment pouvons-nous vous aider ? 🇩🇪",
          body: `Bonjour ${userName},\n\nBienvenue parmi nous sur GermanJobsPro ! 🎓\n\nQuel poste, domaine ou formation (Ausbildung) visez-vous en Allemagne ?\nRépondez simplement à cet email en nous précisant votre profil et votre niveau d'allemand, nous serons ravis de vous orienter gratuitement pour créer votre premier CV aux normes DIN 5008.\n\nBienvenue et plein succès,\nFondateur de GermanJobsPro\nhttps://www.germanjobspro.com`,
        };
      }
      if (lang === "en") {
        return {
          subject: "Welcome to GermanJobsPro! How can we help you work in Germany? 🇩🇪",
          body: `Hello ${userName},\n\nWelcome to GermanJobsPro! 🎓\n\nWhether you are targeting a direct job contract or vocational training (Ausbildung) in Germany, we are here to guide you step-by-step.\n\nWhich job title and industry are you aiming for? Do you need help formatting your CV to German DIN 5008 standards?\nReply directly to this email with your background and German language level, and we will happily assist you for free.\n\nWarm regards,\nFounder, GermanJobsPro\nhttps://www.germanjobspro.com`,
        };
      }
      return {
        subject: "أهلاً بك في GermanJobsPro! كيف يمكننا مساعدتك للعمل في ألمانيا؟ 🇩🇪",
        body: `مرحباً ${userName}،\n\nيسعدنا انضمامك إلى GermanJobsPro! 🎓\nسواء كنت تبحث عن وظيفة مهنية، عقد عمل، أو تدريب مهني (Ausbildung) في ألمانيا، نحن هنا لنرشدك خطوة بخطوة.\n\nهل حددت المجال أو التخصص الذي تستهدفه؟ أو هل تواجه صعوبة في صياغة السيرة الذاتية باللغة الألمانية؟\nرد مباشرة على هذه الرسالة وأخبرنا باختصاصك ومستواك اللغوي، وسيسعدنا تقديم التوجيه المناسب لك مجاناً لمساعدتك في إنشاء أول سيرة ذاتية متوافقة.\n\nمرحباً بك مجدداً وتمنياتنا لك بالتوفيق،\nمؤسس GermanJobsPro\nhttps://www.germanjobspro.com`,
      };

    case "power_user":
      if (lang === "fr") {
        return {
          subject: "Merci pour votre fidélité sur GermanJobsPro — Votre avis nous intéresse ! 🇩🇪",
          body: `Bonjour ${userName},\n\nNous constatons votre utilisation active de nos outils pour votre candidature en Allemagne (${activityDesc}).\n\nVotre avis est précieux pour nous : comment se déroulent vos candidatures ? Avez-vous des suggestions d'améliorations ou des besoins pour vos prochains entretiens ?\n\nRépondez simplement à cet email, nous lisons chaque retour avec attention.\n\nMerci de votre confiance,\nL'équipe GermanJobsPro`,
        };
      }
      if (lang === "en") {
        return {
          subject: "Thank you for being a power user of GermanJobsPro — We'd love your feedback! 🇩🇪",
          body: `Hello ${userName},\n\nWe noticed your extensive activity on GermanJobsPro (${activityDesc}) and wanted to reach out personally.\n\nHow is your application journey going? Do you have any feedback or features you would love to see to help you in your interviews or visa process?\n\nFeel free to reply directly to this email.\n\nThank you for your trust and best of luck!\nGermanJobsPro Team`,
        };
      }
      return {
        subject: "شكراً لاستخدامك المكثف لـ GermanJobsPro — رأيك يهمنا جداً 🇩🇪",
        body: `مرحباً ${userName}،\n\nنتابع بفخر نشاطك المميز على المنصة واستخدامك لمختلف أدوات تجهيز ملفات التقديم في ألمانيا (${activityDesc}).\n\nنسعى دائماً لتطوير المنصة لخدمتكم بأفضل صورة؛ كيف تسير تقديماتك مع أصحاب العمل الألمان؟ وهل لديك أي اقتراح لميزات إضافية تفيدك في مرحلة المقابلات أو التأشيرة؟\n\nإذا كانت تجربتك إيجابية، سيسعدنا أيضاً سماع رأيك. شكراً جزيلاً لثقتك بنا وبالتوفيق الدائم!\n\nفريق GermanJobsPro\nhttps://www.germanjobspro.com`,
      };
  }
}

function detectBestTemplate(user: UserItem): OutreachTemplateKey {
  if (user.activity?.isHotLead) return "hot_lead";
  const cvs = user.activity?.cvCount ?? user._count?.cvs ?? 0;
  const ats = user.activity?.atsRuns ?? 0;
  const dossier = user.activity?.dossierRuns ?? 0;
  const isPaid = user.plan === "PRO" || user.plan === "SPRINT";

  if (isPaid || cvs >= 3 || ats >= 3) return "power_user";
  if (cvs > 0 && ats === 0 && dossier === 0) return "cv_no_ats";
  if (!user.activity?.hasUsedAnyTool) return "new_signup";
  return "hot_lead";
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
  const [planFilter, setPlanFilter] = useState<FilterType>("ALL");
  const [sortBy, setSortBy] = useState<SortType>("newest");
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

  // Smart Contextual Outreach Modal State
  const [selectedUserForEmail, setSelectedUserForEmail] = useState<UserItem | null>(null);
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [emailMessage, setEmailMessage] = useState<string>("");
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);
  const [activeTemplate, setActiveTemplate] = useState<OutreachTemplateKey>("hot_lead");
  const [activeLang, setActiveLang] = useState<OutreachLanguage>("ar");
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

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
        data.stats
          ? {
              ...data.stats,
              activitySummary: data.activitySummary,
            }
          : {
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

  const handleOpenEmailModal = (user: UserItem) => {
    setSelectedUserForEmail(user);
    const bestTemplate = detectBestTemplate(user);
    setActiveTemplate(bestTemplate);
    const initialLang: OutreachLanguage = "ar";
    setActiveLang(initialLang);
    const content = buildOutreachContent(bestTemplate, initialLang, user);
    setEmailSubject(content.subject);
    setEmailMessage(content.body);
  };

  const handleSwitchTemplate = (template: OutreachTemplateKey) => {
    if (!selectedUserForEmail) return;
    setActiveTemplate(template);
    const content = buildOutreachContent(template, activeLang, selectedUserForEmail);
    setEmailSubject(content.subject);
    setEmailMessage(content.body);
  };

  const handleSwitchLang = (lang: OutreachLanguage) => {
    if (!selectedUserForEmail) return;
    setActiveLang(lang);
    const content = buildOutreachContent(activeTemplate, lang, selectedUserForEmail);
    setEmailSubject(content.subject);
    setEmailMessage(content.body);
  };

  const handleCopyMessage = async () => {
    try {
      const fullText = `${isAr ? "الموضوع: " : "Subject: "}${emailSubject}\n\n${emailMessage}`;
      await navigator.clipboard.writeText(fullText);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    } catch (err) {
      console.error("Copy error:", err);
    }
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
    let hasAts = 0;
    let hasCv = 0;
    let hasDossier = 0;
    let inactive = 0;

    for (const u of users) {
      const isPaidActive =
        (u.plan === "PRO" || u.plan === "SPRINT") &&
        (!u.planExpiresAt || new Date(u.planExpiresAt) > new Date());

      if (u.plan === "PRO" && isPaidActive) pro++;
      if (u.plan === "SPRINT" && isPaidActive) sprint++;
      if (u.plan === "FREE") free++;
      if (u.plan === "TRIAL") trial++;

      const cvs = u.activity?.cvCount ?? u._count?.cvs ?? 0;
      const ats = u.activity?.atsRuns ?? 0;
      const dossier = u.activity?.dossierRuns ?? 0;
      const hasUsedAny = u.activity?.hasUsedAnyTool ?? (cvs > 0 || (u._count?.coverLetters ?? 0) > 0);

      if (u.activity?.isHotLead || (u.plan === "FREE" && (u.aiCredits <= 1) && (cvs > 0 || ats > 0 || dossier > 0))) {
        hotLeads++;
      }
      if (ats > 0) hasAts++;
      if (cvs > 0) hasCv++;
      if (dossier > 0) hasDossier++;
      if (!hasUsedAny) inactive++;
    }

    return { all, pro, sprint, free, trial, hotLeads, hasAts, hasCv, hasDossier, inactive };
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

      if (planFilter === "PRO") return u.plan === "PRO" && isPaidActive;
      if (planFilter === "SPRINT") return u.plan === "SPRINT" && isPaidActive;
      if (planFilter === "FREE") return u.plan === "FREE";
      if (planFilter === "TRIAL") return u.plan === "TRIAL";

      const cvs = u.activity?.cvCount ?? u._count?.cvs ?? 0;
      const ats = u.activity?.atsRuns ?? 0;
      const dossier = u.activity?.dossierRuns ?? 0;
      const hasUsedAny = u.activity?.hasUsedAnyTool ?? (cvs > 0 || (u._count?.coverLetters ?? 0) > 0);

      if (planFilter === "HOT_LEADS") {
        return Boolean(u.activity?.isHotLead || (u.plan === "FREE" && (u.aiCredits <= 1) && (cvs > 0 || ats > 0 || dossier > 0)));
      }
      if (planFilter === "HAS_ATS") return ats > 0;
      if (planFilter === "HAS_CV") return cvs > 0;
      if (planFilter === "HAS_DOSSIER") return dossier > 0;
      if (planFilter === "INACTIVE") return !hasUsedAny;

      return true;
    });

    list.sort((a, b) => {
      if (sortBy === "newest_active") {
        const dateA = new Date(a.activity?.lastActiveAt || a.createdAt).getTime();
        const dateB = new Date(b.activity?.lastActiveAt || b.createdAt).getTime();
        return dateB - dateA;
      }
      if (sortBy === "most_used") {
        const totalA =
          (a.activity?.atsRuns ?? 0) +
          (a.activity?.dossierRuns ?? 0) +
          (a.activity?.cvCount ?? a._count?.cvs ?? 0) +
          (a.activity?.coverLetterCount ?? a._count?.coverLetters ?? 0) +
          (a.activity?.aiAssistRuns ?? 0);
        const totalB =
          (b.activity?.atsRuns ?? 0) +
          (b.activity?.dossierRuns ?? 0) +
          (b.activity?.cvCount ?? b._count?.cvs ?? 0) +
          (b.activity?.coverLetterCount ?? b._count?.coverLetters ?? 0) +
          (b.activity?.aiAssistRuns ?? 0);
        return totalB - totalA;
      }
      if (sortBy === "most_docs") {
        const docsA = (a._count?.cvs || 0) + (a._count?.coverLetters || 0);
        const docsB = (b._count?.cvs || 0) + (b._count?.coverLetters || 0);
        return docsB - docsA;
      }
      if (sortBy === "lowest_credits") {
        return a.aiCredits - b.aiCredits;
      }
      // default: newest joined
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
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isAr ? "قاعدة بيانات حية" : "Live DB"}</span>
              </div>
              <span className="font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {stats.totalUsers > 0
                  ? Math.round(
                      ((stats.activitySummary?.activatedUsersCount ??
                        users.filter((u) => u.activity?.hasUsedAnyTool).length) /
                        stats.totalUsers) *
                        100
                    )
                  : 0}
                % {isAr ? "مفعّلون" : "activated"}
              </span>
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
            <div className="mt-3 text-[11px] space-y-1">
              <div className="text-slate-300 font-medium truncate">
                {isAr
                  ? `📄 ${stats.totalCvs ?? 0} سيرة ذاتية • ✉️ ${stats.totalCoverLetters ?? 0} خطاب دافع`
                  : `📄 ${stats.totalCvs ?? 0} CVs • ✉️ ${stats.totalCoverLetters ?? 0} CLs`}
              </div>
              <div className="text-slate-400 truncate flex items-center gap-2">
                <span className="text-violet-400 font-semibold">
                  🎯 {stats.activitySummary?.totalAtsRuns ?? 0} {isAr ? "تحليل ATS" : "ATS"}
                </span>
                <span>•</span>
                <span className="text-teal-400 font-semibold">
                  📁 {stats.activitySummary?.totalDossierRuns ?? 0} {isAr ? "ملف ترشح" : "Dossiers"}
                </span>
              </div>
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

            {/* Smart Sorting Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 shrink-0">
              <span className="text-xs text-slate-400 font-semibold">
                {isAr ? "ترتيب:" : "Sort:"}
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="newest_active" className="bg-slate-900 text-white">
                  {isAr ? "⚡ الأحدث نشاطاً" : "⚡ Recently Active"}
                </option>
                <option value="most_used" className="bg-slate-900 text-white">
                  {isAr ? "🔥 الأكثر استخداماً" : "🔥 Most Active Usage"}
                </option>
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
          </div>

          {/* Filter Pills: Row 1 (Plans & Hot Leads) & Row 2 (Behavioral CRM) */}
          <div className="space-y-2 pt-2 border-t border-slate-800/40">
            {/* Row 1: Plan & Intent Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 ml-1">
                {isAr ? "الخطة:" : "Plan:"}
              </span>
              {[
                { id: "ALL" as FilterType, label: isAr ? `الكل (${filterCounts.all})` : `All (${filterCounts.all})` },
                { id: "PRO" as FilterType, label: `PRO ⭐ (${filterCounts.pro})` },
                { id: "SPRINT" as FilterType, label: `⚡ SPRINT (${filterCounts.sprint})` },
                { id: "FREE" as FilterType, label: isAr ? `مجاني (${filterCounts.free})` : `Free (${filterCounts.free})` },
                { id: "TRIAL" as FilterType, label: isAr ? `تجريبي (${filterCounts.trial})` : `Trial (${filterCounts.trial})` },
                { id: "HOT_LEADS" as FilterType, label: isAr ? `🔥 عملاء محتملون (${filterCounts.hotLeads})` : `🔥 Hot Leads (${filterCounts.hotLeads})` },
              ].map((f) => {
                const isActive = planFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setPlanFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? f.id === "HOT_LEADS"
                          ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 border border-amber-400 font-extrabold"
                          : "bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-500"
                        : f.id === "HOT_LEADS"
                        ? "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30"
                        : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Row 2: Behavioral CRM Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 ml-1">
                {isAr ? "السلوك:" : "Behavior:"}
              </span>
              {[
                { id: "HAS_ATS" as FilterType, label: isAr ? `🎯 فحصوا ATS (${filterCounts.hasAts})` : `🎯 ATS Checked (${filterCounts.hasAts})` },
                { id: "HAS_CV" as FilterType, label: isAr ? `📄 أنشأوا CV (${filterCounts.hasCv})` : `📄 Created CV (${filterCounts.hasCv})` },
                { id: "HAS_DOSSIER" as FilterType, label: isAr ? `📁 أنشأوا ملف ترشح (${filterCounts.hasDossier})` : `📁 Dossier Built (${filterCounts.hasDossier})` },
                { id: "INACTIVE" as FilterType, label: isAr ? `💤 لم يبدؤوا بعد (${filterCounts.inactive})` : `💤 Inactive (${filterCounts.inactive})` },
              ].map((f) => {
                const isActive = planFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setPlanFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-500"
                        : "bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <span>{f.label}</span>
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
                    <th className="py-4 px-6">{isAr ? "مسار المستخدم (النشاط)" : "User Journey & Activity"}</th>
                    <th className="py-4 px-6">{isAr ? "تاريخ التسجيل والنشاط" : "Joined & Activity"}</th>
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
                                {user.activity?.isHotLead && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold animate-pulse inline-flex items-center gap-1">
                                    <span>🔥</span>
                                    <span>Hot Lead</span>
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
                                <bdi dir="ltr" className="text-xs text-slate-400 font-mono truncate">
                                  {user.email}
                                </bdi>
                                
                                {/* Smart Outreach Trigger */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEmailModal(user)}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:underline transition cursor-pointer"
                                  title="فتح نافذة التواصل الذكي وإرسال رسالة مخصصة لهذا المستخدم"
                                >
                                  <span>💬</span>
                                  <span>{isAr ? "تواصل ذكي" : "Smart Outreach"}</span>
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
                            <bdi dir="ltr">{user.aiCredits}</bdi>
                            <span className="text-[10px] text-blue-400/70 font-sans">{isAr ? "رصيد" : "credits"}</span>
                          </div>
                        </td>

                        {/* 4-Step User Journey Matrix (CV, ATS, CL, Dossier) */}
                        <td className="py-4 px-6">
                          <button
                            type="button"
                            onClick={() => setSelectedUserForDossier(user)}
                            className="flex items-center gap-1.5 flex-wrap text-xs cursor-pointer group"
                            title={isAr ? "اضغط لمعاينة تفاصيل الملفات والأنشطة لهذا المستخدم" : "Click to inspect user dossier & documents"}
                          >
                            {/* CV (n) */}
                            {(() => {
                              const cvCount = user.activity?.cvCount ?? user._count?.cvs ?? 0;
                              return (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono text-[11px] font-semibold transition border ${
                                    cvCount > 0
                                      ? "bg-blue-500/15 text-blue-300 border-blue-500/30 group-hover:border-blue-400/60"
                                      : "bg-slate-950/60 text-slate-500 border-slate-800/80"
                                  }`}
                                >
                                  <span>📄</span>
                                  <span>CV</span>
                                  <bdi dir="ltr">({cvCount})</bdi>
                                </span>
                              );
                            })()}

                            {/* ATS (n) */}
                            {(() => {
                              const atsCount = user.activity?.atsRuns ?? 0;
                              return (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono text-[11px] font-semibold transition border ${
                                    atsCount > 0
                                      ? "bg-violet-500/15 text-violet-300 border-violet-500/30 group-hover:border-violet-400/60"
                                      : "bg-slate-950/60 text-slate-500 border-slate-800/80"
                                  }`}
                                >
                                  <span>🎯</span>
                                  <span>ATS</span>
                                  <bdi dir="ltr">({atsCount})</bdi>
                                </span>
                              );
                            })()}

                            {/* CL (n) */}
                            {(() => {
                              const clCount = user.activity?.coverLetterCount ?? user._count?.coverLetters ?? 0;
                              return (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono text-[11px] font-semibold transition border ${
                                    clCount > 0
                                      ? "bg-amber-500/15 text-amber-300 border-amber-500/30 group-hover:border-amber-400/60"
                                      : "bg-slate-950/60 text-slate-500 border-slate-800/80"
                                  }`}
                                >
                                  <span>✉️</span>
                                  <span>CL</span>
                                  <bdi dir="ltr">({clCount})</bdi>
                                </span>
                              );
                            })()}

                            {/* Dossier (n) */}
                            {(() => {
                              const dossierCount = user.activity?.dossierRuns ?? 0;
                              return (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono text-[11px] font-semibold transition border ${
                                    dossierCount > 0
                                      ? "bg-teal-500/15 text-teal-300 border-teal-500/30 group-hover:border-teal-400/60"
                                      : "bg-slate-950/60 text-slate-500 border-slate-800/80"
                                  }`}
                                >
                                  <span>📁</span>
                                  <span>Dossier</span>
                                  <bdi dir="ltr">({dossierCount})</bdi>
                                </span>
                              );
                            })()}
                          </button>
                        </td>

                        {/* Joined Date & Relative Last Active */}
                        <td className="py-4 px-6 text-xs text-slate-400">
                          <div className="space-y-1">
                            <div className="font-mono text-slate-300">
                              <bdi dir="ltr">{formattedDate}</bdi>
                            </div>
                            {user.activity?.lastActiveAt && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                <span>⚡</span>
                                <span>{formatTimeAgo(user.activity.lastActiveAt, isAr)}</span>
                              </div>
                            )}
                          </div>
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

      {/* MODAL 2: SMART CONTEXTUAL OUTREACH MODAL (BEHAVIORAL CRM) */}
      {selectedUserForEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-5 text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <span>💬</span>
                  <span>{isAr ? "التواصل الذكي مع المستخدم (Outreach CRM)" : "Smart Outreach CRM"}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? "المستلم: " : "Recipient: "}
                  <span className="text-slate-200 font-semibold">{selectedUserForEmail.name || (isAr ? "بدون اسم" : "Unnamed")}</span>
                  {" "}
                  <bdi dir="ltr" className="text-slate-400 font-mono">({selectedUserForEmail.email})</bdi>
                </p>
              </div>

              <button
                onClick={() => setSelectedUserForEmail(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Behavioral Activity Summary Banner */}
            {(() => {
              const cvs = selectedUserForEmail.activity?.cvCount ?? selectedUserForEmail._count?.cvs ?? 0;
              const ats = selectedUserForEmail.activity?.atsRuns ?? 0;
              const cls = selectedUserForEmail.activity?.coverLetterCount ?? selectedUserForEmail._count?.coverLetters ?? 0;
              const dossiers = selectedUserForEmail.activity?.dossierRuns ?? 0;
              const credits = selectedUserForEmail.aiCredits;
              const plan = selectedUserForEmail.plan;

              return (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-slate-400">
                      {isAr ? "سجل نشاط المستخدم في المنصة:" : "User Platform Summary:"}
                    </div>
                    <div className="text-slate-200 font-medium flex items-center gap-2 flex-wrap">
                      <span className="text-blue-300 font-mono">📄 {cvs} CV</span>
                      <span>•</span>
                      <span className="text-violet-300 font-mono">🎯 {ats} ATS</span>
                      <span>•</span>
                      <span className="text-amber-300 font-mono">✉️ {cls} CL</span>
                      <span>•</span>
                      <span className="text-teal-300 font-mono">📁 {dossiers} Dossier</span>
                      <span>•</span>
                      <span className="text-cyan-300 font-mono">⚡ {credits} {isAr ? "رصيد" : "credits"}</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                        {plan}
                      </span>
                    </div>
                  </div>
                  {selectedUserForEmail.activity?.isHotLead && (
                    <div className="shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold animate-pulse inline-flex items-center gap-1">
                        <span>🔥</span>
                        <span>Hot Lead</span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Language Switcher */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs font-bold text-slate-300">
                {isAr ? "لغة الرسالة:" : "Message Language:"}
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[
                  { id: "ar" as OutreachLanguage, label: "العربية" },
                  { id: "fr" as OutreachLanguage, label: "Français" },
                  { id: "en" as OutreachLanguage, label: "English" },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => handleSwitchLang(lang.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeLang === lang.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Contextual Templates Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">
                  {isAr ? "⚡ اختيار القالب الذكي المخصص:" : "⚡ Personalized Outreach Templates:"}
                </label>
                <span className="text-[11px] text-slate-500">
                  {isAr ? "تم تحديد الأنسب تلقائياً" : "Auto-detected based on activity"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    key: "hot_lead" as OutreachTemplateKey,
                    icon: "🔥",
                    title: isAr ? "عميل محتمل (استنفد الرصيد)" : "Hot Lead (0 credits left)",
                    desc: isAr ? "عرض ترقية وخصم 40% لإتمام التقديم" : "Special discount & bonus credits",
                  },
                  {
                    key: "cv_no_ats" as OutreachTemplateKey,
                    icon: "🎯",
                    title: isAr ? "أنشأ CV بدون فحص ATS" : "Created CV, No ATS Yet",
                    desc: isAr ? "دعوة لفحص DIN 5008 وإنشاء ملف ترشح" : "Invite to DIN 5008 & Dossier",
                  },
                  {
                    key: "new_signup" as OutreachTemplateKey,
                    icon: "👋",
                    title: isAr ? "مستخدم جديد لم يبدأ بعد" : "New / Inactive Signup",
                    desc: isAr ? "ترحيب ودليل سريع لإنشاء أول CV ألماني" : "Welcome & quick onboarding guide",
                  },
                  {
                    key: "power_user" as OutreachTemplateKey,
                    icon: "⭐",
                    title: isAr ? "مستخدم نشط (ملف ترشح جاهز)" : "Power User (Dossier Ready)",
                    desc: isAr ? "متابعة التقديم على وكالة العمل BA" : "Follow-up on BA German jobs",
                  },
                ].map((tpl) => {
                  const isSelected = activeTemplate === tpl.key;
                  const isRecommended = detectBestTemplate(selectedUserForEmail) === tpl.key;
                  return (
                    <button
                      key={tpl.key}
                      type="button"
                      onClick={() => handleSwitchTemplate(tpl.key)}
                      className={`p-3 rounded-2xl border text-right transition cursor-pointer flex items-start gap-2.5 ${
                        isSelected
                          ? "bg-blue-600/15 border-blue-500 text-white shadow-md shadow-blue-500/10"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      <span className="text-base shrink-0">{tpl.icon}</span>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-bold truncate ${isSelected ? "text-blue-300" : "text-slate-200"}`}>
                            {tpl.title}
                          </span>
                          {isRecommended && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold shrink-0">
                              {isAr ? "مقترح" : "Suggested"}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{tpl.desc}</p>
                      </div>
                    </button>
                  );
                })}
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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 block">
                    {isAr ? "نص الرسالة (Message Content):" : "Message Body:"}
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {isAr ? "يمكنك التعديل بحرية قبل الإرسال" : "Editable before sending"}
                  </span>
                </div>
                <textarea
                  rows={8}
                  required
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-blue-500 font-sans resize-y"
                />
              </div>

              {/* Outreach Dispatch Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Copy Message button */}
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="نسخ الموضوع والنص إلى الحافظة"
                  >
                    <span>{copiedToast ? "✓" : "📋"}</span>
                    <span>
                      {copiedToast
                        ? (isAr ? "تم النسخ بنجاح!" : "Copied!")
                        : (isAr ? "نسخ الرسالة" : "Copy Message")}
                    </span>
                  </button>

                  {/* Mailto button */}
                  <a
                    href={`mailto:${selectedUserForEmail.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMessage)}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="فتح في تطبيق البريد الخاص بك (Gmail/Outlook/Apple Mail)"
                  >
                    <span>✉️</span>
                    <span>{isAr ? "فتح في البريد (mailto)" : "Open in Mail Client"}</span>
                  </a>
                </div>

                <div className="flex items-center gap-2 justify-end">
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
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-blue-600/30"
                  >
                    {sendingEmail ? (
                      <>
                        <span className="animate-spin text-xs">⏳</span>
                        <span>{isAr ? "جاري الإرسال عبر Resend..." : "Sending..."}</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>{isAr ? "إرسال الآن عبر Resend" : "Send via Resend"}</span>
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
