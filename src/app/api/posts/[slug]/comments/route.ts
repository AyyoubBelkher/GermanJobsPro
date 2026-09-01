import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";

/**
 * Helper to safely decode URI components.
 */
function safeDecode(val: string): string {
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

/**
 * Helper to find a post by slug or ID.
 */
async function findPostByIdentifier(rawIdentifier: string) {
  const decoded = safeDecode(rawIdentifier);

  const post = await prisma.post.findFirst({
    where: {
      OR: [
        { slug: decoded },
        { slug: rawIdentifier },
        { id: rawIdentifier },
        { id: decoded },
      ],
    },
    select: { id: true },
  });

  return post;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: rawIdentifier } = await params;
    const post = await findPostByIdentifier(rawIdentifier);

    if (!post) {
      return NextResponse.json(
        { error: "المقال غير موجود" },
        { status: 404 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: { postId: post.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error("[Comments GET error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const rateLimitResponse = checkRateLimit(request, AUTH_RATE_LIMITS.COMMENTS);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { slug: rawIdentifier } = await params;
    const post = await findPostByIdentifier(rawIdentifier);

    if (!post) {
      return NextResponse.json(
        { error: "المقال غير موجود" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { name, email, content } = body || {};

    // Validate name
    if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json(
        { error: "الرجاء إدخال اسم صحيح (بين 2 و 100 حرف)" },
        { status: 400 }
      );
    }

    // Validate email
    const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!trimmedEmail || trimmedEmail.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "الرجاء إدخال بريد إلكتروني صحيح" },
        { status: 400 }
      );
    }

    // Validate content
    if (!content || typeof content !== "string" || content.trim().length < 2 || content.trim().length > 2000) {
      return NextResponse.json(
        { error: "الرجاء كتابة تعليق لا يقل عن حرفين ولا يزيد عن 2000 حرف" },
        { status: 400 }
      );
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        postId: post.id,
        name: name.trim(),
        email: trimmedEmail,
        content: content.trim(),
      },
      select: {
        id: true,
        name: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error) {
    console.error("[Comments POST error]:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة التعليق. يرجى المحاولة لاحقاً." },
      { status: 500 }
    );
  }
}
