import { NextRequest, NextResponse } from "next/server";
import { verifyAutomationSecret } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/jobs/fetch-ba
 * وسيط رسمي لجلب شواغر التمريض والرعاية الطبية من الوكالة الاتحادية للعمل (arbeitsagentur.de)
 */
export async function GET(request: NextRequest) {
  // التحقق من مفتاح الأمان لحماية المسار
  if (!verifyAutomationSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "Pflegefachkraft";
  const size = searchParams.get("size") || "25";
  const angebotsart = searchParams.get("angebotsart") || "1"; // 1 = عمل, 4 = تكوين مهني

  try {
    const baApiUrl = `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?was=${encodeURIComponent(
      query
    )}&angebotsart=${angebotsart}&size=${size}&pav=false`;

    const res = await fetch(baApiUrl, {
      headers: {
        "X-API-Key": "jobboerse-jobsuche",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `BA Server error ${res.status}`, details: errText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      jobs: data.stellenangebote || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
