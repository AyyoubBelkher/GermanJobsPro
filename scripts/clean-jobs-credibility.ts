import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function runCredibilityCleanup() {
  console.log("🚀 Starting Jobs Database Credibility & Transparency Cleanup...\n");

  const allJobs = await prisma.job.findMany({
    select: {
      id: true,
      title: true,
      company: true,
      contactEmail: true,
      applyUrl: true,
      salary: true,
      descriptionRaw: true,
      requirements: true,
    },
  });

  console.log(`📊 Total jobs in database: ${allJobs.length}`);

  let cleanedEmailCount = 0;
  let verifiedEmailCount = 0;
  let cleanedSalaryCount = 0;
  let realSalaryCount = 0;

  const fallbackSalaryRegex = /(?:حسب\s*الخبرة\s*والاتفاق|Verhandlungsbasis|اتفاقية\s*الأجور|حسب\s*السلم|Tarifvertrag|علاوات\s*المناوبات)/i;

  for (const job of allJobs) {
    let updateData: { contactEmail?: null; salary?: null } = {};

    // 1. Check contactEmail
    if (job.contactEmail) {
      const email = job.contactEmail.trim().toLowerCase();
      const desc = (job.descriptionRaw || "").toLowerCase();
      const reqs = (job.requirements || "").toLowerCase();
      const apply = (job.applyUrl || "").toLowerCase();

      const inDesc = desc.includes(email);
      const inReqs = reqs.includes(email);
      const inMailto = apply.startsWith("mailto:") && apply.includes(email);

      if (inDesc || inReqs || inMailto) {
        verifiedEmailCount++;
        console.log(`  [VERIFIED EMAIL] Job ${job.id} (${job.company}): ${job.contactEmail}`);
      } else {
        cleanedEmailCount++;
        console.log(`  [REMOVING GUESSED EMAIL] Job ${job.id} (${job.company}): ${job.contactEmail}`);
        updateData.contactEmail = null;
      }
    }

    // 2. Check salary
    if (job.salary) {
      if (fallbackSalaryRegex.test(job.salary)) {
        cleanedSalaryCount++;
        console.log(`  [REMOVING FAKE SALARY] Job ${job.id} (${job.company}): "${job.salary}"`);
        updateData.salary = null;
      } else {
        realSalaryCount++;
        console.log(`  [REAL SALARY PRESERVED] Job ${job.id} (${job.company}): "${job.salary}"`);
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.job.update({
        where: { id: job.id },
        data: updateData,
      });
    }
  }

  console.log("\n========================================");
  console.log("🎯 CLEANUP SUMMARY REPORT:");
  console.log(`- Total jobs processed: ${allJobs.length}`);
  console.log(`- Guessed/fake emails cleaned to null: ${cleanedEmailCount}`);
  console.log(`- Verified real emails retained: ${verifiedEmailCount}`);
  console.log(`- Fake fallback salaries cleaned to null: ${cleanedSalaryCount}`);
  console.log(`- Real salaries retained: ${realSalaryCount}`);
  console.log("========================================\n");
}

runCredibilityCleanup()
  .catch((err) => {
    console.error("Cleanup failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
