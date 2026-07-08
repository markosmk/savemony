import { sql } from "drizzle-orm";
import {sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const achievement = sqliteTable("achievement", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
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
      .references(() => user.id, { onDelete: "cascade" }),
    achievementId: text("achievement_id")
      .notNull()
      .references(() => achievement.id, { onDelete: "cascade" }),
    unlockedAt: text("unlocked_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [unique("unq_user_achievement").on(table.userId, table.achievementId)],
);

export type Achievement = typeof achievement.$inferSelect;
export type AchievementInsert = typeof achievement.$inferInsert;