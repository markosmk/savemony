import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const settings = sqliteTable("settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" })
    .unique(),
  currency: text("currency").notNull().default("CLP"),
  locale: text("locale").notNull().default("en"),
  language: text("language").notNull().default("en"),
  reminderEnabled: integer("reminder_enabled").notNull().default(1), // 1 = true, 0 = false
  achievementNotifs: integer("achievement_notifs").notNull().default(1),
  weeklySummary: integer("weekly_summary").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Settings = typeof settings.$inferSelect;
export type SettingsInsert = typeof settings.$inferInsert;
export type SettingsUpdate = Omit<SettingsInsert, "id" | "userId" | "createdAt" | "updatedAt">;
