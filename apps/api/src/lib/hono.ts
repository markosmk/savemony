import { Hono } from "hono";

import type { Variables } from "../middlewares/auth";
import { authMiddleware } from "../middlewares/auth";

export type AppBindings = {
  Bindings: {
    DB: D1Database;
    FRONTEND_URL: string;
    RESEND_API_KEY: string;
  };
  Variables: Variables;
};

export function createProtectedRouter() {
  const router = new Hono<AppBindings>();
  router.use("*", authMiddleware);
  return router;
}

export function createPublicRouter() {
  return new Hono<AppBindings>();
}
