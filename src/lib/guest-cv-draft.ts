/**
 * Utilities for client-side Guest DIN 5008 CV draft persistence and handoff.
 * Operates purely on sessionStorage with zero backend mutations or AI calls.
 */

export const GUEST_CV_DRAFT_KEY = "gjp_guest_cv_draft";

export interface GuestCvDraft {
  fullName: string;
  targetJobTitle: string;
  location: string;
  currentRole: string;
  keyBullet: string;
  languageLevel: string;
  language?: string;
  savedAt?: string;
}

/**
 * Serializes guest CV draft to JSON safely.
 */
export function serializeGuestCvDraft(draft: Partial<GuestCvDraft>): string {
  const safeDraft: GuestCvDraft = {
    fullName: (draft.fullName || "").trim(),
    targetJobTitle: (draft.targetJobTitle || "").trim(),
    location: (draft.location || "").trim(),
    currentRole: (draft.currentRole || "").trim(),
    keyBullet: (draft.keyBullet || "").trim(),
    languageLevel: (draft.languageLevel || "B2").trim(),
    language: draft.language || "de",
    savedAt: new Date().toISOString(),
  };

  return JSON.stringify(safeDraft);
}

/**
 * Safely parses guest CV draft from raw JSON string with graceful fallback.
 * Returns null if string is empty, null, undefined, or malformed.
 */
export function parseGuestCvDraft(raw: string | null | undefined): GuestCvDraft | null {
  if (!raw || typeof raw !== "string") {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed || trimmed.charAt(0) !== "{") {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    // Sanitize string fields
    const fullName = typeof parsed.fullName === "string" ? parsed.fullName.trim() : "";
    const targetJobTitle = typeof parsed.targetJobTitle === "string" ? parsed.targetJobTitle.trim() : "";
    const location = typeof parsed.location === "string" ? parsed.location.trim() : "";
    const currentRole = typeof parsed.currentRole === "string" ? parsed.currentRole.trim() : "";
    const keyBullet = typeof parsed.keyBullet === "string" ? parsed.keyBullet.trim() : "";
    const languageLevel = typeof parsed.languageLevel === "string" ? parsed.languageLevel.trim() : "B2";
    const language = typeof parsed.language === "string" ? parsed.language.trim() : "de";
    const savedAt = typeof parsed.savedAt === "string" ? parsed.savedAt : undefined;

    // Must contain at least one meaningful field
    if (!fullName && !targetJobTitle && !currentRole) {
      return null;
    }

    return {
      fullName,
      targetJobTitle,
      location,
      currentRole,
      keyBullet,
      languageLevel,
      language,
      savedAt,
    };
  } catch {
    return null;
  }
}
