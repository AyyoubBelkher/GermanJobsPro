import { NextRequest } from "next/server";
import {
  verifySessionToken,
  timingSafeCompare,
  hashToken,
  markSessionTokenRevokedInMemory,
  isSessionTokenRevokedInMemory,
} from "@/lib/session";

/**
 * Authoritative admin authentication guard.
 * Validates the admin_session cookie against:
 * 1. Cryptographic HMAC signature integrity
 * 2. Token expiration (maxAge 7 days)
 * 3. Stateful server-side revocation store (in-memory + database persistence)
 *
 * Eliminates dual-check bypasses (regular user_session with ADMIN_EMAIL).
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ adminId: string } | null> {
  try {
    let sessionToken = request.cookies.get("admin_session")?.value;

    // Fallback: parse raw Cookie header directly
    if (!sessionToken) {
      const cookieHeader = request.headers.get("cookie") || "";
      const match = cookieHeader.match(/(?:^|;\s*)admin_session=([^;]*)/);
      if (match) {
        sessionToken = decodeURIComponent(match[1]);
      }
    }

    // Fallback: next/headers cookies() context if available
    if (!sessionToken) {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        sessionToken = cookieStore.get("admin_session")?.value;
      } catch {
        // Outside server component / next/headers context
      }
    }

    if (!sessionToken || typeof sessionToken !== "string" || sessionToken.trim() === "") {
      return null;
    }

    // Check stateful revocation first
    if (await isSessionRevoked(sessionToken)) {
      return null;
    }

    // Verify HMAC signature and expiration
    const isValid = await verifySessionToken(sessionToken);
    if (!isValid) {
      return null;
    }

    const adminId = process.env.ADMIN_EMAIL || "admin";
    return { adminId };
  } catch (error: unknown) {
    console.error("[requireAdmin Error]:", error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Revokes an admin session statefully.
 * Adds the token hash to the in-memory revocation set and persists to the database
 * using the ProcessedWebhookEvent table without requiring database schema changes.
 */
export async function revokeAdminSession(token?: string | null): Promise<boolean> {
  if (!token || typeof token !== "string" || token.trim() === "") {
    return false;
  }

  try {
    const tokenHash = await hashToken(token);
    markSessionTokenRevokedInMemory(tokenHash);

    // Persist to Postgres database via ProcessedWebhookEvent (logic-level, no schema change)
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.processedWebhookEvent.upsert({
        where: { eventId: `revoked_admin_session_${tokenHash}` },
        update: {},
        create: {
          eventId: `revoked_admin_session_${tokenHash}`,
          eventName: "ADMIN_SESSION_REVOKED",
        },
      });
    } catch {
      // Graceful fallback if database is temporarily unreachable or in mock environment
    }

    return true;
  } catch (error: unknown) {
    console.error("[revokeAdminSession Error]:", error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Checks whether an admin session token has been revoked.
 * Checks the in-memory cache first, then queries the database for persisted revocations.
 */
export async function isSessionRevoked(token?: string | null): Promise<boolean> {
  if (!token || typeof token !== "string" || token.trim() === "") {
    return true;
  }

  try {
    const tokenHash = await hashToken(token);

    if (isSessionTokenRevokedInMemory(tokenHash)) {
      return true;
    }

    // Check database persistence if running in Node runtime
    try {
      const { prisma } = await import("@/lib/prisma");
      const record = await prisma.processedWebhookEvent.findUnique({
        where: { eventId: `revoked_admin_session_${tokenHash}` },
      });

      if (record) {
        markSessionTokenRevokedInMemory(tokenHash);
        return true;
      }
    } catch {
      // Ignore database lookup errors in Edge / client contexts
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Verifies standard HTTP authorization headers for automation ingestion endpoints.
 * Checks exclusively:
 * 1. Authorization: Bearer <secret>
 * 2. x-automation-key: <secret>
 *
 * Query parameters are completely ignored to eliminate credential leaks in server access logs.
 */
export function verifyAutomationSecret(request: NextRequest): boolean {
  const authHeader =
    request.headers.get("authorization") || request.headers.get("Authorization");
  const automationKey = request.headers.get("x-automation-key");

  const validSecrets = [
    process.env.AUTOMATION_SECRET,
    process.env.ADMIN_SECRET,
    process.env.AUTOMATION_SECRET_KEY,
    process.env.MY_SECRET_AUTOMATION_KEY,
    process.env.ADMIN_API_KEY,
    process.env.CRON_SECRET,
  ].filter((k): k is string => typeof k === "string" && k.trim() !== "");

  if (validSecrets.length === 0) {
    return false;
  }

  for (const secret of validSecrets) {
    // Check Authorization: Bearer <secret> or raw token header
    if (authHeader) {
      if (
        timingSafeCompare(authHeader, `Bearer ${secret}`) ||
        timingSafeCompare(authHeader, secret)
      ) {
        return true;
      }
    }

    // Check x-automation-key: <secret>
    if (automationKey) {
      if (timingSafeCompare(automationKey, secret)) {
        return true;
      }
    }
  }

  return false;
}
