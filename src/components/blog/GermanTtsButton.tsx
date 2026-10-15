"use client";

import React, { useEffect, useMemo, useState } from "react";

// ==========================================
// Text Sanitization for German Pronunciation
// ==========================================

/**
 * Sanitizes input text so only clean, natural German words and punctuation are spoken.
 * Strips bracketed phonetics, Arabic characters, leading bullets/numbers, and normalizes symbols.
 */
export function cleanGermanForSpeech(rawText: string): string {
  if (!rawText) return "";

  let text = rawText;

  // 1. Remove bracketed phonetics: e.g. [guten tahk] or [ ]
  text = text.replace(/\[[^\]]*\]/g, " ");
  text = text.replace(/[\[\]][^\[\]]*[\[\]]/g, " ");
  text = text.replace(/[\[\]]/g, " ");

  // 2. Remove Arabic characters and Arabic presentation forms
  text = text.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g, " ");

  // 3. Replace arrows and equals signs with a natural pause comma
  text = text.replace(/(?:->|→|=>|⇒|=|↔|<->)/g, ", ");

  // 4. Strip leading bullets, numbers, dashes, colons, emojis, or speech bubble icons
  text = text.replace(/^[\s\uFEFF\u200E\u200F•\-\*🗣️💬:\d\.\)\(–—]+/g, "");

  // 5. Remove unwanted symbols while preserving German letters (ä, ö, ü, Ä, Ö, Ü, ß) and sentence punctuation (. , ? ! - ')
  text = text.replace(/[\/\\_~#*^|<>«»"„"]/g, " ");

  // 6. Clean duplicate punctuation and extra whitespace
  text = text.replace(/,\s*,+/g, ", ");
  text = text.replace(/\s+/g, " ");
  text = text.trim();

  // 7. Strip trailing or leading punctuation leftovers
  text = text.replace(/^[,\s\-]+|[,\s\-]+$/g, "").trim();

  // Max 220 characters
  if (text.length > 220) {
    text = text.slice(0, 220).trim();
  }

  return text;
}

// ==========================================
// Global TTS Playback Manager
// ==========================================

type AudioStateListener = (activeText: string | null) => void;

const listeners = new Set<AudioStateListener>();
let currentActiveText: string | null = null;
let currentAudio: HTMLAudioElement | null = null;
let safetyTimeout: NodeJS.Timeout | null = null;

function notifyListeners(text: string | null) {
  currentActiveText = text;
  listeners.forEach((listener) => {
    try {
      listener(currentActiveText);
    } catch (_) {}
  });
}

/**
 * Subscribes to global audio playback state changes.
 */
export function subscribeAudioState(listener: AudioStateListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Returns currently playing German text, or null if idle.
 */
export function getCurrentActiveText(): string | null {
  return currentActiveText;
}

/**
 * Stops any active speech synthesis or HTML5 audio playback immediately.
 */
export function stopGermanSpeech() {
  if (safetyTimeout) {
    clearTimeout(safetyTimeout);
    safetyTimeout = null;
  }

  if (typeof window !== "undefined") {
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
  }

  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (_) {}
    currentAudio = null;
  }

  notifyListeners(null);
}

/**
 * Plays German audio via the server-side fallback endpoint /api/tts?text=...
 */
function playServerAudio(cleanText: string) {
  if (typeof window === "undefined") return;

  try {
    const audioUrl = `/api/tts?text=${encodeURIComponent(cleanText)}`;
    const audio = new Audio(audioUrl);
    currentAudio = audio;

    const cleanup = () => {
      if (currentAudio === audio) {
        currentAudio = null;
      }
      if (currentActiveText === cleanText) {
        notifyListeners(null);
      }
    };

    audio.onended = cleanup;
    audio.onerror = cleanup;
    audio.onpause = () => {
      if (currentAudio === audio && audio.ended) {
        cleanup();
      }
    };

    audio.play().catch((err) => {
      console.warn("[TTS Fallback Audio Play Failed]:", err);
      cleanup();
    });
  } catch (err) {
    console.warn("[TTS Fallback Creation Failed]:", err);
    notifyListeners(null);
  }
}

/**
 * Preferred German voice names in order of quality.
 */
const PREFERRED_VOICES = [
  "google deutsch",
  "microsoft katja online (natural) - german (germany)",
  "microsoft katja",
  "microsoft conrad online (natural) - german (germany)",
  "microsoft conrad",
  "anna",
  "helena",
  "viktor",
  "marlene",
  "martin",
  "petra",
  "yannick",
];

const FEMALE_KEYWORDS = [
  "katja",
  "anna",
  "helena",
  "marlene",
  "vicki",
  "hedda",
  "gisela",
  "petra",
  "female",
  "weiblich",
  "frau",
];

const MALE_KEYWORDS = [
  "conrad",
  "viktor",
  "stefan",
  "martin",
  "yannick",
  "hans",
  "male",
  "männlich",
  "herr",
];

/**
 * Hybrid German Text-to-Speech playback function:
 * 1. Checks window.speechSynthesis for authentic German (de-DE) voices (rate: 0.88).
 * 2. If unsupported, no German voice installed, or on error/hang, automatically falls back to /api/tts.
 * 3. Stops any previously playing audio to prevent audio overlap.
 */
export function speakGermanText(rawText: string, genderHint?: "male" | "female") {
  const clean = cleanGermanForSpeech(rawText);
  if (!clean) return;

  // Toggle off if clicking the currently active playing text
  if (currentActiveText === clean) {
    stopGermanSpeech();
    return;
  }

  // Stop previous sound before initiating new playback
  stopGermanSpeech();
  notifyListeners(clean);

  // Check if Web Speech API is supported
  const hasSpeechSynthesis =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance !== "undefined";

  if (!hasSpeechSynthesis) {
    playServerAudio(clean);
    return;
  }

  try {
    const allVoices = window.speechSynthesis.getVoices() || [];
    const germanVoices = allVoices.filter(
      (v) => v.lang && v.lang.toLowerCase().replace(/_/g, "-").startsWith("de")
    );

    // If 0 German voices are installed (common on Linux/Fedora & mobile WebViews), use server fallback
    if (germanVoices.length === 0) {
      playServerAudio(clean);
      return;
    }

    // Voice Selection Strategy
    let selectedVoice: SpeechSynthesisVoice | null = null;

    if (genderHint === "female") {
      const femaleCandidates = germanVoices.filter((v) =>
        FEMALE_KEYWORDS.some((kw) => v.name.toLowerCase().includes(kw))
      );
      if (femaleCandidates.length > 0) {
        selectedVoice =
          femaleCandidates.find((v) =>
            PREFERRED_VOICES.some((pref) => v.name.toLowerCase().includes(pref))
          ) || femaleCandidates[0];
      }
    } else if (genderHint === "male") {
      const maleCandidates = germanVoices.filter((v) =>
        MALE_KEYWORDS.some((kw) => v.name.toLowerCase().includes(kw))
      );
      if (maleCandidates.length > 0) {
        selectedVoice =
          maleCandidates.find((v) =>
            PREFERRED_VOICES.some((pref) => v.name.toLowerCase().includes(pref))
          ) || maleCandidates[0];
      }
    }

    // If no gender-specific voice picked, try preferred natural voices
    if (!selectedVoice) {
      for (const pref of PREFERRED_VOICES) {
        const found = germanVoices.find((v) =>
          v.name.toLowerCase().includes(pref)
        );
        if (found) {
          selectedVoice = found;
          break;
        }
      }
    }

    // Final voice fallback: Germany (de-DE) or first de voice
    if (!selectedVoice) {
      selectedVoice =
        germanVoices.find(
          (v) => v.lang.toLowerCase().replace(/_/g, "-") === "de-de"
        ) || germanVoices[0];
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "de-DE";
    utterance.rate = 0.88; // Slightly slower rate for clear A1 comprehension
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    let fallbackTriggered = false;
    let speechStarted = false;

    // Safety timeout: if SpeechSynthesis engine silently hangs without firing onstart/onerror (e.g. Linux without speech-dispatcher), fallback seamlessly
    safetyTimeout = setTimeout(() => {
      if (!speechStarted && !fallbackTriggered && currentActiveText === clean) {
        fallbackTriggered = true;
        try {
          window.speechSynthesis.cancel();
        } catch (_) {}
        playServerAudio(clean);
      }
    }, 1200);

    utterance.onstart = () => {
      speechStarted = true;
      if (safetyTimeout) {
        clearTimeout(safetyTimeout);
        safetyTimeout = null;
      }
    };

    utterance.onend = () => {
      if (safetyTimeout) {
        clearTimeout(safetyTimeout);
        safetyTimeout = null;
      }
      if (!fallbackTriggered && currentActiveText === clean) {
        notifyListeners(null);
      }
    };

    utterance.onerror = (e) => {
      if (safetyTimeout) {
        clearTimeout(safetyTimeout);
        safetyTimeout = null;
      }
      if (e.error === "canceled" || e.error === "interrupted") {
        return;
      }
      if (!fallbackTriggered) {
        fallbackTriggered = true;
        playServerAudio(clean);
      }
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("[TTS SpeechSynthesis invocation failed, falling back]:", err);
    playServerAudio(clean);
  }
}

// Pre-load voices if supported by the browser
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      try {
        window.speechSynthesis.getVoices();
      } catch (_) {}
    };
  } catch (_) {}
}

// ==========================================
// React Hook for Active TTS State
// ==========================================

export function useIsGermanPlaying(rawText: string): boolean {
  const clean = useMemo(() => cleanGermanForSpeech(rawText), [rawText]);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const handleActiveChange = (activeText: string | null) => {
      setIsPlaying(activeText !== null && activeText === clean);
    };

    handleActiveChange(getCurrentActiveText());
    return subscribeAudioState(handleActiveChange);
  }, [clean]);

  return isPlaying;
}

// ==========================================
// German TTS Button Component
// ==========================================

export interface GermanTtsButtonProps {
  text: string;
  genderHint?: "male" | "female";
  size?: "sm" | "md";
  label?: string;
  variant?: "blue" | "emerald" | "amber" | "slate";
  className?: string;
  title?: string;
}

export function GermanTtsButton({
  text,
  genderHint,
  size = "md",
  label,
  variant = "blue",
  className = "",
  title,
}: GermanTtsButtonProps) {
  const isPlaying = useIsGermanPlaying(text);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    speakGermanText(text, genderHint);
  };

  // Color Styles based on variant and playing state
  const variantStyles = {
    blue: isPlaying
      ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400/60 dark:ring-blue-500/80 scale-105"
      : "bg-blue-50 hover:bg-blue-100/90 text-blue-700 border border-blue-200/80 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 dark:text-blue-300 dark:border-blue-800/60 shadow-2xs hover:shadow-xs",
    emerald: isPlaying
      ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/60 dark:ring-emerald-500/80 scale-105"
      : "bg-emerald-50 hover:bg-emerald-100/90 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-800/60 shadow-2xs hover:shadow-xs",
    amber: isPlaying
      ? "bg-amber-600 text-white shadow-md ring-2 ring-amber-400/60 dark:ring-amber-500/80 scale-105"
      : "bg-amber-50 hover:bg-amber-100/90 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-300 dark:border-amber-800/60 shadow-2xs hover:shadow-xs",
    slate: isPlaying
      ? "bg-slate-800 text-white shadow-md ring-2 ring-slate-400/60 dark:bg-slate-200 dark:text-slate-900 scale-105"
      : "bg-slate-100 hover:bg-slate-200/90 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700 shadow-2xs hover:shadow-xs",
  };

  const sizeStyles =
    size === "sm"
      ? "p-1.5 text-xs rounded-xl"
      : "px-2.5 py-1 text-xs sm:text-sm rounded-xl";

  const accessibleTitle = isPlaying
    ? "إيقاف الاستماع للنطق بالألمانية"
    : title || "استمع للنطق بالألمانية (de-DE)";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={accessibleTitle}
      title={accessibleTitle}
      className={`inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-150 cursor-pointer select-none shrink-0 active:scale-95 ${variantStyles[variant]} ${sizeStyles} ${className}`}
    >
      {isPlaying ? (
        // Animated Soundwave Equalizer
        <span className="flex items-center gap-0.5 h-3.5 px-0.5" aria-hidden="true">
          <span className="w-0.5 h-2 bg-current rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
          <span className="w-0.5 h-3.5 bg-current rounded-full animate-[pulse_0.6s_ease-in-out_0.2s_infinite]" />
          <span className="w-0.5 h-2.5 bg-current rounded-full animate-[pulse_0.6s_ease-in-out_0.4s_infinite]" />
          <span className="w-0.5 h-3 bg-current rounded-full animate-[pulse_0.6s_ease-in-out_0.1s_infinite]" />
        </span>
      ) : (
        // Speaker Audio Icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"}
          aria-hidden="true"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}

      {label ? <span className="font-semibold">{label}</span> : null}
    </button>
  );
}

export default GermanTtsButton;
