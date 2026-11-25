import { NextRequest, NextResponse } from "next/server";
import {
  MAX_TIKTOK_PROXY_IMAGE_BYTES,
  TIKTOK_PROXY_CACHE_CONTROL,
  UPSTREAM_FETCH_TIMEOUT_MS,
  normalizeAllowedImageContentType,
  readResponseBodyWithLimit,
  validateTikTokProxyUrl,
} from "../../../../lib/tiktok-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/media/tiktok-proxy?url=<encoded_https_url>
 * SSRF-safe public JPEG/WebP proxy so TikTok's PULL_FROM_URL can fetch images
 * from our verified domain without exposing internal networks or arbitrary hosts.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const validation = validateTikTokProxyUrl(searchParams.get("url"));

  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status }
    );
  }

  try {
    const upstreamResponse = await fetch(validation.url.toString(), {
      method: "GET",
      signal: AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS),
      redirect: "follow",
      headers: {
        Accept: "image/jpeg,image/webp;q=0.9,*/*;q=0.8",
        "User-Agent": "GermanJobsPro-MediaProxy/1.0",
      },
    });

    // Defense-in-depth: ensure any followed redirect stayed within the strict allowlist.
    if (upstreamResponse.url) {
      const finalUrlValidation = validateTikTokProxyUrl(upstreamResponse.url);
      if (!finalUrlValidation.ok) {
        await upstreamResponse.body?.cancel().catch(() => undefined);
        return NextResponse.json(
          { error: "Upstream redirect target is not allowed" },
          { status: finalUrlValidation.status }
        );
      }
    }

    if (!upstreamResponse.ok) {
      await upstreamResponse.body?.cancel().catch(() => undefined);
      return NextResponse.json(
        { error: `Upstream image fetch failed with status ${upstreamResponse.status}` },
        { status: 502 }
      );
    }

    const contentType = normalizeAllowedImageContentType(
      upstreamResponse.headers.get("content-type")
    );
    if (!contentType) {
      await upstreamResponse.body?.cancel().catch(() => undefined);
      return NextResponse.json(
        { error: "Upstream Content-Type must be image/jpeg or image/webp" },
        { status: 415 }
      );
    }

    const bodyResult = await readResponseBodyWithLimit(
      upstreamResponse,
      MAX_TIKTOK_PROXY_IMAGE_BYTES
    );

    if (!bodyResult.ok) {
      return NextResponse.json(
        { error: bodyResult.error },
        { status: bodyResult.status }
      );
    }

    return new NextResponse(Buffer.from(bodyResult.bytes), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(bodyResult.bytes.byteLength),
        "Cache-Control": TIKTOK_PROXY_CACHE_CONTROL,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      return NextResponse.json(
        { error: "Upstream image fetch timed out" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch upstream image" },
      { status: 502 }
    );
  }
}
