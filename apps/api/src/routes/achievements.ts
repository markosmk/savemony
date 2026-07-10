import type { AchievementDTO } from "@savemony/shared";
import { eq } from "drizzle-orm";

import { getDB } from "../db";
import { achievement, userAchievements } from "../db/schemas";
import { createProtectedRouter } from "../lib/hono";

const routes = createProtectedRouter();

// GET /api/achievements
routes.get("/", async (c) => {
  const userId = c.get("user").id;
  const db = getDB(c.env.DB);

  const [allAchievements, unlocked] = await Promise.all([
    db.select().from(achievement).all(),
    db
      .select({
        achievementId: userAchievements.achievementId,
        unlockedAt: userAchievements.unlockedAt,
      })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .all(),
  ]);

  const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

  const formatted = allAchievements.map((item) => ({
    ...item,
    isUnlocked: unlockedMap.has(item.id),
    unlockedAt: unlockedMap.get(item.id) || null,
  }));

  return c.json<AchievementDTO[]>(formatted);
});

export default routes;
