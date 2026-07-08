import * as v from "valibot";

export const registerSchema = v.object({
  email: v.pipe(v.string(), v.email("Formato de email inválido")),
  password: v.pipe(v.string(), v.minLength(4, "Mínimo 4 caracteres")),
  name: v.optional(v.string()),
  referredBy: v.optional(v.string()),
});
export type RegisterInput = v.InferOutput<typeof registerSchema>;

export const loginSchema = v.object({
  email: v.pipe(v.string(), v.email("Debe ingresar un email corporativo válido.")),
  password: v.pipe(v.string(), v.minLength(4, "La contraseña debe tener al menos 4 caracteres.")),
});
export type LoginInput = v.InferOutput<typeof loginSchema>;

export const sessionRevokeSchema = v.object({
  sessionId: v.pipe(v.string(), v.minLength(1, "ID de sesión requerido.")),
});
export type SessionRevokeInput = v.InferOutput<typeof sessionRevokeSchema>;

export const confirmEmailSchema = v.object({ token: v.string() });
export const forgotPasswordSchema = v.object({ email: v.pipe(v.string(), v.email()) });
export const resetPasswordSchema = v.object({
  token: v.string(),
  newPassword: v.pipe(v.string(), v.minLength(6)),
});

export const profileUpdateSchema = v.object({
  name: v.pipe(v.string(), v.minLength(4, "Mínimo 4 caracteres.")),
  email: v.pipe(v.string(), v.email()),
});
export type ProfileUpdateInput = v.InferOutput<typeof profileUpdateSchema>;

export const profileUpdatePasswordSchema = v.pipe(
  v.object({
    currentPassword: v.pipe(v.string(), v.minLength(4, "Mínimo 4 caracteres.")),
    newPassword: v.pipe(v.string(), v.minLength(4, "Mínimo 4 caracteres.")),
    confirmNewPassword: v.pipe(v.string(), v.minLength(4, "Mínimo 4 caracteres.")),
  }),
  v.forward(
    v.partialCheck(
      [["newPassword"], ["confirmNewPassword"]],
      (input) => input.newPassword === input.confirmNewPassword,
      "Las contraseñas no coinciden.",
    ),
    ["confirmNewPassword"],
  ),
);

export type ProfileUpdatePasswordInput = v.InferOutput<typeof profileUpdatePasswordSchema>;

export const profileSchema = v.object({
  name: v.optional(v.pipe(v.string(), v.minLength(4, "Mínimo 4 caracteres."))),
  email: v.optional(v.pipe(v.string(), v.email())),
  currentPassword: v.optional(v.pipe(v.string(), v.minLength(4, "Mínimo 4 caracteres."))),
  newPassword: v.optional(v.pipe(v.string(), v.minLength(4, "Mínimo 4 caracteres."))),
});

export type ProfileInput = v.InferOutput<typeof profileSchema>;
