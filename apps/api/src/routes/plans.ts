// import { sValidator } from "@hono/standard-validator";
import { type FrequencyType, planCreationSchema, todayUTC, updatePlanSchema } from "@savemony/shared";
import { desc, eq } from "drizzle-orm";
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
  const userPlans = await db.select().from(plans).where(eq(plans.userId, userId)).orderBy(desc(plans.createdAt));
  return c.json({ plans: userPlans });
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
    const isFlexible = data.mode !== "flexible";
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

export default routes;
