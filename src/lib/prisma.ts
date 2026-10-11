import "dotenv/config";
import { Pool as PgPool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../generated/prisma/client";

// Ensure WebSocket constructor is available in Node.js runtime for Neon
neonConfig.webSocketConstructor = ws;

export type ExtendedPrismaClient = PrismaClient & {
  cV: {
    create: (args: { data: any }) => Promise<any>;
  };
};

const globalForPrisma = globalThis as unknown as {
  prisma?: ExtendedPrismaClient;
};

/**
 * Native PostgreSQL TCP client over port 5432 using @prisma/adapter-pg.
 * Eliminates WebSocket handshake timeouts (ETIMEDOUT) while fulfilling engineType="client".
 */
function parseDateFlexible(val?: string | null): Date {
  if (!val || typeof val !== "string") return new Date();
  const s = val.trim();
  if (s.toLowerCase().includes("heute") || s.toLowerCase().includes("present")) return new Date();
  const dmy = s.match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})$/);
  if (dmy) {
    return new Date(Date.UTC(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10)));
  }
  const my = s.match(/^(\d{1,2})[./\-](\d{4})$/);
  if (my) {
    return new Date(Date.UTC(parseInt(my[2], 10), parseInt(my[1], 10) - 1, 1));
  }
  const y = s.match(/^(\d{4})$/);
  if (y) {
    return new Date(Date.UTC(parseInt(y[1], 10), 0, 1));
  }
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getPrismaClient(): ExtendedPrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL or DIRECT_URL in environment configuration.");
  }

  const isNeon = connectionString.includes("neon.tech");

  const adapter = isNeon
    ? new PrismaNeon({ connectionString })
    : new PrismaPg(
        new PgPool({
          connectionString,
          ssl: {
            rejectUnauthorized: false,
          },
          connectionTimeoutMillis: 30000,
          idleTimeoutMillis: 30000,
          max: 10,
        })
      );

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  }) as ExtendedPrismaClient;

  // Compatibility delegate for cV (used by auto-fix)
  client.cV = {
    create: async (args: { data: any }) => {
      const data = args?.data || {};
      let validatedCvData: any = null;
      if (data.content) {
        try {
          validatedCvData = typeof data.content === "string" ? JSON.parse(data.content) : data.content;
        } catch {
          validatedCvData = null;
        }
      }

      const pInfo = validatedCvData?.personalInfo;
      const experiences = validatedCvData?.experiences || [];
      const education = validatedCvData?.education || [];
      const skills = validatedCvData?.skills || [];
      const languages = validatedCvData?.languages || [];
      const certs = validatedCvData?.coursesAndCertifications || [];

      return client.cv.create({
        data: {
          userId: data.userId,
          title: data.title || (pInfo?.fullName ? `${pInfo.fullName} (DIN 5008 Optimized)` : "Lebenslauf"),
          language: data.language || "de",
          isDraft: false,
          ...(pInfo
            ? {
                personalInfo: {
                  create: {
                    fullName: pInfo.fullName || "",
                    email: pInfo.email || "",
                    phone: pInfo.phone || null,
                    address: pInfo.address || null,
                    targetJobTitle: pInfo.title || null,
                    birthDate: pInfo.dateOfBirth ? parseDateFlexible(pInfo.dateOfBirth) : null,
                    birthPlace: pInfo.placeOfBirth || null,
                    summary: pInfo.summary || null,
                  },
                },
              }
            : {}),
          ...(experiences.length > 0
            ? {
                experiences: {
                  create: experiences.map((exp: any, idx: number) => ({
                    position: exp.title || "Position",
                    company: exp.organization || "Unternehmen",
                    city: exp.location || null,
                    country: "Deutschland",
                    startDate: parseDateFlexible(exp.startDate),
                    endDate: exp.endDate && !exp.endDate.toLowerCase().includes("heute") ? parseDateFlexible(exp.endDate) : null,
                    isCurrent: !exp.endDate || exp.endDate.toLowerCase().includes("heute"),
                    description: Array.isArray(exp.bullets) ? exp.bullets.join("\n") : (exp.bullets || null),
                    order: idx,
                  })),
                },
              }
            : {}),
          ...(education.length > 0
            ? {
                educations: {
                  create: education.map((edu: any, idx: number) => ({
                    degree: edu.degree || "Abschluss",
                    institution: edu.institution || "Institution",
                    city: edu.location || null,
                    country: "Deutschland",
                    startDate: parseDateFlexible(edu.startDate),
                    endDate: edu.endDate && !edu.endDate.toLowerCase().includes("heute") ? parseDateFlexible(edu.endDate) : null,
                    isCurrent: !edu.endDate || edu.endDate.toLowerCase().includes("heute"),
                    order: idx,
                  })),
                },
              }
            : {}),
          ...(skills.length > 0
            ? {
                skills: {
                  create: skills.map((sk: any, idx: number) => ({
                    name: typeof sk === "string" ? sk : (sk.name || ""),
                    level: "Fortgeschritten",
                    order: idx,
                  })),
                },
              }
            : {}),
          ...(languages.length > 0
            ? {
                languages: {
                  create: languages.map((lang: any, idx: number) => ({
                    language: lang.language || "Deutsch",
                    proficiency: lang.level || "Fließend",
                    order: idx,
                  })),
                },
              }
            : {}),
          ...(certs.length > 0
            ? {
                certifications: {
                  create: certs.map((cert: any, idx: number) => ({
                    name: cert.title || "Zertifikat",
                    issuer: cert.provider || "Aussteller",
                    issueDate: cert.startDate ? parseDateFlexible(cert.startDate) : null,
                    order: idx,
                  })),
                },
              }
            : {}),
        },
      });
    },
  };

  globalForPrisma.prisma = client;
  return client;
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

