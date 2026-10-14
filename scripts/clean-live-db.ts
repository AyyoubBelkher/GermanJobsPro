import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { sanitizeJobPayload } from "../src/lib/jobSanitizer";
import { ensurePermanentImageUrl, isExpiringSocialCdnUrl } from "../src/lib/imageUtils";
import { extractLessonNumber, parseLessonTitle } from "../src/lib/courseUtils";

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
    let updatedSlug = post.slug;
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

    // 3. A1 Curriculum Sequence, Title Recovery, and Asset Integrity (Strictly Lessons 1 to 21)
    if (isA1) {
      const lessonNum = extractLessonNumber(post.title, post.slug, post.markdown_content);

      // Lesson 19: Clean truncated title & heading
      if (lessonNum === 19 || post.id === "cmuqsvodi00020hp66tuc1vbm") {
        if (updatedTitle === "الدرس 19:" || updatedTitle.endsWith(":") || updatedTitle.length <= 12) {
          updatedTitle = "الدرس 19: Dativ mit Präpositionen (حروف الجر مع حالة المجرور ووسائل النقل)";
          console.log(`📝 [LESSON 19 TITLE FIXED] ID: ${post.id}`);
          console.log(`   - New Title: "${updatedTitle}"`);
        }
        updatedContent = updatedContent.replace(
          /^#\s*الدرس\s*19\s*:\s*(?:العنوان\s*:\s*)?[^\r\n]*/miu,
          "# الدرس 19: Dativ mit Präpositionen (حروف الجر مع حالة المجرور ووسائل النقل)"
        );
      }

      // Lesson 23: Renumber to Lesson 21 (Die Familie und Verwandte)
      if (
        post.id === "cmv75d4cx00020ilqhq25at5m" ||
        post.slug === "german-a1-lesson-23" ||
        post.title.includes("الدرس 23") ||
        (post.markdown_content.includes("العائلة والأقارب") && !post.markdown_content.includes("Tagesablauf"))
      ) {
        console.log(`📝 [RENUMBERING LESSON 23 -> 21] ID: ${post.id} (${post.slug})`);
        updatedTitle = "الدرس 21: Die Familie und Verwandte (العائلة والأقارب في اللغة الألمانية)";
        updatedSlug = "german-a1-lesson-21";
        updatedPublished = true;

        let cleanMd = updatedContent;
        if (!cleanMd.startsWith("# الدرس 21:")) {
          cleanMd = `# الدرس 21: Die Familie und Verwandte (العائلة والأقارب في اللغة الألمانية)\n\n` + cleanMd.replace(/^#+\s*الدرس\s*\d+[^\r\n]*\n*/iu, "");
        }
        cleanMd = cleanMd.replace(/الدرس الثالث والعشرين/gu, "الدرس الحادي والعشرين");
        updatedContent = cleanMd;

        // Ensure permanent cover image file for Lesson 21 on disk
        const lesson21ImgPath = path.resolve(process.cwd(), "public/images/lessons/german-a1-lesson-21.png");
        if (post.image_url && post.image_url.startsWith("data:image/")) {
          try {
            const base64Data = post.image_url.replace(/^data:image\/\w+;base64,/, "");
            fs.writeFileSync(lesson21ImgPath, Buffer.from(base64Data, "base64"));
            console.log(`   🖼️  Saved permanent image asset to public/images/lessons/german-a1-lesson-21.png`);
          } catch (err) {
            console.warn(`   ⚠️ Could not write lesson 21 image file:`, err);
          }
        }
        if (fs.existsSync(lesson21ImgPath)) {
          updatedImageUrl = "/images/lessons/german-a1-lesson-21.png";
          imagesConvertedCount++;
        }
      }

      // Fallback title recovery for any other truncated A1 title
      const isStillTruncated = updatedTitle.endsWith(":") || !!updatedTitle.match(/^(?:الدرس|Lesson|Lektion)\s*\d+\s*[:\-–—]?\s*$/iu);
      if (isStillTruncated) {
        const parsed = parseLessonTitle(updatedTitle, updatedContent);
        if (parsed.fullTitle && parsed.fullTitle !== updatedTitle) {
          console.log(`📝 [TRUNCATED A1 TITLE RECOVERED] ID: ${post.id}`);
          console.log(`   - Old Title: "${updatedTitle}"`);
          console.log(`   - New Title: "${parsed.fullTitle}"`);
          updatedTitle = parsed.fullTitle;
        }
      }

      // Manage duplicate lessons and permanent assets
      const currentLessonNum = extractLessonNumber(updatedTitle, updatedSlug, updatedContent);
      if (currentLessonNum === 21 && post.id !== "cmv75d4cx00020ilqhq25at5m" && updatedSlug !== "german-a1-lesson-21") {
        // Duplicate Lesson 21 (duplicate of Lesson 17 Trennbare Verben)
        console.log(`⚠️  [DUPLICATE LESSON DETECTED] Post ${post.id} (${post.slug}) duplicates Lesson 17 topic.`);
        if (updatedPublished) {
          console.log(`   -> Setting published: false to keep curriculum clean.`);
          updatedPublished = false;
          duplicateLessonsUnpublished++;
        }
      } else if (currentLessonNum === 22) {
        // Duplicate Lesson 22 (duplicate of Lesson 18 Modalverben)
        console.log(`⚠️  [DUPLICATE LESSON DETECTED] Post ${post.id} (${post.slug}) duplicates Lesson 18 topic.`);
        if (updatedPublished) {
          console.log(`   -> Setting published: false to keep curriculum clean.`);
          updatedPublished = false;
          duplicateLessonsUnpublished++;
        }
      } else if (currentLessonNum >= 1 && currentLessonNum <= 21) {
        // Lessons 1 to 21: Check permanent local assets
        const expectedImagePath = `/images/lessons/german-a1-lesson-${currentLessonNum}.png`;
        const localFileExists = fs.existsSync(path.resolve(process.cwd(), `public${expectedImagePath}`));
        if (localFileExists && updatedImageUrl !== expectedImagePath) {
          console.log(`🖼️  [A1 LESSON IMAGE RESTORED] Lesson ${currentLessonNum} (${updatedSlug})`);
          console.log(`   - Old: "${post.image_url?.slice(0, 30)}..."`);
          console.log(`   - New: "${expectedImagePath}"`);
          updatedImageUrl = expectedImagePath;
          imagesConvertedCount++;
        }
      } else if (currentLessonNum > 21) {
        if (post.image_url && isExpiringSocialCdnUrl(post.image_url)) {
          console.log(`🔄 [CONVERTING SOCIAL CDN IMAGE] Lesson ${currentLessonNum} (${post.slug})...`);
          const permanentUrl = await ensurePermanentImageUrl(post.image_url);
          if (permanentUrl && permanentUrl !== post.image_url) {
            console.log(`   ✅ Converted to permanent Base64 Data URL (length: ${permanentUrl.length})`);
            updatedImageUrl = permanentUrl;
            imagesConvertedCount++;
          }
        }
      }
    }

    // Save changes if any field changed
    const titleChanged = updatedTitle !== post.title;
    const slugChanged = updatedSlug !== post.slug;
    const imageChanged = updatedImageUrl !== post.image_url;
    const publishedChanged = updatedPublished !== post.published;

    if (titleChanged || slugChanged || contentChanged || imageChanged || publishedChanged) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          title: updatedTitle,
          slug: updatedSlug,
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
