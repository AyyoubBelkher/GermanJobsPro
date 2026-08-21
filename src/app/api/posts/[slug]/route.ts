import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  verifySessionToken,
  timingSafeCompare,
  decodeSlugParam,
  isValidHttpUrl,
} from "@/lib/session";

/**
 * Helper function to verify admin session cookie or Authorization header.
 * Enforces least privilege (only admin_session cookie or MY_SECRET_AUTOMATION_KEY bearer token).
 * Delays 1000ms on authentication failure to prevent brute-force attacks.
 */
async function verifyAdminAuth(request: NextRequest): Promise<boolean> {
  // 1. Check HTTP-only cookie
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (await verifySessionToken(session)) {
    return true;
  }

  // 2. Fallback check Authorization header against MY_SECRET_AUTOMATION_KEY only
  const authHeader = request.headers.get("Authorization");
  const secretKey = process.env.MY_SECRET_AUTOMATION_KEY;

  if (
    secretKey &&
    (timingSafeCompare(authHeader, secretKey) ||
      timingSafeCompare(authHeader, `Bearer ${secretKey}`))
  ) {
    return true;
  }

  // Add 1000ms delay on failed auth attempt to mitigate brute-force
  await new Promise((r) => setTimeout(r, 1000));
  return false;
}

/**
 * GET /api/posts/[slug]
 * Retrieves post details by slug.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: rawSlug } = await params;
    const slug = decodeSlugParam(rawSlug);

    let post = await prisma.post.findUnique({
      where: { slug },
    });

    if (!post && rawSlug !== slug) {
      post = await prisma.post.findUnique({
        where: { slug: rawSlug },
      });
    }

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          error: "Post not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, post }, { status: 200 });
  } catch (error: unknown) {
    console.error("[Get Post Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[slug]
 * Deletes a post from SQLite database using Prisma after verifying admin auth.
 * Decodes URI parameters safely for Arabic slugs and special characters.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const isAuthorized = await verifyAdminAuth(request);

  if (!isAuthorized) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Admin privileges required",
      },
      { status: 401 }
    );
  }

  try {
    const { slug: rawSlug } = await params;
    const slug = decodeSlugParam(rawSlug);

    let existingPost = await prisma.post.findUnique({
      where: { slug },
    });

    if (!existingPost && rawSlug !== slug) {
      existingPost = await prisma.post.findUnique({
        where: { slug: rawSlug },
      });
    }

    if (!existingPost) {
      return NextResponse.json(
        {
          success: false,
          error: "Post not found",
        },
        { status: 404 }
      );
    }

    await prisma.post.delete({
      where: { id: existingPost.id },
    });

    console.log(`[Admin Post Delete] Post '${existingPost.slug}' deleted successfully.`);

    return NextResponse.json(
      {
        success: true,
        message: "Post deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Delete Post Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/posts/[slug]
 * Updates post details in SQLite database after verifying admin auth.
 * Decodes URI parameters safely for Arabic slugs and special characters.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const isAuthorized = await verifyAdminAuth(request);

  if (!isAuthorized) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Admin privileges required",
      },
      { status: 401 }
    );
  }

  try {
    const { slug: rawSlug } = await params;
    const slug = decodeSlugParam(rawSlug);

    let existingPost = await prisma.post.findUnique({
      where: { slug },
    });

    if (!existingPost && rawSlug !== slug) {
      existingPost = await prisma.post.findUnique({
        where: { slug: rawSlug },
      });
    }

    if (!existingPost) {
      return NextResponse.json(
        {
          success: false,
          error: "Post not found",
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, markdown_content, category, image_url, source_link } = body || {};

    // Validate URL protocols to prevent XSS (javascript: / data: protocols)
    if (
      (image_url !== undefined && !isValidHttpUrl(image_url)) ||
      (source_link !== undefined && !isValidHttpUrl(source_link))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request: 'image_url' and 'source_link' must use http:// or https:// protocols.",
        },
        { status: 400 }
      );
    }

    const updatedTitle = typeof title === "string" ? title.trim() : existingPost.title;
    const updatedContent =
      typeof markdown_content === "string" ? markdown_content.trim() : existingPost.markdown_content;

    if (!updatedTitle || !updatedContent) {
      return NextResponse.json(
        {
          success: false,
          error: "Title and markdown_content are required fields",
        },
        { status: 400 }
      );
    }

    const updatedPost = await prisma.post.update({
      where: { id: existingPost.id },
      data: {
        title: updatedTitle,
        markdown_content: updatedContent,
        category: typeof category === "string" && category.trim() !== "" ? category.trim() : existingPost.category,
        image_url: image_url !== undefined ? image_url : existingPost.image_url,
        source_link: source_link !== undefined ? source_link : existingPost.source_link,
      },
    });

    console.log(`[Admin Post Update] Post '${existingPost.slug}' updated successfully.`);

    return NextResponse.json(
      {
        success: true,
        message: "Post updated successfully",
        post: updatedPost,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Update Post Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  return PUT(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  return PUT(request, context);
}

