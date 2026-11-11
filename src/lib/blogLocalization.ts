import {
  isCourseLesson,
  parseLessonTitle,
  extractCleanExcerpt,
  resolveLessonImage,
  localizeCategoryLabel,
} from "./courseUtils";

export interface BlogPostLike {
  id?: string;
  slug: string;
  title: string;
  markdown_content?: string | null;
  category?: string | null;
  image_url?: string | null;
  cover_image?: string | null;
  author?: string | null;
  tags?: string[];
  created_at?: string | Date;
  createdAt?: string | Date;
  generated_by_ai?: boolean;
  published?: boolean;
  [key: string]: any;
}

export interface LocalizedBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  cover_image: string;
  author: string;
  tags: string[];
  created_at: string;
  markdown_content: string;
  hasArabicReference: boolean;
}

interface ArticleTranslation {
  title: string;
  excerpt: string;
  category: string;
}

const KNOWN_ARTICLES: Record<string, Record<"de" | "en" | "fr", ArticleTranslation>> = {
  "german-cv-din-5008-guide-10211": {
    de: {
      title: "DIN 5008 Lebenslauf: Der ultimative Leitfaden für den deutschen Arbeitsmarkt",
      excerpt: "Alles über Struktur, tabellarischen Aufbau, Abstände und Formatierungsregeln nach der offiziellen DIN 5008 Norm für deutsche Recruiter.",
      category: "Bewerbung & Jobs",
    },
    en: {
      title: "German CV Guide (DIN 5008): Format, Structure & Requirements",
      excerpt: "Complete guide to writing a German tabular resume (Lebenslauf) according to the official DIN 5008 standard expected by employers.",
      category: "Jobs & Careers",
    },
    fr: {
      title: "Guide du CV allemand (DIN 5008) : Structure, Format et Normes",
      excerpt: "Le guide complet pour rédiger un CV tabulaire selon la norme officielle allemande DIN 5008 exigée par tous les recruteurs.",
      category: "Emplois & Carrière",
    },
  },
  "germany-chancenkarte-points-guide-03317": {
    de: {
      title: "Chancenkarte Deutschland: Voraussetzungen, Punktesystem & Antrag",
      excerpt: "Der vollständige Leitfaden zur deutschen Chancenkarte: Punkte berechnen, Nachweise erbringen und das Visum zur Jobsuche sichern.",
      category: "Visum & Jobs",
    },
    en: {
      title: "Germany Opportunity Card (Chancenkarte): Points Calculator & Guide",
      excerpt: "How to qualify for the German Chancenkarte visa, calculate your points, and find a job in Germany step-by-step.",
      category: "Visa & Jobs",
    },
    fr: {
      title: "Carte des opportunités (Chancenkarte) en Allemagne : Barème et Démarches",
      excerpt: "Tout savoir sur le visa Chancenkarte : calcul des points, critères d'éligibilité et démarches consulaires pour chercher un emploi.",
      category: "Visa & Emplois",
    },
  },
  "german-cover-letter-anschreiben-tips-29955": {
    de: {
      title: "Deutsches Anschreiben: Tipps & Vorlagen für eine überzeugende Bewerbung",
      excerpt: "So formulieren Sie ein professionelles Anschreiben nach DIN 5008 im Substantivstil, das Personaler sofort überzeugt.",
      category: "Bewerbung & Jobs",
    },
    en: {
      title: "German Cover Letter (Anschreiben): Writing Guide & Examples",
      excerpt: "Master the German Anschreiben format, tone, and nominal style (Substantivstil) to make your job application stand out.",
      category: "Jobs & Careers",
    },
    fr: {
      title: "Lettre de motivation allemande (Anschreiben) : Guide et Modèles",
      excerpt: "Comment rédiger une lettre de motivation percutante selon les règles allemandes pour convaincre les recruteurs dès la première lecture.",
      category: "Emplois & Carrière",
    },
  },
  "how-to-pass-german-ats-filters-51858": {
    de: {
      title: "ATS-Filter in Deutschland umgehen: So bestehen Sie das digitale Screening",
      excerpt: "Wichtige Strategien zur Optimierung Ihres Lebenslaufs für automatisierte Bewerbermanagementsysteme deutscher Unternehmen.",
      category: "Bewerbung & Jobs",
    },
    en: {
      title: "How to Pass German ATS Resume Screeners: Key Secrets & Tips",
      excerpt: "Optimize your resume formatting, keywords, and typography to pass applicant tracking systems (ATS) at German firms.",
      category: "Jobs & Careers",
    },
    fr: {
      title: "Comment franchir les filtres ATS des entreprises allemandes",
      excerpt: "Les secrets pour adapter votre CV aux systèmes de tri automatique des candidatures utilisés par les recruteurs en Allemagne.",
      category: "Emplois & Carrière",
    },
  },
  "ausbildung-in-germany-complete-guide-38405": {
    de: {
      title: "Ausbildung in Deutschland: Der Komplettleitfaden für internationale Bewerber",
      excerpt: "Vom Finden des richtigen Ausbildungsberufs über den Ausbildungsvertrag bis hin zum Visum und Sprachnachweis.",
      category: "Ausbildung & Jobs",
    },
    en: {
      title: "Apprenticeship in Germany (Ausbildung): Complete Guide for Internationals",
      excerpt: "Everything you need to know about vocational training in Germany, salary expectations, contract signing, and visa steps.",
      category: "Training & Jobs",
    },
    fr: {
      title: "Formation professionnelle en Allemagne (Ausbildung) : Le Guide Complet",
      excerpt: "Tout savoir sur l'apprentissage en Allemagne : choix du métier, rémunération, visa et démarches pour signer votre contrat.",
      category: "Formation & Emplois",
    },
  },
  "certificate-recognition-anerkennung-germany-92102": {
    de: {
      title: "Anerkennung ausländischer Abschlüsse: Anabin & ZAB Leitfaden",
      excerpt: "Wie Sie die Gleichwertigkeit Ihres Hochschulabschlusses oder Berufsabschlusses in der Anabin-Datenbank und über die ZAB nachweisen.",
      category: "Anerkennung & Jobs",
    },
    en: {
      title: "Degree & Certificate Recognition in Germany: Anabin & ZAB Guide",
      excerpt: "How to check university accreditation on Anabin and obtain official ZAB recognition for work and visa applications.",
      category: "Recognition & Jobs",
    },
    fr: {
      title: "Équivalence des diplômes en Allemagne (Anerkennung) : Anabin et ZAB",
      excerpt: "Comment vérifier la reconnaissance de votre diplôme sur Anabin et obtenir l'attestation de la ZAB pour travailler en Allemagne.",
      category: "Équivalence & Emplois",
    },
  },
  "german-job-interview-questions-answers-67091": {
    de: {
      title: "Vorstellungsgespräch auf Deutsch: Die 15 wichtigsten Fragen & Antworten",
      excerpt: "Bereiten Sie sich optimal auf Ihr deutsches Vorstellungsgespräch vor – mit Musterantworten und typischen Stolperfallen.",
      category: "Karriere & Jobs",
    },
    en: {
      title: "15 Common German Job Interview Questions & Best Answers",
      excerpt: "Master your German job interview (Vorstellungsgespräch) with standard interview etiquette, typical questions, and answers.",
      category: "Jobs & Careers",
    },
    fr: {
      title: "Entretien d'embauche en Allemagne : 15 Questions Fréquentes et Réponses",
      excerpt: "Préparez votre entretien professionnel en allemand avec des exemples de réponses et les attentes des employeurs allemands.",
      category: "Carrière & Emplois",
    },
  },
  "eu-blue-card-germany-requirements-18521": {
    de: {
      title: "Blaue Karte EU Deutschland: Neue Gehaltsschwellen & Voraussetzungen",
      excerpt: "Aktuelle Regelungen zur Blauen Karte EU: Mindestgehälter, Erleichterungen für IT-Spezialisten und Weg zur Niederlassungserlaubnis.",
      category: "Visum & Jobs",
    },
    en: {
      title: "EU Blue Card Germany: New Salary Thresholds & Requirements",
      excerpt: "Updated regulations for the EU Blue Card in Germany, relaxed rules for IT experts, and fast-track permanent residency.",
      category: "Visa & Jobs",
    },
    fr: {
      title: "Carte Bleue Européenne en Allemagne : Salaires et Conditions",
      excerpt: "Les critères mis à jour de la Carte Bleue UE : seuils de salaire minimum, avantages pour les informaticiens et accès à la résidence.",
      category: "Visa & Emplois",
    },
  },
  "german-bewerbungsmappe-structure-guide-19030": {
    de: {
      title: "Die perfekte Bewerbungsmappe: Aufbau, Reihenfolge & Dokumente",
      excerpt: "Wie Sie Deckblatt, Anschreiben, Lebenslauf und Zeugnisse zu einer harmonischen, professionellen Bewerbungsmappe zusammenstellen.",
      category: "Bewerbung & Jobs",
    },
    en: {
      title: "The Complete German Application Dossier (Bewerbungsmappe) Guide",
      excerpt: "Why German recruiters expect a complete Bewerbungsmappe (Cover Sheet, Anschreiben, CV, Credentials) and how to assemble it.",
      category: "Jobs & Careers",
    },
    fr: {
      title: "Le dossier de candidature complet (Bewerbungsmappe) en Allemagne",
      excerpt: "Comment structurer votre dossier complet (Deckblatt, lettre, CV tabulaire et attestations) pour maximiser vos chances.",
      category: "Emplois & Carrière",
    },
  },
  "nursing-jobs-pflegefachkraft-germany-guide-10286": {
    de: {
      title: "Pflegefachkraft in Deutschland: Anerkennung, Gehälter & Chancen",
      excerpt: "Der vollständige Leitfaden für internationale Pflegekräfte und Krankenschwestern: Berufsanerkennung, B2-Zertifikat und Vergütung.",
      category: "Pflege & Jobs",
    },
    en: {
      title: "Nursing Jobs in Germany (Pflegefachkraft): Salaries & Recognition",
      excerpt: "Comprehensive guide for international nurses: B1/B2 language requirements, professional recognition, and healthcare salaries.",
      category: "Healthcare & Jobs",
    },
    fr: {
      title: "Travailler comme Infirmier / Soignant en Allemagne (Pflegefachkraft)",
      excerpt: "Guide complet pour les professionnels de santé : équivalence de diplôme, exigences linguistiques B2 et salaires hospitaliers.",
      category: "Santé & Emplois",
    },
  },
  "anmeldung-address-registration-germany-guide-76203": {
    de: {
      title: "Anmeldung in Deutschland: Leitfaden zur Wohnsitzanmeldung",
      excerpt: "Der erste und wichtigste Behördengang nach der Ankunft in Deutschland: Fristen, Wohnungsgeberbestätigung und Steuer-ID.",
      category: "Ratgeber & Leben",
    },
    en: {
      title: "Address Registration in Germany (Anmeldung): Step-by-Step Guide",
      excerpt: "The most important bureaucratic step upon arrival in Germany: Appointments, landlord confirmation, and tax ID generation.",
      category: "Guides & Life",
    },
    fr: {
      title: "Enregistrement de domicile en Allemagne (Anmeldung) : Guide Pratique",
      excerpt: "La première démarche légale essentielle à votre arrivée en Allemagne : prise de rendez-vous, attestation du bailleur et Steuer-ID.",
      category: "Guides & Vie",
    },
  },
  "german-tax-classes-steuerklassen-net-salary-43139": {
    de: {
      title: "Steuerklassen 1 bis 6 in Deutschland: Nettogehalt & Abzüge verstehen",
      excerpt: "Wie Steuerklassen funktionieren, wie viel Netto vom Brutto übrig bleibt und wie Sie die passende Steuerklasse wählen.",
      category: "Finanzen & Leben",
    },
    en: {
      title: "German Tax Classes (Steuerklassen 1-6): Net Salary & Deductions Explained",
      excerpt: "Understand how German income tax brackets, social contributions, and deductions calculate your actual take-home salary.",
      category: "Finance & Life",
    },
    fr: {
      title: "Classes d'impôts en Allemagne (Steuerklassen 1-6) : Calcul du salaire net",
      excerpt: "Comprendre les tranches fiscales allemandes, les cotisations sociales et les retenues sur salaire brut en Allemagne.",
      category: "Finances & Vie",
    },
  },
  "health-insurance-krankenkasse-germany-guide-38653": {
    de: {
      title: "Gesetzliche Krankenversicherung in Deutschland: Die beste Kasse wählen",
      excerpt: "Gesetzliche vs. private Krankenversicherung für Arbeitnehmer, Studenten und Expats: Leistungen, Beiträge und Anmeldung.",
      category: "Ratgeber & Leben",
    },
    en: {
      title: "Health Insurance in Germany (Krankenkasse): Public vs. Private Guide",
      excerpt: "How health insurance works in Germany for employees, job seekers, and students, with contribution calculations and sign-up tips.",
      category: "Guides & Life",
    },
    fr: {
      title: "L'assurance maladie en Allemagne (Krankenkasse) : Guide Public vs Privé",
      excerpt: "Fonctionnement du système de santé allemand : choix de la caisse, cotisations salariales et prise en charge médicale.",
      category: "Guides & Vie",
    },
  },
  "finding-apartment-in-germany-tips-schufa-81198": {
    de: {
      title: "Wohnungssuche in Deutschland: Portale, SCHUFA-Auskunft & Mietvertrag",
      excerpt: "Erfolgreiche Wohnungssuche in deutschen Metropolen: Bewerbungsmappe für Vermieter, SCHUFA-Nachweis und Betrugsprävention.",
      category: "Ratgeber & Leben",
    },
    en: {
      title: "Finding an Apartment in Germany: Websites, SCHUFA & Landlord Tips",
      excerpt: "How to find housing in competitive German cities: Required documents, tenant dossier, credit score (SCHUFA), and avoiding scams.",
      category: "Guides & Life",
    },
    fr: {
      title: "Trouver un logement en Allemagne : Portails, SCHUFA et Conseils",
      excerpt: "Les clés pour réussir sa recherche d'appartement : constitution du dossier locataire, attestation SCHUFA et pièges à éviter.",
      category: "Guides & Vie",
    },
  },
  "german-employment-contract-arbeitsvertrag-guide-66747": {
    de: {
      title: "Deutscher Arbeitsvertrag & Probezeit: Wichtige Klauseln vor der Unterschrift",
      excerpt: "Was vor Unterzeichnung eines Arbeitsvertrags beachtet werden muss: Kündigungsfristen, Überstundenregelung und Probezeit-Rechte.",
      category: "Recht & Karriere",
    },
    en: {
      title: "German Employment Contract (Arbeitsvertrag) & Probezeit: Key Clauses",
      excerpt: "Essential checklist before signing a German work contract: Probation period, notice periods, overtime, and statutory rights.",
      category: "Career & Law",
    },
    fr: {
      title: "Contrat de travail allemand (Arbeitsvertrag) et Période d'essai",
      excerpt: "Les clauses essentielles à vérifier avant de signer : période d'essai (Probezeit), préavis de départ et heures supplémentaires.",
      category: "Droit & Carrière",
    },
  },
  "cost-of-living-in-germany-monthly-budget-62213": {
    de: {
      title: "Lebenshaltungskosten in Deutschland: Monatliches Budget & Städtevergleich",
      excerpt: "Detaillierte Übersicht über monatliche Ausgaben: Miete, Lebensmittel, Transport und Versicherungen im Vergleich deutscher Städte.",
      category: "Ratgeber & Leben",
    },
    en: {
      title: "Cost of Living in Germany: Monthly Budget & City Comparison",
      excerpt: "Realistic breakdown of monthly living costs across Germany: Rent, groceries, transport, health insurance, and lifestyle expenses.",
      category: "Guides & Life",
    },
    fr: {
      title: "Coût de la vie en Allemagne : Budget mensuel et Comparatif des villes",
      excerpt: "Estimation réaliste des dépenses mensuelles en Allemagne : loyers, alimentation, transports et assurances par région.",
      category: "Guides & Vie",
    },
  },
  "blocked-account-sperrkonto-bank-account-germany-26767": {
    de: {
      title: "Sperrkonto & Girokonto in Deutschland: Der vollständige Finanzleitfaden",
      excerpt: "Eröffnung eines Sperrkontos für Visum und Studium sowie die Wahl des richtigen Girokontos für Gehaltseingänge.",
      category: "Finanzen & Leben",
    },
    en: {
      title: "Blocked Account (Sperrkonto) & Bank Accounts in Germany: Expat Guide",
      excerpt: "How to open a Sperrkonto for your visa application and set up an everyday German checking account (Girokonto) without fees.",
      category: "Finance & Life",
    },
    fr: {
      title: "Compte bloqué (Sperrkonto) et Compte courant en Allemagne : Guide Financier",
      excerpt: "Démarches pour ouvrir un compte bloqué pour le visa et choisir un compte bancaire quotidien (Girokonto) adapté en Allemagne.",
      category: "Finances & Vie",
    },
  },
};

/**
 * Fallback pattern matcher for news/industry articles with Arabic slugs or titles.
 */
function matchTopicTranslation(
  slug: string,
  title: string,
  locale: "de" | "en" | "fr"
): ArticleTranslation | null {
  const text = `${slug} ${title}`.toLowerCase();

  // Aircraft maintenance
  if (text.includes("طائرات") || text.includes("هندسة-الجوية") || text.includes("aircraft") || text.includes("aviation")) {
    if (locale === "de") {
      return {
        title: "Karriere in der Flugzeugwartung in Deutschland: Einstieg in die Luftfahrttechnik",
        excerpt: "Chancen und Berufswege in der Luftfahrtindustrie in Deutschland für internationale Fachkräfte.",
        category: "Luftfahrt & Jobs",
      };
    }
    if (locale === "fr") {
      return {
        title: "Emplois en maintenance aéronautique en Allemagne : Carrière et Visa",
        excerpt: "Opportunités professionnelles dans l'industrie aérospatiale en Allemagne pour techniciens et ingénieurs.",
        category: "Aéronautique & Emplois",
      };
    }
    return {
      title: "Aircraft Maintenance Jobs in Germany: Aerospace Engineering Careers",
      excerpt: "How to enter the German aviation and aircraft maintenance engineering sector as an international specialist.",
      category: "Aviation & Jobs",
    };
  }

  // Automotive / Ford
  if (text.includes("سيارات") || text.includes("فورد") || text.includes("ranger") || text.includes("automotive")) {
    if (locale === "de") {
      return {
        title: "Karrierechancen in der deutschen Automobilindustrie: E-Mobilität & Jobs",
        excerpt: "Aktuelle Entwicklungen im Automobilsektor und neue Karrierechancen in Deutschland.",
        category: "Automobil & Jobs",
      };
    }
    if (locale === "fr") {
      return {
        title: "Carrières dans l'industrie automobile en Allemagne : Innovation & Emplois",
        excerpt: "Perspectives de recrutement et opportunités d'ingénierie dans le secteur automobile en Allemagne.",
        category: "Automobile & Emplois",
      };
    }
    return {
      title: "Automotive Career Opportunities in Germany: EV Innovation & Engineering",
      excerpt: "New perspectives and engineering job opportunities in Germany's evolving automotive industry.",
      category: "Automotive & Jobs",
    };
  }

  // Full-time work trend
  if (text.includes("دوام-الكامل") || text.includes("vollzeit") || text.includes("full-time")) {
    if (locale === "de") {
      return {
        title: "Trends am deutschen Arbeitsmarkt: Vollzeitbeschäftigung & Karrierechancen",
        excerpt: "Aktuelle Arbeitsmarkttrends in Deutschland und wie Sie die besten Vollzeitstellen sichern.",
        category: "Arbeitsmarkt & Jobs",
      };
    }
    if (locale === "fr") {
      return {
        title: "Tendances du marché de l'emploi en Allemagne : Postes à temps plein",
        excerpt: "Les dernières évolutions du marché du travail allemand et les conseils pour décrocher un contrat à temps plein.",
        category: "Marché & Emplois",
      };
    }
    return {
      title: "German Labor Market Trends: Full-Time Employment & Opportunities",
      excerpt: "Latest shifts in the German labor market and how international candidates can secure full-time positions.",
      category: "Labor Market & Jobs",
    };
  }

  // International graduates
  if (text.includes("خريجون") || text.includes("خريجين") || text.includes("graduates") || text.includes("absolventen")) {
    if (locale === "de") {
      return {
        title: "Internationale Absolventen in Deutschland: Karrierechancen & Arbeitsmarktzugang",
        excerpt: "Aktuelle Studien zeigen exzellente Jobaussichten für internationale Absolventen auf dem deutschen Arbeitsmarkt.",
        category: "Karriere & Jobs",
      };
    }
    if (locale === "fr") {
      return {
        title: "Diplômés internationaux en Allemagne : Perspectives d'emploi et Recrutement",
        excerpt: "Les diplômés internationaux ont d'excellentes opportunités professionnelles sur le marché du travail allemand.",
        category: "Carrière & Emplois",
      };
    }
    return {
      title: "International Graduates in Germany: Job Prospects & Career Success",
      excerpt: "Recent studies reveal strong employment opportunities for international graduates across German industries.",
      category: "Jobs & Careers",
    };
  }

  // In-demand sectors
  if (text.includes("أكثر-القطاعات") || text.includes("in-demand") || text.includes("fachkräftemangel")) {
    if (locale === "de") {
      return {
        title: "Die gefragtesten Branchen in Deutschland: Berufe mit Fachkräftemangel",
        excerpt: "Übersicht über Branchen mit hohem Fachkräftebedarf in Deutschland und Bewerbungsschritte.",
        category: "Branchen & Jobs",
      };
    }
    if (locale === "fr") {
      return {
        title: "Les secteurs qui recrutent le plus en Allemagne : Métiers en tension",
        excerpt: "Panorama des domaines professionnels les plus recherchés en Allemagne et guide de candidature étape par étape.",
        category: "Secteurs & Emplois",
      };
    }
    return {
      title: "Most In-Demand Job Sectors in Germany: Top Shortage Occupations",
      excerpt: "A breakdown of the highest-demand industries and occupations in Germany with clear application steps.",
      category: "Industries & Jobs",
    };
  }

  // Work culture / habits
  if (text.includes("عادة-في-بيئة-العمل") || text.includes("arbeitskultur") || text.includes("work-culture")) {
    if (locale === "de") {
      return {
        title: "Deutsche Arbeitskultur: 15 wichtige Gepflogenheiten im Berufsleben",
        excerpt: "Kommunikation, Pünktlichkeit und Feedbackkultur: So meistern Sie den Arbeitsalltag in deutschen Unternehmen.",
        category: "Arbeitskultur & Leben",
      };
    }
    if (locale === "fr") {
      return {
        title: "Culture d'entreprise en Allemagne : 15 Us et Coutumes au Travail",
        excerpt: "Ponctualité, franchise et organisation : comment réussir son intégration dans le milieu professionnel allemand.",
        category: "Culture & Vie",
      };
    }
    return {
      title: "German Work Culture: 15 Essential Workplace Habits & Etiquette",
      excerpt: "Punctuality, direct communication, and hierarchy: How to successfully adapt to the German professional work environment.",
      category: "Work Culture & Life",
    };
  }

  // Archaeology / Construction
  if (text.includes("تنقيب") || text.includes("أثري") || text.includes("archaeology") || text.includes("bau")) {
    if (locale === "de") {
      return {
        title: "Denkmalpflege & Bauwirtschaft in Deutschland: Karriereperspektiven",
        excerpt: "Wie historische Projekte und Infrastrukturvorhaben interessante Beschäftigungsmöglichkeiten in Deutschland eröffnen.",
        category: "Baugewerbe & Jobs",
      };
    }
    if (locale === "fr") {
      return {
        title: "Archéologie et BTP en Allemagne : Opportunités Professionnelles",
        excerpt: "Comment les chantiers historiques et d'infrastructure créent de nouvelles opportunités d'emploi en Allemagne.",
        category: "BTP & Emplois",
      };
    }
    return {
      title: "Historic Preservation & Construction Careers in Germany",
      excerpt: "Explore career opportunities in Germany's infrastructure, excavation, and historic construction sectors.",
      category: "Construction & Jobs",
    };
  }

  // ERTMS / Rail
  if (text.includes("ertms") || text.includes("سكك-الحديدية") || text.includes("rail")) {
    if (locale === "de") {
      return {
        title: "Digitaler Bahnbetrieb & ERTMS in Deutschland: Jobs in der Bahntechnik",
        excerpt: "Zukunftsträchtige Karrierechancen bei der Digitalisierung des deutschen Schienennetzes und im Bahnsektor.",
        category: "Bahntechnik & Jobs",
      };
    }
    if (locale === "fr") {
      return {
        title: "Technologies ferroviaires et ERTMS en Allemagne : Métiers d'Avenir",
        excerpt: "Les opportunités d'ingénierie et de technologie liées à la modernisation du réseau ferroviaire en Allemagne.",
        category: "Ferroviaire & Emplois",
      };
    }
    return {
      title: "Smart Rail & ERTMS in Germany: Engineering Careers in Rail Tech",
      excerpt: "High-growth engineering and technology job opportunities in Germany's smart railway modernization.",
      category: "Rail Tech & Jobs",
    };
  }

  // General visa guide
  if (text.includes("تأشيرة") || text.includes("visa")) {
    if (locale === "de") {
      return {
        title: "Arbeiten in Deutschland: Der vollständige Visum- & Einreiseleitfaden",
        excerpt: "Alle wichtigen Voraussetzungen, Dokumente und Behördenabläufe für das deutsche Arbeitsvisum im Überblick.",
        category: "Visum & Jobs",
      };
    }
    if (locale === "fr") {
      return {
        title: "Travailler en Allemagne : Le Guide Complet du Visa et de l'Expatriation",
        excerpt: "Tout ce que vous devez préparer avant de déposer votre demande de visa de travail pour l'Allemagne.",
        category: "Visa & Emplois",
      };
    }
    return {
      title: "Working in Germany: The Complete Visa & Relocation Guide",
      excerpt: "A comprehensive checklist of everything you need before applying for your German work visa and relocating.",
      category: "Visa & Jobs",
    };
  }

  // Oncology / hospital
  if (text.includes("أورام") || text.includes("marienhospital") || text.includes("klinikum")) {
    if (locale === "de") {
      return {
        title: "Karriere in der Onkologie & Pflege in Deutschland: Klinikum Marienhospital",
        excerpt: "Perspektiven für medizinisches Personal und Pflegefachkräfte in deutschen Schwerpunktzentren.",
        category: "Medizin & Pflege",
      };
    }
    if (locale === "fr") {
      return {
        title: "Emplois en Oncologie et Soins Hospitaliers en Allemagne",
        excerpt: "Opportunités pour infirmiers et professionnels de santé au sein des centres hospitaliers spécialisés en Allemagne.",
        category: "Santé & Hôpital",
      };
    }
    return {
      title: "Healthcare & Oncology Nursing in Germany: Hospital Careers",
      excerpt: "Clinical and nursing career opportunities at major German specialized cancer treatment centers.",
      category: "Healthcare & Hospital",
    };
  }

  return null;
}

/**
 * Localizes blog post title, excerpt, and category when viewing in German (de),
 * English (en), or French (fr), while keeping the original content clean in Arabic.
 */
export function localizeBlogPost(
  post: BlogPostLike,
  locale: string = "ar"
): LocalizedBlogPost {
  const isAr = locale === "ar";
  const content = post.markdown_content || "";
  const hasArabicReference = /[\u0600-\u06FF]/.test(content);

  const isA1 = isCourseLesson({
    category: post.category || undefined,
    slug: post.slug,
    title: post.title,
  });

  const parsedA1 = isA1 ? parseLessonTitle(post.title, content) : null;
  const lessonNum = parsedA1?.lessonNumber;
  const germanTitle = parsedA1?.germanTitle;

  const defaultExcerpt = extractCleanExcerpt(content, post.title, 150);
  const resolvedCover = isA1
    ? resolveLessonImage(post.image_url || post.cover_image, lessonNum, post.slug, post.title)
    : post.image_url || post.cover_image || "";

  const author = post.generated_by_ai
    ? (isAr ? "فريق GermanJobsPro" : "GermanJobsPro Team")
    : (isAr ? "إدارة التحرير" : "Editorial Team");

  const created_at =
    post.createdAt instanceof Date
      ? post.createdAt.toISOString()
      : typeof post.created_at === "string"
      ? post.created_at
      : new Date().toISOString();

  // If locale is Arabic, return Arabic title and clean excerpt
  if (isAr) {
    return {
      id: String(post.id || post.slug),
      slug: post.slug,
      title: parsedA1?.fullTitle || post.title,
      excerpt: defaultExcerpt,
      category: post.category || "General",
      cover_image: resolvedCover || "",
      author,
      tags: [post.category || "General"],
      created_at,
      markdown_content: content,
      hasArabicReference,
    };
  }

  // Non-Arabic locale (de, en, fr):
  const langKey: "de" | "en" | "fr" =
    locale === "de" || locale === "fr" ? locale : "en";

  // 1. German A1 Lessons
  if (isA1) {
    const fallbackTitle = germanTitle || post.title;
    let localizedTitle = fallbackTitle;
    let localizedExcerpt = defaultExcerpt;
    let localizedCategory = "German A1 Course";

    if (langKey === "de") {
      localizedTitle = lessonNum ? `Lektion ${lessonNum}: ${fallbackTitle}` : fallbackTitle;
      localizedExcerpt =
        "Kostenlose Deutsch A1 Lektion mit Audio-Aussprache, Vokabeln, Grammatikerklärungen und Beispieldialogen.";
      localizedCategory = "Deutsch A1 Kurs";
    } else if (langKey === "fr") {
      localizedTitle = lessonNum ? `Leçon ${lessonNum}: ${fallbackTitle}` : fallbackTitle;
      localizedExcerpt =
        "Leçon d'allemand A1 gratuite avec prononciation audio, vocabulaire, grammaire et dialogues pratiques.";
      localizedCategory = "Cours d'allemand A1";
    } else {
      localizedTitle = lessonNum ? `Lesson ${lessonNum}: ${fallbackTitle}` : fallbackTitle;
      localizedExcerpt =
        "Free German A1 lesson featuring audio pronunciation, vocabulary, grammar rules, and sample dialogues.";
      localizedCategory = "German A1 Course";
    }

    return {
      id: String(post.id || post.slug),
      slug: post.slug,
      title: localizedTitle,
      excerpt: localizedExcerpt,
      category: localizedCategory,
      cover_image: resolvedCover || "",
      author,
      tags: [localizedCategory],
      created_at,
      markdown_content: content,
      hasArabicReference,
    };
  }

  // 2. Editorial Articles - Check known slug dictionary
  const rawSlug = (post.slug || "").trim();
  const known = KNOWN_ARTICLES[rawSlug];
  if (known && known[langKey]) {
    const item = known[langKey];
    return {
      id: String(post.id || post.slug),
      slug: post.slug,
      title: item.title,
      excerpt: item.excerpt,
      category: item.category,
      cover_image: resolvedCover || "",
      author,
      tags: [item.category],
      created_at,
      markdown_content: content,
      hasArabicReference,
    };
  }

  // 3. Match topic by keywords
  const matched = matchTopicTranslation(rawSlug, post.title, langKey);
  if (matched) {
    return {
      id: String(post.id || post.slug),
      slug: post.slug,
      title: matched.title,
      excerpt: matched.excerpt,
      category: matched.category,
      cover_image: resolvedCover || "",
      author,
      tags: [matched.category],
      created_at,
      markdown_content: content,
      hasArabicReference,
    };
  }

  // 4. Fallback: localize category and preserve title
  const localizedCat = localizeCategoryLabel(post.category || "General", locale);
  return {
    id: String(post.id || post.slug),
    slug: post.slug,
    title: post.title,
    excerpt: defaultExcerpt,
    category: localizedCat,
    cover_image: resolvedCover || "",
    author,
    tags: [localizedCat],
    created_at,
    markdown_content: content,
    hasArabicReference,
  };
}
