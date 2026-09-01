import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "./src/lib/prisma";

interface BackupData {
  exportedAt?: string;
  source?: string;
  tables: {
    User?: Array<Record<string, any>>;
    UserSession?: Array<Record<string, any>>;
    EmailVerificationCode?: Array<Record<string, any>>;
    PasswordResetToken?: Array<Record<string, any>>;
    Cv?: Array<Record<string, any>>;
    CvPersonalInfo?: Array<Record<string, any>>;
    CvExperience?: Array<Record<string, any>>;
    CvEducation?: Array<Record<string, any>>;
    CvSkill?: Array<Record<string, any>>;
    CvLanguage?: Array<Record<string, any>>;
    CvCertification?: Array<Record<string, any>>;
    CvProject?: Array<Record<string, any>>;
    CoverLetter?: Array<Record<string, any>>;
    Job?: Array<Record<string, any>>;
    PromoCode?: Array<Record<string, any>>;
    UserPromoRedemption?: Array<Record<string, any>>;
    ProcessedWebhookEvent?: Array<Record<string, any>>;
    SupportTicket?: Array<Record<string, any>>;
    Post?: Array<Record<string, any>>;
    Subscriber?: Array<Record<string, any>>;
  };
}

function parseDate(val: any): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function parseRequiredDate(val: any, fallback = new Date()): Date {
  if (!val) return fallback;
  const d = new Date(val);
  return isNaN(d.getTime()) ? fallback : d;
}

function parseBoolean(val: any, defaultValue = false): boolean {
  if (val === undefined || val === null) return defaultValue;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val === 1;
  if (typeof val === "string") return val === "1" || val.toLowerCase() === "true";
  return Boolean(val);
}

async function migrate() {
  console.log("🚀 Starting database migration and seeding into Neon PostgreSQL...\n");

  const backupFilePath = path.resolve(process.cwd(), "backup-data.json");
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file not found at ${backupFilePath}`);
  }

  const rawJson = fs.readFileSync(backupFilePath, "utf-8");
  const backup: BackupData = JSON.parse(rawJson);
  const tables = backup.tables || {};

  console.log(`📦 Loaded backup file created at: ${backup.exportedAt || "Unknown date"}`);
  console.log(`📡 Database Target: Neon PostgreSQL (${process.env.DATABASE_URL?.split("@")[1] || "configured endpoint"})\n`);

  // 1. Seed Users
  const users = tables.User || [];
  console.log(`👤 Seeding ${users.length} Users...`);
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        email: u.email,
        passwordHash: u.passwordHash,
        name: u.name ?? null,
        plan: u.plan ?? "FREE",
        planExpiresAt: parseDate(u.planExpiresAt),
        emailVerified: parseBoolean(u.emailVerified, false),
        aiCredits: Number(u.aiCredits ?? 3),
        dailyAiCreditsUsed: Number(u.dailyAiCreditsUsed ?? 0),
        lastCreditResetAt: parseRequiredDate(u.lastCreditResetAt),
        customerId: u.customerId ?? null,
        createdAt: parseRequiredDate(u.createdAt),
        updatedAt: parseRequiredDate(u.updatedAt),
      },
      create: {
        id: u.id,
        email: u.email,
        passwordHash: u.passwordHash,
        name: u.name ?? null,
        plan: u.plan ?? "FREE",
        planExpiresAt: parseDate(u.planExpiresAt),
        emailVerified: parseBoolean(u.emailVerified, false),
        aiCredits: Number(u.aiCredits ?? 3),
        dailyAiCreditsUsed: Number(u.dailyAiCreditsUsed ?? 0),
        lastCreditResetAt: parseRequiredDate(u.lastCreditResetAt),
        customerId: u.customerId ?? null,
        createdAt: parseRequiredDate(u.createdAt),
        updatedAt: parseRequiredDate(u.updatedAt),
      },
    });
  }
  console.log(`  ✓ Users seeded successfully.`);

  // 2. Seed User Sessions
  const sessions = tables.UserSession || [];
  console.log(`🔑 Seeding ${sessions.length} User Sessions...`);
  for (const s of sessions) {
    await prisma.userSession.upsert({
      where: { id: s.id },
      update: {
        userId: s.userId,
        tokenHash: s.tokenHash,
        expiresAt: parseRequiredDate(s.expiresAt),
        createdAt: parseRequiredDate(s.createdAt),
      },
      create: {
        id: s.id,
        userId: s.userId,
        tokenHash: s.tokenHash,
        expiresAt: parseRequiredDate(s.expiresAt),
        createdAt: parseRequiredDate(s.createdAt),
      },
    });
  }
  console.log(`  ✓ User Sessions seeded successfully.`);

  // 3. Seed Promo Codes
  const promoCodes = tables.PromoCode || [];
  console.log(`🎟️ Seeding ${promoCodes.length} Promo Codes...`);
  for (const p of promoCodes) {
    await prisma.promoCode.upsert({
      where: { code: p.code },
      update: {
        planGranted: p.planGranted ?? "TRIAL",
        durationDays: Number(p.durationDays ?? 7),
        creditsGranted: Number(p.creditsGranted ?? 15),
        maxUses: Number(p.maxUses ?? 10),
        timesUsed: Number(p.timesUsed ?? 0),
        expiresAt: parseDate(p.expiresAt),
        isActive: parseBoolean(p.isActive, true),
        createdAt: parseRequiredDate(p.createdAt),
      },
      create: {
        id: p.id,
        code: p.code,
        planGranted: p.planGranted ?? "TRIAL",
        durationDays: Number(p.durationDays ?? 7),
        creditsGranted: Number(p.creditsGranted ?? 15),
        maxUses: Number(p.maxUses ?? 10),
        timesUsed: Number(p.timesUsed ?? 0),
        expiresAt: parseDate(p.expiresAt),
        isActive: parseBoolean(p.isActive, true),
        createdAt: parseRequiredDate(p.createdAt),
      },
    });
  }
  console.log(`  ✓ Promo Codes seeded successfully.`);

  // 4. Seed Posts
  const posts = tables.Post || [];
  console.log(`📝 Seeding ${posts.length} Blog Posts...`);
  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        markdown_content: post.markdown_content,
        category: post.category ?? "General",
        image_url: post.image_url ?? null,
        source_link: post.source_link ?? null,
        generated_by_ai: parseBoolean(post.generated_by_ai, false),
        published: parseBoolean(post.published, true),
        createdAt: parseRequiredDate(post.createdAt),
        updatedAt: parseRequiredDate(post.updatedAt),
      },
      create: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        markdown_content: post.markdown_content,
        category: post.category ?? "General",
        image_url: post.image_url ?? null,
        source_link: post.source_link ?? null,
        generated_by_ai: parseBoolean(post.generated_by_ai, false),
        published: parseBoolean(post.published, true),
        createdAt: parseRequiredDate(post.createdAt),
        updatedAt: parseRequiredDate(post.updatedAt),
      },
    });
  }
  console.log(`  ✓ Blog Posts seeded successfully.`);

  // 5. Seed Jobs
  const jobs = tables.Job || [];
  console.log(`💼 Seeding ${jobs.length} Jobs...`);
  for (const j of jobs) {
    await prisma.job.upsert({
      where: { applyUrl: j.applyUrl },
      update: {
        title: j.title,
        company: j.company,
        city: j.city ?? "Germany",
        category: j.category ?? "General",
        jobType: j.jobType ?? "Full-time",
        languageReq: j.languageReq ?? "B1/B2",
        salary: j.salary ?? null,
        descriptionRaw: j.descriptionRaw ?? null,
        publishedAt: parseRequiredDate(j.publishedAt),
        createdAt: parseRequiredDate(j.createdAt),
        updatedAt: parseRequiredDate(j.updatedAt),
      },
      create: {
        id: j.id,
        title: j.title,
        company: j.company,
        city: j.city ?? "Germany",
        category: j.category ?? "General",
        jobType: j.jobType ?? "Full-time",
        languageReq: j.languageReq ?? "B1/B2",
        salary: j.salary ?? null,
        applyUrl: j.applyUrl,
        descriptionRaw: j.descriptionRaw ?? null,
        publishedAt: parseRequiredDate(j.publishedAt),
        createdAt: parseRequiredDate(j.createdAt),
        updatedAt: parseRequiredDate(j.updatedAt),
      },
    });
  }
  console.log(`  ✓ Jobs seeded successfully.`);

  // 6. Seed CVs
  const cvs = tables.Cv || [];
  console.log(`📄 Seeding ${cvs.length} CVs...`);
  for (const cv of cvs) {
    await prisma.cv.upsert({
      where: { id: cv.id },
      update: {
        userId: cv.userId,
        title: cv.title ?? "Lebenslauf",
        language: cv.language ?? "de",
        isDraft: parseBoolean(cv.isDraft, true),
        createdAt: parseRequiredDate(cv.createdAt),
        updatedAt: parseRequiredDate(cv.updatedAt),
      },
      create: {
        id: cv.id,
        userId: cv.userId,
        title: cv.title ?? "Lebenslauf",
        language: cv.language ?? "de",
        isDraft: parseBoolean(cv.isDraft, true),
        createdAt: parseRequiredDate(cv.createdAt),
        updatedAt: parseRequiredDate(cv.updatedAt),
      },
    });
  }
  console.log(`  ✓ CVs seeded successfully.`);

  // 7. Seed CV Personal Info
  const personalInfos = tables.CvPersonalInfo || [];
  console.log(`📋 Seeding ${personalInfos.length} CV Personal Info records...`);
  for (const info of personalInfos) {
    await prisma.cvPersonalInfo.upsert({
      where: { cvId: info.cvId },
      update: {
        fullName: info.fullName,
        email: info.email,
        phone: info.phone ?? null,
        address: info.address ?? null,
        photoUrl: info.photoUrl ?? null,
        birthDate: parseDate(info.birthDate),
        birthPlace: info.birthPlace ?? null,
        nationality: info.nationality ?? null,
        targetJobTitle: info.targetJobTitle ?? null,
        linkedinUrl: info.linkedinUrl ?? null,
        xingUrl: info.xingUrl ?? null,
        summary: info.summary ?? null,
      },
      create: {
        id: info.id,
        cvId: info.cvId,
        fullName: info.fullName,
        email: info.email,
        phone: info.phone ?? null,
        address: info.address ?? null,
        photoUrl: info.photoUrl ?? null,
        birthDate: parseDate(info.birthDate),
        birthPlace: info.birthPlace ?? null,
        nationality: info.nationality ?? null,
        targetJobTitle: info.targetJobTitle ?? null,
        linkedinUrl: info.linkedinUrl ?? null,
        xingUrl: info.xingUrl ?? null,
        summary: info.summary ?? null,
      },
    });
  }
  console.log(`  ✓ CV Personal Info records seeded successfully.`);

  // 8. Seed CV Experiences
  const experiences = tables.CvExperience || [];
  console.log(`🏢 Seeding ${experiences.length} CV Experiences...`);
  for (const exp of experiences) {
    await prisma.cvExperience.upsert({
      where: { id: exp.id },
      update: {
        cvId: exp.cvId,
        company: exp.company,
        position: exp.position,
        city: exp.city ?? null,
        country: exp.country ?? "Germany",
        startDate: parseRequiredDate(exp.startDate),
        endDate: parseDate(exp.endDate),
        isCurrent: parseBoolean(exp.isCurrent, false),
        description: exp.description ?? null,
        order: Number(exp.order ?? 0),
      },
      create: {
        id: exp.id,
        cvId: exp.cvId,
        company: exp.company,
        position: exp.position,
        city: exp.city ?? null,
        country: exp.country ?? "Germany",
        startDate: parseRequiredDate(exp.startDate),
        endDate: parseDate(exp.endDate),
        isCurrent: parseBoolean(exp.isCurrent, false),
        description: exp.description ?? null,
        order: Number(exp.order ?? 0),
      },
    });
  }
  console.log(`  ✓ CV Experiences seeded successfully.`);

  // 9. Seed CV Educations
  const educations = tables.CvEducation || [];
  console.log(`🎓 Seeding ${educations.length} CV Educations...`);
  for (const edu of educations) {
    await prisma.cvEducation.upsert({
      where: { id: edu.id },
      update: {
        cvId: edu.cvId,
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy ?? null,
        city: edu.city ?? null,
        country: edu.country ?? null,
        startDate: parseRequiredDate(edu.startDate),
        endDate: parseDate(edu.endDate),
        isCurrent: parseBoolean(edu.isCurrent, false),
        grade: edu.grade ?? null,
        description: edu.description ?? null,
        order: Number(edu.order ?? 0),
      },
      create: {
        id: edu.id,
        cvId: edu.cvId,
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy ?? null,
        city: edu.city ?? null,
        country: edu.country ?? null,
        startDate: parseRequiredDate(edu.startDate),
        endDate: parseDate(edu.endDate),
        isCurrent: parseBoolean(edu.isCurrent, false),
        grade: edu.grade ?? null,
        description: edu.description ?? null,
        order: Number(edu.order ?? 0),
      },
    });
  }
  console.log(`  ✓ CV Educations seeded successfully.`);

  // 10. Seed CV Skills
  const skills = tables.CvSkill || [];
  console.log(`💡 Seeding ${skills.length} CV Skills...`);
  for (const sk of skills) {
    await prisma.cvSkill.upsert({
      where: { id: sk.id },
      update: {
        cvId: sk.cvId,
        name: sk.name,
        category: sk.category ?? null,
        level: sk.level ?? null,
        order: Number(sk.order ?? 0),
      },
      create: {
        id: sk.id,
        cvId: sk.cvId,
        name: sk.name,
        category: sk.category ?? null,
        level: sk.level ?? null,
        order: Number(sk.order ?? 0),
      },
    });
  }
  console.log(`  ✓ CV Skills seeded successfully.`);

  // 11. Seed CV Languages
  const languages = tables.CvLanguage || [];
  console.log(`🗣️ Seeding ${languages.length} CV Languages...`);
  for (const lang of languages) {
    await prisma.cvLanguage.upsert({
      where: { id: lang.id },
      update: {
        cvId: lang.cvId,
        language: lang.language,
        proficiency: lang.proficiency,
        order: Number(lang.order ?? 0),
      },
      create: {
        id: lang.id,
        cvId: lang.cvId,
        language: lang.language,
        proficiency: lang.proficiency,
        order: Number(lang.order ?? 0),
      },
    });
  }
  console.log(`  ✓ CV Languages seeded successfully.`);

  // 12. Seed CV Certifications
  const certifications = tables.CvCertification || [];
  console.log(`📜 Seeding ${certifications.length} CV Certifications...`);
  for (const cert of certifications) {
    await prisma.cvCertification.upsert({
      where: { id: cert.id },
      update: {
        cvId: cert.cvId,
        name: cert.name,
        issuer: cert.issuer,
        issueDate: parseDate(cert.issueDate),
        expiryDate: parseDate(cert.expiryDate),
        credentialUrl: cert.credentialUrl ?? null,
        order: Number(cert.order ?? 0),
      },
      create: {
        id: cert.id,
        cvId: cert.cvId,
        name: cert.name,
        issuer: cert.issuer,
        issueDate: parseDate(cert.issueDate),
        expiryDate: parseDate(cert.expiryDate),
        credentialUrl: cert.credentialUrl ?? null,
        order: Number(cert.order ?? 0),
      },
    });
  }
  console.log(`  ✓ CV Certifications seeded successfully.`);

  // 13. Seed CV Projects
  const projects = tables.CvProject || [];
  console.log(`💻 Seeding ${projects.length} CV Projects...`);
  for (const proj of projects) {
    await prisma.cvProject.upsert({
      where: { id: proj.id },
      update: {
        cvId: proj.cvId,
        title: proj.title,
        role: proj.role ?? null,
        url: proj.url ?? null,
        description: proj.description ?? null,
        order: Number(proj.order ?? 0),
      },
      create: {
        id: proj.id,
        cvId: proj.cvId,
        title: proj.title,
        role: proj.role ?? null,
        url: proj.url ?? null,
        description: proj.description ?? null,
        order: Number(proj.order ?? 0),
      },
    });
  }
  console.log(`  ✓ CV Projects seeded successfully.`);

  // 14. Seed Cover Letters
  const coverLetters = tables.CoverLetter || [];
  console.log(`✉️ Seeding ${coverLetters.length} Cover Letters...`);
  for (const cl of coverLetters) {
    await prisma.coverLetter.upsert({
      where: { id: cl.id },
      update: {
        userId: cl.userId,
        cvId: cl.cvId ?? null,
        title: cl.title ?? "Anschreiben",
        jobTitle: cl.jobTitle,
        companyName: cl.companyName,
        recipientName: cl.recipientName ?? null,
        jobDescriptionRaw: cl.jobDescriptionRaw ?? null,
        language: cl.language ?? "de",
        tone: cl.tone ?? "professional",
        generatedContent: cl.generatedContent,
        createdAt: parseRequiredDate(cl.createdAt),
        updatedAt: parseRequiredDate(cl.updatedAt),
      },
      create: {
        id: cl.id,
        userId: cl.userId,
        cvId: cl.cvId ?? null,
        title: cl.title ?? "Anschreiben",
        jobTitle: cl.jobTitle,
        companyName: cl.companyName,
        recipientName: cl.recipientName ?? null,
        jobDescriptionRaw: cl.jobDescriptionRaw ?? null,
        language: cl.language ?? "de",
        tone: cl.tone ?? "professional",
        generatedContent: cl.generatedContent,
        createdAt: parseRequiredDate(cl.createdAt),
        updatedAt: parseRequiredDate(cl.updatedAt),
      },
    });
  }
  console.log(`  ✓ Cover Letters seeded successfully.`);

  // 15. Seed Support Tickets
  const supportTickets = tables.SupportTicket || [];
  console.log(`🎫 Seeding ${supportTickets.length} Support Tickets...`);
  for (const ticket of supportTickets) {
    await prisma.supportTicket.upsert({
      where: { id: ticket.id },
      update: {
        name: ticket.name,
        email: ticket.email,
        category: ticket.category ?? "General",
        subject: ticket.subject,
        message: ticket.message,
        status: ticket.status ?? "PENDING",
        createdAt: parseRequiredDate(ticket.createdAt),
      },
      create: {
        id: ticket.id,
        name: ticket.name,
        email: ticket.email,
        category: ticket.category ?? "General",
        subject: ticket.subject,
        message: ticket.message,
        status: ticket.status ?? "PENDING",
        createdAt: parseRequiredDate(ticket.createdAt),
      },
    });
  }
  console.log(`  ✓ Support Tickets seeded successfully.`);

  // 16. Verification Counts
  console.log("\n📊 Verifying final row counts in Neon PostgreSQL:");
  const [
    userCount,
    sessionCount,
    postCount,
    jobCount,
    promoCount,
    cvCount,
    coverLetterCount,
    supportTicketCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.userSession.count(),
    prisma.post.count(),
    prisma.job.count(),
    prisma.promoCode.count(),
    prisma.cv.count(),
    prisma.coverLetter.count(),
    prisma.supportTicket.count(),
  ]);

  console.table({
    User: { expected: users.length, actual: userCount },
    UserSession: { expected: sessions.length, actual: sessionCount },
    Post: { expected: posts.length, actual: postCount },
    Job: { expected: jobs.length, actual: jobCount },
    PromoCode: { expected: promoCodes.length, actual: promoCount },
    Cv: { expected: cvs.length, actual: cvCount },
    CoverLetter: { expected: coverLetters.length, actual: coverLetterCount },
    SupportTicket: { expected: supportTickets.length, actual: supportTicketCount },
  });

  console.log("\n🎉 Migration & Seeding completed successfully!");
}

migrate()
  .catch((err) => {
    console.error("\n❌ Migration failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
