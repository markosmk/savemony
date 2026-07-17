import type { Context, Next } from "hono";

import type { Variables } from "./auth";

export function requireRole(role: "admin" | "user") {
  return async (c: Context<{ Bindings: { DB: D1Database }; Variables: Variables }>, next: Next) => {
    const user = c.get("user");
    if (user.role !== role && user.role !== "admin") {
      return c.json({ error: "Permisos insuficientes" }, 403);
    }
    await next();
  };
}
