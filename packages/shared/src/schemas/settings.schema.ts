import * as v from "valibot";

export const settingsUpdateSchema = v.object({
  language: v.pipe(v.string(), v.minLength(1, "El idioma es requerido")),
  reminderEnabled: v.boolean(),
  achievementNotifs: v.boolean(),
  weeklySummary: v.boolean(),
  locale: v.optional(v.string()),
});

export type SettingsUpdateInput = v.InferOutput<typeof settingsUpdateSchema>;

export const accountUpdateSchema = v.pipe(
  v.object({
    name: v.pipe(v.string(), v.minLength(1, "El nombre es requerido")),
    password: v.pipe(v.string(), v.minLength(1, "La contraseña es requerida")),
    newPassword: v.pipe(v.string(), v.minLength(1, "La nueva contraseña es requerida")),
    confirmPassword: v.pipe(v.string(), v.minLength(1, "La confirmación de la nueva contraseña es requerida")),
  }),
  v.forward(
    v.check(
      (input) => input.newPassword === input.confirmPassword,
      "Las contraseñas no coinciden", // Mensaje único de validación cruzada
    ),
    ["confirmPassword"], // Envía el error directo a este campo para tu formulario
  ),
);

export type AccountUpdateInput = v.InferOutput<typeof accountUpdateSchema>;
