import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Configure WebSocket constructor for Node.js / Serverless runtimes
if (!neonConfig.webSocketConstructor && typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * Initializes and caches PrismaClient instance using PrismaNeon serverless adapter over WebSockets (port 443).
 * Eliminates TCP 5432 timeouts, manages Neon compute cold starts, and ensures reliable serverless pooling.
 */
function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

  if (!connectionString) {
    console.warn("[Prisma] Warning: DATABASE_URL is not set in environment variables.");
  }

  const adapter = new PrismaNeon(
    {
      connectionString,
    },
    {
      onPoolError: (err) => {
        console.error("[Neon Pool Error]:", err.message);
      },
      onConnectionError: (err) => {
        console.error("[Neon Connection Error]:", err.message);
      },
    }
  );

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = getPrismaClient();
export default prisma;
