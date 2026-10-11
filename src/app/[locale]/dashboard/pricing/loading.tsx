import React from "react";

export default function PricingLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-10 animate-pulse">
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="h-8 w-60 bg-slate-800 rounded-xl mx-auto" />
        <div className="h-4 w-80 bg-slate-800/60 rounded-lg mx-auto" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6"
          >
            <div className="h-6 w-32 bg-slate-800 rounded-lg" />
            <div className="h-10 w-24 bg-slate-800 rounded-xl" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-800/60 rounded" />
              <div className="h-4 w-5/6 bg-slate-800/60 rounded" />
              <div className="h-4 w-4/6 bg-slate-800/60 rounded" />
            </div>
            <div className="h-11 w-full bg-slate-800 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
