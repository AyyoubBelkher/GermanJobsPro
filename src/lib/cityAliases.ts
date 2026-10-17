/**
 * Bidirectional German/Arabic City Aliases for Job Listings
 * Maps German and Arabic city variants so job searches and filters match records
 * stored in either language.
 */

export const CITY_ALIAS_GROUPS: string[][] = [
  ["Berlin", "برلين"],
  ["München", "Munich", "ميونخ", "ميونيخ"],
  ["Hamburg", "هامبورغ"],
  ["Frankfurt", "فرانكفورت"],
  ["Köln", "Cologne", "كولن", "كولونيا"],
  ["Stuttgart", "شتوتغارت"],
  ["Düsseldorf", "دوسلدورف"],
  ["Leipzig", "لايبزيغ"],
  ["Dortmund", "دورتموند"],
  ["Essen", "إسن", "إيسن"],
  ["Bremen", "بريمن"],
  ["Dresden", "درسدن"],
  ["Hannover", "هانوفر"],
  ["Nürnberg", "نورنبرغ"],
  ["Aachen", "آخن"],
];

/**
 * Returns all bidirectional city variants (German and Arabic) for a given city name or query term.
 * If the term matches an alias group, returns all variants from that group.
 * If no group matches, returns [term].
 */
export function getCityVariants(cityOrTerm: string): string[] {
  if (!cityOrTerm) return [];
  const normalized = cityOrTerm.trim().toLowerCase();
  if (!normalized) return [];

  const matched = new Set<string>();

  for (const group of CITY_ALIAS_GROUPS) {
    const isMatch = group.some((variant) => {
      const v = variant.toLowerCase();
      if (normalized === v) return true;
      // Also match if variant appears as a distinct word within a longer query phrase
      const regex = new RegExp(`(^|\\s|[.,!?;:()[\\]{}"'/])${v}($|\\s|[.,!?;:()[\\]{}"'/])`, "i");
      return regex.test(normalized);
    });

    if (isMatch) {
      for (const variant of group) {
        matched.add(variant);
      }
    }
  }

  if (matched.size === 0) {
    matched.add(cityOrTerm.trim());
  }

  return Array.from(matched);
}
