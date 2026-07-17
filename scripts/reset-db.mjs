/**
 * Script: reset-db.js
 * Ubicación: scripts/reset-db.js
 *
 * Flujo automatizado:
 * 1. Borra .wrangler/ y migrations/ para reset total
 * 2. Genera migraciones con drizzle-kit
 * 3. Aplica migraciones con wrangler d1 migrations apply
 * 4. Levanta la API final (espera hasta que esté lista, llamando a /health)
 * 5. Hace POST a /setup para seedear datos iniciales
 *
 * Uso: node scripts/reset-db.mjs
 */

import { execSync, spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const API_DIR = path.join(ROOT, "apps", "api");
const WRANGLER_DIR = path.join(API_DIR, ".wrangler");
const MIGRATIONS_DIR = path.join(API_DIR, "migrations");

// ───────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────

const run = (cmd, cwd = ROOT) => {
  console.log(`\n >>>  ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForApi = async (url = "http://127.0.0.1:8787/health", timeout = 15000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const code = execSync(`curl -s -o /dev/null -w "%{http_code}" "${url}"`, { encoding: "utf-8" }).trim();
      if (code === "200") return true;
    } catch {
      // API not ready yet
    }
    await delay(500);
  }
  throw new Error("Timeout: la API no respondió a tiempo");
};

const killProcessTree = (childProcess) => {
  if (!childProcess?.pid) return;
  try {
    process.kill(-childProcess.pid, "SIGKILL");
  } catch {
    try {
      childProcess.kill("SIGKILL");
    } catch {
      // already dead
    }
  }
};

// ───────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────

const main = async () => {
  console.log("═══════════════════════════════════════════════");
  console.log("  RESET COMPLETO DE BASE DE DATOS LOCAL");
  console.log("═══════════════════════════════════════════════");

  // ── 0. Matar posibles procesos huérfanos previos en el puerto 8787/8788 ──
  try {
    // execSync("npx --yes kill-port 8787 8788", { stdio: "ignore" });
    // Busca los procesos en esos puertos y los mata al instante, solo Mac/Linux
    execSync("lsof -t -i:8787 -i:8788 | xargs -r kill -9", { stdio: "ignore" });
  } catch {}

  // ── 1. Limpiar ──
  console.log("\n📦 Paso 1/4: Limpiando entorno local...");

  if (existsSync(WRANGLER_DIR)) {
    rmSync(WRANGLER_DIR, { recursive: true, force: true });
    console.log("   ✅ .wrangler/ eliminado");
  }

  if (existsSync(MIGRATIONS_DIR)) {
    rmSync(MIGRATIONS_DIR, { recursive: true, force: true });
    console.log("   ✅ migrations/ eliminado");
  }

  // ── 2. Generar migraciones ──
  console.log("\n📦 Paso 2/4: Generando migraciones con drizzle-kit...");
  run("pnpm run db:generate", ROOT);

  // ── 3. Aplicar migraciones ──
  console.log("\n📦 Paso 3/4: Aplicando migraciones a D1 local...");
  run("CI=true pnpm run db:migrate", ROOT);

  // ── 4. Aplicar Seed (opcional) ──
  console.log("\n📦 Paso 4/4: Aplicando seed de datos...");

  // iniciamos de nuevo la API en segundo plano
  const apiSeed = spawn("pnpm run dev:api", {
    cwd: ROOT,
    detached: true,
    stdio: "pipe",
    shell: true,
  });

  let apiOutput = "";
  apiSeed.stdout?.on("data", (data) => {
    apiOutput += data.toString();
  });
  apiSeed.stderr?.on("data", (data) => {
    apiOutput += data.toString();
  });

  // esperar a que la API esté lista
  await waitForApi();

  try {
    // 127.0... en vez de localhost para prevenir posibles fallos en la resolución de DNS en sistemas macOS que priorizan IPv6.
    execSync("curl -s -X POST http://127.0.0.1:8787/setup", {
      stdio: "ignore", // no mostrar respuesta de la api
      timeout: 10000,
    });
    console.log("   ✅ Seeds aplicados");
  } catch (_err) {
    console.warn("   ⚠️  No se pudo ejecutar el seed automáticamente.");
    console.warn("   ⚠️  Intenta manualmente: curl -X POST http://127.0.0.1:8787/setup");
    console.log("\n--- Logs de la API ---");
    console.log(apiOutput);
    console.log("----------------------\n");
  } finally {
    killProcessTree(apiSeed);
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log("   ¡TODO LISTO Y LIMPIO!");
  console.log("═══════════════════════════════════════════════");
  console.log("   Ahora puedes levantar tu servidor en la terminal:");
  console.log("   pnpm run dev:api");

  process.exit(0);
};

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
