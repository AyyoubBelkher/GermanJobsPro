"use client";

import React, { useState } from "react";

export interface CommentItem {
  id: string;
  name: string;
  content: string;
  createdAt: string | Date;
}

interface CommentSectionProps {
  postId: string;
  initialComments: CommentItem[];
  locale: string;
}

export default function CommentSection({
  postId,
  initialComments,
  locale,
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const labels = {
    ar: {
      title: "التعليقات والمناقشة",
      subtitle: "هل لديك سؤال حول هذا الدرس أو ترغب في مشاركة رأيك؟ اكتب تعليقك هنا.",
      nameLabel: "الاسم الكامل",
      namePlaceholder: "مثال: أحمد مصطفى",
      emailLabel: "البريد الإلكتروني",
      emailPlaceholder: "name@example.com",
      emailNote: "لن يتم نشر بريدك الإلكتروني للعموم.",
      commentLabel: "تعليقك أو سؤالك",
      commentPlaceholder: "اكتب تعليقك، ملاحظتك، أو استفسارك هنا...",
      submitBtn: "إرسال التعليق",
      submittingBtn: "جاري الإرسال...",
      successMsg: "تم نشر تعليقك بنجاح! شكراً لمشاركتك.",
      errorGeneric: "حدث خطأ أثناء إرسال التعليق. الرجاء المحاولة مرة أخرى.",
      noComments: "لا توجد تعليقات حتى الآن. كن أول من يشارك بتعليق أو استفسار!",
      commentsCount: (count: number) => `${count} ${count === 1 ? "تعليق" : count === 2 ? "تعليقان" : count <= 10 ? "تعليقات" : "تعليق"}`,
      timeJustNow: "الآن",
    },
    en: {
      title: "Comments & Discussion",
      subtitle: "Have a question about this lesson or want to share your thoughts? Leave a comment below.",
      nameLabel: "Full Name",
      namePlaceholder: "e.g. John Doe",
      emailLabel: "Email Address",
      emailPlaceholder: "name@example.com",
      emailNote: "Your email address will not be published.",
      commentLabel: "Your Comment or Question",
      commentPlaceholder: "Write your thoughts, questions, or notes here...",
      submitBtn: "Post Comment",
      submittingBtn: "Posting...",
      successMsg: "Your comment was posted successfully! Thank you for participating.",
      errorGeneric: "Failed to post comment. Please try again.",
      noComments: "No comments yet. Be the first to share your thoughts!",
      commentsCount: (count: number) => `${count} ${count === 1 ? "Comment" : "Comments"}`,
      timeJustNow: "Just now",
    },
    de: {
      title: "Kommentare & Diskussion",
      subtitle: "Haben Sie eine Frage zu dieser Lektion oder möchten Sie Ihre Gedanken teilen?",
      nameLabel: "Vollständiger Name",
      namePlaceholder: "z.B. Max Mustermann",
      emailLabel: "E-Mail-Adresse",
      emailPlaceholder: "name@example.com",
      emailNote: "Ihre E-Mail-Adresse wird nicht veröffentlicht.",
      commentLabel: "Ihr Kommentar",
      commentPlaceholder: "Schreiben Sie Ihren Kommentar oder Ihre Frage hier...",
      submitBtn: "Kommentar absenden",
      submittingBtn: "Wird gesendet...",
      successMsg: "Ihr Kommentar wurde erfolgreich veröffentlicht!",
      errorGeneric: "Fehler beim Senden des Kommentars.",
      noComments: "Noch keine Kommentare. Seien Sie der Erste!",
      commentsCount: (count: number) => `${count} ${count === 1 ? "Kommentar" : "Kommentare"}`,
      timeJustNow: "Gerade eben",
    },
    fr: {
      title: "Commentaires & Discussion",
      subtitle: "Avez-vous une question sur cette leçon ou souhaitez-vous partager votre avis ?",
      nameLabel: "Nom complet",
      namePlaceholder: "ex: Jean Dupont",
      emailLabel: "Adresse e-mail",
      emailPlaceholder: "nom@example.com",
      emailNote: "Votre adresse e-mail ne sera pas publiée.",
      commentLabel: "Votre commentaire",
      commentPlaceholder: "Écrivez votre commentaire ou question ici...",
      submitBtn: "Publier le commentaire",
      submittingBtn: "Publication...",
      successMsg: "Votre commentaire a été publié avec succès !",
      errorGeneric: "Échec de l'envoi du commentaire.",
      noComments: "Aucun commentaire pour le moment. Soyez le premier !",
      commentsCount: (count: number) => `${count} ${count === 1 ? "Commentaire" : "Commentaires"}`,
      timeJustNow: "À l'instant",
    },
  };

  const t = labels[locale as keyof typeof labels] || labels.en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setStatusMessage(null);

    if (!name.trim() || !email.trim() || !content.trim()) {
      setStatusMessage({
        type: "error",
        text: isAr ? "يرجى ملء جميع الحقول المطلوبة." : "Please fill in all required fields.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          content: content.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.errorGeneric);
      }

      if (data.comment) {
        setComments((prev) => [data.comment, ...prev]);
        setName("");
        setEmail("");
        setContent("");
        setStatusMessage({
          type: "success",
          text: t.successMsg,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.errorGeneric;
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format comment time nicely
  const formatCommentDate = (dateVal: string | Date) => {
    try {
      const d = new Date(dateVal);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));

      if (diffMins < 2) {
        return t.timeJustNow;
      }

      return d.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateVal);
    }
  };

  // Generate deterministic pastel background for initials avatar
  const getAvatarBadge = (authorName: string) => {
    const trimmed = authorName.trim() || "User";
    const initial = trimmed.charAt(0).toUpperCase();
    return (
      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold text-base shadow-xs shrink-0 select-none">
        {initial}
      </div>
    );
  };

  return (
    <section
      dir={dir}
      className={`mt-16 pt-12 border-t border-slate-200 dark:border-slate-800/80 space-y-10 ${
        isAr ? "text-right" : "text-left"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {t.title}
            </h2>
          </div>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            {t.subtitle}
          </p>
        </div>

        <span className="self-start sm:self-auto px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
          {t.commentsCount(comments.length)}
        </span>
      </div>

      {/* Interactive Comment Form */}
      <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Name Input */}
            <div>
              <label
                htmlFor="comment-name"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2"
              >
                {t.nameLabel} <span className="text-red-500">*</span>
              </label>
              <input
                id="comment-name"
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePlaceholder}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
              />
            </div>

            {/* Email Input */}
            <div>
              <label
                htmlFor="comment-email"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2"
              >
                {t.emailLabel} <span className="text-red-500">*</span>
              </label>
              <input
                id="comment-email"
                type="email"
                required
                maxLength={150}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
              />
              <span className="block mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                🔒 {t.emailNote}
              </span>
            </div>
          </div>

          {/* Comment Textarea */}
          <div>
            <label
              htmlFor="comment-content"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2"
            >
              {t.commentLabel} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="comment-content"
              required
              rows={4}
              maxLength={2000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.commentPlaceholder}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base resize-y"
            />
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl text-sm font-medium border flex items-center gap-3 ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                  : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800"
              }`}
            >
              {statusMessage.type === "success" ? (
                <svg
                  className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="w-5 h-5 animate-spin text-white"
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
                  <span>{t.submittingBtn}</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 rtl:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                  <span>{t.submitBtn}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-4 pt-2">
        {comments.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl bg-slate-100/60 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-500 mx-auto flex items-center justify-center mb-3">
              💬
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium text-sm sm:text-base">
              {t.noComments}
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {getAvatarBadge(comment.name)}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                      {comment.name}
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatCommentDate(comment.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-400 border border-slate-100 dark:border-slate-700/50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
              </div>

              <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line pr-1 pl-1">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
