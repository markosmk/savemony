import { describe, expect, it } from "vitest";

import { getPiggyBankSummary, getSavingsEvolution } from "./flexible-mode";
import type { Entry } from "./types";

function makeEntry(date: string, amount: number, type: "deposit" | "withdrawal" = "deposit"): Entry {
  return { id: String(Math.random()), planId: "plan-123", date, amount, type };
}

describe("getPiggyBankSummary", () => {
  it("resumen básico sin retiros", () => {
    const entries = [makeEntry("2026-07-10", 10_000), makeEntry("2026-07-11", 15_000), makeEntry("2026-07-12", 20_000)];
    const summary = getPiggyBankSummary(entries);
    expect(summary.totalSaved).toBe(45_000);
    expect(summary.totalDays).toBe(3);
    expect(summary.longestStreak).toBe(3);
    expect(summary.totalDeposits).toBe(3);
    expect(summary.averageDeposit).toBe(15_000);
    expect(summary.biggestDeposit).toBe(20_000);
    expect(summary.firstDepositDate).toBe("2026-07-10");
    expect(summary.lastDepositDate).toBe("2026-07-12");
  });

  it("resta retiros del total", () => {
    const entries = [makeEntry("2026-07-10", 50_000, "deposit"), makeEntry("2026-07-11", 10_000, "withdrawal")];
    const summary = getPiggyBankSummary(entries);
    expect(summary.totalSaved).toBe(40_000);
    expect(summary.totalWithdrawals).toBe(1);
  });

  it("racha más larga con huecos", () => {
    const entries = [
      makeEntry("2026-07-01", 10_000),
      makeEntry("2026-07-02", 10_000),
      makeEntry("2026-07-04", 10_000), // hueco el 3
      makeEntry("2026-07-05", 10_000),
      makeEntry("2026-07-06", 10_000),
    ];
    const summary = getPiggyBankSummary(entries);
    expect(summary.longestStreak).toBe(3); // 4,5,6
    expect(summary.totalDays).toBe(6); // del 1 al 6
  });

  it("sin entries: todo en cero", () => {
    const summary = getPiggyBankSummary([]);
    expect(summary.totalSaved).toBe(0);
    expect(summary.totalDays).toBe(0);
    expect(summary.longestStreak).toBe(0);
    expect(summary.emotionalMessage).toContain("Aún no hay depósitos");
  });

  it("mensaje emocional para racha de 7+ días", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry(`2026-07-${String(i + 1).padStart(2, "0")}`, 10_000),
    );
    const summary = getPiggyBankSummary(entries);
    expect(summary.longestStreak).toBe(10);
    expect(summary.emotionalMessage).toContain("constancia vale oro");
  });
});

describe("getSavingsEvolution", () => {
  it("evolución acumulada", () => {
    const entries = [
      makeEntry("2026-07-10", 10_000),
      makeEntry("2026-07-11", 15_000),
      makeEntry("2026-07-11", 5_000), // segundo depósito mismo día
      makeEntry("2026-07-12", 20_000),
    ];
    const evo = getSavingsEvolution(entries);
    expect(evo).toHaveLength(3);
    expect(evo[0]).toEqual({ date: "2026-07-10", accumulated: 10_000 });
    expect(evo[1]).toEqual({ date: "2026-07-11", accumulated: 30_000 });
    expect(evo[2]).toEqual({ date: "2026-07-12", accumulated: 50_000 });
  });

  it("con retiro baja la acumulación", () => {
    const entries = [makeEntry("2026-07-10", 50_000, "deposit"), makeEntry("2026-07-11", 20_000, "withdrawal")];
    const evo = getSavingsEvolution(entries);
    expect(evo[1].accumulated).toBe(30_000);
  });
});
