import { z } from "zod";

export const coverLetterSchema = z.object({
  title: z.string().min(1, "Title is required").max(255).default("Anschreiben"),
  jobTitle: z.string().min(1, "Job title is required").max(255),
  companyName: z.string().min(1, "Company name is required").max(255),
  recipientName: z.string().max(255).nullable().optional().or(z.literal("")),
  jobDescriptionRaw: z.string().max(20000).nullable().optional().or(z.literal("")),
  language: z.string().min(2).max(10).default("de"),
  tone: z.string().min(1).max(50).default("professional"),
  generatedContent: z.string().min(1, "Generated content is required"),
  cvId: z.string().nullable().optional().or(z.literal("")),
});

export const coverLetterUpdateSchema = coverLetterSchema.partial().extend({
  jobTitle: z.string().min(1, "Job title is required").max(255).optional(),
  companyName: z.string().min(1, "Company name is required").max(255).optional(),
  generatedContent: z.string().min(1, "Generated content is required").optional(),
});

export type CoverLetterInput = z.infer<typeof coverLetterSchema>;
export type CoverLetterUpdateInput = z.infer<typeof coverLetterUpdateSchema>;
