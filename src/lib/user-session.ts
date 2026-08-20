import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const SCRYPT_PREFIX = "scrypt:16:64:16384:8:1";
const SALT_SIZE = 16;
const KEY_LEN = 64;
const SESSION_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Hashes a plaintext password using Node.js native crypto.scrypt with a random 16-byte salt.
 * Formats output as: scrypt:16:64:16384:8:1:<saltHex>:<hashHex>
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }

  const salt = crypto.randomBytes(SALT_SIZE);

  return new Promise<string>((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LEN, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return reject(err);
      const hashStr = `${SCRYPT_PREFIX}:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
      resolve(hashStr);
    });
  });
}

/**
 * Verifies a plaintext password against a stored scrypt hash using timing-safe comparison.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash || typeof password !== "string" || typeof storedHash !== "string") {
    return false;
  }

  const parts = storedHash.split(":");
  if (parts.length !== 8 || parts[0] !== "scrypt") {
    return false;
  }

  const saltHex = parts[6];
  const originalHashHex = parts[7];

  if (!saltHex || !originalHashHex) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const originalHash = Buffer.from(originalHashHex, "hex");

  return new Promise<boolean>((resolve) => {
    crypto.scrypt(password, salt, KEY_LEN, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return resolve(false);

      if (derivedKey.length !== originalHash.length) {
        return resolve(false);
      }

      const isMatch = crypto.timingSafeEqual(derivedKey, originalHash);
      resolve(isMatch);
    });
  });
}

/**
 * Generates a SHA-256 hash of a raw session token.
 */

/**
 * Creates a new user session in the database.
 * Generates a 32-byte (64 hex char) random token, stores ONLY SHA-256(token) in DB,
 * and returns the un-hashed raw token for cookie setting.
 */
export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  if (!userId || typeof userId !== "string") {
    throw new Error("userId must be a non-empty string");
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + SESSION_EXPIRATION_MS);

  await prisma.userSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    token: rawToken,
    expiresAt,
  };
}

/**
 * Verifies a raw session token against the UserSession database table.
 * Hashes the input token with SHA-256 and fetches matching active session and user info.
 */
export async function verifyUserSession(token?: string | null): Promise<{
  session: { id: string; userId: string; expiresAt: Date };
  user: { id: string; email: string; name: string | null };
} | null> {
  if (!token || typeof token !== "string" || token.trim() === "") {
    return null;
  }

  const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");

  try {
    const sessionRecord = await prisma.userSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!sessionRecord) {
      return null;
    }

    if (sessionRecord.expiresAt < new Date()) {
      // Async clean up of expired session
      prisma.userSession.delete({ where: { id: sessionRecord.id } }).catch(() => {});
      return null;
    }

    return {
      session: {
        id: sessionRecord.id,
        userId: sessionRecord.userId,
        expiresAt: sessionRecord.expiresAt,
      },
      user: sessionRecord.user,
    };
  } catch {
    return null;
  }
}

/**
 * Revokes a user session by deleting its corresponding record from the database using raw token SHA-256 hash.
 */
export async function revokeUserSession(token?: string | null): Promise<boolean> {
  if (!token || typeof token !== "string" || token.trim() === "") {
    return false;
  }

  const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");

  try {
    const result = await prisma.userSession.deleteMany({
      where: { tokenHash },
    });

    return result.count > 0;
  } catch {
    return false;
  }
}
