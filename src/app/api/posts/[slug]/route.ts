import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Helper function to verify admin session cookie or Authorization header.
 */
async function verifyAdminAuth(request: NextRequest): Promise<boolean> {
  // Check HTTP-only cookie
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (session === "authenticated" || session === "true") {
    return true;
  }

  // Fallback check Authorization header against ADMIN_PASSWORD or MY_SECRET_AUTOMATION_KEY
  const authHeader = request.headers.get("Authorization");
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const secretKey = process.env.MY_SECRET_AUTOMATION_KEY || "MY_SECRET_AUTOMATION_KEY";

  if (
    authHeader === adminPassword ||
    authHeader === `Bearer ${adminPassword}` ||
    authHeader === secretKey ||
    authHeader === `Bearer ${secretKey}`
  ) {
    return true;
  }

  return false;
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
    const slug = decodeURIComponent(rawSlug);

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
  } catch (error: any) {
    console.error("[Delete Post Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal Server Error during post deletion",
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
    const slug = decodeURIComponent(rawSlug);

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
  } catch (error: any) {
    console.error("[Update Post Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal Server Error during post update",
      },
      { status: 500 }
    );
  }
}
