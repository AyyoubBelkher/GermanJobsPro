import React from "react";

export default function CoverLetterEditorLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6 animate-pulse">
      <div className="h-4 w-48 bg-slate-800 rounded-md" />
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="h-6 w-56 bg-slate-800 rounded-lg" />
        <div className="h-9 w-28 bg-slate-800 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="h-4 w-32 bg-slate-800 rounded" />
            <div className="h-10 bg-slate-950 rounded-xl" />
            <div className="h-10 bg-slate-950 rounded-xl" />
          </div>
        </div>
        <div className="lg:col-span-8">
          <div className="h-[550px] rounded-3xl bg-slate-900 border border-slate-800" />
        </div>
      </div>
    </div>
  );
}
