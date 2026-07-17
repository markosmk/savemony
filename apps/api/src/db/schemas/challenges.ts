import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { users } from "./auth";

export const challenges = sqliteTable("challenges", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(), // ej: 'week_streak', 'save_50k'
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 'streak', 'amount', 'cells', 'no_spend', 'referral'
  targetValue: integer("target_value").notNull(),
  durationDays: integer("duration_days"), // null = ilimitado
  rewardPoints: integer("reward_points").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const userChallenges = sqliteTable(
  "user_challenges",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    challengeId: text("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("active"), // 'active', 'completed', 'failed', 'cancelled'
    currentProgress: integer("current_progress").notNull().default(0),
    startedAt: text("started_at").$defaultFn(() => new Date().toISOString()),
    completedAt: text("completed_at"),
    expiresAt: text("expires_at"), // ISO string si tenía duration_days
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [uniqueIndex("user_challenge_unique_idx").on(table.userId, table.challengeId)],
);

export type ChallengeSelect = typeof challenges.$inferSelect;
export type ChallengeInsert = typeof challenges.$inferInsert;
export type ChallengeUpdate = Omit<ChallengeInsert, "id" | "createdAt" | "updatedAt">;

export type UserChallengeSelect = typeof userChallenges.$inferSelect;
export type UserChallengeInsert = typeof userChallenges.$inferInsert;
export type UserChallengeUpdate = Omit<
  UserChallengeInsert,
  "id" | "userId" | "challengeId" | "startedAt" | "completedAt" | "expiresAt" | "updatedAt"
>;
