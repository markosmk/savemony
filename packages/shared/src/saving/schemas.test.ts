/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation > */
import { safeParse } from "valibot";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FrequencyType } from "../types";
import { PLAN_TEMPLATES } from "./calculator";
import { type PlanCreationFormValues, planCreationSchema, validatePlanCreation } from "./schemas";

function makeStructuredPayload(overrides: Partial<PlanCreationFormValues> = {}): PlanCreationFormValues {
  return {
    mode: "structured" as any,
    name: "Vacaciones",
    goalAmount: 1_500_000,
    endDate: "2027-01-15",
    frequencyType: "WEEKLY" as FrequencyType,
    ...overrides,
  };
}

function makeFlexiblePayload(overrides: Partial<PlanCreationFormValues> = {}): PlanCreationFormValues {
  return {
    mode: "flexible",
    isFlexible: true,
    name: "Fondo libre",
    ...overrides,
  } as any;
}

function makeTemplatePayload(overrides: Partial<PlanCreationFormValues> = {}): PlanCreationFormValues {
  return {
    mode: "template" as any,
    templateId: "vacations",
    name: "Vacaciones",
    goalAmount: 1_500_000,
    endDate: "2027-01-15",
    frequencyType: "WEEKLY" as FrequencyType,
    ...overrides,
  };
}

describe("StructuredPlan", () => {
  it("acepta payload válido completo", () => {
    const payload = makeStructuredPayload();
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(true);
  });

  it("acepta con campos opcionales", () => {
    const payload = makeStructuredPayload({
      customDays: [1, 3, 5],
      quickAmounts: [10_000, 50_000],
      suggestedQuota: 80_000,
    });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(true);
  });

  it("rechaza sin name", () => {
    const payload = makeStructuredPayload({ name: undefined });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza name vacío después de trim", () => {
    const payload = makeStructuredPayload({ name: "   " });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza name mayor a 100 caracteres", () => {
    const payload = makeStructuredPayload({ name: "a".repeat(101) });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza goalAmount = 0", () => {
    const payload = makeStructuredPayload({ goalAmount: 0 });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza goalAmount negativo", () => {
    const payload = makeStructuredPayload({ goalAmount: -1000 });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza endDate inválido", () => {
    const payload = makeStructuredPayload({ endDate: "15-07-2026" });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza endDate vacío", () => {
    const payload = makeStructuredPayload({ endDate: "" });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza frequencyType inválido", () => {
    const payload = makeStructuredPayload({ frequencyType: "INVALID" as FrequencyType });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza customDays con valores fuera de rango", () => {
    const payload = makeStructuredPayload({
      frequencyType: "CUSTOM_DAYS",
      customDays: [0, 7], // 7 no es válido (0-6)
    });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza customDays con valores negativos", () => {
    const payload = makeStructuredPayload({
      frequencyType: "CUSTOM_DAYS",
      customDays: [-1, 1],
    });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza quickAmounts con 0", () => {
    const payload = makeStructuredPayload({ quickAmounts: [0, 100] });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza quickAmounts con negativo", () => {
    const payload = makeStructuredPayload({ quickAmounts: [-100, 100] });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });
});

describe("FlexiblePlan", () => {
  it("acepta payload mínimo", () => {
    const payload = makeFlexiblePayload();
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(true);
  });

  it("acepta con campos base opcionales", () => {
    const payload = makeFlexiblePayload({
      goalAmount: 500_000,
      endDate: "2027-01-15",
      frequencyType: "WEEKLY",
    });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(true);
  });

  it("rechaza sin isFlexible", () => {
    const payload = { ...makeFlexiblePayload(), isFlexible: undefined };
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza isFlexible = false", () => {
    const payload = makeFlexiblePayload({ isFlexible: false });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza sin name", () => {
    const payload = makeFlexiblePayload({ name: undefined });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza name vacío", () => {
    const payload = makeFlexiblePayload({ name: "" });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });
});

describe("TemplatePlan", () => {
  it("acepta payload válido", () => {
    const payload = makeTemplatePayload();
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(true);
  });

  it("rechaza sin templateId", () => {
    const payload = makeTemplatePayload({ templateId: undefined });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza templateId vacío", () => {
    const payload = makeTemplatePayload({ templateId: "" });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza sin name", () => {
    const payload = makeTemplatePayload({ name: undefined });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza sin goalAmount", () => {
    const payload = makeTemplatePayload({ goalAmount: undefined });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });
});

describe("Payload real del frontend", () => {
  it("acepta payload de plantilla Vacaciones", () => {
    const template = PLAN_TEMPLATES[0];

    const payload: PlanCreationFormValues = {
      mode: "structured",
      name: template?.name,
      goalAmount: template?.defaultGoalAmount,
      endDate: "2027-01-15",
      frequencyType: "WEEKLY",
      suggestedQuota: 80_000,
    };

    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(true);
  });

  it("rechaza structured sin endDate", () => {
    const payload = makeStructuredPayload({ endDate: "" });
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza structured sin goalAmount", () => {
    const payload = { ...makeStructuredPayload(), goalAmount: undefined };
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });

  it("rechaza structured sin frequencyType", () => {
    const payload = { ...makeStructuredPayload(), frequencyType: undefined };
    const result = safeParse(planCreationSchema, payload);
    expect(result.success).toBe(false);
  });
});

describe("validatePlanCreation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("structured válido → null", () => {
    const data = makeStructuredPayload({ endDate: "2027-01-15" });
    expect(validatePlanCreation(data)).toBeNull();
  });

  it("structured sin goalAmount → error", () => {
    const data = makeStructuredPayload({ goalAmount: undefined });
    expect(validatePlanCreation(data)).toBe("Debes definir una meta de ahorro");
  });

  it("structured con goalAmount = 0 → error", () => {
    const data = makeStructuredPayload({ goalAmount: 0 });
    expect(validatePlanCreation(data)).toBe("Debes definir una meta de ahorro");
  });

  it("structured sin endDate → error", () => {
    const data = makeStructuredPayload({ endDate: undefined });
    expect(validatePlanCreation(data)).toBe("Fecha límite requerida");
  });

  it("structured con endDate pasada → error", () => {
    const data = makeStructuredPayload({ endDate: "2026-07-14" });
    expect(validatePlanCreation(data)).toBe("La fecha límite debe ser posterior a hoy");
  });

  it("structured con endDate = hoy → error", () => {
    const data = makeStructuredPayload({ endDate: "2026-07-15" });
    expect(validatePlanCreation(data)).toBe("La fecha límite debe ser posterior a hoy");
  });

  it("structured CUSTOM_DAYS sin customDays → error", () => {
    const data = makeStructuredPayload({
      frequencyType: "CUSTOM_DAYS",
      customDays: undefined,
    });
    expect(validatePlanCreation(data)).toBe("Selecciona al menos un día de la semana");
  });

  it("structured CUSTOM_DAYS con customDays vacío → error", () => {
    const data = makeStructuredPayload({
      frequencyType: "CUSTOM_DAYS",
      customDays: [],
    });
    expect(validatePlanCreation(data)).toBe("Selecciona al menos un día de la semana");
  });

  it("structured CUSTOM_DAYS con customDays válido → null", () => {
    const data = makeStructuredPayload({
      frequencyType: "CUSTOM_DAYS",
      customDays: [1, 3, 5],
    });
    expect(validatePlanCreation(data)).toBeNull();
  });

  it("template sin templateId → error", () => {
    const data = makeTemplatePayload({ templateId: undefined });
    expect(validatePlanCreation(data)).toBe("Selecciona una plantilla");
  });

  it("template válido → null", () => {
    const data = makeTemplatePayload();
    expect(validatePlanCreation(data)).toBeNull();
  });

  it("flexible válido → null", () => {
    const data = makeFlexiblePayload();
    expect(validatePlanCreation(data)).toBeNull();
  });

  it("flexible con campos opcionales → null", () => {
    const data = makeFlexiblePayload({
      goalAmount: 500_000,
      endDate: "2027-01-15",
    });
    expect(validatePlanCreation(data)).toBeNull();
  });
});
