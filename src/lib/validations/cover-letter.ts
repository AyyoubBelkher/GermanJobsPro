import { z } from "zod";

export const coverLetterSchema = z.object({
  title: z.string().min(1, "Title is required").max(150).default("Anschreiben"),
  jobTitle: z.string().min(1, "Job title is required").max(150),
  companyName: z.string().min(1, "Company name is required").max(150),
  recipientName: z.string().max(150).nullable().optional(),
  jobDescriptionRaw: z.string().max(20000).nullable().optional(),
  language: z.string().min(2).max(10).default("de"),
  tone: z.string().min(1).max(50).default("professional"),
  generatedContent: z.string().min(1, "Generated content is required"),
  cvId: z.string().nullable().optional(),
});

export const coverLetterUpdateSchema = coverLetterSchema.partial().extend({
  jobTitle: z.string().min(1, "Job title is required").max(150).optional(),
  companyName: z.string().min(1, "Company name is required").max(150).optional(),
  generatedContent: z.string().min(1, "Generated content is required").optional(),
});

export type CoverLetterInput = z.infer<typeof coverLetterSchema>;
export type CoverLetterUpdateInput = z.infer<typeof coverLetterUpdateSchema>;
