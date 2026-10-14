import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { sanitizeJobPayload } from "../src/lib/jobSanitizer";
import { ensurePermanentImageUrl, isExpiringSocialCdnUrl } from "../src/lib/imageUtils";
import { extractLessonNumber } from "../src/lib/courseUtils";

/**
 * Clean Live Database Script (Phase 2 - Permanent Assets & Schema Integrity)
 * Part A: Cleans Jobs (sanitizes false healthcare/nursing data, updates titles, categories, salaries, requirements).
 * Part B: Cleans Posts:
 *   - Normalizes duplicated title prefixes ("الدرس X: الدرس X:").
 *   - Strips leaked date metadata ("تاريخ الدرس: ...", "202\d{5}") from markdown_content.
 *   - Restores permanent local assets for A1 lessons 1 to 20 (/images/lessons/german-a1-lesson-X.png).
 *   - Converts expiring social CDN URLs for lessons > 20 into permanent Base64 Data URLs.
 *   - Unpublishes duplicate lessons > 20 (Lessons 21 and 22 duplicating 17 and 18).
 */
async function cleanLiveDatabase() {
  console.log("================================================================================");
  console.log("🚀 STARTING NEON DATABASE LIVE CLEANUP SCRIPT (PHASE 2)");
  console.log("================================================================================\n");

  // ============================================================================
  // PART A: JOBS CLEANUP
  // ============================================================================
  console.log("📦 [PART A] Fetching all Jobs from database...");
  const allJobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
  });
  console.log(`Found ${allJobs.length} total jobs in database.\n`);

  let jobsUpdatedCount = 0;

  for (const job of allJobs) {
    const sanitized = sanitizeJobPayload({
      title: job.title,
      category: job.category,
      salary: job.salary,
      requirements: job.requirements,
      descriptionRaw: job.descriptionRaw,
    });

    const titleChanged = sanitized.title !== job.title;
    const categoryChanged = sanitized.category !== job.category;
    const salaryChanged = (sanitized.salary ?? null) !== (job.salary ?? null);
    const reqChanged = (sanitized.requirements ?? null) !== (job.requirements ?? null);
    const descChanged = (sanitized.descriptionRaw ?? null) !== (job.descriptionRaw ?? null);

    if (titleChanged || categoryChanged || salaryChanged || reqChanged || descChanged) {
      console.log(`🛠️  [FIXING JOB] ID: ${job.id}`);
      if (titleChanged) {
        console.log(`   - Title:       "${job.title}" -> "${sanitized.title}"`);
      }
      if (categoryChanged) {
        console.log(`   - Category:    "${job.category}" -> "${sanitized.category}"`);
      }
      if (salaryChanged) {
        console.log(`   - Salary:      "${job.salary}" -> "${sanitized.salary}"`);
      }
      if (reqChanged) {
        console.log(`   - Requirements updated (stripped false nursing boilerplate)`);
      }
      if (descChanged) {
        console.log(`   - Description updated (cleaned false nursing boilerplate)`);
      }

      await prisma.job.update({
        where: { id: job.id },
        data: {
          title: sanitized.title,
          category: sanitized.category ?? job.category,
          salary: sanitized.salary,
          requirements: sanitized.requirements,
          descriptionRaw: sanitized.descriptionRaw,
        },
      });

      jobsUpdatedCount++;
      console.log(`   ✅ Job ${job.id} updated successfully.\n`);
    }
  }

  console.log(`📊 Part A Summary: Updated ${jobsUpdatedCount} / ${allJobs.length} jobs.\n`);

  // ============================================================================
  // PART B: POSTS CLEANUP
  // ============================================================================
  console.log("--------------------------------------------------------------------------------");
  console.log("📚 [PART B] Fetching all Posts from database...");
  const allPosts = await prisma.post.findMany({
    orderBy: { createdAt: "asc" },
  });
  console.log(`Found ${allPosts.length} total posts in database.\n`);

  let postsUpdatedCount = 0;
  let duplicateLessonsUnpublished = 0;
  let imagesConvertedCount = 0;

  for (const post of allPosts) {
    const isA1 =
      post.category.toLowerCase().includes("a1") ||
      post.slug.includes("a1-lesson") ||
      post.title.includes("الدرس");

    let updatedTitle = post.title;
    let updatedContent = post.markdown_content;
    let updatedImageUrl = post.image_url;
    let updatedPublished = post.published;

    // 1. Strip duplicated "الدرس X: الدرس X:" -> "الدرس X:"
    const normalizedTitle = updatedTitle.replace(
      /^((?:الدرس|Lesson|Lektion)\s*\d+)\s*[:\-–—]?\s*(?:(?:الدرس|Lesson|Lektion)\s*\d+\s*[:\-–—]?\s*)+/iu,
      "$1: "
    ).trim();

    if (normalizedTitle !== updatedTitle) {
      console.log(`📝 [POST TITLE NORMALIZED] ID: ${post.id} (${post.slug})`);
      console.log(`   - Old Title: "${updatedTitle}"`);
      console.log(`   - New Title: "${normalizedTitle}"`);
      updatedTitle = normalizedTitle;
    }

    // 2. Strip leaked date lines and standalone 202\d{5} numbers from markdown_content
    const originalContent = updatedContent;

    // Strip lines starting with تاريخ الدرس / تاريخ النشر / التاريخ
    updatedContent = updatedContent.replace(
      /^[\s\uFEFF]*(?:تاريخ\s*(?:الدرس|النشر)|التاريخ)\s*:[^\r\n]*(\r?\n)*/gmiu,
      ""
    );

    // Strip lines starting with standalone date tokens like 202\d{5}
    updatedContent = updatedContent.replace(
      /^[\s\uFEFF]*\b202\d{5}\b[^\r\n]*(\r?\n)*/gmu,
      ""
    );

    // Strip inline standalone 202\d{5}
    updatedContent = updatedContent.replace(/\b202\d{5}\b/g, "");

    // Normalize duplicated "الدرس X: الدرس X:" inside markdown headings if present
    updatedContent = updatedContent.replace(
      /^((?:#+\s*)?(?:الدرس|Lesson|Lektion)\s*\d+)\s*[:\-–—]?\s*(?:(?:الدرس|Lesson|Lektion)\s*\d+\s*[:\-–—]?\s*)+/gmiu,
      "$1: "
    );

    // Normalize excessive newlines
    updatedContent = updatedContent.replace(/\n{3,}/g, "\n\n").trim();

    const contentChanged = updatedContent !== originalContent;
    if (contentChanged) {
      console.log(`🧹 [POST MARKDOWN CLEANED] ID: ${post.id} (${post.slug})`);
      console.log(`   - Stripped leaked date metadata from markdown_content.`);
    }

    // 3. Lesson Image Persistence & Duplicate Checks
    if (isA1) {
      const lessonNum = extractLessonNumber(post.title, post.slug, post.markdown_content);

      if (lessonNum >= 1 && lessonNum <= 20) {
        // Lessons 1 to 20: Use permanent local assets
        const expectedImagePath = `/images/lessons/german-a1-lesson-${lessonNum}.png`;
        const currentImage = (post.image_url || "").trim();

        if (
          !currentImage ||
          currentImage.includes("fbcdn.net") ||
          currentImage.includes("scontent") ||
          currentImage.includes("unsplash.com") ||
          currentImage !== expectedImagePath
        ) {
          console.log(`🖼️  [A1 LESSON IMAGE RESTORED] Lesson ${lessonNum} (${post.slug})`);
          console.log(`   - Old: "${post.image_url}"`);
          console.log(`   - New: "${expectedImagePath}"`);
          updatedImageUrl = expectedImagePath;
          imagesConvertedCount++;
        }
      } else if (lessonNum > 20) {
        // Lessons > 20: If active social CDN URL, convert to permanent Base64 Data URL
        if (post.image_url && isExpiringSocialCdnUrl(post.image_url)) {
          console.log(`🔄 [CONVERTING SOCIAL CDN IMAGE] Lesson ${lessonNum} (${post.slug})...`);
          const permanentUrl = await ensurePermanentImageUrl(post.image_url);
          if (permanentUrl && permanentUrl !== post.image_url) {
            console.log(`   ✅ Converted to permanent Base64 Data URL (length: ${permanentUrl.length})`);
            updatedImageUrl = permanentUrl;
            imagesConvertedCount++;
          }
        }

        // Specifically check Lessons 21 and 22 duplicates
        if (lessonNum === 21) {
          console.log(`⚠️  [DUPLICATE LESSON DETECTED] Lesson 21 duplicates Lesson 17 topic ("Trennbare Verben").`);
          if (updatedPublished) {
            console.log(`   -> Setting published: false to keep curriculum clean.`);
            updatedPublished = false;
            duplicateLessonsUnpublished++;
          }
        } else if (lessonNum === 22) {
          console.log(`⚠️  [DUPLICATE LESSON DETECTED] Lesson 22 duplicates Lesson 18 topic ("Modalverben: können und müssen").`);
          if (updatedPublished) {
            console.log(`   -> Setting published: false to keep curriculum clean.`);
            updatedPublished = false;
            duplicateLessonsUnpublished++;
          }
        }
      }
    }

    // Save changes if any field changed
    const titleChanged = updatedTitle !== post.title;
    const imageChanged = updatedImageUrl !== post.image_url;
    const publishedChanged = updatedPublished !== post.published;

    if (titleChanged || contentChanged || imageChanged || publishedChanged) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          title: updatedTitle,
          markdown_content: updatedContent,
          image_url: updatedImageUrl,
          published: updatedPublished,
        },
      });

      postsUpdatedCount++;
      console.log(`   ✅ Post ${post.id} updated in database.\n`);
    }
  }

  console.log(`📊 Part B Summary: Updated ${postsUpdatedCount} / ${allPosts.length} posts.`);
  console.log(`   - Permanent images restored/converted: ${imagesConvertedCount}`);
  console.log(`   - Duplicate lessons unpublished:       ${duplicateLessonsUnpublished}\n`);

  console.log("================================================================================");
  console.log("🎉 NEON DATABASE CLEANUP COMPLETE!");
  console.log(`   - Jobs cleaned:              ${jobsUpdatedCount}`);
  console.log(`   - Posts cleaned:             ${postsUpdatedCount}`);
  console.log(`   - Images permanent:          ${imagesConvertedCount}`);
  console.log(`   - Duplicate lessons unpub:   ${duplicateLessonsUnpublished}`);
  console.log("================================================================================");
}

cleanLiveDatabase()
  .catch((err) => {
    console.error("❌ Cleanup failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
