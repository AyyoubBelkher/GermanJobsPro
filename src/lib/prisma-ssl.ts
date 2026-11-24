/**
 * Pure PostgreSQL connection string & TLS configuration helpers.
 * Safe to import in unit tests and Next.js build contexts without initializing PrismaClient.
 */

/**
 * Normalizes PostgreSQL connection string by adding uselibpqcompat=true
 * when sslmode is 'require', 'prefer', or 'verify-ca' to eliminate Node 22 / pg SSL warnings.
 */
export function normalizeConnectionString(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const sslmode = parsed.searchParams.get("sslmode");
    if (sslmode && ["require", "prefer", "verify-ca"].includes(sslmode.toLowerCase())) {
      if (!parsed.searchParams.has("uselibpqcompat")) {
        parsed.searchParams.set("uselibpqcompat", "true");
      }
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Builds `pg.Pool` SSL options for a PostgreSQL connection string.
 * - Returns `false` when `sslmode=disable` (e.g. local/dummy build URLs).
 * - Otherwise enables strict TLS certificate verification (`rejectUnauthorized: true`) by default,
 *   allowing opt-out only when `DATABASE_SSL_REJECT_UNAUTHORIZED === "false"`.
 */
export function buildPgSslConfig(
  connectionString: string,
  envRejectUnauthorized: string | undefined = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED
): false | { rejectUnauthorized: boolean } {
  try {
    const parsed = new URL(connectionString);
    const sslmode = parsed.searchParams.get("sslmode")?.toLowerCase();
    if (sslmode === "disable") {
      return false;
    }
  } catch {
    if (/sslmode=disable/i.test(connectionString)) {
      return false;
    }
  }

  return {
    rejectUnauthorized: envRejectUnauthorized !== "false",
  };
}
