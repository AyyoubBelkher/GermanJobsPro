/**
 * Unified Gumroad Pricing Variant Configuration
 *
 * NOTE / ASSUMPTION:
 * The live Gumroad product tier names in your Gumroad Dashboard must correspond to these variant names.
 * The webhook handler in src/app/api/payments/gumroad-webhook/route.ts recognizes:
 * - 90-day PRO passes via price >= $15.00, variant name including "90", or /pro\s*job\s*pass/i
 * - 30-day passes otherwise (Quick Sprint)
 *
 * TODO: Confirm the exact variant strings in the Gumroad Dashboard (Products -> Variants)
 * if custom variant labels are modified on the live store.
 */

export const GUMROAD_VARIANTS = {
  SPRINT_30D: "Quick Sprint (30 Days)",
  PRO_90D: "PRO Job Pass (90 Days)",
} as const;

export type GumroadVariant = (typeof GUMROAD_VARIANTS)[keyof typeof GUMROAD_VARIANTS];
