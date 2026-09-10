import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session";
import { verifyUserSession } from "@/lib/user-session";

async function isAuthorizedAdmin(request: NextRequest): Promise<boolean> {
  const cookieHeader = request.headers.get("cookie") || "";
  const adminMatch = cookieHeader.match(/(?:^|;\s*)admin_session=([^;]*)/);
  const sessionToken = adminMatch ? decodeURIComponent(adminMatch[1]) : undefined;

  if (sessionToken && (await verifySessionToken(sessionToken))) {
    return true;
  }

  const userMatch = cookieHeader.match(/(?:^|;\s*)user_session=([^;]*)/);
  const userToken = userMatch ? decodeURIComponent(userMatch[1]) : undefined;
  if (userToken) {
    const authResult = await verifyUserSession(userToken);
    if (
      authResult?.user?.email &&
      process.env.ADMIN_EMAIL &&
      authResult.user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()
    ) {
      return true;
    }
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;
    if (token && (await verifySessionToken(token))) {
      return true;
    }
  } catch {
    // Ignore outside request context
  }

  return false;
}

/**
 * GET /api/admin/support
 * Retrieves all support tickets ordered by creation date descending,
 * along with status summary counts.
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await isAuthorizedAdmin(request))) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [tickets, totalCount, pendingCount, resolvedCount] = await Promise.all([
      prisma.supportTicket.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: "PENDING" } }),
      prisma.supportTicket.count({ where: { status: "RESOLVED" } }),
    ]);

    return NextResponse.json(
      {
        success: true,
        tickets,
        stats: {
          total: totalCount,
          pending: pendingCount,
          resolved: resolvedCount,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[GET /api/admin/support Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch support tickets." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/support
 * Updates a ticket status directly (e.g., PENDING <-> RESOLVED) or deletes a ticket.
 */
export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAuthorizedAdmin(request))) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const { ticketId, status } = body || {};

    if (!ticketId || typeof ticketId !== "string") {
      return NextResponse.json(
        { success: false, error: "Ticket ID is required." },
        { status: 400 }
      );
    }

    if (!status || !["PENDING", "RESOLVED"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value (must be PENDING or RESOLVED)." },
        { status: 400 }
      );
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
    });

    return NextResponse.json(
      {
        success: true,
        ticket: updated,
        message: `تم تحديث حالة التذكرة إلى ${status}.`,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[PATCH /api/admin/support Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Failed to update ticket status." },
      { status: 500 }
    );
  }
}
