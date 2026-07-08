import { sValidator } from "@hono/standard-validator";
import { profileUpdatePasswordSchema, profileUpdateSchema } from "@savemony/shared";
import { eq } from "drizzle-orm";

import { getDB } from "../db";
import { user } from "../db/schemas";
import { hashPassword, verifyPassword } from "../lib/hash";
import { createProtectedRouter } from "../lib/hono";

const routes = createProtectedRouter();

routes.put("/", sValidator("json", profileUpdateSchema), async (c) => {
  try {
    const userSession = c.get("user");
    const { name, email } = c.req.valid("json");
    const db = getDB(c.env.DB);

    const userDB = await db.select().from(user).where(eq(user.id, userSession.id)).get();
    if (!userDB?.passwordHash) {
      return c.json({ error: "Usuario no encontrado" }, 404);
    }

    const updates: { name?: string; email?: string } = {};
    if (name) updates.name = name;
    if (email) updates.email = email;

    const updated = await db.update(user).set(updates).where(eq(user.id, userSession.id)).returning().get();

    return c.json({
      user: { id: updated?.id, email: updated?.email, name: updated?.name, role: updated?.role },
    });
  } catch (err: unknown) {
    console.error("Profile update error:", err);
    return c.json({ error: "Error interno del servidor. Intenta más tarde." }, 500);
  }
});

routes.put("/change-password", sValidator("json", profileUpdatePasswordSchema), async (c) => {
  try {
    const userSession = c.get("user");
    const { currentPassword, newPassword } = c.req.valid("json");
    const db = getDB(c.env.DB);
    const userDB = await db.select().from(user).where(eq(user.id, userSession.id)).get();
    if (!userDB?.passwordHash) {
      return c.json({ error: "Usuario no encontrado" }, 404);
    }

    if (currentPassword) {
      const valid = await verifyPassword(currentPassword, userDB.passwordHash);
      if (!valid) {
        return c.json({ error: "Contraseña actual incorrecta" }, 403);
      }
    }

    const updates: { passwordHash?: string } = {};
    if (newPassword) updates.passwordHash = await hashPassword(newPassword);

    const updated = await db.update(user).set(updates).where(eq(user.id, userSession.id)).returning().get();

    return c.json({
      user: { id: updated?.id, email: updated?.email, name: updated?.name, role: updated?.role },
    });
  } catch (err: unknown) {
    console.error("Profile update error:", err);
    return c.json({ error: "Error interno del servidor. Intenta más tarde." }, 500);
  }
});

export default routes;
