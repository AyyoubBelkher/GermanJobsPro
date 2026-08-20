import { z } from "zod";

const datePreprocessor = (val: unknown) => {
  if (val === null || val === undefined || val === "") return null;
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d;
  }
  return val;
};

const optionalDateSchema = z.preprocess(
  datePreprocessor,
  z.date().nullable().optional()
);

const requiredDateSchema = z.preprocess(
  datePreprocessor,
  z.date({
    message: "A valid date is required",
  })
);

export const cvPersonalInfoSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(1, "Full name is required").max(150),
  email: z.string().email("Invalid email address").max(150),
  phone: z.string().max(50).nullable().optional(),
  address: z.string().max(255).nullable().optional(),
  photoUrl: z.string().url("Invalid photo URL").max(2000).nullable().optional().or(z.literal("")),
  birthDate: optionalDateSchema,
  birthPlace: z.string().max(100).nullable().optional(),
  nationality: z.string().max(100).nullable().optional(),
  targetJobTitle: z.string().max(150).nullable().optional(),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").max(2000).nullable().optional().or(z.literal("")),
  xingUrl: z.string().url("Invalid Xing URL").max(2000).nullable().optional().or(z.literal("")),
  summary: z.string().max(3000).nullable().optional(),
});

export const cvExperienceSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, "Company is required").max(150),
  position: z.string().min(1, "Position is required").max(150),
  city: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional().default("Germany"),
  startDate: requiredDateSchema,
  endDate: optionalDateSchema,
  isCurrent: z.boolean().optional().default(false),
  description: z.string().max(3000).nullable().optional(),
  order: z.number().int().optional().default(0),
});

export const cvEducationSchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(1, "Institution is required").max(150),
  degree: z.string().min(1, "Degree is required").max(150),
  fieldOfStudy: z.string().max(150).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  startDate: requiredDateSchema,
  endDate: optionalDateSchema,
  isCurrent: z.boolean().optional().default(false),
  grade: z.string().max(50).nullable().optional(),
  description: z.string().max(3000).nullable().optional(),
  order: z.number().int().optional().default(0),
});

export const cvSkillSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Skill name is required").max(100),
  category: z.string().max(100).nullable().optional(),
  level: z.string().max(50).nullable().optional(),
  order: z.number().int().optional().default(0),
});

export const cvLanguageSchema = z.object({
  id: z.string().optional(),
  language: z.string().min(1, "Language is required").max(100),
  proficiency: z.string().min(1, "Proficiency is required").max(50),
  order: z.number().int().optional().default(0),
});

export const cvCertificationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Certification name is required").max(150),
  issuer: z.string().min(1, "Issuer is required").max(150),
  issueDate: optionalDateSchema,
  expiryDate: optionalDateSchema,
  credentialUrl: z.string().url("Invalid credential URL").max(2000).nullable().optional().or(z.literal("")),
  order: z.number().int().optional().default(0),
});

export const cvProjectSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Project title is required").max(150),
  role: z.string().max(100).nullable().optional(),
  url: z.string().url("Invalid project URL").max(2000).nullable().optional().or(z.literal("")),
  description: z.string().max(3000).nullable().optional(),
  order: z.number().int().optional().default(0),
});

export const cvSchema = z.object({
  title: z.string().min(1, "Title is required").max(150).default("Lebenslauf"),
  language: z.string().min(2).max(10).default("de"),
  isDraft: z.boolean().default(true),
  personalInfo: cvPersonalInfoSchema.nullable().optional(),
  experiences: z.array(cvExperienceSchema).optional().default([]),
  educations: z.array(cvEducationSchema).optional().default([]),
  skills: z.array(cvSkillSchema).optional().default([]),
  languages: z.array(cvLanguageSchema).optional().default([]),
  certifications: z.array(cvCertificationSchema).optional().default([]),
  projects: z.array(cvProjectSchema).optional().default([]),
});

export const cvCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(150).optional().default("Lebenslauf"),
  language: z.string().min(2).max(10).optional().default("de"),
  isDraft: z.boolean().optional().default(true),
});

export type CvPersonalInfoInput = z.infer<typeof cvPersonalInfoSchema>;
export type CvExperienceInput = z.infer<typeof cvExperienceSchema>;
export type CvEducationInput = z.infer<typeof cvEducationSchema>;
export type CvSkillInput = z.infer<typeof cvSkillSchema>;
export type CvLanguageInput = z.infer<typeof cvLanguageSchema>;
export type CvCertificationInput = z.infer<typeof cvCertificationSchema>;
export type CvProjectInput = z.infer<typeof cvProjectSchema>;
export type CvInput = z.infer<typeof cvSchema>;
export type CvCreateInput = z.infer<typeof cvCreateSchema>;
