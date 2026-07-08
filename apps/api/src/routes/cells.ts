import { sValidator } from "@hono/standard-validator";
import { editCellSchema, toggleCellSchema, updateCellStatusSchema } from "@savemony/shared";
import { and, eq, sql } from "drizzle-orm";

import { getDB } from "../db";
import { cell, plan, referral, timeline } from "../db/schemas";
import { createProtectedRouter } from "../lib/hono";
import { updateAchievementsProgress } from "../services/achievements.internal";
import { updateChallengesProgress } from "../services/challenges.internal";
import { rebalanceCells } from "../services/plans.utils";

const routes = createProtectedRouter();

// GET /cells/plan/:planId  →  Obtener celdas de un plan
routes.get("/plan/:planId", async (c) => {
  const planId = c.req.param("planId");
  const userId = c.get("user").id;
  const db = getDB(c.env.DB);

  // Verificar que el plan pertenece al usuario (RLS manual)
  const planData = await db
    .select()
    .from(plan)
    .where(and(eq(plan.id, planId), eq(plan.userId, userId)))
    .get();

  if (!planData) return c.json({ error: "Plan no encontrado" }, 404);

  const planCells = await db.select().from(cell).where(eq(cell.planId, planId)).orderBy(cell.position).all();

  return c.json(planCells);
});

// PUT /cells/:id/edit  →  Update simple (admin/debug)
// Actualizar el estado de una celda (Marcar como completada + nota)
routes.put("/:id/edit", sValidator("json", updateCellStatusSchema), async (c) => {
  const id = c.req.param("id");
  const { status } = c.req.valid("json");
  const db = getDB(c.env.DB);

  const isCompleted = status === "completed";

  await db
    .update(cell)
    .set({
      status,
      // note: note || null,
      completedAt: isCompleted ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(cell.id, id));

  // NOTA: Idealmente aquí una entrada en la tabla timeline.
  return c.json({ success: true });
});

// POST /cells/:cellId/toggle  →  Completar/Descompletar celda
// Cambiar el estado de la celda (pending a completed).
// Modificar el current_amount del plan sumando o restando el valor de la celda.
// Calcular o actualizar la racha (streak) del plan.
// Insertar la fila correspondiente en el timeline (tipo save o withdraw).
// Bonus de Referidos: Si es la primera celda que completa el usuario y fue invitado por alguien, marcar ese referido como completado automáticamente.
routes.post("/:cellId/toggle", sValidator("json", toggleCellSchema), async (c) => {
  const cellId = c.req.param("cellId");
  const { action } = c.req.valid("json");
  const userId = c.get("user").id;
  const db = getDB(c.env.DB);

  try {
    // ── 1. LECTURAS: Validar celda y plan ──────────────────────
    // deberia ser transaccion... pero en D1 no es posible.
    const currentCell = await db.select().from(cell).where(eq(cell.id, cellId)).get();

    if (!currentCell) throw new Error("Celda no encontrada");

    const currentPlan = await db.select().from(plan).where(eq(plan.id, currentCell.planId)).get();

    if (!currentPlan) throw new Error("Plan no encontrado");
    if (currentPlan.userId !== userId) throw new Error("No tienes permiso sobre este plan");

    const isCompleting = action === "complete";
    if (isCompleting && currentCell.status === "completed") throw new Error("La celda ya está completada");
    if (!isCompleting && currentCell.status !== "completed") throw new Error("La celda no está completada");

    const nowIso = new Date().toISOString();
    const amountDiff = isCompleting ? Number(currentCell.amount) : -Number(currentCell.amount);

    // ── 2. CALCULOS: Streak y totales ───────────────────────────
    let newStreak = currentPlan.streak || 0;
    if (isCompleting) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastSave = currentPlan.lastSaveDate ? new Date(currentPlan.lastSaveDate) : null;

      if (lastSave) {
        lastSave.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today.getTime() - lastSave.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) newStreak += 1;
        else if (diffDays > 1) newStreak = 1;
      } else {
        newStreak = 1;
      }
    }

    // ── 3. WRITE CORE #1: Actualizar celda ─────────────────────
    await db
      .update(cell)
      .set({
        status: isCompleting ? "completed" : "pending",
        completedAt: isCompleting ? nowIso : null,
        updatedAt: nowIso,
      })
      .where(eq(cell.id, cellId));

    // ── 4. CONTAR celdas completadas para estado del plan ───────
    const completedResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(cell)
      .where(and(eq(cell.planId, currentPlan.id), eq(cell.status, "completed")))
      .get();

    const totalResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(cell)
      .where(eq(cell.planId, currentPlan.id))
      .get();

    const completedCount = Number(completedResult?.count ?? 0);
    const totalCells = Number(totalResult?.count ?? 0);
    const newStatus = completedCount >= totalCells ? "completed" : "active";

    // ── 5. WRITE CORE #2: Actualizar plan ───────────────────────
    await db
      .update(plan)
      .set({
        currentAmount: sql`${plan.currentAmount} + ${amountDiff}`,
        streak: newStreak,
        lastSaveDate: isCompleting ? nowIso : currentPlan.lastSaveDate,
        status: newStatus,
        updatedAt: nowIso,
      })
      .where(eq(plan.id, currentPlan.id));

    // ── 6. WRITE SECUNDARIO: Timeline (save/withdraw) ───────────
    await db.insert(timeline).values({
      id: crypto.randomUUID(),
      planId: currentCell.planId,
      cellId: currentCell.id,
      type: isCompleting ? "save" : "withdraw",
      amount: Number(currentCell.amount),
      description: isCompleting
        ? `Celda #${currentCell.position + 1} completada`
        : `Celda #${currentCell.position + 1} desmarcada`,
      date: nowIso,
    });

    // ── 7. WRITE SECUNDARIO: Milestones ─────────────────────────
    if (isCompleting && totalCells > 0) {
      const progressPercent = Math.round((completedCount / totalCells) * 100);
      if ([25, 50, 75, 100].includes(progressPercent)) {
        await db.insert(timeline).values({
          id: crypto.randomUUID(),
          planId: currentPlan.id,
          type: "milestone",
          amount: null,
          description: `${progressPercent}% del objetivo alcanzado${progressPercent === 100 ? " - ¡PLAN COMPLETADO!" : ""}`,
          date: nowIso,
        });
      }
    }

    // ── 8. WRITE SECUNDARIO: Referidos (primera celda ever) ─────
    let isFirstEverCell = false;
    if (isCompleting) {
      const allCompletedByUser = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(cell)
        .innerJoin(plan, eq(cell.planId, plan.id))
        .where(and(eq(plan.userId, userId), eq(cell.status, "completed")))
        .get();

      if (Number(allCompletedByUser?.count ?? 0) === 1) {
        isFirstEverCell = true;
        await db
          .update(referral)
          .set({ status: "completed", completedAt: nowIso })
          .where(and(eq(referral.referredId, userId), eq(referral.status, "pending")));
      }
    }

    // ── 9. WRITE SECUNDARIO: Challenges + Achievements ──────────
    let newAchievements: unknown[] = [];
    if (isCompleting) {
      await updateChallengesProgress(db, userId);
      newAchievements = await updateAchievementsProgress(db, userId);
    }

    return c.json({
      success: true,
      cellId,
      planId: currentPlan.id,
      action,
      currentAmount: (Number(currentPlan.currentAmount) || 0) + amountDiff,
      streak: newStreak,
      status: newStatus,
      isFirstCell: isFirstEverCell,
      newAchievements,
    });
  } catch (err) {
    // TODO si hay un error habria que ver como volver atras sin transaccion..
    console.error("Toggle error:", err);
    return c.json({ success: false, error: err instanceof Error ? err.message : "Toggle failed" }, 400);
  }
});

// PUT /cells/:cellId
routes.put("/:cellId", sValidator("json", editCellSchema), async (c) => {
  const { cellId } = c.req.param();
  const data = c.req.valid("json");
  const user = c.get("user");
  const db = getDB(c.env.DB);

  // Verificar ownership del plan
  const planData = await db
    .select()
    .from(plan)
    .where(and(eq(plan.id, data.planId), eq(plan.userId, user.id)))
    .get();
  if (!planData) return c.json({ error: "Plan no encontrado" }, 404);

  // Verificar celda
  const cellData = await db
    .select()
    .from(cell)
    .where(and(eq(cell.id, cellId), eq(cell.planId, data.planId)))
    .get();

  if (!cellData) return c.json({ error: "Celda no encontrada" }, 404);

  if (cellData.status === "completed") {
    return c.json({ error: "No puedes editar una celda completada" }, 400);
  }

  // 1. Actualizar el monto de la celda editada
  await db.update(cell).set({ amount: data.newAmount }).where(eq(cell.id, cellId));

  // 2. Obtener todas las celdas para rebalancear
  const allCells = await db.select().from(cell).where(eq(cell.planId, data.planId)).all();

  // 3. Tratar la celda editada como "fija" para el rebalance
  const cellsForRebalance = allCells.map((c) => ({
    id: c.id,
    amount: c.id === cellId ? data.newAmount : c.amount,
    status: c.status,
    isLocked: c.id === cellId ? true : Boolean(c.isLocked),
  }));

  const mode = data.rebalanceMode || (planData.rebalanceMode as "proportional" | "random") || "proportional";

  const newAmounts = rebalanceCells(
    cellsForRebalance,
    Number(planData.targetAmount),
    mode,
    Number(planData.minAmount) || 0,
    Number(planData.maxAmount) || 0,
  );

  // 4. Actualizar las demás celdas pendientes
  for (const item of newAmounts) {
    if (item.id === cellId) continue;
    const original = allCells.find((c) => c.id === item.id);
    if (original && original.status === "pending" && !original.isLocked && original.amount !== item.amount) {
      await db.update(cell).set({ amount: item.amount }).where(eq(cell.id, item.id));
    }
  }

  await db.insert(timeline).values({
    planId: data.planId,
    type: "adjust",
    amount: data.newAmount,
    description: `Celda #${cellData.position + 1} editada a ${data.newAmount}`,
    cellId,
  });

  return c.json({ success: true });
});

export default routes;
