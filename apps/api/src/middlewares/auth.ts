import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";
import { deleteCookie, getCookie } from "hono/cookie";

import { getDB } from "../db";
import type { User } from "../db/schemas";
import { sessions, users } from "../db/schemas";

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
  const sessionDB = await db.select().from(sessions).where(eq(sessions.id, sessionToken)).get();

  const now = new Date().toISOString();
  if (!sessionDB || now > sessionDB.expiresAt) {
    deleteCookie(c, "session");
    return c.json({ error: "Sesión expirada o inexistente" }, 401);
  }

  const userDB = await db.select().from(users).where(eq(users.id, sessionDB.userId)).get();
  if (!userDB) {
    return c.json({ error: "Usuario no encontrado" }, 404);
  }

  c.set("user", userDB);
  c.set("sessionId", sessionDB.id);
  await next();
}
