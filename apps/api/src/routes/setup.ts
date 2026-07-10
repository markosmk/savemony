import { getDB } from "../db";
import { type ChallengeInsert, challenge, user } from "../db/schemas";
import { hashPassword } from "../lib/hash";
import { createPublicRouter } from "../lib/hono";

const dataNewChallenges: ChallengeInsert[] = [
  {
    key: "week_streak",
    title: "Racha Semanal",
    description: "Ahorra 7 días seguidos",
    type: "streak",
    targetValue: 7,
    durationDays: null,
    rewardPoints: 100,
  },
  {
    key: "month_streak",
    title: "Racha Mensual",
    description: "Ahorra 30 días seguidos",
    type: "streak",
    targetValue: 30,
    durationDays: null,
    rewardPoints: 500,
  },
  {
    key: "save_50k",
    title: "Meta Express",
    description: "Ahorra $50.000 en total",
    type: "amount",
    targetValue: 50000,
    durationDays: 30,
    rewardPoints: 150,
  },
  {
    key: "save_100k",
    title: "Cien Lucas",
    description: "Ahorra $100.000 en total",
    type: "amount",
    targetValue: 100000,
    durationDays: 60,
    rewardPoints: 300,
  },
  {
    key: "complete_10_cells",
    title: "Diez de una",
    description: "Completa 10 celdas",
    type: "cells",
    targetValue: 10,
    durationDays: null,
    rewardPoints: 50,
  },
  {
    key: "complete_50_cells",
    title: "Maestro del Ahorro",
    description: "Completa 50 celdas",
    type: "cells",
    targetValue: 50,
    durationDays: null,
    rewardPoints: 250,
  },
  {
    key: "no_spend_week",
    title: "Semana Sin Gastos",
    description: "7 días sin registrar retiros",
    type: "no_spend",
    targetValue: 7,
    durationDays: 14,
    rewardPoints: 200,
  },
  {
    key: "first_plan_complete",
    title: "Primera Victoria",
    description: "Completa tu primer plan",
    type: "plan_complete",
    targetValue: 1,
    durationDays: null,
    rewardPoints: 1000,
  },
  {
    key: "save_25k",
    title: "Ahorra 25 lucas",
    description: "Ahorra $25.000 en total",
    type: "amount",
    targetValue: 25000,
    durationDays: 14,
    rewardPoints: 100,
  },
  // COMBO: X celdas en Y días (usamos target_value como celdas, duration_days como días)
  {
    key: "combo_3_days",
    title: "Combo 3 días",
    description: "Ahorra 3 días seguidos",
    type: "streak",
    targetValue: 3,
    durationDays: null,
    rewardPoints: 50,
  },
  // VARIETY: Celdas con montos distintos (target_value = cantidad de montos únicos)
  {
    key: "variety_10",
    title: "Variado",
    description: "Ahorra 10 montos diferentes (sin repetir)",
    type: "variety",
    targetValue: 10,
    durationDays: null,
    rewardPoints: 200,
  },
  // DOUBLE OR NOTHING: Meta agresiva de monto en poco tiempo
  {
    key: "double_week",
    title: "Doble o Nada",
    description: "Ahorra el doble de tu promedio semanal",
    type: "amount",
    targetValue: 100000,
    durationDays: 7,
    rewardPoints: 500,
  },
  // TEMPORADA: Objetivo con fecha límite real
  {
    key: "christmas_save",
    title: "Navidad",
    description: "Ahorra $200.000 antes de diciembre",
    type: "amount",
    targetValue: 200000,
    durationDays: 60,
    rewardPoints: 400,
  },
  // NO SPEND WEEKEND: Sin retiros en finde (tipo no_spend pero específico)
  {
    key: "no_spend_weekend",
    title: "Finde Zen",
    description: "Un fin de semana sin retiros",
    type: "no_spend",
    targetValue: 2,
    durationDays: 7,
    rewardPoints: 150,
  },
  // CATEGORÍA: Completar un plan específico (usamos plan_complete con target_value = 1)
  {
    key: "travel_fund",
    title: "Fondo de Viaje",
    description: "Completá un plan para un viaje",
    type: "plan_complete",
    targetValue: 1,
    durationDays: null,
    rewardPoints: 2000,
  },
];

const users = [
  {
    email: "marcos@gmail.com",
    password: "pass123",
    name: "Marcos",
    role: "user",
  },
  {
    email: "admin@gmail.com",
    password: "pass123",
    name: "Martin",
    role: "admin",
  },
];

const routes = createPublicRouter();

routes.post("/", async (c) => {
  const db = getDB(c.env.DB);
  // solo si estamos en desarrollo
  if (c.env.ENVIRONMENT !== "development") {
    return c.json({ success: false, error: "No se puede ejecutar el seed en producción" }, 403);
  }

  for (const userData of users) {
    const passwordHash = await hashPassword(userData.password);
    await db
      .insert(user)
      .values({
        email: userData.email.toLowerCase(),
        passwordHash,
        name: userData.name || "",
        role: userData.role,
        emailVerified: true,
      })
      .onConflictDoNothing({ target: user.email });
  }

  for (const challengeData of dataNewChallenges) {
    await db
      .insert(challenge)
      .values({
        ...challengeData,
        id: crypto.randomUUID(), // Explicitly generate ID to avoid defaultFn issues
      })
      .onConflictDoNothing({ target: challenge.key });
  }
  return c.json({ success: true, message: "Challenges seeded successfully" });
});

export default routes;
