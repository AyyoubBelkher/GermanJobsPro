import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const lesson20 = await prisma.post.findFirst({
    where: {
      slug: { startsWith: "german-a1-lesson-20" },
    },
  });

  if (!lesson20) {
    throw new Error("Lesson 20 post not found!");
  }

  console.log("Current Lesson 20:", {
    id: lesson20.id,
    title: lesson20.title,
    imageUrl: lesson20.image_url,
  });

  const updated = await prisma.post.update({
    where: { id: lesson20.id },
    data: {
      title: "الدرس 20: حجز المواعيد والتوقيت في الحياة اليومية",
      image_url: "/images/lesson-20.png",
    },
  });

  console.log("Updated Lesson 20:", {
    id: updated.id,
    title: updated.title,
    imageUrl: updated.image_url,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
