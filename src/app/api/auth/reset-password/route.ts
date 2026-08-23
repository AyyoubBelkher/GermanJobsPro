import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, hashSha256 } from "@/lib/user-session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token, password } = body || {};

    if (typeof token !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "رمز الاستعادة وكلمة المرور الجديدة مطلوبة / Token and new password are required" },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();
    const trimmedPassword = password.trim();

    if (!cleanToken) {
      return NextResponse.json(
        { success: false, error: "رابط إعادة تعيين كلمة المرور غير صالح / Invalid reset link" },
        { status: 400 }
      );
    }

    if (trimmedPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل / Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const tokenHash = hashSha256(cleanToken);

    // Find the valid reset token record
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      if (resetRecord) {
        await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } }).catch(() => {});
      }
      return NextResponse.json(
        {
          success: false,
          error: "رابط إعادة تعيين كلمة المرور منتهي الصلاحية أو تم استخدامه بالفعل / Password reset link is expired or invalid. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // Hash the new password using scrypt
    const newPasswordHash = await hashPassword(trimmedPassword);

    // Update user password, mark email verified, revoke all sessions, and delete reset tokens
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash: newPasswordHash,
          emailVerified: true,
        },
      }),
      prisma.userSession.deleteMany({
        where: { userId: resetRecord.userId },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetRecord.userId },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول / Password has been reset successfully. You can now log in.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Auth Reset Password Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
