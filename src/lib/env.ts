import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().default("postgresql://localhost:5432/neondb"),
  SESSION_SECRET: z.string().default("fallback_session_secret_min_16_chars"),
  GEMINI_API_KEY: z.string().default("build_placeholder_gemini_key"),
  RESEND_API_KEY: z.string().default("build_placeholder_resend_key"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);
  if (result.success) {
    cachedEnv = result.data;
    return cachedEnv;
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://localhost:5432/neondb",
    SESSION_SECRET: process.env.SESSION_SECRET || "fallback_session_secret_min_16_chars",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "build_placeholder_gemini_key",
    RESEND_API_KEY: process.env.RESEND_API_KEY || "build_placeholder_resend_key",
  } as Env;
}

export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    const activeEnv = getEnv();
    return activeEnv[prop as keyof Env];
  },
});
