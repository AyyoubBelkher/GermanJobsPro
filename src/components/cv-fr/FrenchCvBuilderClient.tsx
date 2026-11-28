"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  FRENCH_CV_DRAFT_STORAGE_KEY,
  FRENCH_LANGUAGE_LEVEL_OPTIONS,
  FrenchCvAccentColor,
  FrenchCvData,
  FrenchCvEducation,
  FrenchCvExperience,
  FrenchCvTemplate,
  MOROCCAN_CITY_SUGGESTIONS,
  MOROCCAN_DIPLOMA_PRESETS,
  MOROCCAN_LANGUAGE_PRESETS,
  buildFrenchCvFilename,
  createDefaultFrenchCv,
  createSampleFrenchCv,
  parseFrenchCvDraft,
  serializeFrenchCvDraft,
  validatePhotoDataUrl,
} from "@/lib/cv-fr";
import FrenchCvPreview from "@/components/cv-fr/FrenchCvPreview";

interface FrenchCvBuilderClientProps {
  locale: string;
  userEmail?: string | null;
  userName?: string | null;
}

interface UiLabels {
  pageTitle: string;
  pageSubtitle: string;
  atsBadge: string;
  loadSample: string;
  resetDraft: string;
  draftSaved: string;
  downloadPdf: string;
  downloadingPdf: string;
  editorTab: string;
  previewTab: string;
  templateTitle: string;
  templateClassic: string;
  templateClassicDesc: string;
  templateModern: string;
  templateModernDesc: string;
  accentNavy: string;
  accentTeal: string;
  youngGradToggle: string;
  youngGradHint: string;
  headerSection: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  phone: string;
  email: string;
  city: string;
  mobility: string;
  linkedin: string;
  drivingLicense: string;
  optionalPhoto: string;
  showPhotoToggle: string;
  uploadPhoto: string;
  removePhoto: string;
  privacyNote: string;
  summarySection: string;
  summaryPlaceholder: string;
  aiTitle: string;
  aiDesc: string;
  targetOfferLabel: string;
  targetOfferPlaceholder: string;
  aiOptimizeBtn: string;
  aiOptimizing: string;
  aiUndo: string;
  experienceSection: string;
  addExperience: string;
  roleLabel: string;
  companyLabel: string;
  cityLabel: string;
  startDateLabel: string;
  endDateLabel: string;
  currentLabel: string;
  bulletsLabel: string;
  addBullet: string;
  educationSection: string;
  addEducation: string;
  presetsLabel: string;
  degreeLabel: string;
  institutionLabel: string;
  yearLabel: string;
  detailsLabel: string;
  skillsSection: string;
  techSkillsLabel: string;
  softSkillsLabel: string;
  certsLabel: string;
  noBarsNote: string;
  addTagPlaceholder: string;
  addBtn: string;
  languagesSection: string;
  addLanguage: string;
  quickAddLang: string;
  interestsSection: string;
  interestsPlaceholder: string;
  moveUp: string;
  moveDown: string;
  remove: string;
  pdfError: string;
  aiSuccess: string;
  aiNeedInput: string;
}

function getUiLabels(locale: string): UiLabels {
  if (locale === "ar") {
    return {
      pageTitle: "منشئ السيرة الذاتية بالفرنسية (المغرب)",
      pageSubtitle: "أنشئ سيرة ذاتية فرنسية احترافية متوافقة مع أنظمة ATS وسوق الشغل المغربي والفرنكوفوني، مع معاينة فورية وتحميل PDF.",
      atsBadge: "متوافق مع ATS • معايير المغرب 2026",
      loadSample: "تحميل نموذج مغربي جاهز",
      resetDraft: "إعادة تعيين",
      draftSaved: "تم الحفظ تلقائياً في المتصفح",
      downloadPdf: "تحميل PDF (A4)",
      downloadingPdf: "جارٍ إنشاء ملف PDF...",
      editorTab: "تحرير البيانات",
      previewTab: "معاينة السيرة A4",
      templateTitle: "القالب وترتيب الأقسام",
      templateClassic: "ATS Classique (عمود واحد)",
      templateClassicDesc: "مثالي للشركات الكبرى وبوابات التوظيف الرقمية",
      templateModern: "Moderne Marocain (حديث وأنيق)",
      templateModernDesc: "ترويسة منظمة بلون هادئ مع إمكانية إضافة صورة",
      accentNavy: "أزرق داكن",
      accentTeal: "أخضر زمردي",
      youngGradToggle: "وضع خريج جديد (Profil Jeune Diplômé)",
      youngGradHint: "يعرض التكوين والدبلومات (Formation) قبل الخبرات المهنية.",
      headerSection: "1. المعلومات الشخصية (En-tête)",
      firstName: "الاسم الشخصي (Prénom)",
      lastName: "الاسم العائلي (NOM)",
      jobTitle: "المسمى الوظيفي المستهدف (بالفرنسية)",
      phone: "رقم الهاتف",
      email: "البريد الإلكتروني",
      city: "المدينة والبلد",
      mobility: "التنقل (اختياري)",
      linkedin: "رابط LinkedIn (اختياري)",
      drivingLicense: "رخصة السياقة (اختياري)",
      optionalPhoto: "صورة شخصية احترافية (اختياري لقالب Moderne Marocain)",
      showPhotoToggle: "إظهار الصورة في السيرة",
      uploadPhoto: "رفع صورة (PNG / JPG)",
      removePhoto: "حذف الصورة",
      privacyNote: "ملاحظة: لا يتطلب هذا القالب رقم البطاقة الوطنية (CIN) أو الحالة العائلية أو تاريخ الازدياد.",
      summarySection: "2. الملخص المهني (Profil Professionnel)",
      summaryPlaceholder: "اكتب فقرة موجزة بالفرنسية (3 إلى 4 أسطر) تلخص مؤهلاتك وأهدافك...",
      aiTitle: "تحسين الصياغة بالذكاء الاصطناعي (فرنسية احترافية)",
      aiDesc: "يحوّل الملخص ونقاط الخبرة الأولى إلى صياغة فرنسية قوية ومتوافقة مع ATS دون اختلاق أي معلومات.",
      targetOfferLabel: "نص إعلان الوظيفة المستهدف (اختياري)",
      targetOfferPlaceholder: "الصق هنا متطلبات الوظيفة لمواءمة الكلمات المفتاحية...",
      aiOptimizeBtn: "تحسين بالذكاء الاصطناعي ✨",
      aiOptimizing: "جارٍ التحسين...",
      aiUndo: "تراجع عن التعديل",
      experienceSection: "3. الخبرات والتداريب (Expériences & Stages)",
      addExperience: "+ إضافة خبرة / تدريب",
      roleLabel: "المنصب / التدريب (Poste)",
      companyLabel: "الشركة / المؤسسة",
      cityLabel: "المدينة",
      startDateLabel: "تاريخ البداية",
      endDateLabel: "تاريخ النهاية",
      currentLabel: "أعمل هنا حالياً (Présent)",
      bulletsLabel: "المهام والإنجازات (كل سطر نقطة)",
      addBullet: "+ إضافة نقطة",
      educationSection: "4. التكوين والشهادات (Formation)",
      addEducation: "+ إضافة تكوين",
      presetsLabel: "اختيار سريع للدبلومات المغربية:",
      degreeLabel: "الدبلوم / الشهادة",
      institutionLabel: "المؤسسة / المعهد / الجامعة",
      yearLabel: "السنة / الفترة",
      detailsLabel: "تفاصيل إضافية (التخصص، الميزة...)",
      skillsSection: "5. المهارات (Compétences)",
      techSkillsLabel: "المهارات التقنية (Compétences techniques)",
      softSkillsLabel: "المهارات الشخصية (Qualités personnelles)",
      certsLabel: "الشهادات المهنية (Certifications)",
      noBarsNote: "بدون أشرطة نسبة أو نجوم لضمان قراءة مثالية من أنظمة ATS.",
      addTagPlaceholder: "أضف عنصراً واضغط Enter...",
      addBtn: "إضافة",
      languagesSection: "6. اللغات (Langues)",
      addLanguage: "+ إضافة لغة",
      quickAddLang: "إضافة سريعة:",
      interestsSection: "7. الاهتمامات والعمل الجمعوي (Centres d'intérêt)",
      interestsPlaceholder: "مثال: التطوع الجمعوي، اليقظة التكنولوجية...",
      moveUp: "أعلى",
      moveDown: "أسفل",
      remove: "حذف",
      pdfError: "تعذر إنشاء ملف PDF. تأكد من صحة الحقول وحاول مجدداً.",
      aiSuccess: "تم تحسين الصياغة الفرنسية بنجاح!",
      aiNeedInput: "يرجى إدخال المسمى الوظيفي مع الملخص أو نقطة خبرة واحدة على الأقل.",
    };
  }

  if (locale === "de") {
    return {
      pageTitle: "Französischer Lebenslauf-Generator (Marokko)",
      pageSubtitle: "Erstellen Sie einen ATS-konformen französischen Lebenslauf für Marokko und den frankophonen Arbeitsmarkt.",
      atsBadge: "ATS-Optimiert • Marokko 2026",
      loadSample: "Marokko-Beispiel laden",
      resetDraft: "Zurücksetzen",
      draftSaved: "Lokal automatisch gespeichert",
      downloadPdf: "PDF herunterladen (A4)",
      downloadingPdf: "PDF wird erstellt...",
      editorTab: "Editor",
      previewTab: "A4-Vorschau",
      templateTitle: "Vorlage & Reihenfolge",
      templateClassic: "ATS Classique (1-spaltig)",
      templateClassicDesc: "Ideal für Großunternehmen und ATS-Portale",
      templateModern: "Moderne Marocain (Akzent)",
      templateModernDesc: "Strukturierter Header mit optionalem Foto",
      accentNavy: "Marineblau",
      accentTeal: "Petrol",
      youngGradToggle: "Berufseinsteiger-Modus (Profil Jeune Diplômé)",
      youngGradHint: "Platziert Ausbildung (Formation) vor Berufserfahrung.",
      headerSection: "1. Kopfzeile (En-tête)",
      firstName: "Vorname (Prénom)",
      lastName: "Nachname (NOM)",
      jobTitle: "Zielposition (auf Französisch)",
      phone: "Telefon",
      email: "E-Mail",
      city: "Stadt, Land",
      mobility: "Mobilität (optional)",
      linkedin: "LinkedIn (optional)",
      drivingLicense: "Führerschein (optional)",
      optionalPhoto: "Optionales Foto (nur Moderne Marocain)",
      showPhotoToggle: "Foto anzeigen",
      uploadPhoto: "Foto hochladen",
      removePhoto: "Foto entfernen",
      privacyNote: "Hinweis: Keine CIN-Nummer, kein Familienstand und kein Geburtsdatum erforderlich.",
      summarySection: "2. Kurzprofil (Profil Professionnel)",
      summaryPlaceholder: "3–4 prägnante Sätze auf Französisch...",
      aiTitle: "KI-Feinschliff auf Französisch",
      aiDesc: "Optimiert Profil und erste Erfahrungs-Bullets mit französischen Aktionsverben.",
      targetOfferLabel: "Ziel-Stellenanzeige (optional)",
      targetOfferPlaceholder: "Stellenbeschreibung hier einfügen...",
      aiOptimizeBtn: "Mit KI optimieren ✨",
      aiOptimizing: "Optimiere...",
      aiUndo: "Rückgängig",
      experienceSection: "3. Berufserfahrung & Praktika",
      addExperience: "+ Erfahrung hinzufügen",
      roleLabel: "Position",
      companyLabel: "Unternehmen",
      cityLabel: "Stadt",
      startDateLabel: "Beginn",
      endDateLabel: "Ende",
      currentLabel: "Aktuell",
      bulletsLabel: "Aufgaben & Erfolge",
      addBullet: "+ Stichpunkt",
      educationSection: "4. Ausbildung (Formation)",
      addEducation: "+ Ausbildung hinzufügen",
      presetsLabel: "Marokkanische Abschlüsse:",
      degreeLabel: "Abschluss",
      institutionLabel: "Hochschule / Institut",
      yearLabel: "Jahr / Zeitraum",
      detailsLabel: "Details (Schwerpunkt, Note...)",
      skillsSection: "5. Kompetenzen (Compétences)",
      techSkillsLabel: "Fachkompetenzen",
      softSkillsLabel: "Soft Skills",
      certsLabel: "Zertifikate",
      noBarsNote: "Keine Fortschrittsbalken oder Sterne für volle ATS-Lesbarkeit.",
      addTagPlaceholder: "Eintrag eingeben + Enter...",
      addBtn: "Hinzufügen",
      languagesSection: "6. Sprachen (Langues)",
      addLanguage: "+ Sprache hinzufügen",
      quickAddLang: "Schnell hinzufügen:",
      interestsSection: "7. Interessen & Ehrenamt",
      interestsPlaceholder: "z.B. Ehrenamt, Technik...",
      moveUp: "Hoch",
      moveDown: "Runter",
      remove: "Löschen",
      pdfError: "PDF konnte nicht erstellt werden.",
      aiSuccess: "Französische Formulierung erfolgreich optimiert!",
      aiNeedInput: "Bitte Zielposition sowie Kurzprofil oder Stichpunkte angeben.",
    };
  }

  if (locale === "en") {
    return {
      pageTitle: "French CV Builder (Morocco)",
      pageSubtitle: "Create an ATS-friendly French resume tailored for Morocco and Francophone employers, with live A4 preview and PDF export.",
      atsBadge: "ATS-Safe • Morocco 2026 Standards",
      loadSample: "Load Morocco Sample",
      resetDraft: "Reset Draft",
      draftSaved: "Auto-saved locally",
      downloadPdf: "Download PDF (A4)",
      downloadingPdf: "Generating PDF...",
      editorTab: "Editor",
      previewTab: "A4 Preview",
      templateTitle: "Template & Section Order",
      templateClassic: "ATS Classique (Single-column)",
      templateClassicDesc: "Best for large companies & ATS portals",
      templateModern: "Moderne Marocain (Subtle Accent)",
      templateModernDesc: "Clean structured header with optional photo",
      accentNavy: "Navy",
      accentTeal: "Teal",
      youngGradToggle: "Recent Graduate Mode (Profil Jeune Diplômé)",
      youngGradHint: "Places Education (Formation) above Work Experience.",
      headerSection: "1. Header (En-tête)",
      firstName: "First Name (Prénom)",
      lastName: "Last Name (NOM)",
      jobTitle: "Target Job Title (in French)",
      phone: "Phone",
      email: "Email",
      city: "City, Country",
      mobility: "Mobility (optional)",
      linkedin: "LinkedIn (optional)",
      drivingLicense: "Driving License (optional)",
      optionalPhoto: "Optional Photo (for Moderne Marocain)",
      showPhotoToggle: "Show photo on CV",
      uploadPhoto: "Upload Photo",
      removePhoto: "Remove Photo",
      privacyNote: "Note: Never asks for CIN, marital status, or date of birth.",
      summarySection: "2. Professional Summary (Profil Professionnel)",
      summaryPlaceholder: "Write 3–4 concise lines in French...",
      aiTitle: "AI French Polish",
      aiDesc: "Rewrites your summary and primary experience bullets with strong French action verbs without inventing facts.",
      targetOfferLabel: "Target Job Posting (optional)",
      targetOfferPlaceholder: "Paste target job offer text to align keywords...",
      aiOptimizeBtn: "Polish in French ✨",
      aiOptimizing: "Polishing...",
      aiUndo: "Undo AI Edit",
      experienceSection: "3. Experience & Internships",
      addExperience: "+ Add Experience",
      roleLabel: "Role / Position",
      companyLabel: "Company / Organization",
      cityLabel: "City",
      startDateLabel: "Start Date",
      endDateLabel: "End Date",
      currentLabel: "Current role",
      bulletsLabel: "Key Achievements (Bullets)",
      addBullet: "+ Add bullet",
      educationSection: "4. Education (Formation)",
      addEducation: "+ Add Education",
      presetsLabel: "Moroccan diploma presets:",
      degreeLabel: "Degree / Diploma",
      institutionLabel: "Institution / School",
      yearLabel: "Year / Period",
      detailsLabel: "Details (Major, Honors...)",
      skillsSection: "5. Skills (Compétences)",
      techSkillsLabel: "Technical Skills",
      softSkillsLabel: "Soft Skills",
      certsLabel: "Certifications",
      noBarsNote: "No progress bars or star ratings for clean ATS parsing.",
      addTagPlaceholder: "Type item and press Enter...",
      addBtn: "Add",
      languagesSection: "6. Languages (Langues)",
      addLanguage: "+ Add Language",
      quickAddLang: "Quick add:",
      interestsSection: "7. Interests & Associations",
      interestsPlaceholder: "e.g. Volunteering, Tech watch...",
      moveUp: "Up",
      moveDown: "Down",
      remove: "Remove",
      pdfError: "Failed to generate PDF. Please check your entries.",
      aiSuccess: "French phrasing polished successfully!",
      aiNeedInput: "Please enter a job title plus summary or experience bullets.",
    };
  }

  // Default: "fr"
  return {
    pageTitle: "Créateur de CV en Français (Maroc)",
    pageSubtitle: "Concevez un CV français professionnel, structuré et compatible ATS pour le marché marocain et francophone.",
    atsBadge: "Compatible ATS • Standards Maroc 2026",
    loadSample: "Charger un exemple Maroc",
    resetDraft: "Réinitialiser",
    draftSaved: "Brouillon enregistré localement",
    downloadPdf: "Télécharger PDF (A4)",
    downloadingPdf: "Génération du PDF...",
    editorTab: "Éditeur",
    previewTab: "Aperçu A4",
    templateTitle: "Modèle & Ordre des sections",
    templateClassic: "ATS Classique (1 colonne)",
    templateClassicDesc: "Idéal pour les grandes entreprises et portails ATS",
    templateModern: "Moderne Marocain (Accent subtil)",
    templateModernDesc: "En-tête structuré avec photo optionnelle",
    accentNavy: "Bleu Nuit",
    accentTeal: "Vert Émeraude",
    youngGradToggle: "Profil Jeune Diplômé",
    youngGradHint: "Place la rubrique Formation avant les Expériences Professionnelles.",
    headerSection: "1. En-tête & Coordonnées",
    firstName: "Prénom",
    lastName: "NOM",
    jobTitle: "Titre du poste visé",
    phone: "Téléphone",
    email: "Email",
    city: "Ville, Pays",
    mobility: "Mobilité (optionnel)",
    linkedin: "LinkedIn (optionnel)",
    drivingLicense: "Permis (optionnel)",
    optionalPhoto: "Photo professionnelle (optionnelle, modèle Moderne)",
    showPhotoToggle: "Afficher la photo sur le CV",
    uploadPhoto: "Importer une photo",
    removePhoto: "Retirer",
    privacyNote: "Note : Aucune mention de CIN, situation familiale ou date de naissance n'est demandée.",
    summarySection: "2. Profil Professionnel",
    summaryPlaceholder: "Rédigez un résumé concis de 3 à 4 lignes mettant en avant votre valeur ajoutée...",
    aiTitle: "Optimisation IA (Français ATS)",
    aiDesc: "Reformule votre Profil et vos réalisations avec des verbes d'action percutants, sans jamais inventer de faits.",
    targetOfferLabel: "Offre d'emploi cible (optionnel)",
    targetOfferPlaceholder: "Collez l'annonce cible pour adapter naturellement les mots-clés...",
    aiOptimizeBtn: "Améliorer avec l'IA ✨",
    aiOptimizing: "Optimisation en cours...",
    aiUndo: "Annuler l'optimisation IA",
    experienceSection: "3. Expériences Professionnelles / Stages",
    addExperience: "+ Ajouter une expérience",
    roleLabel: "Intitulé du poste / Stage",
    companyLabel: "Entreprise / Organisme",
    cityLabel: "Ville",
    startDateLabel: "Date de début",
    endDateLabel: "Date de fin",
    currentLabel: "Poste actuel",
    bulletsLabel: "Missions & réalisations",
    addBullet: "+ Ajouter une puce",
    educationSection: "4. Formation",
    addEducation: "+ Ajouter une formation",
    presetsLabel: "Diplômes marocains (ajout rapide) :",
    degreeLabel: "Diplôme / Intitulé",
    institutionLabel: "Établissement / École / Université",
    yearLabel: "Année / Période",
    detailsLabel: "Précisions (Spécialité, Mention...)",
    skillsSection: "5. Compétences",
    techSkillsLabel: "Compétences techniques",
    softSkillsLabel: "Qualités personnelles (Soft Skills)",
    certsLabel: "Certifications",
    noBarsNote: "Sans barres de progression ni étoiles pour une lecture ATS parfaite.",
    addTagPlaceholder: "Saisir puis Entrée...",
    addBtn: "Ajouter",
    languagesSection: "6. Langues",
    addLanguage: "+ Ajouter une langue",
    quickAddLang: "Ajout rapide :",
    interestsSection: "7. Centres d'intérêt & Vie associative",
    interestsPlaceholder: "Ex : Bénévolat, Veille technologique...",
    moveUp: "Monter",
    moveDown: "Descendre",
    remove: "Supprimer",
    pdfError: "Erreur lors de la génération du PDF. Veuillez vérifier vos champs.",
    aiSuccess: "Profil et réalisations optimisés en français ATS !",
    aiNeedInput: "Veuillez renseigner le titre du poste et au moins un résumé ou une réalisation.",
  };
}

function splitName(fullName?: string | null): { firstName: string; lastName: string } {
  const clean = (fullName || "").trim();
  if (!clean) return { firstName: "", lastName: "" };
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export default function FrenchCvBuilderClient({
  locale,
  userEmail,
  userName,
}: FrenchCvBuilderClientProps) {
  const isAr = locale === "ar";
  const ui = getUiLabels(locale);

  const [cv, setCv] = useState<FrenchCvData>(() => {
    const { firstName, lastName } = splitName(userName);
    return createDefaultFrenchCv({
      firstName,
      lastName,
      email: userEmail || "",
    });
  });

  const [hydrated, setHydrated] = useState(false);
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");
  const [savedLabel, setSavedLabel] = useState(false);

  const [techInput, setTechInput] = useState("");
  const [softInput, setSoftInput] = useState("");
  const [certInput, setCertInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [targetOffer, setTargetOffer] = useState("");
  const [aiTargetExpIndex, setAiTargetExpIndex] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<FrenchCvData | null>(null);

  // Load draft from localStorage once on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(FRENCH_CV_DRAFT_STORAGE_KEY);
      const parsed = parseFrenchCvDraft(stored);
      if (parsed) {
        setCv(parsed);
      }
    } catch {
      // Ignore storage access errors
    } finally {
      setHydrated(true);
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(FRENCH_CV_DRAFT_STORAGE_KEY, serializeFrenchCvDraft(cv));
      setSavedLabel(true);
    } catch {
      // Ignore storage quota errors
    }
  }, [cv, hydrated]);

  const updateHeader = <K extends keyof FrenchCvData["header"]>(
    key: K,
    value: FrenchCvData["header"][K]
  ) => {
    setCv((prev) => ({
      ...prev,
      header: { ...prev.header, [key]: value },
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg)$/i.test(file.type)) {
      setPhotoError("Format accepté : PNG ou JPG uniquement.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("La photo ne doit pas dépasser 2 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const validation = validatePhotoDataUrl(result);
      if (!validation.valid) {
        setPhotoError(validation.error || "Image invalide.");
        return;
      }
      setCv((prev) => ({
        ...prev,
        template: "maroc-modern",
        header: {
          ...prev.header,
          showPhoto: true,
          photoDataUrl: result,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setCv((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        showPhoto: false,
        photoDataUrl: "",
      },
    }));
  };

  const handleLoadSample = () => {
    setCv(createSampleFrenchCv());
    setAiStatus(null);
    setPdfError(null);
  };

  const handleResetDraft = () => {
    const { firstName, lastName } = splitName(userName);
    const fresh = createDefaultFrenchCv({
      firstName,
      lastName,
      email: userEmail || "",
    });
    setCv(fresh);
    setUndoSnapshot(null);
    setAiStatus(null);
    setPdfError(null);
  };

  // Experience helpers
  const addExperience = () => {
    const newExp: FrenchCvExperience = {
      id: `exp-${Date.now()}`,
      role: "",
      company: "",
      city: "",
      startDate: "",
      endDate: "",
      current: false,
      bullets: [""],
    };
    setCv((prev) => ({ ...prev, experiences: [...prev.experiences, newExp] }));
  };

  const updateExperience = (index: number, patch: Partial<FrenchCvExperience>) => {
    setCv((prev) => ({
      ...prev,
      experiences: prev.experiences.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };

  const moveExperience = (index: number, delta: -1 | 1) => {
    setCv((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.experiences.length) return prev;
      const copy = [...prev.experiences];
      const [moved] = copy.splice(index, 1);
      copy.splice(target, 0, moved);
      return { ...prev, experiences: copy };
    });
  };

  const removeExperience = (index: number) => {
    setCv((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index),
    }));
  };

  // Education helpers
  const addEducation = (degreePreset = "") => {
    const newEdu: FrenchCvEducation = {
      id: `edu-${Date.now()}`,
      degree: degreePreset,
      institution: "",
      city: "",
      year: "",
      details: "",
    };
    setCv((prev) => ({ ...prev, educations: [...prev.educations, newEdu] }));
  };

  const applyMoroccanPreset = (preset: string) => {
    setCv((prev) => {
      const emptyIdx = prev.educations.findIndex((e) => !e.degree.trim());
      if (emptyIdx !== -1) {
        return {
          ...prev,
          educations: prev.educations.map((e, i) =>
            i === emptyIdx ? { ...e, degree: preset } : e
          ),
        };
      }
      return {
        ...prev,
        educations: [
          ...prev.educations,
          {
            id: `edu-${Date.now()}`,
            degree: preset,
            institution: "",
            city: "",
            year: "",
            details: "",
          },
        ],
      };
    });
  };

  const updateEducation = (index: number, patch: Partial<FrenchCvEducation>) => {
    setCv((prev) => ({
      ...prev,
      educations: prev.educations.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };

  const moveEducation = (index: number, delta: -1 | 1) => {
    setCv((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.educations.length) return prev;
      const copy = [...prev.educations];
      const [moved] = copy.splice(index, 1);
      copy.splice(target, 0, moved);
      return { ...prev, educations: copy };
    });
  };

  const removeEducation = (index: number) => {
    setCv((prev) => ({
      ...prev,
      educations: prev.educations.filter((_, i) => i !== index),
    }));
  };

  // Skill & Interest tag helpers
  const addSkillTag = (
    bucket: "technicalSkills" | "softSkills" | "certifications",
    raw: string,
    clearFn: () => void
  ) => {
    const val = raw.trim();
    if (!val) return;
    setCv((prev) => {
      if (prev.skills[bucket].includes(val)) return prev;
      return {
        ...prev,
        skills: {
          ...prev.skills,
          [bucket]: [...prev.skills[bucket], val],
        },
      };
    });
    clearFn();
  };

  const removeSkillTag = (
    bucket: "technicalSkills" | "softSkills" | "certifications",
    idx: number
  ) => {
    setCv((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [bucket]: prev.skills[bucket].filter((_, i) => i !== idx),
      },
    }));
  };

  const addInterestTag = () => {
    const val = interestInput.trim();
    if (!val) return;
    setCv((prev) => {
      if (prev.interests.includes(val)) return prev;
      return { ...prev, interests: [...prev.interests, val] };
    });
    setInterestInput("");
  };

  // Language helpers
  const addLanguage = (language = "", level = "Intermédiaire — B2") => {
    setCv((prev) => ({
      ...prev,
      languages: [
        ...prev.languages,
        { id: `lang-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, language, level },
      ],
    }));
  };

  const quickAddLanguage = (preset: { language: string; level: string }) => {
    setCv((prev) => {
      const exists = prev.languages.some(
        (l) => l.language.trim().toLowerCase() === preset.language.toLowerCase()
      );
      if (exists) return prev;
      return {
        ...prev,
        languages: [
          ...prev.languages,
          { id: `lang-${Date.now()}`, language: preset.language, level: preset.level },
        ],
      };
    });
  };

  // AI Polish handler
  const handleAiPolish = async () => {
    setAiStatus(null);
    const targetExp = cv.experiences[aiTargetExpIndex];
    const bulletsToPolish = targetExp
      ? targetExp.bullets.map((b) => b.trim()).filter(Boolean)
      : [];

    if (!cv.header.jobTitle.trim() || (!cv.summary.trim() && bulletsToPolish.length === 0)) {
      setAiStatus({ type: "error", text: ui.aiNeedInput });
      return;
    }

    setAiLoading(true);
    try {
      const res = await fetch("/api/cv-fr/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: cv.header.jobTitle.trim(),
          summary: cv.summary.trim(),
          bullets: bulletsToPolish,
          targetOffer: targetOffer.trim(),
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        optimizedSummary?: string;
        optimizedBullets?: string[];
        error?: string;
        message?: string;
      } | null;

      if (!res.ok || !data?.success) {
        setAiStatus({
          type: "error",
          text: data?.message || data?.error || "Optimisation IA indisponible.",
        });
        return;
      }

      setUndoSnapshot(cv);
      setCv((prev) => ({
        ...prev,
        summary: data.optimizedSummary || prev.summary,
        experiences:
          targetExp &&
          Array.isArray(data.optimizedBullets) &&
          data.optimizedBullets.length > 0
            ? prev.experiences.map((exp, idx) =>
                idx === aiTargetExpIndex
                  ? { ...exp, bullets: data.optimizedBullets! }
                  : exp
              )
            : prev.experiences,
      }));
      setAiStatus({ type: "success", text: ui.aiSuccess });
    } catch {
      setAiStatus({
        type: "error",
        text: "Erreur réseau lors de l'optimisation IA.",
      });
    } finally {
      setAiLoading(false);
    }
  };

  // PDF Download handler
  const handleDownloadPdf = async () => {
    setPdfError(null);
    setPdfLoading(true);
    try {
      const res = await fetch("/api/cv-fr/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cv),
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errJson?.error || ui.pdfError);
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const filenameMatch = /filename="([^"]+)"/i.exec(disposition);
      const filename =
        filenameMatch?.[1] ||
        buildFrenchCvFilename(cv.header.firstName, cv.header.lastName);

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : ui.pdfError);
    } finally {
      setPdfLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl bg-slate-950/80 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-400 transition-colors";
  const labelClass = "block text-xs font-semibold text-slate-300 mb-1";
  const cardClass =
    "rounded-2xl bg-slate-900/70 border border-slate-800/90 p-5 space-y-4";

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* Top Hero & Action Bar */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 border border-slate-800 p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-300 text-xs font-bold">
            <span>🇲🇦</span>
            <span>{ui.atsBadge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {ui.pageTitle}
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">{ui.pageSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {savedLabel && (
            <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
              ✓ {ui.draftSaved}
            </span>
          )}
          <button
            type="button"
            onClick={handleLoadSample}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            {ui.loadSample}
          </button>
          <button
            type="button"
            onClick={handleResetDraft}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 text-xs font-semibold border border-slate-800 hover:border-rose-500/30 transition-colors cursor-pointer"
          >
            {ui.resetDraft}
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 text-xs sm:text-sm font-extrabold shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
          >
            {pdfLoading ? ui.downloadingPdf : `⬇ ${ui.downloadPdf}`}
          </button>
        </div>
      </div>

      {pdfError && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 text-sm">
          {pdfError}
        </div>
      )}

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden rounded-2xl bg-slate-900 border border-slate-800 p-1 gap-1">
        <button
          type="button"
          onClick={() => setMobileView("editor")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
            mobileView === "editor"
              ? "bg-teal-500 text-slate-950"
              : "text-slate-300 hover:text-white"
          }`}
        >
          {ui.editorTab}
        </button>
        <button
          type="button"
          onClick={() => setMobileView("preview")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
            mobileView === "preview"
              ? "bg-teal-500 text-slate-950"
              : "text-slate-300 hover:text-white"
          }`}
        >
          {ui.previewTab}
        </button>
      </div>

      {/* Split-Screen Editor + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: EDITOR */}
        <div
          className={`lg:col-span-6 space-y-5 ${
            mobileView === "preview" ? "hidden lg:block" : ""
          }`}
        >
          {/* Template & Graduate Toggle */}
          <div className={cardClass}>
            <h2 className="text-base font-bold text-white">{ui.templateTitle}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  {
                    id: "ats-classic" as FrenchCvTemplate,
                    title: ui.templateClassic,
                    desc: ui.templateClassicDesc,
                  },
                  {
                    id: "maroc-modern" as FrenchCvTemplate,
                    title: ui.templateModern,
                    desc: ui.templateModernDesc,
                  },
                ] as const
              ).map((tpl) => {
                const active = cv.template === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setCv((prev) => ({ ...prev, template: tpl.id }))}
                    className={`text-start p-3.5 rounded-xl border transition-all cursor-pointer ${
                      active
                        ? "bg-teal-500/15 border-teal-400 text-white"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-sm font-bold">{tpl.title}</div>
                    <div className="text-xs text-slate-400 mt-1">{tpl.desc}</div>
                  </button>
                );
              })}
            </div>

            {cv.template === "maroc-modern" && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {(
                  [
                    { color: "#1e3a5f" as FrenchCvAccentColor, label: ui.accentNavy },
                    { color: "#0f766e" as FrenchCvAccentColor, label: ui.accentTeal },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.color}
                    type="button"
                    onClick={() => setCv((prev) => ({ ...prev, accentColor: item.color }))}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                      cv.accentColor === item.color
                        ? "border-white bg-slate-800 text-white"
                        : "border-slate-800 bg-slate-950 text-slate-400"
                    }`}
                  >
                    <span
                      style={{ backgroundColor: item.color }}
                      className="w-3.5 h-3.5 rounded-full inline-block"
                    />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={cv.educationFirst}
                onChange={(e) =>
                  setCv((prev) => ({ ...prev, educationFirst: e.target.checked }))
                }
                className="mt-0.5 h-4 w-4 rounded accent-teal-500"
              />
              <div>
                <span className="block text-sm font-bold text-white">
                  {ui.youngGradToggle}
                </span>
                <span className="block text-xs text-slate-400">{ui.youngGradHint}</span>
              </div>
            </label>
          </div>

          {/* 1. Header */}
          <div className={cardClass}>
            <h2 className="text-base font-bold text-white">{ui.headerSection}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{ui.firstName}</label>
                <input
                  dir="ltr"
                  type="text"
                  value={cv.header.firstName}
                  onChange={(e) => updateHeader("firstName", e.target.value)}
                  placeholder="Oussama"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{ui.lastName}</label>
                <input
                  dir="ltr"
                  type="text"
                  value={cv.header.lastName}
                  onChange={(e) => updateHeader("lastName", e.target.value)}
                  placeholder="El Koromi"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>{ui.jobTitle}</label>
              <input
                dir="ltr"
                type="text"
                value={cv.header.jobTitle}
                onChange={(e) => updateHeader("jobTitle", e.target.value)}
                placeholder="Technicien Spécialisé en Gestion / Développeur Full-Stack Junior"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{ui.phone}</label>
                <input
                  dir="ltr"
                  type="tel"
                  value={cv.header.phone}
                  onChange={(e) => updateHeader("phone", e.target.value)}
                  placeholder="+212 6 XX XX XX XX"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{ui.email}</label>
                <input
                  dir="ltr"
                  type="email"
                  value={cv.header.email}
                  onChange={(e) => updateHeader("email", e.target.value)}
                  placeholder="nom.prenom@email.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{ui.city}</label>
                <input
                  dir="ltr"
                  type="text"
                  list="morocco-cities"
                  value={cv.header.city}
                  onChange={(e) => updateHeader("city", e.target.value)}
                  placeholder="Casablanca, Maroc"
                  className={inputClass}
                />
                <datalist id="morocco-cities">
                  {MOROCCAN_CITY_SUGGESTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className={labelClass}>{ui.mobility}</label>
                <input
                  dir="ltr"
                  type="text"
                  value={cv.header.mobility || ""}
                  onChange={(e) => updateHeader("mobility", e.target.value)}
                  placeholder="Mobilité nationale"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{ui.linkedin}</label>
                <input
                  dir="ltr"
                  type="text"
                  value={cv.header.linkedin || ""}
                  onChange={(e) => updateHeader("linkedin", e.target.value)}
                  placeholder="linkedin.com/in/votre-profil"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{ui.drivingLicense}</label>
                <input
                  dir="ltr"
                  type="text"
                  value={cv.header.drivingLicense || ""}
                  onChange={(e) => updateHeader("drivingLicense", e.target.value)}
                  placeholder="Permis B"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Optional Photo */}
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-300">
                  {ui.optionalPhoto}
                </span>
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(cv.header.showPhoto)}
                    onChange={(e) => updateHeader("showPhoto", e.target.checked)}
                    className="h-4 w-4 rounded accent-teal-500"
                  />
                  <span>{ui.showPhotoToggle}</span>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="cv-fr-photo-upload"
                />
                <label
                  htmlFor="cv-fr-photo-upload"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700"
                >
                  {ui.uploadPhoto}
                </label>
                {cv.header.photoDataUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/20 cursor-pointer"
                  >
                    {ui.removePhoto}
                  </button>
                )}
              </div>
              {photoError && <p className="text-xs text-rose-400">{photoError}</p>}
              <p className="text-[11px] text-slate-400">{ui.privacyNote}</p>
            </div>
          </div>

          {/* 2. Summary & AI Polish */}
          <div className={cardClass}>
            <h2 className="text-base font-bold text-white">{ui.summarySection}</h2>
            <textarea
              dir="ltr"
              rows={4}
              value={cv.summary}
              onChange={(e) => setCv((prev) => ({ ...prev, summary: e.target.value }))}
              placeholder={ui.summaryPlaceholder}
              className={inputClass}
            />

            <div className="rounded-xl bg-teal-950/30 border border-teal-500/25 p-4 space-y-3">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-teal-300">{ui.aiTitle}</h3>
                <p className="text-[11px] text-slate-400">{ui.aiDesc}</p>
              </div>
              {cv.experiences.length > 1 && (
                <div>
                  <label className={labelClass}>Expérience ciblée pour les puces</label>
                  <select
                    value={aiTargetExpIndex}
                    onChange={(e) => setAiTargetExpIndex(Number(e.target.value))}
                    className={inputClass}
                  >
                    {cv.experiences.map((exp, idx) => (
                      <option key={exp.id} value={idx}>
                        #{idx + 1} — {exp.role || exp.company || "Expérience"}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className={labelClass}>{ui.targetOfferLabel}</label>
                <textarea
                  dir="ltr"
                  rows={2}
                  value={targetOffer}
                  onChange={(e) => setTargetOffer(e.target.value)}
                  placeholder={ui.targetOfferPlaceholder}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAiPolish}
                  disabled={aiLoading}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer"
                >
                  {aiLoading ? ui.aiOptimizing : ui.aiOptimizeBtn}
                </button>
                {undoSnapshot && (
                  <button
                    type="button"
                    onClick={() => {
                      setCv(undoSnapshot);
                      setUndoSnapshot(null);
                      setAiStatus(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    {ui.aiUndo}
                  </button>
                )}
              </div>
              {aiStatus && (
                <p
                  className={`text-xs font-medium ${
                    aiStatus.type === "success" ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {aiStatus.text}
                </p>
              )}
            </div>
          </div>

          {/* 3. Experiences */}
          <div className={cardClass}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-white">{ui.experienceSection}</h2>
              <button
                type="button"
                onClick={addExperience}
                className="px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-bold cursor-pointer"
              >
                {ui.addExperience}
              </button>
            </div>

            <div className="space-y-4">
              {cv.experiences.map((exp, idx) => (
                <div
                  key={exp.id}
                  className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => moveExperience(idx, -1)}
                        disabled={idx === 0}
                        className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 disabled:opacity-30 cursor-pointer"
                      >
                        ↑ {ui.moveUp}
                      </button>
                      <button
                        type="button"
                        onClick={() => moveExperience(idx, 1)}
                        disabled={idx === cv.experiences.length - 1}
                        className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 disabled:opacity-30 cursor-pointer"
                      >
                        ↓ {ui.moveDown}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExperience(idx)}
                        className="px-2 py-1 rounded bg-rose-500/10 text-xs text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                      >
                        {ui.remove}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>{ui.roleLabel}</label>
                      <input
                        dir="ltr"
                        type="text"
                        value={exp.role}
                        onChange={(e) => updateExperience(idx, { role: e.target.value })}
                        placeholder="Stagiaire Développeur Web (PFE)"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{ui.companyLabel}</label>
                      <input
                        dir="ltr"
                        type="text"
                        value={exp.company}
                        onChange={(e) => updateExperience(idx, { company: e.target.value })}
                        placeholder="Entreprise Maroc SARL"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>{ui.cityLabel}</label>
                      <input
                        dir="ltr"
                        type="text"
                        value={exp.city}
                        onChange={(e) => updateExperience(idx, { city: e.target.value })}
                        placeholder="Casablanca"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{ui.startDateLabel}</label>
                      <input
                        dir="ltr"
                        type="text"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(idx, { startDate: e.target.value })}
                        placeholder="Fév 2026"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{ui.endDateLabel}</label>
                      <input
                        dir="ltr"
                        type="text"
                        disabled={exp.current}
                        value={exp.current ? "Présent" : exp.endDate}
                        onChange={(e) => updateExperience(idx, { endDate: e.target.value })}
                        placeholder="Mai 2026"
                        className={`${inputClass} disabled:opacity-50`}
                      />
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exp.current}
                      onChange={(e) => updateExperience(idx, { current: e.target.checked })}
                      className="h-4 w-4 rounded accent-teal-500"
                    />
                    <span>{ui.currentLabel}</span>
                  </label>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className={labelClass}>{ui.bulletsLabel}</label>
                      <button
                        type="button"
                        onClick={() =>
                          updateExperience(idx, { bullets: [...exp.bullets, ""] })
                        }
                        className="text-xs text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
                      >
                        {ui.addBullet}
                      </button>
                    </div>
                    {exp.bullets.map((bullet, bIdx) => (
                      <div key={`${exp.id}-in-${bIdx}`} className="flex items-center gap-2">
                        <input
                          dir="ltr"
                          type="text"
                          value={bullet}
                          onChange={(e) => {
                            const next = [...exp.bullets];
                            next[bIdx] = e.target.value;
                            updateExperience(idx, { bullets: next });
                          }}
                          placeholder="Conçu et optimisé..."
                          className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateExperience(idx, {
                              bullets: exp.bullets.filter((_, i) => i !== bIdx),
                            })
                          }
                          className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 text-xs cursor-pointer"
                          aria-label={ui.remove}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Education */}
          <div className={cardClass}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-white">{ui.educationSection}</h2>
              <button
                type="button"
                onClick={() => addEducation()}
                className="px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-bold cursor-pointer"
              >
                {ui.addEducation}
              </button>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-slate-400">{ui.presetsLabel}</p>
              <div className="flex flex-wrap gap-1.5">
                {MOROCCAN_DIPLOMA_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyMoroccanPreset(preset)}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-teal-500/15 border border-slate-800 hover:border-teal-500/40 text-[11px] text-slate-300 hover:text-teal-200 transition-colors cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {cv.educations.map((edu, idx) => (
                <div
                  key={edu.id}
                  className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => moveEducation(idx, -1)}
                        disabled={idx === 0}
                        className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 disabled:opacity-30 cursor-pointer"
                      >
                        ↑ {ui.moveUp}
                      </button>
                      <button
                        type="button"
                        onClick={() => moveEducation(idx, 1)}
                        disabled={idx === cv.educations.length - 1}
                        className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 disabled:opacity-30 cursor-pointer"
                      >
                        ↓ {ui.moveDown}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEducation(idx)}
                        className="px-2 py-1 rounded bg-rose-500/10 text-xs text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                      >
                        {ui.remove}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>{ui.degreeLabel}</label>
                      <input
                        dir="ltr"
                        type="text"
                        value={edu.degree}
                        onChange={(e) => updateEducation(idx, { degree: e.target.value })}
                        placeholder="Technicien Spécialisé (OFPPT / ISTA)"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{ui.institutionLabel}</label>
                      <input
                        dir="ltr"
                        type="text"
                        value={edu.institution}
                        onChange={(e) => updateEducation(idx, { institution: e.target.value })}
                        placeholder="ISTA / Université Hassan II"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>{ui.cityLabel}</label>
                      <input
                        dir="ltr"
                        type="text"
                        value={edu.city}
                        onChange={(e) => updateEducation(idx, { city: e.target.value })}
                        placeholder="Rabat"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{ui.yearLabel}</label>
                      <input
                        dir="ltr"
                        type="text"
                        value={edu.year}
                        onChange={(e) => updateEducation(idx, { year: e.target.value })}
                        placeholder="2024 – 2026"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{ui.detailsLabel}</label>
                    <input
                      dir="ltr"
                      type="text"
                      value={edu.details}
                      onChange={(e) => updateEducation(idx, { details: e.target.value })}
                      placeholder="Mention Bien • Option Développement Digital"
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Skills */}
          <div className={cardClass}>
            <div>
              <h2 className="text-base font-bold text-white">{ui.skillsSection}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{ui.noBarsNote}</p>
            </div>

            {(
              [
                {
                  bucket: "technicalSkills" as const,
                  label: ui.techSkillsLabel,
                  value: techInput,
                  setter: setTechInput,
                },
                {
                  bucket: "softSkills" as const,
                  label: ui.softSkillsLabel,
                  value: softInput,
                  setter: setSoftInput,
                },
                {
                  bucket: "certifications" as const,
                  label: ui.certsLabel,
                  value: certInput,
                  setter: setCertInput,
                },
              ] as const
            ).map((group) => (
              <div key={group.bucket} className="space-y-2">
                <label className={labelClass}>{group.label}</label>
                <div className="flex gap-2">
                  <input
                    dir="ltr"
                    type="text"
                    value={group.value}
                    onChange={(e) => group.setter(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkillTag(group.bucket, group.value, () => group.setter(""));
                      }
                    }}
                    placeholder={ui.addTagPlaceholder}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      addSkillTag(group.bucket, group.value, () => group.setter(""))
                    }
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-xs font-bold text-slate-200 transition-colors shrink-0 cursor-pointer"
                  >
                    {ui.addBtn}
                  </button>
                </div>
                {cv.skills[group.bucket].length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {cv.skills[group.bucket].map((tag, tIdx) => (
                      <span
                        key={`${group.bucket}-${tIdx}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeSkillTag(group.bucket, tIdx)}
                          className="text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 6. Languages */}
          <div className={cardClass}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-white">{ui.languagesSection}</h2>
              <button
                type="button"
                onClick={() => addLanguage()}
                className="px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-bold cursor-pointer"
              >
                {ui.addLanguage}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400">{ui.quickAddLang}</span>
              {MOROCCAN_LANGUAGE_PRESETS.map((preset) => (
                <button
                  key={preset.language}
                  type="button"
                  onClick={() => quickAddLanguage(preset)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-teal-500/15 border border-slate-800 text-[11px] text-slate-300 cursor-pointer"
                >
                  + {preset.language}
                </button>
              ))}
            </div>

            <div className="space-y-2.5">
              {cv.languages.map((lang, idx) => (
                <div key={lang.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <input
                    dir="ltr"
                    type="text"
                    value={lang.language}
                    onChange={(e) =>
                      setCv((prev) => ({
                        ...prev,
                        languages: prev.languages.map((l, i) =>
                          i === idx ? { ...l, language: e.target.value } : l
                        ),
                      }))
                    }
                    placeholder="Français"
                    className={`${inputClass} sm:col-span-5`}
                  />
                  <select
                    dir="ltr"
                    value={lang.level}
                    onChange={(e) =>
                      setCv((prev) => ({
                        ...prev,
                        languages: prev.languages.map((l, i) =>
                          i === idx ? { ...l, level: e.target.value } : l
                        ),
                      }))
                    }
                    className={`${inputClass} sm:col-span-6`}
                  >
                    {!FRENCH_LANGUAGE_LEVEL_OPTIONS.includes(
                      lang.level as (typeof FRENCH_LANGUAGE_LEVEL_OPTIONS)[number]
                    ) &&
                      lang.level && <option value={lang.level}>{lang.level}</option>}
                    {FRENCH_LANGUAGE_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      setCv((prev) => ({
                        ...prev,
                        languages: prev.languages.filter((_, i) => i !== idx),
                      }))
                    }
                    className="sm:col-span-1 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 text-xs cursor-pointer"
                    aria-label={ui.remove}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Interests */}
          <div className={cardClass}>
            <h2 className="text-base font-bold text-white">{ui.interestsSection}</h2>
            <div className="flex gap-2">
              <input
                dir="ltr"
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addInterestTag();
                  }
                }}
                placeholder={ui.interestsPlaceholder}
                className={inputClass}
              />
              <button
                type="button"
                onClick={addInterestTag}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-xs font-bold text-slate-200 transition-colors shrink-0 cursor-pointer"
              >
                {ui.addBtn}
              </button>
            </div>
            {cv.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {cv.interests.map((tag, idx) => (
                  <span
                    key={`int-${idx}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCv((prev) => ({
                          ...prev,
                          interests: prev.interests.filter((_, i) => i !== idx),
                        }))
                      }
                      className="text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: LIVE A4 PREVIEW */}
        <div
          className={`lg:col-span-6 lg:sticky lg:top-20 space-y-3 ${
            mobileView === "editor" ? "hidden lg:block" : ""
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Aperçu Live A4 — Français
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {buildFrenchCvFilename(cv.header.firstName, cv.header.lastName)}
            </span>
          </div>
          <FrenchCvPreview data={cv} />
        </div>
      </div>
    </div>
  );
}
