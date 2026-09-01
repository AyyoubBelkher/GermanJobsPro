import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserSession } from "@/lib/user-session";
import { interviewCvAI, InterviewCvParams, isRateLimitError } from "@/lib/gemini";
import { consumeAiCredit, refundAiCredit } from "@/lib/monetization";
import { checkRateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";

/**
 * POST /api/ai/cv-interview
 * Interactive German CV Career Consultant & AI Copilot.
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, AUTH_RATE_LIMITS.AI_API);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let userId: string | null = null;
  let creditDeducted = false;

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

    userId = authResult.user.id;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid request payload" },
        { status: 400 }
      );
    }

    const { currentCvData, userMessage, currentStep, locale, history } = body;

    // AI Credit Guardrail (Atomic reservation/decrement)
    // Only deduct credit when user sends an actual message or request
    if (userMessage && userMessage.trim().length > 0) {
      const creditResult = await consumeAiCredit(userId);
      if (!creditResult.success) {
        return NextResponse.json(
          {
            success: false,
            error:
              creditResult.error ||
              "نفد رصيد الذكاء الاصطناعي الخاص بك. يرجى الترقية إلى Pro أو إدخال كود ترويجي.",
            isPro: creditResult.isPro,
          },
          { status: 402 }
        );
      }
      creditDeducted = true;
    }

    const params: InterviewCvParams = {
      currentCvData: currentCvData || {},
      userMessage: typeof userMessage === "string" ? userMessage : "",
      currentStep: typeof currentStep === "string" ? currentStep : "initial",
      locale: typeof locale === "string" ? locale : "ar",
      history: Array.isArray(history) ? history : [],
    };

    const aiResult = await interviewCvAI(params);

    return NextResponse.json({
      success: true,
      message: aiResult.message,
      proposedData: aiResult.proposedData,
      nextStep: aiResult.nextStep,
      actions: aiResult.actions,
    });
  } catch (error: unknown) {
    console.error("[CV Interview AI Error]:", error);

    // Refund AI credit (or restore daily fair-use quota for PRO users)
    if (userId && creditDeducted) {
      await refundAiCredit(userId);
    }

    if (isRateLimitError(error)) {
      return NextResponse.json(
        {
          success: false,
          isRateLimit: true,
          error:
            "الخدمة تواجه ضغطاً مؤقتاً في معالجة الذكاء الاصطناعي، يرجى الانتظار بضع ثوانٍ ثم إعادة المحاولة.",
        },
        { status: 429 }
      );
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "حدث خطأ أثناء التواصل مع مستشار الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
