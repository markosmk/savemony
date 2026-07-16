import { relations, sql } from "drizzle-orm";
import { index, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { planEntries, plans } from "./plan";

export const timelines = sqliteTable(
  "timelines",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    planEntryId: text("plan_entry_id").references(() => planEntries.id, { onDelete: "set null" }),
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

export const timelineRelations = relations(timelines, ({ one }) => ({
  plan: one(plans, {
    fields: [timelines.planId],
    references: [plans.id],
  }),
  planEntry: one(planEntries, {
    fields: [timelines.planEntryId],
    references: [planEntries.id],
  }),
}));

export type Timeline = typeof timelines.$inferSelect;
export type TimelineInsert = typeof timelines.$inferInsert;
