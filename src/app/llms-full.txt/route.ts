import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLlmsBaseMarkdown } from "@/lib/llms";
import { stripHtml } from "@/lib/cover-letter";

export const revalidate = 3600;

export async function GET() {
  const baseMarkdown = getLlmsBaseMarkdown();

  let jobsSection = "";
  try {
    const jobs = await prisma.job.findMany({
      where: { status: "ACTIVE" },
      orderBy: { publishedAt: "desc" },
      take: 25,
      select: {
        id: true,
        title: true,
        company: true,
        city: true,
        category: true,
        languageReq: true,
        salary: true,
        publishedAt: true,
      },
    });

    if (jobs.length > 0) {
      const jobLines = jobs.map((job, idx) => {
        const city = job.city || "Deutschland";
        const lang = job.languageReq || "B1/B2";
        const salary = job.salary ? ` | Gehalt: ${job.salary}` : "";
        return `${idx + 1}. **${job.title}** at **${job.company}** (${city})
   - Category: ${job.category} | Language: ${lang}${salary}
   - Apply & AI Dossier Link: https://www.germanjobspro.com/ar/jobs/${job.id}`;
      });

      jobsSection = `
---

## Currently Verified Active Job Openings in Germany (Top 25)

${jobLines.join("\n\n")}
`;
    }
  } catch (error) {
    console.warn("[llms-full.txt] Failed to query active jobs:", error);
  }

  let postsSection = "";
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        slug: true,
        title: true,
        category: true,
        markdown_content: true,
        createdAt: true,
      },
    });

    if (posts.length > 0) {
      const postLines = posts.map((post, idx) => {
        const excerpt = stripHtml(post.markdown_content).slice(0, 140).replace(/\n/g, " ");
        return `${idx + 1}. **${post.title}** [${post.category}]
   - Excerpt: ${excerpt}...
   - URL: https://www.germanjobspro.com/ar/blog/${encodeURIComponent(post.slug)}`;
      });

      postsSection = `
---

## Published Career Guides & German A1 Curriculum Lessons (Top 50)

${postLines.join("\n\n")}
`;
    }
  } catch (error) {
    console.warn("[llms-full.txt] Failed to query published posts:", error);
  }

  const fullContent = `${baseMarkdown}\n${jobsSection}\n${postsSection}`.trim();

  return new NextResponse(fullContent, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
