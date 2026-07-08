import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

import { plan } from "./plan";

export const cell = sqliteTable(
  "cell",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    planId: text("plan_id")
      .notNull()
      .references(() => plan.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    amount: real("amount").notNull(),
    status: text("status").notNull().default("pending"),
    isLocked: integer("is_locked").notNull().default(0),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_cells_plan_id").on(table.planId),
    index("idx_cells_plan_position").on(table.planId, table.position),
    unique("uq_cells_plan_position").on(table.planId, table.position), // duplicated none
  ],
);

export type Cell = typeof cell.$inferSelect;
export type CellInsert = typeof cell.$inferInsert;
