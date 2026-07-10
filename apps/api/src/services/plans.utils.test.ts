import { describe, expect, it } from "vitest";

import { generateGrid, rebalanceCells } from "./plans.utils";

describe("generateGrid", () => {
  it("custom_grid + amountMode rounding: todos los montos son multiplos", () => {
    const amounts = generateGrid({
      method: "custom_grid",
      target: 5_000_000,
      rows: 10,
      cols: 10,
      amountMode: "rounding",
      roundingMultiple: 25_000,
    });
    expect(amounts.length).toBe(100);
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(5_000_000);
    for (const a of amounts) {
      expect(a % 25_000).toBe(0);
      expect(a).toBeGreaterThanOrEqual(25_000);
    }
  });

  it("custom_grid + amountMode rounding: respeta min/max y multiplos de 5000", () => {
    const amounts = generateGrid({
      method: "custom_grid",
      target: 1_000_000,
      rows: 5,
      cols: 5,
      amountMode: "rounding",
      minAmount: 10_000,
      maxAmount: 100_000,
      roundingMultiple: 5_000,
    });
    expect(amounts.length).toBe(25);
    const sum = amounts.reduce((a, b) => a + b, 0);
    expect(sum).toBe(1_000_000);
    for (const a of amounts) {
      expect(a % 5_000).toBe(0);
      expect(a).toBeGreaterThanOrEqual(10_000);
      expect(a).toBeLessThanOrEqual(100_000);
    }
  });

  it("custom_grid + amountMode rounding: target no divisible por multiplo (al menos 95% exactos)", () => {
    const amounts = generateGrid({
      method: "custom_grid",
      target: 1_000_003,
      rows: 10,
      cols: 10,
      amountMode: "rounding",
      roundingMultiple: 1_000,
    });
    const sum = amounts.reduce((a, b) => a + b, 0);
    expect(sum).toBe(1_000_003);
    const multiples = amounts.filter((a) => a % 1_000 === 0).length;
    expect(multiples).toBeGreaterThanOrEqual(95);
  });

  it("custom_grid + amountMode preferred: suma exacta", () => {
    const amounts = generateGrid({
      method: "custom_grid",
      target: 500_000,
      rows: 10,
      cols: 10,
      amountMode: "preferred",
      preferredAmounts: [20_000, 25_000],
    });
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(500_000);
  });

  it("custom_grid + amountMode preferred insuficientes: aun asi suma exacta", () => {
    const amounts = generateGrid({
      method: "custom_grid",
      target: 10_000,
      rows: 2,
      cols: 2,
      amountMode: "preferred",
      preferredAmounts: [1_000, 2_000],
    });
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(10_000);
  });

  it("custom_grid sin amountMode (default range): genera aleatorio con suma exacta", () => {
    const amounts = generateGrid({
      method: "custom_grid",
      target: 1_000_000,
      rows: 10,
      cols: 10,
    });
    expect(amounts.length).toBe(100);
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(1_000_000);
  });

  it("custom_grid: respeta min/max en modo range", () => {
    const amounts = generateGrid({
      method: "custom_grid",
      target: 500_000,
      rows: 5,
      cols: 5,
      minAmount: 10_000,
      maxAmount: 50_000,
    });
    expect(amounts.length).toBe(25);
    for (const a of amounts) {
      expect(a).toBeGreaterThanOrEqual(10_000);
      expect(a).toBeLessThanOrEqual(50_000);
    }
  });

  it("no_spend + amountMode rounding: usa multiplos", () => {
    const amounts = generateGrid({
      method: "no_spend",
      target: 300_000,
      rows: 5,
      cols: 7,
      amountMode: "rounding",
      roundingMultiple: 5_000,
    });
    expect(amounts.length).toBe(35);
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(300_000);
    for (const a of amounts) {
      expect(a % 5_000).toBe(0);
    }
  });

  it("52_weeks: 52 celdas exactas con patron fijo", () => {
    const amounts = generateGrid({
      method: "52_weeks",
      target: 1_000_000,
      rows: 4,
      cols: 13,
    });
    expect(amounts.length).toBe(52);
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(1_000_000);
  });

  it("52_weeks ignora amountMode y roundingMultiple", () => {
    const amounts = generateGrid({
      method: "52_weeks",
      target: 1_000_000,
      rows: 4,
      cols: 13,
      amountMode: "rounding",
      roundingMultiple: 25_000,
    });
    expect(amounts.length).toBe(52);
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(1_000_000);
  });

  it("100_envelopes: 100 celdas exactas", () => {
    const amounts = generateGrid({
      method: "100_envelopes",
      target: 5_000_000,
      rows: 10,
      cols: 10,
    });
    expect(amounts.length).toBe(100);
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(5_000_000);
  });

  it("3_months: 90 celdas con patron", () => {
    const amounts = generateGrid({
      method: "3_months",
      target: 2_000_000,
      rows: 6,
      cols: 15,
    });
    expect(amounts.length).toBe(90);
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(2_000_000);
  });

  it("target muy pequeno: no genera negativos", () => {
    const amounts = generateGrid({
      method: "custom_grid",
      target: 100,
      rows: 2,
      cols: 2,
    });
    expect(amounts.length).toBe(4);
    for (const a of amounts) expect(a).toBeGreaterThanOrEqual(1);
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("lanza error si target <= 0", () => {
    expect(() => generateGrid({ method: "custom_grid", target: 0, rows: 5, cols: 5 })).toThrow(
      "Target amount must be > 0",
    );
  });

  it("lanza error si grid vacia", () => {
    expect(() => generateGrid({ method: "custom_grid", target: 1000, rows: 0, cols: 0 })).toThrow(
      "Grid must have at least 1 cell",
    );
  });
});

describe("rebalanceCells", () => {
  const makeCells = (amounts: number[], statuses: string[], locked: boolean[] = []) =>
    amounts.map((amount, i) => ({
      id: `c${i}`,
      amount,
      status: statuses[i] || "pending",
      isLocked: locked[i] || false,
    }));

  it("proportional: redistribuye exacto", () => {
    const result = rebalanceCells({
      cells: makeCells([100, 100, 100, 100], ["pending", "pending", "completed", "completed"]),
      totalTarget: 400,
      mode: "proportional",
      minAmount: 10,
      maxAmount: 500,
    });
    const pending = result.filter((r) => r.id === "c0" || r.id === "c1");
    const sumPending = pending.reduce((s, r) => s + r.amount, 0);
    expect(sumPending).toBe(200);
  });

  it("proportional: respeta max cuando es factible", () => {
    const result = rebalanceCells({
      cells: makeCells([100, 100, 100, 100], ["pending", "pending", "completed", "completed"]),
      totalTarget: 400,
      mode: "proportional",
      minAmount: 10,
      maxAmount: 150,
    });
    for (const r of result) {
      expect(r.amount).toBeLessThanOrEqual(150);
    }
    const pendingSum = result.filter((r) => r.id === "c0" || r.id === "c1").reduce((s, r) => s + r.amount, 0);
    expect(pendingSum).toBe(200);
  });

  it("proportional: ajusta max automaticamente si es imposible", () => {
    const result = rebalanceCells({
      cells: makeCells([100, 100, 100], ["pending", "pending", "completed"]),
      totalTarget: 400,
      mode: "proportional",
      minAmount: 10,
      maxAmount: 50,
    });
    for (const r of result) {
      expect(r.amount).toBeGreaterThanOrEqual(10);
    }
    const pendingSum = result.filter((r) => r.id === "c0" || r.id === "c1").reduce((s, r) => s + r.amount, 0);
    expect(pendingSum).toBe(300);
  });

  it("random: respeta min/max", () => {
    const result = rebalanceCells({
      cells: makeCells([100, 100, 100, 100], ["pending", "pending", "pending", "completed"]),
      totalTarget: 400,
      mode: "random",
      minAmount: 20,
      maxAmount: 200,
    });
    for (const r of result) {
      expect(r.amount).toBeGreaterThanOrEqual(20);
      expect(r.amount).toBeLessThanOrEqual(200);
    }
  });

  it("con celdas locked: no las toca", () => {
    const result = rebalanceCells({
      cells: makeCells([50, 50, 50], ["pending", "pending", "pending"], [true, false, false]),
      totalTarget: 150,
      mode: "proportional",
      minAmount: 10,
      maxAmount: 100,
    });
    expect(result.find((r) => r.id === "c0")?.amount).toBe(50);
  });

  it("remaining negativo: asigna minimo", () => {
    const result = rebalanceCells({
      cells: makeCells([100, 100], ["pending", "completed"]),
      totalTarget: 50,
      mode: "proportional",
      minAmount: 10,
      maxAmount: 100,
    });
    expect(result.find((r) => r.id === "c0")?.amount).toBeGreaterThanOrEqual(10);
  });

  it("sin celdas pendientes: devuelve igual", () => {
    const result = rebalanceCells({
      cells: makeCells([100, 100], ["completed", "completed"]),
      totalTarget: 200,
      mode: "proportional",
    });
    expect(result[0].amount).toBe(100);
    expect(result[1].amount).toBe(100);
  });
});
