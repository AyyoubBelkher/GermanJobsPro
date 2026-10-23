import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { normalizeMarkdownFormatting } from "../src/components/blog/LessonContentRenderer";

async function main() {
  console.log("Starting database cleanup for posts...");

  // 1. Fetch all posts
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      markdown_content: true,
    },
  });

  console.log(`Found ${posts.length} posts to inspect.`);

  let updatedCount = 0;

  for (const post of posts) {
    const originalContent = post.markdown_content || "";
    const cleanedContent = normalizeMarkdownFormatting(originalContent);

    if (originalContent !== cleanedContent) {
      console.log(`\nFixing post: [${post.slug}] "${post.title}"`);
      
      // Calculate changes
      const origLines = originalContent.split("\n").length;
      const cleanLines = cleanedContent.split("\n").length;
      console.log(`  Lines: ${origLines} -> ${cleanLines}`);

      await prisma.post.update({
        where: { id: post.id },
        data: {
          markdown_content: cleanedContent,
        },
      });

      updatedCount++;
    } else if (post.slug === "eu-blue-card-germany-requirements-18521") {
      console.log(`\nTarget post [${post.slug}] already clean or formatted.`);
    }
  }

  console.log(`\nDatabase cleanup complete. Updated ${updatedCount} post(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error running database fix script:", err);
  process.exit(1);
});
