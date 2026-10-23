export type SupportedLocale = 'ar' | 'de' | 'fr' | 'en';

export interface LandingContent {
  meta: {
    title: string;
    description: string;
  };
  hero: {
    badge: string;
    headline: {
      prefix: string;
      highlight: string;
      suffix: string;
    };
    subheadline: string;
    primaryCta: string;
    secondaryCta: string;
    trustBadges: [string, string, string];
  };
  pillars: {
    badge: string;
    title: string;
    subtitle: string;
    pillar1: {
      title: string;
      desc: string;
      tag: string;
      cta: string;
    };
    pillar2: {
      title: string;
      desc: string;
      tag: string;
      cta: string;
    };
    pillar3: {
      title: string;
      desc: string;
      tag: string;
      cta: string;
    };
    pillar4: {
      title: string;
      desc: string;
      tag: string;
      cta: string;
    };
  };
  comparison: {
    title: string;
    subtitle: string;
    negativeBadge: string;
    negativeRate: string;
    negativePoints: [string, string, string, string];
    positiveBadge: string;
    positiveRate: string;
    positivePoints: [string, string, string, string];
  };
  freeValue: {
    badge: string;
    title: string;
    subtitle: string;
    card1: {
      badge: string;
      title: string;
      desc: string;
      f1: string;
      f2: string;
      f3: string;
      cta: string;
    };
    card2: {
      badge: string;
      title: string;
      desc: string;
      f1: string;
      f2: string;
      f3: string;
      cta: string;
    };
    card3: {
      badge: string;
      title: string;
      desc: string;
      f1: string;
      f2: string;
      f3: string;
      cta: string;
    };
    pricingLinkText: string;
  };
  pricing?: {
    badge: string;
    title: string;
    subtitle: string;
    starter: {
      category: string;
      title: string;
      desc: string;
      price: string;
      period: string;
      f1: string;
      f2: string;
      f3: string;
      f4: string;
      f5: string;
      cta: string;
    };
    quickSprint: {
      category: string;
      title: string;
      desc: string;
      price: string;
      period: string;
      subtext: string;
      f1: string;
      f2: string;
      f3: string;
      f4: string;
      cta: string;
    };
    proJobPass: {
      popularBadge: string;
      category: string;
      title: string;
      desc: string;
      price: string;
      period: string;
      subtext: string;
      f1: string;
      f2: string;
      f3: string;
      f4: string;
      f5: string;
      cta: string;
    };
    comparisonLink: string;
  };
  howItWorks: {
    badge: string;
    title: string;
    step1: {
      number: string;
      title: string;
      desc: string;
    };
    step2: {
      number: string;
      title: string;
      desc: string;
    };
    step3: {
      number: string;
      title: string;
      desc: string;
    };
  };
  a1Track: {
    badge: string;
    title: string;
    subtitle: string;
    primaryBtn: string;
    secondaryBtn: string;
    card1: {
      title: string;
      desc: string;
    };
    card2: {
      title: string;
      desc: string;
    };
    card3: {
      title: string;
      desc: string;
    };
  };
  a1Lessons: {
    badge: string;
    title: string;
    viewAll: string;
    lessonPrefix: string;
    readTime: string;
    startLesson: string;
  };
  jobs: {
    badge: string;
    title: string;
    viewAll: string;
    languageLabel: string;
    apply: string;
  };
  articles: {
    badge: string;
    title: string;
    viewAll: string;
    readMore: string;
  };
  legal: {
    title: string;
    text: string;
  };
  faq: {
    badge: string;
    title: string;
    items: Array<{
      question: string;
      answer: string;
    }>;
  };
  finalCta: {
    title: string;
    subtitle: string;
    primaryBtn: string;
    secondaryBtn: string;
  };
}

export const LANDING_CONTENT: Record<SupportedLocale, LandingContent> = {
  fr: {
    meta: {
      title: "GermanJobsPro 🇩🇪 | Préparez votre dossier de candidature allemand (DIN 5008)",
      description: "Créez votre CV DIN 5008 certifié, générez des lettres de motivation sur mesure (Anschreiben), assemblez votre Bewerbungsmappe complète, vérifiez la conformité ATS et apprenez l'allemand A1.",
    },
    hero: {
      badge: "🇩🇪 La plateforme complète pour travailler et s'installer en Allemagne",
      headline: {
        prefix: "Préparez votre dossier de candidature allemand ",
        highlight: "(DIN 5008)",
        suffix: " & franchissez les filtres ATS",
      },
      subheadline: "Créez votre CV DIN 5008 certifié, générez des lettres de motivation sur mesure (Anschreiben), assemblez votre Bewerbungsmappe complète, vérifiez la conformité ATS et apprenez l'allemand A1.",
      primaryCta: "Créer votre CV allemand gratuit 🇩🇪",
      secondaryCta: "Parcours Allemand A1 📚",
      trustBadges: [
        "Norme officielle DIN 5008",
        "Conforme RGPD 100%",
        "Paiement unique, sans abonnement caché",
      ],
    },
    pillars: {
      badge: "4 piliers essentiels pour l'Allemagne",
      title: "4 piliers essentiels pour réussir votre candidature en Allemagne",
      subtitle: "Des outils spécialisés conçus pour franchir les filtres ATS et convaincre les recruteurs allemands.",
      pillar1: {
        title: "Créateur de CV DIN 5008",
        desc: "Format allemand standardisé (Tabellarischer Lebenslauf) avec niveaux de langue CECRL (A1-C2), photo professionnelle et export PDF haute résolution.",
        tag: "✓ Tabellarischer Lebenslauf",
        cta: "Commencer →",
      },
      pillar2: {
        title: "Studio Dossier Complet (Bewerbungsmappe)",
        desc: "Rassemblez la page de garde (Deckblatt), la lettre de motivation (Anschreiben) et le CV dans un dossier PDF unique conforme aux exigences des consulats et recruteurs.",
        tag: "✓ 3-in-1 PDF Dossier",
        cta: "Assembler le dossier →",
      },
      pillar3: {
        title: "Lettre de motivation IA & Audit ATS",
        desc: "Générez des lettres de motivation (Anschreiben) sur mesure par IA et testez la compatibilité de votre CV avec les filtres ATS allemands.",
        tag: "✓ KI-Anschreiben & Audit ATS",
        cta: "Tester & Générer →",
      },
      pillar4: {
        title: "Académie Allemand A1 Professionnel",
        desc: "Leçons progressives depuis le niveau débutant, axées sur le vocabulaire professionnel, les dialogues d'entretien et la préparation à l'examen Goethe A1.",
        tag: "✓ Goethe A1 Curriculum",
        cta: "Accéder aux cours →",
      },
    },
    comparison: {
      title: "Pourquoi 80% des candidatures étrangères sont rejetées en Allemagne",
      subtitle: "Comparatif entre un CV classique non conforme et un dossier DIN 5008 optimisé.",
      negativeBadge: "CV classique non conforme / Rejeté",
      negativeRate: "Format non conforme",
      negativePoints: [
        "Traductions littérales sans verbes d'action",
        "Chronologie non standard perturbant les ATS",
        "Niveaux de langue flous",
        "Absence d'Anschreiben ou de Deckblatt",
      ],
      positiveBadge: "GermanJobsPro DIN 5008 optimisé",
      positiveRate: "Conforme DIN 5008 & Validé ATS",
      positivePoints: [
        "Formulation allemande rigoureuse en Substantivstil",
        "Mise en page tabulaire 100% DIN 5008 validée ATS",
        "Cadre européen CECRL (A1 à C2)",
        "Dossier complet Bewerbungsmappe 3-en-1",
      ],
    },
    freeValue: {
      badge: "✨ Valeur Gratuite Immédiate — Zéro Risque",
      title: "Commencez 100% Gratuitement : Tout pour Réussir en Allemagne",
      subtitle: "Sans carte bancaire et sans abonnement caché. Créez votre CV DIN 5008, apprenez l'allemand A1 en audio et testez le scanner ATS dès maintenant.",
      card1: {
        badge: "100% Toujours Gratuit",
        title: "Générateur de CV DIN 5008",
        desc: "Créez et exportez votre CV tabulaire selon la norme officielle allemande DIN 5008 attendue par tous les recruteurs.",
        f1: "Structure tabulaire allemande officielle",
        f2: "Export PDF conforme DIN 5008 sans frais",
        f3: "Sauvegarde et modification à tout moment",
        cta: "Créer mon CV gratuit →",
      },
      card2: {
        badge: "Cours Audio 100% Gratuit",
        title: "Académie d'Allemand A1 avec Audio",
        desc: "Plus de 20 leçons interactives alignées sur l'Institut Goethe avec audio natif, dialogues du quotidien et vocabulaire professionnel.",
        f1: "Plus de 20 leçons interactives ouvertes à tous",
        f2: "Prononciation allemande native et phonétique claire",
        f3: "Fiches de grammaire et préparation aux entretiens",
        cta: "Commencer les cours gratuits →",
      },
      card3: {
        badge: "Essai IA Gratuit de Bienvenue",
        title: "Audit ATS & Lettre de Motivation IA",
        desc: "Recevez des crédits d'essai offerts pour auditer votre CV contre les filtres ATS allemands ou rédiger un Anschreiben percutant.",
        f1: "Crédits d'essai offerts dès l'inscription",
        f2: "Vérification de compatibilité ATS avec les offres",
        f3: "Conseils ciblés pour franchir les filtres RH",
        cta: "Tester le scanner ATS →",
      },
      pricingLinkText: "Vous recherchez nos forfaits ? Voir les détails des tarifs et la transparence →",
    },
    howItWorks: {
      badge: "Comment ça marche",
      title: "3 étapes simples vers votre dossier de candidature allemand",
      step1: {
        number: "01",
        title: "1. Conversion instantanée (Import PDF en 1 clic)",
        desc: "Téléversez votre CV PDF actuel ou commencez à zéro. Le système analyse et adapte instantanément vos données selon les normes DIN 5008.",
      },
      step2: {
        number: "02",
        title: "2. Optimisation IA & style allemand (Substantivstil)",
        desc: "Indiquez le poste ciblé pour formuler vos expériences en Substantivstil et générer l'Anschreiben correspondant.",
      },
      step3: {
        number: "03",
        title: "3. Téléchargement & Candidature directe",
        desc: "Téléchargez votre dossier PDF officiel DIN 5008 et postulez directement auprès des entreprises en toute confiance.",
      },
    },
    a1Track: {
      badge: "Parcours Allemand A1 Débutant",
      title: "Maîtrisez l'allemand de A à Z jusqu'au certificat officiel Goethe A1",
      subtitle: "Programme complet pour débutants axé sur la communication professionnelle et les entretiens d'embauche.",
      primaryBtn: "Commencer à apprendre gratuitement",
      secondaryBtn: "Voir tous les cours",
      card1: {
        title: "Progression structurée",
        desc: "Apprentissage progressif des bases grammaticales, conjugaisons indispensables et tournures de phrases clés.",
      },
      card2: {
        title: "Vocabulaire professionnel",
        desc: "Terminologie essentielle pour échanger en entreprise, comprendre vos contrats de travail et réussir vos entretiens.",
      },
      card3: {
        title: "100% gratuit et ouvert",
        desc: "Accès illimité à l'ensemble des leçons et fiches pédagogiques sans aucun frais d'inscription.",
      },
    },
    a1Lessons: {
      badge: "Leçons A1 sélectionnées",
      title: "Dernières leçons d'allemand A1",
      viewAll: "Voir toutes les leçons →",
      lessonPrefix: "Leçon",
      readTime: "5 min de lecture",
      startLesson: "Commencer la leçon",
    },
    jobs: {
      badge: "Offres d'emploi vérifiées en Allemagne",
      title: "Dernières offres publiées aujourd'hui",
      viewAll: "Voir toutes les offres",
      languageLabel: "Langue :",
      apply: "Postuler",
    },
    articles: {
      badge: "Guides de carrière & visa",
      title: "Derniers articles & conseils professionnels",
      viewAll: "Voir tous les articles",
      readMore: "Lire la suite",
    },
    legal: {
      title: "Avis juridique & transparence du service",
      text: "GermanJobsPro est un outil logiciel dédié à la mise en page de documents professionnels selon les normes allemandes DIN 5008 et à la fourniture de ressources d'apprentissage A1. Nous ne sommes ni un cabinet de recrutement, ni un cabinet d'avocats, ni une entité gouvernementale ou consulaire. Nous ne garantissons pas l'obtention d'un emploi ou d'un visa, la décision finale appartenant exclusivement aux autorités compétentes et aux employeurs.",
    },
    faq: {
      badge: "Questions fréquentes",
      title: "Tout ce que vous devez savoir sur les normes allemandes",
      items: [
        {
          question: "Qu'est-ce que la norme DIN 5008 et pourquoi les recruteurs allemands l'exigent-ils ?",
          answer: "La norme DIN 5008 est le standard officiel allemand pour la mise en page des correspondances et CV professionnels. Elle impose une présentation tabulaire stricte (Tabellarischer Lebenslauf) par ordre chronologique inversé, permettant aux recruteurs et aux filtres ATS allemands d'évaluer vos compétences en quelques secondes.",
        },
        {
          question: "Comment fonctionne l'adaptation automatique en 1 clic vers le format DIN 5008 ?",
          answer: "Téléversez simplement votre CV existant au format PDF (dans n'importe quelle langue). Le système l'adapte instantanément, formule vos expériences dans le style nominal allemand (Substantivstil) et génère un document officiel 100% conforme à la norme DIN 5008.",
        },
        {
          question: "Les documents générés sont-ils conformes pour le visa de travail et la Chancenkarte ?",
          answer: "Oui, à 100%. Les dossiers de candidature générés répondent parfaitement aux critères officiels des consulats allemands et de l'Agence fédérale pour l'emploi (Bundesagentur für Arbeit) pour les visas de travail et la carte d'opportunité (Chancenkarte).",
        },
        {
          question: "Quelle est la différence entre un CV simple et un dossier complet (Bewerbungsmappe) ?",
          answer: "En Allemagne, les recruteurs attendent un dossier de candidature complet (Bewerbungsmappe) composé d'une page de garde avec photo (Deckblatt), d'une lettre de motivation ciblée (Anschreiben) et du CV tabulaire (Lebenslauf). GermanJobsPro compile l'ensemble dans un seul PDF harmonieux.",
        },
        {
          question: "Puis-je commencer et utiliser la plateforme gratuitement ?",
          answer: "Oui ! L'inscription est totalement gratuite. Vous pouvez créer, modifier et télécharger votre CV DIN 5008 et accéder au parcours Allemand A1. Pour les fonctionnalités IA avancées, des pass uniques transparents sont proposés sans abonnement.",
        },
      ],
    },
    finalCta: {
      title: "Démarrez votre carrière en Allemagne dès aujourd'hui 🇩🇪",
      subtitle: "Rejoignez des milliers de professionnels qui ont créé un dossier DIN 5008 certifié et décroché des entretiens en Allemagne.",
      primaryBtn: "Créer votre CV allemand gratuit 🇩🇪",
      secondaryBtn: "Parcourir les Emplois Vérifiés 💼",
    },
  },

  ar: {
    meta: {
      title: "GermanJobsPro 🇩🇪 | المنظومة المتكاملة للعمل والاستقرار في ألمانيا (DIN 5008)",
      description: "جهّز ملف ترشيحك الألماني المعتمد (DIN 5008)، أنشئ خطابات دافع Anschreiben بالذكاء الاصطناعي، وافحص توافق ATS وتعلّم الألمانية للمبتدئين A1.",
    },
    hero: {
      badge: "🇩🇪 المنظومة المتكاملة للعمل والاستقرار في ألمانيا",
      headline: {
        prefix: "جهّز ملف ترشيحك الألماني المعتمد ",
        highlight: "(DIN 5008)",
        suffix: " واجتز فلاتر التوظيف باحترافية",
      },
      subheadline: "أنشئ سيرتك الذاتية وفق معيار DIN 5008، ولّد خطابات دافع (Anschreiben) بالذكاء الاصطناعي، اجمع ملف الترشيح المتكامل (Bewerbungsmappe)، وافحص توافق الـ ATS مع مسار تعلم الألمانية A1.",
      primaryCta: "أنشئ سيرتك الذاتية مجاناً 🇩🇪",
      secondaryCta: "مسار تعلم الألمانية A1 📚",
      trustBadges: [
        "معايير DIN 5008 الرسمية",
        "أمان وخصوصية GDPR 100%",
        "دفع لمرة واحدة دون اشتراك دوري خفي",
      ],
    },
    pillars: {
      badge: "منظومة التوظيف الألمانية المتكاملة",
      title: "4 ركائز متكاملة تقودك نحو عقد عملك في ألمانيا",
      subtitle: "أدوات تقنية متخصصة مصممة خصيصاً لاجتياز فلاتر ATS وجذب اهتمام مسؤولي التوظيف الألمان.",
      pillar1: {
        title: "محرر السير الذاتية DIN 5008",
        desc: "تنسيق ألماني قياسي (Tabellarischer Lebenslauf) مع مستويات اللغات الأوروبية CEFR، وإدراج الصورة وتصدير فوري لملف PDF عالي الجودة.",
        tag: "✓ Tabellarischer Lebenslauf",
        cta: "ابدأ الآن ←",
      },
      pillar2: {
        title: "استوديو الملف المتكامل (Bewerbungsmappe)",
        desc: "اجمع صفحة الغلاف الفاخرة (Deckblatt) مع خطاب الدافع (Anschreiben) والسيرة الذاتية (Lebenslauf) في وثيقة PDF موحدة متوافقة مع متطلبات السفارات والشركات.",
        tag: "✓ 3-in-1 PDF Dossier",
        cta: "تجميع الملف ←",
      },
      pillar3: {
        title: "خطاب الدافع وفاحص الـ ATS الذكي",
        desc: "ولّد خطابات دافع (Anschreiben) مخصصة لكل وظيفة بالذكاء الاصطناعي وافحص نسبة توافق سيرتك الذاتية مع فلاتر الشركات الألمانية.",
        tag: "✓ KI-Anschreiben & ATS Audit",
        cta: "فحص وتوليد ←",
      },
      pillar4: {
        title: "أكاديمية الألمانية A1 للعمل",
        desc: "منهاج متسلسل منظم يبدأ من الصفر، يركز على مصطلحات سوق العمل ومحادثات المقابلات الرسمية والتحضير لامتحان Goethe A1.",
        tag: "✓ Goethe A1 Curriculum",
        cta: "فهرس الدروس ←",
      },
    },
    comparison: {
      title: "لماذا تُرفض 80% من طلبات التوظيف الأجنبية؟",
      subtitle: "مقارنة حقيقية توضح الفارق بين السيرة الذاتية التقليدية وملف الترشيح المعتمد بمعيار DIN 5008.",
      negativeBadge: "سيرة عادية / مرفوضة",
      negativeRate: "تنسيق عشوائي معرض للرفض",
      negativePoints: [
        "ترجمة حرفية ركيكة وصياغة سلبية للمهام دون أفعال إنجاز.",
        "تنسيق عشوائي غير متطابق مع معيار DIN 5008 يفشل في فلاتر ATS.",
        "غياب المستويات الأوروبية المحددة للغات (A1-C2).",
        "تقديم سيرة منفصلة بدون خطاب دافع (Anschreiben) أو غلاف (Deckblatt).",
      ],
      positiveBadge: "ملف GermanJobsPro المعتمد",
      positiveRate: "تنسيق معتمد ومطابق لـ DIN 5008",
      positivePoints: [
        "صياغة احترافية بأسلوب الأسماء الفعلية الألمانية (Substantivstil).",
        "تنسيق جدولي قياسي 100% متوافق مع DIN 5008 وأنظمة ATS.",
        "تحديد دقيق لمستويات اللغات الأوروبية (Muttersprache, C1, B2, A1).",
        "حزمة ترشيح متكاملة (Deckblatt + Anschreiben + Lebenslauf).",
      ],
    },
    freeValue: {
      badge: "✨ قيمة مجانية فورية بدون أي مخاطرة",
      title: "ابدأ مجاناً 100% اليوم: كل ما تحتاجه للانطلاق في ألمانيا",
      subtitle: "بدون بطاقة بنكية وبدون اشتراكات مخفية. صمم سيرتك الألمانية، تعلم الألمانية A1 بالصوت، وجرّب فحص الـ ATS فوراً.",
      card1: {
        badge: "مجاني دائماً 100%",
        title: "منشئ السيرة الذاتية DIN 5008",
        desc: "أنشئ سيرتك الذاتية وفق المعيار الألماني الرسمي DIN 5008 بتنسيق جدول احترافي Tabellarischer Lebenslauf معترف به في كافة الشركات.",
        f1: "تنسيق متوافق مع معايير الشركات الألمانية",
        f2: "تحميل وطباعة بتنسيق PDF قياسي مجاناً",
        f3: "حفظ وتعديل بياناتك في أي وقت بسهولة",
        cta: "أنشئ سيرتك مجاناً ←",
      },
      card2: {
        badge: "أكاديمية مجانية بالكامل",
        title: "مسار دروس الألمانية A1 بالصوت",
        desc: "أكثر من 20 درساً تفاعلياً متوافقاً مع معايير معهد غوته للمبتدئين مع نطق صوتي بشري نقي ونطق صوتي مرشد ومفردات سوق العمل.",
        f1: "20+ درساً تفاعلياً مجانياً ومتاحاً للجميع",
        f2: "نطق ألماني بشري عالي النقاء لكل كلمة وجملة",
        f3: "شروحات مبسطة وقواعد نحوية وتدريبات عملية",
        cta: "ابدأ تعلم الألمانية مجاناً ←",
      },
      card3: {
        badge: "تجربة ذكاء اصطناعي ترحيبية",
        title: "فاحص ATS ومولد خطابات الدافع",
        desc: "احصل على رصيد ترحيبي مجاني لفحص سيرتك الذاتية وتوافقها مع خوارزميات الشركات وتوليد خطاب دافع ألماني Anschreiben مخصص.",
        f1: "رصيد ترحيبي مجاني فور إنشاء الحساب",
        f2: "فحص توافق السيرة مع إعلانات الوظائف الألمانية",
        f3: "اقتراحات فورية لتجاوز أنظمة الفرز الآلي",
        cta: "جرّب الفاحص مجاناً ←",
      },
      pricingLinkText: "هل تبحث عن باقاتنا وترخيص المحترفين؟ استعرض تفاصيل الأسعار والشفافية التامة ←",
    },
    howItWorks: {
      badge: "كيف تعمل المنصة",
      title: "3 خطوات بسيطة للحصول على ملف ترشيح ألماني متكامل",
      step1: {
        number: "01",
        title: "1. تحويل فوري (1-Click PDF)",
        desc: "ارفع سيرتك الذاتية الحالية (PDF) بأي لغة، ليقوم النظام فوراً بتكييفها وصياغة خبراتك وفق معايير DIN 5008.",
      },
      step2: {
        number: "02",
        title: "2. التخصيص والصياغة الألمانية",
        desc: "حدد الوظيفة المستهدفة ليتم تحسين الصياغة إلى Substantivstil وتوليد خطاب الدافع (Anschreiben) المطابق.",
      },
      step3: {
        number: "03",
        title: "3. التنزيل والتقديم المباشر",
        desc: "حمّل ملف PDF الرسمي المتوافق مع DIN 5008 وقدّم طلبك مباشرة للشركات الألمانية بثقة كاملة.",
      },
    },
    a1Track: {
      badge: "مسار تعلم الألمانية للمبتدئين A1",
      title: "تعلّم الألمانية من الصفر حتى اجتياز امتحان Goethe A1 بنجاح",
      subtitle: "منهاج تدريبي مبسط للناطقين بالعربية، يركز على المحادثات اليومية ومفردات سوق العمل الألمانية لتمكينك من اجتياز المقابلات والاندماج المهني.",
      primaryBtn: "ابدأ التعلم الآن مجاناً",
      secondaryBtn: "تصفح الفهرس الشامل",
      card1: {
        title: "دروس متسلسلة خطوة بخطوة",
        desc: "شرح مبسط لقواعد الأبجدية، تصريف الأفعال الأساسية، وتركيب الجمل للمبتدئين وفق تسلسل تدريجي.",
      },
      card2: {
        title: "مصطلحات سوق العمل الألمانية",
        desc: "مفردات موجهة خصيصاً للتواصل في بيئة العمل، وفهم عقود التوظيف والـ Ausbildung والمقابلات.",
      },
      card3: {
        title: "متاح مجاناً 100% للجميع",
        desc: "وصول كامل ومفتوح لكافة الشروحات والنصوص التعليمية لمساعدتك في بناء مستقبلك في ألمانيا.",
      },
    },
    a1Lessons: {
      badge: "دروس مختارة من مسار A1",
      title: "أحدث الدروس التدريبية المتاحة الآن",
      viewAll: "عرض كل دروس A1 ←",
      lessonPrefix: "الدرس",
      readTime: "5 دقائق قراءة",
      startLesson: "ابدأ الدرس",
    },
    jobs: {
      badge: "فرص عمل حصرية في ألمانيا",
      title: "أحدث الوظائف المنشورة اليوم",
      viewAll: "عرض جميع الوظائف",
      languageLabel: "اللغة:",
      apply: "تقديم مباشر",
    },
    articles: {
      badge: "دليل العمل والهجرة لألمانيا",
      title: "أحدث المقالات والإرشادات المهنية",
      viewAll: "تصفح جميع المقالات",
      readMore: "اقرأ المزيد",
    },
    legal: {
      title: "إخلاء المسؤولية القانونية",
      text: "منصة GermanJobsPro هي أداة برمجية رقمية لتنسيق المستندات المهنية وإعداد ملفات الترشيح وفق معايير DIN 5008 الألمانية وتوفير مصادر تعليمية للمستوى A1. المنصة ليست وكالة توظيف أو مكتب محاماة أو جهة حكومية أو تمثيلية قنصلية، ولا تضمن الحصول على وظيفة أو تأشيرة، حيث يعود القرار النهائي حصرياً للجهات المختصة وأصحاب العمل.",
    },
    faq: {
      badge: "الأسئلة الشائعة",
      title: "كل ما تود معرفته عن التقديم والمعايير الألمانية",
      items: [
        {
          question: "ما هو معيار DIN 5008 ولماذا تطلبه الشركات ومسؤولو التوظيف في ألمانيا؟",
          answer: "معيار DIN 5008 هو المعيار الرسمي القياسي في ألمانيا لكتابة وتنسيق المستندات المهنية والمراسلات التجارية. يتبع هيكلاً جدولياً دقيقاً (Tabellarischer Lebenslauf) بترتيب زمني عكسي وهوامش ومسافات محددة تتيح لمسؤولي التوظيف وفلاتر ATS الألمانية فحص ملفك في أقل من 30 ثانية بدون أي تشويه في البيانات.",
        },
        {
          question: "كيف تعمل ميزة التحويل الفوري والتكييف الذكي (1-Click PDF to DIN 5008)؟",
          answer: "بكل بساطة، يمكنك رفع سيرتك الذاتية الحالية (PDF) بأي لغة، ليقوم النظام فوراً بتكييفها وصياغة خبراتك بالأسلوب الاسمي الألماني (Substantivstil) واستخراج وثيقة رسمية متوافقة 100% مع معايير DIN 5008 جاهزة للتعديل والتحميل.",
        },
        {
          question: "هل المستندات الناتجة متوافقة مع متطلبات تأشيرة العمل وبطاقة الفرصة (Chancenkarte)؟",
          answer: "نعم 100%. ملفات الترشيح (Bewerbungsunterlagen) المنشأة عبر المنصة مطابقة تماماً للمتطلبات الرسمية للسفارات الألمانية ووكالة العمل الفيدرالية (Bundesagentur für Arbeit)، بما في ذلك صفحة الغلاف (Deckblatt) والبيانات الشخصية الكاملة وتوثيق المؤهلات.",
        },
        {
          question: "ما الفرق بين السيرة الذاتية العادية والملف المتكامل (Bewerbungsmappe)؟",
          answer: "في سوق العمل الألماني، تزيد نسبة القبول بشكل هائل عند تقديم ملف ترشيح متكامل (Bewerbungsmappe) يضم: 1) صفحة الغلاف الفاخرة مع الصورة (Deckblatt)، 2) خطاب الدافع الموجه للوظيفة (Anschreiben)، 3) السيرة الذاتية القياسية (Lebenslauf). منصتنا تتيح لك إنشاء وتحميل هذه الحزمة بملف PDF واحد متناسق.",
        },
        {
          question: "هل يمكنني البدء واستخدام المنصة مجاناً؟",
          answer: "نعم! يمكنك التسجيل مجاناً وإنشاء وتعديل وتنزيل سيرتك الذاتية بتنسيق DIN 5008 وتصفح مسار الألمانية A1 واستكشاف الوظائف دون أي التزام مالي. كما تتوفر باقات مدفوعة لمرة واحدة دون أي اشتراكات متكررة خفية.",
        },
      ],
    },
    finalCta: {
      title: "ابدأ خطوتك الأولى نحو مستقبلك المهني في ألمانيا اليوم 🇩🇪",
      subtitle: "انضم إلى آلاف المهنيين الذين أنشأوا ملفات ترشيح ألمانية متكاملة واجتازوا فلاتر ATS بنجاح.",
      primaryBtn: "أنشئ سيرتك الذاتية مجاناً 🇩🇪",
      secondaryBtn: "تصفح أحدث الوظائف الشاغرة 💼",
    },
  },

  de: {
    meta: {
      title: "GermanJobsPro 🇩🇪 | DIN 5008 Bewerbung, KI-Anschreiben & ATS-Audit",
      description: "Offizielle DIN 5008 Bewerbungsmappe, KI-Anschreiben, ATS-Audit und Deutsch A1 Lernpfad für Ihre Karriere in Deutschland.",
    },
    hero: {
      badge: "🇩🇪 Die Komplettplattform für Bewerbung & Karriere in Deutschland",
      headline: {
        prefix: "Erstellen Sie Ihre DIN 5008 Bewerbung & ",
        highlight: "bestehen Sie ATS-Filter",
        suffix: " professionell",
      },
      subheadline: "Erstellen Sie DIN 5008 Lebensläufe, KI-Anschreiben, vollständige Bewerbungsmappen, präzise ATS-Audits und nutzen Sie den Deutsch A1 Sprachkurs für Ihren beruflichen Erfolg.",
      primaryCta: "Kostenlosen Lebenslauf erstellen 🇩🇪",
      secondaryCta: "Deutsch A1 Lernkurs 📚",
      trustBadges: [
        "Offizieller DIN 5008 Standard",
        "100% DSGVO / GDPR konform",
        "Einmalzahlung, Kein verstecktes Abo",
      ],
    },
    pillars: {
      badge: "4 Leistungsstarke Kernmodule",
      title: "4 Kernmodule für Ihren Bewerbungserfolg",
      subtitle: "Entwickelt, um deutsche ATS-Systeme zu passieren und Personalverantwortliche zu überzeugen.",
      pillar1: {
        title: "DIN 5008 Lebenslauf-Editor",
        desc: "Standardisierter tabellarischer Lebenslauf mit GeR-Sprachniveaus (A1-C2), Bewerbungsfoto und Vektor-PDF-Export.",
        tag: "✓ Tabellarischer Lebenslauf",
        cta: "Jetzt starten →",
      },
      pillar2: {
        title: "Bewerbungsmappe Studio",
        desc: "Kombinieren Sie Deckblatt, Anschreiben und Lebenslauf zu einer druckreifen, offiziellen PDF-Bewerbungsmappe.",
        tag: "✓ 3-in-1 PDF Dossier",
        cta: "Mappe erstellen →",
      },
      pillar3: {
        title: "KI-Anschreiben & ATS-Audit Studio",
        desc: "Erstellen Sie maßgeschneiderte Anschreiben nach DIN 5008 und prüfen Sie die Passgenauigkeit Ihres Lebenslaufs mit deutschen ATS-Scannern.",
        tag: "✓ KI-Anschreiben & ATS Audit",
        cta: "Prüfen & erstellen →",
      },
      pillar4: {
        title: "Deutsch A1 Berufsakademie",
        desc: "Strukturierte Lektionen von Grund auf mit berufsbezogenem Wortschatz, Dialogen und Goethe-Zertifikat A1 Vorbereitung.",
        tag: "✓ Goethe A1 Curriculum",
        cta: "Zu den Lektionen →",
      },
    },
    comparison: {
      title: "Warum 80% ausländischer Bewerbungen scheitern",
      subtitle: "Der entscheidende Unterschied zwischen einem Standard-Lebenslauf und einer DIN 5008 Bewerbung.",
      negativeBadge: "Standard-CV / Abgelehnt",
      negativeRate: "Formatierungsrisiko",
      negativePoints: [
        "Wörtliche Übersetzungen ohne aktive deutsche Handlungssubstantive.",
        "Nicht-standardisiertes Layout mit Parsing-Fehlern im ATS.",
        "Fehlende oder unklare offizielle GeR-Sprachniveaus (A1–C2).",
        "Isolierter Lebenslauf ohne Anschreiben oder Deckblatt.",
      ],
      positiveBadge: "GermanJobsPro DIN 5008",
      positiveRate: "DIN 5008 Standard & ATS-geprüft",
      positivePoints: [
        "Präziser deutscher Substantivstil mit aktiven Handlungssubstantiven.",
        "100% DIN 5008 tabellarischer Aufbau für fehlerfreie ATS-Erkennung.",
        "Exakte Einstufung nach europäischem Referenzrahmen (A1 bis C2).",
        "Vollständige Bewerbungsmappe 3-in-1 (Deckblatt + Anschreiben + Lebenslauf).",
      ],
    },
    freeValue: {
      badge: "✨ 100% Kostenloser Sofortwert — Ohne Risiko",
      title: "Starten Sie kostenlos: Alles für Bewerbung & Sprachstart in Deutschland",
      subtitle: "Keine Kreditkarte, keine Abofallen. DIN 5008 Lebenslauf erstellen, Deutsch A1 mit Audio lernen und ATS-Audit sofort testen.",
      card1: {
        badge: "Dauerhaft 100% Kostenlos",
        title: "DIN 5008 Lebenslauf-Generator",
        desc: "Erstellen und exportieren Sie Ihren tabellarischen Lebenslauf nach offizieller deutscher DIN 5008 Norm – direkt von deutschen Arbeitgebern anerkannt.",
        f1: "Vollständig konform mit deutschen HR-Standards",
        f2: "Kostenloser PDF-Export nach DIN 5008",
        f3: "Jederzeit online bearbeiten und speichern",
        cta: "Lebenslauf kostenlos erstellen →",
      },
      card2: {
        badge: "100% Kostenloser Sprachkurs",
        title: "A1 Deutsch-Akademie mit Audio & Phonetik",
        desc: "Über 20 interaktive Lektionen nach Goethe-Standard mit nativer Sprachausgabe für Alltag, Behörden und Vorstellungsgespräche in Deutschland.",
        f1: "Über 20 interaktive Lektionen dauerhaft offen",
        f2: "Kristallklare deutsche Aussprache per Klick",
        f3: "Grammatik-Karten und Übungen für den Berufsstart",
        cta: "Kostenlos Deutsch lernen →",
      },
      card3: {
        badge: "Kostenloses KI-Startguthaben",
        title: "ATS-Audit & KI-Anschreiben Generator",
        desc: "Testen Sie das deutsche ATS-Prüfungstool und erstellen Sie ein maßgeschneidertes Anschreiben mit kostenlosem Startguthaben.",
        f1: "Kostenloses Startguthaben bei Registrierung",
        f2: "Sofortige ATS-Prüfung gegen Stellenanzeigen",
        f3: "Konkrete Optimierungsvorschläge für HR-Filter",
        cta: "ATS-Checker kostenlos testen →",
      },
      pricingLinkText: "Suchen Sie unsere PRO-Pässe? Alle Preisdetails & Transparenz ansehen →",
    },
    howItWorks: {
      badge: "So funktioniert's",
      title: "In 3 einfachen Schritten zum perfekten Bewerbungspaket",
      step1: {
        number: "01",
        title: "1. Sofort-Konvertierung (1-Klick PDF)",
        desc: "Laden Sie Ihr bestehendes PDF hoch oder starten Sie neu. Die Daten werden sofort analysiert und an DIN 5008 angepasst.",
      },
      step2: {
        number: "02",
        title: "2. KI-Optimierung & Substantivstil",
        desc: "Wählen Sie Ihre Zielposition. Die KI optimiert Ihre Formulierungen im Substantivstil und erstellt das Anschreiben.",
      },
      step3: {
        number: "03",
        title: "3. Herunterladen & Bewerben",
        desc: "Laden Sie Ihr DIN 5008 PDF-Dossier herunter und bewerben Sie sich direkt und selbstbewusst bei deutschen Unternehmen.",
      },
    },
    a1Track: {
      badge: "Deutsch A1 Lernpfad für Einsteiger",
      title: "Deutsch lernen von Null bis zum Goethe-Zertifikat A1",
      subtitle: "Strukturierter Sprachkurs mit Fokus auf berufsbezogenen Wortschatz und sichere Alltagskommunikation.",
      primaryBtn: "Jetzt kostenlos lernen",
      secondaryBtn: "Alle Lektionen",
      card1: {
        title: "Schritt-für-Schritt Struktur",
        desc: "Verständliche Erklärungen zu Grammatik, Verben und Satzbau von Grund auf.",
      },
      card2: {
        title: "Berufsbezogener Wortschatz",
        desc: "Gezielter Wortschatz für Arbeitsverträge, Vorstellungsgespräche und Bürokommunikation.",
      },
      card3: {
        title: "100% Kostenlos & Offen",
        desc: "Vollständiger freier Zugang zu allen Lektionen und Materialien ohne Abonnement.",
      },
    },
    a1Lessons: {
      badge: "Ausgewählte A1-Lektionen",
      title: "Neueste Deutsch A1 Lektionen",
      viewAll: "Alle A1-Lektionen ansehen →",
      lessonPrefix: "Lektion",
      readTime: "5 Min. Lesezeit",
      startLesson: "Lektion starten",
    },
    jobs: {
      badge: "Aktuelle Stellenangebote",
      title: "Neueste Stellenanzeigen",
      viewAll: "Alle Jobs ansehen",
      languageLabel: "Sprache:",
      apply: "Bewerben",
    },
    articles: {
      badge: "Ratgeber & Karriere-Guides",
      title: "Neueste Ratgeber-Artikel",
      viewAll: "Alle Artikel lesen",
      readMore: "Weiterlesen",
    },
    legal: {
      title: "Rechtlicher Hinweis & Transparenz",
      text: "GermanJobsPro ist eine digitale Softwarelösung zur Erstellung professioneller Bewerbungsunterlagen nach DIN 5008 und bietet Lernmaterialien für Deutsch A1. Wir sind keine Arbeitsvermittlung, Anwaltskanzlei oder Behörde. Wir garantieren keine Anstellung oder Visaerteilung; Entscheidungen obliegen allein den zuständigen Behörden und Arbeitgebern.",
    },
    faq: {
      badge: "Häufige Fragen",
      title: "Alles, was Sie über deutsche Bewerbungsstandards wissen müssen",
      items: [
        {
          question: "Was ist die DIN 5008 Norm und warum verlangen deutsche Arbeitgeber sie?",
          answer: "Die DIN 5008 ist der offizielle deutsche Standard für Schreib- und Gestaltungsregeln in der Geschäftskorrespondenz. Sie garantiert eine übersichtliche, tabellarische Struktur (Tabellarischer Lebenslauf), die von deutschen Personalern und ATS-Systemen lückenlos verarbeitet werden kann.",
        },
        {
          question: "Wie funktioniert die 1-Klick Konvertierung & DIN 5008 Optimierung?",
          answer: "Laden Sie einfach Ihren bestehenden Lebenslauf als PDF in beliebiger Sprache hoch. Das System passt ihn sofort an, formuliert Ihre Erfahrungen im deutschen Substantivstil und erstellt ein 100% DIN 5008 konformes Dokument.",
        },
        {
          question: "Sind die Dokumente für das Visum und die Chancenkarte geeignet?",
          answer: "Ja, zu 100%. Die erstellten Bewerbungsunterlagen erfüllen sämtliche Anforderungen der Bundesagentur für Arbeit und der deutschen Auslandsvertretungen für Visumanträge und die Chancenkarte.",
        },
        {
          question: "Was ist der Unterschied zwischen einem einfachen Lebenslauf und einer Bewerbungsmappe?",
          answer: "In Deutschland bevorzugen Arbeitgeber eine vollständige Bewerbungsmappe bestehend aus Deckblatt mit Bewerbungsfoto, individuellem Anschreiben und tabellarischem Lebenslauf. GermanJobsPro generiert diese gesamte Mappe aus einem Guss.",
        },
        {
          question: "Kann ich die Plattform kostenlos nutzen?",
          answer: "Ja! Die Registrierung ist kostenlos. Sie können Ihren DIN 5008 Lebenslauf erstellen, bearbeiten, herunterladen und den Deutsch A1 Kurs nutzen. Zudem gibt es faire Einmalzahlungen ohne Abofallen.",
        },
      ],
    },
    finalCta: {
      title: "Starten Sie Ihre Karriere in Deutschland noch heute 🇩🇪",
      subtitle: "Erstellen Sie Ihr professionelles DIN 5008 Bewerbungspaket und überzeugen Sie deutsche Arbeitgeber.",
      primaryBtn: "Kostenlosen Lebenslauf erstellen 🇩🇪",
      secondaryBtn: "Verifizierte Jobs durchsuchen 💼",
    },
  },

  en: {
    meta: {
      title: "GermanJobsPro 🇩🇪 | Certified DIN 5008 German Application & Career Platform",
      description: "Build certified DIN 5008 German CVs, AI cover letters (Anschreiben), compile complete dossiers, run ATS audits, and learn German A1.",
    },
    hero: {
      badge: "🇩🇪 The Complete Career & Application Platform for Germany",
      headline: {
        prefix: "Prepare Your Certified German Application ",
        highlight: "(DIN 5008)",
        suffix: " & Beat ATS Filters Professionally",
      },
      subheadline: "Build certified DIN 5008 CVs, craft tailored AI cover letters (Anschreiben), compile complete Bewerbungsmappe dossiers, run ATS audits, and master German A1.",
      primaryCta: "Create Your Free German CV 🇩🇪",
      secondaryCta: "German A1 Course Track 📚",
      trustBadges: [
        "Official DIN 5008 Standards",
        "100% GDPR Privacy & Security",
        "One-Time Payment, No Hidden Subscriptions",
      ],
    },
    pillars: {
      badge: "4 Core Career Modules",
      title: "4 Core Pillars for Your Job Application Success",
      subtitle: "Specialized tools engineered to pass strict German ATS algorithms and impress hiring teams.",
      pillar1: {
        title: "DIN 5008 CV Builder",
        desc: "Standard German tabular layout with CEFR language mapping (A1-C2), professional portrait photo alignment, and vector PDF export.",
        tag: "✓ Tabellarischer Lebenslauf",
        cta: "Start →",
      },
      pillar2: {
        title: "Complete Dossier Studio",
        desc: "Compile a polished Cover Page (Deckblatt), tailored Cover Letter (Anschreiben), and CV into 1 unified multi-page German dossier.",
        tag: "✓ 3-in-1 PDF Dossier",
        cta: "Compile →",
      },
      pillar3: {
        title: "AI Cover Letter & Smart ATS Checker",
        desc: "Generate tailored German cover letters (Anschreiben) with AI and audit your CV's match score against German recruiter ATS filters.",
        tag: "✓ AI Anschreiben & ATS Audit",
        cta: "Audit & Generate →",
      },
      pillar4: {
        title: "Career German A1 Academy",
        desc: "Structured, sequenced lessons covering workplace vocabulary, daily workplace dialogues, and Goethe A1 exam preparation.",
        tag: "✓ Goethe A1 Curriculum",
        cta: "Lessons →",
      },
    },
    comparison: {
      title: "Why 80% of Foreign Applications Get Rejected",
      subtitle: "A side-by-side breakdown between a generic resume and a compliant DIN 5008 German dossier.",
      negativeBadge: "Generic CV / Rejected",
      negativeRate: "Non-Compliant Format",
      negativePoints: [
        "Literal translations lacking German active action nouns.",
        "Unstructured timeline causing ATS parsing errors.",
        "Missing CEFR language proficiency standards.",
        "No cover letter (Anschreiben) or cover page (Deckblatt).",
      ],
      positiveBadge: "GermanJobsPro DIN 5008",
      positiveRate: "DIN 5008 & ATS-Optimized",
      positivePoints: [
        "Flawless German Substantivstil action-oriented formulations.",
        "100% DIN 5008 standard tabular structure passing all ATS.",
        "Official CEFR language framework mapping (A1 to C2).",
        "Complete Bewerbungsmappe (Cover page, letter, and resume).",
      ],
    },
    freeValue: {
      badge: "✨ Instant Free Value — Zero Risk",
      title: "Start 100% Free: Everything You Need to Land Jobs in Germany",
      subtitle: "No credit card required, no subscription traps. Build your DIN 5008 CV, learn German A1 with native audio, and test the ATS scanner right away.",
      card1: {
        badge: "100% Always Free",
        title: "German DIN 5008 Resume Builder",
        desc: "Build and export your tabular German CV adhering to the official DIN 5008 employment standard required by German companies.",
        f1: "100% aligned with German employer standards",
        f2: "Free PDF export formatted to DIN 5008",
        f3: "Save and edit your data anytime",
        cta: "Create Free CV →",
      },
      card2: {
        badge: "100% Free Audio Course",
        title: "German A1 Career Academy with Audio",
        desc: "Over 20+ Goethe-aligned interactive lessons with crystal-clear native pronunciation, dialogues, and vocabulary for life and work in Germany.",
        f1: "20+ comprehensive interactive lessons open to all",
        f2: "Crystal-clear native German pronunciation audio",
        f3: "Grammar breakdown cards & job-ready vocab",
        cta: "Start Free Lessons →",
      },
      card3: {
        badge: "Free AI Welcome Trial",
        title: "German ATS Audit & AI Cover Letter",
        desc: "Get complimentary trial credits to scan your resume against German ATS filters or generate a tailored Anschreiben for your dream job.",
        f1: "Complimentary trial credits upon registration",
        f2: "Instant ATS compatibility match vs German job ads",
        f3: "Actionable keyword & phrasing recommendations",
        cta: "Try Free ATS Scanner →",
      },
      pricingLinkText: "Looking for our pricing plans? View pricing & transparency details →",
    },
    howItWorks: {
      badge: "How It Works",
      title: "3 Simple Steps to Your Complete German Application",
      step1: {
        number: "01",
        title: "1. Instant Conversion (1-Click PDF)",
        desc: "Upload your current PDF resume or start fresh. The system instantly extracts and adapts your background to DIN 5008.",
      },
      step2: {
        number: "02",
        title: "2. AI Polish & Substantivstil",
        desc: "Choose your target role. AI polishes all experience bullets in Substantivstil and drafts the cover letter.",
      },
      step3: {
        number: "03",
        title: "3. Download & Apply",
        desc: "Download your certified DIN 5008 PDF dossier and apply directly to German employers with full confidence.",
      },
    },
    a1Track: {
      badge: "German A1 Beginner Learning Track",
      title: "Master German from Scratch to Your Official Goethe A1 Certificate",
      subtitle: "Comprehensive beginner curriculum tailored for fast-track communication, workplace vocabulary, and visa exam success.",
      primaryBtn: "Start Learning Free",
      secondaryBtn: "Browse All Lessons",
      card1: {
        title: "Structured Sequence",
        desc: "Step-by-step grammar explanations, essential verbs, and sentence patterns.",
      },
      card2: {
        title: "Workplace Vocab",
        desc: "Targeted vocabulary for job contracts, employer communications, and office dialogues.",
      },
      card3: {
        title: "100% Free & Open",
        desc: "Full open access to all lessons and preparation materials without subscriptions.",
      },
    },
    a1Lessons: {
      badge: "Featured A1 Lessons",
      title: "Latest German A1 Lessons",
      viewAll: "View all A1 lessons →",
      lessonPrefix: "Lesson",
      readTime: "5 min read",
      startLesson: "Start Lesson",
    },
    jobs: {
      badge: "Verified Jobs in Germany",
      title: "Latest Job Vacancies",
      viewAll: "View all jobs",
      languageLabel: "Language:",
      apply: "Apply",
    },
    articles: {
      badge: "Career Guides & Visa Insights",
      title: "Latest Articles & Guides",
      viewAll: "View all articles",
      readMore: "Read more",
    },
    legal: {
      title: "Legal Disclaimer & Service Transparency",
      text: "GermanJobsPro is a specialized digital software tool for formatting professional documents according to German DIN 5008 standards and providing educational A1 learning resources. We are not an employment agency, law firm, recruitment agency, or governmental/immigration entity. We do not guarantee employment or visas, as final decisions rest solely with relevant authorities and employers.",
    },
    faq: {
      badge: "Frequently Asked Questions",
      title: "Everything You Need to Know About German Application Standards",
      items: [
        {
          question: "What is the DIN 5008 standard and why do German recruiters require it?",
          answer: "DIN 5008 is the official German industry standard for business correspondence and resumes. It enforces a strict tabular layout (Tabellarischer Lebenslauf) in reverse chronological order, allowing German recruiters and ATS filters to evaluate your qualifications in seconds.",
        },
        {
          question: "How does the 1-Click PDF to DIN 5008 Auto-Adapt work?",
          answer: "Simply upload your existing CV in PDF format (in any language). The system instantly adapts it, crafts your experience in German Substantivstil, and generates an official document 100% compliant with DIN 5008 standards.",
        },
        {
          question: "Are the generated documents compliant with German Work Visa & Opportunity Card (Chancenkarte)?",
          answer: "Yes, 100%. The application dossiers created with GermanJobsPro fully meet the strict requirements of the German Federal Employment Agency (Bundesagentur für Arbeit) and embassies for work visas and Opportunity Cards.",
        },
        {
          question: "What is the difference between a simple CV and a Complete Dossier (Bewerbungsmappe)?",
          answer: "In Germany, hiring managers expect a complete application package (Bewerbungsmappe) containing a Cover Page with photo (Deckblatt), tailored Cover Letter (Anschreiben), and Tabular CV (Lebenslauf). Our platform compiles this into a single elegant PDF.",
        },
        {
          question: "Can I start and use the platform for free?",
          answer: "Yes! Registration is completely free. You can build, edit, and download your DIN 5008 CV and access the German A1 track. When you need extended AI power, transparent one-time passes are available without subscriptions.",
        },
      ],
    },
    finalCta: {
      title: "Take Your First Step Toward a Career in Germany Today 🇩🇪",
      subtitle: "Join thousands of candidates who generated certified DIN 5008 dossiers and landed German interviews.",
      primaryBtn: "Create Your Free German CV 🇩🇪",
      secondaryBtn: "Browse Verified Jobs 💼",
    },
  },
};

export function getLandingContent(locale: string): LandingContent {
  const supported: SupportedLocale =
    locale === 'ar' || locale === 'de' || locale === 'fr' || locale === 'en'
      ? locale
      : 'en';
  return LANDING_CONTENT[supported];
}
