import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";

import { getDB } from "../db";
import { sessions } from "../db/schemas";
import { generateSecureToken } from "../lib/crypto";

export async function createSession(c: Context, userId: string, ip: string, userAgent: string) {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(); // 7 days

  // const expiresAt = dayjs().add(7, 'days').toISOString(); // 7 días de duración
  // o en la zona del usuario si quieres, pero normalmente en UTC

  const env = c.env as { DB: D1Database };
  const db = getDB(env.DB);
  await db.insert(sessions).values({
    id: token,
    userId,
    ipAddress: ip,
    userAgent,
    expiresAt,
  });

  setCookie(c, "session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  });

  return token;
}

export async function revokeSession(c: Context, token: string) {
  const env = c.env as { DB: D1Database };
  const db = getDB(env.DB);
  await db.delete(sessions).where(eq(sessions.id, token));
  deleteCookie(c, "session");
}
