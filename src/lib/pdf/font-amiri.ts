import { Font } from "@react-pdf/renderer";

/**
 * Safely resolves local font file paths on the Node.js server without leaking
 * Node built-in imports (`fs`, `path`) into client-side bundles.
 */
export function resolveLocalFont(filename: string): string {
  if (typeof window === "undefined" && typeof process !== "undefined" && typeof process.cwd === "function") {
    try {
      // Server-only runtime resolution
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pathModule = require("path");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fsModule = require("fs");
      const localDiskPath = pathModule.resolve(process.cwd(), "public", "fonts", filename);
      if (fsModule.existsSync(localDiskPath)) {
        return localDiskPath;
      }
    } catch {
      // Fallback if filesystem access is restricted or during non-node execution
    }
  }
  return `/fonts/${filename}`;
}

let amiriRegistered = false;

/**
 * Registers the local Amiri font family with @react-pdf/renderer
 * and configures non-breaking hyphenation for Arabic text.
 */
export function registerAmiriFont(): void {
  if (amiriRegistered) return;

  try {
    Font.register({
      family: "Amiri",
      fonts: [
        {
          src: resolveLocalFont("Amiri-Regular.ttf"),
          fontWeight: "normal",
        },
        {
          src: resolveLocalFont("Amiri-Bold.ttf"),
          fontWeight: "bold",
        },
        {
          src: resolveLocalFont("Amiri-Italic.ttf"),
          fontStyle: "italic",
        },
      ],
    });

    // Prevent breaking Arabic words with hyphens
    Font.registerHyphenationCallback((word) => [word]);
    amiriRegistered = true;
  } catch {
    // Already registered or unsupported environment
  }
}

// Auto-register on import
registerAmiriFont();

export const ARABIC_REGEX = /[\u0600-\u06FF]/;

/**
 * Returns true if any of the provided strings contain Arabic Unicode characters.
 */
export function containsArabic(...strings: (string | null | undefined)[]): boolean {
  return strings.some((s) => s && ARABIC_REGEX.test(s));
}
