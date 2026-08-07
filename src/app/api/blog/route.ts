import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const dbPosts = await prisma.post.findMany({
      where: { published: true },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const posts = dbPosts.map((post) => {
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
        excerpt: cleanExcerpt,
        cover_image: post.image_url || "",
        author: post.generated_by_ai ? "AI Assistant" : "Author",
        tags: [post.category],
        created_at: post.createdAt.toISOString(),
        markdown_content: post.markdown_content,
      };
    });

    return NextResponse.json({ posts });
  } catch (error: unknown) {
    console.error("[Blog API Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

