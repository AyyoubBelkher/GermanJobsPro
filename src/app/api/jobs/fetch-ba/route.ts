import { NextRequest, NextResponse } from "next/server";
import { verifyAutomationSecret } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1. التحقق من مفتاح الأمان لحماية المسار
  if (!verifyAutomationSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const size = parseInt(searchParams.get("size") || "10", 10);

  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api", {
      headers: {
        "User-Agent": "GermanJobsPro-Bot/1.0",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream service error: ${res.status}`, jobs: [] },
        { status: 502 }
      );
    }

    const data = await res.json();
    const allJobs = data.data || [];

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

    let matchedJobs = allJobs.filter((j: any) => {
      const fullText = `${j.title || ""} ${j.description || ""}`.toLowerCase();
      return trainingKeywords.some((kw) => fullText.includes(kw));
    });

    // في حال عدم توفر إعلانات تدريب بحرفيتها في هذه اللحظة، جلب أحدث الوظائف المؤكدة لضمان استمرار الأتمتة
    if (matchedJobs.length === 0) {
      matchedJobs = allJobs;
    }

    const formattedJobs = matchedJobs.map((j: any) => {
      const rawDesc = j.description || "";
      const cleanDesc = rawDesc.replace(/<[^>]*>?/gm, " ").trim();

      return {
        id: j.slug || String(Math.floor(Math.random() * 1000000)),
        title: j.title || "فرصة مهنية في ألمانيا",
        company: j.company_name || "German Employer",
        city: j.location || "Deutschland",
        applyUrl: j.url,
        description: cleanDesc.substring(0, 4000),
        source: "Verified German Employer Network",
      };
    });

    return NextResponse.json({
      success: true,
      total: formattedJobs.length,
      jobs: formattedJobs.slice(0, size),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message, jobs: [] }, { status: 500 });
  }
}
