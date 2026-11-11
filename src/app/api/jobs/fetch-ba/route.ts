import { NextRequest, NextResponse } from "next/server";
import { verifyAutomationSecret, requireAdmin } from "@/lib/admin-auth";
import { isValidHrEmail, isExcludedJob } from "@/lib/jobUtils";
import { sanitizeJobPayload } from "@/lib/jobSanitizer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function isAuthorized(request: NextRequest): Promise<boolean> {
  if (verifyAutomationSecret(request)) return true;
  const admin = await requireAdmin(request);
  return Boolean(admin);
}

interface ExtractedVerifiedInfo {
  contactEmail: string | null;
  directAtsUrl: string | null;
}

const IGNORED_EMAIL_PATTERNS = [
  "arbeitnow",
  "arbeitsagentur",
  "example.com",
  "datenschutz",
  "privacy",
  "gdpr",
  "sentry",
  "noreply",
  "no-reply",
  ".png",
  ".jpg",
  ".svg",
  ".jpeg",
  ".gif",
  ".webp",
];

const ATS_DOMAIN_PATTERNS = [
  "personio",
  "softgarden",
  "workday",
  "greenhouse.io",
  "lever.co",
  "recruitee",
  "join.com",
  "smartrecruiters",
  "karriere.",
  "jobs.",
];

/**
 * Scans employer text/HTML for genuine HR application emails and direct ATS form URLs.
 * Strict zero-fabrication: if no real email exists in the text, returns contactEmail: null.
 * NEVER invents, guesses, or extrapolates contactEmail from company name or website domain!
 */
function extractVerifiedEmailAndForm(rawHtmlOrText: string): ExtractedVerifiedInfo {
  if (!rawHtmlOrText || typeof rawHtmlOrText !== "string") {
    return { contactEmail: null, directAtsUrl: null };
  }

  // 1. Scan exclusively for genuine HR / employer application emails literally present in text
  let contactEmail: string | null = null;
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const emailMatches = rawHtmlOrText.match(emailRegex) || [];

  for (const rawEmail of emailMatches) {
    const lowerEmail = rawEmail.toLowerCase().trim();
    const isIgnored = IGNORED_EMAIL_PATTERNS.some((pat) => lowerEmail.includes(pat));
    if (!isIgnored && isValidHrEmail(lowerEmail)) {
      contactEmail = lowerEmail;
      break;
    }
  }

  // 2. Scan for direct employer ATS / application form URLs
  let directAtsUrl: string | null = null;
  const urlRegex = /(https?:\/\/[^\s"'<>,]+)/gi;
  const urlMatches = rawHtmlOrText.match(urlRegex) || [];

  for (const rawUrl of urlMatches) {
    const cleaned = rawUrl.replace(/[),;.]+$/, "").trim();
    const lowerUrl = cleaned.toLowerCase();

    // Ignore job board hosts themselves
    if (lowerUrl.includes("arbeitnow.com") || lowerUrl.includes("arbeitsagentur.de")) {
      continue;
    }

    const matchesAts = ATS_DOMAIN_PATTERNS.some((pat) => lowerUrl.includes(pat));
    if (matchesAts) {
      directAtsUrl = cleaned;
      break;
    }
  }

  return { contactEmail, directAtsUrl };
}

export async function GET(request: NextRequest) {
  // 1. التحقق من صلاحيات المدير أو مفتاح الأتمتة لحماية المسار
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() || "";
  const angebotsart = searchParams.get("angebotsart")?.trim() || "1";
  const size = Math.max(1, parseInt(searchParams.get("size") || "25", 10));

  try {
    // 2. المحاولة أولاً لجلب الوظائف الحقيقية من API وكالة العمل الألمانية الرسمية (Bundesagentur für Arbeit)
    try {
      const baUrl = `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?was=${encodeURIComponent(
        query || "Ausbildung"
      )}&size=${size}&angebotsart=${angebotsart}`;

      const baRes = await fetch(baUrl, {
        headers: {
          "X-API-Key": "jobboerse-jobsuche",
          Accept: "application/json",
          "User-Agent": "GermanJobsPro-Bot/1.0",
        },
        cache: "no-store",
      });

      if (baRes.ok) {
        const baData = await baRes.json().catch(() => null);
        if (baData && Array.isArray(baData.stellenangebote) && baData.stellenangebote.length > 0) {
          const baJobs = baData.stellenangebote.map((j: any) => {
            const referenznummer = j.refnr || "";
            const titel = j.titel || j.beruf || "Stellenangebot";
            const arbeitgeber = j.arbeitgeber || "Arbeitgeber in Deutschland";
            const arbeitsort = j.arbeitsort;
            const externeUrl = j.externeUrl || null;
            const applyUrl = referenznummer
              ? `https://www.arbeitsagentur.de/jobsuche/jobdetail/${referenznummer}`
              : externeUrl || "";

            const cityStr =
              typeof arbeitsort === "object" && arbeitsort !== null
                ? [arbeitsort.ort, arbeitsort.region, arbeitsort.land].filter(Boolean).join(", ") || "Deutschland"
                : typeof arbeitsort === "string" && arbeitsort.trim()
                ? arbeitsort
                : "Deutschland";

            return {
              id: referenznummer || String(Math.floor(Math.random() * 1000000)),
              referenznummer,
              titel,
              title: titel,
              arbeitgeber,
              company: arbeitgeber,
              arbeitsort,
              city: cityStr,
              externeUrl,
              contactEmail: null,
              applyUrl,
              description: j.beruf || titel,
              source: "Bundesagentur für Arbeit",
            };
          });

          const validBaJobs = baJobs.filter((j: any) => !isExcludedJob(j));

          let savedCount = 0;
          for (const j of validBaJobs.slice(0, size)) {
            if (!j.applyUrl || isExcludedJob(j)) continue;
            try {
              const sanitized = sanitizeJobPayload({
                title: j.title,
                category: "Ausbildung",
                salary: null,
                descriptionRaw: j.description,
                applyUrl: j.applyUrl,
                contactEmail: j.contactEmail,
              });

              await prisma.job.upsert({
                where: { applyUrl: j.applyUrl },
                update: {
                  title: sanitized.title,
                  category: sanitized.category || "Ausbildung",
                  salary: sanitized.salary || null,
                  company: j.company,
                  city: j.city,
                  status: "ACTIVE",
                },
                create: {
                  title: sanitized.title,
                  company: j.company,
                  city: j.city,
                  category: sanitized.category || "Ausbildung",
                  salary: sanitized.salary || null,
                  jobType: "Vollzeit",
                  languageReq: "B1/B2",
                  applyUrl: j.applyUrl,
                  contactEmail: j.contactEmail,
                  descriptionRaw: j.description,
                  status: "ACTIVE",
                  isVerified: true,
                },
              });
              savedCount++;
            } catch {
              // skip duplicate/error
            }
          }

          return NextResponse.json({
            success: true,
            total: validBaJobs.length,
            savedCount,
            source: "Bundesagentur für Arbeit",
            message: `تم جلب ${validBaJobs.length} وظيفة من وكالة العمل الألمانية (BA) وتحديث ${savedCount} وظيفة نشطة في قاعدة البيانات.`,
            jobs: validBaJobs.slice(0, size),
          });
        }
      }
    } catch (baErr) {
      console.warn("[fetch-ba] Bundesagentur für Arbeit API call failed, falling back to ArbeitNow:", baErr);
    }

    // 3. Fallback to ArbeitNow ONLY if BA API fails or returns 0 jobs
    const anRes = await fetch("https://www.arbeitnow.com/api/job-board-api", {
      headers: {
        "User-Agent": "GermanJobsPro-Bot/1.0",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!anRes.ok) {
      return NextResponse.json(
        { error: `Upstream service error: ${anRes.status}`, jobs: [] },
        { status: 502 }
      );
    }

    const anData = await anRes.json();
    const allJobs = anData.data || [];

    const healthcareKeywords = [
      "pflege",
      "kranken",
      "medizin",
      "arzt",
      "ärzt",
      "nurse",
      "gesundheit",
      "therap",
      "klinik",
      "hebamme",
      "altenpflege",
      "krankenpflege",
    ];

    const qLower = query.toLowerCase();
    const isHealthcareQuery = healthcareKeywords.some((term) => qLower.includes(term));

    let matchedJobs: any[] = [];

    if (isHealthcareQuery) {
      // Filter ArbeitNow jobs strictly by checking the job TITLE against healthcare keywords
      // (do NOT fallback to training/IT jobs when a healthcare query is requested!)
      matchedJobs = allJobs.filter((j: any) => {
        const titleLower = (j.title || "").toLowerCase();
        return healthcareKeywords.some((kw) => titleLower.includes(kw));
      });
    } else {
      // 2. فرز وأولوية لفرص التكوين والتدريب العملي والبدايات المهنية في ألمانيا
      const trainingKeywords = [
        "ausbildung",
        "azubi",
        "trainee",
        "praktikum",
        "praktikant",
        "werkstudent",
        "junior",
        "entry",
        "duales",
        "berufseinstieg",
      ];

      matchedJobs = allJobs.filter((j: any) => {
        const fullText = `${j.title || ""} ${j.description || ""}`.toLowerCase();
        return trainingKeywords.some((kw) => fullText.includes(kw));
      });

      // في حال عدم توفر إعلانات تدريب بحرفيتها في هذه اللحظة، جلب أحدث الوظائف المؤكدة لضمان استمرار الأتمتة
      if (matchedJobs.length === 0) {
        matchedJobs = allJobs;
      }
    }

    const formattedJobs = matchedJobs.map((j: any) => {
      const rawDesc = j.description || "";
      const cleanDesc = rawDesc.replace(/<[^>]*>?/gm, " ").trim();
      const { contactEmail, directAtsUrl } = extractVerifiedEmailAndForm(rawDesc);

      return {
        id: j.slug || String(Math.floor(Math.random() * 1000000)),
        referenznummer: j.slug || null,
        titel: j.title || "فرصة مهنية في ألمانيا",
        title: j.title || "فرصة مهنية في ألمانيا",
        arbeitgeber: j.company_name || "German Employer",
        company: j.company_name || "German Employer",
        arbeitsort: j.location || "Deutschland",
        city: j.location || "Deutschland",
        externeUrl: j.url || null,
        contactEmail: contactEmail || null,
        applyUrl: directAtsUrl || j.url,
        description: cleanDesc.substring(0, 4000),
        source: "Verified German Employer Network",
      };
    });

    const validFormattedJobs = formattedJobs.filter((j: any) => !isExcludedJob(j));

    let savedCount = 0;
    for (const j of validFormattedJobs.slice(0, size)) {
      if (!j.applyUrl || isExcludedJob(j)) continue;
      try {
        const sanitized = sanitizeJobPayload({
          title: j.title,
          category: "General",
          salary: null,
          descriptionRaw: j.description,
          applyUrl: j.applyUrl,
          contactEmail: j.contactEmail,
        });

        await prisma.job.upsert({
          where: { applyUrl: j.applyUrl },
          update: {
            title: sanitized.title,
            category: sanitized.category || "General",
            salary: sanitized.salary || null,
            company: j.company,
            city: j.city,
            status: "ACTIVE",
          },
          create: {
            title: sanitized.title,
            company: j.company,
            city: j.city,
            category: sanitized.category || "General",
            salary: sanitized.salary || null,
            jobType: "Vollzeit",
            languageReq: "B1/B2",
            applyUrl: j.applyUrl,
            contactEmail: j.contactEmail,
            descriptionRaw: j.description,
            status: "ACTIVE",
            isVerified: true,
          },
        });
        savedCount++;
      } catch {
        // skip duplicate/error
      }
    }

    return NextResponse.json({
      success: true,
      total: validFormattedJobs.length,
      savedCount,
      source: "ArbeitNow Network",
      message: `تم جلب ${validFormattedJobs.length} وظيفة وتحديث ${savedCount} وظيفة نشطة في قاعدة البيانات.`,
      jobs: validFormattedJobs.slice(0, size),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message, jobs: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
