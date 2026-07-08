import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

import { getDB } from "../db";
import type { User } from "../db/schemas";
import { session, user } from "../db/schemas";

export type Variables = {
  user: User;
  sessionId: string;
};

export async function authMiddleware(c: Context<{ Bindings: { DB: D1Database }; Variables: Variables }>, next: Next) {
  const sessionToken = getCookie(c, "session");
  if (!sessionToken) {
    return c.json({ error: "No autenticado" }, 401);
  }

  const db = getDB(c.env.DB);
  const sessionDB = await db.select().from(session).where(eq(session.id, sessionToken)).get();

  if (!sessionDB || new Date() > sessionDB.expiresAt) {
    deleteCookie(c, "session");
    return c.json({ error: "Sesión expirada o inexistente" }, 401);
  }

  const userDB = await db.select().from(user).where(eq(user.id, sessionDB.userId)).get();
  if (!userDB) {
    return c.json({ error: "Usuario no encontrado" }, 404);
  }

  c.set("user", userDB);
  c.set("sessionId", sessionDB.id);
  await next();
}

export function requireRole(role: "admin" | "user") {
  return async (c: Context<{ Bindings: { DB: D1Database }; Variables: Variables }>, next: Next) => {
    const user = c.get("user");
    if (user.role !== role && user.role !== "admin") {
      return c.json({ error: "Permisos insuficientes" }, 403);
    }
    await next();
  };
}

export async function createSession(c: Context, userId: string, ip: string, userAgent: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  const env = c.env as { DB: D1Database };
  const db = getDB(env.DB);
  await db.insert(session).values({
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
  await db.delete(session).where(eq(session.id, token));
  deleteCookie(c, "session");
}

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}
