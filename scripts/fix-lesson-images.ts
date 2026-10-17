import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { extractLessonNumber, isCustomLessonImage, hasStaticLessonImage } from "../src/lib/courseUtils";

async function main() {
  const posts = await prisma.post.findMany();
  let updated = 0;

  for (const post of posts) {
    const num = extractLessonNumber(post.title, post.slug, post.markdown_content);
    if (num >= 1 && num <= 20) {
      // Do not overwrite custom images (data:image/ or https://)
      if (isCustomLessonImage(post.image_url)) {
        continue;
      }

      if (num === 18) {
        if (post.image_url !== null) {
          await prisma.post.update({
            where: { id: post.id },
            data: { image_url: null },
          });
          console.log(`✓ الدرس 18 -> تم مسح الصورة الثابتة إلى null (تفعيل CSS cover)`);
          updated++;
        }
      } else if (hasStaticLessonImage(num)) {
        const target = `/images/lessons/german-a1-lesson-${num}.png`;
        if (post.image_url !== target) {
          await prisma.post.update({
            where: { id: post.id },
            data: { image_url: target },
          });
          console.log(`✓ تم تحديث الدرس ${num} -> ${target}`);
          updated++;
        }
      }
    }
  }

  console.log(`\nاكتمل العمل: تم تحديث ${updated} مقالات بنجاح في قاعدة البيانات.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
