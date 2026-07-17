import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

import { rateLimit } from "./middlewares/rate-limit";
import accountRoutes from "./routes/account";
import authRoutes from "./routes/auth";
import entriesRouter from "./routes/entries";
import plansRoutes from "./routes/plans";
import settingsRoutes from "./routes/settings";
import setupRouter from "./routes/setup";
import statsRouter from "./routes/stats";
import { AppError } from "./types";

export const app = new Hono<{ Bindings: { DB: D1Database; ENVIRONMENT: string } }>();

// Global security middleware
app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowed = ["http://localhost:5173", "http://localhost:3000"];
      return allowed.includes(origin) ? origin : allowed[0];
    },
    credentials: true,
    // 	origin: "*", // En producción cambiaremos esto por la URL de tu frontend
    // allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    // allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("*", secureHeaders());

// Rate limiting: auth stricter, webhooks permissive, general protected
app.use("/api/auth/login", rateLimit({ windowMs: 60_000, max: 5 }));
app.use("/api/*", rateLimit({ windowMs: 60_000, max: 100 }));
app.use("/api/auth/forgot-password", rateLimit({ windowMs: 60_000, max: 5 }));

// Mount modular routes
app.route("/api/auth", authRoutes);
app.route("/api/account", accountRoutes);
app.route("/api/settings", settingsRoutes);
app.route("/api/plans", plansRoutes);
app.route("/api/plans/:planId/entries", entriesRouter);
app.route("/api/stats", statsRouter);
app.route("/setup", setupRouter);

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));
app.notFound((c) => c.json({ error: "Not Found" }, 404));

// Global error handler
app.onError((err, c) => {
  if (err instanceof AppError) {
    console.error("AppError:", err.message, "— status:", err.status);
    return c.json({ error: err.message }, err.status as 400 | 401 | 403 | 404 | 500 | 502 | 504);
  }
  console.error("Unhandled error:", err);
  return c.json({ error: "Error interno del servidor. Intentá más tarde." }, 500);
});

export default app;
