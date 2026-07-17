import { amountSchema, depositSchema, nowUTC, todayUTC, withdrawalSchema } from "@savemony/shared";
import { and, desc, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

import { getDB } from "../db";
import { entries, plans } from "../db/schemas";
import { generateId } from "../lib/generate-id";
import { createProtectedRouter } from "../lib/hono";
import { validateBody } from "../lib/validation";
import { verifyPlanOwnership } from "../services/plans.repository";

const routes = createProtectedRouter();

// GET /api/plans/:planId/entries
routes.get("/", async (c) => {
  const planId = c.req.param("planId");
  if (!planId) throw new HTTPException(400, { message: "Plan ID es requerido" });

  await verifyPlanOwnership(c, planId);

  const db = getDB(c.env.DB);
  const planEntries = await db
    .select()
    .from(entries)
    .where(eq(entries.planId, planId))
    .orderBy(desc(entries.date), desc(entries.createdAt));

  return c.json({ entries: planEntries });
});

// POST /api/plans/:planId/entries/deposit
routes.post("/deposit", async (c) => {
  const planId = c.req.param("planId");
  if (!planId) throw new HTTPException(400, { message: "Plan ID es requerido" });

  const plan = await verifyPlanOwnership(c, planId);
  const data = await validateBody(c, depositSchema);

  const now = nowUTC(); // UTC consistent date
  const today = todayUTC(); // "2026-07-17"

  // Validate that the deposit date is not in the future
  if (data.date > today) {
    throw new HTTPException(400, { message: "No puedes depositar en una fecha futura" });
  }

  const db = getDB(c.env.DB);
  const [entry] = await db
    .insert(entries)
    .values({
      id: generateId(),
      planId,
      date: data.date, // YYYY-MM-DD
      amount: data.amount,
      type: "deposit",
      createdAt: now,
    })
    .returning();

  // verify if plan is completed
  const allEntries = await db.select().from(entries).where(eq(entries.planId, planId));

  const totalDeposited = allEntries.filter((e) => e.type === "deposit").reduce((sum, e) => sum + e.amount, 0);
  const totalWithdrawn = allEntries.filter((e) => e.type === "withdrawal").reduce((sum, e) => sum + e.amount, 0);
  const netSaved = totalDeposited - totalWithdrawn;

  // if the plan reached the goal and is not flexible, mark it as completed
  if (!plan.isFlexible && plan.goalAmount && netSaved >= plan.goalAmount && plan.status === "active") {
    await db.update(plans).set({ status: "completed", updatedAt: now }).where(eq(plans.id, planId));
  }

  return c.json({ success: true, entry }, 201);
});

// POST /api/plans/:planId/entries/withdrawal
routes.post("/withdrawal", async (c) => {
  const planId = c.req.param("planId");
  if (!planId) throw new HTTPException(400, { message: "Plan ID es requerido" });

  await verifyPlanOwnership(c, planId);
  const data = await validateBody(c, withdrawalSchema);

  const now = nowUTC();

  const db = getDB(c.env.DB);
  // verify that the withdrawal amount not exceeds the net saved amount
  const allEntries = await db.select().from(entries).where(eq(entries.planId, planId));

  const totalDeposited = allEntries.filter((e) => e.type === "deposit").reduce((sum, e) => sum + e.amount, 0);
  const totalWithdrawn = allEntries.filter((e) => e.type === "withdrawal").reduce((sum, e) => sum + e.amount, 0);
  const netSaved = totalDeposited - totalWithdrawn;

  if (data.amount > netSaved) {
    throw new HTTPException(400, { message: "No puedes retirar más de lo que has ahorrado" });
  }

  const [entry] = await db
    .insert(entries)
    .values({
      id: generateId(),
      planId,
      // date: formatDate(now),
      date: todayUTC(),
      amount: data.amount,
      type: "withdrawal",
      reason: data.reason,
      createdAt: now,
    })
    .returning();

  return c.json({ success: true, entry }, 201);
});

// PATCH /api/plans/:planId/entries/:entryId
routes.patch("/:entryId", async (c) => {
  const planId = c.req.param("planId");
  const entryId = c.req.param("entryId");
  if (!planId) throw new HTTPException(400, { message: "Plan ID es requerido" });

  await verifyPlanOwnership(c, planId);
  const data = await validateBody(c, amountSchema);

  const now = nowUTC();
  const db = getDB(c.env.DB);
  await db
    .update(entries)
    .set({
      amount: data.amount,
      updatedAt: now,
    })
    .where(and(eq(entries.id, entryId), eq(entries.planId, planId)));

  return c.json({ success: true });
});

// DELETE /api/plans/:planId/entries/:entryId
routes.delete("/:entryId", async (c) => {
  const planId = c.req.param("planId");
  const entryId = c.req.param("entryId");
  if (!planId) throw new HTTPException(400, { message: "Plan ID es requerido" });

  await verifyPlanOwnership(c, planId);

  const db = getDB(c.env.DB);
  await db.delete(entries).where(and(eq(entries.id, entryId), eq(entries.planId, planId)));

  return c.json({ success: true });
});

export default routes;
