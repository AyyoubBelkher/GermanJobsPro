import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  filterDeduplicateAndPaginateJobs,
}: typeof import("../src/lib/jobUtils") = require("../src/lib/jobUtils.ts");
const {
  buildPgSslConfig,
  normalizeConnectionString,
}: typeof import("../src/lib/prisma-ssl") = require("../src/lib/prisma-ssl.ts");

describe("Post-Filter & Post-Dedup Job Pagination (filterDeduplicateAndPaginateJobs)", () => {
  it("computes exact total, totalPages, and page slices after excluding invalid and duplicate jobs", () => {
    const sampleJobs = [
      { id: "1", title: "Softwareentwickler (m/w/d)", company: "Alpha GmbH", city: "Berlin", applyUrl: "https://example.de/1" },
      // Duplicate title + company (case/whitespace variation)
      { id: "2", title: " softwareentwickler (m/w/d) ", company: "alpha gmbh", city: "Berlin", applyUrl: "https://example.de/2" },
      // Excluded non-German location (Zürich)
      { id: "3", title: "Java Engineer", company: "Swiss AG", city: "Zürich", applyUrl: "https://example.ch/3" },
      // Excluded Google News URL
      { id: "4", title: "DevOps Engineer", company: "Beta GmbH", city: "München", applyUrl: "https://news.google.com/4" },
      { id: "5", title: "Pflegefachkraft (m/w/d)", company: "Klinikum Süd", city: "München", applyUrl: "https://example.de/5" },
      { id: "6", title: "Mechatroniker (m/w/d)", company: "Werk AG", city: "Stuttgart", applyUrl: "https://example.de/6" },
      { id: "7", title: "Data Analyst (m/w/d)", company: "Nord Tech", city: "Hamburg", applyUrl: "https://example.de/7" },
    ];

    const page1 = filterDeduplicateAndPaginateJobs(sampleJobs, { page: 1, limit: 2 });
    assert.equal(page1.total, 4);
    assert.equal(page1.totalPages, 2);
    assert.equal(page1.page, 1);
    assert.equal(page1.limit, 2);
    assert.deepEqual(
      page1.jobs.map((j) => j.id),
      ["1", "5"]
    );

    const page2 = filterDeduplicateAndPaginateJobs(sampleJobs, { page: 2, limit: 2 });
    assert.equal(page2.total, 4);
    assert.equal(page2.totalPages, 2);
    assert.equal(page2.page, 2);
    assert.deepEqual(
      page2.jobs.map((j) => j.id),
      ["6", "7"]
    );

    // Out-of-range page returns empty array with consistent total & totalPages
    const page3 = filterDeduplicateAndPaginateJobs(sampleJobs, { page: 3, limit: 2 });
    assert.equal(page3.total, 4);
    assert.equal(page3.totalPages, 2);
    assert.equal(page3.jobs.length, 0);
  });

  it("applies sanitize before deduplication and returns totalPages=1 when empty", () => {
    const jobs = [
      { id: "a", title: "أخصائي تمريض (Software Engineer)", company: "Tech GmbH", city: "Berlin", applyUrl: "https://example.de/a" },
      { id: "b", title: "متخصص تقنية معلومات (Software Engineer)", company: "Tech GmbH", city: "Berlin", applyUrl: "https://example.de/b" },
    ];

    const res = filterDeduplicateAndPaginateJobs(jobs, {
      page: 1,
      limit: 15,
      sanitize: (j) => ({
        ...j,
        title: j.title.replace(/^أخصائي تمريض/, "متخصص تقنية معلومات"),
      }),
    });
    assert.equal(res.total, 1);
    assert.equal(res.totalPages, 1);
    assert.equal(res.jobs[0].id, "a");

    const empty = filterDeduplicateAndPaginateJobs([], { page: 1, limit: 15 });
    assert.equal(empty.total, 0);
    assert.equal(empty.totalPages, 1);
    assert.equal(empty.jobs.length, 0);
  });
});

describe("PostgreSQL TLS Verification Config (buildPgSslConfig)", () => {
  it("verifies TLS certificates by default for SSL-enabled URLs", () => {
    const neonUrl = "postgresql://user:pass@ep-db.neon.tech/neondb?sslmode=require";
    assert.deepEqual(buildPgSslConfig(neonUrl, undefined), { rejectUnauthorized: true });
    assert.deepEqual(buildPgSslConfig(neonUrl, "true"), { rejectUnauthorized: true });
    assert.deepEqual(buildPgSslConfig("postgresql://user:pass@db.example.com/prod", undefined), {
      rejectUnauthorized: true,
    });
  });

  it("allows explicit opt-out via DATABASE_SSL_REJECT_UNAUTHORIZED=false", () => {
    const neonUrl = "postgresql://user:pass@ep-db.neon.tech/neondb?sslmode=require";
    assert.deepEqual(buildPgSslConfig(neonUrl, "false"), { rejectUnauthorized: false });
  });

  it("disables SSL cleanly for localhost dummy build URLs with sslmode=disable", () => {
    const buildUrl = "postgresql://postgres:postgres@localhost:5432/dummy?sslmode=disable";
    assert.equal(buildPgSslConfig(buildUrl, undefined), false);
    assert.equal(buildPgSslConfig(buildUrl, "false"), false);
    assert.equal(normalizeConnectionString(buildUrl), buildUrl);
    assert.ok(
      normalizeConnectionString("postgresql://user:pass@ep-db.neon.tech/neondb?sslmode=require").includes(
        "uselibpqcompat=true"
      )
    );
  });
});
