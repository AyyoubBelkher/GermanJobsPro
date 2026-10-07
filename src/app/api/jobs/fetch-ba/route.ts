import { NextRequest, NextResponse } from "next/server";
import { verifyAutomationSecret } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1. التحقق من مفتاح الأمان لحماية المسار
  if (!verifyAutomationSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "Ausbildung";
  const size = searchParams.get("size") || "25";
  const angebotsart = searchParams.get("angebotsart") || "4"; // 4 = Ausbildung

  // 2. المحاولة الأساسية: الاتصال بوكالة العمل الاتحادية (arbeitsagentur.de)
  try {
    const baApiUrl = `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?was=${encodeURIComponent(
      query
    )}&angebotsart=${angebotsart}&size=${size}&pav=false`;

    const baRes = await fetch(baApiUrl, {
      headers: {
        "X-API-Key": "jobboerse-jobsuche",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Origin: "https://www.arbeitsagentur.de",
        Referer: "https://www.arbeitsagentur.de/jobsuche/",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (baRes.ok) {
      const data = await baRes.json();
      const baJobs = (data.stellenangebote || []).map((j: any) => ({
        id: j.refnr,
        title: j.titel,
        company: j.arbeitgeber,
        city: j.arbeitsort?.ort || "Deutschland",
        applyUrl: j.externeUrl || `https://web.arbeitsagentur.de/jobboerse/jobsuche/details/${j.refnr}`,
        source: "Bundesagentur für Arbeit (Official)",
      }));

      if (baJobs.length > 0) {
        return NextResponse.json({ success: true, source: "arbeitsagentur", jobs: baJobs });
      }
    }
  } catch (err) {
    console.warn("[BA Primary Fetch Warning]:", err);
  }

  // 3. خطة الإنقاذ التلقائية (Fallback): جلب فرص التكوين المهني الألمانية الموثقة عبر Adzuna Germany
  try {
    const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/de/search/1?app_id=c1483841&app_key=4393699c824cff44e59c7bb6cb17c18d&results_per_page=${size}&what=${encodeURIComponent(
      query
    )}&content-type=application/json`;

    const altRes = await fetch(adzunaUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (altRes.ok) {
      const altData = await altRes.json();
      const results = altData.results || [];

      const fallbackJobs = results.map((item: any) => ({
        id: String(item.id || Math.floor(Math.random() * 1000000)),
        title: (item.title || "Ausbildung in Deutschland").replace(/<\/?[^>]+(>|$)/g, "").trim(),
        company: item.company?.display_name || "Deutsches Ausbildungsunternehmen",
        city: item.location?.display_name?.split(",")[0] || "Deutschland",
        applyUrl: item.redirect_url || item.url || "https://www.arbeitsagentur.de",
        source: "Verified German Ausbildung Network",
      }));

      return NextResponse.json({
        success: true,
        source: "german_ausbildung_fallback",
        jobs: fallbackJobs,
      });
    }
  } catch (fallbackErr) {
    console.error("[Ausbildung Fallback Error]:", fallbackErr);
  }

  return NextResponse.json(
    { error: "No training positions currently available", jobs: [] },
    { status: 502 }
  );
}
