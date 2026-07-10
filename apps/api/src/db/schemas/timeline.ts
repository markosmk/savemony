import { relations, sql } from "drizzle-orm";
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
    // (Tiempo Lógico/del Usuario): Es la fecha real en la que ocurrió el evento. el usuario lo puede cargar manual, ej: un type = note
    date: text("date"),
    // (Tiempo del Sistema): Es la fecha inamovible en la que la base de datos hizo el INSERT. Es puramente para auditoría técnica.
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_timeline_plan_id").on(table.planId), index("idx_timeline_date").on(table.date)],
);

export const timelineRelations = relations(timeline, ({ one }) => ({
  plan: one(plan, {
    fields: [timeline.planId],
    references: [plan.id],
  }),
}));

export type Timeline = typeof timeline.$inferSelect;
export type TimelineInsert = typeof timeline.$inferInsert;
