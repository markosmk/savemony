import { sValidator } from "@hono/standard-validator";
import { loginSchema, registerSchema, sessionRevokeSchema } from "@savemony/shared";
import { eq } from "drizzle-orm";
import { getCookie } from "hono/cookie";

import { getDB } from "../db";
import { referral, session, user } from "../db/schemas";
import { hashPassword, verifyPassword } from "../lib/hash";
import { createPublicRouter } from "../lib/hono";
import { authMiddleware, createSession, revokeSession } from "../middlewares/auth";

const routes = createPublicRouter();

routes.post("/register", sValidator("json", registerSchema), async (c) => {
  try {
    const { email, password, name, referredBy } = c.req.valid("json");
    const db = getDB(c.env.DB);

    const existingUser = await db.select().from(user).where(eq(user.email, email.toLowerCase())).get();
    if (existingUser) {
      return c.json({ error: "El email ya está registrado" }, 400);
    }

    const newUserId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    // await db.transaction(async (tx) => {
    await db.insert(user).values({
      id: newUserId,
      email: email.toLowerCase(),
      passwordHash,
      name: name || "",
    });

    if (referredBy) {
      // Verificar que el referente existe
      const referrerExists = await db.select().from(user).where(eq(user.id, referredBy)).get();
      if (referrerExists) {
        await db.insert(referral).values({
          id: crypto.randomUUID(),
          referrerId: referredBy,
          referredId: newUserId,
          status: "pending",
        });
      }
    }
    // });

    return c.json({ success: true, userId: newUserId });
  } catch (err: unknown) {
    console.error("Register error:", err);
    return c.json({ error: "Error interno del servidor. Intenta más tarde." }, 500);
  }
});

routes.post("/login", sValidator("json", loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid("json");

    const db = getDB(c.env.DB);
    const userDb = await db.select().from(user).where(eq(user.email, email.toLowerCase())).get();
    if (!userDb?.passwordHash) {
      return c.json({ error: "Credenciales inválidas" }, 401);
    }

    const valid = await verifyPassword(password, userDb.passwordHash);
    if (!valid) {
      return c.json({ error: "Credenciales inválidas" }, 401);
    }

    const ip = c.req.header("x-forwarded-for") || "127.0.0.1";
    const ua = c.req.header("user-agent") || "Desconocido";
    await createSession(c, userDb.id, ip, ua);

    return c.json({
      user: { id: userDb.id, email: userDb.email, name: userDb.name, role: userDb.role },
    });
  } catch (err: unknown) {
    console.error("Login error:", err);
    return c.json({ error: "Error interno del servidor. Intenta más tarde." }, 500);
  }
});

routes.post("/logout", async (c) => {
  const token = getCookie(c, "session");
  if (token) {
    await revokeSession(c, token);
  }
  return c.json({ success: true });
});

routes.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  const sessionId = c.get("sessionId");
  return c.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, currentSessionId: sessionId },
  });
});

routes.get("/sessions/:userId", authMiddleware, async (c) => {
  const userId = c.req.param("userId");
  if (!userId) {
    return c.json({ error: "ID de usuario requerido" }, 400);
  }
  const db = getDB(c.env.DB);
  const list = await db.select().from(session).where(eq(session.userId, userId)).all();
  return c.json(list);
});

routes.post("/sessions/revoke", authMiddleware, sValidator("json", sessionRevokeSchema), async (c) => {
  try {
    const { sessionId } = c.req.valid("json") as { sessionId: string };
    const db = getDB(c.env.DB);
    await db.delete(session).where(eq(session.id, sessionId));
    return c.json({ success: true });
  } catch (err: unknown) {
    console.error("Session revoke error:", err);
    return c.json({ error: "Error interno del servidor. Intenta más tarde." }, 500);
  }
});

// TODO: restore password..

export default routes;
