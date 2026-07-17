import { describe, expect, it } from "vitest";

import {
  calculateCurrentStreak,
  calculateLongestStreak,
  getDepositDays,
  getStreakDaysInMonth,
  getStreakInfo,
} from "./streaks";
import type { Entry } from "./types";

function makeEntry(date: string, amount: number = 10_000, type: "deposit" | "withdrawal" = "deposit"): Entry {
  return { id: crypto.randomUUID?.() || String(Math.random()), planId: "plan-123", date, amount, type };
}

describe("getDepositDays", () => {
  it("extrae días únicos con depósitos", () => {
    const entries = [
      makeEntry("2026-07-15", 10_000),
      makeEntry("2026-07-15", 5_000), // mismo día, segundo depósito
      makeEntry("2026-07-16", 10_000),
      makeEntry("2026-07-16", 20_000),
      makeEntry("2026-07-18", 10_000),
    ];
    const days = getDepositDays(entries);
    expect(days).toEqual(["2026-07-15", "2026-07-16", "2026-07-18"]);
  });

  it("ignora retiros", () => {
    const entries = [makeEntry("2026-07-15", 10_000, "deposit"), makeEntry("2026-07-16", 5_000, "withdrawal")];
    expect(getDepositDays(entries)).toEqual(["2026-07-15"]);
  });
});

describe("calculateCurrentStreak", () => {
  it("racha activa de 3 días", () => {
    const days = ["2026-07-13", "2026-07-14", "2026-07-15"];
    expect(calculateCurrentStreak(days, "2026-07-15")).toBe(3);
  });

  it("racha rota: último depósito hace 2 días", () => {
    const days = ["2026-07-13", "2026-07-14"];
    expect(calculateCurrentStreak(days, "2026-07-16")).toBe(0);
  });

  it("racha de 1 día (hoy)", () => {
    const days = ["2026-07-15"];
    expect(calculateCurrentStreak(days, "2026-07-15")).toBe(1);
  });

  it("racha continúa si ayer fue el último depósito", () => {
    const days = ["2026-07-14"];
    expect(calculateCurrentStreak(days, "2026-07-15")).toBe(1);
  });

  it("sin depósitos: 0", () => {
    expect(calculateCurrentStreak([], "2026-07-15")).toBe(0);
  });
});

describe("calculateLongestStreak", () => {
  it("racha más larga histórica", () => {
    const days = [
      "2026-07-01",
      "2026-07-02",
      "2026-07-03", // racha 3
      "2026-07-05", // rota
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
      "2026-07-13", // racha 4
    ];
    expect(calculateLongestStreak(days)).toBe(4);
  });

  it("una sola racha", () => {
    const days = ["2026-07-10", "2026-07-11", "2026-07-12"];
    expect(calculateLongestStreak(days)).toBe(3);
  });

  it("sin depósitos: 0", () => {
    expect(calculateLongestStreak([])).toBe(0);
  });
});

describe("getStreakInfo", () => {
  it("devuelve info completa con badges", () => {
    const entries = [
      makeEntry("2026-07-10"),
      makeEntry("2026-07-11"),
      makeEntry("2026-07-12"),
      makeEntry("2026-07-13"),
      makeEntry("2026-07-14"),
      makeEntry("2026-07-15"),
    ];
    const info = getStreakInfo(entries, "2026-07-15");
    expect(info.currentStreak).toBe(6);
    expect(info.longestStreak).toBe(6);
    expect(info.totalStreakDays).toBe(6);
    expect(info.isStreakActive).toBe(true);
    expect(info.streakAtRisk).toBe(false);
    expect(info.nextMilestone).toBe(7);
    expect(info.daysToNextMilestone).toBe(1);
    expect(info.badges[0].earned).toBe(false); // 7 días no alcanzado
  });

  it("badge de 7 días ganado", () => {
    const entries = Array.from({ length: 7 }, (_, i) => makeEntry(`2026-07-${String(9 + i).padStart(2, "0")}`));
    const info = getStreakInfo(entries, "2026-07-15");
    expect(info.currentStreak).toBe(7);
    expect(info.badges[0].earned).toBe(true); // Semana de Fuego
    expect(info.badges[0].name).toBe("Semana de Fuego");
    expect(info.nextMilestone).toBe(30);
  });

  it("streakAtRisk cuando ayer depositó pero hoy no", () => {
    const entries = [makeEntry("2026-07-14")];
    const info = getStreakInfo(entries, "2026-07-15");
    expect(info.isStreakActive).toBe(false);
    expect(info.streakAtRisk).toBe(true);
    expect(info.currentStreak).toBe(1); // todavía cuenta porque ayer fue
  });
});

describe("getStreakDaysInMonth", () => {
  it("marca días de la racha actual en el calendario", () => {
    const entries = [makeEntry("2026-07-13"), makeEntry("2026-07-14"), makeEntry("2026-07-15")];
    const map = getStreakDaysInMonth(entries, 2026, 7, "2026-07-15");
    expect(map.get(13)?.inStreak).toBe(true);
    expect(map.get(14)?.inStreak).toBe(true);
    expect(map.get(15)?.inStreak).toBe(true);
    expect(map.get(15)?.isToday).toBe(true);
    expect(map.get(12)?.inStreak).toBe(false);
  });
});
