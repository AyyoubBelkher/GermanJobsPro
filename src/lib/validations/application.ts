import { z } from "zod";

export const applicationStatusEnum = z.enum([
  "SAVED",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
]);

export const createApplicationSchema = z.object({
  jobId: z.string().nullable().optional(),
  cvId: z.string().nullable().optional(),
  coverLetterId: z.string().nullable().optional(),
  companyName: z.string().min(1, "Company name is required").max(200),
  jobTitle: z.string().min(1, "Job title is required").max(200),
  location: z.string().max(200).nullable().optional(),
  status: applicationStatusEnum.default("SAVED"),
  appliedAt: z
    .union([z.string().datetime(), z.string().date(), z.date()])
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
  notes: z.string().max(5000).nullable().optional(),
  followUpAt: z
    .union([z.string().datetime(), z.string().date(), z.date()])
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
});

export const updateApplicationSchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  jobTitle: z.string().min(1).max(200).optional(),
  location: z.string().max(200).nullable().optional(),
  status: applicationStatusEnum.optional(),
  appliedAt: z
    .union([z.string().datetime(), z.string().date(), z.date()])
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : val === null ? null : undefined)),
  notes: z.string().max(5000).nullable().optional(),
  followUpAt: z
    .union([z.string().datetime(), z.string().date(), z.date()])
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : val === null ? null : undefined)),
  cvId: z.string().nullable().optional(),
  coverLetterId: z.string().nullable().optional(),
  jobId: z.string().nullable().optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
