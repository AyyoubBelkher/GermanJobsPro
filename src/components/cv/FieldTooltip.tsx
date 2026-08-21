"use client";

import React, { useState, useRef, useEffect } from "react";

export interface TooltipContent {
  title: string;
  description: string;
  example?: string;
  tip?: string;
}

export type TooltipKey =
  | "fullName"
  | "targetJobTitle"
  | "email"
  | "phone"
  | "address"
  | "birthDate"
  | "birthPlaceAndNationality"
  | "linkedinUrl"
  | "xingUrl"
  | "photoUrl"
  | "summary"
  | "experienceSection"
  | "position"
  | "company"
  | "dates"
  | "experienceDescription"
  | "degree"
  | "fieldOfStudy"
  | "institution"
  | "grade"
  | "skillsSection"
  | "languagesSection"
  | "certificationsSection"
  | "projectsSection";

export const CV_GUIDANCE_DICTIONARY: Record<TooltipKey, { ar: TooltipContent; de: TooltipContent; en: TooltipContent }> = {
  fullName: {
    ar: {
      title: "الاسم الكامل (Vor- und Nachname)",
      description: "اكتب اسمك الشخصي ثم اللقب العائلي بنفس الترتيب والصيغة اللاتينية المطابقة لجواز السفر.",
      example: "Max Mustermann / Karim Alami",
      tip: "تجنب استخدام الكنى أو الألقاب غير الرسمية لضمان تطابق السيرة مع وثائق التأشيرة والشهادات.",
    },
    de: {
      title: "Vollständiger Name",
      description: "Geben Sie Ihren Vor- und Nachnamen wie im Reisepass an.",
      example: "Max Mustermann",
      tip: "Achten Sie auf eine einheitliche Schreibweise wie in Ihren Zeugnissen und Dokumenten.",
    },
    en: {
      title: "Full Legal Name",
      description: "Enter your first name and last name exactly as they appear on your passport.",
      example: "Max Mustermann / Karim Alami",
      tip: "Ensure exact spelling match with your official transcripts and visa documents.",
    },
  },

  targetJobTitle: {
    ar: {
      title: "المسمى الوظيفي المستهدف بألمانيا (Berufsbezeichnung)",
      description: "حدد المسمى الوظيفي الدقيق المعترف به في سوق العمل الألماني والذي تستهدفه بالتقديم.",
      example: "Full Stack Entwickler (m/w/d) / Pflegefachkraft (m/w/d)",
      tip: "استخدم نفس المسمى الموجود في إعلان الوظيفة الألماني ولا تترجمه ترجمة حرفية عشوائية.",
    },
    de: {
      title: "Angestrebte Berufsbezeichnung",
      description: "Genaue Berufsbezeichnung nach deutschem Arbeitsmarktstandard.",
      example: "Full Stack Entwickler (m/w/d) / DevOps Engineer",
      tip: "Nutzen Sie exakt den Titel aus der Stellenanzeige für eine optimale ATS-Erkennung.",
    },
    en: {
      title: "Target Job Title",
      description: "Specify the exact German job title matching the role you are applying for.",
      example: "Full Stack Software Developer (m/f/d)",
      tip: "Match the title from the German job posting to maximize ATS keyword scoring.",
    },
  },

  email: {
    ar: {
      title: "البريد الإلكتروني المهني (E-Mail-Adresse)",
      description: "بريد إلكتروني رسمي ومباشر مخصص للتوظيف.",
      example: "karim.alami@gmail.com / max.mustermann@posteo.de",
      tip: "استخدم صيغة (الاسم.اللقب). تجنب تماماً الحسابات ذات الأسماء المستعارة.",
    },
    de: {
      title: "E-Mail-Adresse",
      description: "Professionelle und seriöse E-Mail-Adresse für Bewerbungen.",
      example: "vorname.nachname@domain.de",
      tip: "Verwenden Sie idealerweise das Format vorname.nachname.",
    },
    en: {
      title: "Professional Email",
      description: "A clean, professional email address dedicated to job applications.",
      example: "firstname.lastname@gmail.com",
      tip: "Use a standard firstname.lastname format. Avoid nicknames or unprofessional handles.",
    },
  },

  phone: {
    ar: {
      title: "رقم الهاتف والرمز الدولي (Telefonnummer)",
      description: "رقم هاتف مباشر ومفعل مع رمز الدولة الدولي (وفق معيار DIN 5008).",
      example: "+49 170 1234567 (ألمانيا) / +212 600 123456 (المغرب)",
      tip: "معيار DIN 5008 يوصي بوضع مسافة بعد رمز الدولة ورمز الشبكة لتسهيل القراءة.",
    },
    de: {
      title: "Telefonnummer (DIN 5008)",
      description: "Telefonnummer mit internationaler Ländervorwahl im DIN 5008 Format.",
      example: "+49 170 1234567 / +49 30 12345678",
      tip: "Trennen Sie die Ländervorwahl und Vorwahl mit Leerzeichen nach DIN 5008.",
    },
    en: {
      title: "Phone Number (DIN 5008)",
      description: "Active direct phone number with full international dialing code.",
      example: "+49 170 1234567 / +212 600 123456",
      tip: "DIN 5008 recommends spaces between country code, area code, and subscriber number.",
    },
  },

  address: {
    ar: {
      title: "العنوان وفق معيار DIN 5008 (Wohnanschrift)",
      description: "ترتيب العنوان القياسي بألمانيا: اسم الشارع ورقم البناية، الرمز البريدي، والمدينة، والدولة.",
      example: "Musterstraße 12, 10115 Berlin, Deutschland",
      tip: "في ألمانيا يكتب رقم المنزل بعد اسم الشارع دائماً. إذا كنت مقيماً خارج ألمانيا اذكر مدينتك ودولتك بوضوح.",
    },
    de: {
      title: "Wohnanschrift nach DIN 5008",
      description: "Standardreihenfolge: Straße Hausnr., PLZ Ort, Land.",
      example: "Hauptstraße 45, 80331 München, Deutschland",
      tip: "Die Hausnummer folgt immer nach dem Straßennamen.",
    },
    en: {
      title: "Address (DIN 5008 Standard)",
      description: "German standard format: Street + House No., Postal Code + City, Country.",
      example: "Musterstraße 12, 10115 Berlin, Germany",
      tip: "In Germany, house numbers always follow the street name. If abroad, include city & country.",
    },
  },

  birthDate: {
    ar: {
      title: "تاريخ الميلاد (Geburtsdatum)",
      description: "تاريخ ميلادك بصيغة اليوم.الشهر.السنة (TT.MM.JJJJ).",
      example: "15.04.1995",
      tip: "على عكس السير الذاتية الإنجليزية، تاريخ الميلاد عنصر أساسي ومحبذ في السيرة الذاتية الألمانية التقليدية (Lebenslauf).",
    },
    de: {
      title: "Geburtsdatum",
      description: "Geburtsdatum im Format TT.MM.JJJJ.",
      example: "24.08.1994",
      tip: "Standardbestandteil des klassischen deutschen Lebenslaufs.",
    },
    en: {
      title: "Date of Birth",
      description: "Date of birth in DD.MM.YYYY format.",
      example: "15.04.1995",
      tip: "Unlike UK/US resumes, date of birth is standard practice in German DIN 5008 CVs.",
    },
  },

  birthPlaceAndNationality: {
    ar: {
      title: "مكان الميلاد والجنسية (Geburtsort & Staatsangehörigkeit)",
      description: "مكان ولادتك وجنسيتك باللغة الألمانية.",
      example: "Casablanca, Marokko / marokkanisch (أو Berlin / deutsch)",
      tip: "تحديد الجنسية بالألمانية يساعد قسم الموارد البشرية على معرفة نوع تصريح العمل ومتطلبات الفيزا.",
    },
    de: {
      title: "Geburtsort & Staatsangehörigkeit",
      description: "Angabe von Geburtsort und Nationalität auf Deutsch.",
      example: "Casablanca, Marokko / marokkanisch",
      tip: "Erleichtert Arbeitgebern die Einschätzung von Arbeitserlaubnis und Visabedarf.",
    },
    en: {
      title: "Birthplace & Nationality",
      description: "City/country of birth and legal nationality in German terms.",
      example: "Casablanca, Morocco / marokkanisch",
      tip: "Specifying nationality in German helps recruiters verify work permit and visa requirements.",
    },
  },

  linkedinUrl: {
    ar: {
      title: "رابط LinkedIn",
      description: "رابط مباشر لملفك المهني العام على منصة لينكد إن.",
      example: "https://linkedin.com/in/karim-alami",
      tip: "خصص الرابط المباشر لملفك واجعله متطابقاً مع خبرات ومسميات سيرتك الذاتية.",
    },
    de: {
      title: "LinkedIn Profil-URL",
      description: "Direkter Link zu Ihrem aktuellen, öffentlichen LinkedIn-Profil.",
      example: "https://linkedin.com/in/max-mustermann",
      tip: "Passen Sie die Vanity-URL an und halten Sie die Angaben synchron zum Lebenslauf.",
    },
    en: {
      title: "LinkedIn Profile URL",
      description: "Direct link to your active, public LinkedIn profile.",
      example: "https://linkedin.com/in/john-doe",
      tip: "Customize your profile URL and ensure experiences match your resume.",
    },
  },

  xingUrl: {
    ar: {
      title: "رابط XING (سوق العمل الألماني DACH)",
      description: "شبكة XING هي منصة التوظيف المهنية الرائدة في ألمانيا والنمسا وسويسرا.",
      example: "https://xing.com/profile/Max_Mustermann",
      tip: "الشركات الألمانية المتوسطة (Mittelstand) ومسؤولو التوظيف يبحثون بكثافة على XING. امتلاك حساب نشط يمنحك ميزة كبرى.",
    },
    de: {
      title: "XING Profil-URL (DACH-Region)",
      description: "Führendes berufliches Netzwerk im deutschsprachigen Raum.",
      example: "https://xing.com/profile/Max_Mustermann",
      tip: "Besonders im deutschen Mittelstand sehr verbreitet für Active Sourcing.",
    },
    en: {
      title: "XING Profile URL (DACH Region)",
      description: "The primary professional networking platform in Germany, Austria, and Switzerland.",
      example: "https://xing.com/profile/Max_Mustermann",
      tip: "Extensively used by German Mittelstand companies. An active profile boosts recruiter reach.",
    },
  },

  photoUrl: {
    ar: {
      title: "صورة التقديم الرسمية (Bewerbungsfoto)",
      description: "صورة نصفية احترافية بخلفية حيادية وإضاءة ممتازة ونظرة واثقة ومبتسمة نحو الكاميرا.",
      example: "صورة بورتريه احترافية (3.5 × 4.5 سم أو نسبة 3:4)",
      tip: "في ألمانيا، صورة التقديم الرسمية تترك انطباعاً أولياً قوياً. تجنب صور السيلفي أو الصور غير الرسمية.",
    },
    de: {
      title: "Bewerbungsfoto nach DIN 5008",
      description: "Professionelles Porträtfoto mit neutralem Hintergrund und Business-Kleidung.",
      example: "Format ca. 45 x 60 mm oder Seitenverhältnis 3:4",
      tip: "Ein professionelles Foto erhöht die Sympathiewerte im deutschen Bewerbungsprozess erheblich.",
    },
    en: {
      title: "Professional Photo (Bewerbungsfoto)",
      description: "High-quality portrait photo with neutral background and business attire.",
      example: "Standard portrait ratio (~3.5 x 4.5 cm / 3:4 ratio)",
      tip: "German employers highly value professional portrait photos. Avoid casual selfies.",
    },
  },

  summary: {
    ar: {
      title: "النبذة المهنية الموجزة (Profil / Kurzprofil)",
      description: "فقرة مركزة من 2 إلى 3 جمل تلخص سنوات خبرتك، ومجال تخصصك، وقيمتك المضافة.",
      example: "Erfahrener Softwareentwickler mit 5 Jahren Praxis in React & Cloud-Lösungen. Spezialisiert auf performante Webanwendungen.",
      tip: "مسؤولو التوظيف يقرؤون السيرة في 6 ثوانٍ فقط! هذه الفقرة تمنحهم نظرة سريعة شاملة مع الكلمات المفتاحية لـ ATS.",
    },
    de: {
      title: "Kurzprofil / Zusammenfassung",
      description: "2-3 prägnante Sätze über Kernkompetenzen, Berufserfahrung und Mehrwert.",
      example: "Erfahrener Full-Stack-Entwickler mit Schwerpunkt auf skalierbaren Cloud-Lösungen...",
      tip: "Hebt Ihre wichtigsten USPs und ATS-Keywords direkt im Kopfteil des Lebenslaufs hervor.",
    },
    en: {
      title: "Professional Summary (Kurzprofil)",
      description: "2-3 impactful sentences highlighting your core competencies and experience.",
      example: "Senior Software Engineer with 5+ years of experience building scalable distributed systems...",
      tip: "Provides recruiters with an instant elevator pitch loaded with high-value ATS keywords.",
    },
  },

  experienceSection: {
    ar: {
      title: "الخبرات المهنية بالتسلسل الزمني العكسي (Antichronologisch)",
      description: "ابدأ بأحدث وظيفة تشغلها حالياً ثم تدرج نحو الخبرات الأقدم.",
      example: "01/2022 – Heute: Senior Engineer | 06/2019 – 12/2021: Software Developer",
      tip: "الترتيب الزمني العكسي هو المعيار الإلزامي في ألمانيا لمعرفة أحدث مهاراتك ومسؤولياتك فوراً.",
    },
    de: {
      title: "Berufserfahrung (Antichronologisch)",
      description: "Die aktuellste Position steht immer an erster Stelle.",
      example: "01/2022 – Heute: Senior Developer | 2019 – 2021: Junior Developer",
      tip: "Lückenloser chronologischer Aufbau mit Monats- und Jahresangaben (MM/JJJJ).",
    },
    en: {
      title: "Work Experience (Anti-chronological)",
      description: "List your positions in reverse chronological order, starting with your most recent role.",
      example: "01/2022 – Present: Senior Engineer | 06/2019 – 12/2021: Developer",
      tip: "Standard German expectation is reverse chronological order with exact MM/YYYY dates.",
    },
  },

  position: {
    ar: {
      title: "المسمى الوظيفي (Positionsbezeichnung)",
      description: "المسمى الوظيفي المعتمد للوظيفة مع توضيح مستوى المسؤولية (Junior, Senior, Lead).",
      example: "Frontend Softwareentwickler / DevOps Specialist",
      tip: "اختر مسمى وظيفي متداول في الشركات الألمانية وتجنب المسميات الغامضة أو الداخلية الخاصة بشركة واحدة.",
    },
    de: {
      title: "Positionsbezeichnung",
      description: "Präziser und branchenüblicher Jobtitel.",
      example: "Senior Frontend Entwickler / Projektleiter IT",
      tip: "Verwenden Sie marktgängige Titel, die zu Ihrem Verantwortungsbereich passen.",
    },
    en: {
      title: "Job Position / Title",
      description: "Accurate, industry-standard job title reflecting your seniority.",
      example: "Senior Frontend Engineer / DevOps Specialist",
      tip: "Use widely recognized German or international industry titles.",
    },
  },

  company: {
    ar: {
      title: "اسم الشركة وموقعها (Unternehmen & Standort)",
      description: "الاسم الرسمي للشركة ومقر العمل (المدينة والدولة).",
      example: "Siemens AG (München) / Capgemini (Casablanca, Marokko)",
      tip: "إذا كانت الشركة غير معروفة في ألمانيا، يمكنك توضيح حجمها أو قطاعها بين قوسين (مثال: IT-Dienstleister, 150 MA).",
    },
    de: {
      title: "Unternehmen & Standort",
      description: "Name des Arbeitgebers sowie Stadt und Land.",
      example: "SAP SE (Walldorf) / DevCorp GmbH (Berlin)",
      tip: "Bei unbekannten Unternehmen hilft eine kurze Branchenbezeichnung.",
    },
    en: {
      title: "Company & Location",
      description: "Official name of the employer and location (City, Country).",
      example: "Siemens AG (Munich) / TechCorp LLC (Berlin)",
      tip: "For lesser-known companies, a brief industry note (e.g. Fintech, 200+ employees) provides helpful context.",
    },
  },

  dates: {
    ar: {
      title: "الفترة الزمنية (Zeitraum MM/JJJJ)",
      description: "تاريخ البدء وتاريخ الانتهاء بصيغة الشهر والسنة.",
      example: "03/2021 – 08/2023 أو 02/2022 – Heute",
      tip: "تجنب وجود فجوات زمنية غير مبررة (Lücken im Lebenslauf). إذا كنت لا تزال تعمل، فعل خيار 'أعمل هنا حالياً'.",
    },
    de: {
      title: "Zeitraum (MM/JJJJ)",
      description: "Monats- und Jahresangabe für Beginn und Ende.",
      example: "04/2020 – 11/2022",
      tip: "Achten Sie auf einen lückenlosen Zeitverlauf im Lebenslauf.",
    },
    en: {
      title: "Time Period (MM/YYYY)",
      description: "Start date and end date specified in month and year format.",
      example: "03/2021 – 08/2023 or 02/2022 – Present",
      tip: "Avoid unexplained timeline gaps (Lücken). For ongoing roles, mark 'Current role'.",
    },
  },

  experienceDescription: {
    ar: {
      title: "المهام والإنجازات (Bullet Points)",
      description: "نقاط محددة تبدأ بأسماء أفعال ألمانية (Substantivstil) وإنجازات رقمية قابلة للقياس.",
      example: "• Entwicklung von Microservices mit Node.js\n• Steigerung der Systemperformance um 30%\n• Fachliche Führung eines Teams von 4 Entwicklern",
      tip: "في ألمانيا يفضل أسلوب (Substantivstil) مثل: Konzeption von..., Leitung der..., Optimierung von... استخدم زر 'تحسين بالذكاء الاصطناعي ✨' لصياغتها فورياً.",
    },
    de: {
      title: "Aufgaben & Erfolge (Substantivstil)",
      description: "Prägnante Stichpunkte im Substantivstil mit messbaren Resultaten.",
      example: "• Konzeption und Implementierung von REST-APIs\n• Reduktion der Ladezeit um 40%\n• Agiles Arbeiten nach Scrum",
      tip: "Substantivierter Stil (Entwicklung, Optimierung, Leitung) ist im deutschen Lebenslauf Standard.",
    },
    en: {
      title: "Tasks & Key Achievements",
      description: "Impactful bullet points starting with strong action words and quantified metrics.",
      example: "• Development of RESTful microservices using Node.js\n• Improved system uptime to 99.9%\n• Mentored 3 junior software engineers",
      tip: "German CVs prefer action-noun style (Entwicklung von..., Optimierung der...). Use our AI Optimizer ✨.",
    },
  },

  degree: {
    ar: {
      title: "الدرجة العلمية ومعادلها الألماني (Abschluss)",
      description: "اسم الشهادة أو المؤهل العلمي مع ما يعادله في النظام الألماني (Anabin).",
      example: "Bachelor of Science (B.Sc.) in Informatik / Staatlich geprüfter Techniker (DTS) / Abitur (Baccalauréat)",
      tip: "البكالوريا توازي `Abitur`، دبلوم التقني المتخصص DTS يوازي `Staatlich geprüfter Techniker`، والإجازة توازي `Bachelor`.",
    },
    de: {
      title: "Abschlussbezeichnung",
      description: "Höchster erreichter akademischer oder beruflicher Bildungsabschluss.",
      example: "Master of Science (M.Sc.) / Staatlich geprüfter Techniker / Abitur",
      tip: "Verwenden Sie deutsche oder international anerkannte Äquivalente (z. B. nach Anabin-Einstufung).",
    },
    en: {
      title: "Degree & German Equivalent",
      description: "Academic or vocational degree and its German system counterpart (Anabin).",
      example: "Bachelor of Science (B.Sc.) in Computer Science / State Certified Technician / High School Diploma (Abitur)",
      tip: "Baccalaureate = `Abitur`, DTS / Higher Tech Diploma = `Staatlich geprüfter Techniker`, License/Bachelor = `Bachelor`.",
    },
  },

  fieldOfStudy: {
    ar: {
      title: "التخصص الدراسي (Studiengang / Fachrichtung)",
      description: "المجال الأكاديمي أو التخصص المهني الدقيق.",
      example: "Informatik / Wirtschaftsinformatik / Maschinenbau / Elektrotechnik",
      tip: "اكتب التخصص باللغة الألمانية أو الإنجليزية الشائعة لتسهيل المطابقة الآلية في أنظمة ATS.",
    },
    de: {
      title: "Studiengang / Fachrichtung",
      description: "Genaue Bezeichnung Ihres Studienfachs oder Ausbildungsberufs.",
      example: "Angewandte Informatik / Mechatronik",
      tip: "Verwenden Sie klare Fachbezeichnungen zur besseren Verschlagwortung.",
    },
    en: {
      title: "Field of Study / Major",
      description: "Specific academic major or vocational specialization.",
      example: "Computer Science / Mechanical Engineering / Business Informatics",
      tip: "Use standardized German or English terminology to ensure high ATS compatibility.",
    },
  },

  institution: {
    ar: {
      title: "المؤسسة التعليمية / الجامعة (Hochschule / Universität)",
      description: "الاسم الرسمي للجامعة أو المعهد مع ذكر المدينة والدولة.",
      example: "Technische Universität München (TUM) / Université Hassan II (Casablanca)",
      tip: "إذا كانت الجامعة معتمدة في قاعدة بيانات Anabin الألمانية، فإن ذكر اسمها بدقة يسرع إجراءات التحقق من المؤهل.",
    },
    de: {
      title: "Bildungseinrichtung",
      description: "Name der Universität, Fachhochschule oder Schule inklusive Standort.",
      example: "RWTH Aachen / Universität Wien",
      tip: "Geben Sie neben dem Namen auch den Ort an.",
    },
    en: {
      title: "Educational Institution",
      description: "Official name of the university, college, or institute along with location.",
      example: "Technical University of Munich / University of Casablanca",
      tip: "Specifying verified university names simplifies Anabin credential recognition in Germany.",
    },
  },

  grade: {
    ar: {
      title: "المعدل والتقدير (German Note System)",
      description: "المعدل التراكمي محولاً للنظام الألماني أو بصيغته الأصلية (1.0 = ممتاز، 4.0 = مقبول).",
      example: "1,3 (sehr gut) / 1,7 (gut) / 15/20 (entspricht ca. 1,6)",
      tip: "في ألمانيا الدرجات عكسية: 1.0 هي أعلى درجة (Sehr gut) و 4.0 هي درجة النجاح. ذكر المعدل اختياري، وضعه إذا كان متفوقاً (1.0 إلى 2.3).",
    },
    de: {
      title: "Abschlussnote (Deutsches Notensystem)",
      description: "Gesamtnote der Ausbildung (1,0 = sehr gut bis 4,0 = ausreichend).",
      example: "1,3 (sehr gut) / 1,8 (gut)",
      tip: "Die Angabe ist optional, empfiehlt sich jedoch besonders bei guten bis sehr guten Noten.",
    },
    en: {
      title: "Graduation Grade (German Note)",
      description: "GPA / Final grade (German system: 1.0 = Best/Sehr gut, 4.0 = Minimum pass).",
      example: "1.3 (sehr gut) / 1.7 (gut) / 15/20 (equivalent to ~1.6)",
      tip: "The German scale runs from 1.0 (highest) to 4.0 (pass). Optional: include if your score is 2.3 or better.",
    },
  },

  skillsSection: {
    ar: {
      title: "المهارات التقنية والمهنية (Fachkenntnisse)",
      description: "المهارات والأدوات والتقنيات مع تحديد مستوى الإتقان (Experte, Fortgeschritten, Grundkenntnisse).",
      example: "React, TypeScript, Next.js (Experte) / Docker, CI/CD (Fortgeschritten)",
      tip: "تطابق المهارات مع الكلمات المفتاحية في إعلان الوظيفة هو العامل الأول لاجتياز فحص أنظمة ATS.",
    },
    de: {
      title: "Fach- & IT-Kenntnisse",
      description: "Relevante Hard Skills mit realistischer Selbsteinschätzung.",
      example: "Java, Spring Boot (Experte) / Kubernetes (Fortgeschritten)",
      tip: "Stimmen Sie die genannten Kenntnisse direkt auf das Anforderungsprofil ab.",
    },
    en: {
      title: "Technical & Professional Skills",
      description: "Hard skills and tools paired with realistic self-evaluations.",
      example: "React, TypeScript (Expert) / Docker, AWS (Advanced)",
      tip: "Direct keyword alignment with the German job specification is essential for ATS passing.",
    },
  },

  languagesSection: {
    ar: {
      title: "اللغات وفق الإطار الأوروبي (Sprachen nach CEFR)",
      description: "تحديد مستوى كل لغة وفق مقياس الاتحاد الأوروبي الموحد (A1 إلى C2 أو Muttersprache).",
      example: "Deutsch: B2 (Fließend in Wort und Schrift) / Englisch: C1 (Verhandlungssicher) / Arabisch: Muttersprache",
      tip: "في ألمانيا، CEFR هو المعيار الوحيد المعترف به قانونياً. A1/A2 = مبتدئ، B1/B2 = طلاقة مهنية للعمل، C1/C2 = متقن، Muttersprache = اللغة الأم.",
    },
    de: {
      title: "Sprachkenntnisse nach CEFR / GER",
      description: "Einstufung nach dem Gemeinsamen Europäischen Referenzrahmen (A1 bis C2).",
      example: "Deutsch: Muttersprache / Englisch: C1 (Verhandlungssicher) / Französisch: B1",
      tip: "B2 gilt in Deutschland meist als Mindestvoraussetzung für den qualifizierten Arbeitsalltag.",
    },
    en: {
      title: "Languages (European CEFR Levels)",
      description: "Standardized European Framework levels (A1 to C2, Muttersprache).",
      example: "German: B2 (Fluent in speaking & writing) / English: C1 (Business Fluent) / Arabic: Native",
      tip: "CEFR is the official German standard: B2 is the general benchmark for professional qualified employment.",
    },
  },

  certificationsSection: {
    ar: {
      title: "الشهادات والاعتمادات الرسمية (Zertifikate)",
      description: "الشهادات التخصصية والدورات التدريبية المعتمدة مع ذكر الجهة المانحة.",
      example: "Goethe-Zertifikat B2 (Goethe-Institut) / AWS Certified Solutions Architect (Amazon)",
      tip: "أصحاب العمل في ألمانيا يقدرون الشهادات المعترف بها (Zertifikate) تقديراً كبيراً لتوثيق الكفاءة.",
    },
    de: {
      title: "Zertifikate & Weiterbildungen",
      description: "Offizielle Zertifizierungen mit Angabe des Ausstellers.",
      example: "Scrum Master (PSM I) / Goethe-Zertifikat C1",
      tip: "Anerkannte Nachweise belegen Ihre Fachkompetenz und Lernbereitschaft schwarz auf weiß.",
    },
    en: {
      title: "Certifications & Credentials",
      description: "Recognized industry certifications with the issuing organization.",
      example: "Goethe-Zertifikat B2 (Goethe Institute) / AWS Certified Solutions Architect (AWS)",
      tip: "German recruiters place heavy emphasis on verified credentials and recognized certificates.",
    },
  },

  projectsSection: {
    ar: {
      title: "المشاريع المميزة ونماذج الأعمال (Projekte & Portfolio)",
      description: "مشاريع عملية تثبت قدراتك مع تحديد التقنيات المستخدمة ورابط العمل المباشر.",
      example: "E-Commerce App (React, Node.js, PostgreSQL) • معالجة 10,000 طلب شهرياً",
      tip: "وضح دورك الدقيق، وحجم الإنجاز بالأرقام، ورابط GitHub أو الموقع المباشر إن توفر.",
    },
    de: {
      title: "Projekte & Portfolio",
      description: "Praxisnahe Arbeitsproben und Projekte mit Technologie-Stack und Ergebnissen.",
      example: "Microservices Migration (Docker, Go) • Reduzierung der Downtime um 99%",
      tip: "Quantifizieren Sie Erfolge und verlinken Sie zu Live-Demos oder Repositories.",
    },
    en: {
      title: "Featured Projects & Portfolio",
      description: "Hands-on projects demonstrating practical mastery of tools and technologies.",
      example: "E-Commerce Platform (React, Node.js) • Scaled to 10k monthly active users",
      tip: "Highlight your exact role, tech stack, quantified outcomes, and live links/GitHub repositories.",
    },
  },
};

interface FieldTooltipProps {
  fieldKey?: TooltipKey;
  customContent?: TooltipContent;
  locale?: string;
  className?: string;
}

export default function FieldTooltip({ fieldKey, customContent, locale = "ar", className = "" }: FieldTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentLang = locale === "de" ? "de" : locale === "en" ? "en" : "ar";
  const isAr = currentLang === "ar";

  let content: TooltipContent | undefined = customContent;
  if (!content && fieldKey && CV_GUIDANCE_DICTIONARY[fieldKey]) {
    content = CV_GUIDANCE_DICTIONARY[fieldKey][currentLang];
  }

  // Handle outside click & escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!content) {
    return null;
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 250);
  };

  const toggleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  return (
    <div
      className={`relative inline-flex items-center align-middle ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-label={content.title}
        className="w-4 h-4 rounded-full bg-slate-800 hover:bg-blue-600/30 text-slate-400 hover:text-blue-400 border border-slate-700 hover:border-blue-500/50 text-[10px] font-bold inline-flex items-center justify-center transition cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-blue-500 shrink-0"
      >
        ?
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="tooltip"
          className={`absolute bottom-full mb-2 z-50 w-72 sm:w-80 p-4 rounded-2xl bg-slate-900/98 border border-slate-700/80 shadow-2xl text-xs space-y-3 backdrop-blur-xl animate-fadeIn ${
            isAr ? "right-0 text-right" : "left-0 text-left"
          }`}
          style={{ filter: "drop-shadow(0 20px 25px rgba(0, 0, 0, 0.5))" }}
        >
          {/* Header Title */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-white text-xs">
              <span className="text-blue-400">ℹ️</span>
              <span className="truncate">{content.title}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer p-0.5"
            >
              ✕
            </button>
          </div>

          {/* Description */}
          <p className="text-slate-300 leading-relaxed text-[11px] font-normal">
            {content.description}
          </p>

          {/* Example Box */}
          {content.example && (
            <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {isAr ? "مثال (Beispiel):" : currentLang === "de" ? "Beispiel:" : "Example:"}
              </span>
              <div className="font-mono text-[11px] text-blue-300 break-words whitespace-pre-line select-all">
                {content.example}
              </div>
            </div>
          )}

          {/* DIN 5008 / ATS Pro Tip */}
          {content.tip && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
              <span className="shrink-0 text-sm">💡</span>
              <div>
                <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-400">
                  {isAr ? "نصيحة ATS & DIN 5008:" : currentLang === "de" ? "DIN 5008 / ATS Tipp:" : "DIN 5008 & ATS Pro Tip:"}
                </span>
                <span>{content.tip}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
