import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const dbPosts = await prisma.post.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    const posts = dbPosts.map(post => {
      // Strip markdown symbols to create a plain text excerpt
      const cleanExcerpt = post.markdown_content
        ? post.markdown_content
            .replace(/[#*`>_\-]/g, "")
            .substring(0, 160)
            .trim() + "..."
        : "";

      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        title_en: post.title,
        title_ar: post.title,
        title_de: post.title,
        title_fr: post.title,
        excerpt: cleanExcerpt,
        excerpt_en: cleanExcerpt,
        excerpt_ar: cleanExcerpt,
        excerpt_de: cleanExcerpt,
        excerpt_fr: cleanExcerpt,
        cover_image: post.image_url || "",
        author: post.generated_by_ai ? "AI Assistant" : "Author",
        tags: [post.category],
        created_at: post.createdAt.toISOString(),
        markdown_content_en: post.markdown_content,
        markdown_content_ar: post.markdown_content,
        markdown_content_de: post.markdown_content,
        markdown_content_fr: post.markdown_content,
      };
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("[Blog API Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
