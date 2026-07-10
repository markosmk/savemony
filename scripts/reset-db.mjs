/**
 * Script: reset-db.js
 * Ubicación: scripts/reset-db.js
 *
 * Flujo automatizado:
 * 1. Borra .wrangler/ y migrations/ para reset total
 * 2. Genera migraciones con drizzle-kit
 * 3. Levanta la API temporalmente para que wrangler cree el .db local
 * 4. Aplica migraciones con wrangler d1 migrations apply
 * 5. Levanta la API final
 * 6. Hace POST a /setup para seedear datos iniciales
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
const DB_STATE_DIR = path.join(WRANGLER_DIR, "state", "v3", "d1", "miniflare-D1DatabaseObject");

// ───────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────

const run = (cmd, cwd = ROOT) => {
  console.log(`\n >>>  ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForDbFile = async (timeout = 15000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    // wrangler crea un archivo .sqlite dentro del directorio del binding
    if (existsSync(DB_STATE_DIR)) {
      const files = execSync(`ls -1 "${DB_STATE_DIR}" 2>/dev/null || echo ""`, {
        encoding: "utf-8",
      }).trim();
      if (files.includes(".sqlite")) return true;
    }
    await delay(500);
  }
  throw new Error("Timeout: no se creó el archivo .sqlite de D1 local");
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
  console.log("\n📦 Paso 1/5: Limpiando entorno local...");

  if (existsSync(WRANGLER_DIR)) {
    rmSync(WRANGLER_DIR, { recursive: true, force: true });
    console.log("   ✅ .wrangler/ eliminado");
  }

  if (existsSync(MIGRATIONS_DIR)) {
    rmSync(MIGRATIONS_DIR, { recursive: true, force: true });
    console.log("   ✅ migrations/ eliminado");
  }

  // ── 2. Generar migraciones ──
  console.log("\n📦 Paso 2/5: Generando migraciones con drizzle-kit...");
  run("pnpm run db:generate", ROOT);

  // ── 3. Levantar API temporalmente para crear el .db ──
  console.log("\n📦 Paso 3/5: Levantando API temporal para crear D1 local...");

  const apiTemp = spawn("pnpm", ["run", "dev:api"], {
    cwd: ROOT,
    stdio: "pipe", // Silencioso, no mostramos output para no ensuciar consola
    detached: true, // permite matar el grupo completo, Necesario para luego matar todo el árbol de Wrangler
  });

  try {
    await waitForDbFile();
    console.log("   ✅ Archivo .sqlite creado");
    await delay(2000); // Darle respiro a SQLite para cerrar handles iniciales
  } catch (err) {
    killProcessTree(apiTemp);
    throw err;
  }

  // Detenemos la API temporal para poder aplicar la migración
  killProcessTree(apiTemp);
  console.log("   ✅ API temporal detenida");

  await delay(1000); // Esperar que libere el archivo en el OS

  // ── 4. Aplicar migraciones ──
  console.log("\n📦 Paso 4/5: Aplicando migraciones a D1 local...");
  run("CI=true pnpm run db:migrate", ROOT);

  // ── 5. Aplicar Seed (opcional) ──
  console.log("\n📦 Paso 5/5: Aplicando seed de datos...");

  // iniciamos de nuevo la API en segundo plano
  const apiSeed = spawn("pnpm", ["run", "dev:api"], {
    cwd: ROOT,
    detached: true,
    stdio: "ignore", // si no queremos ver la terminal de la API
  });

  // esperar a que la API esté lista
  await delay(3000);

  try {
    execSync("curl -s -X POST http://localhost:8787/setup", { stdio: "inherit", timeout: 10000 });
    console.log("   ✅ Seeds aplicados");
  } catch {
    console.warn("   ⚠️  No se pudo ejecutar el seed automáticamente.");
    console.warn("   ⚠️  Intenta manualmente: curl -X POST http://localhost:8787/setup");
  } finally {
    killProcessTree(apiSeed);
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log("  ✨ ¡TODO LISTO Y LIMPIO!");
  console.log("═══════════════════════════════════════════════");
  console.log("👉 Ahora puedes levantar tu servidor en la terminal:");
  console.log("   pnpm run dev:api");

  process.exit(0);
};

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
