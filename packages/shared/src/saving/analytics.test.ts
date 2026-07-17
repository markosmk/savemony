import { describe, expect, it } from "vitest";

import type { Entry } from "../types";
import {
  getDayOfWeekStats,
  getMonthlyTrends,
  getPeriodComparisons,
  getSavingsVelocity,
  getWeeklyTrends,
} from "./analytics";

function makeEntry(date: string, amount: number, type: "deposit" | "withdrawal" = "deposit"): Entry {
  return { id: String(Math.random()), planId: "123plan", date, amount, type, reason: null };
}

describe("getWeeklyTrends", () => {
  it("agrupa depósitos por semana", () => {
    const entries = [
      makeEntry("2026-07-13", 10_000), // Lunes semana 1
      makeEntry("2026-07-14", 15_000), // Martes semana 1
      makeEntry("2026-07-20", 20_000), // Lunes semana 2
      makeEntry("2026-07-21", 10_000), // Martes semana 2
    ];
    const trends = getWeeklyTrends(entries, 8);
    expect(trends).toHaveLength(2);
    expect(trends[0].deposits).toBe(25_000); // semana 1
    expect(trends[1].deposits).toBe(30_000); // semana 2
    expect(trends[0].net).toBe(25_000);
  });

  it("incluye retiros en el neto", () => {
    const entries = [makeEntry("2026-07-13", 50_000, "deposit"), makeEntry("2026-07-14", 10_000, "withdrawal")];
    const trends = getWeeklyTrends(entries);
    expect(trends[0].net).toBe(40_000);
  });
});

describe("getMonthlyTrends", () => {
  it("agrupa por mes", () => {
    const entries = [makeEntry("2026-06-15", 50_000), makeEntry("2026-07-10", 30_000), makeEntry("2026-07-20", 20_000)];
    const trends = getMonthlyTrends(entries);
    expect(trends).toHaveLength(2);
    expect(trends[0].deposits).toBe(50_000); // Junio
    expect(trends[1].deposits).toBe(50_000); // Julio
  });
});

describe("getDayOfWeekStats", () => {
  it("encuentra el mejor día para ahorrar", () => {
    const entries = [
      makeEntry("2026-07-13", 10_000), // Lunes
      makeEntry("2026-07-14", 21_000), // Martes
      makeEntry("2026-07-20", 15_000), // Lunes (siguiente)
      makeEntry("2026-07-21", 5_000), // Martes
    ];
    const stats = getDayOfWeekStats(entries);
    expect(stats[0].day).toBe("Martes"); // 26k total
    expect(stats[0].totalDeposited).toBe(26_000);
    expect(stats[1].day).toBe("Lunes"); // 25k total
    expect(stats[0].average).toBe(13_000); // 26k / 2
  });
});

describe("getSavingsVelocity", () => {
  it("calcula velocidad y proyección", () => {
    const entries = [makeEntry("2026-07-01", 10_000), makeEntry("2026-07-08", 10_000), makeEntry("2026-07-15", 10_000)];
    const velocity = getSavingsVelocity(entries, 100_000, "2026-08-15", "2026-07-15");
    expect(velocity.averagePerDay).toBeGreaterThan(0);
    expect(velocity.averagePerWeek).toBe(velocity.averagePerDay * 7);
    expect(velocity.projectedCompletionDate).not.toBeNull();
    expect(velocity.onTrack).toBeDefined();
  });

  it("sin meta: projectedCompletionDate es null", () => {
    const entries = [makeEntry("2026-07-15", 10_000)];
    const velocity = getSavingsVelocity(entries, null, null, "2026-07-15");
    expect(velocity.projectedCompletionDate).toBeNull();
    expect(velocity.daysToGoal).toBeNull();
  });

  it("sin entries: todo en cero", () => {
    const velocity = getSavingsVelocity([], 100_000, "2026-08-15", "2026-07-15");
    expect(velocity.averagePerDay).toBe(0);
    expect(velocity.projectedCompletionDate).toBeNull();
  });
});

describe("getPeriodComparisons", () => {
  it("compara esta semana vs semana pasada", () => {
    // Hoy es 2026-07-15 (Miércoles)
    const entries = [
      makeEntry("2026-07-14", 10_000), // esta semana
      makeEntry("2026-07-13", 10_000), // esta semana
      makeEntry("2026-07-07", 5_000), // semana pasada
    ];
    const comp = getPeriodComparisons(entries);
    expect(comp.thisWeek.total).toBe(20_000);
    expect(comp.lastWeek.total).toBe(5_000);
    expect(comp.thisWeek.changePercent).toBe(300); // (20-5)/5 = 300%
  });
});
