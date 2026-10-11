import { getUserSession } from "@/lib/user-session";

/**
 * Authentication verification helper for API routes.
 * Resolves current user session from request or cookies.
 */
export async function verifyAuth(req?: Request) {
  try {
    const sessionResult = await getUserSession(req as any);
    if (!sessionResult || !sessionResult.user) {
      return { success: false, user: null };
    }
    return { success: true, user: sessionResult.user };
  } catch (error) {
    console.error("[verifyAuth Error]:", error);
    return { success: false, user: null };
  }
}
