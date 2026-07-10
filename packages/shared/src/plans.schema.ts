import * as v from "valibot";

export const createPlanSchema = v.pipe(
  v.object({
    title: v.pipe(v.string("El título debe ser texto."), v.minLength(3, "El título debe tener al menos 3 caracteres.")),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    targetAmount: v.pipe(
      v.number("El monto debe ser un número."),
      v.minValue(1, "El monto objetivo debe ser mayor a 0."),
    ),
    gridRows: v.optional(
      v.pipe(
        v.number("Filas debe ser un número."),
        v.integer("Filas debe ser entero."),
        v.minValue(2, "Mínimo 2 filas."),
        v.maxValue(20, "Máximo 20 filas."),
      ),
    ),
    gridCols: v.optional(
      v.pipe(
        v.number("Columnas debe ser un número."),
        v.integer("Columnas debe ser entero."),
        v.minValue(2, "Mínimo 2 columnas."),
        v.maxValue(20, "Máximo 20 columnas."),
      ),
    ),
    currency: v.optional(v.string()),
    category: v.optional(v.string()),
    amountMode: v.optional(v.picklist(["preferred", "rounding", "range"], "Modo de monto inválido.")),
    preferredAmounts: v.optional(v.array(v.pipe(v.number(), v.minValue(1, "El monto preferido debe ser mayor a 0.")))),
    roundingMultiple: v.optional(v.pipe(v.number(), v.minValue(1, "El múltiplo de redondeo debe ser mayor a 0."))),
    deadline: v.optional(
      v.union([
        v.null(),
        v.literal(""),
        v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha límite inválida (debe ser YYYY-MM-DD)")),
      ]),
    ),
    method: v.optional(
      v.picklist(["custom_grid", "52_weeks", "100_envelopes", "3_months", "no_spend"], "Método de ahorro inválido."),
    ),
    minAmount: v.optional(v.number()),
    maxAmount: v.optional(v.number()),
    frequency: v.optional(v.picklist(["daily", "weekly", "weekdays", "random"], "Frecuencia inválida.")),
    rebalanceMode: v.optional(v.picklist(["proportional", "random"], "Modo de rebalanceo inválido.")),
  }),

  // ── Check 1: Máximo 100 celdas (hard limit D1) ──
  v.forward(
    v.check((input) => {
      const cells = (input.gridRows ?? 6) * (input.gridCols ?? 7);
      return cells <= 100;
    }, "La grilla no puede tener más de 100 celdas."),
    ["gridRows"],
  ),
  // Check para gridCols (misma lógica, diferente path)
  v.forward(
    v.check((input) => {
      const cells = (input.gridRows ?? 6) * (input.gridCols ?? 7);
      return cells <= 100;
    }, "La grilla no puede tener más de 100 celdas."),
    ["gridCols"],
  ),

  // ── Check 2: Mínimo 4 celdas ──
  v.forward(
    v.check((input) => {
      const cells = (input.gridRows ?? 6) * (input.gridCols ?? 7);
      return cells >= 4;
    }, "La grilla debe tener al menos 4 celdas (mínimo 2×2)."),
    ["gridRows"],
  ),

  // ── Check 2b: Mínimo 4 celdas (para gridCols) ──
  v.forward(
    v.check((input) => {
      const cells = (input.gridRows ?? 6) * (input.gridCols ?? 7);
      return cells >= 4;
    }, "La grilla debe tener al menos 4 celdas (mínimo 2×2)."),
    ["gridCols"],
  ),

  // ── Check 3: Métodos clásicos requieren dimensiones exactas ──
  v.forward(
    v.check((input) => {
      const cells = (input.gridRows ?? 6) * (input.gridCols ?? 7);
      if (input.method === "52_weeks") return cells === 52;
      if (input.method === "100_envelopes") return cells === 100;
      if (input.method === "3_months") return cells === 90;
      return true;
    }, "Las dimensiones no coinciden con el método clásico seleccionado."),
    ["gridRows"],
  ),

  v.forward(
    v.check((input) => {
      const cells = (input.gridRows ?? 6) * (input.gridCols ?? 7);
      if (input.method === "52_weeks") return cells === 52;
      if (input.method === "100_envelopes") return cells === 100;
      if (input.method === "3_months") return cells === 90;
      return true;
    }, "Las dimensiones no coinciden con el método clásico seleccionado."),
    ["gridCols"],
  ),

  // ── Check 4: Si hay montos preferidos, deben alcanzar la meta ──
  v.forward(
    v.check((input) => {
      if (!input.preferredAmounts || input.preferredAmounts.length === 0) return true;

      const cells = (input.gridRows ?? 6) * (input.gridCols ?? 7);
      const maxPerCell = Math.max(...input.preferredAmounts);
      return maxPerCell * cells >= input.targetAmount;
    }, "Tus montos seleccionados no alcanzan la meta con esta cantidad de celdas. Agregá montos más altos o aumentá la grilla (máx 100 celdas)."),
    ["preferredAmounts"],
  ),

  // ── Check 5: minAmount ≤ maxAmount ──
  v.forward(
    v.check((input) => {
      if (input.minAmount == null || input.maxAmount == null) return true;
      return input.minAmount <= input.maxAmount;
    }, "El monto mínimo no puede ser mayor al máximo."),
    ["minAmount"],
  ),

  v.forward(
    v.check((input) => {
      if (input.minAmount == null || input.maxAmount == null) return true;
      return input.minAmount <= input.maxAmount;
    }, "El monto mínimo no puede ser mayor al máximo."),
    ["maxAmount"],
  ),

  // ── Check 6: Si hay preferidos, min/max deben coincidir (consistencia) ──
  v.forward(
    v.check((input) => {
      if (!input.preferredAmounts || input.preferredAmounts.length === 0) return true;
      const expectedMin = Math.min(...input.preferredAmounts);
      const expectedMax = Math.max(...input.preferredAmounts);
      // Permitimos undefined (se calcula solo), pero si mandan valor, debe coincidir
      if (input.minAmount != null && input.minAmount !== expectedMin) return false;
      if (input.maxAmount != null && input.maxAmount !== expectedMax) return false;
      return true;
    }, "Los montos mínimo y máximo deben coincidir con el rango de tus montos preferidos."),
    ["minAmount"],
  ),

  v.check((input) => {
    const cells = (input.gridRows ?? 6) * (input.gridCols ?? 7);
    const min = input.minAmount ?? 0;
    const max = input.maxAmount ?? 0;
    if (min > 0 && min * cells > input.targetAmount) return false;
    if (max > 0 && max * cells < input.targetAmount) return false;
    return true;
  }, "La configuración del plan no es válida. Revisá las dimensiones y montos. La combinación de celdas, montos y meta no es matemáticamente posible."),
);
export type CreatePlanPayload = v.InferInput<typeof createPlanSchema>;

export const updatePlanSchema = v.object({
  title: v.optional(v.pipe(v.string(), v.minLength(3))),
  description: v.optional(v.string()),
  icon: v.optional(v.string()),
  status: v.optional(v.picklist(["active", "paused", "completed"])),
  targetAmount: v.optional(v.pipe(v.number(), v.minValue(1))),
  deadline: v.optional(v.string()),
  rebalanceMode: v.optional(v.picklist(["proportional", "random"])),
  category: v.optional(v.string()),
  archived: v.optional(v.boolean()),
});
export type UpdatePlanPayload = v.InferInput<typeof updatePlanSchema>;

export const editCellSchema = v.object({
  planId: v.pipe(v.string(), v.minLength(1)),
  newAmount: v.pipe(v.number(), v.minValue(1)),
  rebalanceMode: v.optional(v.picklist(["proportional", "random"])),
});

export const timelineEntrySchema = v.object({
  type: v.picklist(["note", "deposit", "withdraw", "adjust", "milestone"]),
  amount: v.optional(v.pipe(v.number(), v.minValue(1))),
  description: v.optional(v.string()),
  date: v.optional(v.string()),
});
