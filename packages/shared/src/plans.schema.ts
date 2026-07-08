import * as v from "valibot";

export const createPlanSchema = v.pipe(
  v.object({
    title: v.pipe(v.string(), v.minLength(3)),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    targetAmount: v.pipe(v.number(), v.minValue(1)),
    gridRows: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
    gridCols: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
    currency: v.optional(v.string()),
    category: v.optional(v.string()),
    deadline: v.optional(v.pipe(v.string(), v.regex(/\d{4}-\d{2}-\d{2}/, "Fecha inválida"))),
    method: v.optional(v.picklist(["custom_grid", "52_weeks", "100_envelopes", "365_days", "no_spend", "rounding"])),
    minAmount: v.optional(v.number()),
    maxAmount: v.optional(v.number()),
    frequency: v.optional(v.picklist(["daily", "weekly"])),
    rebalanceMode: v.optional(v.picklist(["proportional", "random"])),
  }),
  v.check((input) => {
    const rows = input.gridRows ?? 6;
    const cols = input.gridCols ?? 7;
    const cells = rows * cols;

    if (input.method === "52_weeks" && cells !== 52) return false;
    if (input.method === "100_envelopes" && cells !== 100) return false;
    if (input.method === "365_days" && cells !== 365) return false;
    return true;
  }, "Las dimensiones del grid no coinciden con el método de ahorro elegido"),
);

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

export const editCellSchema = v.object({
  planId: v.pipe(v.string(), v.minLength(1)),
  newAmount: v.pipe(v.number(), v.minValue(1)),
  rebalanceMode: v.optional(v.picklist(["proportional", "random"])),
});

export const timelineEntrySchema = v.object({
  type: v.picklist(["note", "deposit", "withdraw", "adjust", "milestone"]),
  amount: v.optional(v.pipe(v.number(), v.minValue(1))),
  description: v.optional(v.string()),
});
