import React from "react";
import BlogGrid from "@/components/ui/BlogGrid";

export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header section skeleton */}
        <div className="text-center space-y-4 animate-pulse">
          <div className="h-10 bg-slate-800/60 rounded-xl w-48 sm:w-64 mx-auto" />
          <div className="h-6 bg-slate-800/40 rounded-lg w-72 sm:w-96 mx-auto" />
          <div className="h-1 w-20 bg-slate-800/60 mx-auto rounded-full" />
        </div>

        {/* Posts grid skeleton */}
        <BlogGrid>
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col h-full bg-slate-900/30 rounded-2xl border border-slate-800/80 overflow-hidden animate-pulse"
            >
              {/* Image Skeleton */}
              <div className="aspect-video w-full bg-slate-800/50" />

              {/* Content Skeleton */}
              <div className="flex-1 p-6 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  {/* Meta (Date) */}
                  <div className="h-3.5 bg-slate-800/60 rounded w-24" />
                  
                  {/* Title */}
                  <div className="space-y-2">
                    <div className="h-5 bg-slate-800/70 rounded-md w-5/6" />
                    <div className="h-5 bg-slate-800/70 rounded-md w-1/2" />
                  </div>
                  
                  {/* Excerpt */}
                  <div className="space-y-2">
                    <div className="h-3.5 bg-slate-800/40 rounded w-full" />
                    <div className="h-3.5 bg-slate-800/40 rounded w-11/12" />
                    <div className="h-3.5 bg-slate-800/40 rounded w-4/5" />
                  </div>
                </div>

                {/* Footer (Divider & Read More) */}
                <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
                  <div className="h-4 bg-slate-800/60 rounded w-16" />
                  <div className="h-4 bg-slate-800/60 rounded w-12" />
                </div>
              </div>
            </div>
          ))}
        </BlogGrid>
      </div>
    </div>
  );
}
