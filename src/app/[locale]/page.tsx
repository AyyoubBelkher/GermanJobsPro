import React from "react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import HeroSection from "@/components/ui/HeroSection";

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Localized hero texts to match the selected route locale
  let headline: string | undefined;
  let subheading: string | undefined;
  let emailPlaceholder: string | undefined;
  let buttonText: string | undefined;
  let successMessage: string | undefined;
  let errorMessage: string | undefined;

  if (locale === "en") {
    headline = "Your Comprehensive Guide to Working in Germany";
    subheading = "Discover the best job opportunities, visa guides, and comprehensive information to facilitate your professional journey in Germany.";
    emailPlaceholder = "Enter your email here...";
    buttonText = "Subscribe Now";
    successMessage = "Thank you! A confirmation link has been sent to your email.";
    errorMessage = "Please enter a valid email address.";
  } else if (locale === "de") {
    headline = "Ihr umfassender Leitfaden zum Arbeiten in Deutschland";
    subheading = "Entdecken Sie die besten Stellenangebote, Visa-Leitfäden und umfassende Informationen, um Ihre berufliche Reise in Deutschland zu erleichtern.";
    emailPlaceholder = "Geben Sie Ihre E-Mail-Adresse ein...";
    buttonText = "Abonnieren";
    successMessage = "Vielen Dank! Ein Bestätigungslink wurde an Ihre E-Mail gesendet.";
    errorMessage = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
  } else if (locale === "fr") {
    headline = "Votre guide complet pour travailler en Allemagne";
    subheading = "Découvrez les meilleures opportunités d'emploi, les guides de visa et des informations complètes pour faciliter votre parcours professionnel en Allemagne.";
    emailPlaceholder = "Entrez votre adresse e-mail...";
    buttonText = "S'abonner";
    successMessage = "Merci ! Un lien de confirmation a été envoyé à votre e-mail.";
    errorMessage = "Veuillez entrer une adresse e-mail valide.";
  }

  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  return (
    <div dir={dir} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between">
      <Navbar locale={locale} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-12">
        <HeroSection
          headline={headline}
          subheading={subheading}
          emailPlaceholder={emailPlaceholder}
          buttonText={buttonText}
          successMessage={successMessage}
          errorMessage={errorMessage}
        />
        
        {/* Secondary Call-to-Action to visit the Blog */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 sm:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-start">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {isAr ? "اقرأ أحدث المقالات والنصائح" : "Read our latest articles & guides"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {isAr 
                ? "تصفح مدونتنا للحصول على نصائح حول تعلم اللغة، إعداد السيرة الذاتية، واجتياز مقابلات العمل." 
                : "Browse our blog for expert tips on language learning, resume building, and job interview prep."}
            </p>
          </div>
          <a
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors font-semibold text-sm shadow-sm whitespace-nowrap"
          >
            <span>{isAr ? "الانتقال إلى المدونة" : "Go to Blog"}</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${isAr ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
