"use client";

import React, { useState } from "react";
import ATSTool from "./ATSTool";
import LebenslaufTool, { ATSImportedFix } from "./LebenslaufTool";

export interface ToolsHubProps {
  initialTab?: "ats" | "cv";
}

export default function ToolsHub({ initialTab = "ats" }: ToolsHubProps) {
  const [activeTab, setActiveTab] = useState<"ats" | "cv">(initialTab);
  const [importedFix, setImportedFix] = useState<ATSImportedFix | null>(null);

  return (
    <div className="w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans" dir="rtl">
      {/* HUB HEADER & TAB SELECTOR */}
      <div className="max-w-5xl mx-auto mb-8 space-y-6">
        <div className="flex flex-wrap items-center justify-center gap-2 p-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab("ats")}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
              activeTab === "ats"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <span>🎯 فاحص ATS</span>
            <span className="hidden sm:inline">• التدقيق والتوافق</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cv")}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-2 relative ${
              activeTab === "cv"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <span>📄 صانع السيرة الذاتية (DIN 5008)</span>
            {importedFix && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse absolute -top-1 -right-1" />
            )}
          </button>
        </div>
      </div>

      {/* ACTIVE TOOL VIEW */}
      <main className="max-w-6xl mx-auto">
        {activeTab === "ats" && (
          <ATSTool
            onApplyFixToBuilder={(fix) => {
              setImportedFix(fix);
              setActiveTab("cv");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}

        {activeTab === "cv" && (
          <LebenslaufTool
            importedFix={importedFix}
            onClearImportedFix={() => setImportedFix(null)}
          />
        )}
      </main>
    </div>
  );
}
