import { prisma } from "@/lib/prisma";

export interface LogAiUsageParams {
  userId: string;
  operation: string; // e.g. "COVER_LETTER_GEN", "ATS_ANALYSIS", "BULLET_OPTIMIZE", "CV_INTERVIEW"
  model?: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  latencyMs?: number | null;
  success?: boolean;
  errorMessage?: string | null;
}

/**
 * Asynchronously logs AI generation telemetry without blocking or crashing the user request.
 */
export async function logAiUsage(params: LogAiUsageParams): Promise<void> {
  try {
    const defaultModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    await prisma.aiUsage.create({
      data: {
        userId: params.userId,
        operation: params.operation,
        model: params.model || defaultModel,
        inputTokens: params.inputTokens ?? null,
        outputTokens: params.outputTokens ?? null,
        latencyMs:
          params.latencyMs !== undefined && params.latencyMs !== null
            ? Math.round(params.latencyMs)
            : null,
        success: params.success !== false,
        errorMessage: params.errorMessage ? String(params.errorMessage).slice(0, 1000) : null,
      },
    });
  } catch (error) {
    // Non-blocking telemetry warning
    console.warn(
      "[AI Telemetry Warning] Failed to persist AiUsage record:",
      error instanceof Error ? error.message : error
    );
  }
}
