/**
 * Deterministic location and city extraction utilities for German CV and Cover Letter generation.
 */

const COUNTRY_NAMES_REGEX = new RegExp(
  "^(?:" +
    [
      // Germany
      "Deutschland", "Germany", "Allemagne", "ألمانيا",
      // Morocco
      "Marokko", "Morocco", "Maroc", "المغرب",
      // Austria
      "Österreich", "Austria", "Autriche", "النمسا",
      // Switzerland
      "Schweiz", "Switzerland", "Suisse", "سويسرا",
      // France
      "Frankreich", "France", "فرنسا",
      // Tunisia
      "Tunesien", "Tunisia", "Tunisie", "تونس",
      // Egypt
      "Ägypten", "Egypt", "Egypte", "مصر",
      // Algeria
      "Algerien", "Algeria", "Algérie", "الجزائر",
      // Belgium
      "Belgien", "Belgium", "Belgique", "بلجيكا",
      // Netherlands
      "Niederlande", "Netherlands", "Pays-Bas", "هولندا",
      // Spain
      "Spanien", "Spain", "Espagne", "إسبانيا",
      // Italy
      "Italien", "Italy", "Italie", "إيطاليا",
      // UK & USA
      "Vereinigtes Königreich", "United Kingdom", "UK", "Royaume-Uni",
      "USA", "United States", "Vereinigte Staaten",
    ].join("|") +
    ")$",
  "i"
);

// Compound street suffixes (German) and standalone prefixes across German, English, French, and Arabic
export const STREET_OR_RURAL_PATTERN =
  /(?:stra(?:ß|ss)e|str\.?|weg|platz|gasse|allee|chaussee|damm|ufer|ring|pfad)\b|\b(?:douar|dchar|dwar|rue|avenue|ave\.?|boulevard|blvd\.?|bd\.?|road|rd\.?|lane|ln\.?|drive|dr\.?|street|st\.?|hay|quartier|lotissement|lot\.?|residence|résidence|res\.?|derb|zenqa|immeuble|imm\.?|appt\.?|appartement|apt\.?|bâtiment|bat\.?|etage|étage|n°|nr\.?|hausnummer|postfach|p\.o\.\s*box|شارع|طريق|نهج|حي|دوار|زنقة|درب|مجمع|عمارة|شقة|إقامة|تجزئة)\b/i;

export function isStreetOrRuralPart(str: string): boolean {
  return STREET_OR_RURAL_PATTERN.test(str);
}

const PURE_HOUSE_NUMBER_OR_CODE = /^\d+[a-zA-Z]?(?:\s*[-/]\s*\d+[a-zA-Z]?)?$/;

/**
 * Strips leading/trailing postal codes (e.g. "10115 Berlin", "D-80331 München", "30000 Fès").
 */
function cleanPostalCode(str: string): string {
  return str
    .replace(/^(?:(?:D|A|CH)-)?\d{4,5}\s+/, "")
    .replace(/\s+(?:(?:D|A|CH)-)?\d{4,5}$/, "")
    .trim();
}

/**
 * Conservatively and deterministically extracts the city/municipality name
 * from an address string for use on the signature line ("Ort, Datum").
 *
 * Never alters stored candidate address records.
 *
 * Examples:
 * - "Douar Ain Boumasaai, Tissa, Taounate, Marokko" -> "Tissa"
 * - "Musterstraße 12, 10115 Berlin, Deutschland" -> "Berlin"
 * - "Avenue Hassan II, Taounate, Morocco" -> "Taounate"
 * - "10115 Berlin" -> "Berlin"
 * - "D-80331 München" -> "München"
 * - "Quartier Al Quds, Casablanca, Maroc" -> "Casablanca"
 */
export function extractCityFromAddress(
  address?: string | null,
  fallback = "Deutschland"
): string {
  if (!address || typeof address !== "string" || !address.trim()) {
    return fallback;
  }

  // Normalize delimiters (standard comma and Arabic comma)
  const normalized = address.replace(/،/g, ",").trim();
  const rawParts = normalized
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (rawParts.length === 0) {
    return fallback;
  }

  // Single segment handling
  if (rawParts.length === 1) {
    const single = cleanPostalCode(rawParts[0]);
    if (!COUNTRY_NAMES_REGEX.test(single) && !isStreetOrRuralPart(single) && !PURE_HOUSE_NUMBER_OR_CODE.test(single)) {
      return single || fallback;
    }
    // If it's pure country or street only, never return a street/country as city
    return fallback;
  }

  // Multi-segment address analysis
  // 1. Separate segments into country, street/rural/unit, and candidate localities
  const localityCandidates: string[] = [];

  for (const part of rawParts) {
    const cleaned = cleanPostalCode(part);
    if (!cleaned) continue;

    const isCountry = COUNTRY_NAMES_REGEX.test(cleaned);
    if (isCountry) continue;

    const isHouseNumber = PURE_HOUSE_NUMBER_OR_CODE.test(cleaned);
    if (isHouseNumber) continue;

    const isStreetOrRural = isStreetOrRuralPart(part) || isStreetOrRuralPart(cleaned);
    if (isStreetOrRural) {
      continue;
    }

    localityCandidates.push(cleaned);
  }

  // If we found locality candidate(s):
  // When multiple localities are given (e.g. ["Tissa", "Taounate"]), the first non-street
  // segment designates the specific municipal town ("Tissa"), while following segments
  // represent province/region ("Taounate").
  if (localityCandidates.length > 0) {
    const chosen = localityCandidates[0];
    if (chosen.length >= 2) {
      return chosen;
    }
  }

  // Fallback: Check if any part contains an embedded postal code + city
  for (let i = rawParts.length - 1; i >= 0; i--) {
    const part = rawParts[i];
    if (COUNTRY_NAMES_REGEX.test(part)) continue;
    const stripped = cleanPostalCode(part);
    if (stripped && !isStreetOrRuralPart(stripped) && !PURE_HOUSE_NUMBER_OR_CODE.test(stripped) && stripped.length >= 2) {
      return stripped;
    }
  }

  // Final fallback to the last non-country part or standard fallback
  const nonCountryParts = rawParts.filter((p) => !COUNTRY_NAMES_REGEX.test(cleanPostalCode(p)));
  if (nonCountryParts.length > 0) {
    const lastPart = cleanPostalCode(nonCountryParts[nonCountryParts.length - 1]);
    if (
      lastPart &&
      lastPart.length >= 2 &&
      !isStreetOrRuralPart(lastPart) &&
      !PURE_HOUSE_NUMBER_OR_CODE.test(lastPart)
    ) {
      return lastPart;
    }
  }

  return fallback;
}

/**
 * Extracts candidate initials for executive monogram badges and crests.
 * Examples:
 * - "Dr. Max Mustermann" -> "MM"
 * - "Anas El Amrani" -> "AA"
 * - "John" -> "JO"
 */
export function getInitials(name?: string | null): string {
  if (!name || typeof name !== "string") return "B";
  const cleaned = name.replace(/^(Dr\.|Prof\.|Herr|Frau|Mr\.|Ms\.|Mrs\.)\s+/i, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "B";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
