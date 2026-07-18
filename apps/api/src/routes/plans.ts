// import { sValidator } from "@hono/standard-validator";
import { type FrequencyType, getStreakInfo, planCreationSchema, todayUTC, updatePlanSchema } from "@savemony/shared";
import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

import { getDB } from "../db";
import { entries, type PlanUpdate, plans } from "../db/schemas";
import { generateId } from "../lib/generate-id";
import { createProtectedRouter } from "../lib/hono";
import { validateBody } from "../lib/validation";
import { updatePlanStatus, verifyPlanOwnership } from "../services/plans.repository";

const routes = createProtectedRouter();

// GET /api/plans
routes.get("/", async (c) => {
  const userId = c.get("user")?.id;
  const db = getDB(c.env.DB);

  // Query 1: Planes con sumas agregadas
  const plansData = await db
    .select({
      id: plans.id,
      name: plans.name,
      status: plans.status,
      goalAmount: plans.goalAmount,
      isFlexible: plans.isFlexible,
      createdAt: plans.createdAt,
      totalDeposited: sql<number>`COALESCE(SUM(CASE WHEN ${entries.type} = 'deposit' THEN CAST(${entries.amount} AS REAL) ELSE 0 END), 0)`,
      totalWithdrawn: sql<number>`COALESCE(SUM(CASE WHEN ${entries.type} = 'withdrawal' THEN CAST(${entries.amount} AS REAL) ELSE 0 END), 0)`,
    })
    .from(plans)
    .leftJoin(entries, eq(plans.id, entries.planId))
    .where(eq(plans.userId, userId))
    .groupBy(plans.id)
    .orderBy(desc(plans.createdAt));

  // Query 2: Fechas de depósito únicas por plan (una sola query para todos)
  const streakData = await db
    .select({
      planId: entries.planId,
      date: entries.date,
      // Conteo de depósitos por día (para saber si hay al menos uno)
      count: sql<number>`COUNT(*)`,
    })
    .from(entries)
    .where(
      and(
        eq(entries.type, "deposit"),
        inArray(
          entries.planId,
          plansData.map((p) => p.id),
        ), // un solo WHERE IN
        gt(entries.amount, 0),
      ),
    )
    .groupBy(entries.planId, entries.date)
    .orderBy(entries.date);

  // Agrupar fechas por plan
  const datesByPlan = streakData.reduce(
    (acc, row) => {
      if (!acc[row.planId]) acc[row.planId] = [];
      acc[row.planId].push(row.date);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  const result = plansData.map((plan) => {
    const depositDates = datesByPlan[plan.id] || [];
    const netSaved = Math.max(0, plan.totalDeposited - plan.totalWithdrawn);

    // Streak calculado
    const streakInfo = getStreakInfo(
      depositDates.map((d) => ({ date: d, type: "deposit" as const, amount: 1 })) as any,
    );

    return {
      id: plan.id,
      name: plan.name,
      status: plan.status,
      goalAmount: plan.goalAmount,
      isFlexible: plan.isFlexible,
      createdAt: plan.createdAt,
      progress: {
        netSaved,
        totalDeposited: plan.totalDeposited,
        totalWithdrawn: plan.totalWithdrawn,
        percentage:
          (plan.goalAmount ?? 0) > 0 ? Math.min(100, Math.round((netSaved / (plan.goalAmount ?? 0)) * 100)) : 0,
        remainingToGoal: Math.max(0, (plan.goalAmount ?? 0) - netSaved),
        isCompleted: netSaved >= (plan.goalAmount ?? 0),
      },
      streak: {
        current: streakInfo.currentStreak,
        isActive: streakInfo.isStreakActive,
        atRisk: streakInfo.streakAtRisk,
        longest: streakInfo.longestStreak,
      },
    };
  });

  return c.json({ plans: result });
});

// GET /api/plans/:id
routes.get("/:id", async (c) => {
  const planId = c.req.param("id");

  const plan = await verifyPlanOwnership(c, planId);

  if (typeof plan.customDays === "string") {
    plan.customDays = JSON.parse(plan.customDays);
  }
  if (typeof plan.quickAmounts === "string") {
    plan.quickAmounts = JSON.parse(plan.quickAmounts);
  }

  return c.json({ plan });
});

// GET /api/plans/:id/summary — with entries and statistics
routes.get("/:id/summary", async (c) => {
  const planId = c.req.param("id");
  if (!planId) throw new HTTPException(400, { message: "ID de plan es requerido" });

  const plan = await verifyPlanOwnership(c, planId);

  const db = getDB(c.env.DB);
  const planEntries = await db.select().from(entries).where(eq(entries.planId, planId)).orderBy(entries.date);

  if (typeof plan.customDays === "string") {
    plan.customDays = JSON.parse(plan.customDays);
  }
  if (typeof plan.quickAmounts === "string") {
    plan.quickAmounts = JSON.parse(plan.quickAmounts);
  }

  return c.json({
    plan,
    entries: planEntries,
    // stats
  });
});

// POST /api/plans
routes.post(
  "/",
  // sValidator("json", planCreationSchema),
  async (c) => {
    const user = c.get("user");
    const db = getDB(c.env.DB);

    // validated for middleware sValidator
    // const data = c.req.valid("json");
    const data = await validateBody(c, planCreationSchema);

    const now = todayUTC();

    // extra validation
    const isFlexible = data.mode === "flexible";
    if (!isFlexible) {
      if (!data.goalAmount || !data.endDate || !data.frequencyType) {
        throw new HTTPException(400, { message: "Meta, fecha límite y frecuencia son obligatorios" });
      }
      if (data.frequencyType === "CUSTOM_DAYS" && (!data.customDays || data.customDays.length === 0)) {
        throw new HTTPException(400, { message: "Selecciona al menos un día" });
      }
      const today = now.split("T")[0];
      if (data.endDate <= today) {
        throw new HTTPException(400, { message: "La fecha límite debe ser posterior a hoy" });
      }
    }

    const [plan] = await db
      .insert(plans)
      .values({
        id: generateId(),
        userId: user.id,
        name: data.name,
        goalAmount: isFlexible ? null : (data.goalAmount ?? null),
        endDate: isFlexible ? null : (data.endDate ?? null),
        frequencyType: isFlexible ? "DAILY" : (data.frequencyType as FrequencyType),
        customDays: data.customDays ? data.customDays : null,
        suggestedQuota: isFlexible ? null : (data.suggestedQuota ?? null),
        quickAmounts: data.quickAmounts ? data.quickAmounts : null,
        isFlexible: isFlexible,
        status: "active",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return c.json({ success: true, plan }, 201);
  },
);

// PATCH /api/plans/:id — edit plan (meta, endDate, frequency, quickAmounts)
routes.patch("/:id", async (c) => {
  const planId = c.req.param("id");
  if (!planId) throw new HTTPException(400, { message: "ID de plan es requerido" });

  await verifyPlanOwnership(c, planId);
  const data = await validateBody(c, updatePlanSchema);

  const updateData: PlanUpdate = { updatedAt: todayUTC() } as PlanUpdate;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.goalAmount !== undefined) updateData.goalAmount = data.goalAmount;
  if (data.endDate !== undefined) updateData.endDate = data.endDate;
  if (data.frequencyType !== undefined) updateData.frequencyType = data.frequencyType;
  if (data.customDays !== undefined) updateData.customDays = data.customDays; // Not JSON.stringify
  if (data.suggestedQuota !== undefined) updateData.suggestedQuota = data.suggestedQuota;
  if (data.quickAmounts !== undefined) updateData.quickAmounts = data.quickAmounts; // Not JSON.stringify

  const db = getDB(c.env.DB);
  await db.update(plans).set(updateData).where(eq(plans.id, planId));

  return c.json({ success: true });
});

routes.patch("/:id/archive", (c) => updatePlanStatus(c, "archived"));
routes.patch("/:id/complete", (c) => updatePlanStatus(c, "completed"));
routes.patch("/:id/reactivate", (c) => updatePlanStatus(c, "active"));

routes.post("/:id/duplicate", async (c) => {
  const planId = c.req.param("id");
  if (!planId) throw new HTTPException(400, { message: "ID de plan es requerido" });

  const plan = await verifyPlanOwnership(c, planId);

  const db = getDB(c.env.DB);
  const [newPlan] = await db
    .insert(plans)
    .values({
      id: generateId(),
      userId: c.get("user")?.id,
      name: `${plan.name} (copia)`,
      goalAmount: plan.goalAmount,
      endDate: plan.endDate,
      frequencyType: plan.frequencyType,
      customDays: plan.customDays,
      suggestedQuota: plan.suggestedQuota,
      quickAmounts: plan.quickAmounts,
      isFlexible: plan.isFlexible,
      status: "active",
    })
    .returning();
  return c.json({ success: true, plan: newPlan });
});

routes.delete("/:id", async (c) => {
  const planId = c.req.param("id");
  if (!planId) throw new HTTPException(400, { message: "ID de plan es requerido" });

  const plan = await verifyPlanOwnership(c, planId);
  if (plan.status !== "archived") {
    return c.json({ message: "El plan debe estar archivado para ser eliminado" }, 400);
    // throw new HTTPException(400, { message: "El plan debe estar archivado para ser eliminado" });
  }

  const db = getDB(c.env.DB);
  await db.delete(plans).where(eq(plans.id, planId));
  return c.json({ success: true }); // status 204
});

export default routes;
