import { sql } from "drizzle-orm";
import { index, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { cell } from "./cell";
import { plan } from "./plan";

export const timeline = sqliteTable(
  "timeline",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    planId: text("plan_id")
      .notNull()
      .references(() => plan.id, { onDelete: "cascade" }),
    cellId: text("cell_id").references(() => cell.id, { onDelete: "set null" }),
    type: text("type").notNull(),
    amount: real("amount"),
    description: text("description"),
    metadata: text("metadata"),
    date: text("date").notNull().default(sql`CURRENT_TIMESTAMP`),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_timeline_plan_id").on(table.planId), index("idx_timeline_date").on(table.date)],
);

export type Timeline = typeof timeline.$inferSelect;
export type TimelineInsert = typeof timeline.$inferInsert;
