import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractCleanExcerpt } from '@/lib/courseUtils';

export async function GET() {
  try {
    const dbPosts = await prisma.post.findMany({
      where: { published: true },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const posts = dbPosts.map((post) => {
      const cleanExcerpt = extractCleanExcerpt(post.markdown_content, post.title, 150);

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

