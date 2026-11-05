"use client";

import React, { useState, useEffect } from "react";

interface ThemeToggleProps {
  compact?: boolean;
}

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    function getSystemDark(): boolean {
      if (typeof window === "undefined" || !window.matchMedia) return false;
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    function determineActiveTheme(): boolean {
      try {
        const storedTheme = localStorage.getItem("gjp-theme");
        if (storedTheme === "dark") return true;
        if (storedTheme === "light") return false;
        return getSystemDark();
      } catch {
        return getSystemDark();
      }
    }

    // Determine initial active theme
    const activeDark = determineActiveTheme();
    setIsDark(activeDark);
    setMounted(true);

    // Attach listener to prefers-color-scheme
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      try {
        const storedTheme = localStorage.getItem("gjp-theme");
        if (!storedTheme || storedTheme === "system") {
          document.documentElement.classList.toggle("dark", e.matches);
          setIsDark(e.matches);
        }
      } catch {
        document.documentElement.classList.toggle("dark", e.matches);
        setIsDark(e.matches);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleMediaChange);
    }

    // Synchronize toggle instances across desktop and mobile
    const handleCustomThemeChange = () => {
      setIsDark(determineActiveTheme());
    };
    window.addEventListener("gjp-theme-change", handleCustomThemeChange);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      } else if ((mediaQuery as any).removeListener) {
        (mediaQuery as any).removeListener(handleMediaChange);
      }
      window.removeEventListener("gjp-theme-change", handleCustomThemeChange);
    };
  }, []);

  const handleToggle = () => {
    const nextIsDark = !isDark;
    const nextTheme = nextIsDark ? "dark" : "light";

    try {
      localStorage.setItem("gjp-theme", nextTheme);
    } catch {
      // ignore
    }

    document.documentElement.classList.toggle("dark", nextIsDark);
    setIsDark(nextIsDark);
    window.dispatchEvent(new Event("gjp-theme-change"));
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`${compact ? "p-1.5" : "p-2"} rounded-xl bg-[#0A2552] hover:bg-[#0E3572] text-[#FACC15] border border-white/10 hover:border-amber-400/50 transition-all cursor-pointer focus:outline-none active:scale-95 shadow-xs flex items-center justify-center`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {!mounted ? (
        <span className="w-4 h-4 block" aria-hidden="true" />
      ) : isDark ? (
        /* Inline SVG Sun icon when dark mode is active */
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        /* Inline SVG Moon icon when light mode is active */
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  );
}
