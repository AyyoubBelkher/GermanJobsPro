"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isCourseLesson } from "@/lib/courseUtils";

export interface CategoryOption {
  id: string;
  name: string;
  icon: string;
}

interface BlogCategoryTabsProps {
  locale: string;
  activeCategory: string;
  counts?: Record<string, number>;
}

export default function BlogCategoryTabs({
  locale,
  activeCategory = "all",
  counts = {},
}: BlogCategoryTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);

  const isAr = locale === "ar";
  const isDe = locale === "de";
  const isFr = locale === "fr";

  const isA1Active = isCourseLesson(activeCategory);

  const mainTracks = [
    {
      id: "articles",
      label: isAr
        ? "📰 المقالات والأدلة المهنية"
        : isDe
        ? "📰 Fachartikel & Ratgeber"
        : isFr
        ? "📰 Articles & Guides Carrière"
        : "📰 Career Guides & Articles",
      count: counts["total"],
      isActive: !isA1Active,
      onClick: () => {
        router.push(`/${locale}/blog`);
      },
    },
    {
      id: "lessons",
      label: isAr
        ? "📚 كورس الألمانية A1 (الدروس الصوتية)"
        : isDe
        ? "📚 Deutsch A1 Kurs (Audio)"
        : isFr
        ? "📚 Cours d'allemand A1 (Audio)"
        : "📚 German A1 Course (Audio)",
      count: counts["German A1"],
      isActive: isA1Active,
      onClick: () => {
        router.push(`/${locale}/blog?category=German+A1`);
      },
    },
  ];

  const subCategories: Array<{ id: string; label: string; icon: string }> = [
    {
      id: "all",
      label: isAr ? "جميع المقالات" : isDe ? "Alle Artikel" : isFr ? "Tous les articles" : "All Articles",
      icon: "🌐",
    },
    {
      id: "Jobs",
      label: isAr ? "فرص العمل والتأشيرة" : isDe ? "Jobs & Visum" : isFr ? "Emplois & Visa" : "Jobs & Visa",
      icon: "💼",
    },
    {
      id: "General",
      label: isAr ? "دليل المعيشة والاستقرار" : isDe ? "Ratgeber & Leben" : isFr ? "Guides & Vie" : "Guides & Life",
      icon: "📖",
    },
  ];

  const checkScrollability = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    
    // In RTL, scrollLeft can be negative or inverted depending on browser engine
    const maxScroll = scrollWidth - clientWidth;
    const absScroll = Math.abs(scrollLeft);

    if (maxScroll <= 4) {
      setCanScrollStart(false);
      setCanScrollEnd(false);
      return;
    }

    if (isAr) {
      setCanScrollStart(absScroll > 4);
      setCanScrollEnd(absScroll < maxScroll - 4);
    } else {
      setCanScrollStart(scrollLeft > 4);
      setCanScrollEnd(scrollLeft < maxScroll - 4);
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener("resize", checkScrollability);
    return () => window.removeEventListener("resize", checkScrollability);
  }, [isAr]);

  const handleCategorySelect = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId === "all") {
      params.delete("category");
    } else {
      params.set("category", categoryId);
    }
    params.delete("page"); // Reset to page 1 on category switch
    if (categoryId.toLowerCase() !== "german a1") {
      params.delete("sort"); // Clear A1 course sorting when navigating to other categories
    }

    const queryString = params.toString();
    const newPath = queryString ? `/${locale}/blog?${queryString}` : `/${locale}/blog`;
    router.push(newPath);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4 mb-10 px-2">
      {/* Platform Track Switcher: Articles vs Course Lessons */}
      <div
        role="tablist"
        aria-label="Platform section switcher"
        className="inline-flex p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl max-w-full overflow-x-auto"
      >
        {mainTracks.map((track) => (
          <button
            key={track.id}
            role="tab"
            aria-selected={track.isActive}
            type="button"
            onClick={track.onClick}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer select-none ${
              track.isActive
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/30 scale-[1.01]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-transparent"
            }`}
          >
            <span>{track.label}</span>
            {track.count !== undefined && track.count > 0 && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold transition-colors ${
                  track.isActive
                    ? "bg-white/20 text-white border border-white/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700/60"
                }`}
              >
                {track.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Subcategory Pills for Articles Track */}
      {!isA1Active && (
        <div className="relative max-w-full group">
          {/* Mobile Edge Fade Indicator: Start */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 start-0 w-8 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10 rounded-s-2xl transition-opacity duration-300 sm:hidden ${
              canScrollStart ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Mobile Edge Fade Indicator: End */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 end-0 w-8 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent z-10 rounded-e-2xl transition-opacity duration-300 sm:hidden ${
              canScrollEnd ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Subcategory Scroll Container */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollability}
            role="tablist"
            aria-label="Article categories"
            className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-lg shadow-slate-950/40 overflow-x-auto scroll-smooth scrollbar-none max-w-full"
          >
            {subCategories.map((cat) => {
              const isActive =
                activeCategory.toLowerCase() === cat.id.toLowerCase() ||
                (cat.id === "all" && (!activeCategory || activeCategory === "all"));

              const count = counts[cat.id] ?? (cat.id === "all" ? counts["total"] : undefined);

              return (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer select-none shrink-0 ${
                    isActive
                      ? "bg-slate-800 text-blue-400 shadow-md border border-blue-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <span className="text-sm leading-none">{cat.icon}</span>
                  <span>{cat.label}</span>
                  {count !== undefined && count > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold transition-colors ${
                        isActive
                          ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                          : "bg-slate-800 text-slate-500 border border-slate-700/40"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
