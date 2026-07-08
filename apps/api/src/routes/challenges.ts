import { and, eq, max, sql } from "drizzle-orm";

import { type DB, getDB } from "../db";
import { cell, challenge, plan, userChallenge } from "../db/schemas";
import { createProtectedRouter } from "../lib/hono";

const routes = createProtectedRouter();

// Auxiliar para recalcular desafíos activos de un usuario de forma interna
async function updateChallengesProgress(db: DB, userId: string) {
  // 1. Obtener las estadísticas actuales requeridas para los desafíos
  const [maxStreakResult, totalSavedResult, totalCellsResult] = await Promise.all([
    // Obtener racha máxima entre todos sus planes
    db
      .select({ maxValue: max(plan.streak) })
      .from(plan)
      .where(eq(plan.userId, userId))
      .get(),
    // Total ahorrado sumando todos los planes
    db
      .select({ total: sql<number>`SUM(${plan.currentAmount})` })
      .from(plan)
      .where(eq(plan.userId, userId))
      .get(),
    // Total de celdas completadas
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(cell)
      .innerJoin(plan, eq(cell.planId, plan.id))
      .where(and(eq(plan.userId, userId), eq(cell.status, "completed")))
      .get(),
  ]);

  const maxStreak = maxStreakResult?.maxValue || 0;
  const totalSaved = totalSavedResult?.total || 0;
  const totalCells = totalCellsResult?.count || 0;

  // 2. Traer los desafíos activos del usuario para actualizarlos
  const activeUserChallenges = await db
    .select({
      ucId: userChallenge.id,
      type: challenge.type,
      targetValue: challenge.targetValue,
      status: userChallenge.status,
    })
    .from(userChallenge)
    .innerJoin(challenge, eq(userChallenge.challengeId, challenge.id))
    .where(and(eq(userChallenge.userId, userId), eq(userChallenge.status, "active")))
    .all();

  // si el usuario no tiene desafíos activos, no hacer nada
  if (!activeUserChallenges.length) return;

  // 3. Evaluar cada desafío y actualizar en caliente
  for (const uc of activeUserChallenges) {
    let currentProgress = 0;
    if (uc.type === "streak") currentProgress = maxStreak;
    if (uc.type === "amount") currentProgress = totalSaved;
    if (uc.type === "cells") currentProgress = totalCells;

    const isCompleted = currentProgress >= uc.targetValue;

    // Si el desafio no ha cambiado, no hacer nada
    if (isCompleted && uc.status === "completed") continue;

    await db
      .update(userChallenge)
      .set({
        currentProgress,
        status: isCompleted ? "completed" : "active",
        completedAt: isCompleted ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userChallenge.id, uc.ucId));
  }
}

// GET /api/challenges -> Obtener disponibles junto al estado actual del usuario
routes.get("/", async (c) => {
  const userId = c.get("user").id;
  const db = getDB(c.env.DB);

  // Solo se ejecuta cuando el usuario accede a la pantalla de desafíos
  await updateChallengesProgress(db, userId);

  const [allChallenges, userChallenges] = await Promise.all([
    db.select().from(challenge).where(eq(challenge.isActive, true)).all(),
    db.select().from(userChallenge).where(eq(userChallenge.userId, userId)).all(),
  ]);

  return c.json({
    success: true,
    data: {
      allChallenges,
      userChallenges,
    },
  });
});

// POST /api/challenges/:id/accept -> Unirse a un desafío o aceptar
routes.post("/:id/accept", async (c) => {
  const challengeId = c.req.param("id");
  const userId = c.get("user").id;
  const db = getDB(c.env.DB);

  // 1. Verificar si existe y está activo
  const ch = await db.select().from(challenge).where(eq(challenge.id, challengeId)).get();
  if (!ch?.isActive) {
    return c.json({ success: false, error: "Desafío no disponible o no encontrado" }, 404);
  }

  // 2. Verificar si ya lo aceptó previamente
  const existing = await db
    .select()
    .from(userChallenge)
    .where(and(eq(userChallenge.userId, userId), eq(userChallenge.challengeId, challengeId)))
    .get();

  if (existing && existing.status === "active") {
    return c.json({ success: false, error: "Ya estás participando en este desafío" }, 400);
  }

  // 3. Calcular fecha límite si tiene duración en días
  const expiresAt = ch.durationDays ? new Date(Date.now() + ch.durationDays * 24 * 60 * 60 * 1000).toISOString() : null;

  try {
    // 4. Si lo había cancelado o fallado antes, podemos reactivarlo o crear uno nuevo (aquí insertamos uno nuevo/upsert)
    await db
      .insert(userChallenge)
      .values({
        id: crypto.randomUUID(),
        userId,
        challengeId,
        status: "active",
        currentProgress: 0,
        startedAt: new Date().toISOString(),
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [userChallenge.userId, userChallenge.challengeId],
        set: {
          status: "active",
          currentProgress: 0,
          startedAt: new Date().toISOString(),
          expiresAt,
          completedAt: null,
        },
      });

    return c.json({ success: true, message: "¡Desafío aceptado con éxito!" });
  } catch (_err) {
    return c.json({ success: false, error: "Ya estás participando en este desafío" }, 400);
  }
});

// POST /api/challenges/:id/cancel -> Cancelar o abandonar un desafío activo
routes.post("/:id/cancel", async (c) => {
  const ucId = c.req.param("id");
  const userId = c.get("user").id;
  const db = getDB(c.env.DB);

  await db.delete(userChallenge).where(and(eq(userChallenge.id, ucId), eq(userChallenge.userId, userId)));

  return c.json({ success: true, message: "Desafío cancelado correctamente" });
});

export default routes;
