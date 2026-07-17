import { and, eq, sql } from "drizzle-orm";

import { getDB } from "../db";
import { entries, plans } from "../db/schemas";
import { createProtectedRouter } from "../lib/hono";
import { verifyPlanOwnership } from "../services/plans.repository";

const routes = createProtectedRouter();

// GET /api/stats/analytics
routes.get("/analytics", async (c) => {
  const user = c.get("user");
  const db = getDB(c.env.DB);
  const currentYear = new Date().getFullYear();

  // 1. Obtener métricas globales de los PLANES (Metas y conteo) en una sola consulta rápida
  const plansStatsPromise = db
    .select({
      activePlansCount: sql<number>`COUNT(CASE WHEN ${plans.status} = 'active' THEN 1 END)`,
      totalTarget: sql<number>`SUM(CAST(${plans.goalAmount} AS REAL))`,
    })
    .from(plans)
    .where(eq(plans.userId, user.id))
    .get(); // .get() porque devuelve un único objeto de totales

  // 2. Calcular el TOTAL AHORRADO NETO (Depósitos - Retiros) directamente en SQL
  const savingsStatsPromise = db
    .select({
      netSaved: sql<number>`
        SUM(CASE WHEN ${entries.type} = 'deposit' THEN CAST(${entries.amount} AS REAL) ELSE 0 END) -
        SUM(CASE WHEN ${entries.type} = 'withdraw' THEN CAST(${entries.amount} AS REAL) ELSE 0 END)
      `,
    })
    .from(entries)
    .innerJoin(plans, eq(entries.planId, plans.id))
    .where(eq(plans.userId, user.id))
    .get();

  // 4. Data Mensual del año actual formateada perfecta para Recharts
  // Agrupa la suma de montos de 'deposits' por año-mes
  const monthlyDataRawPromise = db
    .select({
      month: sql<string>`strftime('%m', ${entries.date})`,
      amount: sql<number>`SUM(${entries.amount})`,
    })
    .from(entries)
    .innerJoin(plans, eq(entries.planId, plans.id))
    .where(
      and(
        eq(plans.userId, user.id),
        eq(entries.type, "deposit"),
        sql`strftime('%Y', ${entries.date}) = ${String(currentYear)}`,
      ),
    )
    .groupBy(sql`strftime('%m', ${entries.date})`)
    .all();

  const [plansStats, savingsStats, monthlyDataRaw] = await Promise.all([
    plansStatsPromise,
    savingsStatsPromise,
    monthlyDataRawPromise,
  ]);

  // Forzamos valores numéricos limpios por si la base de datos devuelve null (cuando el usuario es nuevo)
  const totalSaved = Number(savingsStats?.netSaved || 0);
  const totalTarget = Number(plansStats?.totalTarget || 0);
  const activePlansCount = Number(plansStats?.activePlansCount || 0);

  // TODO / Integración de Racha (streak.ts)
  // Como mencionaste que ahora usas streak.ts, aquí invocarías a tu función:
  // const longestStreak = calculateLongestStreak(user.id);
  const longestStreak = 12; // Placeholder

  // Mapeo para los labels de gráfica de barras/líneas en React
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const monthlyData = monthNames.map((name, index) => {
    const monthNum = String(index + 1).padStart(2, "0");
    const dbMatch = monthlyDataRaw.find((d) => d.month === monthNum);
    return {
      name,
      ahorrado: dbMatch ? Number(dbMatch.amount) : 0,
    };
  });

  return c.json({
    success: true,
    data: {
      activePlans: activePlansCount,
      // Total Ahorrado Actual: Es el dinero real neto que el usuario tiene actualmente en su bolsillo virtual.
      totalSaved: Math.max(0, totalSaved), // Evitamos números negativos raros en la UI si hubo más retiros que depósitos por error
      // Meta Global: Es la suma de los goalAmount de todos sus planes activos.
      totalTarget,
      topStats: {
        longestStreak,
        mostSaved: totalSaved,
      },
      monthlyData, // para <BarChart data={monthlyData} />
    },
  });
});

// GET /api/stats/prediction/:planId Estimaciones y ritmos de ahorro para un plan específico
routes.get("/prediction/:planId", async (c) => {
  const planId = c.req.param("planId");
  const userId = c.get("user")?.id;
  const db = getDB(c.env.DB);

  await verifyPlanOwnership(c, planId);

  // 1. métrica histórica de este plan
  const planStats = await db
    .select({
      goalAmount: plans.goalAmount,
      createdAt: plans.createdAt,
      // Suma total neta ahorrada (Depósitos - Retiros)
      totalDeposited: sql<number>`SUM(CASE WHEN ${entries.type} = 'deposit' THEN CAST(${entries.amount} AS REAL) ELSE 0 END)`,
      totalWithdrawn: sql<number>`SUM(CASE WHEN ${entries.type} = 'withdraw' THEN CAST(${entries.amount} AS REAL) ELSE 0 END)`,
      // Conteo de cuántas veces ahorró
      depositCount: sql<number>`COUNT(CASE WHEN ${entries.type} = 'deposit' THEN 1 END)`,
      // Fecha del primer depósito real para medir el tiempo real que lleva activo el hábito
      firstDepositDate: sql<string>`MIN(CASE WHEN ${entries.type} = 'deposit' THEN ${entries.date} END)`,
    })
    .from(plans)
    .leftJoin(entries, eq(plans.id, entries.planId))
    .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
    .groupBy(plans.id)
    .get();

  if (!planStats) {
    return c.json({ success: false, error: "Plan no encontrado" }, 404);
  }

  // 2. Cálculos limpios usando las métricas agregadas de la base de datos
  const goal = Number(planStats.goalAmount || 0);
  const totalDeposited = Number(planStats.totalDeposited || 0);
  const totalWithdrawn = Number(planStats.totalWithdrawn || 0);

  const currentBalance = totalDeposited - totalWithdrawn;
  const remainingAmount = Math.max(0, goal - currentBalance);

  // el primer depósito si existe; si no, la fecha de creación del plan
  const startingDate = planStats.firstDepositDate || planStats.createdAt;

  // 3. Aritmética de fechas en SQL usando 'julianday' para calcular los días transcurridos exactos
  const timeMetrics = await db
    .select({
      daysElapsed: sql<number>`CAST(julianday('now') - julianday(${startingDate}) AS INT)`,
    })
    .from(plans)
    .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
    .get();

  // Aseguramos mínimo 1 día para evitar divisiones por cero si el plan se creó hoy
  const daysElapsed = Math.max(1, timeMetrics?.daysElapsed || 1);

  // 4. Calcular el ritmo/velocidad (Métricas Clave del Predictor)
  const dailyVelocity = currentBalance / daysElapsed; // Cuánto guarda por día neto de promedio
  const averageDeposit = planStats.depositCount > 0 ? totalDeposited / planStats.depositCount : 0;

  // 5. Estimar tiempo de completado basado en su velocidad actual
  let estimatedDaysToGoal: number | string = "Indefinido (Sin depósitos constantes)";
  let estimatedDate: string | null = null;

  if (dailyVelocity > 0 && remainingAmount > 0) {
    const daysNeeded = Math.ceil(remainingAmount / dailyVelocity);
    estimatedDaysToGoal = daysNeeded;

    // Calcular fecha calendario aproximada en base a los días calculados
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysNeeded);
    estimatedDate = targetDate.toISOString().split("T")[0]; // Formato YYYY-MM-DD
  } else if (remainingAmount === 0 && goal > 0) {
    estimatedDaysToGoal = 0;
    estimatedDate = "¡Meta ya alcanzada!";
  }

  // 6. Proyecciones/Forecasts a futuro si mantiene el mismo ritmo exacto (Ej: en 1 y 3 meses)
  const forecast30Days = currentBalance + dailyVelocity * 30;
  const forecast90Days = currentBalance + dailyVelocity * 90;

  return c.json({
    success: true,
    data: {
      metrics: {
        currentBalance,
        goalAmount: goal,
        remainingAmount,
        daysActive: daysElapsed,
        depositCount: planStats.depositCount,
      },
      rhythm: {
        dailySavingRate: Number(dailyVelocity.toFixed(2)), // Ej: Ahorra $2.50 por día
        averageDepositAmount: Number(averageDeposit.toFixed(2)), // Ej: Cada vez que mete dinero mete $50
      },
      prediction: {
        daysRemaining: estimatedDaysToGoal,
        estimatedCompletionDate: estimatedDate,
      },
      projections: {
        estimatedBalanceIn30Days: Math.round(forecast30Days),
        estimatedBalanceIn90Days: Math.round(forecast90Days),
      },
    },
  });
});

export default routes;
