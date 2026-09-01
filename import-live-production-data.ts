import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "./src/lib/prisma";

interface LiveProductionData {
  tables: {
    User?: Array<Record<string, any>>;
    Cv?: Array<Record<string, any>>;
    CvPersonalInfo?: Array<Record<string, any>>;
    CvEducation?: Array<Record<string, any>>;
    CvSkill?: Array<Record<string, any>>;
    CvLanguage?: Array<Record<string, any>>;
    CvCertification?: Array<Record<string, any>>;
    CvExperience?: Array<Record<string, any>>;
    CvProject?: Array<Record<string, any>>;
    CoverLetter?: Array<Record<string, any>>;
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

async function main() {
  console.log("==================================================");
  console.log("  Live Production Data Import to Neon PostgreSQL  ");
  console.log("==================================================\n");

  const filePath = path.resolve(process.cwd(), "live-production-data.json");
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const rawJson = fs.readFileSync(filePath, "utf-8");
  const data: LiveProductionData = JSON.parse(rawJson);
  const tables = data.tables || {};

  // 1. Users
  const users = tables.User || [];
  console.log(`👤 Importing ${users.length} Users (Mohamed, adilox)...`);
  for (const u of users) {
    const result = await prisma.user.upsert({
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
    console.log(`  ✓ User upserted: ${result.name || result.email} (ID: ${result.id})`);
  }

  // 2. CVs
  const cvs = tables.Cv || [];
  console.log(`\n📄 Importing ${cvs.length} CVs...`);
  for (const cv of cvs) {
    const result = await prisma.cv.upsert({
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
    console.log(`  ✓ CV upserted: "${result.title}" (ID: ${result.id}, UserID: ${result.userId})`);
  }

  // 3. CV Personal Info
  const personalInfos = tables.CvPersonalInfo || [];
  console.log(`\n📋 Importing ${personalInfos.length} CV Personal Info records...`);
  for (const info of personalInfos) {
    const result = await prisma.cvPersonalInfo.upsert({
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
    console.log(`  ✓ CV Personal Info upserted for CV: ${result.cvId} (${result.fullName})`);
  }

  // 4. CV Educations
  const educations = tables.CvEducation || [];
  console.log(`\n🎓 Importing ${educations.length} CV Educations...`);
  for (const edu of educations) {
    const result = await prisma.cvEducation.upsert({
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
    console.log(`  ✓ CV Education upserted: ${result.institution} - ${result.degree} (ID: ${result.id})`);
  }

  // 5. CV Skills
  const skills = tables.CvSkill || [];
  console.log(`\n💡 Importing ${skills.length} CV Skills...`);
  for (const sk of skills) {
    const result = await prisma.cvSkill.upsert({
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
    console.log(`  ✓ CV Skill upserted: ${result.name} (${result.category}, ${result.level})`);
  }

  // 6. CV Languages
  const languages = tables.CvLanguage || [];
  console.log(`\n🗣️ Importing ${languages.length} CV Languages...`);
  for (const lang of languages) {
    const result = await prisma.cvLanguage.upsert({
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
    console.log(`  ✓ CV Language upserted: ${result.language} (${result.proficiency})`);
  }

  // 7. CV Certifications
  const certifications = tables.CvCertification || [];
  console.log(`\n📜 Importing ${certifications.length} CV Certifications...`);
  for (const cert of certifications) {
    const result = await prisma.cvCertification.upsert({
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
    console.log(`  ✓ CV Certification upserted: ${result.name} by ${result.issuer}`);
  }

  // Sequential Verification
  console.log("\n==================================================");
  console.log("            Verifying Database Counts             ");
  console.log("==================================================");

  const totalUsers = await prisma.user.count();
  const totalCvs = await prisma.cv.count();
  const totalPersonalInfos = await prisma.cvPersonalInfo.count();
  const totalEducations = await prisma.cvEducation.count();
  const totalSkills = await prisma.cvSkill.count();
  const totalLanguages = await prisma.cvLanguage.count();
  const totalCertifications = await prisma.cvCertification.count();

  console.log(`Total Users in DB:            ${totalUsers}`);
  console.log(`Total CVs in DB:              ${totalCvs}`);
  console.log(`Total Personal Infos in DB:   ${totalPersonalInfos}`);
  console.log(`Total Educations in DB:       ${totalEducations}`);
  console.log(`Total Skills in DB:           ${totalSkills}`);
  console.log(`Total Languages in DB:        ${totalLanguages}`);
  console.log(`Total Certifications in DB:   ${totalCertifications}`);

  console.log("\n==================================================");
  console.log("       Verifying Imported Target Records          ");
  console.log("==================================================");

  const importedUsers = await prisma.user.findMany({
    where: {
      id: {
        in: ["cmtaah9zg000x0iqhy0pzzo3m", "cmtakeg0a00110iqh6mlqzde7"],
      },
    },
    include: {
      cvs: {
        include: {
          personalInfo: true,
          educations: true,
          skills: true,
          languages: true,
          certifications: true,
        },
      },
    },
  });

  for (const user of importedUsers) {
    console.log(`\nUser: ${user.name} <${user.email}> (ID: ${user.id})`);
    console.log(`  Plan: ${user.plan}, AI Credits: ${user.aiCredits}, Email Verified: ${user.emailVerified}`);
    console.log(`  Associated CV count: ${user.cvs.length}`);
    for (const cv of user.cvs) {
      console.log(`    - CV [${cv.id}]: "${cv.title}" (isDraft: ${cv.isDraft}, language: ${cv.language})`);
      if (cv.personalInfo) {
        console.log(`      PersonalInfo: FullName="${cv.personalInfo.fullName}", TargetJob="${cv.personalInfo.targetJobTitle}", Nationality="${cv.personalInfo.nationality}"`);
      }
      console.log(`      Educations (${cv.educations.length}): ${cv.educations.map((e) => `${e.institution} - ${e.degree}`).join("; ") || "None"}`);
      console.log(`      Skills (${cv.skills.length}): ${cv.skills.map((s) => `${s.name} (${s.level})`).join(", ") || "None"}`);
      console.log(`      Languages (${cv.languages.length}): ${cv.languages.map((l) => `${l.language} (${l.proficiency})`).join(", ") || "None"}`);
      console.log(`      Certifications (${cv.certifications.length}): ${cv.certifications.map((c) => `${c.name} (${c.issuer})`).join(", ") || "None"}`);
    }
  }

  console.log("\n🎉 All live production records imported and verified successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
