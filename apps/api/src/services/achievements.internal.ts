import { and, eq, max, sql } from "drizzle-orm";

import type { DB } from "../db";
import { achievement, cell, plan, userAchievements } from "../db/schemas";

/**
 * Evalúa las estadísticas del usuario y desbloquea nuevos logros.
 * Retorna un arreglo con los logros RECIÉN desbloqueados en esta transacción.
 */
export async function updateAchievementsProgress(db: DB, userId: string) {
  // 1. Obtener estadísticas actuales del usuario dentro de la transacción
  const [cellsResult, savedResult, streakResult, plansResult] = await Promise.all([
    // Total celdas completadas
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(cell)
      .innerJoin(plan, eq(cell.planId, plan.id))
      .where(and(eq(plan.userId, userId), eq(cell.status, "completed")))
      .get(),
    // Total ahorrado
    db
      .select({ total: sql<number>`SUM(${plan.currentAmount})` })
      .from(plan)
      .where(eq(plan.userId, userId))
      .get(),
    // Racha máxima
    db
      .select({ maxStreak: max(plan.streak) })
      .from(plan)
      .where(eq(plan.userId, userId))
      .get(),
    // Planes completados al 100% y total de planes
    db
      .select({
        completed: sql<number>`SUM(CASE WHEN ${plan.status} = 'completed' THEN 1 ELSE 0 END)`,
        total: sql<number>`COUNT(*)`,
      })
      .from(plan)
      .where(eq(plan.userId, userId))
      .get(),
  ]);

  const stats = {
    totalCells: cellsResult?.count || 0,
    totalSaved: savedResult?.total || 0,
    maxStreak: streakResult?.maxStreak || 0,
    completedPlans: plansResult?.completed || 0,
    totalPlans: plansResult?.total || 0,
  };

  // 2. Traer el catálogo de logros y los que el usuario ya tiene
  const [allAchievements, alreadyUnlocked] = await Promise.all([
    db.select().from(achievement).all(),
    db
      .select({ achievementId: userAchievements.achievementId })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .all(),
  ]);

  const unlockedIds = new Set(alreadyUnlocked.map((u) => u.achievementId));

  // 3. Diccionario de reglas (basado en tu evaluateConditions anterior)
  const conditionsMet: Record<string, boolean> = {
    first_save: stats.totalCells >= 1,
    ten_cells: stats.totalCells >= 10,
    fifty_cells: stats.totalCells >= 50,
    first_plan: stats.totalPlans >= 1,
    first_100k: stats.totalSaved >= 100000,
    first_500k: stats.totalSaved >= 500000,
    first_1m: stats.totalSaved >= 1000000,
    streak_3: stats.maxStreak >= 3,
    streak_7: stats.maxStreak >= 7,
    streak_30: stats.maxStreak >= 30,
    plan_complete: stats.completedPlans >= 1,
    five_plans: stats.totalPlans >= 5,
  };

  // 4. Filtrar cuáles logros cumple AHORA y no tenía desbloqueados
  const newlyUnlocked = [];
  const toInsert = [];
  const nowIso = new Date().toISOString();

  for (const ach of allAchievements) {
    if (!unlockedIds.has(ach.id) && conditionsMet[ach.key]) {
      newlyUnlocked.push(ach);
      toInsert.push({
        id: crypto.randomUUID(),
        userId,
        achievementId: ach.id,
        unlockedAt: nowIso,
      });
    }
  }

  // 5. Inserción en lote (Batch Insert) en D1
  if (toInsert.length > 0) {
    await db.insert(userAchievements).values(toInsert);
  }

  return newlyUnlocked;
}
