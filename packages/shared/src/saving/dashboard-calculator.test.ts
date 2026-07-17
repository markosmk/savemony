import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Entry, Plan } from "../types";
import {
  countRemainingPeriods,
  formatEntries,
  getCalendarMonthData,
  getCurrentPeriodInfo,
  getSmartSuggestions,
  getTotalProgress,
  getWithdrawalImpact,
} from "./dashboard-calculator";

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: String(Math.random()),
    planId: "plan-1",
    date: "2026-07-15",
    amount: 10_000,
    type: "deposit",
    reason: null,
    ...overrides,
  };
}

const basePlan: Plan = {
  id: "plan-1",
  userId: "user-1",
  name: "MacBook",
  goalAmount: 400_000,
  endDate: "2026-08-15",
  frequencyType: "WEEKLY",
  suggestedQuota: 80_000,
  isFlexible: false,
  status: "active",
  createdAt: "2026-07-15",
  updatedAt: "2026-07-15",
};

// Mock todayUTC para tests determinísticos
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-15T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("countRemainingPeriods", () => {
  it("WEEKLY: cuenta semanas restantes desde hoy hasta endDate", () => {
    const count = countRemainingPeriods("WEEKLY", "2026-08-15", "2026-07-15");
    // Desde 15 Jul hasta 15 Ago hay ~5 semanas
    expect(count).toBeGreaterThan(0);
  });

  it("DAILY: cuenta días restantes", () => {
    const count = countRemainingPeriods("DAILY", "2026-07-20", "2026-07-15", undefined, "2026-07-15");
    expect(count).toBe(6); // 15,16,17,18,19,20
  });

  it("no cuenta períodos pasados cuando fromDate es hoy", () => {
    const count = countRemainingPeriods("WEEKLY", "2026-08-15", "2026-07-01");
    expect(count).toBe(5);
  });

  it("no debería contar períodos pasados cuando createdAt es anterior a hoy", () => {
    // Plan creado hace 2 semanas, hoy es 2026-07-15
    const count = countRemainingPeriods("WEEKLY", "2026-08-15", "2026-07-01");
    // Desde 01 Jul hasta 15 Ago hay ~7 semanas, pero desde HOY (15 Jul) solo ~5
    // Si cuenta desde createdAt, devuelve ~7 (incorrecto)
    // Si cuenta desde hoy, devuelve ~5 (correcto)
    const today = "2026-07-15";
    const weeksFromToday = Math.ceil(
      (new Date("2026-08-15").getTime() - new Date(today).getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    expect(count).toBeLessThanOrEqual(weeksFromToday + 1);
  });
});

describe("getCurrentPeriodInfo", () => {
  it("WEEKLY: estado normal sin depósitos", () => {
    const info = getCurrentPeriodInfo(basePlan, [], "2026-07-15");
    expect(info.state).toBe("normal");
    expect(info.inputDisabled).toBe(false);
    expect(info.canDepositToday).toBe(true);
  });

  it("WEEKLY: estado parcial deshabilita el input", () => {
    const entries = [makeEntry({ amount: 30_000, date: "2026-07-15" })];
    const info = getCurrentPeriodInfo(basePlan, entries, "2026-07-15");
    expect(info.state).toBe("partial");
    expect(info.inputDisabled).toBe(true); // input deshabilitado en parcial
    expect(info.depositedThisPeriod).toBe(30_000);
    expect(info.remaining).toBeGreaterThan(0);
  });

  it("WEEKLY: estado completado", () => {
    const entries = [makeEntry({ amount: 80_000, date: "2026-07-15" })];
    const info = getCurrentPeriodInfo(basePlan, entries, "2026-07-15");
    expect(info.state).toBe("completed");
    expect(info.inputDisabled).toBe(true);
  });

  /**
   * Retiros dentro del período NO restan del depositedThisPeriod
   */

  it("retiro dentro del período debería restar del neto", () => {
    // Deposito 80k, retiro 10k → neto 70k → debería ser partial (faltan 10k)
    // Cuota recalculada: (400k - 70k) / 5 semanas = 66k → redondea a 66k
    // remaining = 66k - 70k = 0 → completed (porque neto > cuota)
    const entries = [
      makeEntry({ amount: 50_000, date: "2026-07-15", type: "deposit" }),
      makeEntry({ amount: 10_000, date: "2026-07-15", type: "withdrawal" }),
    ];
    const info = getCurrentPeriodInfo(basePlan, entries, "2026-07-15");

    expect(info.remaining).toBeGreaterThan(0);
    expect(info.state).toBe("partial");
    expect(info.withdrawnThisPeriod).toBe(10_000);
    expect(info.netThisPeriod).toBe(40_000);
    expect(info.depositedThisPeriod).toBe(50_000);
    // El estado depende de la cuota recalculada, verificamos que neto sea correcto
    expect(info.netThisPeriod).toBe(info.depositedThisPeriod - info.withdrawnThisPeriod);
  });

  it("múltiples retiros acumulados en el período", () => {
    const entries = [
      makeEntry({ amount: 100_000, date: "2026-07-15", type: "deposit" }),
      makeEntry({ amount: 20_000, date: "2026-07-15", type: "withdrawal" }),
      makeEntry({ amount: 15_000, date: "2026-07-15", type: "withdrawal" }),
    ];
    const info = getCurrentPeriodInfo(basePlan, entries, "2026-07-15");
    // Neto: 100k - 35k = 65k, cuota 80k → partial con 15k restantes
    expect(info.state).toBe("partial");
    expect(info.withdrawnThisPeriod).toBe(35_000);
    expect(info.netThisPeriod).toBe(65_000);
    expect(info.depositedThisPeriod).toBe(100_000);
    // Verificar consistencia: neto = depositos - retiros
    expect(info.netThisPeriod).toBe(info.depositedThisPeriod - info.withdrawnThisPeriod);
  });

  it("retiro que deja saldo negativo en el período: neto es negativo", () => {
    const entries = [
      makeEntry({ amount: 50_000, date: "2026-07-15", type: "deposit" }),
      makeEntry({ amount: 60_000, date: "2026-07-15", type: "withdrawal" }),
    ];
    const info = getCurrentPeriodInfo(basePlan, entries, "2026-07-15");

    // Neto: -10k, cuota 80k → normal (debería ahorrar 80k)
    expect(info.state).toBe("normal");
    expect(info.netThisPeriod).toBe(-10_000);
    expect(info.withdrawnThisPeriod).toBe(60_000);
    expect(info.depositedThisPeriod).toBe(50_000);
    // Si neto es negativo, remaining debe incluir la cuota + la deuda
    expect(info.remaining).toBeGreaterThan(info.quotaForPeriod);
  });

  it("retiro en día anterior del mismo período: se incluye en el período", () => {
    // Período semanal: 13 Jul (Lun) a 19 Jul (Dom)
    // Hoy: 15 Jul (Mié)
    const entries = [
      makeEntry({ amount: 80_000, date: "2026-07-13", type: "deposit" }), // Lunes
      makeEntry({ amount: 20_000, date: "2026-07-14", type: "withdrawal" }), // Martes
    ];
    const info = getCurrentPeriodInfo(basePlan, entries, "2026-07-15");

    // Neto del período: 80k - 20k = 60k, cuota 80k → partial
    expect(info.withdrawnThisPeriod).toBe(20_000);
    expect(info.netThisPeriod).toBe(60_000);
    expect(info.depositedThisPeriod).toBe(80_000);
    expect(info.state).toBe("partial");
  });

  /**
   * Estados determinísticos con meta controlada
   */

  it("con meta alta y retiros: estado es partial (cuota > neto)", () => {
    // Meta 1M, 5 semanas → cuota ~200k. Neto 65k < 200k → partial
    const plan: Plan = { ...basePlan, goalAmount: 1_000_000 };
    const entries = [
      makeEntry({ amount: 100_000, date: "2026-07-15", type: "deposit" }),
      makeEntry({ amount: 35_000, date: "2026-07-15", type: "withdrawal" }),
    ];
    const info = getCurrentPeriodInfo(plan, entries, "2026-07-15");

    expect(info.netThisPeriod).toBe(65_000);
    expect(info.state).toBe("partial");
    expect(info.remaining).toBeGreaterThan(0);
  });

  it("con meta alta y saldo negativo: estado es normal", () => {
    // Meta 1M, neto -10k < 0 → normal
    const plan: Plan = { ...basePlan, goalAmount: 1_000_000 };
    const entries = [
      makeEntry({ amount: 50_000, date: "2026-07-15", type: "deposit" }),
      makeEntry({ amount: 60_000, date: "2026-07-15", type: "withdrawal" }),
    ];
    const info = getCurrentPeriodInfo(plan, entries, "2026-07-15");

    expect(info.netThisPeriod).toBe(-10_000);
    expect(info.state).toBe("normal");
  });

  it("con meta baja y neto alto: estado es completed", () => {
    // Meta 50k, neto 65k > 50k → completed
    const plan: Plan = { ...basePlan, goalAmount: 50_000 };
    const entries = [
      makeEntry({ amount: 100_000, date: "2026-07-15", type: "deposit" }),
      makeEntry({ amount: 35_000, date: "2026-07-15", type: "withdrawal" }),
    ];
    const info = getCurrentPeriodInfo(plan, entries, "2026-07-15");

    expect(info.netThisPeriod).toBe(65_000);
    expect(info.state).toBe("completed");
  });

  it("meta muy alta → cuota alta → neto nunca alcanza en un depósito", () => {
    // Meta 10M, 5 semanas → cuota ~2M. Un depósito de 100k nunca alcanza.
    const plan: Plan = { ...basePlan, goalAmount: 10_000_000 };
    const entries = [makeEntry({ amount: 100_000, date: "2026-07-15", type: "deposit" })];
    const info = getCurrentPeriodInfo(plan, entries, "2026-07-15");

    expect(info.netThisPeriod).toBe(100_000);
    expect(info.quotaForPeriod).toBeGreaterThan(100_000);
    expect(info.remaining).toBeGreaterThan(0);
  });

  it("meta muy baja → cuota baja → un depósito pequeño completa", () => {
    // Meta 10k, un depósito de 50k completa fácil
    const plan: Plan = { ...basePlan, goalAmount: 10_000 };
    const entries = [makeEntry({ amount: 50_000, date: "2026-07-15", type: "deposit" })];
    const info = getCurrentPeriodInfo(plan, entries, "2026-07-15");

    expect(info.netThisPeriod).toBe(50_000);
    expect(info.state).toBe("completed");
  });

  /**
   * Recálculo de cuota
   */

  it("cuota se recalcula con fórmula (meta - ahorrado) / períodos restantes", () => {
    // Meta 400k, ya ahorrado 100k, quedan ~4 semanas
    const entries = [
      makeEntry({ amount: 100_000, date: "2026-07-08" }), // semana pasada
    ];
    const info = getCurrentPeriodInfo(basePlan, entries, "2026-07-15");
    // remainingGoal = 300k, remainingPeriods = ~4
    // quota = ceil(300k/4 / 1000) * 1000 = 80k (aprox)
    expect(info.quotaForPeriod).toBeGreaterThan(0);
  });

  it("BUG: cuota con retiros previos debería ser mayor", () => {
    // Meta 400k, depositado 100k, retirado 50k → netSaved 50k
    // remainingGoal = 350k, ~4 semanas → cuota ~87.5k → redondea a 88k
    const entries = [
      makeEntry({ amount: 100_000, date: "2026-07-08", type: "deposit" }),
      makeEntry({ amount: 50_000, date: "2026-07-10", type: "withdrawal" }),
    ];
    const info = getCurrentPeriodInfo(basePlan, entries, "2026-07-15");

    // Con retiro previo, la cuota debería ser mayor que sin retiro
    const infoWithoutWithdrawal = getCurrentPeriodInfo(
      basePlan,
      [makeEntry({ amount: 100_000, date: "2026-07-08" })],
      "2026-07-15",
    );

    expect(info.quotaForPeriod).toBeGreaterThan(infoWithoutWithdrawal.quotaForPeriod);
  });

  /**
   * Edge Cases
   */

  it("BUG: plan vencido (endDate pasado) no debería dar Infinity", () => {
    const plan: Plan = { ...basePlan, endDate: "2026-07-10" };
    const info = getCurrentPeriodInfo(plan, [], "2026-07-15");

    // No debería dar Infinity ni NaN
    expect(Number.isFinite(info.quotaForPeriod), "El resultado debe ser un número finito").toBe(true);
    expect(info.quotaForPeriod).not.toBeNaN();
    expect(info.quotaForPeriod).toBeGreaterThanOrEqual(0);
  });

  it("WEEKDAYS: bloquea fin de semana", () => {
    const plan: Plan = { ...basePlan, frequencyType: "WEEKDAYS" };
    // 12 Jul 2026 = Domingo
    const info = getCurrentPeriodInfo(plan, [], "2026-07-12");
    expect(info.canDepositToday).toBe(false);
    expect(info.blockMessage).toContain("día hábil");
    expect(info.inputDisabled).toBe(true);
  });

  it("plan flexible: sin cuotas", () => {
    const plan: Plan = { ...basePlan, isFlexible: true, goalAmount: null, endDate: null };
    const info = getCurrentPeriodInfo(plan, [], "2026-07-15");
    expect(info.state).toBe("normal");
    expect(info.quotaForPeriod).toBe(0);
    expect(info.inputDisabled).toBe(false);
  });

  it("meta alcanzada: estado completado", () => {
    const entries = [makeEntry({ amount: 400_000, date: "2026-07-10" })];
    const info = getCurrentPeriodInfo(basePlan, entries, "2026-07-15");
    expect(info.state).toBe("completed");
    expect(info.message).toContain("Meta alcanzada");
  });

  it("BUG: meta alcanzada con retiros posteriores debería recalcular", () => {
    // Llegué a la meta, pero retiré después
    const entries = [
      makeEntry({ amount: 400_000, date: "2026-07-10", type: "deposit" }),
      makeEntry({ amount: 50_000, date: "2026-07-15", type: "withdrawal" }),
    ];
    const info = getCurrentPeriodInfo(basePlan, entries, "2026-07-15");

    // NetSaved = 350k, meta 400k → no está completada
    expect(info.state).not.toBe("completed");
    expect(info.state).toBe("normal");
  });
});

describe("getTotalProgress", () => {
  it("calcula progreso con retiros", () => {
    const entries = [
      makeEntry({ amount: 200_000, type: "deposit" }),
      makeEntry({ amount: 50_000, type: "withdrawal" }),
    ];
    const progress = getTotalProgress(basePlan, entries);
    expect(progress.netSaved).toBe(150_000);
    expect(progress.percentage).toBe(38); // 150/400 = 37.5 round.. redondea hacia el entero arriba → 38
    expect(progress.remainingToGoal).toBe(250_000);
  });

  it("progreso 100%", () => {
    const entries = [makeEntry({ amount: 400_000, type: "deposit" })];
    const progress = getTotalProgress(basePlan, entries);
    expect(progress.percentage).toBe(100);
    expect(progress.isCompleted).toBe(true);
    expect(progress.remainingToGoal).toBe(0);
  });

  it("progreso con retiros que dejan saldo negativo", () => {
    const entries = [
      makeEntry({ amount: 100_000, type: "deposit" }),
      makeEntry({ amount: 150_000, type: "withdrawal" }),
    ];
    const progress = getTotalProgress(basePlan, entries);
    expect(progress.netSaved).toBe(0); // Math.max(0, ...)
    expect(progress.percentage).toBe(0);
  });
});

describe("getSmartSuggestions", () => {
  it("devuelve montos más frecuentes", () => {
    const entries = [
      makeEntry({ amount: 10_000 }),
      makeEntry({ amount: 10_000 }),
      makeEntry({ amount: 10_000 }),
      makeEntry({ amount: 20_000 }),
    ];
    const suggestions = getSmartSuggestions(entries);
    expect(suggestions[0].amount).toBe(10_000);
    expect(suggestions[0].count).toBe(3);
  });

  it("sin entradas devuelve array vacío", () => {
    const suggestions = getSmartSuggestions([]);
    expect(suggestions).toHaveLength(0);
  });

  it("solo considera depósitos", () => {
    const entries = [
      makeEntry({ amount: 10_000, type: "deposit" }),
      makeEntry({ amount: 10_000, type: "deposit" }),
      makeEntry({ amount: 10_000, type: "withdrawal" }),
    ];
    const suggestions = getSmartSuggestions(entries);
    expect(suggestions[0].count).toBe(2); // Solo los 2 deposits
  });
});

describe("getCalendarMonthData", () => {
  it("devuelve datos para un mes", () => {
    const entries = [makeEntry({ amount: 50_000, date: "2026-07-15" })];
    const data = getCalendarMonthData(entries, 2026, 7);
    expect(data).toHaveLength(31); // Julio tiene 31 días
    expect(data[14].day).toBe(15); // Índice 14 = día 15
    expect(data[14].amount).toBe(50_000);
    expect(data[14].hasDeposit).toBe(true);
  });

  it("febrero en año no bisiesto", () => {
    const entries: Entry[] = [];
    const data = getCalendarMonthData(entries, 2026, 2);
    expect(data).toHaveLength(28);
  });

  it("febrero en año bisiesto", () => {
    const entries: Entry[] = [];
    const data = getCalendarMonthData(entries, 2024, 2);
    expect(data).toHaveLength(29);
  });

  it("meses de 30 días", () => {
    const entries: Entry[] = [];
    const data = getCalendarMonthData(entries, 2026, 4); // Abril
    expect(data).toHaveLength(30);
  });

  it("intensidad se calcula correctamente", () => {
    const entries = [
      makeEntry({ amount: 100_000, date: "2026-07-15" }),
      makeEntry({ amount: 50_000, date: "2026-07-20" }),
    ];
    const data = getCalendarMonthData(entries, 2026, 7);
    expect(data[14].intensity).toBe(1); // 100k / 100k = 1
    expect(data[19].intensity).toBe(0.5); // 50k / 100k = 0.5
  });
});

describe("getWithdrawalImpact", () => {
  it("calcula impacto de un retiro", () => {
    const entries = [makeEntry({ amount: 200_000, type: "deposit" })];
    const impact = getWithdrawalImpact(basePlan, entries, 50_000);
    expect(impact.newPercentage).toBe(38); // (200k - 50k) / 400k = 37.5 → 38
    expect(impact.daysDelayed).toBeGreaterThan(0);
  });

  it("BUG: retiro que deja saldo negativo", () => {
    const entries = [makeEntry({ amount: 30_000, type: "deposit" })];
    const impact = getWithdrawalImpact(basePlan, entries, 50_000);
    expect(impact.newPercentage).toBe(0);
    expect(impact.daysDelayed).toBeGreaterThan(0);
  });

  it("BUG: plan sin meta no debería fallar", () => {
    const plan: Plan = { ...basePlan, goalAmount: null };
    const entries = [makeEntry({ amount: 100_000, type: "deposit" })];
    const impact = getWithdrawalImpact(plan, entries, 10_000);
    expect(impact.daysDelayed).toBe(0);
  });

  it("BUG: plan vencido no debería dar Infinity", () => {
    const plan: Plan = { ...basePlan, endDate: "2026-07-10" };
    const entries = [makeEntry({ amount: 200_000, type: "deposit" })];
    const impact = getWithdrawalImpact(plan, entries, 50_000);

    expect(Number.isFinite(impact.daysDelayed), "El resultado debe ser un número finito").toBe(true);
    expect(impact.daysDelayed).not.toBeNaN(); // o assert.isFinite(impact.daysDelayed);
  });
});

describe("formatEntries", () => {
  it("formatea entradas recientes", () => {
    const entries = [
      makeEntry({ date: "2026-07-15", amount: 10_000 }),
      makeEntry({ date: "2026-07-14", amount: 20_000 }),
    ];
    const formatted = formatEntries(entries, "2026-07-15");
    expect(formatted).toHaveLength(2);
    expect(formatted[0].isRecent).toBe(true);
    expect(formatted[1].isRecent).toBe(true);
  });

  it("entrada de hace 8 días no es reciente", () => {
    const entries = [makeEntry({ date: "2026-07-07" })];
    const formatted = formatEntries(entries, "2026-07-15");
    expect(formatted[0].isRecent).toBe(false);
  });

  it("BUG: entrada futura no debería ser reciente", () => {
    const entries = [makeEntry({ date: "2026-07-20" })];
    const formatted = formatEntries(entries, "2026-07-15");
    expect(formatted[0].isRecent).toBe(false);
  });

  it("ordena por fecha descendente", () => {
    const entries = [
      makeEntry({ date: "2026-07-10", id: "a" }),
      makeEntry({ date: "2026-07-15", id: "b" }),
      makeEntry({ date: "2026-07-12", id: "c" }),
    ];
    const formatted = formatEntries(entries, "2026-07-15");
    expect(formatted[0].date).toBe("2026-07-15");
    expect(formatted[1].date).toBe("2026-07-12");
    expect(formatted[2].date).toBe("2026-07-10");
  });
});
