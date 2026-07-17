import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const referrals = sqliteTable("referrals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  referrerId: text("referrer_id").notNull(), // El usuario que envió la invitación
  referredId: text("referred_id").notNull().unique(), // El usuario que se registró (1 por persona)
  status: text("status").notNull().default("pending"), // 'pending' | 'completed' | 'rewarded'
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  completedAt: text("completed_at"), // Se llena al completar la 1ra celda
});

export type Referral = typeof referrals.$inferSelect;
export type ReferralInsert = typeof referrals.$inferInsert;
