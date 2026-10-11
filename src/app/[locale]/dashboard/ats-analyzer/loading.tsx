import React from "react";

export default function AtsAnalyzerLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 animate-pulse">
      <div className="space-y-2 text-center max-w-xl mx-auto">
        <div className="h-8 w-64 bg-slate-800 rounded-xl mx-auto" />
        <div className="h-4 w-96 bg-slate-800/60 rounded-lg mx-auto" />
      </div>

      <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-6">
        <div className="h-40 bg-slate-950/80 rounded-2xl border border-dashed border-slate-800" />
        <div className="h-12 w-48 bg-slate-800 rounded-xl mx-auto" />
      </div>
    </div>
  );
}
