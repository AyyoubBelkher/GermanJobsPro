import { z } from "zod";

export const generateCoverLetterSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required").max(120),
  companyName: z.string().min(1, "Company name is required").max(120),
  recipientName: z.string().max(120).nullable().optional(),
  jobDescriptionRaw: z
    .string()
    .min(20, "Job description must be at least 20 characters")
    .max(4000, "Job description cannot exceed 4000 characters"),
  tone: z.string().max(50).optional().default("professional"),
  language: z.string().max(10).optional().default("de"),
  cvId: z.string().nullable().optional(),
});

export const optimizeBulletSchema = z.object({
  text: z
    .string()
    .min(5, "Text must be at least 5 characters")
    .max(1000, "Text cannot exceed 1000 characters"),
  role: z.string().max(120).nullable().optional(),
  language: z.string().max(10).optional().default("de"),
});

export const analyzeCvAtsSchema = z
  .object({
    cvText: z.string().max(20000).optional(),
    cvId: z.string().nullable().optional(),
    jobDescription: z.string().max(10000).nullable().optional(),
    language: z.string().max(10).optional().default("de"),
  })
  .refine(
    (data) =>
      (typeof data.cvText === "string" && data.cvText.trim().length >= 30) ||
      (typeof data.cvId === "string" && data.cvId.trim().length > 0),
    {
      message: "Either cvText (min 30 characters) or a valid cvId must be provided.",
      path: ["cvText"],
    }
  );

export type GenerateCoverLetterInput = z.infer<typeof generateCoverLetterSchema>;
export type OptimizeBulletInput = z.infer<typeof optimizeBulletSchema>;
export type AnalyzeCvAtsInput = z.infer<typeof analyzeCvAtsSchema>;

