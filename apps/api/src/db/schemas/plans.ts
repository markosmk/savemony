import type { FrequencyType } from "@savemony/shared";
import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { users } from "./auth";

export const plans = sqliteTable(
  "plans",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    goalAmount: integer("goal_amount"), // null si es Flexible
    endDate: text("end_date"), // null si es Flexible, ISO string en UTC
    frequencyType: text("frequency_type", {
      enum: ["DAILY", "WEEKDAYS", "WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM_DAYS"],
    }).notNull(),
    customDays: text("custom_days", { mode: "json" }), // JSON array de números (0=Dom, 6=Sáb) para CUSTOM_DAYS
    suggestedQuota: integer("suggested_quota"), // calculado (o personalizado) en centavos
    quickAmounts: text("quick_amounts", { mode: "json" }), // JSON array de montos fijos (opcional)
    isFlexible: integer("is_flexible", { mode: "boolean" }).notNull().default(false),
    status: text("status", { enum: ["active", "completed", "archived"] })
      .notNull()
      .default("active"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [index("plans_user_id_idx").on(table.userId), index("plans_status_idx").on(table.status)],
);

export const planRelations = relations(plans, ({ many }) => ({
  entries: many(entries),
}));

export type PlanSelect = typeof plans.$inferSelect;
export type PlanInsert = typeof plans.$inferInsert;
export type PlanUpdate = Omit<PlanInsert, "id" | "userId" | "createdAt"> & {
  // updatedAt?: string;
  name?: string;
  frequencyType?: FrequencyType;
};

export const entries = sqliteTable(
  "entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // ISO string (fecha del movimiento, en UTC)
    amount: integer("amount").notNull(), // en centavos
    type: text("type", { enum: ["deposit", "withdrawal"] }).notNull(),
    reason: text("reason"), // motivo del retiro (opcional para depósitos)
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()), // nowUTC()), // Siempre UTC
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [index("entries_plan_id_idx").on(table.planId), index("entries_date_idx").on(table.date)],
);

export const entriesRelations = relations(entries, ({ one }) => ({
  plan: one(plans, {
    fields: [entries.planId],
    references: [plans.id],
  }),
}));

export type EntrySelect = typeof entries.$inferSelect;
export type EntryInsert = typeof entries.$inferInsert;
export type EntryUpdate = Omit<EntryInsert, "id" | "planId" | "createdAt">;
