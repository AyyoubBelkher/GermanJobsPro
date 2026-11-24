"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

const UI_TEXT = {
  ar: {
    title: "إلغاء الاشتراك من النشرة البريدية",
    needTokenTitle: "رابط الأمان مطلوب لإلغاء الاشتراك",
    needTokenDesc:
      "لحماية خصوصيتك ومنع إلغاء اشتراكك دون إذنك، يرجى النقر على رابط إلغاء الاشتراك الشخصي الموجود في أسفل أي رسالة بريدية استلمتها منا.",
    backToHome: "العودة إلى الصفحة الرئيسية",
    subtitle: "يرجى تأكيد رغبتك في إلغاء التنبيهات والرسائل البريدية.",
    emailLabel: "البريد الإلكتروني",
    confirmBtn: "تأكيد إلغاء الاشتراك",
    processing: "جاري المعالجة...",
    backToBlog: "← العودة إلى المدونة",
    backToHomeFooter: "العودة للموقع الرئيسي",
    successSubtitle: "نتأسف لمغادرتك! يمكنك إعادة الاشتراك في أي وقت من خلال الصفحة الرئيسية.",
    emptyEmailError: "يرجى إدخال البريد الإلكتروني.",
    genericError: "فشل إلغاء الاشتراك. يرجى التأكد من البريد الإلكتروني.",
    connectionError: "حدث خطأ أثناء الاتصال بالخادم.",
  },
  de: {
    title: "Newsletter abbestellen",
    needTokenTitle: "Sicherheitslink zur Abmeldung erforderlich",
    needTokenDesc:
      "Um Ihre Privatsphäre zu schützen und unbefugte Abmeldungen zu verhindern, klicken Sie bitte auf den persönlichen Abmeldelink am Ende einer unserer Newsletter-E-Mails.",
    backToHome: "Zur Startseite",
    subtitle: "Bitte bestätigen Sie die Abmeldung von unseren Benachrichtigungen.",
    emailLabel: "E-Mail-Adresse",
    confirmBtn: "Abmeldung bestätigen",
    processing: "Wird verarbeitet...",
    backToBlog: "← Zurück zum Blog",
    backToHomeFooter: "Zurück zur Startseite",
    successSubtitle: "Schade, dass Sie uns verlassen! Sie können sich jederzeit über die Startseite erneut anmelden.",
    emptyEmailError: "Bitte geben Sie Ihre E-Mail-Adresse ein.",
    genericError: "Abmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre E-Mail-Adresse.",
    connectionError: "Verbindungsfehler zum Server.",
  },
  en: {
    title: "Unsubscribe from Newsletter",
    needTokenTitle: "Security link required to unsubscribe",
    needTokenDesc:
      "To protect your privacy and prevent unauthorized unsubscriptions, please click the personal unsubscribe link at the bottom of any newsletter email you received from us.",
    backToHome: "Return to Homepage",
    subtitle: "Please confirm your unsubscription from email notifications.",
    emailLabel: "Email address",
    confirmBtn: "Confirm Unsubscribe",
    processing: "Processing...",
    backToBlog: "← Back to Blog",
    backToHomeFooter: "Back to Homepage",
    successSubtitle: "We're sorry to see you go! You can resubscribe anytime from the homepage.",
    emptyEmailError: "Please enter your email address.",
    genericError: "Unsubscribe failed. Please verify your email address.",
    connectionError: "An error occurred connecting to the server.",
  },
  fr: {
    title: "Se désabonner de la newsletter",
    needTokenTitle: "Lien de sécurité requis pour le désabonnement",
    needTokenDesc:
      "Pour protéger votre vie privée et empêcher les désabonnements non autorisés, veuillez cliquer sur le lien personnel de désabonnement situé au bas de tout e-mail reçu de notre part.",
    backToHome: "Retour à l'accueil",
    subtitle: "Veuillez confirmer votre désabonnement de nos alertes et e-mails.",
    emailLabel: "Adresse e-mail",
    confirmBtn: "Confirmer le désabonnement",
    processing: "Traitement en cours...",
    backToBlog: "← Retour au blog",
    backToHomeFooter: "Retour à l'accueil",
    successSubtitle: "Nous sommes désolés de vous voir partir ! Vous pouvez vous réabonner à tout moment depuis la page d'accueil.",
    emptyEmailError: "Veuillez saisir votre adresse e-mail.",
    genericError: "Échec du désabonnement. Veuillez vérifier votre adresse e-mail.",
    connectionError: "Une erreur est survenue lors de la connexion au serveur.",
  },
} as const;

function UnsubscribeFormContent() {
  const params = useParams();
  const rawLocale = (params?.locale as string) || "ar";
  const locale = (["ar", "de", "en", "fr"].includes(rawLocale) ? rawLocale : "ar") as keyof typeof UI_TEXT;
  const t = UI_TEXT[locale] || UI_TEXT.ar;

  const searchParams = useSearchParams();
  const [email, setEmail] = useState(() => searchParams.get("email") || "");
  const [token, setToken] = useState(() => searchParams.get("token") || "");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const hasToken = Boolean(token && token.trim());

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, message: "" });

    const trimmedEmail = email.trim();
    const trimmedToken = token.trim();
    if (!trimmedEmail) {
      setStatus({
        type: "error",
        message: t.emptyEmailError,
      });
      return;
    }

    setLoading(true);

    try {
      const payload: { email: string; token?: string } = { email: trimmedEmail };
      if (trimmedToken) {
        payload.token = trimmedToken;
      }

      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || t.genericError);
      }

      setStatus({
        type: "success",
        message: data.message || "تم إلغاء اشتراكك بنجاح ✅",
      });
      setEmail("");
      setToken("");
    } catch (err: unknown) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : t.connectionError,
      });
    } finally {
      setLoading(false);
    }
  };

  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      <Navbar locale={locale} />

      <main className="max-w-xl mx-auto px-4 py-16 w-full flex-1 flex flex-col justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
          {!hasToken ? (
            /* Secure State: Token missing from URL */
            <div className="space-y-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z"
                  />
                </svg>
              </div>

              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {t.needTokenTitle}
                </h1>
                <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                  {t.needTokenDesc}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href={`/${locale}`}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-md active:scale-98"
                >
                  {t.backToHome}
                </Link>
              </div>
            </div>
          ) : (
            /* Unsubscribe Form: Valid Token Present */
            <>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m.88 1.159l-1.042.56a2.25 2.25 0 01-2.146 0l-6.478-3.488A2.25 2.25 0 011.5 11.812V7.5a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 7.5v4.312M15 17.25h6"
                  />
                </svg>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {t.title}
                </h1>
                <p className="text-sm text-slate-400">
                  {t.subtitle}
                </p>
              </div>

              {status.type === "success" ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-4">
                  <div className="text-3xl">✅</div>
                  <p className="text-base font-semibold">{status.message}</p>
                  <p className="text-xs text-slate-400">
                    {t.successSubtitle}
                  </p>
                  <div className="pt-2">
                    <Link
                      href={`/${locale}/blog`}
                      className="inline-flex items-center text-xs text-blue-400 hover:underline font-semibold"
                    >
                      {t.backToBlog}
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUnsubscribe} className="space-y-4">
                  {status.type === "error" && (
                    <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                      {status.message}
                    </div>
                  )}

                  <div className={`space-y-1 ${isAr ? "text-right" : "text-left"}`}>
                    <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mx-1">
                      {t.emailLabel}
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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
                        <span>{t.processing}</span>
                      </>
                    ) : (
                      <span>{t.confirmBtn}</span>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          <div className="pt-4 border-t border-slate-800">
            <Link
              href={`/${locale}`}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              {t.backToHomeFooter}
            </Link>
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">...</div>}>
      <UnsubscribeFormContent />
    </Suspense>
  );
}
