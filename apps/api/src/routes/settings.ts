import { sValidator } from "@hono/standard-validator";
import { settingsUpdateSchema } from "@savemony/shared";
import { eq } from "drizzle-orm";

import { getDB } from "../db";
import { type SettingsInsert, type SettingsUpdate, settings } from "../db/schemas";
import { createProtectedRouter } from "../lib/hono";

const routes = createProtectedRouter();

const defaultSettings: Omit<SettingsInsert, "id" | "userId"> = {
  currency: "USD",
  language: "en",
  defaultMethod: "custom_grid",
  reminderEnabled: 1,
  achievementNotifs: 1,
  weeklySummary: 1,
  onboardingCompleted: 0,
  image: "",
  locale: "en",
} as const;

routes.get("/", async (c) => {
  const user = c.get("user");
  const db = getDB(c.env.DB);

  let userSettings = await db.select().from(settings).where(eq(settings.userId, user.id)).get();

  if (userSettings) {
    return c.json({ success: true, settings: userSettings });
  }

  // Usamos try/catch por si otra request paralela ya la creó (race condition)
  try {
    const newSettings = await db
      .insert(settings)
      .values({
        id: crypto.randomUUID(),
        userId: user.id,
        ...defaultSettings,
      })
      .returning()
      .get();

    return c.json({ success: true, settings: newSettings });
  } catch (err) {
    // 4. Si falló por constraint (ya existe), leer de nuevo
    userSettings = await db.select().from(settings).where(eq(settings.userId, user.id)).get();

    if (userSettings) {
      return c.json({ success: true, settings: userSettings });
    }

    throw err; // Error real, no race condition
  }
});

routes.put("/", sValidator("json", settingsUpdateSchema), async (c) => {
  try {
    const userSession = c.get("user");
    const data = c.req.valid("json");
    const db = getDB(c.env.DB);

    const userDB = await db.select().from(settings).where(eq(settings.userId, userSession.id)).get();
    if (!userDB) {
      return c.json({ error: "Usuario no encontrado" }, 404);
    }

    const updates: SettingsUpdate = {
      name: data.name || "",
      currency: data.currency,
      language: data.language,
      defaultMethod: data.defaultMethod,
      reminderEnabled: data.reminderEnabled ? 1 : 0,
      achievementNotifs: data.achievementNotifs ? 1 : 0,
      weeklySummary: data.weeklySummary ? 1 : 0,
    };

    // Opcionales solo si vienen
    if (data.locale !== undefined) updates.locale = data.locale;
    if (data.image !== undefined) updates.image = data.image;
    if (data.onboardingCompleted !== undefined) updates.onboardingCompleted = data.onboardingCompleted ? 1 : 0;

    const updated = await db.update(settings).set(updates).where(eq(settings.userId, userSession.id)).returning().get();

    return c.json({
      success: true,
      settings: { ...updated },
    });
  } catch (err: unknown) {
    console.error("Profile update error:", err);
    return c.json({ error: "Error interno del servidor. Intenta más tarde." }, 500);
  }
});

export default routes;
