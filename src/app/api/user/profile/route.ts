import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-session";
import { prisma } from "@/lib/prisma";

const MAX_AVATAR_BASE64_LENGTH = 3 * 1024 * 1024; // ~2MB binary represented in Base64

async function handleProfileUpdate(request: NextRequest) {
  try {
    const authResult = await getUserSession();
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { name, avatarUrl } = body || {};

    const updateData: { name?: string | null; avatarUrl?: string | null } = {};

    if (name !== undefined) {
      if (typeof name !== "string") {
        return NextResponse.json(
          { success: false, error: "Invalid name format" },
          { status: 400 }
        );
      }
      const trimmedName = name.trim();
      if (trimmedName.length > 100) {
        return NextResponse.json(
          { success: false, error: "Name must not exceed 100 characters" },
          { status: 400 }
        );
      }
      updateData.name = trimmedName || null;
    }

    if (avatarUrl !== undefined) {
      if (avatarUrl === null || avatarUrl === "") {
        updateData.avatarUrl = null;
      } else if (typeof avatarUrl === "string") {
        const trimmedUrl = avatarUrl.trim();
        if (trimmedUrl.startsWith("data:image/")) {
          if (trimmedUrl.length > MAX_AVATAR_BASE64_LENGTH) {
            return NextResponse.json(
              { success: false, error: "Avatar image size exceeds 2MB limit" },
              { status: 400 }
            );
          }
          updateData.avatarUrl = trimmedUrl;
        } else if (trimmedUrl.startsWith("https://") || trimmedUrl.startsWith("http://")) {
          if (trimmedUrl.length > 2000) {
            return NextResponse.json(
              { success: false, error: "Avatar URL is too long" },
              { status: 400 }
            );
          }
          updateData.avatarUrl = trimmedUrl;
        } else {
          return NextResponse.json(
            { success: false, error: "Invalid avatar format. Expected Base64 data URL or HTTP/HTTPS URL" },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, error: "Invalid avatarUrl format" },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: authResult.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        plan: true,
        planExpiresAt: true,
        aiCredits: true,
        customerId: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("[User Profile API Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  return handleProfileUpdate(request);
}

export async function POST(request: NextRequest) {
  return handleProfileUpdate(request);
}
