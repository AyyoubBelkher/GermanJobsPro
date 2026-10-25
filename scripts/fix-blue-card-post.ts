import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { normalizeMarkdownFormatting } from "../src/lib/courseUtils";

async function main() {
  console.log("Starting comprehensive database cleanup for posts...");

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
    let cleanedContent = normalizeMarkdownFormatting(originalContent);

    // Normalize any nested/unbalanced parentheses in database content
    cleanedContent = cleanedContent.replace(
      /\(([A-Za-z0-9\s]+?)\s*\(([^()\n]+?)(?:\)+|$)/g,
      "($1 - $2)"
    );

    if (originalContent !== cleanedContent) {
      console.log(`\nFixing post: [${post.slug}] "${post.title}"`);
      
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
    } else if (
      post.slug === "eu-blue-card-germany-requirements-18521" ||
      post.slug === "nursing-jobs-pflegefachkraft-germany-guide-10286"
    ) {
      console.log(`\nTarget post [${post.slug}] verified.`);
    }
  }

  console.log(`\nDatabase cleanup complete. Updated ${updatedCount} post(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error running database fix script:", err);
  process.exit(1);
});
