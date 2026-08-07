import React from 'react';
import Link from 'next/link';
import BlogGrid from "@/components/ui/BlogGrid";
import PostCard from "@/components/ui/PostCard";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page: pageStr } = await searchParams;

  const page = Math.max(1, parseInt(pageStr || '1', 10) || 1);
  const pageSize = 12;
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  // Directly query database using Prisma with pagination
  const [dbPosts, totalPosts] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.post.count({
      where: { published: true },
    }),
  ]);

  const totalPages = Math.ceil(totalPosts / pageSize);

  const posts = dbPosts.map((post) => {
    const cleanExcerpt = post.markdown_content
      ? post.markdown_content
          .replace(/[#*`>_\-]/g, "")
          .substring(0, 160)
          .trim() + "..."
      : "";

    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: cleanExcerpt,
      cover_image: post.image_url || "",
      author: post.generated_by_ai ? "AI Assistant" : "Author",
      tags: [post.category],
      created_at: post.createdAt.toISOString(),
    };
  });


  const isAr = locale === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  // Localized static UI labels based on locale
  const labels: Record<
    string,
    {
      title: string;
      subtitle: string;
      readMore: string;
      noPosts: string;
      author: string;
      previous: string;
      next: string;
      page: string;
      of: string;
    }
  > = {
    ar: {
      title: 'المدونة الألمانية',
      subtitle: 'دليلك الشامل ومقالاتنا حول الانتقال والعيش والعمل في ألمانيا.',
      readMore: 'اقرأ المزيد',
      noPosts: 'لم يتم العثور على مقالات.',
      author: 'الكاتب',
      previous: 'السابق',
      next: 'التالي',
      page: 'صفحة',
      of: 'من',
    },
    en: {
      title: 'German Blog',
      subtitle: 'Your complete guide and resources on relocating, living, and working in Germany.',
      readMore: 'Read More',
      noPosts: 'No blog posts found.',
      author: 'By',
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
      of: 'of',
    },
    de: {
      title: 'Deutschland Blog',
      subtitle: 'Ihr umfassender Leitfaden und Ressourcen für den Umzug, das Leben und Arbeiten in Deutschland.',
      readMore: 'Weiterlesen',
      noPosts: 'Keine Blogbeiträge gefunden.',
      author: 'Von',
      previous: 'Zurück',
      next: 'Weiter',
      page: 'Seite',
      of: 'von',
    },
    fr: {
      title: 'Blog Allemagne',
      subtitle: 'Votre guide complet et ressources pour s\'installer, vivre et travailler en Allemagne.',
      readMore: 'Lire la suite',
      noPosts: 'Aucun article trouvé.',
      author: 'Par',
      previous: 'Précédent',
      next: 'Suivant',
      page: 'Page',
      of: 'sur',
    },
  };

  const ui = labels[locale] || labels.en;

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      <Navbar locale={locale} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1">
        {/* Header section */}
        <header className="text-center mb-16 space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {ui.title}
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            {ui.subtitle}
          </p>
          <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full" />
        </header>

        {/* Posts grid */}
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
            <p className="text-slate-400 text-lg">{ui.noPosts}</p>
          </div>
        ) : (
          <>
            <BlogGrid>
              {posts.map((post) => {
                const displayTitle = post.title;
                const displayExcerpt = post.excerpt;


                const formattedDate = new Date(post.created_at).toLocaleDateString(locale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });

                const category = post.tags[0] || (locale === 'ar' ? 'ألمانيا' : 'Germany');

                return (
                  <PostCard
                    key={post.id}
                    title={displayTitle}
                    excerpt={displayExcerpt}
                    category={category}
                    date={formattedDate}
                    imageUrl={post.cover_image.startsWith('/images/') ? undefined : post.cover_image}
                    readMoreText={ui.readMore}
                    href={`/${locale}/blog/${post.slug}`}
                  />
                );
              })}
            </BlogGrid>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-4">
                {page > 1 ? (
                  <Link
                    href={`/${locale}/blog?page=${page - 1}`}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700"
                  >
                    {ui.previous}
                  </Link>
                ) : (
                  <span className="px-4 py-2 rounded-lg bg-slate-900 text-slate-600 text-sm font-medium cursor-not-allowed border border-slate-800">
                    {ui.previous}
                  </span>
                )}

                <span className="text-sm text-slate-400 font-medium">
                  {ui.page} {page} {ui.of} {totalPages}
                </span>

                {page < totalPages ? (
                  <Link
                    href={`/${locale}/blog?page=${page + 1}`}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700"
                  >
                    {ui.next}
                  </Link>
                ) : (
                  <span className="px-4 py-2 rounded-lg bg-slate-900 text-slate-600 text-sm font-medium cursor-not-allowed border border-slate-800">
                    {ui.next}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <Footer locale={locale} />
    </div>
  );
}
