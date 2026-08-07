import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session";

async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  return await verifySessionToken(session);
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const subscribers = await prisma.subscriber.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      subscribers,
      total: subscribers.length,
    });
  } catch (error: unknown) {
    console.error("[Admin Subscribers GET Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const url = new URL(req.url);
    let id = url.searchParams.get("id");

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Subscriber ID is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.subscriber.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Subscriber not found." },
        { status: 404 }
      );
    }

    await prisma.subscriber.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Subscriber deleted successfully.",
      id,
    });
  } catch (error: unknown) {
    console.error("[Admin Subscribers DELETE Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

