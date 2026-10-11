import React from "react";

export default function CvEditorLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-48 bg-slate-800 rounded-md" />

      {/* Editor top bar skeleton */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="h-6 w-56 bg-slate-800 rounded-lg" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-24 bg-slate-800 rounded-xl" />
          <div className="h-9 w-28 bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* Two-column editor skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="h-6 w-40 bg-slate-800 rounded-lg" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-slate-950 rounded-xl" />
              <div className="h-10 bg-slate-950 rounded-xl" />
            </div>
            <div className="h-10 bg-slate-950 rounded-xl" />
          </div>
        </div>
        <div className="lg:col-span-5 hidden lg:block">
          <div className="h-[600px] rounded-3xl bg-slate-900 border border-slate-800" />
        </div>
      </div>
    </div>
  );
}
