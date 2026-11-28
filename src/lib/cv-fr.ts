import { z } from "zod";

export const FRENCH_CV_DRAFT_STORAGE_KEY = "germanjobspro_cv_fr_draft_v1";

export const FRENCH_CV_TEMPLATES = ["ats-classic", "maroc-modern"] as const;
export type FrenchCvTemplate = (typeof FRENCH_CV_TEMPLATES)[number];

export const FRENCH_CV_ACCENT_COLORS = ["#1e3a5f", "#0f766e"] as const;
export type FrenchCvAccentColor = (typeof FRENCH_CV_ACCENT_COLORS)[number];

export const MAX_PHOTO_DATA_URL_BYTES = 2 * 1024 * 1024; // 2 MB
export const PHOTO_DATA_URL_REGEX = /^data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)$/i;

export const MOROCCAN_DIPLOMA_PRESETS = [
  "Technicien Spécialisé (OFPPT / ISTA)",
  "Licence Professionnelle",
  "Master",
  "Cycle d'Ingénieur",
  "BTS / DUT",
  "Baccalauréat",
  "Technicien (OFPPT / ITA)",
  "Licence Fondamentale",
] as const;

export const MOROCCAN_LANGUAGE_PRESETS = [
  { language: "Arabe", level: "Langue maternelle" },
  { language: "Français", level: "Courant — C1" },
  { language: "Anglais", level: "Intermédiaire — B2" },
  { language: "Allemand", level: "Notions — A2" },
  { language: "Espagnol", level: "Intermédiaire — B1" },
  { language: "Amazigh", level: "Langue maternelle" },
] as const;

export const FRENCH_LANGUAGE_LEVEL_OPTIONS = [
  "Langue maternelle",
  "Bilingue — C2",
  "Courant — C1",
  "Avancé — B2+",
  "Intermédiaire — B2",
  "Intermédiaire — B1",
  "Notions — A2",
  "Débutant — A1",
] as const;

export const MOROCCAN_CITY_SUGGESTIONS = [
  "Casablanca, Maroc",
  "Rabat, Maroc",
  "Tanger, Maroc",
  "Marrakech, Maroc",
  "Fès, Maroc",
  "Agadir, Maroc",
  "Meknès, Maroc",
  "Oujda, Maroc",
  "Kénitra, Maroc",
] as const;

export function validatePhotoDataUrl(value: string | undefined | null): {
  valid: boolean;
  error?: string;
} {
  if (!value || value.trim() === "") {
    return { valid: true };
  }
  const trimmed = value.trim();
  const match = PHOTO_DATA_URL_REGEX.exec(trimmed);
  if (!match) {
    return {
      valid: false,
      error: "Format d'image invalide (PNG ou JPEG uniquement).",
    };
  }
  const base64Length = match[2].length;
  const padding = match[2].endsWith("==") ? 2 : match[2].endsWith("=") ? 1 : 0;
  const estimatedBytes = Math.floor((base64Length * 3) / 4) - padding;
  if (estimatedBytes > MAX_PHOTO_DATA_URL_BYTES) {
    return {
      valid: false,
      error: "La photo dépasse la taille maximale autorisée (2 Mo).",
    };
  }
  return { valid: true };
}

export const frenchCvHeaderSchema = z.object({
  firstName: z.string().trim().max(80).default(""),
  lastName: z.string().trim().max(80).default(""),
  jobTitle: z.string().trim().max(140).default(""),
  phone: z.string().trim().max(40).default(""),
  email: z.string().trim().max(120).default(""),
  city: z.string().trim().max(100).default(""),
  mobility: z.string().trim().max(100).optional().default(""),
  linkedin: z.string().trim().max(200).optional().default(""),
  drivingLicense: z.string().trim().max(60).optional().default(""),
  showPhoto: z.boolean().optional().default(false),
  photoDataUrl: z
    .string()
    .optional()
    .default("")
    .refine((val) => validatePhotoDataUrl(val).valid, {
      message: "Photo invalide (PNG/JPG uniquement, max 2 Mo).",
    }),
});

export const frenchCvExperienceSchema = z.object({
  id: z.string().trim().min(1).max(64),
  role: z.string().trim().max(140).default(""),
  company: z.string().trim().max(140).default(""),
  city: z.string().trim().max(100).default(""),
  startDate: z.string().trim().max(40).default(""),
  endDate: z.string().trim().max(40).default(""),
  current: z.boolean().default(false),
  bullets: z.array(z.string().trim().max(400)).max(15).default([]),
});

export const frenchCvEducationSchema = z.object({
  id: z.string().trim().min(1).max(64),
  degree: z.string().trim().max(160).default(""),
  institution: z.string().trim().max(160).default(""),
  city: z.string().trim().max(100).default(""),
  year: z.string().trim().max(40).default(""),
  details: z.string().trim().max(400).default(""),
});

export const frenchCvSkillsSchema = z.object({
  technicalSkills: z.array(z.string().trim().max(80)).max(40).default([]),
  softSkills: z.array(z.string().trim().max(80)).max(30).default([]),
  certifications: z.array(z.string().trim().max(140)).max(25).default([]),
});

export const frenchCvLanguageSchema = z.object({
  id: z.string().trim().min(1).max(64),
  language: z.string().trim().max(60).default(""),
  level: z.string().trim().max(60).default(""),
});

export const frenchCvSchema = z.object({
  template: z.enum(FRENCH_CV_TEMPLATES).default("maroc-modern"),
  accentColor: z.enum(FRENCH_CV_ACCENT_COLORS).default("#1e3a5f"),
  educationFirst: z.boolean().default(false),
  header: frenchCvHeaderSchema,
  summary: z.string().trim().max(1500).default(""),
  experiences: z.array(frenchCvExperienceSchema).max(20).default([]),
  educations: z.array(frenchCvEducationSchema).max(15).default([]),
  skills: frenchCvSkillsSchema.default({
    technicalSkills: [],
    softSkills: [],
    certifications: [],
  }),
  languages: z.array(frenchCvLanguageSchema).max(12).default([]),
  interests: z.array(z.string().trim().max(80)).max(20).default([]),
});

export type FrenchCvHeader = z.infer<typeof frenchCvHeaderSchema>;
export type FrenchCvExperience = z.infer<typeof frenchCvExperienceSchema>;
export type FrenchCvEducation = z.infer<typeof frenchCvEducationSchema>;
export type FrenchCvSkills = z.infer<typeof frenchCvSkillsSchema>;
export type FrenchCvLanguage = z.infer<typeof frenchCvLanguageSchema>;
export type FrenchCvData = z.infer<typeof frenchCvSchema>;

export type FrenchCvSectionKey = "education" | "experience";

/**
 * Returns the ordered primary sections ("education" vs "experience")
 * based on the "Profil Jeune Diplômé" toggle.
 */
export function getFrenchCvSectionOrder(educationFirst: boolean): FrenchCvSectionKey[] {
  return educationFirst ? ["education", "experience"] : ["experience", "education"];
}

/**
 * Formats candidate name according to French CV convention: "Prénom NOM".
 */
export function formatFrenchHeaderName(firstName?: string | null, lastName?: string | null): string {
  const first = (firstName || "").trim();
  const last = (lastName || "").trim().toUpperCase();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;
  return "Prénom NOM";
}

/**
 * Strips accents/diacritics and unsafe filesystem/header characters to build
 * an ASCII-safe French CV filename: `CV-<FirstName>-<LastName>.pdf`.
 */
export function buildFrenchCvFilename(firstName?: string | null, lastName?: string | null): string {
  const sanitizePart = (raw?: string | null): string => {
    if (!raw) return "";
    return raw
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/œ/g, "oe")
      .replace(/Œ/g, "OE")
      .replace(/æ/g, "ae")
      .replace(/Æ/g, "AE")
      .replace(/ß/g, "ss")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const parts = [sanitizePart(firstName), sanitizePart(lastName)].filter(Boolean);
  if (parts.length === 0) {
    return "CV-Candidat.pdf";
  }
  return `CV-${parts.join("-")}.pdf`;
}

/**
 * Creates a clean default French CV state pre-seeded with Morocco-relevant
 * language defaults and ready-to-edit sections.
 */
export function createDefaultFrenchCv(seed?: {
  firstName?: string;
  lastName?: string;
  email?: string;
}): FrenchCvData {
  return {
    template: "maroc-modern",
    accentColor: "#1e3a5f",
    educationFirst: false,
    header: {
      firstName: seed?.firstName?.trim() || "",
      lastName: seed?.lastName?.trim() || "",
      jobTitle: "",
      phone: "",
      email: seed?.email?.trim() || "",
      city: "Casablanca, Maroc",
      mobility: "Mobilité nationale",
      linkedin: "",
      drivingLicense: "",
      showPhoto: false,
      photoDataUrl: "",
    },
    summary: "",
    experiences: [
      {
        id: "exp-1",
        role: "",
        company: "",
        city: "",
        startDate: "",
        endDate: "",
        current: false,
        bullets: [""],
      },
    ],
    educations: [
      {
        id: "edu-1",
        degree: "",
        institution: "",
        city: "",
        year: "",
        details: "",
      },
    ],
    skills: {
      technicalSkills: [],
      softSkills: [],
      certifications: [],
    },
    languages: [
      { id: "lang-1", language: "Arabe", level: "Langue maternelle" },
      { id: "lang-2", language: "Français", level: "Courant — C1" },
      { id: "lang-3", language: "Anglais", level: "Intermédiaire — B2" },
    ],
    interests: [],
  };
}

/**
 * Returns a realistic Moroccan candidate sample CV for 1-click preview/onboarding.
 */
export function createSampleFrenchCv(): FrenchCvData {
  return {
    template: "maroc-modern",
    accentColor: "#1e3a5f",
    educationFirst: true,
    header: {
      firstName: "Oussama",
      lastName: "El Koromi",
      jobTitle: "Technicien Spécialisé en Développement Digital",
      phone: "+212 6 12 34 56 78",
      email: "oussama.elkoromi@exemple.ma",
      city: "Casablanca, Maroc",
      mobility: "Mobilité nationale",
      linkedin: "linkedin.com/in/oussama-elkoromi",
      drivingLicense: "Permis B",
      showPhoto: false,
      photoDataUrl: "",
    },
    summary:
      "Jeune diplômé en Développement Digital (ISTA / OFPPT) doté d'une solide maîtrise des technologies Web modernes (React, TypeScript, Laravel, SQL). Rigoureux et orienté solutions, je souhaite mettre mes compétences techniques et mon sens du travail en équipe au service d'une entreprise innovante au Maroc.",
    experiences: [
      {
        id: "exp-sample-1",
        role: "Stagiaire Développeur Full-Stack (PFE)",
        company: "Atlas Digital Solutions",
        city: "Casablanca",
        startDate: "Fév 2026",
        endDate: "Mai 2026",
        current: false,
        bullets: [
          "Conçu et développé une application de gestion des stocks avec React, TypeScript et API REST Laravel.",
          "Optimisé les requêtes SQL et réduit le temps de chargement des tableaux de bord de 35 %.",
          "Collaboré en méthode Agile (Scrum) avec une équipe de 4 développeurs sous Git/GitHub.",
        ],
      },
      {
        id: "exp-sample-2",
        role: "Projet Académique — Portail E-Commerce",
        company: "ISTA Hay Hassani (OFPPT)",
        city: "Casablanca",
        startDate: "Oct 2025",
        endDate: "Jan 2026",
        current: false,
        bullets: [
          "Développé un catalogue produits responsive avec authentification sécurisée et panier dynamique.",
          "Rédigé la documentation technique et réalisé les tests fonctionnels.",
        ],
      },
    ],
    educations: [
      {
        id: "edu-sample-1",
        degree: "Technicien Spécialisé en Développement Digital (OFPPT / ISTA)",
        institution: "ISTA Hay Hassani",
        city: "Casablanca",
        year: "2024 – 2026",
        details: "Mention Très Bien • Option Web Full-Stack",
      },
      {
        id: "edu-sample-2",
        degree: "Baccalauréat Sciences Physiques",
        institution: "Lycée Al Khawarizmi",
        city: "Casablanca",
        year: "2024",
        details: "Mention Bien",
      },
    ],
    skills: {
      technicalSkills: [
        "HTML5 / CSS3 / Tailwind CSS",
        "JavaScript / TypeScript",
        "React / Next.js",
        "PHP / Laravel",
        "MySQL / PostgreSQL",
        "Git & GitHub",
      ],
      softSkills: [
        "Esprit d'analyse",
        "Travail en équipe",
        "Autonomie",
        "Gestion des priorités",
      ],
      certifications: [
        "Certification Python & SQL — Coursera (2025)",
      ],
    },
    languages: [
      { id: "lang-sample-1", language: "Arabe", level: "Langue maternelle" },
      { id: "lang-sample-2", language: "Français", level: "Courant — C1" },
      { id: "lang-sample-3", language: "Anglais", level: "Intermédiaire — B2" },
    ],
    interests: [
      "Veille technologique",
      "Bénévolat associatif (Club IT)",
      "Course à pied",
    ],
  };
}

/**
 * Safely serializes the French CV state for localStorage persistence.
 */
export function serializeFrenchCvDraft(data: FrenchCvData): string {
  return JSON.stringify({
    version: 1,
    savedAt: new Date().toISOString(),
    data,
  });
}

/**
 * Safely parses a stored French CV draft from localStorage, returning null
 * if malformed or invalid without throwing.
 */
export function parseFrenchCvDraft(raw: string | null | undefined): FrenchCvData | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const candidate =
      "data" in parsed && parsed.data && typeof parsed.data === "object"
        ? parsed.data
        : parsed;
    const result = frenchCvSchema.safeParse(candidate);
    if (!result.success) return null;
    return result.data;
  } catch {
    return null;
  }
}

export const optimizeFrenchCvSchema = z.object({
  jobTitle: z.string().trim().min(2, "Le titre du poste est requis.").max(140),
  summary: z.string().trim().max(1500).optional().default(""),
  bullets: z.array(z.string().trim().max(400)).max(20).optional().default([]),
  targetOffer: z.string().trim().max(3000).optional().default(""),
});

export type OptimizeFrenchCvInput = z.infer<typeof optimizeFrenchCvSchema>;
