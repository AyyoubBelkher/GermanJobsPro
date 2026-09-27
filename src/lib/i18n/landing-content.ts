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
  pricing: {
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
        suffix: " & suivez vos offres par IA",
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
        title: "Suivi des Candidatures (Pipeline)",
        desc: "Organisez vos offres sauvegardées, suivez le statut de vos candidatures, vos entretiens et vos négociations salariales dans un pipeline dédié.",
        tag: "✓ Saved → Interview → Offer",
        cta: "Voir le suivi →",
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
    pricing: {
      badge: "Tarifs clairs",
      title: "Tarifs clairs • Aucun abonnement récurrent masqué",
      subtitle: "Choisissez la formule adaptée à votre rythme de recherche d'emploi, avec paiement unique.",
      starter: {
        category: "Formule gratuite",
        title: "Starter",
        desc: "Création d'un CV DIN 5008, recherche d'offres et accès au cours A1.",
        price: "$0",
        period: "/ toujours",
        f1: "Création d'un CV conforme DIN 5008",
        f2: "Recherche et enregistrement d'offres en Allemagne",
        f3: "Accès complet au cours d'allemand A1",
        f4: "3 crédits IA initiaux offerts",
        f5: "Compilateur Bewerbungsmappe 3-en-1",
        cta: "Commencer gratuitement",
      },
      quickSprint: {
        category: "Pass Sprint 30 jours",
        title: "Quick Sprint",
        desc: "Validité 30 jours, 20 requêtes IA/jour, audit ATS, exports PDF illimités.",
        price: "$9.99",
        period: "/ 30 jours",
        subtext: "Paiement unique • Activation immédiate",
        f1: "Validité complète de 30 jours",
        f2: "20 requêtes IA quotidiennes (Fair Use)",
        f3: "Audit de conformité ATS allemand",
        f4: "Exports PDF officiels illimités",
        cta: "Choisir Quick Sprint",
      },
      proJobPass: {
        popularBadge: "Le plus populaire • Économisez 35%",
        category: "Pass Carrière Complet",
        title: "PRO Job Pass",
        desc: "Couverture complète du cycle d'embauche (90 jours), compilateur Bewerbungsmappe, suivi des candidatures.",
        price: "$19.99",
        period: "/ 90 jours",
        subtext: "Paiement unique • Aucun abonnement masqué",
        f1: "90 jours complets couvrant le cycle de recrutement",
        f2: "Suivi complet des candidatures (Pipeline Tracker)",
        f3: "Compilateur Bewerbungsmappe 3-en-1",
        f4: "20 requêtes IA prioritaires par jour",
        f5: "Lettres de motivation personnalisées par offre",
        cta: "Obtenir PRO Job Pass",
      },
      comparisonLink: "Voir le comparatif détaillé des fonctionnalités →",
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
        title: "3. Téléchargement & suivi de vos candidatures",
        desc: "Téléchargez votre dossier PDF officiel DIN 5008 et suivez vos candidatures et entretiens depuis votre tableau de bord.",
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
          answer: "Oui ! L'inscription est totalement gratuite. Vous pouvez créer, modifier et télécharger votre CV DIN 5008 et accéder au parcours Allemand A1. Pour les fonctionnalités IA avancées ou le suivi des candidatures, des pass uniques transparents sont proposés sans abonnement.",
        },
      ],
    },
    finalCta: {
      title: "Démarrez votre carrière en Allemagne dès aujourd'hui 🇩🇪",
      subtitle: "Rejoignez des milliers de professionnels qui ont créé un dossier DIN 5008 certifié et décroché des entretiens en Allemagne.",
      primaryBtn: "Créer votre CV allemand gratuit 🇩🇪",
      secondaryBtn: "Voir les tarifs (sans abonnement)",
    },
  },

  ar: {
    meta: {
      title: "GermanJobsPro 🇩🇪 | المنظومة المتكاملة للعمل والاستقرار في ألمانيا (DIN 5008)",
      description: "جهّز ملف ترشيحك الألماني المعتمد (DIN 5008)، أنشئ خطابات دافع Anschreiben بالذكاء الاصطناعي، وتابع وظائفك عبر متتبع التقديمات وتعلّم الألمانية للمبتدئين A1.",
    },
    hero: {
      badge: "🇩🇪 المنظومة المتكاملة للعمل والاستقرار في ألمانيا",
      headline: {
        prefix: "جهّز ملف ترشيحك الألماني المعتمد ",
        highlight: "(DIN 5008)",
        suffix: " وتابع وظائفك باحترافية",
      },
      subheadline: "أنشئ سيرتك الذاتية وفق معيار DIN 5008، ولّد خطابات دافع (Anschreiben) بالذكاء الاصطناعي، اجمع ملف الترشيح المتكامل (Bewerbungsmappe)، فحص الـ ATS، وتتبع تقديماتك ومقابلاتك مع مسار تعلم الألمانية A1.",
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
        title: "لوحة متابعة التقديمات (Pipeline)",
        desc: "نظم وظائفك المحفوظة، وتتبع مراحل التقديم، ومواعيد المقابلات، وملاحظات الرواتب عبر خط أنابيب وظيفي احترافي.",
        tag: "✓ Saved → Interview → Offer",
        cta: "لوحة المتابعة ←",
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
    pricing: {
      badge: "باقات واضحة وشفافة",
      title: "دفع لمرة واحدة • بدون أي اشتراك دوري خفي",
      subtitle: "اختر الباقة المناسبة لمرحلة بحثك عن عمل في ألمانيا، بدون تجديد تلقائي أو مفاجآت في بطاقتك.",
      starter: {
        category: "المستوى المجاني",
        title: "Starter",
        desc: "لبناء سيرة ذاتية قياسية وتصفح مسار الألمانية A1",
        price: "$0",
        period: "/ دائماً",
        f1: "إنشاء سيرة ذاتية واحدة بتنسيق DIN 5008",
        f2: "البحث في آلاف الوظائف الألمانية وحفظها",
        f3: "وصول مجاني لكافة دروس مسار الألمانية A1",
        f4: "3 أرصدة ذكاء اصطناعي تجريبية",
        f5: "تجميع ملف الترشيح الكامل (Bewerbungsmappe)",
        cta: "ابدأ مجاناً الآن",
      },
      quickSprint: {
        category: "تصريح الـ 30 يوماً",
        title: "Quick Sprint",
        desc: "صلاحية 30 يوماً للتقديمات السريعة والمكثفة على الوظائف",
        price: "$9.99",
        period: "/ 30 يوماً",
        subtext: "دفع لمرة واحدة • تفعيل فوري",
        f1: "صلاحية 30 يوماً كاملة",
        f2: "20 طلب ذكاء اصطناعي يومياً (Fair Use)",
        f3: "فحص التوافق مع أنظمة ATS الألمانية",
        f4: "تصدير غير محدود لسير ذاتية بصيغة PDF",
        cta: "اختيار Quick Sprint ⚡",
      },
      proJobPass: {
        popularBadge: "الأكثر طلباً • وفر 35%",
        category: "جواز الباحث عن عمل الشامل",
        title: "PRO Job Pass",
        desc: "تغطية كاملة لدورة التوظيف الألمانية مع جميع الأدوات والمتابعة",
        price: "$19.99",
        period: "/ 90 يوماً",
        subtext: "دفع لمرة واحدة • بدون اشتراك دوري",
        f1: "90 يوماً كاملة تغطي دورة التوظيف",
        f2: "لوحة متتبع التقديمات (Pipeline Tracker)",
        f3: "استوديو الملف المتكامل (Bewerbungsmappe)",
        f4: "20 طلب ذكاء اصطناعي يومياً عالي الدقة",
        f5: "خطابات دافع مخصصة لكل إعلان وظيفي",
        cta: "احصل على PRO Job Pass 💎",
      },
      comparisonLink: "عرض المقارنة التفصيلية لجميع الميزات ←",
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
        title: "3. التنزيل والتتبع المباشر",
        desc: "حمّل ملف PDF الرسمي المتوافق مع DIN 5008 وتابع تقديماتك ومواعيد مقابلاتك عبر لوحة المتابعة.",
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
      secondaryBtn: "عرض باقات الأسعار (بدون اشتراك دوري)",
    },
  },

  de: {
    meta: {
      title: "GermanJobsPro 🇩🇪 | DIN 5008 Bewerbung, Jobs & A1-Kurs für Deutschland",
      description: "Offizielle DIN 5008 Bewerbungsmappe, KI-Anschreiben, Application-Tracker und Deutsch A1 Lernpfad für Ihre Karriere in Deutschland.",
    },
    hero: {
      badge: "🇩🇪 Die Komplettplattform für Bewerbung & Karriere in Deutschland",
      headline: {
        prefix: "Erstellen Sie Ihre DIN 5008 Bewerbung & ",
        highlight: "verwalten Sie Ihre Jobchancen",
        suffix: "",
      },
      subheadline: "Erstellen Sie DIN 5008 Lebensläufe, KI-Anschreiben, vollständige Bewerbungsmappen, ATS-Checks, Bewerbungs-Tracker und den Deutsch A1 Sprachkurs für Ihren beruflichen Erfolg.",
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
        title: "Bewerbungs-Pipeline Tracker",
        desc: "Verwalten Sie Stellenangebote, Bewerbungsstatus, Interviewtermine und Notizen in einer übersichtlichen Pipeline.",
        tag: "✓ Saved → Interview → Offer",
        cta: "Zur Pipeline →",
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
    pricing: {
      badge: "Faire Preise",
      title: "Transparente Preise • Kein verstecktes Abonnement",
      subtitle: "Wählen Sie das passende Paket für Ihre Bewerbungsphase – ohne automatische Verlängerung.",
      starter: {
        category: "Kostenlos",
        title: "Starter",
        desc: "Für den Einstieg und die Vorbereitung eines DIN 5008 Lebenslaufs und den Deutsch A1 Kurs.",
        price: "$0",
        period: "/ dauerhaft",
        f1: "1 DIN 5008 Lebenslauf-Ersteller",
        f2: "Stellenangebote durchsuchen & speichern",
        f3: "Voller Zugang zum Deutsch A1 Kurs",
        f4: "3 Start-Guthaben für KI-Funktionen",
        f5: "Bewerbungsmappe 3-in-1 Compiler",
        cta: "Kostenlos starten",
      },
      quickSprint: {
        category: "30-Tage-Pass",
        title: "Quick Sprint",
        desc: "30 Tage Gültigkeit für schnelle und zielgerichtete Bewerbungen mit ATS-Audit.",
        price: "$9.99",
        period: "/ 30 Tage",
        subtext: "Einmalzahlung • Sofortiger Zugang",
        f1: "Volle 30 Tage Gültigkeit",
        f2: "20 tägliche KI-Anfragen (Fair Use)",
        f3: "Deutscher ATS-Audit-Check",
        f4: "Unbegrenzte offizielle PDF-Exporte",
        cta: "Quick Sprint wählen ⚡",
      },
      proJobPass: {
        popularBadge: "Bestseller • 35% Sparen",
        category: "Kompletter Karriere-Pass",
        title: "PRO Job Pass",
        desc: "Vollständige Abdeckung für den gesamten deutschen Bewerbungszyklus (90 Tage).",
        price: "$19.99",
        period: "/ 90 Tage",
        subtext: "Einmalzahlung • Kein Abo",
        f1: "90 volle Tage für den gesamten Bewerbungszyklus",
        f2: "Vollständiger Bewerbungs-Pipeline Tracker",
        f3: "Bewerbungsmappe 3-in-1 Compiler",
        f4: "20 tägliche Prioritäts-KI-Anfragen",
        f5: "Individuelle Anschreiben für jede Stelle",
        cta: "PRO Job Pass sichern 💎",
      },
      comparisonLink: "Detaillierten Funktionsvergleich ansehen →",
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
        desc: "Laden Sie Ihr DIN 5008 PDF herunter und verwalten Sie Ihre Bewerbungen und Vorstellungsgespräche im Tracker.",
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
      secondaryBtn: "Preise & Tarife (Ohne Abo)",
    },
  },

  en: {
    meta: {
      title: "GermanJobsPro 🇩🇪 | Certified DIN 5008 German Application & Career Platform",
      description: "Build certified DIN 5008 German CVs, AI cover letters (Anschreiben), track job applications, compile dossiers, and learn German A1.",
    },
    hero: {
      badge: "🇩🇪 The Complete Career & Application Platform for Germany",
      headline: {
        prefix: "Prepare Your Certified German Application ",
        highlight: "(DIN 5008)",
        suffix: " & Track Jobs Professionally",
      },
      subheadline: "Build certified DIN 5008 CVs, craft tailored AI cover letters (Anschreiben), compile complete Bewerbungsmappe dossiers, run ATS audits, track job applications, and master German A1.",
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
        title: "Application Pipeline Tracker",
        desc: "Track saved positions, active applications, interview rounds, and job offers in one organized dashboard with deadline alerts.",
        tag: "✓ Saved → Interview → Offer",
        cta: "Pipeline →",
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
    pricing: {
      badge: "Transparent Pricing",
      title: "Transparent Pricing • No Hidden Subscriptions",
      subtitle: "Pick the pass that fits your job search timeline with zero recurring fees or traps.",
      starter: {
        category: "Free Plan",
        title: "Starter",
        desc: "For building your initial CV and exploring A1",
        price: "$0",
        period: "/ forever",
        f1: "1 standard DIN 5008 CV builder",
        f2: "Search & bookmark German jobs",
        f3: "Full access to German A1 course",
        f4: "3 initial AI credits",
        f5: "Bewerbungsmappe dossier compiler",
        cta: "Start Free Now",
      },
      quickSprint: {
        category: "30-Day Sprint Pass",
        title: "Quick Sprint",
        desc: "30 days validity for fast job applications",
        price: "$9.99",
        period: "/ 30 days",
        subtext: "One-time payment • Instant access",
        f1: "Full 30 days validity",
        f2: "20 daily AI requests (Fair Use)",
        f3: "German ATS audit checks",
        f4: "Unlimited official PDF exports",
        cta: "Choose Quick Sprint ⚡",
      },
      proJobPass: {
        popularBadge: "Most Popular • Save 35%",
        category: "Complete Career Pass",
        title: "PRO Job Pass",
        desc: "Complete coverage for the entire German hiring cycle",
        price: "$19.99",
        period: "/ 90 days",
        subtext: "One-time payment • No recurring fees",
        f1: "90 full days covering hiring cycle",
        f2: "Full Application Pipeline Tracker",
        f3: "Bewerbungsmappe 3-in-1 Compiler",
        f4: "20 daily priority AI requests",
        f5: "Tailored cover letters per vacancy",
        cta: "Get PRO Job Pass 💎",
      },
      comparisonLink: "View Detailed Feature Comparison →",
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
        title: "3. Download & Pipeline Tracking",
        desc: "Download your certified DIN 5008 PDF dossier and track application status in the pipeline.",
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
          answer: "Yes! Registration is completely free. You can build, edit, and download your DIN 5008 CV and access the German A1 track. When you need extended AI power or the application tracker, transparent one-time passes are available without subscriptions.",
        },
      ],
    },
    finalCta: {
      title: "Take Your First Step Toward a Career in Germany Today 🇩🇪",
      subtitle: "Join thousands of candidates who generated certified DIN 5008 dossiers and landed German interviews.",
      primaryBtn: "Create Your Free German CV 🇩🇪",
      secondaryBtn: "View Pricing (No Subscriptions)",
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
