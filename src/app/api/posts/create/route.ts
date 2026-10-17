import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidHttpUrl, isValidImageUrl } from "@/lib/session";
import { verifyAutomationSecret } from "@/lib/admin-auth";
import { ensurePermanentImageUrl } from "@/lib/imageUtils";
import { extractLessonNumber, resolveLessonImage } from "@/lib/courseUtils";

/**
 * Strips leaked date metadata, standalone timestamps, and duplicate lesson headings.
 */
function cleanPostContent(content: string): string {
  if (!content) return "";
  let text = content;
  // Strip lines starting with تاريخ الدرس / تاريخ النشر / التاريخ
  text = text.replace(
    /^[\s\uFEFF]*(?:تاريخ\s*(?:الدرس|النشر)|التاريخ)\s*:[^\r\n]*(\r?\n)*/gmiu,
    ""
  );
  // Strip lines starting with standalone date tokens like 202\d{5}
  text = text.replace(
    /^[\s\uFEFF]*\b202\d{5}\b[^\r\n]*(\r?\n)*/gmu,
    ""
  );
  // Strip inline standalone 202\d{5}
  text = text.replace(/\b202\d{5}\b/g, "");
  // Normalize duplicated "الدرس X: الدرس X:" inside markdown headings if present
  text = text.replace(
    /^((?:#+\s*)?(?:الدرس|Lesson|Lektion)\s*\d+)\s*[:\-–—]?\s*(?:(?:الدرس|Lesson|Lektion)\s*\d+\s*[:\-–—]?\s*)+/gmiu,
    "$1: "
  );
  // Normalize excessive newlines
  text = text.replace(/\n{3,}/g, "\n\n").trim();
  return text;
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
 * POST handler to create new blog posts via n8n automation webhooks.
 * Accepts title, slug, markdown_content (or content), category, image_url (or imageUrl), source_link.
 * Returns 201 Created with { success: true, post } on success.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify Authentication strictly from headers (query parameters rejected)
    if (!verifyAutomationSecret(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
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

    // 1. Normalize Title: collapse repeated prefixes like "الدرس 18: الدرس 18:" -> "الدرس 18:"
    const normalizedTitle = title
      .replace(
        /^((?:الدرس|Lesson|Lektion)\s*\d+)\s*[:\-–—]?\s*(?:(?:الدرس|Lesson|Lektion)\s*\d+\s*[:\-–—]?\s*)+/iu,
        "$1: "
      )
      .trim();

    // 2. Sanitize markdown content and optional excerpt of leaked date metadata
    const sanitizedMarkdown = cleanPostContent(markdownContent);

    // 3. German A1 Lesson Detection, Slug Normalization & Local Asset Auto-Assignment
    const isA1 =
      category.toLowerCase().includes("a1") ||
      category.toLowerCase() === "german a1" ||
      category.toLowerCase() === "deutsch a1" ||
      /^(?:الدرس|Lesson|Lektion)\s*\d+/iu.test(normalizedTitle);

    const rawSlug = typeof body.slug === "string" ? body.slug.trim() : "";
    let targetSlug = rawSlug;
    let resolvedImage = imageUrl;

    if (isA1) {
      const lessonNum = extractLessonNumber(normalizedTitle, rawSlug, sanitizedMarkdown);
      if (lessonNum !== null && lessonNum >= 1 && lessonNum < 9999) {
        const canonicalA1Slug = `german-a1-lesson-${lessonNum}`;

        const existingPostWithSlug = await prisma.post.findUnique({
          where: { slug: canonicalA1Slug },
        });

        if (!existingPostWithSlug) {
          targetSlug = canonicalA1Slug;
        } else {
          const existingLessonNum = extractLessonNumber(
            existingPostWithSlug.title,
            existingPostWithSlug.slug,
            existingPostWithSlug.markdown_content
          );
          if (existingLessonNum === lessonNum) {
            targetSlug = canonicalA1Slug;
          } else {
            targetSlug = `${canonicalA1Slug}-${Date.now()}`;
          }
        }

        // Resolve cover image: custom image takes priority, otherwise use static asset if on disk
        resolvedImage = resolveLessonImage(
          resolvedImage,
          lessonNum,
          canonicalA1Slug,
          normalizedTitle
        );
      }
    }

    if (!targetSlug) {
      const baseSlug = normalizedTitle
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .trim()
        .replace(/\s+/g, "-");
      targetSlug = baseSlug.length > 0 ? baseSlug : `post-${Date.now()}`;
    }

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

    // Ensure image is permanent and does not expire from social CDN
    const permanentImageUrl = resolvedImage ? await ensurePermanentImageUrl(resolvedImage) : null;

    // 5. Persist post to database using Prisma
    const newPost = await prisma.post.create({
      data: {
        title: normalizedTitle,
        slug: finalSlug,
        markdown_content: sanitizedMarkdown,
        category,
        image_url: permanentImageUrl,
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
