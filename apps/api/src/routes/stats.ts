import { and, desc, eq, sql } from "drizzle-orm";

import { getDB } from "../db";
import { cell, plan, timeline, userAchievements } from "../db/schemas";
import { createProtectedRouter } from "../lib/hono";

const routes = createProtectedRouter();

// GET /api/stats/analytics
routes.get("/analytics", async (c) => {
  const user = c.get("user");
  const db = getDB(c.env.DB);

  // 1. Obtener todos los planes del usuario con conteo de celdas resuelto en SQL
  const userPlans = await db
    .select({
      id: plan.id,
      title: plan.title,
      status: plan.status,
      currentAmount: plan.currentAmount,
      targetAmount: plan.targetAmount,
      streak: plan.streak,
    })
    .from(plan)
    .where(eq(plan.userId, user.id))
    .all();

  // 2. Agrupaciones globales rápidas
  let totalSaved = 0;
  let totalTarget = 0;
  let longestStreak = 0;
  let activePlansCount = 0;

  for (const p of userPlans) {
    totalSaved += Number(p.currentAmount);
    totalTarget += Number(p.targetAmount);
    if (p.streak > longestStreak) longestStreak = p.streak;
    if (p.status === "active") activePlansCount++;
  }

  // 3. Conteo de logros desbloqueados
  const achievementsCountResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(userAchievements)
    .where(eq(userAchievements.userId, user.id))
    .get();

  // 4. Datos mensuales del timeline (Historial agregado para los charts de barras de ahorros)
  // Agrupa los movimientos de tipo 'save' por año-mes
  const monthlyData = await db
    .select({
      month: sql<string>`strftime('%Y-%m', ${timeline.date})`,
      amount: sql<number>`SUM(${timeline.amount})`,
    })
    .from(timeline)
    .innerJoin(plan, eq(timeline.planId, plan.id))
    .where(and(eq(plan.userId, user.id), eq(timeline.type, "save")))
    .groupBy(sql`strftime('%Y-%m', ${timeline.date})`)
    .orderBy(sql`strftime('%Y-%m', ${timeline.date})`)
    .all();

  return c.json({
    success: true,
    data: {
      activePlans: activePlansCount,
      totalSaved,
      totalTarget,
      totalAchievements: achievementsCountResult?.count || 0,
      topStats: {
        longestStreak,
        mostSaved: totalSaved,
      },
      monthlyData, // Estructura perfecta para Recharts
    },
  });
});

// GET /api/stats/prediction/:planId -> Estimaciones y ritmos de ahorro para un plan específico
routes.get("/prediction/:planId", async (c) => {
  const planId = c.req.param("planId");
  const db = getDB(c.env.DB);

  const currentPlan = await db.select().from(plan).where(eq(plan.id, planId)).get();
  if (!currentPlan) return c.json({ success: false, error: "Plan no encontrado" }, 404);

  // Obtener celdas completadas vs totales
  const cellsStats = await db
    .select({
      status: cell.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(cell)
    .where(eq(cell.planId, planId))
    .groupBy(cell.status)
    .all();

  let completedCount = 0;
  let totalCount = 0;
  for (const item of cellsStats) {
    totalCount += item.count;
    if (item.status === "completed") completedCount = item.count;
  }

  // Obtener los últimos depósitos del timeline para calcular el ritmo promedio diario/semanal
  const recentSaves = await db
    .select()
    .from(timeline)
    .where(and(eq(timeline.planId, planId), eq(timeline.type, "save")))
    .orderBy(desc(timeline.date))
    .limit(5)
    .all();

  // Lógica de predicción basada en tus fórmulas anteriores
  const remainingAmount = Number(currentPlan.targetAmount) - Number(currentPlan.currentAmount);
  let estimatedDays = null;

  if (recentSaves.length >= 2) {
    const firstMove = recentSaves[recentSaves.length - 1].date;
    const lastMove = recentSaves[0].date;

    const firstDate = firstMove ? new Date(firstMove).getTime() : 0;
    const lastDate = lastMove ? new Date(lastMove).getTime() : 0;
    const daysDiff = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24));

    const totalAmountInPeriod = recentSaves.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const saveRatePerDay = totalAmountInPeriod / daysDiff;

    if (saveRatePerDay > 0) {
      estimatedDays = Math.ceil(remainingAmount / saveRatePerDay);
    }
  }

  return c.json({
    success: true,
    data: {
      completedCells: completedCount,
      totalCells: totalCount,
      remainingAmount,
      estimatedDays, // null si no hay suficientes datos para proyectar ritmo
    },
  });
});

export default routes;
