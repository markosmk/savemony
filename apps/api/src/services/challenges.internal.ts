import { and, eq, max, sql } from "drizzle-orm";

import type { DB } from "../db";
import { cell, challenge, plan, referral, userChallenge } from "../db/schemas";

/**
 * Recalcula en caliente el progreso de los desafíos activos de un usuario.
 * Se debe llamar dentro de una transacción (tx) pasándole el cliente transaccional.
 */
export async function updateChallengesProgress(db: DB, userId: string) {
  const [totalsResult, totalCellsResult, totalPlansCompletedResult, totalReferralsResult] = await Promise.all([
    db
      .select({
        // Racha máxima entre todos sus planes activos
        maxStreakValue: max(plan.streak),
        // Total de dinero ahorrado (suma de currentAmount de sus planes)
        totalAmountSaved: sql<number>`SUM(${plan.currentAmount})`,
      })
      .from(plan)
      .where(eq(plan.userId, userId))
      .get(),

    // db
    //   .select({ total: sql<number>`SUM(${plan.currentAmount})` })
    //   .from(plan)
    //   .where(eq(plan.userId, userId))
    //   .get(),
    // Total de celdas completadas en toda su cuenta
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(cell)
      .innerJoin(plan, eq(cell.planId, plan.id))
      .where(and(eq(plan.userId, userId), eq(cell.status, "completed")))
      .get(),
    // Total de planes completados al 100%
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(plan)
      .where(and(eq(plan.userId, userId), eq(plan.status, "completed")))
      .get(),
    // Total de amigos referidos que ya completaron su primera celda
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(referral)
      .where(and(eq(referral.referrerId, userId), eq(referral.status, "completed")))
      .get(),
  ]);

  const maxStreak = totalsResult?.maxStreakValue || 0;
  const totalSaved = totalsResult?.totalAmountSaved || 0;
  const totalCells = totalCellsResult?.count || 0;
  const totalPlansCompleted = totalPlansCompletedResult?.count || 0;
  const totalReferrals = totalReferralsResult?.count || 0;

  // BUSCAR LOS DESAFÍOS ACTIVOS DEL USUARIO
  const activeUserChallenges = await db
    .select({
      ucId: userChallenge.id,
      type: challenge.type,
      targetValue: challenge.targetValue,
      expiresAt: userChallenge.expiresAt,
    })
    .from(userChallenge)
    .innerJoin(challenge, eq(userChallenge.challengeId, challenge.id))
    .where(and(eq(userChallenge.userId, userId), eq(userChallenge.status, "active")))
    .all();

  const nowIso = new Date().toISOString();

  // EVALUAR Y ACTUALIZAR CADA DESAFÍO
  for (const uc of activeUserChallenges) {
    // Verificar si el reto ya expiró por tiempo
    if (uc.expiresAt && new Date(uc.expiresAt) < new Date()) {
      await db.update(userChallenge).set({ status: "failed", updatedAt: nowIso }).where(eq(userChallenge.id, uc.ucId));
      continue;
    }

    // Asignar el progreso según el tipo de reto
    let currentProgress = 0;
    switch (uc.type) {
      case "streak":
        currentProgress = maxStreak;
        break;
      case "amount":
        currentProgress = totalSaved;
        break;
      case "cells":
        currentProgress = totalCells;
        break;
      case "plan_complete":
        currentProgress = totalPlansCompleted;
        break;
      case "referral":
        currentProgress = totalReferrals;
        break;
      default:
        continue; // Si es un tipo manual o personalizado, lo saltamos
    }

    const isCompleted = currentProgress >= uc.targetValue;

    // Actualizar la base de datos en caliente
    await db
      .update(userChallenge)
      .set({
        currentProgress,
        status: isCompleted ? "completed" : "active",
        completedAt: isCompleted ? nowIso : null,
        updatedAt: nowIso,
      })
      .where(eq(userChallenge.id, uc.ucId));
  }
}
