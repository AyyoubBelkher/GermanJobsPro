"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FullCvData } from "./CvEditorClient";
import { ProposedCvData, InterviewStep } from "@/lib/gemini";

interface MessageItem {
  id: string;
  role: "assistant" | "user";
  content: string;
  proposedData?: ProposedCvData | null;
  actions?: string[];
  applied?: boolean;
}

interface CvAiCopilotProps {
  cv: FullCvData;
  onUpdateCv: (updatedCv: FullCvData) => void;
  onClose: () => void;
  isOpen: boolean;
  locale?: string;
  onNavigateTab?: (tabId: string) => void;
}

const STEPS_ORDER: { key: InterviewStep; labelAr: string; labelEn: string; tab: string }[] = [
  { key: "targetJob", labelAr: "المسمى الوظيفي", labelEn: "Target Job", tab: "personal" },
  { key: "personalInfo", labelAr: "البيانات الشخصية", labelEn: "Personal Info", tab: "personal" },
  { key: "experience", labelAr: "الخبرات المهنية", labelEn: "Experience", tab: "experience" },
  { key: "education", labelAr: "التعليم والدبلومات", labelEn: "Education", tab: "education" },
  { key: "skills", labelAr: "المهارات واللغات", labelEn: "Skills & Langs", tab: "skills" },
  { key: "summary", labelAr: "النبذة المهنية", labelEn: "Kurzprofil", tab: "personal" },
];

const STEP_PLACEHOLDERS: Record<string, { ar: string; en: string }> = {
  targetJob: {
    ar: "مثلاً: باغي نخدم Full-Stack Developer أو ممرض في ألمانيا...",
    en: "e.g. Looking for a Full-Stack Developer role in Germany...",
  },
  personalInfo: {
    ar: "مثلاً: رقم الهاتف مع الرمز، العنوان، تاريخ ومكان الازدياد، الجنسية...",
    en: "e.g. Phone number, address, date and place of birth, nationality...",
  },
  experience: {
    ar: "مثلاً: خدمت فريلانس وطورت تطبيقات بـ Next.js ونظم أتمتة بـ n8n...",
    en: "e.g. Worked as freelance developer building Next.js apps & n8n automations...",
  },
  education: {
    ar: "مثلاً: عندي دبلوم تقني متخصص DTS في تطوير البرمجيات من معهد OFPPT...",
    en: "e.g. State certified diploma in Software Development...",
  },
  skills: {
    ar: "مثلاً: اللغات (ألمانية A2، إنجليزية B2)، والمهارات (React, TypeScript, Docker)...",
    en: "e.g. Languages (German A2, English B2) & tech stack (React, Docker)...",
  },
  summary: {
    ar: "مثلاً: لخص لي نبذة مهنية قوية تبرز سرعتي في الأتمتة وحل المشكلات...",
    en: "e.g. Write a compelling summary highlighting my automation & engineering skills...",
  },
  initial: {
    ar: "اكتب هنا بالدارجة أو العربية (مثلاً: عندي دبلوم تقني وخبرة عامين في فندق...)",
    en: "Type in your experience or answers...",
  },
};

export default function CvAiCopilot({
  cv,
  onUpdateCv,
  onClose,
  isOpen,
  locale = "ar",
  onNavigateTab,
}: CvAiCopilotProps) {
  const isAr = locale === "ar";
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [currentStep, setCurrentStep] = useState<InterviewStep>("targetJob");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [editingMap, setEditingMap] = useState<Record<string, boolean>>({});
  const [editedPreviews, setEditedPreviews] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);
  const idCounterRef = useRef(0);

  const getNextId = (prefix = "msg") => {
    idCounterRef.current += 1;
    return `${prefix}-${idCounterRef.current}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const sendInitialGreeting = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setLastFailedMessage(null);

    try {
      const res = await fetch("/api/ai/cv-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentCvData: cv,
          currentStep: "initial",
          locale,
          history: [],
        }),
      });

      const data = await res.json().catch(() => null);
      if (!data || !data.success) {
        throw new Error(
          data?.error ||
            "الخدمة تواجه ضغطاً مؤقتاً، يمكنك إعادة المحاولة بعد بضع ثوانٍ"
        );
      }

      setMessages([
        {
          id: getNextId("init"),
          role: "assistant",
          content: data.message,
          proposedData: data.proposedData,
          actions: data.actions,
        },
      ]);
      if (data.nextStep) {
        setCurrentStep(data.nextStep);
      }
    } catch (err: unknown) {
      console.error("[Copilot Init Error]:", err);
      const errMsg =
        err instanceof Error && !err.message.includes("{")
          ? err.message
          : "الخدمة تواجه ضغطاً مؤقتاً، يمكنك إعادة المحاولة بعد بضع ثوانٍ";
      setErrorMsg(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [cv, locale]);

  // Initial greeting from AI Consultant on first open
  useEffect(() => {
    if (isOpen && !initializedRef.current && messages.length === 0) {
      initializedRef.current = true;
      sendInitialGreeting();
    }
  }, [isOpen, messages.length, sendInitialGreeting]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage("");
    setErrorMsg(null);
    setLastFailedMessage(null);

    const userMsgId = getNextId("user");
    const newMessages: MessageItem[] = [
      ...messages,
      { id: userMsgId, role: "user", content: text },
    ];
    setMessages(newMessages);

    setIsLoading(true);

    try {
      const historyPayload = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/cv-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentCvData: cv,
          userMessage: text,
          currentStep,
          locale,
          history: historyPayload,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!data || !data.success) {
        throw new Error(
          data?.error ||
            "الخدمة تواجه ضغطاً مؤقتاً، يمكنك إعادة المحاولة بعد بضع ثوانٍ"
        );
      }

      const assistantMsgId = getNextId("ai");
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "assistant",
          content: data.message,
          proposedData: data.proposedData,
          actions: data.actions,
        },
      ]);

      if (data.nextStep) {
        setCurrentStep(data.nextStep);
        const matchingStep = STEPS_ORDER.find((s) => s.key === data.nextStep);
        if (matchingStep && onNavigateTab) {
          onNavigateTab(matchingStep.tab);
        }
      }
    } catch (err: unknown) {
      console.error("[Copilot Message Error]:", err);
      setLastFailedMessage(text);
      const errMsg =
        err instanceof Error && !err.message.includes("{")
          ? err.message
          : "الخدمة تواجه ضغطاً مؤقتاً، يمكنك إعادة المحاولة بعد بضع ثوانٍ";
      setErrorMsg(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Direct Apply to CV state
  const handleApplyProposedData = (msgId: string, proposal: ProposedCvData) => {
    const currentPreviewText = (
      editedPreviews[msgId] !== undefined ? editedPreviews[msgId] : proposal.germanPreview
    ).trim();

    const nextCv: FullCvData = { ...cv };
    const pData = proposal.data || {};
    const section = proposal.section;

    // 1. Merge Personal Info
    if (section === "targetJob") {
      nextCv.personalInfo = {
        fullName: nextCv.personalInfo?.fullName || "",
        email: nextCv.personalInfo?.email || "",
        phone: nextCv.personalInfo?.phone || null,
        address: nextCv.personalInfo?.address || null,
        birthDate: nextCv.personalInfo?.birthDate || null,
        birthPlace: nextCv.personalInfo?.birthPlace || null,
        nationality: nextCv.personalInfo?.nationality || null,
        targetJobTitle: currentPreviewText || pData.personalInfo?.targetJobTitle || nextCv.personalInfo?.targetJobTitle || null,
        linkedinUrl: nextCv.personalInfo?.linkedinUrl || null,
        xingUrl: nextCv.personalInfo?.xingUrl || null,
        summary: nextCv.personalInfo?.summary || null,
      };
    } else if (section === "summary") {
      nextCv.personalInfo = {
        fullName: nextCv.personalInfo?.fullName || "",
        email: nextCv.personalInfo?.email || "",
        phone: nextCv.personalInfo?.phone || null,
        address: nextCv.personalInfo?.address || null,
        birthDate: nextCv.personalInfo?.birthDate || null,
        birthPlace: nextCv.personalInfo?.birthPlace || null,
        nationality: nextCv.personalInfo?.nationality || null,
        targetJobTitle: nextCv.personalInfo?.targetJobTitle || null,
        linkedinUrl: nextCv.personalInfo?.linkedinUrl || null,
        xingUrl: nextCv.personalInfo?.xingUrl || null,
        summary: currentPreviewText || pData.personalInfo?.summary || nextCv.personalInfo?.summary || null,
      };
    } else if (pData.personalInfo) {
      nextCv.personalInfo = {
        fullName: pData.personalInfo.fullName || nextCv.personalInfo?.fullName || "",
        email: pData.personalInfo.email || nextCv.personalInfo?.email || "",
        phone: pData.personalInfo.phone || nextCv.personalInfo?.phone || null,
        address: pData.personalInfo.address || nextCv.personalInfo?.address || null,
        birthDate: pData.personalInfo.birthDate || nextCv.personalInfo?.birthDate || null,
        birthPlace: pData.personalInfo.birthPlace || nextCv.personalInfo?.birthPlace || null,
        nationality: pData.personalInfo.nationality || nextCv.personalInfo?.nationality || null,
        targetJobTitle: pData.personalInfo.targetJobTitle || nextCv.personalInfo?.targetJobTitle || null,
        linkedinUrl: pData.personalInfo.linkedinUrl || nextCv.personalInfo?.linkedinUrl || null,
        xingUrl: pData.personalInfo.xingUrl || nextCv.personalInfo?.xingUrl || null,
        summary: pData.personalInfo.summary || nextCv.personalInfo?.summary || null,
      };
    }

    // 2. Append/Merge Experiences without duplication and re-index order
    if (pData.experiences && pData.experiences.length > 0) {
      const updatedExperiences = [...nextCv.experiences];

      pData.experiences.forEach((newExp, idx) => {
        const expDesc =
          idx === 0 && currentPreviewText && currentPreviewText.includes("•")
            ? currentPreviewText
            : newExp.description;

        const existingIdx = updatedExperiences.findIndex(
          (e) =>
            e.company.trim().toLowerCase() === newExp.company.trim().toLowerCase() &&
            e.position.trim().toLowerCase() === newExp.position.trim().toLowerCase()
        );

        if (existingIdx >= 0) {
          updatedExperiences[existingIdx] = {
            ...updatedExperiences[existingIdx],
            city: newExp.city || updatedExperiences[existingIdx].city,
            country: newExp.country || updatedExperiences[existingIdx].country,
            startDate: newExp.startDate || updatedExperiences[existingIdx].startDate,
            endDate: newExp.endDate !== undefined ? newExp.endDate : updatedExperiences[existingIdx].endDate,
            isCurrent: newExp.isCurrent !== undefined ? newExp.isCurrent : updatedExperiences[existingIdx].isCurrent,
            description: expDesc || updatedExperiences[existingIdx].description,
          };
        } else {
          updatedExperiences.unshift({
            company: newExp.company,
            position: newExp.position,
            city: newExp.city || null,
            country: newExp.country || "Germany",
            startDate: newExp.startDate || new Date().toISOString(),
            endDate: newExp.endDate || null,
            isCurrent: newExp.isCurrent || false,
            description: expDesc || null,
            order: 0,
          });
        }
      });

      nextCv.experiences = updatedExperiences.map((exp, idx) => ({
        ...exp,
        order: idx,
      }));
    }

    // 3. Append/Merge Educations without duplication and re-index order
    if (pData.educations && pData.educations.length > 0) {
      const updatedEducations = [...nextCv.educations];

      pData.educations.forEach((newEdu) => {
        const existingIdx = updatedEducations.findIndex(
          (e) =>
            e.institution.trim().toLowerCase() === newEdu.institution.trim().toLowerCase() &&
            e.degree.trim().toLowerCase() === newEdu.degree.trim().toLowerCase()
        );

        if (existingIdx >= 0) {
          updatedEducations[existingIdx] = {
            ...updatedEducations[existingIdx],
            fieldOfStudy: newEdu.fieldOfStudy || updatedEducations[existingIdx].fieldOfStudy,
            city: newEdu.city || updatedEducations[existingIdx].city,
            country: newEdu.country || updatedEducations[existingIdx].country,
            startDate: newEdu.startDate || updatedEducations[existingIdx].startDate,
            endDate: newEdu.endDate !== undefined ? newEdu.endDate : updatedEducations[existingIdx].endDate,
            isCurrent: newEdu.isCurrent !== undefined ? newEdu.isCurrent : updatedEducations[existingIdx].isCurrent,
            grade: newEdu.grade || updatedEducations[existingIdx].grade,
            description: newEdu.description || updatedEducations[existingIdx].description,
          };
        } else {
          updatedEducations.unshift({
            institution: newEdu.institution,
            degree: newEdu.degree,
            fieldOfStudy: newEdu.fieldOfStudy || null,
            city: newEdu.city || null,
            country: newEdu.country || "Germany",
            startDate: newEdu.startDate || new Date().toISOString(),
            endDate: newEdu.endDate || null,
            isCurrent: newEdu.isCurrent || false,
            grade: newEdu.grade || null,
            description: newEdu.description || null,
            order: 0,
          });
        }
      });

      nextCv.educations = updatedEducations.map((edu, idx) => ({
        ...edu,
        order: idx,
      }));
    }

    // 4. Append/Merge Skills and re-index order
    if (pData.skills && pData.skills.length > 0) {
      const existingNames = new Set(nextCv.skills.map((s) => s.name.toLowerCase()));
      const filtered = pData.skills
        .filter((s) => !existingNames.has(s.name.toLowerCase()))
        .map((s) => ({
          name: s.name,
          category: s.category || "Tech",
          level: s.level || "Fortgeschritten",
          order: 0,
        }));
      nextCv.skills = [...nextCv.skills, ...filtered].map((s, idx) => ({
        ...s,
        order: idx,
      }));
    }

    // 5. Append/Merge Languages and re-index order
    if (pData.languages && pData.languages.length > 0) {
      const existingLangs = new Set(nextCv.languages.map((l) => l.language.toLowerCase()));
      const filtered = pData.languages
        .filter((l) => !existingLangs.has(l.language.toLowerCase()))
        .map((l) => ({
          language: l.language,
          proficiency: l.proficiency || "B2 (Fließend in Wort und Schrift)",
          order: 0,
        }));
      nextCv.languages = [...nextCv.languages, ...filtered].map((l, idx) => ({
        ...l,
        order: idx,
      }));
    }

    onUpdateCv(nextCv);

    // Close editing mode for this proposal
    setEditingMap((prev) => ({ ...prev, [msgId]: false }));

    // Mark message as applied and update proposal preview
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              applied: true,
              proposedData: m.proposedData
                ? { ...m.proposedData, germanPreview: currentPreviewText }
                : null,
            }
          : m
      )
    );

    // Advance to next step and navigate tab reliably even if offline or rate-limited
    const nextIdx = STEPS_ORDER.findIndex((s) => s.key === currentStep);
    if (nextIdx >= 0 && nextIdx < STEPS_ORDER.length - 1) {
      const nextStepObj = STEPS_ORDER[nextIdx + 1];
      setCurrentStep(nextStepObj.key);
      if (onNavigateTab) onNavigateTab(nextStepObj.tab);
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[540px] bg-slate-950/95 border-l border-slate-800 shadow-2xl backdrop-blur-2xl flex flex-col transition-all duration-300 ease-out"
      aria-label="AI CV Copilot"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-500 text-white flex items-center justify-center text-lg shadow-lg shadow-blue-600/30">
            🤖
          </div>
          <div>
            <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
              <span>{isAr ? "مستشارك المهني الذكي" : "German Career Copilot"}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                DIN 5008
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {isAr ? "تحدث بالدارجة أو العربية، وسنحولها إلى ألمانية احترافية" : "Interactive German Career Consultant"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title={isAr ? "إغلاق المساعد" : "Close Copilot"}
        >
          ✕
        </button>
      </div>

      {/* Progress Step Bar */}
      <div className="px-4 py-2.5 bg-slate-900/40 border-b border-slate-800/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {STEPS_ORDER.map((s, idx) => {
          const isActive = currentStep === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                setCurrentStep(s.key);
                if (onNavigateTab) onNavigateTab(s.tab);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <span className="text-[10px] font-mono text-blue-300">#{idx + 1}</span>
              <span>{isAr ? s.labelAr : s.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Conversation Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.role === "user" ? "items-end" : "items-start"
            } space-y-2`}
          >
            {/* Message Bubble */}
            <div
              className={`max-w-[92%] sm:max-w-[88%] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20"
                  : "bg-slate-900/90 text-slate-200 border border-slate-800 rounded-bl-none shadow-md"
              }`}
            >
              <p className="whitespace-pre-line">{m.content}</p>
            </div>

            {/* Proposal Card (if AI suggested structured German data) */}
            {m.proposedData && (
              <div className="w-full max-w-[95%] p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-blue-500/30 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
                    <span>✨</span>
                    <span>{isAr ? "الترجمة والصياغة المقترحة بالألمانية:" : "Proposed German Data:"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const isCurrentlyEditing = !!editingMap[m.id];
                        setEditingMap((prev) => ({ ...prev, [m.id]: !isCurrentlyEditing }));
                        if (editedPreviews[m.id] === undefined && m.proposedData) {
                          setEditedPreviews((prev) => ({ ...prev, [m.id]: m.proposedData!.germanPreview }));
                        }
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                      title={isAr ? "تعديل النص المقترح يدوياً" : "Edit proposed text"}
                    >
                      <span>✏️</span>
                      <span>{editingMap[m.id] ? (isAr ? "معاينة" : "Preview") : (isAr ? "تعديل" : "Edit")}</span>
                    </button>

                    {m.applied && !editingMap[m.id] ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1">
                        <span>✓</span>
                        <span>{isAr ? "تم الاعتماد بالسيرة" : "Applied"}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">DIN 5008 Standard</span>
                    )}
                  </div>
                </div>

                {m.proposedData.explanationAr && (
                  <p className="text-xs text-slate-300">
                    💡 {m.proposedData.explanationAr}
                  </p>
                )}

                {/* German Mono Preview or Editable Textarea */}
                {editingMap[m.id] ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-blue-300">
                      <span>✏️ {isAr ? "تعديل النص الألماني مباشرة:" : "Edit German text directly:"}</span>
                      <span className="text-[10px] text-slate-400 font-mono">LTR German</span>
                    </div>
                    <textarea
                      dir="ltr"
                      rows={5}
                      value={
                        editedPreviews[m.id] !== undefined
                          ? editedPreviews[m.id]
                          : m.proposedData.germanPreview
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditedPreviews((prev) => ({ ...prev, [m.id]: val }));
                      }}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-blue-500/50 text-slate-100 font-mono text-xs leading-relaxed text-left focus:outline-hidden focus:border-blue-400 resize-y"
                      placeholder="Geben Sie hier den deutschen Text ein..."
                    />
                  </div>
                ) : (
                  <div
                    dir="ltr"
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs whitespace-pre-line leading-relaxed text-left max-h-48 overflow-y-auto"
                  >
                    {editedPreviews[m.id] !== undefined
                      ? editedPreviews[m.id]
                      : m.proposedData.germanPreview}
                  </div>
                )}

                {/* Apply / Save Button */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleApplyProposedData(m.id, m.proposedData!)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{editingMap[m.id] ? "💾" : "✅"}</span>
                    <span>
                      {editingMap[m.id]
                        ? isAr
                          ? "حفظ التعديل وتحديث السيرة"
                          : "Save & Apply to CV"
                        : m.applied
                        ? isAr
                          ? "إعادة الاعتماد في السيرة"
                          : "Re-apply to CV"
                        : isAr
                        ? "اعتمد في السيرة الذاتية الآن"
                        : "Apply to CV Now"}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Action Chips */}
            {m.actions && m.actions.length > 0 && !m.applied && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {m.actions.map((act, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(act)}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-blue-900/30 text-blue-300 hover:text-blue-100 border border-blue-500/20 hover:border-blue-500/40 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    {act}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-blue-300 text-xs flex items-center gap-2 shadow-md">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>{isAr ? "المستشار الذكي يحلل ويكتب بالألمانية..." : "Consultant is thinking..."}</span>
            </div>
          </div>
        )}

        {/* Sleek Friendly Error Banner with Retry */}
        {errorMsg && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-base shrink-0">⚠️</span>
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                if (lastFailedMessage) {
                  handleSendMessage(lastFailedMessage);
                } else {
                  sendInitialGreeting();
                }
              }}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              🔄 {isAr ? "إعادة المحاولة" : "Retry"}
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            rows={2}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              STEP_PLACEHOLDERS[currentStep]?.[isAr ? "ar" : "en"] ||
              STEP_PLACEHOLDERS.initial[isAr ? "ar" : "en"]
            }
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-blue-500 focus:outline-hidden resize-none leading-relaxed"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all disabled:opacity-40 cursor-pointer shrink-0"
            title={isAr ? "إرسال" : "Send"}
          >
            🚀
          </button>
        </form>
        <p className="text-[10px] text-slate-500 mt-2 text-center">
          {isAr
            ? "اضغط Enter للإرسال • يدعم الدارجة، العربية، الفرنسية، والإنجليزية"
            : "Press Enter to send"}
        </p>
      </div>
    </aside>
  );
}
