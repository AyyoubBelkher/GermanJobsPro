import React from "react";

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 sm:w-64 bg-slate-800/80 rounded-xl" />
          <div className="h-4 w-64 sm:w-96 bg-slate-800/50 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-slate-800/80 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 bg-slate-800 rounded-lg" />
              <div className="h-4 w-12 bg-slate-800/60 rounded-md" />
            </div>
            <div className="h-4 w-full bg-slate-800/50 rounded-md" />
            <div className="h-4 w-3/4 bg-slate-800/40 rounded-md" />
            <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
              <div className="h-4 w-20 bg-slate-800/40 rounded-md" />
              <div className="h-8 w-24 bg-slate-800 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
