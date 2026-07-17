import { todayUTC } from "@savemony/shared";
import { and, eq } from "drizzle-orm";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDB } from "../db";
import { plans } from "../db/schemas";

/**
 * Verify plan ownership (only user)
 * @param c context
 * @param planId plan id
 * @returns plan
 */
export async function verifyPlanOwnership(c: Context, planId: string) {
  const user = c.get("user");
  if (!user) throw new HTTPException(401);

  const db = getDB(c.env.DB);
  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, planId), eq(plans.userId, user.id)));

  if (!plan) throw new HTTPException(404, { message: "Plan no encontrado" });
  return plan;
}

/**
 * Update plan status
 * @param c context
 * @param nextStatus next status
 * @returns promise boolean
 */
export async function updatePlanStatus(c: Context, nextStatus: "active" | "completed" | "archived") {
  const planId = c.req.param("id");
  if (!planId) throw new HTTPException(400, { message: "ID de plan es requerido" });
  const userId = c.get("user")?.id;
  if (!userId) throw new HTTPException(401, { message: "Usuario no autorizado" });

  await verifyPlanOwnership(c, planId);

  const db = getDB(c.env.DB);
  await db.update(plans).set({ status: nextStatus, updatedAt: todayUTC() }).where(eq(plans.id, planId));

  return c.json({ success: true });
}
