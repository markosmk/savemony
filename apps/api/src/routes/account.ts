import { sValidator } from "@hono/standard-validator";
import { profileUpdateSchema, updatePasswordSchema } from "@savemony/shared";
import { eq } from "drizzle-orm";
import { deleteCookie } from "hono/cookie";

import { getDB } from "../db";
import { plans, sessions, settings, users } from "../db/schemas";
import { hashPassword, verifyPassword } from "../lib/hash";
import { createProtectedRouter } from "../lib/hono";

const routes = createProtectedRouter();

// PUT /api/account
routes.put("/", sValidator("json", profileUpdateSchema), async (c) => {
  try {
    const userSession = c.get("user");
    const { name, email } = c.req.valid("json");
    const db = getDB(c.env.DB);

    const userDB = await db.select().from(users).where(eq(users.id, userSession.id)).get();
    if (!userDB?.passwordHash) {
      return c.json({ error: "Usuario no encontrado" }, 404);
    }

    const updates: { name?: string; email?: string } = {};
    if (name) updates.name = name;
    if (email) updates.email = email;

    const updated = await db.update(users).set(updates).where(eq(users.id, userSession.id)).returning().get();

    return c.json({
      success: true,
      user: { id: updated?.id, email: updated?.email, name: updated?.name },
    });
  } catch (err: unknown) {
    console.error("Profile update error:", err);
    return c.json({ success: false, error: "Error interno del servidor. Intenta más tarde." }, 500);
  }
});

// PUT /api/account/change-password
routes.put("/change-password", sValidator("json", updatePasswordSchema), async (c) => {
  try {
    const userSession = c.get("user");
    const { currentPassword, newPassword } = c.req.valid("json");
    const db = getDB(c.env.DB);
    const userDB = await db.select().from(users).where(eq(users.id, userSession.id)).get();
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

    const updated = await db.update(users).set(updates).where(eq(users.id, userSession.id)).returning().get();

    return c.json({
      success: true,
      user: { id: updated?.id, email: updated?.email, name: updated?.name },
    });
  } catch (err: unknown) {
    console.error("Profile update error:", err);
    return c.json({ success: false, error: "Error interno del servidor. Intenta más tarde." }, 500);
  }
});

// DELETE /api/account/me
// - Borrar sesiones
// - Borrar settings
// - Borrar plans (cascade cells, timeline)
// - Borrar achievements
// - Borrar user
// - Invalidar cookie
routes.delete("/", async (c) => {
  try {
    const userSession = c.get("user");
    const db = getDB(c.env.DB);

    // Es altamente recomendable usar una transacción para que, si algo falla a la mitad,
    // no dejes la base de datos inconsistente.
    await db.transaction(async (tx) => {
      // 1. Borrar planes (y sus tablas hijas relacionadas como cells o timeline
      // si Drizzle o tu BD no tienen ON DELETE CASCADE).
      // await tx.delete(planTimeline).where(eq(planTimeline.userId, userSession.id));
      // await tx.delete(planCell).where(eq(planCell.userId, userSession.id));
      await tx.delete(plans).where(eq(plans.userId, userSession.id));

      // 3. Borrar settings
      await tx.delete(settings).where(eq(settings.userId, userSession.id));

      // 4. Borrar sesiones activas (para que cierre sesión en todos sus dispositivos)
      await tx.delete(sessions).where(eq(sessions.userId, userSession.id));

      // 5. Finalmente, borrar el usuario
      await tx.delete(users).where(eq(users.id, userSession.id));
    });

    // 6. Invalidar la cookie en el navegador del cliente
    // Cambia "auth_session" por el nombre real de la cookie que uses en tu app
    deleteCookie(c, "auth_session", {
      path: "/",
      secure: c.env.ENVIRONMENT === "production",
      httpOnly: true,
      sameSite: "Lax",
    });

    return c.json({ success: true, message: "Cuenta eliminada correctamente" });
  } catch (err: unknown) {
    console.error("Error al borrar cuenta:", err);
    return c.json({ success: false, error: "Error interno al intentar eliminar la cuenta." }, 500);
  }
});

export default routes;
