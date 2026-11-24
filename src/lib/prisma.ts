import "dotenv/config";
import { Pool as PgPool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

export type ExtendedPrismaClient = PrismaClient;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: PgPool;
};

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

const TRANSIENT_DB_ERROR_PATTERNS = [
  "can't reach database server",
  "timeout exceeded when trying to connect",
  "connection terminated",
  "econnreset",
  "etimedout",
  "p1001",
  "p1002",
  "p1008",
  "p1017",
  "57p01",
];

function isTransientDbError(error: unknown): boolean {
  if (!error) return false;
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  const code = (error as { code?: string }).code ? String((error as { code?: string }).code).toLowerCase() : "";
  return TRANSIENT_DB_ERROR_PATTERNS.some(
    (pattern) => msg.includes(pattern) || code.includes(pattern)
  );
}

/**
 * Retries a database operation when transient connection/pool/timeout errors occur.
 * Uses exponential backoff before throwing.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 600
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > retries || !isTransientDbError(err)) {
        throw err;
      }
      console.warn(
        `[withDbRetry] Transient DB error caught on attempt ${attempt}/${retries}. Retrying in ${delayMs * Math.pow(2, attempt - 1)}ms...`,
        err instanceof Error ? err.message : err
      );
      await new Promise((res) => setTimeout(res, delayMs * Math.pow(2, attempt - 1)));
    }
  }
}

/**
 * Native PostgreSQL TCP client over port 5432 using @prisma/adapter-pg.
 * Eliminates WebSocket handshake timeouts (ETIMEDOUT) while fulfilling engineType="client".
 */
function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL or DIRECT_URL in environment configuration.");
  }

  let pool = globalForPrisma.pgPool;
  if (!pool) {
    pool = new PgPool({
      connectionString: normalizeConnectionString(connectionString),
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      connectionTimeoutMillis: 20000,
      idleTimeoutMillis: 15000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      allowExitOnIdle: true,
    });

    pool.on("error", (err) => {
      console.warn("[PgPool Idle Client Warning]:", err.message);
    });

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.pgPool = pool;
    }
  }

  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  globalForPrisma.prisma = client;
  return client;
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

