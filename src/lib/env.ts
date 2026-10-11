import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().url().default("postgresql://localhost:5432/neondb"),
  SESSION_SECRET: z.string().min(16).default("fallback_session_secret_min_16_chars"),
  GEMINI_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/**
 * Safely evaluates environment variables on demand.
 * Prevents premature build-time crashes during static analysis/compilation when variables are not yet injected.
 */
export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);
  if (result.success) {
    cachedEnv = result.data;
    return cachedEnv;
  }

  // During static analysis, production build phase, or testing, fallback gracefully rather than crashing
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NODE_ENV === "test" ||
    typeof window !== "undefined"
  ) {
    console.warn(
      "[ENV_WARN]: Non-critical environment variables missing during build-time static analysis:",
      result.error.flatten().fieldErrors
    );
    return {
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://localhost:5432/neondb",
      SESSION_SECRET: process.env.SESSION_SECRET || "fallback_session_secret_min_16_chars",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
      RESEND_API_KEY: process.env.RESEND_API_KEY || "",
    } as Env;
  }

  // Runtime error logging for server execution
  console.error(
    "[CRITICAL_ENV_ERROR]: Missing or invalid environment variables at runtime:",
    result.error.format()
  );
  throw new Error("Invalid server environment configuration. Check server environment logs.");
}

/**
 * Dynamic Proxy export allowing `env.KEY` syntax with deferred, safe runtime evaluation.
 */
export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    const activeEnv = getEnv();
    return activeEnv[prop as keyof Env];
  },
});
