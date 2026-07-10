import { relations, sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";
import { cell } from "./cell";
import { timeline } from "./timeline";

export const plan = sqliteTable(
  "plan",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category"),
    targetAmount: real("target_amount").notNull(),
    currentAmount: real("current_amount").notNull().default(0.0),
    method: text("method").notNull().default("custom_grid"),
    gridRows: integer("grid_rows").notNull().default(6),
    gridCols: integer("grid_cols").notNull().default(7),
    rebalanceMode: text("rebalance_mode").notNull().default("proportional"),
    frequency: text("frequency").notNull().default("daily"),
    minAmount: real("min_amount").notNull().default(0.0),
    maxAmount: real("max_amount").notNull().default(0.0),
    deadline: text("deadline"),
    status: text("status").notNull().default("active"), // "active", "completed", "paused"
    streak: integer("streak").notNull().default(0),
    // lastSaveDate is a date of bussiness. Only changes when the user really puts money (marks a cell).
    lastSaveDate: text("last_save_date"),
    // for visibility: when status is completed, then user not want see this plan in the main screen, so this flag is used to hide the plan from the main screen and only show it in the archive screen
    archived: integer("archived").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_plans_user_id").on(table.userId)],
);

export const planRelations = relations(plan, ({ many }) => ({
  cells: many(cell),
  timelines: many(timeline),
}));

export type Plan = typeof plan.$inferSelect;
export type PlanInsert = typeof plan.$inferInsert;
export type PlanUpdate = Omit<PlanInsert, "id" | "userId" | "createdAt" | "updatedAt">;
