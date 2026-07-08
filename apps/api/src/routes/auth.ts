import { sValidator } from "@hono/standard-validator";
import {
  confirmEmailSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  sessionRevokeSchema,
} from "@savemony/shared";
import { and, eq } from "drizzle-orm";
import { getCookie } from "hono/cookie";

import { getDB } from "../db";
import { referral, session, user, type VerificationInsert, verification } from "../db/schemas";
import { generateSecureToken } from "../lib/crypto";
import { sendEmail } from "../lib/email";
import { hashPassword, hashToken, verifyPassword } from "../lib/hash";
import { createPublicRouter } from "../lib/hono";
import { authMiddleware, createSession, revokeSession } from "../middlewares/auth";

const routes = createPublicRouter();

routes.post("/register", sValidator("json", registerSchema), async (c) => {
  try {
    const { email, password, name, referredBy } = c.req.valid("json");
    const db = getDB(c.env.DB);
    const resendKey = c.env.RESEND_API_KEY;
    const frontendUrl = c.env.FRONTEND_URL;

    const existingUser = await db.select().from(user).where(eq(user.email, email.toLowerCase())).get();
    if (existingUser) {
      return c.json({ error: "El email ya está registrado" }, 400);
    }

    const newUserId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    // create user
    await db.insert(user).values({
      id: newUserId,
      email: email.toLowerCase(),
      passwordHash,
      name: name || "",
    });

    // create verification token for email verification
    const plainToken = generateSecureToken();
    const tokenHash = await hashToken(plainToken);

    await db.insert(verification).values({
      id: crypto.randomUUID(),
      userId: newUserId,
      type: "email_verification",
      token: tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    await sendEmail(
      {
        to: email.toLowerCase(),
        subject: "Verificá tu email en Savemony",
        html: `<p>Bienvenido! Hacé clic para verificar tu email:</p>
           <a href="${frontendUrl}/verify-email?token=${plainToken}">
             ${frontendUrl}/verify-email?token=${plainToken}
           </a>`,
      },
      resendKey,
    );

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

routes.post("/verify-email/request", authMiddleware, async (c) => {
  const userId = c.get("user").id;
  const db = getDB(c.env.DB);
  const frontendUrl = c.env.FRONTEND_URL;
  const resendKey = c.env.RESEND_API_KEY;

  // Si ya está verificado, no molestar
  const me = await db.select().from(user).where(eq(user.id, userId)).get();
  if (!me) return c.json({ error: "Usuario no encontrado" }, 404);
  if (me.emailVerified) return c.json({ error: "Email ya verificado" }, 400);

  // Invalidar tokens anteriores del mismo tipo
  await db
    .delete(verification)
    .where(and(eq(verification.userId, user.id), eq(verification.type, "email_verification")));

  const plainToken = generateSecureToken();
  const tokenHash = await hashToken(plainToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

  const verifyData: VerificationInsert = {
    id: crypto.randomUUID(),
    userId: me.id,
    type: "email_verification",
    token: tokenHash,
    expiresAt,
  };

  await db.insert(verification).values(verifyData);

  const verifyUrl = `${frontendUrl}/verify-email?token=${tokenHash}`;

  await sendEmail(
    {
      to: me.email,
      subject: "Verificá tu email en Savemony",
      html: `<p>Hacé clic para verificar tu email:</p><a href="${verifyUrl}">${verifyUrl}</a>`,
    },
    resendKey,
  );

  return c.json({ success: true });
});

routes.post("/verify-email/confirm", sValidator("json", confirmEmailSchema), async (c) => {
  const { token } = c.req.valid("json");
  const db = getDB(c.env.DB);

  const tokenHash = await hashToken(token);
  const record = await db
    .select()
    .from(verification)
    .where(and(eq(verification.token, tokenHash), eq(verification.type, "email_verification")))
    .get();

  if (!record) return c.json({ error: "Token inválido" }, 400);
  if (record.usedAt) return c.json({ error: "Token ya usado" }, 400);
  if (new Date(record.expiresAt) < new Date()) {
    return c.json({ error: "Token expirado" }, 400);
  }

  // Marcar email verificado
  await db.update(user).set({ emailVerified: true, updatedAt: new Date() }).where(eq(user.id, record.userId));

  // Marcar token usado
  await db.update(verification).set({ usedAt: new Date().toISOString() }).where(eq(verification.id, record.id));

  return c.json({ success: true });
});

routes.post("/forgot-password", sValidator("json", forgotPasswordSchema), async (c) => {
  const { email } = c.req.valid("json");
  const db = getDB(c.env.DB);

  const frontendUrl = c.env.FRONTEND_URL;
  const resendKey = c.env.RESEND_API_KEY;

  // IMPORTANTE: Siempre devolver 200, aunque el email no exista
  // para evitar enumeración de usuarios
  const targetUser = await db.select().from(user).where(eq(user.email, email.toLowerCase())).get();

  if (!targetUser) {
    console.log("intentando resertear contraseña, No existe el usuario", email);
    return c.json({ success: true }); // ← no revelar que no existe
  }

  // Invalidar tokens previos
  await db
    .delete(verification)
    .where(and(eq(verification.userId, targetUser.id), eq(verification.type, "password_reset")));

  const plainToken = generateSecureToken();
  const tokenHash = await hashToken(plainToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h

  await db.insert(verification).values({
    id: crypto.randomUUID(),
    userId: targetUser.id,
    type: "password_reset",
    token: tokenHash,
    expiresAt,
  });

  const resetUrl = `${frontendUrl}/reset-password?token=${tokenHash}`;

  await sendEmail(
    {
      to: targetUser.email,
      subject: "Reseteo de contraseña en Savemony",
      html: `<p>Hacé clic para resetear tu contraseña:</p><a href="${resetUrl}">${resetUrl}</a>`,
    },
    resendKey,
  );

  return c.json({ success: true });
});

routes.post("/reset-password", sValidator("json", resetPasswordSchema), async (c) => {
  const { token, newPassword } = c.req.valid("json");
  const db = getDB(c.env.DB);

  const tokenHash = await hashToken(token);
  const record = await db
    .select()
    .from(verification)
    .where(and(eq(verification.token, tokenHash), eq(verification.type, "password_reset")))
    .get();

  if (!record) return c.json({ error: "Token inválido" }, 400);
  if (record.usedAt) return c.json({ error: "Token ya usado" }, 400);
  if (new Date(record.expiresAt) < new Date()) {
    return c.json({ error: "Token expirado" }, 400);
  }

  const passwordHash = await hashPassword(newPassword);

  await db.update(user).set({ passwordHash, updatedAt: new Date() }).where(eq(user.id, record.userId));

  await db.update(verification).set({ usedAt: new Date().toISOString() }).where(eq(verification.id, record.id));

  return c.json({ success: true });
});

export default routes;
