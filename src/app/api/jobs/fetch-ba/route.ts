import { NextRequest, NextResponse } from "next/server";
import { verifyAutomationSecret } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

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
 */
function extractVerifiedEmailAndForm(rawHtmlOrText: string): ExtractedVerifiedInfo {
  if (!rawHtmlOrText || typeof rawHtmlOrText !== "string") {
    return { contactEmail: null, directAtsUrl: null };
  }

  // 1. Scan exclusively for genuine HR / employer application emails
  let contactEmail: string | null = null;
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const emailMatches = rawHtmlOrText.match(emailRegex) || [];

  for (const rawEmail of emailMatches) {
    const lowerEmail = rawEmail.toLowerCase().trim();
    const isIgnored = IGNORED_EMAIL_PATTERNS.some((pat) => lowerEmail.includes(pat));
    if (!isIgnored) {
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
  // 1. التحقق من مفتاح الأمان لحماية المسار
  if (!verifyAutomationSecret(request)) {
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

          return NextResponse.json({
            success: true,
            total: baJobs.length,
            source: "Bundesagentur für Arbeit",
            jobs: baJobs.slice(0, size),
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

    return NextResponse.json({
      success: true,
      total: formattedJobs.length,
      source: "ArbeitNow Network",
      jobs: formattedJobs.slice(0, size),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message, jobs: [] }, { status: 500 });
  }
}
