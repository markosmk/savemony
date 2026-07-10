export class AppError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number = 500, code?: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Parsea errores crudos de proveedores de IA (Gemini, OpenRouter, etc.)
 * y devuelve un mensaje amigable + status HTTP apropiado.
 */
export function parseProviderError(err: unknown): AppError {
  const fallback = new AppError("Error de conexión con el servicio de IA. Intentá más tarde.", 500);

  if (!(err instanceof Error)) return fallback;

  // Gemini devuelve el error como JSON string en err.message
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(err.message);
  } catch {
    // no es JSON, usamos el mensaje directo
  }

  const geminiError = parsed?.error as Record<string, unknown> | undefined;
  const geminiCode = typeof geminiError?.code === "number" ? geminiError.code : undefined;
  const status = geminiCode ?? (err as { status?: number }).status ?? 500;
  const statusText = typeof geminiError?.status === "string" ? geminiError.status : "";
  const details = Array.isArray(geminiError?.details) ? geminiError.details : [];
  const reason = (details.find((d: Record<string, unknown>) => d.reason)?.reason as string) || "";

  // Mensajes amigables según el caso
  if (status === 400 || statusText === "INVALID_ARGUMENT" || reason === "API_KEY_INVALID") {
    return new AppError("La API Key no es válida. Verificá tus credenciales en Configuración.", 400, "INVALID_API_KEY");
  }

  if (status === 403 || statusText === "PERMISSION_DENIED" || reason === "API_KEY_BLOCKED") {
    return new AppError("Acceso denegado. Tu API Key no tiene permisos suficientes.", 403, "PERMISSION_DENIED");
  }

  if (status === 429 || statusText === "RESOURCE_EXHAUSTED") {
    return new AppError("Límite de solicitudes alcanzado. Intentá más tarde.", 429, "RATE_LIMITED");
  }

  if (status >= 500) {
    return new AppError("El servicio de IA no responde. Intentá más tarde.", 502, "PROVIDER_UNAVAILABLE");
  }

  // Fallback con el mensaje original si es legible
  const rawMessage = typeof geminiError?.message === "string" ? geminiError.message : err.message;
  return new AppError(
    rawMessage.length > 120 ? "Error del servicio de IA. Revisá tu configuración." : rawMessage,
    typeof status === "number" ? status : 500,
  );
}
