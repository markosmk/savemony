import { createPlanSchema } from "@savemony/shared";
import { safeParse } from "valibot";
import { describe, expect, it } from "vitest";

describe("createPlanSchema con payload real del frontend", () => {
  it("acepta payload de plantilla Fondo Educación", () => {
    const payload = {
      title: "Fondo Educación",
      description: "Invierte en tu futuro",
      icon: "🎓",
      targetAmount: 5000000,
      gridRows: 10,
      gridCols: 10,
      currency: "ARS",
      category: "education",
      method: "custom_grid",
      rebalanceMode: "proportional",
      frequency: "weekly",
      minAmount: 0,
      maxAmount: 0,
      preferredAmounts: [],
      amountMode: "rounding",
      roundingMultiple: 25000,
    };

    const result = safeParse(createPlanSchema, payload);
    expect(result.success).toBe(true);
  });

  it("rechaza grid > 100 celdas", () => {
    const payload = {
      title: "Test",
      targetAmount: 1000,
      gridRows: 20,
      gridCols: 10, // 200 celdas
      method: "custom_grid",
    };

    const result = safeParse(createPlanSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza 52_weeks con grid incorrecto", () => {
    const payload = {
      title: "Test",
      targetAmount: 1000,
      gridRows: 7,
      gridCols: 8, // 56, no 52
      method: "52_weeks",
    };

    const result = safeParse(createPlanSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza preferredAmounts que no alcanzan el target", () => {
    const payload = {
      title: "Test",
      targetAmount: 100000,
      gridRows: 10,
      gridCols: 10, // 100 celdas
      method: "custom_grid",
      preferredAmounts: [100, 200], // max 200 * 100 = 20_000 < 100_000
    };

    const result = safeParse(createPlanSchema, payload);
    expect(result.success).toBe(false);
  });
});
