import { sValidator } from "@hono/standard-validator";
import { createPlanSchema, timelineEntrySchema, updatePlanSchema } from "@savemony/shared";
import { and, eq, sql } from "drizzle-orm";

import { getDB } from "../db";
import { type CellInsert, cell, plan, timeline } from "../db/schemas";
import { createProtectedRouter } from "../lib/hono";
import { generateGrid, rebalanceCells } from "../services/plans.utils";

const routes = createProtectedRouter();

// ========== GET /plans/user ==========
routes.get("/user", async (c) => {
  const user = c.get("user");
  const db = getDB(c.env.DB);

  const userPlans = await db
    .select()
    .from(plan)
    .where(and(eq(plan.userId, user.id), eq(plan.archived, 0)))
    .all();

  return c.json(userPlans);
});

// ========== GET /plans/:id ==========
routes.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const db = getDB(c.env.DB);

  const planData = await db
    .select()
    .from(plan)
    .where(and(eq(plan.id, id), eq(plan.userId, user.id)))
    .get();

  if (!planData) return c.json({ success: false, error: "Plan no encontrado" }, 404);

  const cellsData = await db.select().from(cell).where(eq(cell.planId, id)).orderBy(cell.position).all();

  const timelineData = await db
    .select()
    .from(timeline)
    .where(eq(timeline.planId, id))
    .orderBy(sql`${timeline.date} desc`)
    .all();

  return c.json({
    success: true,
    plan: {
      ...planData,
      cells: cellsData,
      timeline: timelineData,
    },
  });
});

// ========== POST /plans/ ==========
routes.post("/", sValidator("json", createPlanSchema), async (c) => {
  const data = c.req.valid("json");
  const user = c.get("user");
  const db = getDB(c.env.DB);

  const newPlanId = crypto.randomUUID();

  try {
    // 3. Generar montos de celdas
    const amounts = generateGrid(
      data.method || "custom_grid",
      Number(data.targetAmount),
      data.gridRows || 6,
      data.gridCols || 7,
      Number(data.minAmount) || 0,
      Number(data.maxAmount) || 0,
      data.frequency || "daily",
    );

    // 4. Insertar plan
    const [planNew] = await db
      .insert(plan)
      .values({
        id: newPlanId,
        userId: user.id,
        title: data.title,
        description: data.description,
        icon: data.icon ?? "🎯",
        targetAmount: data.targetAmount,
        gridRows: data.gridRows ?? 6,
        gridCols: data.gridCols ?? 7,
        currency: data.currency ?? "CLP",
        category: data.category,
        deadline: data.deadline,
        method: data.method || "custom_grid",
        rebalanceMode: data.rebalanceMode || "proportional",
        frequency: data.frequency || "daily",
        minAmount: data.minAmount ?? 0,
        maxAmount: data.maxAmount ?? 0,
      })
      .returning();
    if (!planNew) throw new Error("No se pudo crear el plan");

    // 5. celdas asociadas
    const cellsData: CellInsert[] = amounts.map((amount, index) => ({
      id: crypto.randomUUID(),
      planId: newPlanId,
      position: index,
      amount: amount,
      status: "pending" as const,
      isLocked: 0,
    }));

    // 5. Insertar celdas con D1 batch (cada celda = 1 statement, 6 variables)
    const cellInserts = cellsData.map((c) => db.insert(cell).values(c));

    // D1 hard limit: 100 statements per batch
    for (let i = 0; i < cellInserts.length; i += 100) {
      const chunk = cellInserts.slice(i, i + 100);
      await db.batch(chunk as any);
    }

    // 6. Timeline entry inicial
    await db.insert(timeline).values({
      planId: newPlanId,
      type: "note",
      description: `Plan "${data.title}" creado con ${amounts.length} celdas`,
    });

    return c.json({ success: true, id: newPlanId }, 201);
  } catch (err) {
    // Limpieza best-effort
    console.error("[PLAN CREATE] Error, intentando limpiar plan", newPlanId);
    await db
      .delete(plan)
      .where(eq(plan.id, newPlanId))
      .catch(() => {});
    throw err;
  }
});

// ========== PATCH /plans/:id ==========
routes.patch("/:id", sValidator("json", updatePlanSchema), async (c) => {
  const { id } = c.req.param();
  const body = c.req.valid("json");
  const user = c.get("user");
  const db = getDB(c.env.DB);

  // Verificar ownership
  const existing = await db
    .select()
    .from(plan)
    .where(and(eq(plan.id, id), eq(plan.userId, user.id)))
    .get();

  if (!existing) return c.json({ error: "Plan no encontrado" }, 404);

  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.icon !== undefined) updateData.icon = body.icon;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.targetAmount !== undefined) updateData.targetAmount = body.targetAmount;
  if (body.deadline !== undefined) updateData.deadline = body.deadline;
  if (body.rebalanceMode !== undefined) updateData.rebalanceMode = body.rebalanceMode;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.archived !== undefined) updateData.archived = body.archived ? 1 : 0;

  if (Object.keys(updateData).length === 0) {
    return c.json({ error: "No hay campos para actualizar" }, 400);
  }

  await db.update(plan).set(updateData).where(eq(plan.id, id));

  return c.json({ success: true });
});

// ========== DELETE /plans/:id ==========
routes.delete("/:id", async (c) => {
  const { id } = c.req.param();
  const user = c.get("user");
  const db = getDB(c.env.DB);

  const existing = await db
    .select()
    .from(plan)
    .where(and(eq(plan.id, id), eq(plan.userId, user.id)))
    .get();

  if (!existing) return c.json({ error: "Plan no encontrado" }, 404);

  await db.delete(plan).where(eq(plan.id, id));

  return c.json({ success: true });
});

// ========== POST /plans/:id/rebalance ==========
routes.post("/:id/rebalance", async (c) => {
  const { id } = c.req.param();
  const user = c.get("user");
  const db = getDB(c.env.DB);

  const planData = await db
    .select()
    .from(plan)
    .where(and(eq(plan.id, id), eq(plan.userId, user.id)))
    .get();

  if (!planData) return c.json({ error: "Plan no encontrado" }, 404);

  const cellsData = await db.select().from(cell).where(eq(cell.planId, id)).all();

  const pendingCells = cellsData.filter((c) => c.status === "pending" && !c.isLocked);

  if (pendingCells.length === 0) {
    return c.json({ error: "No hay celdas pendientes para rebalancear" }, 400);
  }

  const newAmounts = rebalanceCells(
    cellsData.map((c) => ({
      id: c.id,
      amount: c.amount,
      status: c.status,
      isLocked: Boolean(c.isLocked),
    })),
    Number(planData.targetAmount),
    (planData.rebalanceMode as "proportional" | "random") || "proportional",
    Number(planData.minAmount) || 0,
    Number(planData.maxAmount) || 0,
  );

  // update cells pending (no transaction D1)
  for (const item of newAmounts) {
    const original = cellsData.find((c) => c.id === item.id);
    if (original && original.status === "pending" && !original.isLocked && original.amount !== item.amount) {
      await db.update(cell).set({ amount: item.amount }).where(eq(cell.id, item.id));
    }
  }

  await db.insert(timeline).values({
    planId: id,
    type: "adjust",
    description: `Celdas rebalanceadas (modo: ${planData.rebalanceMode})`,
  });

  return c.json({ success: true, cellsUpdated: pendingCells.length });
});

// ========== GET /plans/:id/timeline ==========
routes.get("/:id/timeline", async (c) => {
  const { id } = c.req.param();
  const user = c.get("user");
  const db = getDB(c.env.DB);

  const planData = await db
    .select()
    .from(plan)
    .where(and(eq(plan.id, id), eq(plan.userId, user.id)))
    .get();

  if (!planData) return c.json({ error: "Plan no encontrado" }, 404);

  const entries = await db
    .select()
    .from(timeline)
    .where(eq(timeline.planId, id))
    .orderBy(sql`${timeline.date} desc`)
    .all();

  return c.json({
    success: true,
    timeline: entries.map((t) => ({
      ...t,
      amount: t.amount ? Number(t.amount) : null,
      cellId: t.cellId,
      createdAt: t.createdAt,
    })),
  });
});

// ========== POST /plans/:id/timeline ==========
routes.post("/:id/timeline", sValidator("json", timelineEntrySchema), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid("json");
  const user = c.get("user");
  const db = getDB(c.env.DB);

  const planData = await db
    .select()
    .from(plan)
    .where(and(eq(plan.id, id), eq(plan.userId, user.id)))
    .get();

  if (!planData) return c.json({ error: "Plan no encontrado" }, 404);

  await db.insert(timeline).values({
    planId: id,
    type: data.type,
    amount: data.amount ?? null,
    description: data.description ?? null,
  });

  // update currentAmount of plan according to the type
  let newCurrent = Number(planData.currentAmount);
  if (data.type === "withdraw" && data.amount) {
    newCurrent = Math.max(0, newCurrent - data.amount);
  } else if (data.type === "deposit" && data.amount) {
    newCurrent = newCurrent + data.amount;
  }

  if (newCurrent !== Number(planData.currentAmount)) {
    await db.update(plan).set({ currentAmount: newCurrent }).where(eq(plan.id, id));
  }

  return c.json({ success: true });
});

// POST /plans/:id/recalc (emergencia)
// Si el servidor se muere entre el update de celda (un paso intermedio..) y el update de plan (otro paso intermedio), es posible que una celda quede marcada como completed pero el currentAmount del plan no reflejará el nuevo valor.
routes.post("/:planId/recalc", async (c) => {
  const planId = c.req.param("planId");
  const db = getDB(c.env.DB);

  await db
    .update(plan)
    .set({
      currentAmount: sql`(
			SELECT COALESCE(SUM(amount), 0) FROM ${cell} 
			WHERE ${cell.planId} = ${planId} AND ${cell.status} = 'completed'
		)`,
    })
    .where(eq(plan.id, planId));
});

export default routes;
