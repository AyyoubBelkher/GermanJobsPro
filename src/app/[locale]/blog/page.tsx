import React from 'react';
import Link from 'next/link';
import BlogGrid from "@/components/ui/BlogGrid";
import PostCard from "@/components/ui/PostCard";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import BlogCategoryTabs from "@/components/blog/BlogCategoryTabs";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const { page: pageStr, category: rawCategory } = resolvedSearchParams;

  const selectedCategory = rawCategory?.trim() || "all";
  const page = Math.max(1, parseInt(pageStr || '1', 10) || 1);
  const pageSize = 12;
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  // Build category filter condition
  let categoryFilter: Record<string, any> = {};
  if (selectedCategory !== "all") {
    if (selectedCategory.toLowerCase() === "german a1") {
      categoryFilter = {
        OR: [
          { category: { equals: "German A1", mode: "insensitive" } },
          { category: { equals: "Deutsch A1", mode: "insensitive" } },
          { category: { contains: "A1", mode: "insensitive" } },
        ],
      };
    } else if (selectedCategory.toLowerCase() === "jobs") {
      categoryFilter = {
        OR: [
          { category: { contains: "Job", mode: "insensitive" } },
          { category: { contains: "Karriere", mode: "insensitive" } },
        ],
      };
    } else if (selectedCategory.toLowerCase() === "general") {
      categoryFilter = {
        OR: [
          { category: { contains: "General", mode: "insensitive" } },
          { category: { equals: "عام", mode: "insensitive" } },
        ],
      };
    } else {
      categoryFilter = {
        category: { contains: selectedCategory, mode: "insensitive" },
      };
    }
  }

  const whereCondition = {
    published: true,
    ...categoryFilter,
  };

  // Directly query database using Prisma with pagination & count
  let dbPosts: Array<{
    id: string;
    slug: string;
    title: string;
    markdown_content: string;
    category: string;
    image_url: string | null;
    source_link: string | null;
    generated_by_ai: boolean;
    published: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  let totalPosts = 0;
  let countsMap: Record<string, number> = { total: 0, "German A1": 0, Jobs: 0, General: 0 };

  try {
    const [fetchedPosts, count, totalAll, a1Count, jobsCount, generalCount] = await Promise.all([
      prisma.post.findMany({
        where: whereCondition,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.post.count({
        where: whereCondition,
      }),
      prisma.post.count({ where: { published: true } }),
      prisma.post.count({
        where: {
          published: true,
          OR: [
            { category: { equals: "German A1", mode: "insensitive" } },
            { category: { contains: "A1", mode: "insensitive" } },
          ],
        },
      }),
      prisma.post.count({
        where: {
          published: true,
          OR: [
            { category: { contains: "Job", mode: "insensitive" } },
            { category: { contains: "Karriere", mode: "insensitive" } },
          ],
        },
      }),
      prisma.post.count({
        where: {
          published: true,
          OR: [
            { category: { contains: "General", mode: "insensitive" } },
            { category: { equals: "عام", mode: "insensitive" } },
          ],
        },
      }),
    ]);

    dbPosts = fetchedPosts;
    totalPosts = count;
    countsMap = {
      total: totalAll,
      "German A1": a1Count,
      Jobs: jobsCount,
      General: generalCount,
    };
  } catch (error) {
    console.warn("[BlogPage] Database query failed during prerendering:", error instanceof Error ? error.message : error);
  }

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
  const isDe = locale === 'de';
  const isFr = locale === 'fr';
  const dir = isAr ? 'rtl' : 'ltr';

  // Localized static UI labels based on locale
  const labels: Record<
    string,
    {
      title: string;
      subtitle: string;
      readMore: string;
      noPosts: string;
      noPostsDesc: string;
      noGermanA1Title: string;
      noGermanA1Desc: string;
      resetFilter: string;
      author: string;
      previous: string;
      next: string;
      page: string;
      of: string;
    }
  > = {
    ar: {
      title: 'المدونة ودليل التوظيف واللغة',
      subtitle: 'دليلك الشامل ومقالاتنا الحصرية حول تعلم اللغة الألمانية، التأشيرات، والعمل والاستقرار في ألمانيا 🇩🇪',
      readMore: 'اقرأ المزيد',
      noPosts: 'لم يتم العثور على مقالات في هذا القسم.',
      noPostsDesc: 'جرب اختيار تصنيف آخر أو تصفح جميع المقالات المنشورة.',
      noGermanA1Title: 'دروس ومقالات المستوى A1 قيد التجهيز 🇩🇪',
      noGermanA1Desc: 'نعمل حالياً على نشر شروحات وقواعد ومفردات المستوى A1 للتحضير لاختبار Goethe والتحدث بثقة في ألمانيا.',
      resetFilter: 'عرض جميع المقالات (الكل)',
      author: 'الكاتب',
      previous: 'السابق',
      next: 'التالي',
      page: 'صفحة',
      of: 'من',
    },
    en: {
      title: 'German Career & Language Blog',
      subtitle: 'Your complete guide to learning German, visa procedures, and building a career in Germany 🇩🇪',
      readMore: 'Read More',
      noPosts: 'No articles found in this category.',
      noPostsDesc: 'Try choosing another category or browsing all published articles.',
      noGermanA1Title: 'German A1 Lessons Coming Soon 🇩🇪',
      noGermanA1Desc: 'We are preparing beginner German A1 vocabulary, grammar guides, and Goethe exam preparation resources.',
      resetFilter: 'Show All Articles',
      author: 'By',
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
      of: 'of',
    },
    de: {
      title: 'Ratgeber, Karriere & Deutsch Blog',
      subtitle: 'Ihr umfassender Leitfaden für Deutschlernen, Visa, Leben und Arbeiten in Deutschland 🇩🇪',
      readMore: 'Weiterlesen',
      noPosts: 'Keine Beiträge in dieser Kategorie gefunden.',
      noPostsDesc: 'Wählen Sie eine andere Kategorie oder durchsuchen Sie alle Beiträge.',
      noGermanA1Title: 'Deutsch A1 Lektionen in Kürze verfügbar 🇩🇪',
      noGermanA1Desc: 'Wir erstellen praxisnahe A1-Vokabeln, Grammatikübersichten und Vorbereitungen für das Goethe-Zertifikat A1.',
      resetFilter: 'Alle Beiträge anzeigen',
      author: 'Von',
      previous: 'Zurück',
      next: 'Weiter',
      page: 'Seite',
      of: 'von',
    },
    fr: {
      title: 'Blog Carrière & Allemand',
      subtitle: 'Votre guide complet pour apprendre l\'allemand, obtenir un visa et travailler en Allemagne 🇩🇪',
      readMore: 'Lire la suite',
      noPosts: 'Aucun article trouvé dans cette catégorie.',
      noPostsDesc: 'Essayez de choisir une autre catégorie ou consultez tous les articles.',
      noGermanA1Title: 'Leçons d\'allemand A1 bientôt disponibles 🇩🇪',
      noGermanA1Desc: 'Nous préparons des guides de grammaire et de vocabulaire pour débutants niveau A1.',
      resetFilter: 'Afficher tous les articles',
      author: 'Par',
      previous: 'Précédent',
      next: 'Suivant',
      page: 'Page',
      of: 'sur',
    },
  };

  const ui = labels[locale] || labels.en;
  const isGermanA1Selected = selectedCategory.toLowerCase() === "german a1";

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      <Navbar locale={locale} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1">
        {/* Header section */}
        <header className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <span>📚</span>
            <span>{isAr ? "المقالات والدليل الإرشادي" : isDe ? "Ratgeber & Wissen" : "Guides & Articles"}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-sky-300 to-blue-200 bg-clip-text text-transparent">
            {ui.title}
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {ui.subtitle}
          </p>
          <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-blue-400 mx-auto rounded-full" />
        </header>

        {/* Category Filter Tabs */}
        <BlogCategoryTabs
          locale={locale}
          activeCategory={selectedCategory}
          counts={countsMap}
        />

        {/* Posts grid / Empty State */}
        {posts.length === 0 ? (
          <div className="text-center py-16 px-6 max-w-2xl mx-auto bg-slate-900/60 rounded-3xl border border-slate-800 space-y-6 shadow-2xl backdrop-blur-md">
            <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto text-4xl shadow-inner">
              {isGermanA1Selected ? "🇩🇪" : "🔍"}
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {isGermanA1Selected ? ui.noGermanA1Title : ui.noPosts}
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
                {isGermanA1Selected ? ui.noGermanA1Desc : ui.noPostsDesc}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href={`/${locale}/blog`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-95"
              >
                <span>🌐</span>
                <span>{ui.resetFilter}</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <BlogGrid columns={3}>
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
                    imageUrl={post.cover_image}
                    readMoreText={ui.readMore}
                    href={`/${locale}/blog/${post.slug}`}
                  />
                );
              })}
            </BlogGrid>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-14 flex items-center justify-center gap-3">
                {page > 1 ? (
                  <Link
                    href={`/${locale}/blog?page=${page - 1}${selectedCategory !== 'all' ? `&category=${encodeURIComponent(selectedCategory)}` : ''}`}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all border border-slate-800 shadow-sm"
                  >
                    {ui.previous}
                  </Link>
                ) : (
                  <span className="px-4 py-2.5 rounded-xl bg-slate-950 text-slate-600 text-xs font-bold cursor-not-allowed border border-slate-900">
                    {ui.previous}
                  </span>
                )}

                <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-mono font-bold">
                  {ui.page} {page} {ui.of} {totalPages}
                </div>

                {page < totalPages ? (
                  <Link
                    href={`/${locale}/blog?page=${page + 1}${selectedCategory !== 'all' ? `&category=${encodeURIComponent(selectedCategory)}` : ''}`}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all border border-slate-800 shadow-sm"
                  >
                    {ui.next}
                  </Link>
                ) : (
                  <span className="px-4 py-2.5 rounded-xl bg-slate-950 text-slate-600 text-xs font-bold cursor-not-allowed border border-slate-900">
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
