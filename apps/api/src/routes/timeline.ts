import { desc, eq } from "drizzle-orm";

import { getDB } from "../db";
import { timeline } from "../db/schemas";
import { createProtectedRouter } from "../lib/hono";

const routes = createProtectedRouter();

// Obtener el historial de un plan ordenado por fecha reciente
routes.get("/plan/:planId", async (c) => {
  const planId = c.req.param("planId");
  const db = getDB(c.env.DB);

  const history = await db
    .select()
    .from(timeline)
    .where(eq(timeline.planId, planId))
    .orderBy(desc(timeline.date))
    .all();

  return c.json(history);
});

export default routes;
