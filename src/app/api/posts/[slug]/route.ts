import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { decodeSlugParam, isValidHttpUrl, isValidImageUrl } from "@/lib/session";
import { requireAdmin, verifyAutomationSecret } from "@/lib/admin-auth";
import { ensurePermanentImageUrl } from "@/lib/imageUtils";

/**
 * Helper function to verify admin session cookie or standard automation headers.
 * Delays 1000ms on authentication failure to prevent brute-force attacks.
 */
async function verifyAdminAuth(request: NextRequest): Promise<boolean> {
  const admin = await requireAdmin(request);
  if (admin) {
    return true;
  }

  if (verifyAutomationSecret(request)) {
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
      post = await prisma.post.findUnique({
        where: { id: rawSlug },
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
 * Deletes a post from database using Prisma after verifying admin auth.
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
      existingPost = await prisma.post.findUnique({
        where: { id: rawSlug },
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

    // Invalidate caches immediately so deletion reflects everywhere
    try {
      const locales = ["ar", "en", "de", "fr"];
      revalidatePath("/[locale]/blog", "page");
      revalidatePath("/[locale]/blog/[slug]", "page");
      revalidatePath("/[locale]/blog", "layout");
      for (const loc of locales) {
        revalidatePath(`/${loc}/blog`);
        revalidatePath(`/${loc}/blog/${encodeURIComponent(existingPost.slug)}`);
      }
    } catch (revalErr) {
      console.warn("[Admin Post Delete] revalidatePath warning:", revalErr);
    }

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
 * Updates post details in database after verifying admin auth.
 * Supports image and image_url, converts external URLs via ensurePermanentImageUrl,
 * and calls revalidatePath for instant cache purging.
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
      existingPost = await prisma.post.findUnique({
        where: { id: rawSlug },
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
    const { title, markdown_content, category, image_url, image, source_link } = body || {};
    const rawImage = image_url !== undefined ? image_url : image;

    // Validate URL protocols to prevent XSS
    if (rawImage !== undefined && !isValidImageUrl(rawImage)) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request: 'image_url' must use http://, https://, a relative path starting with '/', or a data:image/ URL.",
        },
        { status: 400 }
      );
    }

    if (source_link !== undefined && !isValidHttpUrl(source_link)) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request: 'source_link' must use http:// or https:// protocols.",
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

    // Ensure image is permanent if updated, or null if cleared
    let finalImageUrl = existingPost.image_url;
    if (rawImage !== undefined) {
      if (rawImage === null || (typeof rawImage === "string" && rawImage.trim() === "")) {
        finalImageUrl = null;
      } else {
        finalImageUrl = await ensurePermanentImageUrl(rawImage);
      }
    }

    const updatedPost = await prisma.post.update({
      where: { id: existingPost.id },
      data: {
        title: updatedTitle,
        markdown_content: updatedContent,
        category: typeof category === "string" && category.trim() !== "" ? category.trim() : existingPost.category,
        image_url: finalImageUrl,
        source_link: source_link !== undefined ? source_link : existingPost.source_link,
      },
    });

    console.log(`[Admin Post Update] Post '${existingPost.slug}' updated successfully.`);

    // Invalidate caches immediately across locales so updates appear without stale cache
    try {
      const locales = ["ar", "en", "de", "fr"];
      revalidatePath("/[locale]/blog", "page");
      revalidatePath("/[locale]/blog/[slug]", "page");
      revalidatePath("/[locale]/blog", "layout");

      for (const loc of locales) {
        revalidatePath(`/${loc}/blog`);
        revalidatePath(`/${loc}/blog/${encodeURIComponent(updatedPost.slug)}`);
        if (existingPost.slug !== updatedPost.slug) {
          revalidatePath(`/${loc}/blog/${encodeURIComponent(existingPost.slug)}`);
        }
      }
    } catch (revalErr) {
      console.warn("[Admin Post Update] revalidatePath warning:", revalErr);
    }

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

