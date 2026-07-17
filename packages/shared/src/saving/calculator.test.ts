import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addDaysUTC as addDays,
  diffInDaysUTC as diffInDays,
  getDayOfWeekUTC as getDayOfWeek,
  getEndDateFromMonths,
} from "../utils/date-helpers";
import { adjustPlanByQuota, calculatePlanSummary, calculateSuggestedQuota, getDepositDates } from "./calculator";
import type { CalculationInput } from "./types";

// Mock todayUTC para tests determinísticos
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-15T12:00:00.000Z")); // Hoy = 2026-07-15
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Helpers de fecha", () => {
  it("addDays suma días correctamente", () => {
    expect(addDays("2026-07-15", 1)).toBe("2026-07-16");
    expect(addDays("2026-07-15", 10)).toBe("2026-07-25");
    expect(addDays("2026-07-15", -1)).toBe("2026-07-14");
  });

  it("getDayOfWeek devuelve día correcto", () => {
    expect(getDayOfWeek("2026-07-15")).toBe(3); // Miércoles
    expect(getDayOfWeek("2026-07-12")).toBe(0); // Domingo
  });

  it("diffInDays calcula diferencia", () => {
    expect(diffInDays("2026-07-15", "2026-07-20")).toBe(5);
    expect(diffInDays("2026-07-15", "2026-07-15")).toBe(0);
  });
});

describe("getDepositDates", () => {
  it("DAILY: devuelve todos los días desde hoy", () => {
    const input: CalculationInput = {
      goalAmount: 100_000,
      endDate: "2026-07-20",
      frequencyType: "DAILY",
    };
    const dates = getDepositDates(input);
    expect(dates).toHaveLength(6); // 15, 16, 17, 18, 19, 20
    expect(dates[0]).toBe("2026-07-15");
    expect(dates[5]).toBe("2026-07-20");
  });

  it("WEEKDAYS: excluye sábados y domingos", () => {
    // Hoy = 2026-07-15 (Miércoles)
    const input: CalculationInput = {
      goalAmount: 100_000,
      endDate: "2026-07-19", // Domingo
      frequencyType: "WEEKDAYS",
    };
    const dates = getDepositDates(input);
    expect(dates).toHaveLength(3); // Mié, Jue, Vie (15, 16, 17)
    expect(dates).toEqual(["2026-07-15", "2026-07-16", "2026-07-17"]);
  });

  it("WEEKLY: cada 7 días desde hoy", () => {
    const input: CalculationInput = {
      goalAmount: 300_000,
      endDate: "2026-08-15",
      frequencyType: "WEEKLY",
    };
    const dates = getDepositDates(input);
    // Hoy = Miércoles 15 Jul
    // 15 Jul, 22 Jul, 29 Jul, 5 Ago, 12 Ago = 5 fechas
    expect(dates).toHaveLength(5);
    expect(dates[0]).toBe("2026-07-15");
    expect(dates[1]).toBe("2026-07-22");
  });

  it("BIWEEKLY: cada 14 días", () => {
    const input: CalculationInput = {
      goalAmount: 400_000,
      endDate: "2026-09-15",
      frequencyType: "BIWEEKLY",
    };
    const dates = getDepositDates(input);
    expect(dates[0]).toBe("2026-07-15");
    expect(dates[1]).toBe("2026-07-29");
    expect(dates[2]).toBe("2026-08-12");
  });

  it("MONTHLY: mismo día del mes", () => {
    const input: CalculationInput = {
      goalAmount: 600_000,
      endDate: "2026-12-15",
      frequencyType: "MONTHLY",
    };
    const dates = getDepositDates(input);
    // 15 Jul, 15 Ago, 15 Sep, 15 Oct, 15 Nov, 15 Dic = 6 fechas
    expect(dates).toHaveLength(6);
    expect(dates).toEqual(["2026-07-15", "2026-08-15", "2026-09-15", "2026-10-15", "2026-11-15", "2026-12-15"]);
  });

  it("CUSTOM_DAYS: solo los días seleccionados", () => {
    // Hoy = 2026-07-15 (Miércoles = 3)
    const input: CalculationInput = {
      goalAmount: 100_000,
      endDate: "2026-07-19", // Domingo
      frequencyType: "CUSTOM_DAYS",
      customDays: [1, 3, 5], // Lun, Mie, Vie
    };
    const dates = getDepositDates(input);
    // Desde Mié 15 hasta Dom 19: solo Mié 15 y Vie 17
    expect(dates).toHaveLength(2);
    expect(dates).toEqual(["2026-07-15", "2026-07-17"]);
  });
});

describe("calculateSuggestedQuota", () => {
  it("calcula cuota diaria y redondea al alza", () => {
    const input: CalculationInput = {
      goalAmount: 100_000,
      endDate: "2026-07-24", // 10 días desde 15 Jul
      frequencyType: "DAILY",
    };
    expect(calculateSuggestedQuota(input)).toBe(10_000);
  });

  it("redondea correctamente cuando no es exacto", () => {
    const input: CalculationInput = {
      goalAmount: 115_400,
      endDate: "2026-07-24", // 10 días desde 15 Jul
      frequencyType: "DAILY",
    };
    expect(calculateSuggestedQuota(input)).toBe(12_000);
  });
});

describe("calculatePlanSummary", () => {
  it("devuelve resumen completo para plan semanal", () => {
    const input: CalculationInput = {
      goalAmount: 400_000,
      endDate: "2026-08-15",
      frequencyType: "WEEKLY",
    };
    const summary = calculatePlanSummary(input);
    expect(summary.numberOfPeriods).toBe(5);
    expect(summary.suggestedQuota).toBe(80_000);
    expect(summary.totalAmount).toBe(400_000);
  });
});

describe("adjustPlanByQuota", () => {
  const baseInput: CalculationInput = {
    goalAmount: 400_000,
    endDate: "2026-08-15",
    frequencyType: "WEEKLY",
  };

  it("adjust-goal: mantiene períodos, baja la meta", () => {
    const result = adjustPlanByQuota(baseInput, 50_000, "adjust-goal");
    expect(result.adjustedGoalAmount).toBe(250_000);
    expect(result.adjustedEndDate).toBe("2026-08-15");
    expect(result.adjustedPeriods).toBe(5);
  });

  it("adjust-date: mantiene meta, retrasa fecha", () => {
    const result = adjustPlanByQuota(baseInput, 50_000, "adjust-date");
    expect(result.adjustedGoalAmount).toBe(400_000);
    expect(result.adjustedPeriods).toBe(8);
    expect(result.adjustedEndDate).toBe("2026-09-02");
  });

  it("adjust-date: cuota mayor acorta la fecha", () => {
    const result = adjustPlanByQuota(baseInput, 200_000, "adjust-date");
    expect(result.adjustedPeriods).toBe(2);
    expect(result.adjustedEndDate).toBe("2026-07-22");
  });

  it("lanza error si cuota <= 0", () => {
    expect(() => adjustPlanByQuota(baseInput, 0, "adjust-goal")).toThrow("La cuota debe ser mayor a cero");
  });
});

describe("getEndDateFromMonths", () => {
  it("suma meses correctamente desde hoy", () => {
    // Hoy mockeado = 2026-07-15
    expect(getEndDateFromMonths(6)).toBe("2027-01-15");
    expect(getEndDateFromMonths(1)).toBe("2026-08-15");
  });
});
