"use client";

import React, { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

interface LandingFaqAccordionProps {
  items: FaqItem[];
}

export default function LandingFaqAccordion({ items }: LandingFaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
              isOpen
                ? "bg-slate-900/90 border-blue-500/40 shadow-xl shadow-blue-500/5"
                : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700/80"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              className="w-full py-4 px-6 text-start flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
              aria-expanded={isOpen}
            >
              <span className="font-bold text-white text-base sm:text-lg">
                {item.question}
              </span>
              <span
                className={`p-2 rounded-xl bg-slate-800/80 text-blue-400 shrink-0 transition-transform duration-300 ${
                  isOpen ? "rotate-180 bg-blue-600/20 text-blue-300" : ""
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </span>
            </button>

            {isOpen && (
              <div className="px-6 pb-5 pt-1 text-sm text-slate-300/90 leading-relaxed border-t border-slate-800/50">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
