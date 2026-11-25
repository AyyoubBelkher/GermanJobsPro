import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  MAX_TIKTOK_PROXY_IMAGE_BYTES,
  validateTikTokProxyUrl,
} from "../src/lib/tiktok-proxy";
import { GET, dynamic, runtime } from "../src/app/api/media/tiktok-proxy/route";

describe("TikTok Media Proxy: SSRF Allowlist & Route Behavior", () => {
  describe("Route Segment Config", () => {
    it("exports nodejs runtime and force-dynamic", () => {
      assert.equal(runtime, "nodejs");
      assert.equal(dynamic, "force-dynamic");
    });
  });

  describe("validateTikTokProxyUrl allowlist & SSRF protection", () => {
    it("allows images.unsplash.com and sets fm=jpg when missing", () => {
      const res = validateTikTokProxyUrl(
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1080&auto=format"
      );
      assert.equal(res.ok, true);
      if (res.ok) {
        assert.equal(res.isUnsplash, true);
        assert.equal(res.url.hostname, "images.unsplash.com");
        assert.equal(res.url.searchParams.get("fm"), "jpg");
        assert.equal(res.url.searchParams.get("w"), "1080");
      }
    });

    it("preserves existing fm param on images.unsplash.com", () => {
      const res = validateTikTokProxyUrl(
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?fm=jpg&q=80"
      );
      assert.equal(res.ok, true);
      if (res.ok) {
        assert.equal(res.url.searchParams.get("fm"), "jpg");
        assert.equal(res.url.searchParams.getAll("fm").length, 1);
      }
    });

    it("allows *.fbcdn.net subdomains without altering query params", () => {
      const urls = [
        "https://scontent.xx.fbcdn.net/v/t39.30808-6/12345_n.jpg?_nc_cat=101&oh=abc",
        "https://scontent-fra3-1.xx.fbcdn.net/v/t1.6435-9/sample.jpg",
      ];

      for (const raw of urls) {
        const res = validateTikTokProxyUrl(raw);
        assert.equal(res.ok, true, `Expected ${raw} to be allowed`);
        if (res.ok) {
          assert.equal(res.isUnsplash, false);
          assert.equal(res.url.toString(), raw);
        }
      }
    });

    it("blocks localhost and evil.com with 403", () => {
      for (const blocked of [
        "https://localhost/image.jpg",
        "https://sub.localhost/image.jpg",
        "https://evil.com/image.jpg",
        "https://fbcdn.net/image.jpg",
        "https://notfbcdn.net/image.jpg",
        "https://fbcdn.net.evil.com/image.jpg",
        "https://images.unsplash.com.evil.com/image.jpg",
        "https://evil.com/?target=images.unsplash.com",
      ]) {
        const res = validateTikTokProxyUrl(blocked);
        assert.equal(res.ok, false, `Expected ${blocked} to be rejected`);
        if (!res.ok) {
          assert.equal(res.status, 403, `Expected 403 for ${blocked}`);
        }
      }
    });

    it("blocks IP addresses (127.0.0.1, 169.254.169.254, IPv6, numeric IP) with 400", () => {
      for (const ipUrl of [
        "https://127.0.0.1/image.jpg",
        "https://169.254.169.254/latest/meta-data/",
        "https://10.0.0.1/internal.jpg",
        "https://[::1]/image.jpg",
        "https://[::ffff:127.0.0.1]/image.jpg",
        "https://2130706433/image.jpg",
      ]) {
        const res = validateTikTokProxyUrl(ipUrl);
        assert.equal(res.ok, false, `Expected ${ipUrl} to be rejected`);
        if (!res.ok) {
          assert.equal(res.status, 400, `Expected 400 for ${ipUrl}`);
        }
      }
    });

    it("blocks http:// and other non-https protocols with 400", () => {
      for (const badProto of [
        "http://images.unsplash.com/photo-123",
        "http://scontent.xx.fbcdn.net/sample.jpg",
        "ftp://images.unsplash.com/photo-123",
        "file:///etc/passwd",
        "javascript:alert(1)",
      ]) {
        const res = validateTikTokProxyUrl(badProto);
        assert.equal(res.ok, false, `Expected ${badProto} to be rejected`);
        if (!res.ok) {
          assert.equal(res.status, 400, `Expected 400 for ${badProto}`);
        }
      }
    });

    it("blocks URL credentials, custom ports, and missing/malformed URLs with 400", () => {
      for (const invalid of [
        "",
        "   ",
        null,
        undefined,
        "not-a-valid-url",
        "https://user:pass@images.unsplash.com/photo-123",
        "https://user@scontent.xx.fbcdn.net/sample.jpg",
        "https://:@images.unsplash.com/photo-123",
        "https://images.unsplash.com:8443/photo-123",
      ]) {
        const res = validateTikTokProxyUrl(invalid);
        assert.equal(res.ok, false, `Expected ${String(invalid)} to be rejected`);
        if (!res.ok) {
          assert.equal(res.status, 400);
        }
      }
    });
  });

  describe("GET /api/media/tiktok-proxy handler", () => {
    it("returns 400/403 immediately without calling upstream fetch for disallowed targets", async () => {
      const originalFetch = globalThis.fetch;
      let fetchCalled = false;
      globalThis.fetch = (async () => {
        fetchCalled = true;
        throw new Error("fetch should not be called");
      }) as typeof fetch;

      try {
        const cases: Array<{ target: string; expectedStatus: number }> = [
          { target: "https://localhost/a.jpg", expectedStatus: 403 },
          { target: "https://evil.com/a.jpg", expectedStatus: 403 },
          { target: "https://127.0.0.1/a.jpg", expectedStatus: 400 },
          { target: "https://169.254.169.254/latest", expectedStatus: 400 },
          { target: "http://images.unsplash.com/photo-1", expectedStatus: 400 },
        ];

        for (const c of cases) {
          const req = new NextRequest(
            `https://www.germanjobspro.com/api/media/tiktok-proxy?url=${encodeURIComponent(c.target)}`
          );
          const res = await GET(req);
          assert.equal(res.status, c.expectedStatus, `Unexpected status for ${c.target}`);
        }

        assert.equal(fetchCalled, false);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("proxies Unsplash JPEG with fm=jpg, follow redirect, timeout signal, and required headers", async () => {
      const originalFetch = globalThis.fetch;
      const sampleBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      let capturedUrl = "";
      let capturedInit: RequestInit | undefined;

      globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
        capturedUrl = typeof input === "string" ? input : input.toString();
        capturedInit = init;
        return new Response(sampleBytes, {
          status: 200,
          headers: {
            "Content-Type": "image/jpeg; charset=binary",
          },
        });
      }) as typeof fetch;

      try {
        const target = "https://images.unsplash.com/photo-1500?w=1080";
        const req = new NextRequest(
          `https://www.germanjobspro.com/api/media/tiktok-proxy?url=${encodeURIComponent(target)}`
        );
        const res = await GET(req);

        assert.equal(res.status, 200);
        assert.equal(res.headers.get("content-type"), "image/jpeg");
        assert.equal(res.headers.get("content-length"), String(sampleBytes.byteLength));
        assert.equal(res.headers.get("cache-control"), "public, max-age=3600");

        const body = new Uint8Array(await res.arrayBuffer());
        assert.deepEqual(body, sampleBytes);

        const fetchedUrl = new URL(capturedUrl);
        assert.equal(fetchedUrl.searchParams.get("fm"), "jpg");
        assert.equal(capturedInit?.redirect, "follow");
        assert.ok(capturedInit?.signal instanceof AbortSignal);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("proxies fbcdn image/webp responses with exact Content-Type and Content-Length", async () => {
      const originalFetch = globalThis.fetch;
      const webpBytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00]);

      globalThis.fetch = (async () => {
        return new Response(webpBytes, {
          status: 200,
          headers: { "Content-Type": "image/webp" },
        });
      }) as typeof fetch;

      try {
        const target = "https://scontent.xx.fbcdn.net/v/t39.30808-6/sample.webp";
        const req = new NextRequest(
          `https://www.germanjobspro.com/api/media/tiktok-proxy?url=${encodeURIComponent(target)}`
        );
        const res = await GET(req);

        assert.equal(res.status, 200);
        assert.equal(res.headers.get("content-type"), "image/webp");
        assert.equal(res.headers.get("content-length"), String(webpBytes.byteLength));
        assert.equal(res.headers.get("cache-control"), "public, max-age=3600");
        assert.deepEqual(new Uint8Array(await res.arrayBuffer()), webpBytes);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("rejects non-jpeg/webp upstream Content-Type with 415", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async () => {
        return new Response("<svg></svg>", {
          status: 200,
          headers: { "Content-Type": "image/svg+xml" },
        });
      }) as typeof fetch;

      try {
        const req = new NextRequest(
          `https://www.germanjobspro.com/api/media/tiktok-proxy?url=${encodeURIComponent(
            "https://scontent.xx.fbcdn.net/v/sample.svg"
          )}`
        );
        const res = await GET(req);
        assert.equal(res.status, 415);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("rejects payloads exceeding 8 MB with 413", async () => {
      const originalFetch = globalThis.fetch;
      const oversizeChunk = new Uint8Array(MAX_TIKTOK_PROXY_IMAGE_BYTES + 1);

      globalThis.fetch = (async () => {
        return new Response(oversizeChunk, {
          status: 200,
          headers: { "Content-Type": "image/jpeg" },
        });
      }) as typeof fetch;

      try {
        const req = new NextRequest(
          `https://www.germanjobspro.com/api/media/tiktok-proxy?url=${encodeURIComponent(
            "https://images.unsplash.com/photo-big"
          )}`
        );
        const res = await GET(req);
        assert.equal(res.status, 413);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("blocks post-redirect SSRF if upstream response.url escapes allowlist", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async () => {
        const resp = new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "Content-Type": "image/jpeg" },
        });
        Object.defineProperty(resp, "url", {
          value: "http://169.254.169.254/latest/meta-data/",
        });
        return resp;
      }) as typeof fetch;

      try {
        const req = new NextRequest(
          `https://www.germanjobspro.com/api/media/tiktok-proxy?url=${encodeURIComponent(
            "https://images.unsplash.com/photo-redirect"
          )}`
        );
        const res = await GET(req);
        assert.equal(res.status, 400);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
