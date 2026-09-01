import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  timingSafeCompare,
  isValidHttpUrl,
  isValidImageUrl,
  verifySessionToken,
} from "@/lib/session";

/**
 * Helper to verify automation secret API keys, webhook headers, or admin session cookie.
 */
async function isAuthorized(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  const customHeader =
    request.headers.get("x-automation-key") ||
    request.headers.get("x-api-key") ||
    request.headers.get("x-secret-key");

  const { searchParams } = new URL(request.url);
  const queryKey =
    searchParams.get("key") ||
    searchParams.get("secret") ||
    searchParams.get("api_key") ||
    searchParams.get("automation_key");

  const validKeys = [
    process.env.AUTOMATION_SECRET_KEY,
    process.env.MY_SECRET_AUTOMATION_KEY,
    process.env.ADMIN_API_KEY,
    process.env.CRON_SECRET,
  ].filter((k): k is string => Boolean(k && k.trim() !== ""));

  if (validKeys.length > 0) {
    for (const key of validKeys) {
      if (
        timingSafeCompare(authHeader, `Bearer ${key}`) ||
        timingSafeCompare(authHeader, key) ||
        timingSafeCompare(customHeader, key) ||
        timingSafeCompare(queryKey, key)
      ) {
        return true;
      }
    }
  }

  // Validate admin session cookie
  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get("admin_session")?.value;
    if (adminCookie && (await verifySessionToken(adminCookie))) {
      return true;
    }
  } catch {
    // Ignore cookie retrieval errors in webhook contexts
  }

  return false;
}

/**
 * Interface representing the expected structure of the incoming automation webhook payload.
 */
interface CreatePostPayload {
  title?: string;
  slug?: string;
  markdown_content?: string;
  markdownContent?: string;
  content?: string;
  markdown?: string;
  text?: string;
  article?: string;
  category?: string;
  category_name?: string;
  topic?: string;
  tag?: string;
  image_url?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  featured_image?: string | null;
  featuredImage?: string | null;
  cover_image?: string | null;
  coverImage?: string | null;
  photo_url?: string | null;
  source_link?: string | null;
  sourceLink?: string | null;
  source_url?: string | null;
  sourceUrl?: string | null;
  link?: string | null;
  url?: string | null;
  generated_by_ai?: boolean;
  generatedByAi?: boolean;
  ai_generated?: boolean;
  is_ai?: boolean;
  published?: boolean;
}

/**
 * POST handler to create new blog posts via n8n automation webhooks or admin panel.
 * Accepts title, slug, markdown_content (or content), category, image_url (or imageUrl), source_link.
 * Returns 201 Created with { success: true, post } on success.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify Authentication
    if (!(await isAuthorized(request))) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Missing or invalid API key or admin session.",
        },
        { status: 401 }
      );
    }

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

    // Extract title
    const title = typeof body.title === "string" ? body.title.trim() : "";

    // Extract markdown content (mapping markdown_content, content, markdown, etc.)
    const rawContent =
      body.markdown_content ??
      body.markdownContent ??
      body.content ??
      body.markdown ??
      body.text ??
      body.article;
    const markdownContent =
      typeof rawContent === "string" ? rawContent.trim() : "";

    // Validate presence of required fields
    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request: 'title' is a required field.",
        },
        { status: 400 }
      );
    }

    if (!markdownContent) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request: 'markdown_content' (or 'content') is a required field.",
        },
        { status: 400 }
      );
    }

    // Extract category with fallbacks (mapped to Prisma category field)
    const rawCategory =
      body.category ??
      body.category_name ??
      body.topic ??
      body.tag;
    const category =
      typeof rawCategory === "string" && rawCategory.trim() !== ""
        ? rawCategory.trim()
        : "General";

    // Extract image_url with fallbacks (mapped to Prisma image_url field)
    const rawImage =
      body.image_url ??
      body.imageUrl ??
      body.image ??
      body.featured_image ??
      body.featuredImage ??
      body.cover_image ??
      body.coverImage ??
      body.photo_url;
    const imageUrl =
      typeof rawImage === "string" && rawImage.trim() !== ""
        ? rawImage.trim()
        : null;

    // Extract source_link with fallbacks (mapped to Prisma source_link field)
    const rawLink =
      body.source_link ??
      body.sourceLink ??
      body.source_url ??
      body.sourceUrl ??
      body.link ??
      body.url;
    const sourceLink =
      typeof rawLink === "string" && rawLink.trim() !== ""
        ? rawLink.trim()
        : null;

    // Validate URL protocols to prevent XSS (javascript: / data: protocols)
    if (!isValidImageUrl(imageUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request: 'image_url' must use http://, https://, or a valid relative path starting with '/'.",
        },
        { status: 400 }
      );
    }

    if (!isValidHttpUrl(sourceLink)) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request: 'source_link' must use http:// or https:// protocols.",
        },
        { status: 400 }
      );
    }

    // Extract generated_by_ai (defaults to true for webhook automation)
    const generatedByAi =
      body.generated_by_ai !== undefined
        ? Boolean(body.generated_by_ai)
        : body.generatedByAi !== undefined
        ? Boolean(body.generatedByAi)
        : body.ai_generated !== undefined
        ? Boolean(body.ai_generated)
        : body.is_ai !== undefined
        ? Boolean(body.is_ai)
        : true;

    // Extract published (defaults to true)
    const published =
      body.published !== undefined ? Boolean(body.published) : true;

    // Compute slug with Unicode support (Arabic / German characters)
    const rawSlug = typeof body.slug === "string" ? body.slug.trim() : "";
    const baseSlug = title
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-");
    const targetSlug = rawSlug || (baseSlug.length > 0 ? baseSlug : `post-${Date.now()}`);

    // 3. Deduplication Check by source_link if present
    if (sourceLink) {
      const existingPostByLink = await prisma.post.findFirst({
        where: { source_link: sourceLink },
      });

      if (existingPostByLink) {
        console.log("[Webhook Automation] Post already exists with this source_link:", {
          sourceLink,
          existingId: existingPostByLink.id,
          slug: existingPostByLink.slug,
        });
        return NextResponse.json(
          {
            success: true,
            message: "Post already exists",
            skipped: true,
            post: existingPostByLink,
          },
          { status: 200 }
        );
      }
    }

    // 4. Ensure final slug uniqueness
    let finalSlug = targetSlug;
    const existingSlug = await prisma.post.findUnique({
      where: { slug: finalSlug },
    });
    if (existingSlug) {
      finalSlug = `${targetSlug}-${Date.now()}`;
    }

    // 5. Persist post to database using Prisma
    const newPost = await prisma.post.create({
      data: {
        title,
        slug: finalSlug,
        markdown_content: markdownContent,
        category,
        image_url: imageUrl,
        source_link: sourceLink,
        generated_by_ai: generatedByAi,
        published,
      },
    });

    console.log("[Webhook Automation] Successfully created post:", newPost.id, newPost.slug);

    // 6. Return 201 Created response with { success: true, post }
    return NextResponse.json(
      {
        success: true,
        message: "Post created successfully",
        post: newPost,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[Webhook Automation Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
