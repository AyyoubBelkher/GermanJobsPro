import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Free Server-Side German TTS Fallback Endpoint
 * Fetches high-quality German pronunciation (de-DE) stream and caches for instant repeat playback.
 */
export async function GET(request: NextRequest) {
  // 1. Rate limiting: 60 requests per minute per IP
  const rateLimitResponse = checkRateLimit(request, {
    action: "tts:speak",
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // 2. Read 'text' query parameter
  const { searchParams } = new URL(request.url);
  const rawText = searchParams.get("text") || "";

  // 3. Sanitize text:
  // - Strip bracketed phonetic strings: /[\[\]][^\[\]]*[\[\]]/g and /\[[^\]]*\]/g
  // - Strip Arabic characters: /[\u0600-\u06FF]+/g
  // - Normalize spaces and trim
  let cleanText = rawText
    .replace(/[\[\]][^\[\]]*[\[\]]/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[\u0600-\u06FF]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Cap at 220 characters
  if (cleanText.length > 220) {
    cleanText = cleanText.slice(0, 220).trim();
  }

  if (!cleanText) {
    return NextResponse.json(
      { error: "Valid German text parameter is required" },
      { status: 400 }
    );
  }

  try {
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      cleanText
    )}&tl=de&client=tw-ob&ttsspeed=0.88`;

    const upstreamResponse = await fetch(ttsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://translate.google.com/",
        Accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.8",
      },
    });

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch TTS audio from upstream service" },
        { status: upstreamResponse.status }
      );
    }

    const audioBuffer = await upstreamResponse.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error) {
    console.error("[TTS API Route Error]:", error);
    return NextResponse.json(
      { error: "Failed to process German TTS audio request" },
      { status: 500 }
    );
  }
}
