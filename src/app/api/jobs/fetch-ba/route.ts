import { NextRequest, NextResponse } from "next/server";
import { verifyAutomationSecret } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * جلب توكن OAuth الرسمي من الوكالة الاتحادية للعمل لتفادي 403
 */
async function getBaAccessToken(): Promise<string | null> {
  try {
    const res = await fetch("https://rest.arbeitsagentur.de/oauth/gettoken_cc", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Jobsuche/2.9.2 (de.arbeitsagentur.jobboerse; build:1077; Android 10)",
      },
      body: new URLSearchParams({
        client_id: "c003a37f-024f-462a-b36d-b001be494880",
        client_secret: "32a39620-32b3-4307-9aa1-511e3d9484d0",
        grant_type: "client_credentials",
      }),
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return data.access_token || null;
    }
  } catch {
    // fallback to static key
  }
  return null;
}

/**
 * GET /api/jobs/fetch-ba
 */
export async function GET(request: NextRequest) {
  if (!verifyAutomationSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "Pflegefachkraft";
  const size = searchParams.get("size") || "25";
  const angebotsart = searchParams.get("angebotsart") || "1";

  try {
    const baApiUrl = `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?was=${encodeURIComponent(
      query
    )}&angebotsart=${angebotsart}&size=${size}&pav=false`;

    const token = await getBaAccessToken();

    const requestHeaders: Record<string, string> = {
      "X-API-Key": "jobboerse-jobsuche",
      "User-Agent": "Jobsuche/2.9.2 (de.arbeitsagentur.jobboerse; build:1077; Android 10)",
      "Origin": "https://www.arbeitsagentur.de",
      "Referer": "https://www.arbeitsagentur.de/jobsuche/",
      "Accept": "application/json",
    };

    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(baApiUrl, {
      headers: requestHeaders,
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
