import * as v from "valibot";

export const settingsUpdateSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "El nombre es requerido")),
  currency: v.pipe(v.string(), v.minLength(1, "La moneda es requerida")),
  language: v.pipe(v.string(), v.minLength(1, "El idioma es requerido")),
  defaultMethod: v.pipe(v.string(), v.minLength(1, "El método es requerido")),
  reminderEnabled: v.boolean(),
  achievementNotifs: v.boolean(),
  weeklySummary: v.boolean(),
	locale: v.optional(v.string()),
	image: v.optional(v.string()),
	onboardingCompleted: v.optional(v.boolean()),
});

export type SettingsUpdateInput = v.InferOutput<typeof settingsUpdateSchema>;
