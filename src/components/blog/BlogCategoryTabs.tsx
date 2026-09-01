"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

  const categories: Array<{ id: string; label: string; icon: string }> = [
    {
      id: "all",
      label: isAr ? "جميع المقالات" : isDe ? "Alle Beiträge" : isFr ? "Tous les articles" : "All Articles",
      icon: "🌐",
    },
    {
      id: "German A1",
      label: isAr ? "تعلم الألمانية A1" : isDe ? "Deutsch A1" : isFr ? "Allemand A1" : "German A1",
      icon: "🇩🇪",
    },
    {
      id: "Jobs",
      label: isAr ? "فرص العمل والتأشيرة" : isDe ? "Jobs & Karriere" : isFr ? "Emplois & Visa" : "Jobs & Career",
      icon: "💼",
    },
    {
      id: "General",
      label: isAr ? "دليل المعيشة والاستقرار" : isDe ? "Ratgeber & Leben" : isFr ? "Guides & Intégration" : "Guides & Life",
      icon: "📚",
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

    const queryString = params.toString();
    const newPath = queryString ? `/${locale}/blog?${queryString}` : `/${locale}/blog`;
    router.push(newPath);
  };

  return (
    <div className="w-full flex items-center justify-center mb-10 px-2">
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

        {/* Tab Container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollability}
          role="tablist"
          aria-label="Blog categories"
          className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-slate-900/95 border border-slate-800/90 backdrop-blur-xl shadow-xl shadow-slate-950/50 overflow-x-auto scroll-smooth scrollbar-none max-w-full"
        >
          {categories.map((cat) => {
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
                className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer select-none shrink-0 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 border border-blue-400/30 scale-[1.01]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-transparent"
                }`}
              >
                <span className="text-sm sm:text-base leading-none">{cat.icon}</span>
                <span>{cat.label}</span>
                {count !== undefined && count > 0 && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold transition-colors ${
                      isActive
                        ? "bg-blue-500/30 text-blue-100 border border-blue-300/30"
                        : "bg-slate-800 text-slate-400 border border-slate-700/50"
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
    </div>
  );
}
