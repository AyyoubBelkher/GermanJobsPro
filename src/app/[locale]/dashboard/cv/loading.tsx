import React from "react";

export default function CvListLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-slate-800/80 rounded-xl" />
          <div className="h-4 w-80 bg-slate-800/50 rounded-lg" />
        </div>
        <div className="h-10 w-44 bg-slate-800/80 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4"
          >
            <div className="h-6 w-40 bg-slate-800 rounded-lg" />
            <div className="h-4 w-28 bg-slate-800/60 rounded-md" />
            <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
              <div className="h-8 w-20 bg-slate-800/60 rounded-xl" />
              <div className="h-8 w-24 bg-slate-800 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
