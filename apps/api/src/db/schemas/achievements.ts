import { relations } from "drizzle-orm";
import { sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

import { users } from "./auth";

export const achievements = sqliteTable("achievements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  condition: text("condition").notNull(),
});

export const userAchievements = sqliteTable(
  "user_achievements",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: text("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    unlockedAt: text("unlocked_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [unique("unq_user_achievement").on(table.userId, table.achievementId)],
);

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

export type Achievement = typeof achievements.$inferSelect;
export type AchievementInsert = typeof achievements.$inferInsert;
