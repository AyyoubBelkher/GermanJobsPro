import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const GOOGLE_NEWS_DOMAINS = [
  "news.google.com",
  "news.google.",
  "google.com/url",
  "google.com/rss",
  "news.ycombinator.com",
  "googlenews",
];

export function isNonJobOrNewsEntry(job: {
  title?: string | null;
  company?: string | null;
  applyUrl?: string | null;
  contactEmail?: string | null;
}): { isInvalid: boolean; reason?: string } {
  const title = (job.title || "").trim();
  const company = (job.company || "").trim();
  const applyUrl = (job.applyUrl || "").trim().toLowerCase();
  const contactEmail = (job.contactEmail || "").trim();

  // 1. Check title validity
  if (!title || title.length < 3) {
    return { isInvalid: true, reason: "Title is empty or shorter than 3 characters" };
  }

  // 2. Check company validity
  if (!company || company.length < 2) {
    return { isInvalid: true, reason: "Company name is empty or shorter than 2 characters" };
  }

  if (company.toLowerCase() === "google news" || company.toLowerCase() === "unknown") {
    return { isInvalid: true, reason: `Company name indicates non-job source: "${company}"` };
  }

  // 3. Check for Google News or non-job aggregator URLs
  for (const domain of GOOGLE_NEWS_DOMAINS) {
    if (applyUrl.includes(domain)) {
      return { isInvalid: true, reason: `applyUrl contains Google News aggregator domain: "${domain}"` };
    }
  }

  // 4. Must have at least one valid application method (applyUrl or contactEmail)
  const hasValidUrl = applyUrl.startsWith("http://") || applyUrl.startsWith("https://") || applyUrl.startsWith("mailto:");
  const hasValidEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(contactEmail);

  if (!hasValidUrl && !hasValidEmail) {
    return { isInvalid: true, reason: "Lacks a valid application method (neither valid applyUrl nor contactEmail)" };
  }

  return { isInvalid: false };
}

async function runCleanup() {
  console.log("🧹 Starting Job Database Cleanup & Migration Task...\n");

  try {
    const allJobs = await prisma.job.findMany();
    console.log(`📊 Found ${allJobs.length} total jobs currently in the database.`);

    const invalidJobIds: Array<{ id: string; title: string; company: string; reason: string }> = [];
    let validCount = 0;
    let updatedCount = 0;

    for (const job of allJobs) {
      const check = isNonJobOrNewsEntry(job);
      if (check.isInvalid) {
        invalidJobIds.push({
          id: job.id,
          title: job.title,
          company: job.company,
          reason: check.reason || "Invalid entry",
        });
      } else {
        validCount++;
        // Ensure status and isVerified are properly set
        if (!job.status || job.isVerified === undefined || job.isVerified === null) {
          await prisma.job.update({
            where: { id: job.id },
            data: {
              status: job.status || "ACTIVE",
              isVerified: true,
            },
          });
          updatedCount++;
        }
      }
    }

    if (invalidJobIds.length > 0) {
      console.log(`\n⚠️  Found ${invalidJobIds.length} non-job / Google News entries to delete:`);
      for (const item of invalidJobIds) {
        console.log(`  - [ID: ${item.id}] "${item.title}" by "${item.company}" (Reason: ${item.reason})`);
        await prisma.job.delete({
          where: { id: item.id },
        });
      }
      console.log(`✅ Successfully deleted ${invalidJobIds.length} non-job entries.`);
    } else {
      console.log("✨ No non-job entries or Google News articles found. Database is clean!");
    }

    console.log(`\n📋 Cleanup Summary:`);
    console.log(`   - Total Processed: ${allJobs.length}`);
    console.log(`   - Deleted (Invalid/News): ${invalidJobIds.length}`);
    console.log(`   - Verified Active Jobs: ${validCount}`);
    console.log(`   - Updated Defaults: ${updatedCount}`);
    console.log("\n🚀 Migration and cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module || process.argv[1]?.includes("cleanup-jobs")) {
  runCleanup();
}
