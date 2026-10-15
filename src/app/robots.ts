import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://germanjobspro.com");

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: ["/api/", "/admin/", "/dashboard/"],
      },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-Web",
          "anthropic-ai",
          "Google-Extended",
          "GoogleOther",
          "PerplexityBot",
          "DeepSeekBot",
          "xAI-Bot",
          "GrokBot",
          "Applebot-Extended",
          "Meta-ExternalAgent",
          "Bingbot",
          "Amazonbot",
          "YouBot",
        ],
        allow: [
          "/",
          "/llms.txt",
          "/llms-full.txt",
          "/ar",
          "/en",
          "/de",
          "/fr",
          "/ar/jobs",
          "/en/jobs",
          "/de/jobs",
          "/fr/jobs",
          "/ar/blog",
          "/en/blog",
          "/de/blog",
          "/fr/blog",
          "/ar/pricing",
          "/en/pricing",
          "/de/pricing",
          "/fr/pricing",
        ],
        disallow: ["/api/", "/admin/", "/dashboard/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
