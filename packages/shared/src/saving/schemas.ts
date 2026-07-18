import * as v from "valibot";

export const FREQUENCY_TYPES = ["DAILY", "WEEKDAYS", "WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM_DAYS"] as const;

const nameFieldSchema = v.pipe(
  v.string(),
  v.transform((s) => s.trim()),
  v.minLength(1, "El nombre es obligatorio"),
  v.maxLength(100, "Máximo 100 caracteres"),
);

const basePlanSchema = v.object({
  goalAmount: v.pipe(v.number(), v.minValue(1, "La meta debe ser mayor a 0")),
  endDate: v.pipe(v.string(), v.regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, "Fecha límite inválida")),
  frequencyType: v.union(FREQUENCY_TYPES.map((t) => v.literal(t))),
  customDays: v.optional(v.array(v.pipe(v.number(), v.minValue(0), v.maxValue(6)))),
  quickAmounts: v.optional(v.array(v.pipe(v.number(), v.minValue(1)))),
  suggestedQuota: v.optional(v.number()),
});

const StructuredPlan = v.object({
  mode: v.literal("structured"),
  name: nameFieldSchema,
  ...basePlanSchema.entries,
});

const FlexiblePlan = v.object({
  mode: v.literal("flexible"),
  // isFlexible: v.literal(true),
  name: nameFieldSchema,
  ...v.partial(basePlanSchema).entries,
});

const TemplatePlan = v.object({
  mode: v.literal("template"),
  templateId: v.pipe(v.string(), v.minLength(1, "El ID de plantilla es requerido")),
  name: nameFieldSchema,
  ...basePlanSchema.entries,
});

export const planCreationSchema = v.variant("mode", [StructuredPlan, FlexiblePlan, TemplatePlan]);

// 1. tipo estricto de Valibot (Unión de TS)
export type StrictPlanValues = v.InferInput<typeof planCreationSchema>;

// 2. tipo "Form" que permite todos los campos posibles en el ciclo de vida del formulario
export type PlanCreationFormValues = StrictPlanValues & {
  templateId?: string;
  // isFlexible?: boolean;
};

// Refinamiento cruzado: si mode es 'structured', estos campos son obligatorios
export function validatePlanCreation(data: PlanCreationFormValues): string | null {
  if (data.mode === "structured") {
    if (!data.goalAmount || data.goalAmount <= 0) return "Debes definir una meta de ahorro";
    if (!data.endDate) return "Fecha límite requerida";
    if (!data.frequencyType) return "Selecciona una frecuencia";
    if (data.frequencyType === "CUSTOM_DAYS" && (!data.customDays || data.customDays.length === 0)) {
      return "Selecciona al menos un día de la semana";
    }
    // const today = todayUTC();
    const today = new Date().toISOString().split("T")[0];
    if (data.endDate <= today) return "La fecha límite debe ser posterior a hoy";
  }

  if (data.mode === "template" && !data.templateId) {
    return "Selecciona una plantilla";
  }

  return null;
}

export const updatePlanSchema = v.object({
  name: v.optional(v.string()),
  goalAmount: v.optional(v.number()),
  endDate: v.optional(v.string()),
  frequencyType: v.optional(v.string()),
  customDays: v.optional(v.array(v.number())),
  suggestedQuota: v.optional(v.number()),
  quickAmounts: v.optional(v.array(v.number())),
});

export type UpdatePlanPayload = v.InferInput<typeof updatePlanSchema>;

/**
 * Schemas for entries
 */

export const updateEntrySchema = v.object({
  date: v.pipe(v.string(), v.isoDate()),
  amount: v.number(),
  // type: v.picklist(["deposit", "withdrawal"]),
  // reason: v.optional(v.string()),
});

export type UpdateEntryPayload = v.InferInput<typeof updateEntrySchema>;

export const depositSchema = v.object({
  amount: v.pipe(v.number(), v.minValue(1)),
  date: v.pipe(v.string(), v.isoDate()), // isoDate... yyy-mm-dd
});
export type DepositPayload = v.InferInput<typeof depositSchema>;

export const withdrawalSchema = v.object({
  amount: v.pipe(v.number(), v.minValue(1)),
  reason: v.pipe(v.string(), v.minLength(1)),
});
export type WithdrawalPayload = v.InferInput<typeof withdrawalSchema>;

export const amountSchema = v.object({ amount: v.pipe(v.number(), v.minValue(1)) });
export type AmountPayload = v.InferInput<typeof amountSchema>;
