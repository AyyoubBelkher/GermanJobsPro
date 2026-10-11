import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { extractLessonNumber } from "../src/lib/courseUtils";

async function main() {
  const posts = await prisma.post.findMany();
  let updated = 0;

  for (const post of posts) {
    const num = extractLessonNumber(post.title, post.slug, post.markdown_content);
    if (num >= 15 && num <= 20) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          image_url: `/images/lessons/german-a1-lesson-${num}.png`,
        },
      });
      console.log(`✓ تم تحديث الدرس ${num} -> /images/lessons/german-a1-lesson-${num}.png`);
      updated++;
    }
  }

  console.log(`\nاكتمل العمل: تم تحديث ${updated} مقالات بنجاح في قاعدة البيانات.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
