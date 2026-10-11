import React from "react";

export default function ApplicationsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-slate-800 rounded-xl" />
          <div className="h-4 w-72 bg-slate-800/60 rounded-lg" />
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60"
          >
            <div className="space-y-2">
              <div className="h-5 w-48 bg-slate-800 rounded-lg" />
              <div className="h-4 w-32 bg-slate-800/60 rounded-md" />
            </div>
            <div className="h-6 w-20 bg-slate-800/60 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
