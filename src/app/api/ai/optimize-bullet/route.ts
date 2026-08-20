import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserSession } from "@/lib/user-session";
import { optimizeBulletSchema } from "@/lib/validations/ai";
import { optimizeBulletAI } from "@/lib/gemini";

/**
 * POST /api/ai/optimize-bullet
 * Optimizes a CV bullet point into an ATS-friendly, impact-oriented German statement.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_session")?.value;
    const authResult = await verifyUserSession(token);

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const parseResult = optimizeBulletSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { text, role, language } = parseResult.data;

    const optimizedText = await optimizeBulletAI({
      text,
      role,
      language,
    });

    return NextResponse.json(
      {
        success: true,
        optimizedText,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Optimize Bullet Error]:", error instanceof Error ? error.message : error);

    const errorMessage =
      error instanceof Error && error.message.includes("GEMINI_API_KEY")
        ? "AI service is temporarily unavailable. Please check server configuration."
        : "Failed to optimize bullet point. Please try again.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
