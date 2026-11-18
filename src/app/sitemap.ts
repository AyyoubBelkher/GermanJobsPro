import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { isExcludedJob } from "@/lib/jobUtils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.germanjobspro.com";

  // Fetch published post slugs safely inside try/catch
  let posts: Array<{ slug: string; updatedAt: Date }> = [];
  try {
    const isDummyDb =
      !process.env.DATABASE_URL ||
      process.env.DATABASE_URL.includes("localhost:5432/dummy");

    if (!isDummyDb) {
      posts = await prisma.post.findMany({
        where: { published: true },
        select: {
          slug: true,
          updatedAt: true,
        },
      });
    }
  } catch (error) {
    console.warn("[Sitemap] Could not fetch dynamic posts during build prerender:", error instanceof Error ? error.message : error);
  }

  // Fetch active jobs safely inside try/catch
  let jobs: Array<{ id: string; updatedAt: Date }> = [];
  try {
    const isDummyDb =
      !process.env.DATABASE_URL ||
      process.env.DATABASE_URL.includes("localhost:5432/dummy");

    if (!isDummyDb) {
      const dbJobs = await prisma.job.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          updatedAt: true,
          applyUrl: true,
          company: true,
          city: true,
          title: true,
        },
        orderBy: { publishedAt: "desc" },
        take: 500,
      });
      jobs = dbJobs.filter((job) => !isExcludedJob(job));
    }
  } catch (error) {
    console.warn("[Sitemap] Could not fetch active jobs during build prerender:", error instanceof Error ? error.message : error);
  }

  const locales = ["ar", "de", "en", "fr"] as const;

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
      alternates: {
        languages: {
          ar: `${baseUrl}/ar`,
          de: `${baseUrl}/de`,
          en: `${baseUrl}/en`,
          fr: `${baseUrl}/fr`,
          "x-default": `${baseUrl}/de`,
        },
      },
    },
  ];

  // Static public routes across all 4 locales
  const staticPaths = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/jobs", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/blog", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/pricing", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/terms", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/privacy", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/refund", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/impressum", priority: 0.5, changeFrequency: "monthly" as const },
  ];

  staticPaths.forEach(({ path, priority, changeFrequency }) => {
    locales.forEach((locale) => {
      routes.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: {
          languages: {
            ar: `${baseUrl}/ar${path}`,
            de: `${baseUrl}/de${path}`,
            en: `${baseUrl}/en${path}`,
            fr: `${baseUrl}/fr${path}`,
            "x-default": `${baseUrl}/de${path}`,
          },
        },
      });
    });
  });

  // Dynamic routes for each published blog post across localized routes
  posts.forEach((post) => {
    const encodedSlug = encodeURIComponent(post.slug);
    locales.forEach((locale) => {
      routes.push({
        url: `${baseUrl}/${locale}/blog/${encodedSlug}`,
        lastModified: post.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: {
          languages: {
            ar: `${baseUrl}/ar/blog/${encodedSlug}`,
            de: `${baseUrl}/de/blog/${encodedSlug}`,
            en: `${baseUrl}/en/blog/${encodedSlug}`,
            fr: `${baseUrl}/fr/blog/${encodedSlug}`,
            "x-default": `${baseUrl}/de/blog/${encodedSlug}`,
          },
        },
      });
    });
  });

  // Dynamic routes for each active job across localized routes
  jobs.forEach((job) => {
    const encodedId = encodeURIComponent(job.id);
    locales.forEach((locale) => {
      routes.push({
        url: `${baseUrl}/${locale}/jobs/${encodedId}`,
        lastModified: job.updatedAt || new Date(),
        changeFrequency: "daily",
        priority: 0.8,
        alternates: {
          languages: {
            ar: `${baseUrl}/ar/jobs/${encodedId}`,
            de: `${baseUrl}/de/jobs/${encodedId}`,
            en: `${baseUrl}/en/jobs/${encodedId}`,
            fr: `${baseUrl}/fr/jobs/${encodedId}`,
            "x-default": `${baseUrl}/de/jobs/${encodedId}`,
          },
        },
      });
    });
  });

  return routes;
}
