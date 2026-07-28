import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Interface representing the expected structure of the incoming automation webhook payload.
 */
interface CreatePostPayload {
  title?: string;
  slug?: string;
  markdown_content?: string;
  content?: string;
  markdown?: string;
  category?: string;
  image_url?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  source_link?: string | null;
  sourceLink?: string | null;
  link?: string | null;
  url?: string | null;
  generated_by_ai?: boolean;
  generatedByAi?: boolean;
}

/**
 * POST handler to create new blog posts via automation webhooks.
 * Implements bearer token validation, deduplication checks, and database insertion.
 */
export async function POST(request: NextRequest) {
  // 1. Verify Authentication Header against process.env.MY_SECRET_AUTOMATION_KEY
  const authHeader = request.headers.get("Authorization");
  const secretKey = process.env.MY_SECRET_AUTOMATION_KEY || "MY_SECRET_AUTOMATION_KEY";

  const isAuthorized =
    authHeader === secretKey ||
    authHeader === `Bearer ${secretKey}`;

  if (!authHeader || !isAuthorized) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Missing or invalid API key",
      },
      { status: 401 }
    );
  }

  try {
    // 2. Parse JSON request body safely
    let body: CreatePostPayload;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request: Invalid or missing JSON body.",
        },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request: Request body must be a JSON object.",
        },
        { status: 400 }
      );
    }

    // Extract title & markdown content with alias fallbacks
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const markdownContent =
      typeof body.markdown_content === "string" && body.markdown_content.trim() !== ""
        ? body.markdown_content.trim()
        : typeof body.content === "string" && body.content.trim() !== ""
        ? body.content.trim()
        : typeof body.markdown === "string" && body.markdown.trim() !== ""
        ? body.markdown.trim()
        : "";

    // Validate presence of required fields
    if (!title || !markdownContent) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request: 'title' and 'markdown_content' (or 'content') are required fields.",
        },
        { status: 400 }
      );
    }

    // Safely extract optional category
    const category =
      typeof body.category === "string" && body.category.trim() !== ""
        ? body.category.trim()
        : "General";

    // Safely extract optional image_url (supports image_url, imageUrl, image)
    const rawImage = body.image_url ?? body.imageUrl ?? body.image;
    const imageUrl =
      typeof rawImage === "string" && rawImage.trim() !== ""
        ? rawImage.trim()
        : null;

    // Safely extract optional source_link (supports source_link, sourceLink, link, url)
    const rawLink = body.source_link ?? body.sourceLink ?? body.link ?? body.url;
    const sourceLink =
      typeof rawLink === "string" && rawLink.trim() !== ""
        ? rawLink.trim()
        : null;

    const generatedByAi = Boolean(body.generated_by_ai ?? body.generatedByAi);

    // Compute target slug from payload or title
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    const payloadSlug = typeof body.slug === "string" ? body.slug.trim() : "";
    const targetSlug = payloadSlug || (baseSlug.length > 0 ? baseSlug : "post");

    // 3. Deduplication Check BEFORE creation
    // Check if a post with the same source_link or slug already exists in SQLite via Prisma
    const orConditions: Array<{ source_link?: string; slug?: string }> = [];

    if (sourceLink) {
      orConditions.push({ source_link: sourceLink });
    }
    if (targetSlug) {
      orConditions.push({ slug: targetSlug });
    }

    if (orConditions.length > 0) {
      const existingPost = await prisma.post.findFirst({
        where: {
          OR: orConditions,
        },
      });

      if (existingPost) {
        console.log("[Webhook Automation] Post already exists. Skipping creation for source_link/slug:", {
          sourceLink,
          targetSlug,
          existingId: existingPost.id,
        });
        return NextResponse.json(
          {
            success: true,
            message: "Post already exists",
            skipped: true,
          },
          { status: 200 }
        );
      }
    }

    // Ensure final slug uniqueness
    let finalSlug = targetSlug;
    const slugCheck = await prisma.post.findUnique({ where: { slug: finalSlug } });
    if (slugCheck) {
      finalSlug = `${targetSlug}-${Date.now()}`;
    }

    // 4. Persist to SQLite DB using Prisma
    const newPost = await prisma.post.create({
      data: {
        title,
        slug: finalSlug,
        markdown_content: markdownContent,
        category,
        image_url: imageUrl,
        source_link: sourceLink,
        generated_by_ai: generatedByAi,
      },
    });

    // Observability logging
    console.log("[Webhook Automation] Successfully persisted post record:", newPost);

    // 5. Return standard HTTP 201 Created response
    return NextResponse.json(
      {
        success: true,
        message: "Post created successfully",
        postId: newPost.id,
        slug: newPost.slug,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Webhook Automation Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal Server Error during post creation",
      },
      { status: 500 }
    );
  }
}
