import React from 'react';
import BlogGrid from "@/components/ui/BlogGrid";
import PostCard from "@/components/ui/PostCard";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  title_ar: string;
  title_de: string;
  title_fr: string;
  title_en: string;
  excerpt: string;
  excerpt_ar: string;
  excerpt_de: string;
  excerpt_fr: string;
  excerpt_en: string;
  cover_image: string;
  author: string;
  tags: string[];
  created_at: string;
  markdown_content_ar?: string;
  markdown_content_en?: string;
  markdown_content_de?: string;
  markdown_content_fr?: string;
}

async function getPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch('http://localhost:3000/api/blog', { cache: 'no-store' });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.posts || [];
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

export default async function BlogPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const posts = await getPosts();

  const isAr = locale === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  // Localized static UI labels based on locale
  const labels: Record<string, { title: string; subtitle: string; readMore: string; noPosts: string; author: string }> = {
    ar: {
      title: 'المدونة الألمانية',
      subtitle: 'دليلك الشامل ومقالاتنا حول الانتقال والعيش والعمل في ألمانيا.',
      readMore: 'اقرأ المزيد',
      noPosts: 'لم يتم العثور على مقالات.',
      author: 'الكاتب'
    },
    en: {
      title: 'German Blog',
      subtitle: 'Your complete guide and resources on relocating, living, and working in Germany.',
      readMore: 'Read More',
      noPosts: 'No blog posts found.',
      author: 'By'
    },
    de: {
      title: 'Deutschland Blog',
      subtitle: 'Ihr umfassender Leitfaden und Ressourcen für den Umzug, das Leben und Arbeiten in Deutschland.',
      readMore: 'Weiterlesen',
      noPosts: 'Keine Blogbeiträge gefunden.',
      author: 'Von'
    },
    fr: {
      title: 'Blog Allemagne',
      subtitle: 'Votre guide complet et ressources pour s\'installer, vivre et travailler en Allemagne.',
      readMore: 'Lire la suite',
      noPosts: 'Aucun article trouvé.',
      author: 'Par'
    }
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
          <BlogGrid>
            {posts.map((post) => {
              // Dynamically select the translated fields based on the locale
              const displayTitle =
                locale === 'ar' ? post.title_ar :
                locale === 'de' ? post.title_de :
                locale === 'fr' ? post.title_fr :
                post.title_en || post.title;

              const displayExcerpt =
                locale === 'ar' ? post.excerpt_ar :
                locale === 'de' ? post.excerpt_de :
                locale === 'fr' ? post.excerpt_fr :
                post.excerpt_en || post.excerpt;

              // Format date nicely based on locale
              const formattedDate = new Date(post.created_at).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });

              // Extract category or default
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
        )}
      </main>

      <Footer locale={locale} />
    </div>
  );
}
