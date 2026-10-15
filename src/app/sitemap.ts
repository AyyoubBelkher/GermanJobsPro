import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://germanjobspro.com");

  // Fetch published post slugs and timestamps from DB via Prisma
  let posts: Array<{ slug: string; updatedAt: Date }> = [];
  try {
    posts = await prisma.post.findMany({
      where: { published: true },
      select: {
        slug: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    console.warn("[Sitemap] Could not fetch dynamic posts during build prerender:", error instanceof Error ? error.message : error);
  }

  // Fetch active jobs from DB via Prisma
  let jobs: Array<{ id: string; updatedAt: Date }> = [];
  try {
    jobs = await prisma.job.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 500,
    });
  } catch (error) {
    console.warn("[Sitemap] Could not fetch active jobs during build prerender:", error instanceof Error ? error.message : error);
  }

  const locales = ["ar", "en", "de", "fr"];

  // Base static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  // Add localized root, blog, jobs, and pricing routes
  locales.forEach((locale) => {
    routes.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    });
    routes.push({
      url: `${baseUrl}/${locale}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
    routes.push({
      url: `${baseUrl}/${locale}/jobs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    });
    routes.push({
      url: `${baseUrl}/${locale}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  });

  // Dynamic routes for each published blog post slug across localized routes
  posts.forEach((post) => {
    locales.forEach((locale) => {
      routes.push({
        url: `${baseUrl}/${locale}/blog/${encodeURIComponent(post.slug)}`,
        lastModified: post.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    });
  });

  // Dynamic routes for each active job across localized routes
  jobs.forEach((job) => {
    locales.forEach((locale) => {
      routes.push({
        url: `${baseUrl}/${locale}/jobs/${encodeURIComponent(job.id)}`,
        lastModified: job.updatedAt || new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      });
    });
  });

  return routes;
}
