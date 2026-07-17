import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { users } from "./auth";

export const settings = sqliteTable("settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  language: text("language").notNull().default("es"),
  reminderEnabled: integer("reminder_enabled", { mode: "boolean" }).notNull().default(true),
  achievementNotifs: integer("achievement_notifs", { mode: "boolean" }).notNull().default(true),
  weeklySummary: integer("weekly_summary", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, {
    fields: [settings.userId],
    references: [users.id],
  }),
}));

export type Settings = typeof settings.$inferSelect;
export type SettingsInsert = typeof settings.$inferInsert;
export type SettingsUpdate = Omit<SettingsInsert, "id" | "userId" | "createdAt" | "updatedAt">;
